# Getting Started with Typing Toy

Welcome! This guide will help you get up and running with the Typing Toy application.

## Quick Start (No Database Required)

The basic typing features work without any database setup! Just follow these steps:

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run the development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

4. **Start typing!**
   - Click "Start Typing" to try a speed test
   - Click "15 Lessons" to start with Lesson 1
   - Practice and improve your typing skills!

## What's Working Now

✅ **Fully Functional Features:**
- Home page with keyboard layout selection
- Speed test with random practice texts
- 15 progressive lessons (beginner to advanced)
- Real-time WPM (Words Per Minute) calculation
- Live accuracy tracking
- Visual feedback (green for correct, red for errors)
- Responsive design (works on mobile and desktop)
- Dark mode support (follows system preference)
- User authentication (email/password and Google OAuth)
- Email verification for new users
- Admin dashboard with user and room management
- Role-based access control (user/admin)

## Current Pages

### Home Page (`/`)
- Overview of features
- Quick access to speed test
- Keyboard layout showcase
- Navigation to lessons

### Speed Test (`/test`)
- Practice with randomized texts
- Real-time stats (WPM, Accuracy, Time)
- Retry functionality
- Tips for better typing

### Lessons (`/lessons`)
- Grid view of all 15 lessons
- Difficulty badges (beginner, intermediate, advanced)
- Focus keys and estimated time per lesson
- Easy navigation between lessons

### Individual Lesson (`/lessons/[1-15]`)
- Full typing practice interface
- Lesson-specific content
- Progress through lessons with next/previous buttons
- Same real-time tracking as speed test

### Authentication Pages
- **Sign In** (`/auth/signin`) - Login with email/password or Google
- **Sign Up** (`/auth/signup`) - Create new account
- **Verify Email** (`/auth/verify-email`) - Email verification status

### Admin Dashboard (`/admin`) - Admin Only
- **Dashboard** - Platform statistics overview
- **Users** (`/admin/users`) - User management (view, edit, delete)
- **Rooms** (`/admin/rooms`) - Multiplayer room monitoring
- **Statistics** (`/admin/statistics`) - Detailed analytics with charts

## Setting Up User Authentication (Optional)

If you want to enable user accounts, email verification, and admin features:

### 1. Install MongoDB

**Option A: Local MongoDB**
```bash
# macOS (with Homebrew)
brew install mongodb-community
brew services start mongodb-community

# Linux (Ubuntu/Debian)
sudo apt-get install mongodb
sudo systemctl start mongod

# Windows
# Download installer from https://www.mongodb.com/try/download/community
```

**Option B: MongoDB Atlas (Cloud)**
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/dbname`)

### 2. Configure Environment Variables

Create `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/typingtoy
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/typingtoy

# Authentication
NEXTAUTH_SECRET=your-secret-key-here-use-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# Email Verification (SMTP)
# Option 1: Gmail (Recommended for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@typingtoy.com

# Option 2: Other SMTP providers (SendGrid, Mailgun, etc.)
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=apikey
# SMTP_PASSWORD=your-api-key

# OAuth (Optional - for Google Sign-In)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Generate Authentication Secret

Generate a secure secret for NextAuth:

```bash
openssl rand -base64 32
```

Copy the output and use it for `NEXTAUTH_SECRET` in `.env.local`

### 4. Set Up SMTP Email (Gmail Example)

To enable email verification with Gmail:

1. **Enable 2-Factor Authentication** on your Google account
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Typing Toy"
   - Copy the 16-character password

3. **Update `.env.local`**
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=abcd efgh ijkl mnop  # The app password from step 2
   ```

4. **Test Email Configuration**
   ```bash
   npx tsx scripts/test-email.ts
   ```

### 5. Set Up Google OAuth (Optional)

To enable "Sign in with Google":

1. **Create Google Cloud Project**
   - Go to https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable Google+ API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

3. **Create OAuth Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - Add production URL when deploying

4. **Update `.env.local`**
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### 6. Start with Authentication Enabled

```bash
npm run dev
```

Visit http://localhost:3000 and click "Sign Up" to create your first account.

### 7. First User Setup (Admin)

**Important**: The first user you register automatically becomes an admin!

1. Go to http://localhost:3000/auth/signup
2. Fill in registration form
3. As first user, email verification is skipped
4. You'll be automatically signed in
5. Access admin dashboard at http://localhost:3000/admin

**Regular Users** (after first user):
- Must verify email before signing in
- Check email inbox for verification link
- Click link to verify email
- Then sign in normally

## Project Architecture

```
Key Files:
- app/page.tsx                 # Home page
- app/test/page.tsx            # Speed test page
- app/lessons/page.tsx         # Lessons list
- app/lessons/[id]/page.tsx    # Individual lesson page
- components/TypingTest.tsx    # Main typing interface component
- lib/services/typingMetrics.ts # WPM and accuracy calculations
- lib/data/lessons.ts          # All lesson content
```

## How the Typing Test Works

### 1. **Keystroke Tracking**
- Every keystroke is captured with `performance.now()` timestamp
- Compared against target text character-by-character
- Tracks correct, incorrect, and corrected errors

### 2. **WPM Calculation**
- **Gross WPM**: Raw typing speed (total characters ÷ 5 ÷ minutes)
- **Net WPM**: Adjusted for errors (Gross WPM - error penalty)
- Updated every second for smooth display

### 3. **Accuracy Measurement**
- Calculated as: (Correct Characters ÷ Total Characters) × 100
- All errors count (both corrected and uncorrected)

### 4. **Visual Feedback**
- Green text: Correctly typed characters
- Red text: Incorrectly typed characters
- Blue highlight: Current character position
- Gray text: Characters not yet typed

## Customization

### Change Lesson Content
Edit `lib/data/lessons.ts` to modify lesson texts or add new content.

### Adjust Styling
- Global styles: `app/globals.css`
- Component-specific: Tailwind classes in component files
- Theme colors: Defined in `tailwind.config.ts`

### Modify WPM Calculations
Edit `lib/services/typingMetrics.ts` to adjust:
- WPM formula
- Error penalty calculation
- Accuracy computation
- Stats update frequency

## Completed Features

### User Authentication ✅
- Email/password registration and login
- Email verification with SMTP
- Google OAuth integration
- First-user-becomes-admin logic
- Role-based access control

### Admin System ✅
- Admin dashboard with statistics
- User management (view, edit, delete)
- Room management
- Platform analytics with Chart.js

### Internationalization ✅
- Multi-language support (6 languages)
- Multiple keyboard layouts (QWERTY, Dvorak, Colemak, etc.)
- Language switcher component

## Next Steps (Coming Soon)

### Cloud Progress Sync
- Save typing history to MongoDB
- Sync progress across devices
- View historical performance

### Advanced Features
- Achievement system
- Leaderboards
- Custom practice texts
- Typing games
- Daily challenges

## Troubleshooting

### Authentication Issues

**"Email verification email not sent"**
- Check SMTP configuration in `.env.local`
- Test email with: `npx tsx scripts/test-email.ts`
- For Gmail: Ensure 2FA enabled and using app password
- Port 587: Use `SMTP_SECURE=false` (STARTTLS)
- Port 465: Use `SMTP_SECURE=true` (SSL/TLS)

**"Cannot sign in - email not verified"**
- Check your email inbox (and spam folder)
- Click the verification link
- Link expires after 24 hours - register again if expired
- First user (admin) doesn't need verification

**"Cannot access /admin pages"**
- Only admin users can access admin dashboard
- First registered user automatically becomes admin
- Other users need admin role assigned by existing admin

**MongoDB connection errors**
- Ensure MongoDB is running: `brew services list` (macOS)
- Check `MONGODB_URI` in `.env.local`
- For Atlas: Whitelist your IP address in MongoDB Atlas dashboard

### Port Already in Use
If port 3000 is already in use:
```bash
# Kill the process on port 3000
lsof -ti:3000 | xargs kill

# Or run on a different port
PORT=3001 npm run dev
```

### TypeScript Errors
```bash
# Clean and rebuild
rm -rf .next
npm run dev
```

### Styling Not Loading
```bash
# Clear cache and restart
rm -rf .next
rm -rf node_modules/.cache
npm run dev
```

## Development Tips

### Hot Reload
- Code changes auto-refresh the browser
- CSS changes apply instantly
- No need to restart the server

### Debug Mode
Open browser DevTools (F12) to:
- View console logs
- Inspect typing session data
- Monitor performance

### Testing on Mobile
Access from your phone using the network URL shown in the terminal:
```
Network: http://192.168.x.x:3000
```

## Building for Production

### Create Production Build
```bash
npm run build
```

### Run Production Server
```bash
npm run start
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Support

- Report bugs: [GitHub Issues]
- Questions: Check the README.md
- Documentation: This file and README.md

---

**Happy Typing! Start with Lesson 1 and work your way up to become a touch typing master! 🚀**
