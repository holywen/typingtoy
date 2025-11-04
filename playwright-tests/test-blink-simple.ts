import { chromium } from 'playwright';

/**
 * Simple Blink test - manually verify character display
 * This test creates a Blink room and waits for manual verification
 */
async function testBlinkSimple() {
  console.log('🧪 Simple Blink Multiplayer Test...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to multiplayer
    console.log('📍 Navigate to /multiplayer with test mode');
    await page.goto('http://localhost:3000/multiplayer?testMode=true');
    await page.waitForTimeout(3000);
    console.log('✅ Lobby loaded\n');

    // Select Blink game type
    console.log('📍 Select Blink game type');
    const blinkButton = page.locator('button:has-text("Blink")');
    await blinkButton.waitFor({ timeout: 5000 });
    await blinkButton.click();
    await page.waitForTimeout(500);
    console.log('✅ Blink selected\n');

    // Create room
    console.log('📍 Create room');
    const createButton = page.locator('button:has-text("Create Room")').first();
    await createButton.click();
    await page.waitForTimeout(1000);

    // Fill room name
    const roomNameInput = page.locator('input[name="roomName"]').or(
      page.locator('input[placeholder*="Room" i]')
    ).or(
      page.locator('input[type="text"]').first()
    );
    await roomNameInput.fill('Blink Test');
    await page.locator('button:has-text("Create Room")').last().click();
    await page.waitForTimeout(3000);

    const url = page.url();
    const roomId = url.split('/multiplayer/room/')[1];
    console.log(`✅ Room created: ${roomId}\n`);

    // Start game immediately (test mode allows single player)
    console.log('📍 Start game');
    const startButton = page.locator('button:has-text("Start Game")');
    await startButton.waitFor({ timeout: 5000 });
    await startButton.click();
    await page.waitForTimeout(4000); // Wait for countdown

    console.log('✅ Game should have started\n');

    // Take screenshot
    await page.screenshot({ path: 'blink-simple-test.png', fullPage: true });
    console.log('📸 Screenshot saved: blink-simple-test.png\n');

    // Check browser console for debug logs
    console.log('📍 Checking for game state logs in console...');
    console.log('   (Check browser console for logs starting with "🔍 [Blink Client]")\n');

    // Wait for manual inspection
    console.log('⏸  Keeping browser open for 15 seconds for manual inspection...');
    console.log('   Check if:');
    console.log('   1. The screen shows split-screen layout');
    console.log('   2. A character is displayed in the center');
    console.log('   3. Timer bar is animating');
    console.log('   4. Player stats are visible at top\n');

    await page.waitForTimeout(15000);

    console.log('✅ Test completed! Check the screenshot and manual observation.\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'blink-simple-error.png', fullPage: true });
    throw error;
  } finally {
    await browser.close();
    console.log('🏁 Browser closed\n');
  }
}

testBlinkSimple();
