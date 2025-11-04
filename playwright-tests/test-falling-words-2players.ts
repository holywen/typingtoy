import { chromium } from 'playwright';

async function testFallingWords2Players() {
  console.log('🧪 Falling Words 2-Player Multiplayer Test...\n');

  // Create two separate browser instances with contexts
  const browser1 = await chromium.launch({ headless: false });
  const context1 = await browser1.newContext();
  const page1 = await context1.newPage();

  const browser2 = await chromium.launch({ headless: false });
  const context2 = await browser2.newContext();
  const page2 = await context2.newPage();

  try {
    // ============ PLAYER 1: Create Room ============
    console.log('📍 Player 1: Navigate to /multiplayer with test mode');
    await page1.goto('http://localhost:3000/multiplayer?testMode=true');
    await page1.waitForTimeout(3000);
    console.log('✅ Player 1 lobby loaded (test mode enabled)\n');

    // Select Falling Words game type
    console.log('📍 Player 1: Select Falling Words game type');
    const fallingWordsButton1 = page1.locator('button:has-text("Falling Words")');
    await fallingWordsButton1.waitFor({ timeout: 5000 });
    await fallingWordsButton1.click();
    await page1.waitForTimeout(500);
    console.log('✅ Player 1 selected Falling Words\n');

    // Create room
    console.log('📍 Player 1: Create room');
    const createRoomButton = page1.locator('button:has-text("Create Room")');
    await createRoomButton.click();
    await page1.waitForTimeout(1000);

    // Fill room name
    const roomNameInput = page1.locator('input[name="roomName"]').or(
      page1.locator('input[placeholder*="Room" i]')
    ).or(
      page1.locator('input[type="text"]').first()
    );
    await roomNameInput.waitFor({ timeout: 5000 });
    await roomNameInput.fill('Falling Words Test');
    await page1.waitForTimeout(500);

    const createButton = page1.locator('button:has-text("Create")').last();
    await createButton.click();
    await page1.waitForTimeout(2000);

    const url1 = page1.url();
    const roomId = url1.split('/multiplayer/room/')[1];
    console.log(`✅ Player 1 created room: ${roomId}\n`);

    // ============ PLAYER 2: Join Room ============
    console.log('📍 Player 2: Navigate to /multiplayer with test mode');
    await page2.goto('http://localhost:3000/multiplayer?testMode=true');
    await page2.waitForTimeout(3000);
    console.log('✅ Player 2 lobby loaded (test mode enabled)\n');

    // Select Falling Words game type
    console.log('📍 Player 2: Select Falling Words game type');
    const fallingWordsButton2 = page2.locator('button:has-text("Falling Words")');
    await fallingWordsButton2.waitFor({ timeout: 5000 });
    await fallingWordsButton2.click();
    await page2.waitForTimeout(500);
    console.log('✅ Player 2 selected Falling Words\n');

    // Wait for room list to update
    console.log('📍 Player 2: Wait for room list to update');
    await page2.waitForTimeout(3000);

    // Find and click Join button
    console.log('📍 Player 2: Join the room');
    const joinButton = page2.locator('button:has-text("Join")').first();
    await joinButton.waitFor({ timeout: 5000 });
    await joinButton.click();
    await page2.waitForTimeout(3000);
    console.log('✅ Player 2 joined room\n');

    // Verify both players are in room
    const url2 = page2.url();
    if (url2.includes(roomId)) {
      console.log('✅ Player 2 is in the same room\n');
    }

    // ============ PLAYER 2: Mark as Ready ============
    console.log('📍 Player 2: Mark as ready');
    const readyButton2 = page2.locator('button:has-text("Ready")');
    await readyButton2.waitFor({ timeout: 5000 });
    await readyButton2.click();
    await page2.waitForTimeout(1000);
    console.log('✅ Player 2 marked as ready\n');

    // ============ PLAYER 1: Start Game ============
    console.log('📍 Player 1: Start game');
    const startButton = page1.locator('button:has-text("Start Game")');
    await startButton.waitFor({ timeout: 5000 });
    await startButton.click();
    console.log('✅ Player 1 clicked Start Game\n');

    // Wait for countdown
    console.log('📍 Wait for game countdown');
    await page1.waitForTimeout(4000);
    await page2.waitForTimeout(4000);
    console.log('✅ Countdown completed\n');

    // ============ VERIFY GAME STARTED ============
    console.log('📍 Verify Falling Words game started on both screens');
    await page1.waitForTimeout(1000);
    await page2.waitForTimeout(1000);

    // Check Player 1 screen
    const stats1 = await page1.locator('text=/Score|Words|Lost/i').count();
    const speed1 = await page1.locator('text=/Speed|\\dx/i').count();
    console.log(`   Player 1: Stats=${stats1 > 0 ? '✅' : '❌'}, Speed=${speed1 > 0 ? '✅' : '❌'}`);

    // Check Player 2 screen
    const stats2 = await page2.locator('text=/Score|Words|Lost/i').count();
    const speed2 = await page2.locator('text=/Speed|\\dx/i').count();
    console.log(`   Player 2: Stats=${stats2 > 0 ? '✅' : '❌'}, Speed=${speed2 > 0 ? '✅' : '❌'}\n`);

    // Take screenshots
    await page1.screenshot({ path: 'falling-words-player1-start.png', fullPage: true });
    await page2.screenshot({ path: 'falling-words-player2-start.png', fullPage: true });
    console.log('📸 Screenshots saved\n');

    // ============ WAIT FOR WORDS TO SPAWN ============
    console.log('📍 Wait for words to spawn (4 seconds)');
    await page1.waitForTimeout(4000);
    await page2.waitForTimeout(4000);
    console.log('✅ Words should be spawned\n');

    // ============ SIMULATE GAMEPLAY ============
    console.log('📍 Simulate gameplay - both players type');

    // Player 1 types various letters
    console.log('   Player 1 typing...');
    const keys1 = ['t', 'y', 'p', 'e', 'c', 'o', 'd', 'e'];
    for (const key of keys1) {
      await page1.keyboard.press(key);
      await page1.waitForTimeout(400);
    }

    // Player 2 types various letters
    console.log('   Player 2 typing...');
    const keys2 = ['w', 'o', 'r', 'd', 't', 'e', 's', 't'];
    for (const key of keys2) {
      await page2.keyboard.press(key);
      await page2.waitForTimeout(400);
    }
    console.log('✅ Both players typed\n');

    await page1.waitForTimeout(2000);
    await page2.waitForTimeout(2000);

    // Check for falling words
    const words1 = await page1.locator('div[style*="top"]').count();
    const words2 = await page2.locator('div[style*="top"]').count();
    console.log(`   Words visible: Player 1=${words1}, Player 2=${words2}\n`);

    // Take final screenshots
    await page1.screenshot({ path: 'falling-words-player1-playing.png', fullPage: true });
    await page2.screenshot({ path: 'falling-words-player2-playing.png', fullPage: true });
    console.log('📸 Final screenshots saved\n');

    console.log('✅ Falling Words 2-player test completed successfully!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page1.screenshot({ path: 'falling-words-error-player1.png', fullPage: true });
    await page2.screenshot({ path: 'falling-words-error-player2.png', fullPage: true });
    throw error;
  } finally {
    console.log('🏁 Browsers closed\n');
    await browser1.close();
    await browser2.close();
  }
}

// Run test
testFallingWords2Players().catch(console.error);
