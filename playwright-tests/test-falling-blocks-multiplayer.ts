import { chromium } from 'playwright';

async function testFallingBlocksMultiplayer() {
  console.log('🧪 Testing FallingBlocks Multiplayer Flow...\n');

  const browser1 = await chromium.launch({ headless: false });
  const context1 = await browser1.newContext();
  const page1 = await context1.newPage();

  const browser2 = await chromium.launch({ headless: false });
  const context2 = await browser2.newContext();
  const page2 = await context2.newPage();

  try {
    // Step 1: Player 1 navigates to multiplayer lobby with test mode
    console.log('📍 Step 1: Player 1 - Navigate to /multiplayer with test mode');
    await page1.goto('http://localhost:3000/multiplayer?testMode=true');
    await page1.waitForTimeout(3000);
    console.log('✅ Player 1 lobby loaded (test mode enabled)\n');

    // Step 2: Player 2 navigates to multiplayer lobby with test mode
    console.log('📍 Step 2: Player 2 - Navigate to /multiplayer with test mode');
    await page2.goto('http://localhost:3000/multiplayer?testMode=true');
    await page2.waitForTimeout(3000);
    console.log('✅ Player 2 lobby loaded (test mode enabled)\n');

    // Get player names
    const player1Name = await page1.locator('text=/Playing as:.*/')?.textContent();
    const player2Name = await page2.locator('text=/Playing as:.*/')?.textContent();
    console.log(`   Player 1: ${player1Name}`);
    console.log(`   Player 2: ${player2Name}\n`);

    // Step 3: Player 1 creates a room
    console.log('📍 Step 3: Player 1 - Create a room');
    const createRoomButton1 = page1.locator('button:has-text("Create Room")');
    await createRoomButton1.waitFor({ timeout: 5000 });
    await createRoomButton1.click();
    await page1.waitForTimeout(1000);
    console.log('✅ Create Room dialog opened\n');

    // Fill in room details
    console.log('📍 Step 4: Player 1 - Fill room details');
    const roomNameInput = page1.locator('input[name="roomName"]').or(
      page1.locator('input[placeholder*="Room" i]')
    ).or(
      page1.locator('input[type="text"]').first()
    );
    await roomNameInput.waitFor({ timeout: 5000 });
    await roomNameInput.fill('FallingBlocks Test Room');
    console.log('✅ Room name filled\n');

    // Submit room creation
    console.log('📍 Step 5: Player 1 - Create the room');
    const createButton = page1.locator('button:has-text("Create Room")').last();
    await createButton.click();
    await page1.waitForTimeout(3000);
    console.log('✅ Room created\n');

    // Verify we're in the room
    const url1 = page1.url();
    console.log(`   Player 1 URL: ${url1}\n`);

    if (!url1.includes('/multiplayer/room/')) {
      throw new Error('Player 1 did not navigate to room page');
    }

    const roomId = url1.split('/multiplayer/room/')[1];
    console.log(`✅ Room ID: ${roomId}\n`);

    // Step 6: Player 2 joins the room
    console.log('📍 Step 6: Player 2 - Join the room');
    await page2.waitForTimeout(2000); // Wait for room to appear in list

    // Look for the Join button in the available rooms list
    const joinButton = page2.locator('button:has-text("Join")').first();
    await joinButton.waitFor({ timeout: 5000 });
    await joinButton.click();
    await page2.waitForTimeout(3000);
    console.log('✅ Player 2 joined room\n');

    // Verify Player 2 is in the room
    const url2 = page2.url();
    console.log(`   Player 2 URL: ${url2}\n`);

    if (url2 !== url1) {
      throw new Error(`URL mismatch: Player 1: ${url1}, Player 2: ${url2}`);
    }

    // Step 7: Verify both players are in the room
    console.log('📍 Step 7: Verify player count');
    await page1.waitForTimeout(2000);
    const playerCount1 = await page1.locator('text=/\\d+\\/\\d+ Players/').textContent();
    console.log(`   Player count (Player 1 view): ${playerCount1}`);

    const playerCount2 = await page2.locator('text=/\\d+\\/\\d+ Players/').textContent();
    console.log(`   Player count (Player 2 view): ${playerCount2}\n`);

    // In test mode, we should have 2 players
    if (playerCount1?.includes('2/') && playerCount2?.includes('2/')) {
      console.log('✅ Two players successfully joined (test mode working!)\n');
    } else {
      console.log('⚠️  Expected 2 players but got different count');
      console.log(`   This might indicate test mode is not working correctly\n`);
      throw new Error(`Player count mismatch: P1="${playerCount1}", P2="${playerCount2}"`);
    }

    // Step 8: Player 2 marks as ready
    console.log('📍 Step 8: Player 2 - Mark as ready');
    const readyButton2 = page2.locator('button:has-text("Ready")');
    await readyButton2.waitFor({ timeout: 5000 });
    await readyButton2.click();
    await page2.waitForTimeout(1000);
    console.log('✅ Player 2 marked as ready\n');

    // Step 9: Player 1 (host) starts the game
    console.log('📍 Step 9: Player 1 (host) - Start the game');
    const startButton = page1.locator('button:has-text("Start Game")');
    await startButton.waitFor({ timeout: 5000 });

    // Check if button is enabled
    const isDisabled = await startButton.isDisabled();
    if (isDisabled) {
      console.log('⚠️  Start button is disabled, checking requirements...');
      const buttonText = await startButton.textContent();
      console.log(`   Button text: ${buttonText}\n`);
      throw new Error('Start button is disabled');
    }

    await startButton.click();
    console.log('✅ Start game clicked\n');

    // Step 10: Wait for countdown
    console.log('📍 Step 10: Wait for game countdown');
    await page1.waitForTimeout(4000); // Wait for countdown (usually 3 seconds)
    console.log('✅ Countdown completed\n');

    // Step 11: Verify game started - check for game elements
    console.log('📍 Step 11: Verify game started');

    // Look for game UI elements (score, WPM, etc)
    const gameUI1 = await page1.locator('text=/Score:|WPM:|Accuracy:/i').count();
    const gameUI2 = await page2.locator('text=/Score:|WPM:|Accuracy:/i').count();

    if (gameUI1 > 0 && gameUI2 > 0) {
      console.log('✅ Both players see game UI\n');
    } else {
      console.log(`⚠️  Game UI check: Player 1: ${gameUI1}, Player 2: ${gameUI2}\n`);
    }

    // Take screenshots of game state
    await page1.screenshot({ path: 'falling-blocks-player1-game.png', fullPage: true });
    await page2.screenshot({ path: 'falling-blocks-player2-game.png', fullPage: true });
    console.log('📸 Game screenshots saved\n');

    // Step 12: Simulate some gameplay
    console.log('📍 Step 12: Simulate gameplay for 10 seconds');

    // Type some random keys on both players
    const keys = ['a', 's', 'd', 'f', 'j', 'k', 'l'];

    for (let i = 0; i < 20; i++) {
      const randomKey1 = keys[Math.floor(Math.random() * keys.length)];
      const randomKey2 = keys[Math.floor(Math.random() * keys.length)];

      await page1.keyboard.press(randomKey1);
      await page2.keyboard.press(randomKey2);
      await page1.waitForTimeout(500);
    }

    console.log('✅ Gameplay simulated\n');

    // Step 13: Take final screenshots
    await page1.screenshot({ path: 'falling-blocks-player1-final.png', fullPage: true });
    await page2.screenshot({ path: 'falling-blocks-player2-final.png', fullPage: true });
    console.log('📸 Final screenshots saved\n');

    // Step 14: Wait to observe
    console.log('⏸  Keeping browsers open for 10 seconds to observe gameplay...\n');
    await page1.waitForTimeout(10000);

    console.log('✅ FallingBlocks Multiplayer Test PASSED!\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page1.screenshot({ path: 'falling-blocks-error-player1.png', fullPage: true });
    await page2.screenshot({ path: 'falling-blocks-error-player2.png', fullPage: true });
    console.log('📸 Error screenshots saved\n');
  } finally {
    await browser1.close();
    await browser2.close();
    console.log('🏁 Test completed\n');
  }
}

testFallingBlocksMultiplayer();
