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
  - Email/password authentication
  - Google OAuth (configured)
  - Session management
  - MongoDB adapter integration

- **@auth/mongodb-adapter 3.11** - MongoDB integration
  - User data persistence
  - Session storage

- **bcryptjs 2.4** - Password hashing
  - Secure password storage
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
│   │   │   └── register/            # User registration
│   │   ├── generate-text/           # Text generation API
│   │   │   └── route.ts             # Random text endpoint
│   │   └── user/                    # User data APIs
│   │       └── sync/                # Progress sync
│   │
│   ├── auth/                        # Authentication pages
│   │   ├── signin/                  # Sign in page
│   │   │   └── page.tsx
│   │   └── signup/                  # Sign up page
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
│   │       └── User.ts              # User schema
│   │
│   ├── i18n/                        # Internationalization
│   │   ├── index.ts                 # i18n configuration
│   │   ├── LanguageContext.tsx      # React Context provider
│   │   └── locales/                 # Translation files
│   │       ├── en.ts                # English
│   │       ├── zh.ts                # Chinese (中文)
│   │       ├── ja.ts                # Japanese (日本語)
│   │       ├── es.ts                # Spanish (Español)
│   │       ├── fr.ts                # French (Français)
│   │       └── th.ts                # Thai (ไทย)
│   │
│   ├── services/                    # Business logic
│   │   ├── typingMetrics.ts         # WPM/accuracy calculations
│   │   ├── progressStorage.ts       # Local storage progress
│   │   └── userSettings.ts          # User settings management
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

```
User submits form
    ↓
Client-side validation (Zod)
    ↓
POST to /api/auth/register or signin
    ↓
Server validates credentials
    ↓
bcrypt password check/hash
    ↓
NextAuth session creation
    ↓
MongoDB session storage
    ↓
Redirect to dashboard
```

### 4. i18n Flow

```
User selects language
    ↓
LanguageContext.setLanguage()
    ↓
Update localStorage
    ↓
Load translation file (e.g., th.ts)
    ↓
Re-render all components
    ↓
Display translated text
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
- Hashes password (bcryptjs)
- Creates MongoDB user
- Returns success/error

### 3. Text Generation
**Route**: `/api/generate-text`

Generates random typing text:
- Query params: `minWords`, `maxWords`
- Returns: text, wordCount, timestamp
- Copyright-free content

### 4. User Sync
**Route**: `/api/user/sync`

Syncs local progress to cloud:
- Requires authentication
- Merges local + cloud data
- Returns updated progress

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

### Server State (MongoDB)
- User accounts
- Authenticated user progress
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
- React Context integration
- Simple API (`t.home.title`)
- Easy to maintain

**Structure**:
```typescript
// Each locale file (e.g., en.ts)
export default {
  common: { home: 'Home', ... },
  lessons: { title: 'Lessons', ... },
  // ...
} as const;

// Type inference
export type Translation = typeof en;
```

**Usage**:
```tsx
const { t } = useLanguage();
<h1>{t.home.title}</h1>
```

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
- Secure session cookies
- CSRF protection (NextAuth)
- HTTPOnly cookies
- Same-site cookie policy

### Input Validation
- Zod schema validation
- Server-side validation
- SQL injection prevention (Mongoose)
- XSS prevention (React escaping)

### Environment Variables
- Never commit `.env` files
- Use `.env.example` templates
- Validate required env vars
- Separate dev/prod configs

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

**Last Updated**: November 2025
**Version**: 2.0
**Next.js**: 16.0.1
**React**: 19.2.0
