import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testLeaderboard() {
  console.log('🧪 Testing Leaderboard System...\n');

  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Navigate to multiplayer lobby
    console.log('📍 Step 1: Navigate to /multiplayer');
    await page.goto('http://localhost:3000/multiplayer');
    await page.waitForSelector('h1:has-text("Multiplayer Lobby")', { timeout: 10000 });
    console.log('✅ Lobby loaded\n');

    // Take screenshot of lobby with leaderboard button
    await page.screenshot({
      path: path.join(screenshotsDir, '01-lobby-with-leaderboard-button.png'),
      fullPage: true
    });
    console.log('✅ Screenshot 1: Lobby with leaderboard button\n');

    // Find and click leaderboard button
    console.log('📍 Step 2: Click Leaderboard button');
    const leaderboardButton = page.locator('button:has-text("Leaderboard")');
    await leaderboardButton.waitFor({ timeout: 5000 });
    await leaderboardButton.click();
    console.log('✅ Leaderboard button clicked\n');

    // Wait for leaderboard page to load
    console.log('📍 Step 3: Wait for leaderboard page');
    await page.waitForURL('**/multiplayer/leaderboard', { timeout: 10000 });
    await page.waitForSelector('h1:has-text("Leaderboard")', { timeout: 5000 });
    await page.waitForTimeout(2000); // Wait for data to load
    console.log('✅ Leaderboard page loaded\n');

    // Take screenshot of main leaderboard
    await page.screenshot({
      path: path.join(screenshotsDir, '02-leaderboard-page-global.png'),
      fullPage: true
    });
    console.log('✅ Screenshot 2: Leaderboard page - Global tab\n');

    // Verify all elements are visible
    console.log('📍 Step 4: Verify leaderboard elements');
    const globalTab = page.locator('button:has-text("Global Rankings")');
    await globalTab.waitFor({ timeout: 5000 });

    await page.locator('button:has-text("All Time")').waitFor();
    await page.locator('button:has-text("This Month")').waitFor();
    await page.locator('button:has-text("This Week")').waitFor();
    await page.locator('button:has-text("Today")').waitFor();
    console.log('✅ All period tabs visible\n');

    // Test game type switching
    console.log('📍 Step 5: Test game type selector - Blink');
    await page.locator('button:has-text("Blink")').first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(screenshotsDir, '03-leaderboard-blink-game.png'),
      fullPage: true
    });
    console.log('✅ Screenshot 3: Leaderboard - Blink game\n');

    // Test period switching - Weekly
    console.log('📍 Step 6: Test period selector - This Week');
    await page.locator('button:has-text("This Week")').click();
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(screenshotsDir, '04-leaderboard-weekly.png'),
      fullPage: true
    });
    console.log('✅ Screenshot 4: Leaderboard - Weekly period\n');

    // Test period switching - Daily
    console.log('📍 Step 7: Test period selector - Today');
    await page.locator('button:has-text("Today")').click();
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(screenshotsDir, '05-leaderboard-daily.png'),
      fullPage: true
    });
    console.log('✅ Screenshot 5: Leaderboard - Daily period\n');

    // Test My Stats tab
    console.log('📍 Step 8: Test My Stats tab');
    const statsTab = page.locator('button:has-text("My Stats")');
    await statsTab.click();
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(screenshotsDir, '06-leaderboard-stats-tab.png'),
      fullPage: true
    });
    console.log('✅ Screenshot 6: Leaderboard - Stats tab (sign-in prompt)\n');

    // Test Friends tab
    console.log('📍 Step 9: Test Friends tab');
    const friendsTab = page.locator('button:has-text("Friends")');
    await friendsTab.click();
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(screenshotsDir, '07-leaderboard-friends-tab.png'),
      fullPage: true
    });
    console.log('✅ Screenshot 7: Leaderboard - Friends tab (sign-in prompt)\n');

    // Go back to Global tab
    console.log('📍 Step 10: Return to Global tab');
    await globalTab.click();
    await page.waitForTimeout(1000);

    // Test all game types
    const gameTypes = [
      { name: 'Falling Blocks', filename: 'falling-blocks' },
      { name: 'Falling Words', filename: 'falling-words' },
      { name: 'Speed Race', filename: 'speed-race' }
    ];

    for (let i = 0; i < gameTypes.length; i++) {
      console.log(`📍 Step ${11 + i}: Test ${gameTypes[i].name}`);
      const gameButton = page.locator(`button:has-text("${gameTypes[i].name}")`).first();
      await gameButton.click();
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: path.join(screenshotsDir, `08-${i}-leaderboard-${gameTypes[i].filename}.png`),
        fullPage: true
      });
      console.log(`✅ Screenshot ${8 + i}: Leaderboard - ${gameTypes[i].name}\n`);
    }

    // Test navigation back to lobby
    console.log('📍 Step 14: Navigate back to lobby');
    const backButton = page.locator('button:has-text("Back to Lobby")');
    await backButton.waitFor();
    await backButton.click();
    await page.waitForURL('**/multiplayer', { timeout: 5000 });
    await page.waitForSelector('h1:has-text("Multiplayer Lobby")');
    console.log('✅ Successfully navigated back to lobby\n');

    await page.screenshot({
      path: path.join(screenshotsDir, '11-back-to-lobby.png'),
      fullPage: true
    });
    console.log('✅ Screenshot 11: Back to lobby\n');

    console.log('✅ All leaderboard tests passed!\n');
    console.log(`📸 Screenshots saved to: ${screenshotsDir}\n`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    // Take screenshot of error state
    await page.screenshot({
      path: path.join(screenshotsDir, 'error-state.png'),
      fullPage: true
    });
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testLeaderboard().catch(console.error);
