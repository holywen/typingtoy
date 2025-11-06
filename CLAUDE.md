# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Development server (runs on http://localhost:3000)
npm run dev

# Production build
npm run build

# Run production server (must build first)
npm run start

# Linting
npm run lint
```

## Code Architecture

### Next.js 16 App Router Structure

This project uses Next.js 16 with the App Router pattern. The routing is file-based in the `app/` directory:

- `app/page.tsx` - Home page
- `app/test/page.tsx` - Speed test with randomized texts
- `app/lessons/page.tsx` - Lessons list page
- `app/lessons/[id]/page.tsx` - Individual lesson with sub-exercises (dynamic route)
- `app/practice/page.tsx` - Custom practice page with preset texts
- `app/progress/page.tsx` - User progress tracking and statistics
- `app/admin/*` - Admin dashboard (role-protected, fully internationalized)
- `app/multiplayer/*` - Multiplayer features with leaderboard
- `app/auth/*` - Authentication pages (sign in, sign up, email verification)

All page components are client components (`'use client'`) since they require interactivity.

### Core Typing Mechanics

**TypingTest Component** (`components/TypingTest.tsx`)

The main typing interface that handles:
- Keystroke capture and validation in real-time
- Visual feedback (green for correct, red for errors)
- WPM and accuracy calculation via `lib/services/typingMetrics.ts`
- Session state management with React hooks
- Integration with VirtualKeyboard and HandDiagram components
- `onStart` callback - Triggers when user presses first key (used for resume position tracking)

Key implementation details:
- Uses `performance.now()` for precise timing
- Stats update every 1 second (not every keystroke) for performance
- Tracks every keystroke with timestamp in the session object
- Supports backspace for error correction (marks keystroke as "corrected")

**Typing Metrics Service** (`lib/services/typingMetrics.ts`)

Industry-standard calculations:
- **Gross WPM**: `(totalChars / 5) / timeElapsedMinutes` (raw speed)
- **Net WPM**: `grossWPM - (uncorrectedErrors / timeElapsedMinutes)` (adjusted for errors)
- **Accuracy**: `(correctChars / totalChars) × 100`

The "word" unit is standardized at 5 characters per the typing industry standard.

### Lessons System

**Lesson Data** (`lib/data/lessons.ts`)

15 progressive lessons are defined as static data (not in database yet). Each lesson contains:
- Multiple sub-exercises (6+ exercises per lesson)
- Exercise types: `new_key`, `key_practice`, `word`, `extra_key`, `extra_word`
- Focus keys for the lesson
- Difficulty level and estimated time

**Lesson Pages** (`app/lessons/[id]/page.tsx`)

Dynamic lesson pages support:
- Exercise navigation (Next/Previous buttons)
- Progress tracking per exercise
- Completion status for each exercise
- Saving results to localStorage via `progressStorage` service

### Data Persistence

**Hybrid Implementation** (Client-side + Server-side):

**LocalStorage** (`lib/services/progressStorage.ts`):
- Max 100 recent sessions stored locally
- Stores metrics, timestamps, lesson/exercise IDs
- Provides statistics, trends, export/import functionality
- Fallback for unauthenticated users
- **Resume functionality**: Tracks user's last position (lesson ID + exercise index)
  - `saveLastPosition()` - Saves current position only when user starts typing (presses first key)
  - `getLastPosition()` - Retrieves last saved position for resume feature
  - Home page "Start/Resume Typing" button automatically resumes from last position
  - Position is saved lazily: only when user actually starts an exercise, not just by viewing it

**Database (MongoDB)** - Fully Implemented:
- `User.ts` - User accounts with role-based access (user/admin)
  - Settings: keyboard layout, sound enabled, **language preference**
  - First user automatically becomes admin
  - Email verification with 24-hour expiring tokens
- `Progress.ts` - User progress history (synced from localStorage)
- `VerificationToken.ts` - Email verification tokens with TTL index

**Authentication** (`lib/auth.ts`) - Fully Implemented:
- NextAuth.js 5.0 (Beta 30) with JWT sessions
- Email/password authentication with bcrypt hashing (10 rounds)
- Google OAuth integration
- Email verification via Nodemailer (SMTP)
- Role-based access control (user/admin)
- Session management with role propagation

**User Settings Sync** (`/api/user/settings`):
- GET: Retrieve user settings from database
- PATCH: Update user settings (including language preference)
- Authenticated users: Settings synced to database (cross-device)
- Unauthenticated users: Settings stored in localStorage only

### TypeScript Types

All shared types are in `types/index.ts`:
- `TypingSession` - Current typing session state
- `Keystroke` - Individual keystroke record
- `TypingMetrics` - Calculated performance metrics
- `Lesson` - Lesson structure with exercises
- `SubExercise` - Individual exercise within a lesson
- `UserProgress` - Progress record format
- `UserSettings` - User preferences

### State Management

Currently uses React hooks (no Zustand integration yet despite package.json):
- `useState` for component state
- `useEffect` for side effects and intervals
- `useRef` for DOM references and interval handles
- `useCallback` for memoized event handlers

### Additional Features

**VirtualKeyboard** (`components/VirtualKeyboard.tsx`)
- Visual keyboard display
- Highlights next key to press
- Shows correct finger to use (via color coding)
- Dynamically loads and displays the user's selected keyboard layout
- Supports multiple layouts: QWERTY, Dvorak, Colemak, AZERTY, QWERTZ

**HandDiagram** (`components/HandDiagram.tsx`)
- Visual hand positioning guide
- Highlights which finger should be used

**ProgressChart** (`components/ProgressChart.tsx`)
- Chart.js integration for visualizing progress over time
- Shows WPM and accuracy trends

**Sound Effects** (`lib/services/soundEffects.ts`)
- Keystroke sounds and completion sounds
- Can be toggled in user settings (stored in localStorage)

**User Settings** (`lib/services/userSettings.ts`)
- Theme, keyboard layout, language preferences
- Sound toggle, keyboard display toggle
- Stored in localStorage (immediate persistence)
- **Language persistence for authenticated users**:
  - Saved to database via `/api/user/settings`
  - Synced across devices and browsers
  - Loaded from database on page refresh
  - Falls back to localStorage if not authenticated
- Keyboard layout selection persists across sessions
- Available layouts defined in `lib/data/keyboardLayout.ts`

**Internationalization** (`lib/i18n/LanguageContext.tsx`)
- Custom React Context-based i18n system (not i18next)
- 6 supported languages: English, Chinese, Spanish, French, Japanese, Thai
- 68+ admin-specific translation keys per language
- Type-safe translations with TypeScript inference
- Integration with NextAuth for authenticated users
- Database persistence for language preference
- Usage: `const { t } = useLanguage(); <h1>{t.home.title}</h1>`

## Important Implementation Notes

1. **All client components must have `'use client'` directive** at the top of the file
2. **Dynamic route params are Promises** in Next.js 15+ - use `use(params)` hook to unwrap
3. **Performance timing**: Use `performance.now()` not `Date.now()` for accurate keystroke timing
4. **Keystroke tracking**: Every character typed is tracked with timestamp and correctness flag
5. **Error correction**: Backspace sets `corrected: true` flag on the original error
6. **Stats updates**: Only update WPM/accuracy every 1 second to prevent excessive re-renders
7. **Session start**: Timer starts on first keystroke, not when page loads
8. **Completion detection**: Session completes when `currentPosition >= targetText.length`

## Styling

- **Tailwind CSS** is used exclusively (no custom CSS files except globals.css)
- Dark mode support via Tailwind's `dark:` prefix
- Responsive design with Tailwind breakpoints
- Gradient backgrounds: `from-blue-50 to-white dark:from-gray-900 dark:to-gray-800`

## Implemented Features

- ✅ MongoDB/Mongoose database integration (fully connected and active)
- ✅ NextAuth.js authentication (email/password + Google OAuth)
- ✅ Email verification system (SMTP with Nodemailer)
- ✅ Role-based access control (user/admin)
- ✅ Admin dashboard (users, rooms, statistics) - fully internationalized
- ✅ Custom i18n system (6 languages, database persistence for auth users)
- ✅ User settings sync (keyboard layout, language preference to database)
- ✅ Multiplayer features with leaderboard
- ✅ 5 fully implemented keyboard layouts: QWERTY, Dvorak, Colemak, AZERTY, QWERTZ

## Future Development Notes

The codebase is prepared for but hasn't implemented:
- Redis caching (dependency installed, not yet actively used)
- Zustand state management (package installed, currently using React hooks)
- Some keyboard layout mappings (6 fallback to QWERTY: UK QWERTY, Workman, Programmer Dvorak, Spanish layouts)

*** do not commit and push until user requested everytime.