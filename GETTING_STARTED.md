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

## Next Steps (Coming Soon)

### Phase 2: User Accounts
- Sign up / Login functionality
- Save progress to database
- View typing history
- Track improvement over time

### Phase 3: Advanced Features
- Multi-language support (50+ languages)
- Multiple keyboard layouts (Dvorak, Colemak, etc.)
- Achievement system
- Leaderboards
- Custom practice texts

## Troubleshooting

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
