from fastapi import FastAPI, APIRouter, Request, Header, HTTPException, Depends
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import json
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db_name = os.environ.get('DB_NAME', 'smartrent_db')
db = client[db_name]

JWT_SECRET = os.environ.get('JWT_SECRET', 'smartrent-secret-key-2025-secure-pad!')
TENANT_JWT_SECRET = os.environ.get('TENANT_JWT_SECRET', 'smartrent-tenant-secret-2025-secure!')

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ── SSE Event Bus ──
class EventBus:
    def __init__(self):
        self.channels = {}

    def subscribe(self, channel_id: str):
        if channel_id not in self.channels:
            self.channels[channel_id] = []
        q = asyncio.Queue()
        self.channels[channel_id].append(q)
        return q

    def unsubscribe(self, channel_id: str, q):
        if channel_id in self.channels:
            self.channels[channel_id] = [x for x in self.channels[channel_id] if x is not q]
            if not self.channels[channel_id]:
                del self.channels[channel_id]

    async def publish(self, channel_id: str, event: dict):
        if channel_id in self.channels:
            for q in self.channels[channel_id]:
                await q.put(event)

event_bus = EventBus()

# ── Helpers ──
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_tenant_token(tenant: dict) -> str:
    payload = {
        "id": tenant["id"],
        "email": tenant["email"],
        "name": tenant["name"],
        "unitNumber": tenant.get("unitNumber", ""),
        "unitId": tenant.get("unitId", ""),
        "type": "tenant",
        "exp": datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, TENANT_JWT_SECRET, algorithm="HS256")

async def get_current_tenant(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, TENANT_JWT_SECRET, algorithms=["HS256"])
        if payload.get("type") != "tenant":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ── Models ──
class LoginRequest(BaseModel):
    email: str
    password: str

class ActivateRequest(BaseModel):
    token: str
    password: str

class PaymentInitiateRequest(BaseModel):
    amount: float
    phoneNumber: str

class MaintenanceCreateRequest(BaseModel):
    title: str
    description: str
    priority: str = "medium"
    category: str = "General"
    photos: List[str] = []

class ProfileUpdateRequest(BaseModel):
    phone: Optional[str] = None
    emergencyContact: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    currentPassword: str
    newPassword: str

# ── Seed Data ──
async def seed_data():
    existing = await db.tenants.find_one({"email": "grace.muthoni@gmail.com"})
    if existing:
        logger.info("Seed data already exists, skipping...")
        return

    logger.info("Seeding demo data...")
    tenant_id = str(uuid.uuid4())
    unit_id = str(uuid.uuid4())
    lease_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # Unit
    await db.units.insert_one({
        "id": unit_id, "unitNumber": "A-12", "floor": 1, "bedrooms": 2,
        "rent": 25000, "status": "occupied", "propertyId": str(uuid.uuid4()),
        "createdAt": now
    })

    # Tenant
    await db.tenants.insert_one({
        "id": tenant_id, "name": "Grace Muthoni", "email": "grace.muthoni@gmail.com",
        "phone": "+254712345678", "idNumber": "30000000", "unitId": unit_id,
        "unitNumber": "A-12", "status": "active", "moveInDate": "2025-01-01",
        "emergencyContact": "+254720000000", "avatar": "GM",
        "tenantPassword": hash_password("password123"),
        "tenantActivated": True, "activatedAt": now, "createdAt": now
    })

    # Lease
    await db.leases.insert_one({
        "id": lease_id, "tenantId": tenant_id, "tenantName": "Grace Muthoni",
        "unitId": unit_id, "unitNumber": "A-12",
        "startDate": "2025-01-01", "endDate": "2025-12-31",
        "monthlyRent": 25000, "deposit": 25000,
        "status": "active", "signedAt": now, "createdAt": now
    })

    # Payments
    months = [
        ("2025-01", "January 2025", "2025-01-03"),
        ("2025-02", "February 2025", "2025-02-02"),
    ]
    for month, label, paid_at in months:
        await db.payments.insert_one({
            "id": str(uuid.uuid4()), "tenantId": tenant_id,
            "tenantName": "Grace Muthoni", "unitNumber": "A-12",
            "amount": 25000, "method": "M-Pesa",
            "mpesaRef": f"TX{uuid.uuid4().hex[:8].upper()}",
            "status": "confirmed", "month": month, "paidAt": paid_at,
            "createdAt": now
        })

    # Maintenance tickets
    tickets = [
        {"title": "Kitchen Sink Leakage", "description": "Water dripping from kitchen tap continuously", "priority": "high", "category": "Plumbing", "status": "in_progress", "createdAt": now},
        {"title": "Bedroom AC Not Cooling", "description": "AC runs but does not cool the room", "priority": "medium", "category": "Appliance", "status": "open", "createdAt": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()},
    ]
    for t in tickets:
        await db.maintenance_tickets.insert_one({
            "id": str(uuid.uuid4()), "tenantId": tenant_id,
            "tenantName": "Grace Muthoni", "unitNumber": "A-12",
            "photos": [], "assignedTo": None, "resolvedAt": None,
            "updatedAt": now, **t
        })

    # Notifications
    notifs = [
        {"title": "Water Disruption — Tomorrow", "message": "Scheduled maintenance from 9am to 2pm", "type": "broadcast", "read": False},
        {"title": "Rent Reminder — March", "message": "Your rent of KSh 25,000 is due on March 5th", "type": "payment", "read": False},
        {"title": "Community Clean-Up Day", "message": "Join this Saturday at 8am", "type": "broadcast", "read": True},
        {"title": "Security Update", "message": "New CCTV cameras installed", "type": "broadcast", "read": True},
        {"title": "Rent Received — February", "message": "Payment confirmed", "type": "payment", "read": True},
    ]
    for i, n in enumerate(notifs):
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()), "tenantId": tenant_id,
            "audience": "tenant", "broadcastId": None, "ticketId": None,
            "createdAt": (datetime.now(timezone.utc) - timedelta(hours=2 * (i + 1))).isoformat(),
            **n
        })

    logger.info("Seed data created successfully!")

@app.on_event("startup")
async def startup():
    await seed_data()

@app.on_event("shutdown")
async def shutdown():
    client.close()

# ── Projection helper ──
NO_ID = {"_id": 0}

# ── Health ──
@api_router.get("/health")
async def health():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {"database": "connected", "sse": {"listeners": sum(len(v) for v in event_bus.channels.values())}},
    }

# ── Tenant Auth ──
@api_router.post("/tenant/auth/login")
async def tenant_login(req: LoginRequest):
    tenant = await db.tenants.find_one({"email": req.email}, NO_ID)
    if not tenant:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not tenant.get("tenantActivated"):
        raise HTTPException(status_code=401, detail="Account not activated")
    if not tenant.get("tenantPassword") or not verify_password(req.password, tenant["tenantPassword"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_tenant_token(tenant)
    return {
        "token": token,
        "tenant": {
            "id": tenant["id"], "name": tenant["name"], "email": tenant["email"],
            "phone": tenant.get("phone", ""), "unitNumber": tenant.get("unitNumber", ""),
            "unitId": tenant.get("unitId", ""), "avatar": tenant.get("avatar", ""),
            "status": tenant.get("status", "active")
        }
    }

@api_router.post("/tenant/auth/activate")
async def tenant_activate(req: ActivateRequest):
    try:
        payload = jwt.decode(req.token, TENANT_JWT_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired invite token")
    tenant = await db.tenants.find_one({"id": payload.get("tenantId")}, NO_ID)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    if tenant.get("tenantActivated"):
        raise HTTPException(status_code=400, detail="Account already activated")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    now = datetime.now(timezone.utc).isoformat()
    await db.tenants.update_one({"id": tenant["id"]}, {"$set": {
        "tenantPassword": hash_password(req.password),
        "tenantActivated": True, "activatedAt": now
    }})
    tenant["tenantActivated"] = True
    token = create_tenant_token(tenant)
    return {"token": token, "tenant": {"id": tenant["id"], "name": tenant["name"], "email": tenant["email"], "unitNumber": tenant.get("unitNumber", ""), "unitId": tenant.get("unitId", ""), "avatar": tenant.get("avatar", "")}, "message": "Account activated successfully"}

@api_router.get("/tenant/auth/me")
async def tenant_me(user=Depends(get_current_tenant)):
    tenant = await db.tenants.find_one({"id": user["id"]}, NO_ID)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return {"user": {"id": tenant["id"], "email": tenant["email"], "name": tenant["name"], "unitNumber": tenant.get("unitNumber", ""), "unitId": tenant.get("unitId", ""), "avatar": tenant.get("avatar", ""), "phone": tenant.get("phone", ""), "type": "tenant"}}

# ── Dashboard ──
@api_router.get("/tenant/dashboard")
async def tenant_dashboard(user=Depends(get_current_tenant)):
    tenant = await db.tenants.find_one({"id": user["id"]}, NO_ID)
    unit = await db.units.find_one({"id": tenant.get("unitId")}, NO_ID) if tenant else None
    lease = await db.leases.find_one({"tenantId": user["id"], "status": "active"}, NO_ID)
    payments = await db.payments.find({"tenantId": user["id"]}, NO_ID).sort("createdAt", -1).to_list(100)
    open_tickets = await db.maintenance_tickets.count_documents({"tenantId": user["id"], "status": {"$in": ["open", "in_progress", "assigned"]}})
    unread_notifs = await db.notifications.count_documents({"tenantId": user["id"], "read": False})
    total_paid = sum(p["amount"] for p in payments if p["status"] == "confirmed")
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    current_payment = next((p for p in payments if p.get("month") == current_month), None)
    last_payment = payments[0] if payments else None
    monthly_rent = lease["monthlyRent"] if lease else (unit["rent"] if unit else 25000)

    return {
        "tenant": {"id": tenant["id"], "name": tenant["name"], "unitNumber": tenant.get("unitNumber", ""), "avatar": tenant.get("avatar", "")},
        "unit": {"unitNumber": unit["unitNumber"], "floor": unit.get("floor", 1), "bedrooms": unit.get("bedrooms", 2), "rent": unit.get("rent", 25000)} if unit else None,
        "lease": {"id": lease["id"], "startDate": lease["startDate"], "endDate": lease["endDate"], "monthlyRent": lease["monthlyRent"], "status": lease["status"]} if lease else None,
        "payment": {
            "currentMonthStatus": current_payment["status"] if current_payment else "pending",
            "currentMonthAmount": current_payment["amount"] if current_payment else 0,
            "monthlyRent": monthly_rent,
            "totalPaid": total_paid,
            "pendingAmount": monthly_rent - (current_payment["amount"] if current_payment and current_payment["status"] == "confirmed" else 0),
            "overdueAmount": 0,
            "lastPayment": last_payment
        },
        "stats": {"openTickets": open_tickets, "unreadNotifications": unread_notifs}
    }

# ── Payments ──
@api_router.get("/tenant/payments")
async def tenant_payments(user=Depends(get_current_tenant)):
    payments = await db.payments.find({"tenantId": user["id"]}, NO_ID).sort("createdAt", -1).to_list(100)
    return {"payments": payments}

@api_router.post("/tenant/payments/initiate")
async def tenant_payment_initiate(req: PaymentInitiateRequest, user=Depends(get_current_tenant)):
    tenant = await db.tenants.find_one({"id": user["id"]}, NO_ID)
    payment_id = str(uuid.uuid4())
    checkout_id = f"ws_CO_{uuid.uuid4().hex[:16].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    payment = {
        "id": payment_id, "tenantId": user["id"],
        "tenantName": tenant["name"] if tenant else user["name"],
        "unitNumber": user.get("unitNumber", ""),
        "amount": req.amount, "method": "M-Pesa",
        "mpesaRef": None, "mpesaCheckoutRequestId": checkout_id,
        "status": "pending", "month": current_month,
        "paidAt": None, "initiatedAt": now, "createdAt": now
    }
    await db.payments.insert_one(payment)
    payment.pop("_id", None)

    # Simulate M-Pesa confirmation after 3 seconds
    asyncio.create_task(simulate_mpesa_callback(payment_id, user["id"], req.amount))

    return {"payment": {"id": payment_id, "status": "pending", "amount": req.amount, "checkoutRequestId": checkout_id}, "message": "M-Pesa STK push initiated. Check your phone."}

async def simulate_mpesa_callback(payment_id: str, tenant_id: str, amount: float):
    await asyncio.sleep(3)
    mpesa_ref = f"TX{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    await db.payments.update_one({"id": payment_id}, {"$set": {"status": "confirmed", "mpesaRef": mpesa_ref, "paidAt": now}})
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()), "tenantId": tenant_id,
        "title": "Payment Confirmed", "message": f"Your payment of KSh {amount:,.0f} has been confirmed. Ref: {mpesa_ref}",
        "type": "payment", "read": False, "audience": "tenant",
        "broadcastId": None, "ticketId": None, "createdAt": now
    })
    await event_bus.publish(f"tenant:{tenant_id}", {"type": "payment:confirmed", "data": {"amount": amount, "mpesaRef": mpesa_ref}})

# ── Maintenance ──
@api_router.get("/tenant/maintenance")
async def tenant_maintenance(user=Depends(get_current_tenant)):
    tickets = await db.maintenance_tickets.find({"tenantId": user["id"]}, NO_ID).sort("createdAt", -1).to_list(100)
    return {"tickets": tickets}

@api_router.post("/tenant/maintenance")
async def tenant_maintenance_create(req: MaintenanceCreateRequest, user=Depends(get_current_tenant)):
    tenant = await db.tenants.find_one({"id": user["id"]}, NO_ID)
    now = datetime.now(timezone.utc).isoformat()
    ticket = {
        "id": str(uuid.uuid4()), "title": req.title, "description": req.description,
        "priority": req.priority, "category": req.category, "status": "open",
        "tenantId": user["id"], "tenantName": tenant["name"] if tenant else user["name"],
        "unitNumber": user.get("unitNumber", ""),
        "assignedTo": None, "photos": req.photos,
        "resolvedAt": None, "createdAt": now, "updatedAt": now
    }
    await db.maintenance_tickets.insert_one(ticket)
    # Remove mongo _id
    ticket.pop("_id", None)
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()), "tenantId": user["id"],
        "title": "Ticket Created", "message": f"Your ticket '{req.title}' has been submitted.",
        "type": "maintenance", "read": False, "audience": "tenant",
        "broadcastId": None, "ticketId": ticket["id"], "createdAt": now
    })
    return {"ticket": ticket, "message": "Ticket submitted successfully"}

@api_router.get("/tenant/maintenance/{ticket_id}")
async def tenant_maintenance_detail(ticket_id: str, user=Depends(get_current_tenant)):
    ticket = await db.maintenance_tickets.find_one({"id": ticket_id, "tenantId": user["id"]}, NO_ID)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"ticket": ticket}

# ── Lease ──
@api_router.get("/tenant/lease")
async def tenant_lease(user=Depends(get_current_tenant)):
    lease = await db.leases.find_one({"tenantId": user["id"]}, NO_ID)
    if not lease:
        raise HTTPException(status_code=404, detail="No active lease found")
    return {"lease": lease}

@api_router.post("/tenant/lease/sign")
async def tenant_lease_sign(user=Depends(get_current_tenant)):
    lease = await db.leases.find_one({"tenantId": user["id"]}, NO_ID)
    if not lease:
        raise HTTPException(status_code=404, detail="No lease found")
    now = datetime.now(timezone.utc).isoformat()
    await db.leases.update_one({"id": lease["id"]}, {"$set": {"signedAt": now, "status": "active"}})
    return {"message": "Lease signed successfully", "signedAt": now}

# ── Notifications ──
@api_router.get("/tenant/notifications")
async def tenant_notifications(user=Depends(get_current_tenant)):
    notifs = await db.notifications.find({"tenantId": user["id"]}, NO_ID).sort("createdAt", -1).to_list(100)
    unread = sum(1 for n in notifs if not n.get("read"))
    return {"notifications": notifs, "unreadCount": unread}

@api_router.put("/tenant/notifications/{notif_id}/read")
async def tenant_notification_read(notif_id: str, user=Depends(get_current_tenant)):
    await db.notifications.update_one({"id": notif_id, "tenantId": user["id"]}, {"$set": {"read": True}})
    return {"message": "Notification marked as read"}

@api_router.put("/tenant/notifications/read-all")
async def tenant_notifications_read_all(user=Depends(get_current_tenant)):
    await db.notifications.update_many({"tenantId": user["id"], "read": False}, {"$set": {"read": True}})
    return {"message": "All notifications marked as read"}

# ── Profile ──
@api_router.get("/tenant/profile")
async def tenant_profile(user=Depends(get_current_tenant)):
    tenant = await db.tenants.find_one({"id": user["id"]}, NO_ID)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant.pop("tenantPassword", None)
    tenant.pop("inviteToken", None)
    return {"profile": tenant}

@api_router.put("/tenant/profile")
async def tenant_profile_update(req: ProfileUpdateRequest, user=Depends(get_current_tenant)):
    updates = {}
    if req.phone is not None:
        updates["phone"] = req.phone
    if req.emergencyContact is not None:
        updates["emergencyContact"] = req.emergencyContact
    if updates:
        await db.tenants.update_one({"id": user["id"]}, {"$set": updates})
    return {"message": "Profile updated"}

@api_router.put("/tenant/profile/password")
async def tenant_password_change(req: PasswordChangeRequest, user=Depends(get_current_tenant)):
    tenant = await db.tenants.find_one({"id": user["id"]}, NO_ID)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    if not verify_password(req.currentPassword, tenant.get("tenantPassword", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(req.newPassword) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    await db.tenants.update_one({"id": user["id"]}, {"$set": {"tenantPassword": hash_password(req.newPassword)}})
    return {"message": "Password changed successfully"}

# ── SSE Real-time Events ──
@api_router.get("/realtime/events")
async def realtime_events(request: Request, authorization: Optional[str] = Header(None), type: str = "tenant"):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Auth required")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, TENANT_JWT_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    channel_id = f"tenant:{payload['id']}" if type == "tenant" else "admin:all"

    async def event_generator():
        q = event_bus.subscribe(channel_id)
        try:
            yield f"data: {json.dumps({'type': 'connected', 'channelId': channel_id})}\n\n"
            while True:
                try:
                    event = await asyncio.wait_for(q.get(), timeout=30)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    yield ": heartbeat\n\n"
                if await request.is_disconnected():
                    break
        finally:
            event_bus.unsubscribe(channel_id, q)

    return StreamingResponse(event_generator(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"})

# ── Deposit ──
@api_router.get("/tenant/deposit")
async def tenant_deposit(user=Depends(get_current_tenant)):
    lease = await db.leases.find_one({"tenantId": user["id"]}, NO_ID)
    return {
        "deposit": {
            "amount": lease["deposit"] if lease else 25000,
            "status": "held",
            "paidOn": lease["startDate"] if lease else "2025-01-01",
            "refundPolicy": "Deposit refunds are processed within 30 days of lease termination, subject to inspection and deduction of damages."
        }
    }

@api_router.post("/tenant/deposit/refund")
async def tenant_deposit_refund(request: Request, user=Depends(get_current_tenant)):
    body = await request.json()
    reason = body.get("reason", "")
    phone = body.get("phoneNumber", "")
    now = datetime.now(timezone.utc).isoformat()
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()), "tenantId": user["id"],
        "title": "Deposit Refund Requested", "message": f"Your refund request has been submitted. Reason: {reason}",
        "type": "payment", "read": False, "audience": "tenant",
        "broadcastId": None, "ticketId": None, "createdAt": now
    })
    return {"message": "Refund request submitted successfully"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
