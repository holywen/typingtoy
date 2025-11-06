# Architecture Overview

This document provides a comprehensive overview of the Typing Toy application architecture, design decisions, and implementation details.

## Technology Stack

### Core Framework
- **Next.js 16.0.1** - React framework with App Router and Turbopack
  - Server-side rendering (SSR)
  - Static site generation (SSG)
  - API routes
  - File-based routing
  - Built-in optimization
  - Standalone output for Docker

- **React 19.2.0** - UI library
  - Component-based architecture
  - Hooks for state management
  - Server and client components
  - React 19 features

- **TypeScript 5** - Type-safe JavaScript
  - Strong typing throughout codebase
  - Better IDE support
  - Catch errors at compile time

### Styling & UI
- **Tailwind CSS 3.4** - Utility-first CSS
  - Rapid UI development
  - Consistent design system
  - Dark mode support
  - Responsive design utilities

- **Framer Motion 12.0** - Animation library
  - Smooth transitions
  - Gesture animations
  - Layout animations

- **Clsx & Tailwind Merge** - Utility class management
  - Dynamic className composition
  - Conflict resolution

### State Management
- **Zustand 5.0** - Lightweight state management
  - Simple and unopinionated
  - TypeScript support
  - Minimal boilerplate

- **React Hooks** - Built-in state management
  - `useState` for component state
  - `useEffect` for side effects
  - `useCallback` for memoized functions
  - `useRef` for DOM references
  - Custom hooks: `useLanguage()` in `/lib/i18n/LanguageContext.tsx`

### Data Visualization
- **Chart.js 4.4** - Charting library
  - Progress charts
  - Performance analytics
  - WPM trends

- **React Chart.js 2** - React wrapper
  - React-friendly API
  - TypeScript support

### Backend & Database
- **MongoDB 6.12** - NoSQL database
  - Flexible schema
  - Easy to scale
  - User data storage

- **Mongoose 8.9** - MongoDB ODM
  - Schema validation
  - Type safety
  - Middleware hooks

- **Redis 4.7** (Optional) - Caching layer
  - Session management
  - Performance optimization

### Authentication
- **NextAuth 5.0** (Beta 30) - Authentication solution
  - Email/password authentication with JWT
  - Google OAuth integration
  - Session management with role-based access
  - MongoDB adapter integration
  - First-user-becomes-admin logic

- **@auth/mongodb-adapter 3.11** - MongoDB integration
  - User data persistence
  - Session storage

- **Nodemailer 6.9** - SMTP email service
  - Email verification for new users
  - Verification token generation
  - SMTP/STARTTLS support
  - HTML email templates

- **bcryptjs 2.4** - Password hashing
  - Secure password storage (10 rounds)
  - Salt generation

- **Zod 3.24** - Schema validation
  - Input validation
  - Type-safe schemas

### Internationalization
- **Custom i18n System** - React Context-based
  - 6 languages supported
  - Dynamic language switching
  - Type-safe translations
  - Languages: English, Chinese, Japanese, Spanish, French, Thai

### Development Tools
- **ESLint 9** - Code linting
- **Autoprefixer** - CSS vendor prefixes
- **PostCSS 8** - CSS processing
- **Turbopack** - Fast bundler (Next.js 16)

## Project Structure

```
typingtoy/
├── app/                              # Next.js App Router
│   ├── api/                          # API routes
│   │   ├── auth/                     # NextAuth endpoints
│   │   │   ├── [...nextauth]/       # NextAuth API handler
│   │   │   ├── register/            # User registration
│   │   │   └── verify-email/        # Email verification API
│   │   ├── admin/                   # Admin API routes (protected)
│   │   │   ├── stats/               # Platform statistics
│   │   │   ├── statistics/          # Detailed analytics
│   │   │   ├── users/               # User management CRUD
│   │   │   └── rooms/               # Room management CRUD
│   │   ├── generate-text/           # Text generation API
│   │   │   └── route.ts             # Random text endpoint
│   │   └── user/                    # User data APIs
│   │       ├── sync/                # Progress sync
│   │       └── settings/            # User settings (GET/PATCH)
│   │
│   ├── admin/                       # Admin dashboard (role-protected)
│   │   ├── layout.tsx               # Admin layout with role check
│   │   ├── page.tsx                 # Admin dashboard
│   │   ├── users/                   # User management page
│   │   │   └── page.tsx
│   │   ├── rooms/                   # Room management page
│   │   │   └── page.tsx
│   │   └── statistics/              # Analytics dashboard
│   │       └── page.tsx
│   │
│   ├── auth/                        # Authentication pages
│   │   ├── signin/                  # Sign in page
│   │   │   └── page.tsx
│   │   ├── signup/                  # Sign up page
│   │   │   └── page.tsx
│   │   └── verify-email/            # Email verification page
│   │       └── page.tsx
│   │
│   ├── lessons/                     # Lessons feature
│   │   ├── page.tsx                 # Lessons list
│   │   ├── layout.tsx               # Lessons metadata (SEO)
│   │   └── [id]/                    # Dynamic lesson pages
│   │       ├── page.tsx             # Individual lesson
│   │       └── layout.tsx           # Dynamic metadata (SEO)
│   │
│   ├── test/                        # Speed test feature
│   │   ├── page.tsx                 # Speed test page
│   │   └── layout.tsx               # Test metadata (SEO)
│   │
│   ├── practice/                    # Custom practice feature
│   │   ├── page.tsx                 # Custom practice page
│   │   └── layout.tsx               # Practice metadata (SEO)
│   │
│   ├── progress/                    # Progress tracking
│   │   ├── page.tsx                 # Progress dashboard
│   │   └── layout.tsx               # Progress metadata (SEO)
│   │
│   ├── layout.tsx                   # Root layout (SEO, providers)
│   ├── page.tsx                     # Home page
│   ├── globals.css                  # Global styles
│   ├── sitemap.ts                   # Dynamic sitemap generator
│   └── robots.ts                    # Dynamic robots.txt
│
├── components/                      # Reusable React components
│   ├── TypingTest.tsx               # Main typing test component
│   ├── VirtualKeyboard.tsx          # Keyboard visualization
│   ├── HandDiagram.tsx              # Hand position guide
│   ├── LanguageSelector.tsx         # Language switcher dropdown
│   ├── UserMenu.tsx                 # User dropdown menu
│   ├── TipsBanner.tsx               # Tips for unregistered users
│   └── SessionProvider.tsx          # NextAuth provider wrapper
│
├── lib/                             # Business logic & utilities
│   ├── db/                          # Database layer
│   │   ├── mongodb.ts               # MongoDB connection
│   │   └── models/                  # Mongoose models
│   │       ├── User.ts              # User schema with role and settings (including language)
│   │       └── VerificationToken.ts # Email verification tokens
│   │
│   ├── admin.ts                     # Admin helper functions
│   ├── auth.ts                      # NextAuth configuration
│   │
│   ├── i18n/                        # Internationalization
│   │   ├── index.ts                 # i18n configuration
│   │   ├── LanguageContext.tsx      # React Context with DB sync for auth users
│   │   └── locales/                 # Translation files (68+ keys per language)
│   │       ├── en.ts                # English (includes admin translations)
│   │       ├── zh.ts                # Chinese (中文, includes admin translations)
│   │       ├── ja.ts                # Japanese (日本語, includes admin translations)
│   │       ├── es.ts                # Spanish (Español, includes admin translations)
│   │       ├── fr.ts                # French (Français, includes admin translations)
│   │       └── th.ts                # Thai (ไทย, includes admin translations)
│   │
│   ├── services/                    # Business logic
│   │   ├── typingMetrics.ts         # WPM/accuracy calculations
│   │   ├── progressStorage.ts       # Local storage progress
│   │   ├── userSettings.ts          # User settings management
│   │   └── emailService.ts          # SMTP email sending
│   │
│   ├── utils/                       # Helper functions
│   │   └── textGenerator.ts         # Random text generation
│   │
│   └── data/                        # Static data
│       ├── lessons.ts               # 15 lesson definitions
│       └── keyboardLayout.ts        # Keyboard layouts data
│
├── types/                           # TypeScript definitions
│   └── index.ts                     # Shared type definitions
│
├── public/                          # Static assets
│   ├── icon.svg                     # App icon (512x512)
│   ├── favicon.svg                  # Browser favicon (32x32)
│   ├── apple-touch-icon.svg         # iOS icon (180x180)
│   ├── manifest.json                # PWA manifest
│   └── robots.txt                   # Static robots.txt
│
├── docker compose.yml               # Docker Compose config
├── docker compose.prod.yml          # Production overrides
├── Dockerfile                       # Docker build config
├── docker-start.sh                  # Helper script
├── Makefile                         # Docker commands
│
├── next.config.ts                   # Next.js configuration
├── tailwind.config.ts               # Tailwind configuration
├── tsconfig.json                    # TypeScript configuration
├── .env.example                     # Environment template
├── .dockerignore                    # Docker ignore rules
│
├── package.json                     # Dependencies
├── README.md                        # Project overview
├── GETTING_STARTED.md               # Quick start guide
├── DOCKER_DEPLOYMENT.md             # Docker guide
├── QUICK_START.md                   # Quick start (Docker)
├── SEO_GUIDE.md                     # SEO documentation
└── ARCHITECTURE.md                  # This file
```

## Core Components

### 1. TypingTest Component
**File**: `components/TypingTest.tsx`

The main component that handles typing test logic:

**Features**:
- Real-time WPM calculation (Gross & Net)
- Character-by-character accuracy tracking
- Visual feedback (correct/incorrect)
- Sound effects (optional)
- Auto-scrolling (3-line display)
- Newline character support (↵)
- Multi-line textarea input
- Timer functionality
- Completion detection

**State Management**:
- `currentInput`: User's current input
- `startTime`: Test start timestamp
- `isCompleted`: Test completion status
- `metrics`: WPM and accuracy data

**Key Functions**:
- `handleInputChange()`: Process user keystrokes
- `handleKeyDown()`: Handle special keys (Enter, backspace)
- `calculateMetrics()`: Compute WPM/accuracy
- `renderText()`: Display text with color coding

### 2. VirtualKeyboard Component
**File**: `components/VirtualKeyboard.tsx`

Visual keyboard representation:
- Highlights current key to press
- Shows hand position
- Supports multiple layouts (QWERTY, Dvorak, Colemak)
- Color-coded key groups

### 3. HandDiagram Component
**File**: `components/HandDiagram.tsx`

Displays proper hand positioning:
- Left hand: ASDF keys
- Right hand: JKL; keys
- Finger assignment visualization
- Translated labels (i18n)

### 4. LanguageSelector Component
**File**: `components/LanguageSelector.tsx`

Language switcher dropdown:
- Displays all 6 languages
- Native name display (中文, 日本語, etc.)
- Current language indicator
- Saves preference to local storage
- Updates entire UI dynamically

### 5. UserMenu Component
**File**: `components/UserMenu.tsx`

User account dropdown:
- Sign in/Sign up links
- User profile display
- Progress sync button
- Sign out option
- NextAuth session integration

### 6. TipsBanner Component
**File**: `components/TipsBanner.tsx`

Promotional banner for unregistered users:
- Benefits of creating account
- Dismissible
- Only shows for non-authenticated users
- Translated content

## Admin System Architecture

### Role-Based Access Control

**User Roles**:
- `user`: Default role for regular users
- `admin`: Administrative role with full access

**Role Assignment**:
- First user registered in the system automatically becomes `admin`
- Subsequent users default to `user` role
- OAuth users (Google) follow same first-user logic
- Role stored in User model and propagated to JWT token and session

**Implementation**:
- Role field added to User model (`lib/db/models/User.ts`)
- JWT callback adds role to token (`lib/auth.ts`)
- Session callback exposes role to client
- Admin routes protected via layout component (`app/admin/layout.tsx`)

### Admin Dashboard Components

**AdminLayout** (`app/admin/layout.tsx`)
- Client component with session-based authentication
- Checks user role before rendering admin pages
- Redirects unauthenticated users to sign-in
- Redirects non-admin users to home page
- Includes navigation sidebar and header
- Fully internationalized with i18n support

**Dashboard Pages** (All fully translated in 6 languages):
1. **Dashboard** (`app/admin/page.tsx`) - Overview with key metrics
2. **Users** (`app/admin/users/page.tsx`) - User management with search/filter
3. **Rooms** (`app/admin/rooms/page.tsx`) - Multiplayer room monitoring
4. **Statistics** (`app/admin/statistics/page.tsx`) - Analytics with Chart.js

**Admin API Routes**:
- `/api/admin/stats` - Platform statistics (user count, room count)
- `/api/admin/statistics` - Detailed analytics with aggregation pipelines
- `/api/admin/users` - CRUD operations for user management
- `/api/admin/rooms` - Room management operations

All admin API routes check session and role before processing requests.

### Email Verification System

**VerificationToken Model** (`lib/db/models/VerificationToken.ts`)
- Stores verification tokens with expiration (24 hours)
- Uses MongoDB TTL index for automatic cleanup
- Fields: `userId`, `token`, `expires`
- Unique index on token for fast lookups

**Email Service** (`lib/services/emailService.ts`)
- Nodemailer-based SMTP email sending
- Supports STARTTLS (port 587) and SSL/TLS (port 465)
- HTML email templates with verification links
- Functions:
  - `sendVerificationEmail()`: Send token to user
  - `generateVerificationToken()`: Create random token
  - Token format: 32-byte random hex string

**Verification Flow**:
1. User registers → Token created → Email sent
2. User clicks link → GET `/api/auth/verify-email?token=xxx`
3. API verifies token → Updates `emailVerified` field → Deletes token
4. User redirected to success page
5. User can now sign in

**Special Cases**:
- First user (admin): Email auto-verified, no token sent
- OAuth users: Email auto-verified via provider
- Expired tokens: Automatically deleted by MongoDB TTL index

### SEO Protection for Admin Pages

**robots.txt Configuration**:
- Admin pages excluded from crawling (`/admin/*`)
- API routes blocked (`/api/*`)
- Auth pages blocked (`/auth/*`)

**Meta Tags**:
- Admin layout includes `noindex, nofollow` meta tags
- Prevents search engines from indexing admin content
- Implemented via Next.js Head component

## Data Flow

### 1. Typing Test Flow

```
User Input (Keystroke)
    ↓
handleInputChange()
    ↓
Update currentInput state
    ↓
Compare with targetText
    ↓
Calculate metrics (WPM, accuracy)
    ↓
Update UI with color feedback
    ↓
Auto-scroll if needed
    ↓
Check completion
    ↓
Save progress (if lesson)
```

### 2. Progress Tracking Flow

```
Complete Exercise/Test
    ↓
Create TypingSession object
    ↓
Save to localStorage
    ↓
If authenticated:
    ↓
Send to MongoDB via API
    ↓
Update progress charts
```

### 3. Authentication Flow

**Registration with Email Verification**:
```
User submits registration form
    ↓
Client-side validation (Zod)
    ↓
POST to /api/auth/register
    ↓
Check if first user (admin logic)
    ↓
bcrypt hash password (10 rounds)
    ↓
Create user in MongoDB
    ↓
If first user:
    Set role=admin, emailVerified=now
    → Auto sign-in → Redirect home
    ↓
If regular user:
    Generate verification token (32-byte hex)
    → Save to VerificationToken collection (24h expiry)
    → Send email via Nodemailer
    → Redirect to verify-email page
    ↓
User clicks email link
    ↓
GET /api/auth/verify-email?token=xxx
    ↓
Verify token exists and not expired
    ↓
Update user.emailVerified = now
    ↓
Delete verification token
    ↓
Redirect to success page
    ↓
User can now sign in
```

**Sign In Flow**:
```
User submits credentials
    ↓
POST to NextAuth credentials provider
    ↓
Verify email is verified
    ↓
bcrypt compare password
    ↓
JWT token creation (includes role)
    ↓
Session creation (includes role)
    ↓
Redirect to home
```

**OAuth Flow (Google)**:
```
User clicks "Sign in with Google"
    ↓
OAuth redirect to Google
    ↓
User authorizes
    ↓
Callback to /api/auth/callback/google
    ↓
Check if first user → Set role=admin
    ↓
Auto-verify email (OAuth provider verified)
    ↓
Create/update user in MongoDB
    ↓
Create session with role
    ↓
Redirect to home
```

### 4. i18n Flow

**Language Selection**:
```
User selects language
    ↓
LanguageContext.setLanguage()
    ↓
Update localStorage (immediate persistence)
    ↓
If authenticated:
    → POST to /api/user/settings (save to database)
    ↓
Load translation file (e.g., th.ts)
    ↓
Re-render all components
    ↓
Display translated text
```

**Language Loading on Page Load**:
```
LanguageContext initializes
    ↓
Check NextAuth session status
    ↓
If authenticated:
    → Fetch language from database (GET /api/user/settings)
    → If successful, use database language
    ↓
If unauthenticated or fetch fails:
    → Load language from localStorage
    ↓
Apply translation file
    ↓
Render UI with selected language
```

### 5. Admin Dashboard Flow

```
Admin navigates to /admin
    ↓
AdminLayout component loads
    ↓
Check NextAuth session
    ↓
If not authenticated → Redirect to /auth/signin
    ↓
If authenticated but role !== 'admin' → Redirect to /
    ↓
If admin:
    ↓
Render admin navigation sidebar
    ↓
Load requested admin page (users/rooms/statistics)
    ↓
Page fetches data from admin API routes
    ↓
API routes verify session and admin role
    ↓
Query MongoDB (with aggregation if needed)
    ↓
Return data as JSON
    ↓
Render tables/charts with data
    ↓
Admin performs actions (edit user, delete room, etc.)
    ↓
API route processes action
    ↓
Return success/error
    ↓
Refresh page data
```

## API Routes

### 1. NextAuth API
**Route**: `/api/auth/[...nextauth]`

Handles all authentication:
- Sign in (credentials)
- Sign in (OAuth)
- Sign out
- Session management
- Token refresh

### 2. User Registration
**Route**: `/api/auth/register`

New user registration:
- Validates input (Zod)
- Checks if first user (admin assignment)
- Hashes password (bcryptjs, 10 rounds)
- Creates MongoDB user
- If first user: auto-verifies email, returns user data
- If regular user: generates verification token, sends email
- Returns success/error

### 3. Email Verification
**Route**: `/api/auth/verify-email`

Email verification endpoint:
- **POST**: Verify token programmatically
- **GET**: Verify token from email link (redirects to UI)
- Checks token validity and expiration
- Updates user.emailVerified field
- Deletes verification token
- Returns success/error (POST) or redirects (GET)

### 4. Admin Statistics
**Route**: `/api/admin/stats`

Platform statistics for admin dashboard:
- Requires admin role
- Returns: total users, total rooms, active rooms, recent users
- Protected by session and role check

### 5. Admin Analytics
**Route**: `/api/admin/statistics`

Detailed platform analytics:
- Requires admin role
- Uses MongoDB aggregation pipelines
- Returns: user growth, game type distribution, peak hours
- Chart-ready data format

### 6. Admin User Management
**Route**: `/api/admin/users`

User CRUD operations:
- **GET**: List all users with pagination/search
- **PUT**: Update user (role, status)
- **DELETE**: Delete user
- Protected by admin role

### 7. Admin Room Management
**Route**: `/api/admin/rooms`

Room management operations:
- **GET**: List all multiplayer rooms
- **DELETE**: Delete/close room
- Protected by admin role

### 8. Text Generation
**Route**: `/api/generate-text`

Generates random typing text:
- Query params: `minWords`, `maxWords`
- Returns: text, wordCount, timestamp
- Copyright-free content

### 9. User Sync
**Route**: `/api/user/sync`

Syncs local progress to cloud:
- Requires authentication
- Merges local + cloud data
- Returns updated progress

### 10. User Settings
**Route**: `/api/user/settings`

Manages user settings (keyboard layout, language, etc.):
- **GET**: Retrieve user settings from database
- **PATCH**: Update user settings (partial update)
- Requires authentication
- Syncs language preference to database for authenticated users
- Returns updated settings

## State Management Strategy

### Local State (React Hooks)
- Component-level state (`useState`)
- Temporary UI state
- Form inputs
- Modal visibility

### Context State (React Context)
- Language preferences (LanguageContext)
- Authentication session (SessionProvider)
- Global theme (future)

### Persistent State (localStorage)
- User settings (keyboard layout, language)
- Progress data (lessons, tests)
- Last position (lesson, exercise)
- Typing history
- Fallback for unauthenticated users

### Server State (MongoDB)
- User accounts with settings (keyboard layout, language, sound)
- Authenticated user progress
- Language preference (synced across devices)
- Achievement data (future)
- Leaderboard data (future)

### State Management (Zustand)
- Not heavily used currently
- Available for global state needs
- TypeScript-friendly
- DevTools support

## Metrics Calculation

### WPM (Words Per Minute)

**Gross WPM**:
```typescript
grossWPM = (totalCharacters / 5) / (timeInSeconds / 60)
```

**Net WPM**:
```typescript
netWPM = grossWPM - (errors / (timeInSeconds / 60))
```

### Accuracy

```typescript
accuracy = (correctCharacters / totalCharacters) * 100
```

### Implementation
**File**: `lib/services/typingMetrics.ts`

## SEO Architecture

### Metadata Strategy
- Root layout: Site-wide defaults
- Page layouts: Page-specific metadata
- Dynamic routes: Generated metadata

### SEO Files
- `app/sitemap.ts`: Dynamic sitemap (all pages + lessons)
- `app/robots.ts`: Dynamic robots.txt
- `public/robots.txt`: Static fallback
- `public/manifest.json`: PWA manifest

### Meta Tags Coverage
- Title templates (`%s | Typing Toy`)
- Meta descriptions (150-160 chars)
- Keywords (relevant to each page)
- Open Graph (Facebook, LinkedIn)
- Twitter Cards
- Canonical URLs

## Internationalization (i18n) Architecture

### Custom i18n System
Unlike using heavy libraries like i18next, we built a lightweight custom system:

**Advantages**:
- Type-safe translations
- No bundle bloat
- React Context integration with NextAuth
- Simple API (`t.home.title`)
- Easy to maintain
- Database persistence for authenticated users
- LocalStorage fallback for unauthenticated users
- Cross-device language sync for authenticated users

**Structure**:
```typescript
// Each locale file (e.g., en.ts)
export default {
  common: { home: 'Home', backToHome: 'Back to Home', ... },
  lessons: { title: 'Lessons', ... },
  admin: { dashboard: 'Dashboard', users: 'Users', ... }, // 68+ admin keys
  // ...
} as const;

// Type inference
export type Translation = typeof en;
```

**Usage**:
```tsx
const { t } = useLanguage();
<h1>{t.home.title}</h1>
<button>{t.common.backToHome}</button>
<h2>{t.admin.dashboard}</h2>
```

**Language Persistence**:
- **Authenticated Users**: Language preference saved to User model in MongoDB
- **Unauthenticated Users**: Language preference saved to localStorage only
- **Loading Priority**: Database → localStorage → Default ('en')
- **Saving Strategy**: Always save to localStorage for immediate effect, also save to database if authenticated

**Supported Languages** (6 total):
1. English (en) - Default
2. Chinese (zh) - 中文
3. Spanish (es) - Español
4. French (fr) - Français
5. Japanese (ja) - 日本語
6. Thai (th) - ไทย

**Translation Coverage**:
- Common UI elements
- Lessons and exercises
- Progress tracking
- Admin dashboard (68+ keys per language)
- User settings
- Authentication pages
- Error messages

## Docker Architecture

### Multi-stage Build
1. **deps**: Install production dependencies
2. **builder**: Build Next.js app
3. **runner**: Run production server

### Services
- **app**: Next.js application (port 3000)
- **mongodb**: MongoDB database (port 27017)
- **redis** (optional): Caching layer
- **mongo-express** (optional): DB admin UI

### Networking
- Internal network: `typingtoy-network`
- Persistent volumes: `mongodb-data`, `redis-data`

### Environment
- Development: `docker compose.yml`
- Production: `docker compose.prod.yml`

## Performance Optimizations

### Build Optimizations
- Turbopack for fast builds
- Standalone output for Docker
- Tree shaking
- Code splitting
- Image optimization (future)

### Runtime Optimizations
- React 19 automatic batching
- Memoization (`useCallback`, `useMemo`)
- Virtual scrolling (future, for large lists)
- Lazy loading (routes)
- Font optimization

### Caching Strategy
- Static assets: CDN (production)
- API responses: Redis (optional)
- MongoDB queries: Indexes
- Client-side: localStorage

## Security Measures

### Authentication
- Password hashing (bcrypt, 10 rounds)
- Email verification for new users (SMTP tokens)
- Verification token expiration (24 hours)
- Automatic token cleanup (MongoDB TTL indexes)
- Secure session cookies (JWT)
- CSRF protection (NextAuth)
- HTTPOnly cookies
- Same-site cookie policy

### Role-Based Authorization
- Role stored in JWT token and session
- Admin routes protected at layout level
- Admin API routes verify role before processing
- Non-admin users blocked from admin pages
- First-user-becomes-admin prevents lockout

### Input Validation
- Zod schema validation (client and server)
- Server-side validation for all inputs
- SQL injection prevention (Mongoose ODM)
- XSS prevention (React escaping)
- Email format validation
- Token format validation

### Email Security
- SMTP with STARTTLS/SSL support
- Environment-based email credentials
- HTML email sanitization
- Verification link expiration
- Rate limiting (future)

### SEO Security
- Admin pages blocked from search engines
- API routes excluded from robots.txt
- Noindex meta tags on admin pages
- No sensitive data in public routes

### Environment Variables
- Never commit `.env` files
- Use `.env.example` templates
- Validate required env vars (SMTP, MongoDB, etc.)
- Separate dev/prod configs
- Secure storage of SMTP credentials

## Testing Strategy (Future)

### Unit Tests
- Component tests (Jest, React Testing Library)
- Service/utility tests
- Metrics calculation tests

### Integration Tests
- API route tests
- Database operation tests
- Auth flow tests

### E2E Tests
- Typing test flow (Playwright)
- User registration flow
- Progress tracking flow

## Deployment

### Docker Deployment (Recommended)
```bash
docker compose up -d
```

### Vercel Deployment (Alternative)
- Automatic CI/CD
- Edge functions
- Preview deployments
- Environment variables via dashboard

### Self-Hosted
- Standalone Next.js server
- MongoDB instance
- Redis instance (optional)
- Nginx reverse proxy
- SSL certificate (Let's Encrypt)

## Future Architectural Improvements

### Microservices (Possible)
- User service (auth, profiles)
- Typing service (lessons, tests)
- Analytics service (stats, charts)
- Notification service (achievements)

### Real-time Features
- WebSockets for multiplayer
- Live leaderboards
- Real-time typing races
- Presence indicators

### Advanced Caching
- Redis query caching
- CDN for static assets
- Service workers (PWA)
- Stale-while-revalidate

### Database Optimization
- Read replicas (MongoDB)
- Sharding (future scale)
- Query optimization
- Index strategy

---

**Last Updated**: January 2025
**Version**: 2.2
**Next.js**: 16.0.1
**React**: 19.2.0
**Major Features**: Admin Dashboard, Email Verification, Role-Based Access Control, Full i18n with Database Persistence
