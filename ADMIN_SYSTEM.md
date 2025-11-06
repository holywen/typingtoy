# Admin System Documentation

## Overview

The Typing Toy admin system provides a comprehensive backend interface for managing users, rooms, and viewing platform statistics.

## Features Implemented

### 1. User Role System
- Added `role` field to User model (`user` | `admin`)
- Default role is `user`
- Admin helpers in `lib/admin.ts`

### 2. Admin Authentication
- Admin middleware (`lib/admin.ts`) checks user permissions
- API route `/api/admin/check` verifies admin status
- Protected routes redirect non-admin users

### 3. Admin Dashboard Layout
- File: `app/admin/layout.tsx`
- Features:
  - Admin header with branding
  - Sidebar navigation
  - Protected routing
  - Session management

### 4. Dashboard Pages
- **Main Dashboard** (`app/admin/page.tsx`)
  - Platform statistics overview
  - Quick action links
  - Real-time stats display

## File Structure

```
typingtoy/
├── lib/
│   ├── admin.ts                     # Admin helper functions
│   └── db/models/User.ts            # Updated with role field
├── app/
│   ├── admin/
│   │   ├── layout.tsx               # Admin layout wrapper
│   │   ├── page.tsx                 # Main dashboard
│   │   ├── users/                   # User management (to implement)
│   │   ├── rooms/                   # Room management (to implement)
│   │   └── statistics/              # Statistics page (to implement)
│   └── api/
│       └── admin/
│           ├── check/route.ts       # Admin auth check
│           ├── stats/route.ts       # Dashboard stats (to implement)
│           ├── users/route.ts       # User management API (to implement)
│           └── rooms/route.ts       # Room management API (to implement)
```

## Remaining Implementation Tasks

### 1. API Routes to Create

#### `/api/admin/stats/route.ts`
```typescript
// Returns platform statistics
GET /api/admin/stats
Response: {
  totalUsers: number;
  totalRooms: number;
  activeRooms: number;
  onlineUsers: number;
}
```

#### `/api/admin/users/route.ts`
```typescript
// List all users with pagination
GET /api/admin/users?page=1&limit=20&search=email
// Update user (change role, ban, etc.)
PATCH /api/admin/users/:id
// Delete user
DELETE /api/admin/users/:id
```

#### `/api/admin/rooms/route.ts`
```typescript
// List all rooms
GET /api/admin/rooms?page=1&limit=20&status=active
// Get room details
GET /api/admin/rooms/:id
// Delete room
DELETE /api/admin/rooms/:id
```

### 2. Admin Pages to Create

#### `app/admin/users/page.tsx`
Features needed:
- User list table with pagination
- Search and filter functionality
- User details modal
- Edit user role (promote to admin, demote)
- Ban/unban user functionality
- Delete user with confirmation
- View user activity and statistics

#### `app/admin/rooms/page.tsx`
Features needed:
- Room list table with status indicators
- Filter by game type and status
- View room details (players, settings)
- Force close/delete rooms
- Room activity history

#### `app/admin/statistics/page.tsx`
Features needed:
- Charts for user growth
- Game activity metrics
- Peak usage times
- Popular game modes
- Average session duration
- User engagement metrics

### 3. Components to Create

#### `components/admin/UserTable.tsx`
- Reusable user list component
- Sortable columns
- Actions dropdown

#### `components/admin/RoomTable.tsx`
- Reusable room list component
- Status badges
- Quick actions

#### `components/admin/StatsCard.tsx`
- Reusable statistics card
- Icon support
- Trend indicators

### 4. Redis Integration for Real-time Stats

Connect to Redis to get:
- Online users count
- Active rooms count
- Current game sessions

## How to Create an Admin User

### Method 1: Database Console (Development)
```javascript
// Using MongoDB shell or Compass
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

### Method 2: Create Admin Script
Create `scripts/create-admin.ts`:

```typescript
import mongoose from 'mongoose';
import User from '../lib/db/models/User';

async function createAdmin(email: string) {
  await mongoose.connect(process.env.MONGODB_URI!);

  const user = await User.findOne({ email });
  if (!user) {
    console.log('User not found');
    return;
  }

  user.role = 'admin';
  await user.save();
  console.log(`User ${email} is now an admin`);

  await mongoose.disconnect();
}

const email = process.argv[2];
if (!email) {
  console.log('Usage: ts-node scripts/create-admin.ts <email>');
  process.exit(1);
}

createAdmin(email);
```

Run: `npx ts-node scripts/create-admin.ts admin@example.com`

### Method 3: API Endpoint (First Time Setup)
Create a one-time setup route protected by environment variable:

```typescript
// app/api/admin/setup/route.ts
export async function POST(request: Request) {
  if (process.env.ADMIN_SETUP_KEY !== request.headers.get('x-setup-key')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { email } = await request.json();
  await connectDB();

  const user = await User.findOne({ email });
  if (user) {
    user.role = 'admin';
    await user.save();
  }

  return NextResponse.json({ success: true });
}
```

## Access Control

### Admin Route Protection
All admin routes are protected by:
1. NextAuth session check
2. Admin role verification in middleware
3. API endpoints check admin status before operations

### Security Best Practices
- Always verify admin status server-side
- Use CSRF protection for state-changing operations
- Log all admin actions for audit trail
- Implement rate limiting on admin API endpoints
- Require re-authentication for sensitive operations

## UI Features

### Sidebar Navigation
- Dashboard (📊)
- Users (👥)
- Rooms (🎮)
- Statistics (📈)

### Header
- Platform branding
- Admin badge indicator
- User info display
- Exit admin link

### Theme Support
- Full dark mode support
- Responsive design
- Tailwind CSS styling

## Testing Admin Features

1. Create a test admin user
2. Sign in and navigate to `/admin`
3. Verify access to all admin pages
4. Test user management operations
5. Test room management operations
6. Verify non-admin users cannot access

## Next Steps

1. Implement API routes for stats, users, and rooms
2. Create user management page with full CRUD operations
3. Create room management page
4. Add statistics and analytics page
5. Implement audit logging system
6. Add email notifications for admin actions
7. Create admin activity dashboard
8. Add bulk operations for users
9. Implement advanced filtering and search
10. Add export functionality (CSV, JSON)

## Environment Variables

Add to `.env.local`:
```
# Admin Setup (optional, for one-time admin creation)
ADMIN_SETUP_KEY=your-secret-setup-key-here
```

## Security Considerations

1. **Role Escalation**: Prevent users from changing their own role
2. **Audit Trail**: Log all admin actions
3. **Two-Factor Auth**: Consider requiring 2FA for admin accounts
4. **Session Timeout**: Implement shorter session timeout for admin routes
5. **IP Whitelist**: Consider restricting admin access by IP (production)

## Future Enhancements

- Multi-level admin roles (super admin, moderator)
- Permission-based access control
- Admin action approval workflow
- Automated user moderation tools
- Content moderation features
- Advanced analytics and reporting
- API rate limiting management
- System health monitoring
- Database backup management
