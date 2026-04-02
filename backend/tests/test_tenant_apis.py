"""
Backend API tests for SmartRent Tenant Mobile App
Tests: Auth, Dashboard, Payments, Maintenance, Lease, Notifications, Deposit endpoints
"""
import pytest
import requests
import os
import time
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent


def get_backend_url():
    """Resolve API base URL from frontend/.env (repo root) or environment."""
    frontend_env = _REPO_ROOT / "frontend" / ".env"
    if frontend_env.is_file():
        with open(frontend_env) as f:
            for line in f:
                if line.startswith("EXPO_PUBLIC_BACKEND_URL="):
                    return line.split("=", 1)[1].strip().rstrip("/")
    return os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")


BASE_URL = get_backend_url()
if not BASE_URL:
    raise ValueError(
        "EXPO_PUBLIC_BACKEND_URL not found. Set it in frontend/.env or export EXPO_PUBLIC_BACKEND_URL."
    )

# Demo tenant credentials from seed data
TEST_EMAIL = "grace.muthoni@gmail.com"
TEST_PASSWORD = "password123"


@pytest.fixture(scope="session")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="session")
def auth_token(api_client):
    """Login and get auth token for subsequent tests"""
    response = api_client.post(f"{BASE_URL}/api/tenant/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"Auth failed: {response.status_code} - Cannot run authenticated tests")
    
    data = response.json()
    return data.get("token")


@pytest.fixture
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestHealthCheck:
    """Health check endpoint test"""
    
    def test_health_endpoint(self, api_client):
        """Test /api/health returns 200"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "ok"
        assert "timestamp" in data
        assert "services" in data
        assert data["services"]["database"] == "connected"


class TestTenantAuth:
    """Auth endpoint tests - POST /api/tenant/auth/login"""
    
    def test_login_success(self, api_client):
        """Test successful login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/tenant/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert "tenant" in data
        assert data["tenant"]["email"] == TEST_EMAIL
        assert data["tenant"]["name"] == "Grace Muthoni"
        assert "id" in data["tenant"]
    
    def test_login_invalid_email(self, api_client):
        """Test login with non-existent email"""
        response = api_client.post(f"{BASE_URL}/api/tenant/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "password123"
        })
        assert response.status_code == 401
        assert "detail" in response.json()
    
    def test_login_invalid_password(self, api_client):
        """Test login with wrong password"""
        response = api_client.post(f"{BASE_URL}/api/tenant/auth/login", json={
            "email": TEST_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401


class TestTenantDashboard:
    """Dashboard endpoint test - GET /api/tenant/dashboard"""
    
    def test_dashboard_requires_auth(self, api_client):
        """Test dashboard requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/tenant/dashboard")
        assert response.status_code == 401
    
    def test_dashboard_success(self, api_client, auth_headers):
        """Test dashboard returns tenant data"""
        response = api_client.get(f"{BASE_URL}/api/tenant/dashboard", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        # Verify structure
        assert "tenant" in data
        assert "unit" in data
        assert "lease" in data
        assert "payment" in data
        assert "stats" in data
        
        # Verify tenant info
        assert data["tenant"]["name"] == "Grace Muthoni"
        assert data["tenant"]["unitNumber"] == "A-12"
        
        # Verify payment info
        assert "currentMonthStatus" in data["payment"]
        assert "monthlyRent" in data["payment"]
        assert "totalPaid" in data["payment"]
        
        # Verify stats
        assert "openTickets" in data["stats"]
        assert "unreadNotifications" in data["stats"]


class TestTenantPayments:
    """Payment endpoints tests - GET /api/tenant/payments, POST /api/tenant/payments/initiate"""
    
    def test_payments_list_requires_auth(self, api_client):
        """Test payments list requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/tenant/payments")
        assert response.status_code == 401
    
    def test_payments_list_success(self, api_client, auth_headers):
        """Test GET payments returns payment history"""
        response = api_client.get(f"{BASE_URL}/api/tenant/payments", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "payments" in data
        assert isinstance(data["payments"], list)
        
        # Seed data should have 2 payments
        if len(data["payments"]) > 0:
            payment = data["payments"][0]
            assert "id" in payment
            assert "amount" in payment
            assert "status" in payment
            assert "month" in payment
            assert payment["tenantName"] == "Grace Muthoni"
    
    def test_payment_initiate_requires_auth(self, api_client):
        """Test payment initiation requires authentication"""
        response = api_client.post(f"{BASE_URL}/api/tenant/payments/initiate", json={
            "amount": 25000,
            "phoneNumber": "+254712345678"
        })
        assert response.status_code == 401
    
    def test_payment_initiate_success(self, api_client, auth_headers):
        """Test POST payment initiate (M-Pesa simulation)"""
        response = api_client.post(
            f"{BASE_URL}/api/tenant/payments/initiate",
            headers=auth_headers,
            json={
                "amount": 25000,
                "phoneNumber": "+254712345678"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "payment" in data
        assert "message" in data
        assert data["payment"]["status"] == "pending"
        assert data["payment"]["amount"] == 25000
        assert "checkoutRequestId" in data["payment"]
        
        # Wait for simulated M-Pesa callback (3 seconds)
        time.sleep(4)
        
        # Verify payment was confirmed
        payments_response = api_client.get(f"{BASE_URL}/api/tenant/payments", headers=auth_headers)
        payments = payments_response.json()["payments"]
        created_payment = next((p for p in payments if p["id"] == data["payment"]["id"]), None)
        assert created_payment is not None
        assert created_payment["status"] == "confirmed"
        assert created_payment["mpesaRef"] is not None


class TestTenantMaintenance:
    """Maintenance endpoints tests - GET /api/tenant/maintenance, POST /api/tenant/maintenance"""
    
    def test_maintenance_list_requires_auth(self, api_client):
        """Test maintenance list requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/tenant/maintenance")
        assert response.status_code == 401
    
    def test_maintenance_list_success(self, api_client, auth_headers):
        """Test GET maintenance returns tickets"""
        response = api_client.get(f"{BASE_URL}/api/tenant/maintenance", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "tickets" in data
        assert isinstance(data["tickets"], list)
        
        # Seed data should have 2 tickets
        if len(data["tickets"]) > 0:
            ticket = data["tickets"][0]
            assert "id" in ticket
            assert "title" in ticket
            assert "description" in ticket
            assert "status" in ticket
            assert "priority" in ticket
            assert "category" in ticket
    
    def test_maintenance_create_requires_auth(self, api_client):
        """Test ticket creation requires authentication"""
        response = api_client.post(f"{BASE_URL}/api/tenant/maintenance", json={
            "title": "Test Issue",
            "description": "Test description",
            "priority": "medium",
            "category": "General"
        })
        assert response.status_code == 401
    
    def test_maintenance_create_success(self, api_client, auth_headers):
        """Test POST maintenance creates ticket and verifies persistence"""
        # Create ticket
        create_response = api_client.post(
            f"{BASE_URL}/api/tenant/maintenance",
            headers=auth_headers,
            json={
                "title": "TEST_Broken Window",
                "description": "Living room window has crack",
                "priority": "high",
                "category": "Structural",
                "photos": []
            }
        )
        assert create_response.status_code == 200
        
        create_data = create_response.json()
        assert "ticket" in create_data
        assert "message" in create_data
        assert create_data["ticket"]["title"] == "TEST_Broken Window"
        assert create_data["ticket"]["status"] == "open"
        assert create_data["ticket"]["priority"] == "high"
        
        ticket_id = create_data["ticket"]["id"]
        
        # Verify ticket was persisted by fetching list
        list_response = api_client.get(f"{BASE_URL}/api/tenant/maintenance", headers=auth_headers)
        assert list_response.status_code == 200
        
        tickets = list_response.json()["tickets"]
        created_ticket = next((t for t in tickets if t["id"] == ticket_id), None)
        assert created_ticket is not None
        assert created_ticket["title"] == "TEST_Broken Window"
        assert created_ticket["description"] == "Living room window has crack"


class TestTenantLease:
    """Lease endpoint test - GET /api/tenant/lease"""
    
    def test_lease_requires_auth(self, api_client):
        """Test lease requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/tenant/lease")
        assert response.status_code == 401
    
    def test_lease_success(self, api_client, auth_headers):
        """Test GET lease returns lease agreement"""
        response = api_client.get(f"{BASE_URL}/api/tenant/lease", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "lease" in data
        
        lease = data["lease"]
        assert "id" in lease
        assert "tenantName" in lease
        assert "unitNumber" in lease
        assert "startDate" in lease
        assert "endDate" in lease
        assert "monthlyRent" in lease
        assert "status" in lease
        assert lease["tenantName"] == "Grace Muthoni"
        assert lease["unitNumber"] == "A-12"


class TestTenantNotifications:
    """Notifications endpoint test - GET /api/tenant/notifications"""
    
    def test_notifications_requires_auth(self, api_client):
        """Test notifications requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/tenant/notifications")
        assert response.status_code == 401
    
    def test_notifications_success(self, api_client, auth_headers):
        """Test GET notifications returns notification list"""
        response = api_client.get(f"{BASE_URL}/api/tenant/notifications", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "notifications" in data
        assert "unreadCount" in data
        assert isinstance(data["notifications"], list)
        
        # Seed data should have 5 notifications
        if len(data["notifications"]) > 0:
            notif = data["notifications"][0]
            assert "id" in notif
            assert "title" in notif
            assert "message" in notif
            assert "type" in notif
            assert "read" in notif
            assert "createdAt" in notif


class TestTenantDeposit:
    """Deposit endpoint test - GET /api/tenant/deposit"""
    
    def test_deposit_requires_auth(self, api_client):
        """Test deposit requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/tenant/deposit")
        assert response.status_code == 401
    
    def test_deposit_success(self, api_client, auth_headers):
        """Test GET deposit returns deposit info"""
        response = api_client.get(f"{BASE_URL}/api/tenant/deposit", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "deposit" in data
        
        deposit = data["deposit"]
        assert "amount" in deposit
        assert "status" in deposit
        assert "paidOn" in deposit
        assert "refundPolicy" in deposit
        assert deposit["amount"] == 25000
        assert deposit["status"] == "held"
