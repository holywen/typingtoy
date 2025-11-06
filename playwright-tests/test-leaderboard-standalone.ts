import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testLeaderboard() {
  console.log('🧪 Testing Leaderboard System...\n');

  // Test user credentials
  const TEST_EMAIL = 'test@typingtoy.com';
  const TEST_PASSWORD = 'TestPassword123!';

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
    // Step 1: Login
    console.log('📍 Step 0: Login as test user');
    await page.goto('http://localhost:3000/auth/signin');
    await page.waitForSelector('h1:has-text("Sign In")', { timeout: 10000 });
    console.log('✅ Sign in page loaded');

    // Fill in login form
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    console.log('✅ Credentials entered');

    // Fill in human verification (dynamically solve the math problem)
    const verificationLabel = await page.locator('label[for="humanCheck"]').textContent();
    console.log(`✅ Found human verification: ${verificationLabel}`);

    // Parse the math problem (e.g., "Human Verification: 7 + 5 = ?")
    const match = verificationLabel?.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
    let answer = 0;
    if (match) {
      const num1 = parseInt(match[1]);
      const operator = match[2];
      const num2 = parseInt(match[3]);

      switch (operator) {
        case '+': answer = num1 + num2; break;
        case '-': answer = num1 - num2; break;
        case '*': answer = num1 * num2; break;
        case '/': answer = Math.floor(num1 / num2); break;
      }
      console.log(`✅ Calculated answer: ${num1} ${operator} ${num2} = ${answer}`);
    }

    // Clear any existing value first
    await page.locator('input#humanCheck').click();
    await page.locator('input#humanCheck').clear();

    // Type the answer character by character to trigger React onChange properly
    await page.locator('input#humanCheck').type(answer.toString(), { delay: 100 });

    // Press Tab to trigger blur event and ensure React processes the onChange
    await page.keyboard.press('Tab');

    // Wait longer for React state to update
    await page.waitForTimeout(2000);
    console.log('✅ Human verification completed');

    // Take screenshot of sign-in page
    await page.screenshot({
      path: path.join(screenshotsDir, '00-signin-page.png'),
      fullPage: true
    });
    console.log('✅ Screenshot 0: Sign-in page\n');

    // Debug: Check form values before submission
    const emailValue = await page.locator('input[type="email"]').inputValue();
    const passwordValue = await page.locator('input[type="password"]').inputValue();
    const captchaValue = await page.locator('input#humanCheck').inputValue();
    console.log('📋 Debug - Form values before submission:');
    console.log(`   Email: ${emailValue}`);
    console.log(`   Password: ${passwordValue ? '***' + passwordValue.slice(-3) : 'EMPTY'}`);
    console.log(`   CAPTCHA: ${captchaValue} (expected: ${answer})`);

    // Check if submit button is disabled
    const isDisabled = await page.locator('button[type="submit"]').isDisabled();
    console.log(`   Submit button disabled: ${isDisabled}`);

    // Check for CAPTCHA error message
    const captchaError = await page.locator('input#humanCheck + p').count();
    if (captchaError > 0) {
      const errorText = await page.locator('input#humanCheck + p').textContent();
      console.log(`   ⚠️  CAPTCHA error visible: "${errorText}"`);
    } else {
      console.log(`   ✅ No CAPTCHA error visible`);
    }

    // Listen for ALL API requests and responses
    const capturedRequests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/auth')) {
        capturedRequests.push({
          type: 'request',
          method: request.method(),
          url: request.url(),
          postData: request.postDataJSON()
        });
      }
    });
    page.on('response', async response => {
      if (response.url().includes('/api/auth')) {
        let body = '';
        try {
          body = await response.text();
        } catch (e) {
          body = '[unable to read]';
        }
        capturedRequests.push({
          type: 'response',
          url: response.url(),
          status: response.status(),
          body: body.substring(0, 500)
        });
      }
    });

    // Click sign in button
    await page.click('button[type="submit"]:has-text("Sign In")');
    console.log('✅ Sign in button clicked');

    // Wait for either success redirect or error message
    await page.waitForTimeout(3000);

    // Log all captured auth requests and responses
    console.log(`📡 Captured ${capturedRequests.length} auth API calls:\n`);
    capturedRequests.forEach((item, i) => {
      if (item.type === 'request') {
        console.log(`   ${i + 1}. REQUEST: ${item.method} ${item.url}`);
        if (item.postData) {
          console.log(`      POST data: ${JSON.stringify(item.postData)}`);
        }
      } else if (item.type === 'response') {
        console.log(`   ${i + 1}. RESPONSE: ${item.status} ${item.url}`);
        console.log(`      Body: ${item.body}`);
      }
    });
    console.log('');

    // Check if we're still on sign-in page (login failed)
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/signin')) {
      console.log('❌ Still on sign-in page after submission');

      // Check for error messages
      const bodyText = await page.locator('body').textContent();
      if (bodyText?.includes('Invalid credentials') || bodyText?.includes('error')) {
        console.log('❌ Error message found on page');
        console.log('   Body excerpt:', bodyText?.substring(0, 300));
      }

      // Try to find any error divs
      const errorDivs = await page.locator('[class*="error"], [class*="alert"]').count();
      if (errorDivs > 0) {
        const errorText = await page.locator('[class*="error"], [class*="alert"]').first().textContent();
        console.log('❌ Error div found:', errorText);
      }

      throw new Error('Login failed - still on sign-in page');
    }

    console.log('✅ Login successful\n');

    // Navigate to multiplayer lobby
    console.log('📍 Step 1: Navigate to /multiplayer');
    await page.goto('http://localhost:3000/multiplayer', { waitUntil: 'networkidle' });
    console.log('✅ Page navigation complete, waiting for lobby...');

    // Check page title and URL
    const url = page.url();
    const title = await page.title();
    console.log(`   Current URL: ${url}`);
    console.log(`   Page title: ${title}`);

    // Get page text content for debugging
    const bodyText = await page.locator('body').textContent();
    console.log(`   Page contains: ${bodyText?.substring(0, 200)}...`);

    // Wait longer for socket connection and lobby render
    // Check if there's a loading or error message
    const hasError = await page.locator('text=error').count() > 0;
    if (hasError) {
      console.log('⚠️  Error message detected on page');
    }

    const hasConnecting = await page.locator('text=Connecting').count() > 0;
    if (hasConnecting) {
      console.log('⏳ Connection in progress, waiting...');
      await page.waitForTimeout(5000);
    }

    await page.waitForSelector('h1:has-text("Multiplayer Lobby")', { timeout: 30000 });
    console.log('✅ Lobby header found');

    // Wait a bit more for socket to connect
    await page.waitForTimeout(2000);
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
