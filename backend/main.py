"""
SubTrack — Backend (FastAPI)
============================
Subscription tracking app.
  • Subscription CRUD
  • Analytics & spend summaries
  • User auth (JWT)
  • Razorpay payments (pro plan upgrade)
"""

import os
import hmac
import hashlib
import re
from datetime import datetime, timedelta
from typing import Optional, List
from calendar import monthrange
import csv
import io
import secrets as secrets_module

from dotenv import load_dotenv
load_dotenv()

import razorpay
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import init_db, get_db, User, Subscription, Payment, FREE_SUBSCRIPTION_LIMIT
from auth import create_access_token, get_current_user, verify_token


# ─────────────────────────────────────────────
# Pydantic Models
# ─────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class SubscriptionCreate(BaseModel):
    name: str
    category: str = "Other"
    amount: float
    currency: str = "USD"
    billing_cycle: str = "monthly"  # monthly, yearly, weekly
    next_billing_date: str  # ISO date string YYYY-MM-DD
    notes: Optional[str] = None
    color: Optional[str] = None
    is_active: bool = True
    usage_rating: Optional[int] = None  # 1 (never) – 5 (daily)
    cancel_url: Optional[str] = None


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    billing_cycle: Optional[str] = None
    next_billing_date: Optional[str] = None
    notes: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None
    usage_rating: Optional[int] = None
    cancel_url: Optional[str] = None


class OrderRequest(BaseModel):
    amount: int  # paise
    currency: str = "INR"
    plan_type: str = "pro"


class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ─────────────────────────────────────────────
# App Setup
# ─────────────────────────────────────────────

app = FastAPI(title="SubTrack API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")
RETURN_RESET_TOKEN = os.getenv("RETURN_RESET_TOKEN", "false").lower() == "true"

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)) if RAZORPAY_KEY_ID else None


def _is_real_payment_key(value: str) -> bool:
    if not value:
        return False
    lowered = value.lower()
    placeholders = ("xxxx", "change-me", "your_", "example", "test_key")
    return not any(token in lowered for token in placeholders)


def _payment_configured() -> bool:
    return _is_real_payment_key(RAZORPAY_KEY_ID) and _is_real_payment_key(RAZORPAY_KEY_SECRET)


@app.on_event("startup")
async def startup_event():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok", "service": "SubTrack API"}


# ─────────────────────────────────────────────
# Auth Routes
# ─────────────────────────────────────────────

@app.post("/api/auth/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", req.email):
        raise HTTPException(status_code=400, detail="Invalid email address")
    if db.query(User).filter(User.email == req.email.lower()).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=req.email.lower(), full_name=req.full_name)
    user.set_password(req.password)
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id)
    return {
        "access_token": token,
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "plan": user.plan,
    }


@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not user.check_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user.id)
    return {
        "access_token": token,
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "plan": user.plan,
    }


@app.get("/api/auth/me")
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.is_active == True
    ).count()
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "plan": current_user.plan,
        "subscription_active": current_user.subscription_active,
        "active_subscription_count": count,
        "free_limit": FREE_SUBSCRIPTION_LIMIT,
    }


# ─────────────────────────────────────────────
# Subscription CRUD
# ─────────────────────────────────────────────


@app.post("/api/auth/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    # Always return 200 to prevent email enumeration
    if user:
        token = secrets_module.token_urlsafe(32)
        user.password_reset_token = token
        user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        # TODO: send token via email (e.g. SendGrid/Resend).
        if RETURN_RESET_TOKEN:
            return {"message": "Reset instructions sent.", "reset_token": token}
        return {"message": "Reset instructions sent."}
    return {"message": "Reset instructions sent."}


@app.post("/api/auth/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user = db.query(User).filter(
        User.password_reset_token == req.token,
        User.password_reset_expires > datetime.utcnow(),
    ).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    user.set_password(req.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()
    return {"message": "Password updated successfully"}


@app.delete("/api/auth/account")
def delete_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "Account deleted"}

def _parse_date(date_str: str) -> datetime:
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S.%f"):
        try:
            return datetime.strptime(date_str[:19], fmt[:len(date_str[:19])])
        except ValueError:
            pass
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00").split("+")[0])
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {date_str}")


@app.get("/api/subscriptions")
def list_subscriptions(
    active_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Subscription).filter(Subscription.user_id == current_user.id)
    if active_only:
        q = q.filter(Subscription.is_active == True)
    subs = q.order_by(Subscription.next_billing_date.asc()).all()
    return [_sub_dict(s) for s in subs]


@app.post("/api/subscriptions", status_code=201)
def create_subscription(
    req: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    active_count = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.is_active == True
    ).count()

    if not current_user.can_add_subscription(active_count):
        raise HTTPException(
            status_code=403,
            detail=f"Free plan limited to {FREE_SUBSCRIPTION_LIMIT} active subscriptions. Upgrade to Pro for unlimited."
        )

    sub = Subscription(
        user_id=current_user.id,
        name=req.name,
        category=req.category,
        amount=req.amount,
        currency=req.currency,
        billing_cycle=req.billing_cycle,
        next_billing_date=_parse_date(req.next_billing_date),
        notes=req.notes,
        color=req.color,
        is_active=req.is_active,
        usage_rating=req.usage_rating,
        cancel_url=req.cancel_url,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return _sub_dict(sub)


@app.get("/api/subscriptions/export.csv")
def export_csv(
    request: Request,
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    from fastapi.responses import StreamingResponse

    # Allow export via either Authorization header (normal API use)
    # or a query token (mobile deep-link fallback).
    current_user = None
    auth_header = request.headers.get("authorization")
    if auth_header:
        try:
            scheme, header_token = auth_header.split()
            if scheme.lower() == "bearer":
                payload = verify_token(header_token)
                current_user = db.query(User).filter(User.id == payload["user_id"]).first()
        except Exception:
            current_user = None

    if current_user is None and token:
        try:
            payload = verify_token(token)
            current_user = db.query(User).filter(User.id == payload["user_id"]).first()
        except Exception:
            current_user = None

    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    subs = db.query(Subscription).filter(
        Subscription.user_id == current_user.id
    ).order_by(Subscription.next_billing_date.asc()).all()

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "name", "category", "amount", "currency", "billing_cycle",
        "monthly_cost", "next_billing_date", "is_active", "usage_rating",
        "cancel_url", "notes"
    ])
    writer.writeheader()
    for s in subs:
        writer.writerow({
            "name": s.name,
            "category": s.category,
            "amount": s.amount,
            "currency": s.currency,
            "billing_cycle": s.billing_cycle,
            "monthly_cost": round(_monthly_cost(s), 2),
            "next_billing_date": s.next_billing_date.strftime("%Y-%m-%d") if s.next_billing_date else "",
            "is_active": s.is_active,
            "usage_rating": s.usage_rating or "",
            "cancel_url": s.cancel_url or "",
            "notes": s.notes or "",
        })
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=subtrack_subscriptions.csv"},
    )


@app.get("/api/subscriptions/{sub_id}")
def get_subscription(
    sub_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sub = _get_sub_or_404(sub_id, current_user.id, db)
    return _sub_dict(sub)


@app.put("/api/subscriptions/{sub_id}")
def update_subscription(
    sub_id: int,
    req: SubscriptionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sub = _get_sub_or_404(sub_id, current_user.id, db)
    if req.name is not None:
        sub.name = req.name
    if req.category is not None:
        sub.category = req.category
    if req.amount is not None:
        sub.amount = req.amount
    if req.currency is not None:
        sub.currency = req.currency
    if req.billing_cycle is not None:
        sub.billing_cycle = req.billing_cycle
    if req.next_billing_date is not None:
        sub.next_billing_date = _parse_date(req.next_billing_date)
    if req.notes is not None:
        sub.notes = req.notes
    if req.color is not None:
        sub.color = req.color
    if req.is_active is not None:
        sub.is_active = req.is_active
    if req.usage_rating is not None:
        sub.usage_rating = req.usage_rating
    if req.cancel_url is not None:
        sub.cancel_url = req.cancel_url
    sub.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(sub)
    return _sub_dict(sub)


@app.delete("/api/subscriptions/{sub_id}", status_code=204)
def delete_subscription(
    sub_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sub = _get_sub_or_404(sub_id, current_user.id, db)
    db.delete(sub)
    db.commit()


# ─────────────────────────────────────────────
# Analytics
# ─────────────────────────────────────────────

@app.get("/api/analytics")
def get_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subs = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.is_active == True
    ).all()

    monthly_total = sum(_monthly_cost(s) for s in subs)
    yearly_total = monthly_total * 12

    # By category
    by_category = {}
    for s in subs:
        cost = _monthly_cost(s)
        by_category[s.category] = by_category.get(s.category, 0) + cost

    # Upcoming renewals (next 30 days)
    now = datetime.utcnow()
    in_30 = now + timedelta(days=30)
    upcoming = [
        _sub_dict(s) for s in subs
        if s.next_billing_date and now <= s.next_billing_date <= in_30
    ]
    upcoming.sort(key=lambda x: x["next_billing_date"])

    # Most expensive
    sorted_subs = sorted(subs, key=lambda s: _monthly_cost(s), reverse=True)

    # Waste detection: low-rated (1-2 stars) active subscriptions
    waste_subs = [s for s in subs if s.usage_rating and s.usage_rating <= 2]
    waste_monthly = sum(_monthly_cost(s) for s in waste_subs)

    return {
        "monthly_total": round(monthly_total, 2),
        "yearly_total": round(yearly_total, 2),
        "active_count": len(subs),
        "by_category": {k: round(v, 2) for k, v in by_category.items()},
        "upcoming_renewals": upcoming[:5],
        "most_expensive": [_sub_dict(s) for s in sorted_subs[:3]],
        "waste_subs": [_sub_dict(s) for s in waste_subs],
        "waste_monthly": round(waste_monthly, 2),
        "potential_yearly_savings": round(waste_monthly * 12, 2),
    }


@app.get("/api/reminders/upcoming")
def upcoming_reminders(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    days = max(1, min(days, 90))
    now = datetime.utcnow()
    limit = now + timedelta(days=days)
    subs = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.is_active == True
    ).all()
    items = [
        _sub_dict(s) for s in subs
        if s.next_billing_date and now <= s.next_billing_date <= limit
    ]
    items.sort(key=lambda x: x["next_billing_date"])
    return {"days": days, "count": len(items), "items": items}


# ─────────────────────────────────────────────
# Payments (Razorpay)
# ─────────────────────────────────────────────


@app.post("/api/payments/create-order")
def create_order(
    req: OrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not razorpay_client or not _payment_configured():
        raise HTTPException(status_code=503, detail="Payment service not configured")
    try:
        order = razorpay_client.order.create({
            "amount": req.amount,
            "currency": req.currency,
            "payment_capture": 1,
            "notes": {"user_id": str(current_user.id), "plan": req.plan_type},
        })
    except Exception:
        raise HTTPException(status_code=502, detail="Payment provider error")
    payment = Payment(
        user_id=current_user.id,
        razorpay_order_id=order["id"],
        plan=req.plan_type,
        amount=req.amount / 100,
        currency=req.currency,
    )
    db.add(payment)
    db.commit()
    return {
        "razorpay_order_id": order["id"],
        "key_id": RAZORPAY_KEY_ID,
        "amount": req.amount,
        "currency": req.currency,
        "email": current_user.email,
    }


@app.post("/api/payments/verify")
def verify_payment(
    req: PaymentVerification,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not razorpay_client or not _payment_configured():
        raise HTTPException(status_code=503, detail="Payment service not configured")
    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": req.razorpay_order_id,
            "razorpay_payment_id": req.razorpay_payment_id,
            "razorpay_signature": req.razorpay_signature,
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Payment verification failed")

    payment = db.query(Payment).filter(Payment.razorpay_order_id == req.razorpay_order_id).first()
    if payment:
        payment.razorpay_payment_id = req.razorpay_payment_id
        payment.razorpay_signature = req.razorpay_signature
        payment.status = "success"

    current_user.plan = "pro"
    current_user.subscription_active = True
    current_user.subscription_end_date = datetime.utcnow() + timedelta(days=365)
    db.commit()
    return {"success": True, "plan": "pro"}


@app.post("/api/payments/webhook")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")
    if RAZORPAY_WEBHOOK_SECRET:
        expected = hmac.new(
            RAZORPAY_WEBHOOK_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
    return {"status": "ok"}


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def _get_sub_or_404(sub_id: int, user_id: int, db: Session) -> Subscription:
    sub = db.query(Subscription).filter(
        Subscription.id == sub_id,
        Subscription.user_id == user_id
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return sub


def _monthly_cost(sub: Subscription) -> float:
    if sub.billing_cycle == "yearly":
        return sub.amount / 12
    if sub.billing_cycle == "weekly":
        return sub.amount * 4.33
    return sub.amount  # monthly


def _sub_dict(sub: Subscription) -> dict:
    return {
        "id": sub.id,
        "name": sub.name,
        "category": sub.category,
        "amount": sub.amount,
        "currency": sub.currency,
        "billing_cycle": sub.billing_cycle,
        "next_billing_date": sub.next_billing_date.isoformat() if sub.next_billing_date else None,
        "start_date": sub.start_date.isoformat() if sub.start_date else None,
        "is_active": sub.is_active,
        "notes": sub.notes,
        "color": sub.color,
        "usage_rating": sub.usage_rating,
        "cancel_url": sub.cancel_url,
        "monthly_cost": round(_monthly_cost(sub), 2),
        "created_at": sub.created_at.isoformat() if sub.created_at else None,
    }
