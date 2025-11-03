# Typing Toy Features Documentation

This document describes the key features implemented in Typing Toy.

## Authentication System

### Overview
User authentication with email/password and Google OAuth support, integrated with MongoDB for data persistence.

### Capabilities
- **Email/Password**: Registration and login with bcrypt password hashing
- **Google OAuth**: One-click sign-in with Google account
- **Data Synchronization**: Automatic sync between localStorage and MongoDB

### Environment Setup

Required environment variables in `.env`:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/typingtoy
# or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/typingtoy

# Auth Secret (generate with: openssl rand -base64 32)
AUTH_SECRET=your-generated-secret-key
NEXTAUTH_SECRET=your-generated-secret-key

# App URL
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project and enable Google+ API
3. Create OAuth 2.0 Client ID credentials
4. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`

### Data Structure

**User Model:**
```typescript
{
  email: string;
  name?: string;
  password?: string;
  settings: {
    keyboardLayout: string;
    soundEnabled: boolean;
  };
  lastPositions: Map<layoutId, {
    lessonId: string;
    exerciseIndex: number;
    timestamp: Date;
  }>;
}
```

**Progress Model:**
```typescript
{
  userId: ObjectId;
  lessonId?: string;
  sessionType: 'lesson' | 'speed_test' | 'custom';
  metrics: {
    grossWPM: number;
    netWPM: number;
    accuracy: number;
    duration: number;
  };
  completedAt: Date;
}
```

### Auto-Sync Behavior
- **On Login**: Database data pulled to localStorage
- **On Logout**: localStorage data pushed to database
- **Manual Sync**: "Sync Data" button in user menu
- **Auto-Sync**: Changes synced every 2 seconds

### API Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth handlers
- `GET /api/user/sync` - Get user data
- `POST /api/user/sync` - Save user data

---

## Visual Learning Features

### Virtual Keyboard Display

**Component:** `components/VirtualKeyboard.tsx`

Interactive keyboard showing:
- All keys in standard QWERTY positions
- Real-time highlighting of next key to press
- Home row indicators (F and J bumps)
- Color-coded finger assignments
- Shift character display

**Key Colors by Finger:**
- Left Pinky: Red (#fca5a5)
- Left Ring: Orange (#fdba74)
- Left Middle: Yellow (#fcd34d)
- Left Index: Green (#86efac)
- Right Index: Green (#86efac)
- Right Middle: Blue (#93c5fd)
- Right Ring: Violet (#c4b5fd)
- Right Pinky: Pink (#f9a8d4)
- Thumb (Space): Gray (#d1d5db)

**Features:**
- Animated scaling and color change for current key
- Proper keyboard spacing and alignment
- Dark mode support
- Responsive sizing

### Hand Position Diagrams

**Component:** `components/HandDiagram.tsx`

Visual hand diagrams with:
- Left and right hand outlines
- Five fingers per hand with color coding
- Real-time finger highlighting
- Smooth opacity transitions

**Features:**
- SVG-based scalable graphics
- Current finger at 100% opacity, others dimmed to 30%
- Finger colors match keyboard colors
- Shows finger name when typing

### Keyboard Layout Data

**File:** `lib/data/keyboardLayout.ts`

Complete mapping for:
- All QWERTY keys, shift characters, special characters
- Number row, home row, top row, bottom row

**Functions:**
```typescript
getFingerForKey(char: string): FingerType
getFingerColor(finger: FingerType): string
getHandForFinger(finger: FingerType): 'left' | 'right' | 'both'
```

### Usage Examples

**Default (shows everything):**
```tsx
<TypingTest targetText="Hello World" />
```

**Keyboard only:**
```tsx
<TypingTest
  targetText="Hello World"
  showKeyboard={true}
  showHandDiagram={false}
/>
```

**Hand diagrams only:**
```tsx
<TypingTest
  targetText="Hello World"
  showKeyboard={false}
  showHandDiagram={true}
/>
```

### Learning Benefits
- Visual confirmation of correct finger technique
- Faster muscle memory development
- Proper home row positioning reinforcement
- No need to look at physical keyboard

---

## Tips Banner

**Component:** `components/TipsBanner.tsx`

Non-intrusive banner encouraging user registration.

### Features
- Only shown to unauthenticated users
- Dismissible with X button
- Dismissal state persisted in localStorage
- Responsive design
- Blue-purple gradient background

### Benefits Highlighted

1. Sync progress across all devices
2. Track independent progress for each keyboard layout
3. Never lose typing history and achievements
4. Resume exactly where you left off

### Display Locations
- Home page (`/`)
- Lessons list (`/lessons`)
- Lesson details (`/lessons/[id]`)

### User Experience

**First Visit:**
1. User sees banner at top of page
2. Reads benefits of registration
3. Options:
   - Click "Sign Up Free" to register
   - Click X to dismiss
   - Ignore and continue

**After Dismissal:**
- State saved in localStorage
- Won't show again unless localStorage cleared
- Automatically hidden after login

### Re-enable Banner (for testing)

```javascript
// In browser console
localStorage.removeItem('tips_banner_dismissed');
// Then refresh page
```

### Customization

**Modify benefits list:**
```tsx
<li className="flex items-center gap-2">
  <span className="text-yellow-300">✓</span>
  <span>Your new benefit text here</span>
</li>
```

**Change colors:**
```tsx
className="bg-gradient-to-r from-YOUR-COLOR to-YOUR-COLOR"
```

**Add to other pages:**
```tsx
import TipsBanner from '@/components/TipsBanner';

export default function YourPage() {
  return (
    <main>
      <TipsBanner />
      {/* Your page content */}
    </main>
  );
}
```

---

## Best Practices

### Authentication
1. Never commit `.env` files to version control
2. Use strong secrets in production
3. Enable HTTPS in production
4. Regularly rotate secrets

### Visual Features
1. Use color coding to help identify finger positions
2. Keep animations smooth (150ms transitions)
3. Ensure keyboard navigation still works

### Tips Banner
1. Don't overuse - only on key pages
2. Keep benefits list concise (4-5 items max)
3. Clear call-to-action button
4. Respect user's dismissal choice

---

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod --version`
- Check connection string format
- Verify network access (for Atlas)

### Google OAuth Not Working
- Verify redirect URLs match exactly
- Check OAuth consent screen configuration
- Ensure credentials are active

### Visual Features Not Showing
- Check component props: `showKeyboard` and `showHandDiagram`
- Verify `keyboardLayout.ts` is imported correctly
- Check browser console for errors

---

## Files Reference

**Authentication:**
- `/lib/auth.ts` - NextAuth configuration
- `/lib/db/models/User.ts` - User model
- `/app/api/auth/register/route.ts` - Registration API
- `/app/api/user/sync/route.ts` - Data sync API

**Visual Features:**
- `/components/VirtualKeyboard.tsx`
- `/components/HandDiagram.tsx`
- `/lib/data/keyboardLayout.ts`

**Tips Banner:**
- `/components/TipsBanner.tsx`

---

**Last Updated:** November 2025
