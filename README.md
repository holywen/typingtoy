# Typing Toy

A modern, production-ready touch typing practice website built with Next.js 15, TypeScript, and Tailwind CSS. Learn to type faster and more accurately through progressive lessons, speed tests, and real-time feedback.

## Features

- ✅ **15 Progressive Lessons** - From beginner (home row) to advanced (special characters)
- ✅ **Real-time WPM Calculation** - Industry-standard Gross WPM and Net WPM metrics
- ✅ **Accuracy Tracking** - Character-by-character accuracy with visual feedback
- ✅ **Speed Test Mode** - Practice with randomized texts (500-1000 words)
- ✅ **Responsive Design** - Works on desktop and mobile devices
- ✅ **Dark Mode Support** - System-aware theme switching
- ✅ **Multiple Keyboard Layouts** - QWERTY, Dvorak, Colemak, AZERTY, QWERTZ
- ✅ **Multilingual Support (i18n)** - 6 languages with database persistence for authenticated users
  - English, Chinese, Japanese, Spanish, French, Thai
  - Language preference synced across devices
  - Full admin dashboard internationalization
- ✅ **SEO Optimized** - Full metadata, sitemap, robots.txt, and social sharing
- ✅ **Docker Deployment** - Complete Docker and Docker Compose setup
- ✅ **User Authentication** - NextAuth.js 5.0 with email verification and OAuth (Google)
- ✅ **Admin Dashboard** - Complete admin system with user/room management and analytics
- ✅ **Role-Based Access** - First user becomes admin, automatic role assignment
- ✅ **Email Verification** - SMTP-based email verification for new user registrations
- ✅ **Progress Tracking** - MongoDB storage with sync API for authenticated users
- ✅ **Multiplayer Mode** - Real-time typing games with Socket.IO
- ✅ **Leaderboards** - Global and friend leaderboards with player statistics
- 🚧 **Achievements & Gamification** - Badges and rewards system (coming soon)

## Tech Stack

### Frontend
- **Next.js 16.0.1** - React framework with App Router and Turbopack
- **React 19.2.0** - Latest React features
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Framer Motion 12.0** - Smooth animations
- **Chart.js 4.4** - Data visualization
- **React Chart.js 2** - React wrapper for Chart.js
- **Clsx & Tailwind Merge** - Dynamic className utilities
- **Zustand 5.0** - State management

### Backend & Authentication
- **NextAuth 5.0** (Beta 30) - Authentication solution with role-based access
- **MongoDB 6.12** - NoSQL database
- **Mongoose 8.9** - MongoDB ODM
- **@auth/mongodb-adapter** - NextAuth MongoDB integration
- **Socket.IO 4.8** - Real-time bidirectional communication for multiplayer
- **Nodemailer 6.9** - SMTP email sending for verification
- **Redis 4.7** - Caching, session management, and real-time data
- **bcryptjs 2.4** - Password hashing
- **Zod 3.24** - Schema validation

### Internationalization
- **Custom i18n** - React Context-based i18n system with NextAuth integration
- **6 Languages** - English, Chinese, Japanese, Spanish, French, Thai (68+ keys per language)
- **Database Persistence** - Language preference saved to MongoDB for authenticated users
- **Cross-Device Sync** - Settings synchronized across devices and browsers

### Development & Build
- **ESLint 9** - Code linting
- **PostCSS 8** - CSS processing
- **Autoprefixer** - CSS vendor prefixes
- **Turbopack** - Fast bundling (Next.js 16)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- MongoDB (optional, for user features)
- Redis (optional, for caching)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/typingtoy.git
cd typingtoy
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.local.example .env.local
```

4. Edit `.env.local` with your configuration:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/typingstudy
REDIS_URL=redis://localhost:6379

# Authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Email (SMTP) - Required for email verification
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=typingtoy@444666.best

# Support Email (publicly visible for contact links)
NEXT_PUBLIC_SUPPORT_EMAIL=typingtoy@444666.best

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
typingtoy/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── auth/                 # NextAuth endpoints
│   │   │   ├── register/         # User registration API
│   │   │   └── verify-email/     # Email verification API
│   │   ├── admin/                # Admin API routes
│   │   │   ├── stats/            # Platform statistics
│   │   │   ├── statistics/       # Detailed analytics
│   │   │   ├── users/            # User management CRUD
│   │   │   └── rooms/            # Room management CRUD
│   │   ├── generate-text/        # Text generation API
│   │   └── user/                 # User data sync
│   ├── admin/                    # Admin dashboard (protected)
│   │   ├── layout.tsx            # Admin layout with role check
│   │   ├── page.tsx              # Admin dashboard
│   │   ├── users/                # User management page
│   │   ├── rooms/                # Room management page
│   │   └── statistics/           # Analytics dashboard
│   ├── auth/                     # Authentication pages
│   │   ├── signin/               # Sign in page
│   │   ├── signup/               # Sign up page
│   │   └── verify-email/         # Email verification page
│   ├── lessons/                  # Lesson pages
│   │   ├── page.tsx              # Lessons list
│   │   ├── layout.tsx            # Lessons metadata
│   │   └── [id]/                 # Individual lesson
│   │       ├── page.tsx          # Lesson content
│   │       └── layout.tsx        # Dynamic metadata
│   ├── test/                     # Speed test page
│   │   ├── page.tsx              # Test interface
│   │   └── layout.tsx            # Test metadata
│   ├── practice/                 # Custom practice
│   │   ├── page.tsx              # Practice interface
│   │   └── layout.tsx            # Practice metadata
│   ├── progress/                 # Progress tracking
│   │   ├── page.tsx              # Progress dashboard
│   │   └── layout.tsx            # Progress metadata
│   ├── layout.tsx                # Root layout with SEO
│   ├── page.tsx                  # Home page
│   ├── globals.css               # Global styles
│   ├── sitemap.ts                # Dynamic sitemap
│   └── robots.ts                 # Dynamic robots.txt
├── components/                   # React components
│   ├── TypingTest.tsx            # Main typing test component
│   ├── VirtualKeyboard.tsx       # Keyboard visualization
│   ├── HandDiagram.tsx           # Hand position guide
│   ├── LanguageSelector.tsx      # Language switcher
│   ├── UserMenu.tsx              # User dropdown menu
│   ├── TipsBanner.tsx            # Tips for unregistered users
│   └── SessionProvider.tsx       # NextAuth provider wrapper
├── lib/                          # Utilities and services
│   ├── db/                       # Database setup
│   │   ├── mongodb.ts            # MongoDB connection
│   │   └── models/               # Mongoose models
│   │       ├── User.ts           # User model with role field
│   │       └── VerificationToken.ts  # Email verification tokens
│   ├── admin.ts                  # Admin helper functions
│   ├── i18n/                     # Internationalization
│   │   ├── index.ts              # i18n configuration
│   │   ├── LanguageContext.tsx   # React context for i18n
│   │   └── locales/              # Translation files
│   │       ├── en.ts             # English
│   │       ├── zh.ts             # Chinese
│   │       ├── ja.ts             # Japanese
│   │       ├── es.ts             # Spanish
│   │       ├── fr.ts             # French
│   │       └── th.ts             # Thai
│   ├── services/                 # Business logic
│   │   ├── typingMetrics.ts      # WPM/accuracy calculations
│   │   ├── progressStorage.ts    # Progress tracking
│   │   ├── userSettings.ts       # User settings management
│   │   └── emailService.ts       # SMTP email sending
│   ├── utils/                    # Helper functions
│   │   └── textGenerator.ts      # Random text generation
│   └── data/                     # Static data
│       ├── lessons.ts            # Lesson content
│       └── keyboardLayout.ts     # Keyboard layouts
├── types/                        # TypeScript type definitions
│   └── index.ts                  # Shared types
├── public/                       # Static assets
│   ├── icon.svg                  # App icon (512x512)
│   ├── favicon.svg               # Favicon (32x32)
│   ├── apple-touch-icon.svg      # iOS icon (180x180)
│   ├── manifest.json             # PWA manifest
│   └── robots.txt                # Static robots.txt
├── docker-compose.yml            # Docker Compose config
├── Dockerfile                    # Docker build config
├── Makefile                      # Docker commands
└── package.json                  # Dependencies
```

## Key Features Explained

### WPM Calculation

The application uses industry-standard formulas:

**Gross WPM (Raw Speed)**
```
Gross WPM = (Total Characters ÷ 5) ÷ Time in Minutes
```

**Net WPM (Adjusted for Errors)**
```
Net WPM = Gross WPM - (Uncorrected Errors ÷ Time in Minutes)
```

**Accuracy**
```
Accuracy = (Correct Characters ÷ Total Characters) × 100
```

### Typing Test Component

The `TypingTest` component (`components/TypingTest.tsx`) handles:
- Real-time keystroke tracking
- Visual feedback (green for correct, red for errors)
- Live WPM and accuracy updates every second
- Completion detection and final metrics

### Lessons System

15 progressive lessons covering:
1. **Lessons 1-4**: Home row keys (ASDF JKL;)
2. **Lessons 5-8**: Top row keys (QWERTY UIOP)
3. **Lessons 9-12**: Bottom row keys (ZXCV BNM,.)
4. **Lesson 13**: Number keys (0-9)
5. **Lesson 14**: Special characters (!@#$%^&*)
6. **Lesson 15**: Master challenge (all keys)

### Authentication & User System

**Email Verification**
- New user registrations require email verification via SMTP
- Verification tokens expire after 24 hours
- Automatic token cleanup using MongoDB TTL indexes
- First registered user automatically becomes admin (no verification required)

**Role-Based Access Control**
- Two roles: `user` (default) and `admin`
- First user in database automatically assigned `admin` role
- OAuth users (Google) follow same first-user-becomes-admin logic
- Admin role persisted in JWT token and session

**Admin Dashboard** (`/admin`)
- Protected route requiring `admin` role
- User management: View, search, update roles, delete users
- Room management: Monitor and manage multiplayer rooms
- Statistics: Platform analytics with Chart.js visualizations
- Noindex meta tags prevent search engine indexing

### Email Configuration

The application uses Nodemailer for SMTP email sending. To enable email verification:

1. **Gmail Setup** (Recommended for development):
   - Enable 2-factor authentication on your Google account
   - Generate an App Password at https://myaccount.google.com/apppasswords
   - Use these settings:
     ```env
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_SECURE=false
     SMTP_USER=your-email@gmail.com
     SMTP_PASSWORD=your-app-password
     ```

2. **Other SMTP Providers**:
   - Port 587: Use `SMTP_SECURE=false` (STARTTLS)
   - Port 465: Use `SMTP_SECURE=true` (SSL/TLS)

3. **Test Email Configuration**:
   ```bash
   npx tsx scripts/test-email.ts
   ```

## Deployment

### Docker (Recommended)

For complete Docker deployment instructions, see [docs/DOCKER.md](./docs/DOCKER.md).

Quick start:
```bash
# Copy environment file
cp .env.example .env

# Start with Docker Compose
docker compose up -d

# Or use the helper script
./docker-start.sh dev
```

### Vercel (Alternative)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

```bash
npm run build
```

## Documentation

- **[Getting Started](./GETTING_STARTED.md)** - Setup and installation guide
- **[Architecture](./ARCHITECTURE.md)** - Technical architecture details
- **[Admin System](./ADMIN_SYSTEM.md)** - Admin dashboard and role management guide
- **[Docker Deployment](./docs/DOCKER.md)** - Complete Docker guide
- **[SEO Guide](./docs/SEO_GUIDE.md)** - SEO configuration and best practices
- **[Features](./docs/FEATURES.md)** - Detailed feature documentation

## Development Roadmap

### Phase 1: MVP ✅ Complete
- [x] Basic typing test interface
- [x] Real-time WPM/accuracy calculation
- [x] 15 progressive lessons
- [x] Speed test mode with generated text (500-1000 words)
- [x] Responsive design with dark mode
- [x] Virtual keyboard visualization
- [x] Hand position diagrams

### Phase 2: Internationalization ✅ Complete
- [x] Multi-language support (6 languages)
- [x] English, Chinese, Japanese, Spanish, French, Thai
- [x] Custom i18n system with React Context
- [x] Language selector component
- [x] Multiple keyboard layouts (QWERTY, Dvorak, Colemak, etc.)

### Phase 3: User System & Progress ✅ Complete
- [x] NextAuth 5.0 authentication with JWT
- [x] Email verification system (SMTP with Nodemailer)
- [x] OAuth integration (Google Sign-In)
- [x] Role-based access control (user/admin roles)
- [x] First-user-becomes-admin logic
- [x] Admin dashboard with user/room management
- [x] Platform statistics and analytics with Chart.js
- [x] MongoDB user data storage
- [x] Progress tracking and history (MongoDB with sync API)
- [x] User profiles and settings
- [x] Cloud sync for authenticated users
- [x] Leaderboards (global and friends)
- [ ] Achievement system (planned)

### Phase 4: SEO & Deployment ✅ Complete
- [x] Full SEO optimization (metadata, OG tags, Twitter cards)
- [x] Dynamic sitemap.xml generation
- [x] robots.txt configuration
- [x] PWA manifest
- [x] Docker & Docker Compose setup
- [x] Production deployment ready

### Phase 5: Multiplayer & Social ✅ Complete
- [x] Real-time multiplayer typing games (Socket.IO)
- [x] Room creation and management
- [x] Online player list with presence tracking
- [x] Global leaderboards
- [x] Friend leaderboards
- [x] Player statistics and rankings
- [x] Quick match system
- [x] Game lobby with chat

### Phase 6: Advanced Features 📋 Planned
- [ ] Custom text practice presets
- [ ] Export typing data
- [ ] Additional typing games
- [ ] Daily challenges
- [ ] Streak tracking
- [ ] Achievement badges and rewards system
- [ ] Code snippet practice mode
- [ ] Advanced analytics dashboard

### Phase 7: Enhanced Gamification 💡 Future
- [ ] Team competitions
- [ ] Live tournaments
- [ ] Season rankings
- [ ] Advanced matchmaking with ELO ratings
- [ ] Spectator mode for tournaments
- [ ] Replay system

## Performance

- **Lighthouse Score**: 95+ (Performance)
- **First Contentful Paint**: < 1s
- **Time to Interactive**: < 2s
- **Bundle Size**: ~150KB (gzipped)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Inspired by [Monkeytype](https://monkeytype.com/)
- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## Contact

For questions or feedback, please open an issue on GitHub.

---

**Happy Typing! 🚀**
