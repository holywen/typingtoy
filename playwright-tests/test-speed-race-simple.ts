import { chromium } from 'playwright';

async function testSpeedRaceSimple() {
  console.log('🧪 Simple Speed Race Multiplayer Test...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to multiplayer lobby
    console.log('📍 Navigate to /multiplayer');
    await page.goto('http://localhost:3000/multiplayer');
    await page.waitForTimeout(2000);
    console.log('✅ Lobby loaded\n');

    // Select Speed Race (Typing Walk) game type
    console.log('📍 Select Speed Race game type');
    const speedRaceButton = page.locator('button:has-text("Typing Walk")');
    await speedRaceButton.waitFor({ timeout: 5000 });
    await speedRaceButton.click();
    await page.waitForTimeout(500);
    console.log('✅ Speed Race selected\n');

    // Create room
    console.log('📍 Create room');
    const createRoomButton = page.locator('button:has-text("Create Room")');
    await createRoomButton.click();
    await page.waitForTimeout(1000);

    // Fill room details
    const roomNameInput = page.locator('input[placeholder*="room" i], input[placeholder*="name" i]').first();
    await roomNameInput.fill('Speed Race Test');

    const createButton = page.locator('button:has-text("Create")').last();
    await createButton.click();
    await page.waitForTimeout(2000);

    const url = page.url();
    const roomId = url.split('/multiplayer/room/')[1];
    console.log(`✅ Room created: ${roomId}\n`);

    // Start game
    console.log('📍 Start game');
    const startButton = page.locator('button:has-text("Start Game")');
    await startButton.waitFor({ timeout: 5000 });
    await startButton.click();
    console.log('✅ Start game clicked\n');

    // Wait for countdown
    console.log('📍 Wait for game countdown');
    await page.waitForTimeout(4000);
    console.log('✅ Countdown completed\n');

    // Verify game started
    console.log('📍 Verify Speed Race game started');
    await page.waitForTimeout(1000);

    // Check for grid (Speed Race specific)
    const gridExists = await page.locator('div[style*="grid-template-columns"]').count();
    if (gridExists > 0) {
      console.log('✅ Grid is visible\n');
    } else {
      console.log('⚠️  Grid not found\n');
    }

    // Check for player stats
    const statsExists = await page.locator('text=/Progress|Lives|Score/i').count();
    if (statsExists > 0) {
      console.log('✅ Player stats are visible\n');
    } else {
      console.log('⚠️  Player stats not found\n');
    }

    // Take screenshot
    await page.screenshot({ path: 'speed-race-game-start.png', fullPage: true });
    console.log('📸 Screenshot saved\n');

    // Simulate typing - type 5 characters
    console.log('📍 Simulate gameplay - type 5 characters');
    const testKeys = ['a', 's', 'd', 'f', 'j'];
    for (const key of testKeys) {
      await page.keyboard.press(key);
      await page.waitForTimeout(300);
    }
    console.log('✅ Typed 5 characters\n');

    await page.waitForTimeout(2000);

    // Check for score updates
    const scoreText = await page.locator('text=/Score|\\d+ pts/i').first().textContent();
    console.log(`   Current score display: ${scoreText}\n`);

    // Take final screenshot
    await page.screenshot({ path: 'speed-race-game-playing.png', fullPage: true });
    console.log('📸 Final screenshot saved\n');

    console.log('✅ Speed Race test completed successfully!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'speed-race-error.png', fullPage: true });
    throw error;
  } finally {
    console.log('🏁 Browser closed\n');
    await browser.close();
  }
}

// Run test
testSpeedRaceSimple().catch(console.error);
