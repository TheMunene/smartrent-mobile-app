# SmartRent Tenant Mobile App - PRD

## Overview
SmartRent is a tenant management mobile app for Kenyan property tenants. Built with React Native Expo (frontend) and FastAPI (backend) with MongoDB.

## Tech Stack
- **Frontend**: React Native Expo (SDK 54), Expo Router, Axios
- **Backend**: FastAPI (Python), MongoDB, JWT auth, bcrypt
- **Fonts**: PlusJakartaSans_700Bold (headers), DMSans (body)
- **Colors**: Primary #064E3B, Accent #34D399

## Screens Implemented
1. **Auth Screen** (`/index.tsx`) - Login + "Coming Soon" Find a Home toggle
2. **Home Dashboard** (`/(app)/(home)/index.tsx`) - Gradient rent card, quick actions, active tickets, recent payments, notification bell
3. **Notices** (`/(app)/(home)/notices.tsx`) - Notification list with read/unread states
4. **Pay Rent** (`/(app)/(home)/pay-rent.tsx`) - M-Pesa payment form with amount, summary
5. **Tickets List** (`/(app)/(tickets)/index.tsx`) - List of maintenance tickets with status badges
6. **Create Ticket** (`/(app)/(tickets)/create.tsx`) - Category pills, priority selector, photo upload
7. **Docs Hub** (`/(app)/(docs)/index.tsx`) - Lease card, payment receipts, notices
8. **Lease Signing** (`/(app)/(docs)/lease.tsx`) - Document viewer, signature canvas, agreement checkbox
9. **Deposit** (`/(app)/(docs)/deposit.tsx`) - Deposit info card, refund request form
10. **Settings/More** (`/(app)/(more)/index.tsx`) - Profile, Account/Tenancy/Support sections

## API Endpoints (All prefixed with /api)
- `POST /tenant/auth/login` - Tenant login
- `POST /tenant/auth/activate` - Activate account
- `GET /tenant/auth/me` - Current session
- `GET /tenant/dashboard` - Dashboard data
- `GET /tenant/payments` - Payment history
- `POST /tenant/payments/initiate` - M-Pesa payment (SIMULATED)
- `GET /tenant/maintenance` - Tickets list
- `POST /tenant/maintenance` - Create ticket
- `GET /tenant/maintenance/:id` - Ticket detail
- `GET /tenant/lease` - Lease info
- `POST /tenant/lease/sign` - Sign lease
- `GET /tenant/notifications` - Notifications
- `PUT /tenant/notifications/:id/read` - Mark read
- `PUT /tenant/notifications/read-all` - Mark all read
- `GET /tenant/profile` - Profile
- `PUT /tenant/profile` - Update profile
- `PUT /tenant/profile/password` - Change password
- `GET /tenant/deposit` - Deposit info
- `POST /tenant/deposit/refund` - Request refund
- `GET /realtime/events` - SSE endpoint
- `GET /health` - Health check

## Demo Credentials
- Email: grace.muthoni@gmail.com
- Password: password123

## Navigation
Bottom tabs: Home | Tickets | Docs | More

## Notes
- M-Pesa payment is SIMULATED (auto-confirms after 3 seconds)
- SSE real-time endpoint exists but events are simulated
- Chat tab intentionally skipped per user request
