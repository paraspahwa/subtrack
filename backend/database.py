"""
Database configuration and models for SubTrack — Subscription Tracker
"""

import os
import logging
from datetime import datetime
from urllib.parse import quote, urlsplit, urlunsplit
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, JSON, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from werkzeug.security import generate_password_hash, check_password_hash


logger = logging.getLogger(__name__)


def _normalize_database_url(url: str) -> str:
    """Percent-encode raw password chars in DB URL userinfo when needed."""
    if not url or not url.startswith("postgresql://"):
        return url

    parts = urlsplit(url)
    netloc = parts.netloc
    if "@" not in netloc:
        return url

    userinfo, hostinfo = netloc.rsplit("@", 1)
    if ":" not in userinfo:
        return url

    username, password = userinfo.split(":", 1)
    encoded_password = quote(password, safe="")
    if encoded_password == password:
        return url

    fixed_netloc = f"{username}:{encoded_password}@{hostinfo}"
    return urlunsplit((parts.scheme, fixed_netloc, parts.path, parts.query, parts.fragment))

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost/subtrack"
)
DATABASE_URL = _normalize_database_url(DATABASE_URL)

# Supabase uses a connection pooler (Transaction mode on port 6543).
# SQLAlchemy requires ?pgbouncer=true to disable prepared statements
# when using Supabase's Transaction pooler.
# Session mode (port 5432) works without this flag.
_connect_args = {}
if "supabase.co" in DATABASE_URL:
    _connect_args = {"options": "-c statement_timeout=30000"}

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,       # reconnect if connection dropped
    pool_size=5,
    max_overflow=10,
    connect_args=_connect_args,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

FREE_SUBSCRIPTION_LIMIT = 10


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)

    # App plan
    plan = Column(String, default="free")  # 'free', 'pro'
    home_currency = Column(String, default="USD")
    subscription_active = Column(Boolean, default=True)
    subscription_end_date = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Password reset
    password_reset_token = Column(String, nullable=True, index=True)
    password_reset_expires = Column(DateTime, nullable=True)
    password_reset_used_at = Column(DateTime, nullable=True)

    # Relationships
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")
    mailbox_connections = relationship("MailboxConnection", back_populates="user", cascade="all, delete-orphan")
    discovery_candidates = relationship("DiscoveryCandidate", back_populates="user", cascade="all, delete-orphan")

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def can_add_subscription(self, current_count: int) -> bool:
        if self.plan != "free":
            return True
        return current_count < FREE_SUBSCRIPTION_LIMIT


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    name = Column(String, nullable=False)
    category = Column(String, nullable=False, default="Other")  # Entertainment, Productivity, Health, etc.
    amount = Column(Float, nullable=False)
    last_amount = Column(Float, nullable=True)
    amount_change_pct = Column(Float, nullable=True)
    amount_changed_at = Column(DateTime, nullable=True)
    amount_alert_dismissed = Column(Boolean, nullable=False, default=False)
    currency = Column(String, default="USD")
    billing_cycle = Column(String, nullable=False, default="monthly")  # monthly, yearly, weekly
    next_billing_date = Column(DateTime, nullable=False)
    start_date = Column(DateTime, default=datetime.utcnow)

    # Status
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)

    # Usage rating: 1 = never use, 5 = use daily. Drives waste detection.
    usage_rating = Column(Integer, nullable=True)  # 1–5

    # Direct cancellation URL for this service
    cancel_url = Column(String, nullable=True)

    # Tracks post-cancellation user decision for Action Center
    cancellation_outcome = Column(String, nullable=True)  # kept, cancelled
    cancellation_outcome_at = Column(DateTime, nullable=True)

    # Logo / color for display
    color = Column(String, nullable=True)  # hex color

    # For shared subscriptions
    num_members = Column(Integer, default=1)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="subscriptions")
    accepted_discovery_candidates = relationship("DiscoveryCandidate", back_populates="accepted_subscription")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    razorpay_order_id = Column(String, unique=True, nullable=False, index=True)
    razorpay_payment_id = Column(String, nullable=True, index=True)
    razorpay_signature = Column(String, nullable=True)

    plan = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    status = Column(String, default="pending")  # pending, success, failed

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="payments")


class MailboxConnection(Base):
    __tablename__ = "mailbox_connections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    provider = Column(String, nullable=False)
    email = Column(String, nullable=False)
    access_token_encrypted = Column(Text, nullable=True)
    refresh_token_encrypted = Column(Text, nullable=True)
    scopes = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="connected")
    connected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_synced_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="mailbox_connections")
    discovery_candidates = relationship("DiscoveryCandidate", back_populates="source_connection")


class DiscoveryCandidate(Base):
    __tablename__ = "discovery_candidates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    source_connection_id = Column(Integer, ForeignKey("mailbox_connections.id"), nullable=True)

    merchant_name = Column(String, nullable=False)
    amount = Column(Float, nullable=True)
    currency = Column(String, nullable=False, default="USD")
    billing_cycle_guess = Column(String, nullable=True)
    next_billing_date_guess = Column(DateTime, nullable=True)
    confidence = Column(Float, nullable=False, default=0.0)
    source_type = Column(String, nullable=False, default="email_receipt")
    source_message_id = Column(String, nullable=True)
    raw_excerpt = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="pending")
    accepted_subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="discovery_candidates")
    source_connection = relationship("MailboxConnection", back_populates="discovery_candidates")
    accepted_subscription = relationship("Subscription", back_populates="accepted_discovery_candidates")


def init_db():
    Base.metadata.create_all(bind=engine)
    # Ensure newer auth columns exist for existing databases created before Phase 2.
    with engine.begin() as conn:
        def run_optional_migration(sql: str):
            try:
                conn.execute(text(sql))
            except Exception as exc:
                sql_preview = " ".join(sql.strip().split())[:120]
                logger.warning("Optional migration skipped: %s (%s)", sql_preview, exc)

        run_optional_migration("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR")
        run_optional_migration("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP")
        run_optional_migration("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_used_at TIMESTAMP")
        run_optional_migration("ALTER TABLE users ADD COLUMN IF NOT EXISTS home_currency VARCHAR DEFAULT 'USD'")
        run_optional_migration("CREATE INDEX IF NOT EXISTS ix_users_password_reset_token ON users (password_reset_token)")
        run_optional_migration("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancellation_outcome VARCHAR")
        run_optional_migration("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancellation_outcome_at TIMESTAMP")
        run_optional_migration("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS num_members INTEGER DEFAULT 1")
        run_optional_migration("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS last_amount DOUBLE PRECISION")
        run_optional_migration("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS amount_change_pct DOUBLE PRECISION")
        run_optional_migration("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS amount_changed_at TIMESTAMP")
        run_optional_migration("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS amount_alert_dismissed BOOLEAN DEFAULT FALSE")
        run_optional_migration("UPDATE subscriptions SET amount_alert_dismissed = FALSE WHERE amount_alert_dismissed IS NULL")
        run_optional_migration("""
            CREATE TABLE IF NOT EXISTS mailbox_connections (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                provider VARCHAR NOT NULL,
                email VARCHAR NOT NULL,
                access_token_encrypted TEXT,
                refresh_token_encrypted TEXT,
                scopes TEXT,
                status VARCHAR NOT NULL DEFAULT 'connected',
                connected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_synced_at TIMESTAMP,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)
        run_optional_migration("CREATE INDEX IF NOT EXISTS ix_mailbox_connections_user_id ON mailbox_connections (user_id)")

        run_optional_migration("""
            CREATE TABLE IF NOT EXISTS discovery_candidates (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                source_connection_id INTEGER REFERENCES mailbox_connections(id) ON DELETE SET NULL,
                merchant_name VARCHAR NOT NULL,
                amount DOUBLE PRECISION,
                currency VARCHAR NOT NULL DEFAULT 'USD',
                billing_cycle_guess VARCHAR,
                next_billing_date_guess TIMESTAMP,
                confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
                source_type VARCHAR NOT NULL DEFAULT 'email_receipt',
                source_message_id VARCHAR,
                raw_excerpt TEXT,
                status VARCHAR NOT NULL DEFAULT 'pending',
                accepted_subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)
        run_optional_migration("CREATE INDEX IF NOT EXISTS ix_discovery_candidates_user_id ON discovery_candidates (user_id)")

        # Defensive column/index adds for partially migrated databases.
        run_optional_migration("ALTER TABLE mailbox_connections ADD COLUMN IF NOT EXISTS access_token_encrypted TEXT")
        run_optional_migration("ALTER TABLE mailbox_connections ADD COLUMN IF NOT EXISTS refresh_token_encrypted TEXT")
        run_optional_migration("ALTER TABLE mailbox_connections ADD COLUMN IF NOT EXISTS scopes TEXT")
        run_optional_migration("ALTER TABLE mailbox_connections ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'connected'")
        run_optional_migration("ALTER TABLE mailbox_connections ADD COLUMN IF NOT EXISTS connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        run_optional_migration("ALTER TABLE mailbox_connections ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP")
        run_optional_migration("ALTER TABLE mailbox_connections ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        run_optional_migration("ALTER TABLE mailbox_connections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        run_optional_migration("UPDATE mailbox_connections SET access_token_encrypted = NULL, refresh_token_encrypted = NULL WHERE access_token_encrypted IS NOT NULL OR refresh_token_encrypted IS NOT NULL")

        run_optional_migration("ALTER TABLE discovery_candidates ADD COLUMN IF NOT EXISTS source_connection_id INTEGER REFERENCES mailbox_connections(id) ON DELETE SET NULL")
        run_optional_migration("ALTER TABLE discovery_candidates ADD COLUMN IF NOT EXISTS billing_cycle_guess VARCHAR")
        run_optional_migration("ALTER TABLE discovery_candidates ADD COLUMN IF NOT EXISTS next_billing_date_guess TIMESTAMP")
        run_optional_migration("ALTER TABLE discovery_candidates ADD COLUMN IF NOT EXISTS confidence DOUBLE PRECISION DEFAULT 0")
        run_optional_migration("ALTER TABLE discovery_candidates ADD COLUMN IF NOT EXISTS source_type VARCHAR DEFAULT 'email_receipt'")
        run_optional_migration("ALTER TABLE discovery_candidates ADD COLUMN IF NOT EXISTS source_message_id VARCHAR")
        run_optional_migration("ALTER TABLE discovery_candidates ADD COLUMN IF NOT EXISTS raw_excerpt TEXT")
        run_optional_migration("ALTER TABLE discovery_candidates ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending'")
        run_optional_migration("ALTER TABLE discovery_candidates ADD COLUMN IF NOT EXISTS accepted_subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL")
        run_optional_migration("ALTER TABLE discovery_candidates ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        run_optional_migration("ALTER TABLE discovery_candidates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    print("✅ Database initialized successfully!")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
