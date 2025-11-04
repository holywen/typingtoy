import { chromium } from 'playwright';

async function testFallingWordsSimple() {
  console.log('🧪 Simple Falling Words Multiplayer Test...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to multiplayer lobby
    console.log('📍 Navigate to /multiplayer');
    await page.goto('http://localhost:3000/multiplayer');
    await page.waitForTimeout(2000);
    console.log('✅ Lobby loaded\n');

    // Select Falling Words game type
    console.log('📍 Select Falling Words game type');
    const fallingWordsButton = page.locator('button:has-text("Falling Words")');
    await fallingWordsButton.waitFor({ timeout: 5000 });
    await fallingWordsButton.click();
    await page.waitForTimeout(500);
    console.log('✅ Falling Words selected\n');

    // Create room
    console.log('📍 Create room');
    const createRoomButton = page.locator('button:has-text("Create Room")');
    await createRoomButton.click();
    await page.waitForTimeout(1000);

    // Fill room details
    const roomNameInput = page.locator('input[placeholder*="room" i], input[placeholder*="name" i]').first();
    await roomNameInput.fill('Falling Words Test');

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
    console.log('📍 Verify Falling Words game started');
    await page.waitForTimeout(1000);

    // Check for falling words
    const wordsExist = await page.locator('div[style*="top"]').count();
    if (wordsExist > 0) {
      console.log('✅ Falling words are visible\n');
    } else {
      console.log('⚠️  Falling words not found yet (waiting for spawn)\n');
    }

    // Check for player stats
    const statsExists = await page.locator('text=/Score|Words|Lost/i').count();
    if (statsExists > 0) {
      console.log('✅ Player stats are visible\n');
    } else {
      console.log('⚠️  Player stats not found\n');
    }

    // Check for speed indicator
    const speedExists = await page.locator('text=/Speed|\\dx/i').count();
    if (speedExists > 0) {
      console.log('✅ Speed indicator is visible\n');
    } else {
      console.log('⚠️  Speed indicator not found\n');
    }

    // Take screenshot
    await page.screenshot({ path: 'falling-words-game-start.png', fullPage: true });
    console.log('📸 Screenshot saved\n');

    // Wait for words to spawn
    console.log('📍 Wait for words to spawn (3 seconds)');
    await page.waitForTimeout(3000);

    // Simulate typing - type some letters to try to match words
    console.log('📍 Simulate gameplay - type various letters');
    const testKeys = ['t', 'y', 'p', 'e', 'a', 'b', 'c', 'd', 'w', 'o'];
    for (const key of testKeys) {
      await page.keyboard.press(key);
      await page.waitForTimeout(400);
    }
    console.log('✅ Typed 10 characters\n');

    await page.waitForTimeout(2000);

    // Check for score updates
    const scoreText = await page.locator('text=/\\d+/').first().textContent();
    console.log(`   Current score display: ${scoreText}\n`);

    // Take final screenshot
    await page.screenshot({ path: 'falling-words-game-playing.png', fullPage: true });
    console.log('📸 Final screenshot saved\n');

    console.log('✅ Falling Words test completed successfully!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'falling-words-error.png', fullPage: true });
    throw error;
  } finally {
    console.log('🏁 Browser closed\n');
    await browser.close();
  }
}

// Run test
testFallingWordsSimple().catch(console.error);
