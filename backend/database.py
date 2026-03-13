"""
Database configuration and models for SubTrack — Subscription Tracker
"""

import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, JSON, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from werkzeug.security import generate_password_hash, check_password_hash

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost/subtrack"
)

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
    subscription_active = Column(Boolean, default=True)
    subscription_end_date = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Password reset
    password_reset_token = Column(String, nullable=True, index=True)
    password_reset_expires = Column(DateTime, nullable=True)

    # Relationships
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")

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

    # Logo / color for display
    color = Column(String, nullable=True)  # hex color

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="subscriptions")


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


def init_db():
    Base.metadata.create_all(bind=engine)
    # Ensure newer auth columns exist for existing databases created before Phase 2.
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_password_reset_token ON users (password_reset_token)"))
    print("✅ Database initialized successfully!")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
