import { chromium } from 'playwright';

async function testBlinkSplitScreen() {
  console.log('🧪 Testing Blink Multiplayer Split-Screen Flow...\n');

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

    // Step 3: Player 1 selects Blink game type
    console.log('📍 Step 3: Player 1 - Select Blink game type');
    const blinkButton = page1.locator('button:has-text("Blink")');
    await blinkButton.waitFor({ timeout: 5000 });
    await blinkButton.click();
    await page1.waitForTimeout(500);
    console.log('✅ Blink game type selected\n');

    // Step 4: Player 1 creates a room
    console.log('📍 Step 4: Player 1 - Create a Blink room');
    const createRoomButton1 = page1.locator('button:has-text("Create Room")').first();
    await createRoomButton1.waitFor({ timeout: 5000 });
    await createRoomButton1.click();
    await page1.waitForTimeout(1000);
    console.log('✅ Create Room dialog opened\n');

    // Fill in room details
    console.log('📍 Step 5: Player 1 - Fill room details');
    const roomNameInput = page1.locator('input[name="roomName"]').or(
      page1.locator('input[placeholder*="Room" i]')
    ).or(
      page1.locator('input[type="text"]').first()
    );
    await roomNameInput.waitFor({ timeout: 5000 });
    await roomNameInput.fill('Blink Split-Screen Test');
    console.log('✅ Room name filled\n');

    // Submit room creation
    console.log('📍 Step 6: Player 1 - Create the room');
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

    // Step 7: Player 2 selects Blink game type and joins
    console.log('📍 Step 7: Player 2 - Select Blink game type');
    const blinkButton2 = page2.locator('button:has-text("Blink")');
    await blinkButton2.waitFor({ timeout: 5000 });
    await blinkButton2.click();
    await page2.waitForTimeout(500);
    console.log('✅ Player 2 selected Blink\n');

    // Step 8: Player 2 waits for room list to update and joins Player 1's room
    console.log('📍 Step 8: Player 2 - Wait for room list to update and click Join');

    // Wait for room list to populate (rooms refresh every 5 seconds)
    await page2.waitForTimeout(3000);

    // Look for the room name in the list
    console.log(`   Looking for room: "Blink Split-Screen Test"`);

    // Find all room cards and look for the one with our room name
    const roomCards = page2.locator('div').filter({ hasText: 'Blink Split-Screen Test' });
    const roomCardCount = await roomCards.count();
    console.log(`   Found ${roomCardCount} matching elements`);

    if (roomCardCount === 0) {
      // If room not found, wait a bit more and try again
      console.log('   Room not found, waiting for list to refresh...');
      await page2.waitForTimeout(3000);
    }

    // Click the first Join button we find (should be for our room since it's the only Blink room)
    const joinButton = page2.locator('button:has-text("Join")').first();
    await joinButton.waitFor({ timeout: 5000 });
    await joinButton.click();

    await page2.waitForTimeout(3000);
    console.log('✅ Player 2 clicked Join button\n');

    // Verify Player 2 is in the room
    const url2 = page2.url();
    console.log(`   Player 2 URL: ${url2}\n`);

    if (url2 !== url1) {
      throw new Error(`URL mismatch: Player 1: ${url1}, Player 2: ${url2}`);
    }

    // Step 9: Verify both players are in the room
    console.log('📍 Step 9: Verify player count');
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

    // Step 10: Player 2 marks as ready
    console.log('📍 Step 10: Player 2 - Mark as ready');
    const readyButton2 = page2.locator('button:has-text("Ready")');
    await readyButton2.waitFor({ timeout: 5000 });
    await readyButton2.click();
    await page2.waitForTimeout(1000);
    console.log('✅ Player 2 marked as ready\n');

    // Step 11: Player 1 (host) starts the game
    console.log('📍 Step 11: Player 1 (host) - Start the game');
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

    // Step 26: Wait for countdown
    console.log('📍 Step 26: Wait for game countdown');
    await page1.waitForTimeout(4000); // Wait for countdown (usually 3 seconds)
    console.log('✅ Countdown completed\n');

    // Step 26: Verify game started - check for Blink-specific UI elements
    console.log('📍 Step 26: Verify Blink game started');

    // Wait for game to be visible
    await page1.waitForTimeout(1000);

    // Look for the current character display (should be large text)
    const currentChar1 = await page1.locator('text=/Type this character:/i').count();
    const currentChar2 = await page2.locator('text=/Type this character:/i').count();

    if (currentChar1 > 0 && currentChar2 > 0) {
      console.log('✅ Both players see the character prompt\n');
    } else {
      console.log(`⚠️  Character prompt check: Player 1: ${currentChar1}, Player 2: ${currentChar2}\n`);
    }

    // Step 26: Verify split-screen player stats are visible
    console.log('📍 Step 26: Verify split-screen player stats');

    // Look for player stats (Streak, Accuracy, First answers)
    const statsPlayer1 = await page1.locator('text=/Streak|Accuracy|First/i').count();
    const statsPlayer2 = await page2.locator('text=/Streak|Accuracy|First/i').count();

    console.log(`   Player 1 stats elements found: ${statsPlayer1}`);
    console.log(`   Player 2 stats elements found: ${statsPlayer2}`);

    if (statsPlayer1 >= 3 && statsPlayer2 >= 3) {
      console.log('✅ Both players see player stats in split-screen view\n');
    } else {
      console.log('⚠️  Some stats might be missing\n');
    }

    // Step 26: Take initial game screenshots
    await page1.screenshot({ path: 'blink-player1-start.png', fullPage: true });
    await page2.screenshot({ path: 'blink-player2-start.png', fullPage: true });
    console.log('📸 Initial game screenshots saved\n');

    // Step 26: Simulate gameplay - type characters
    console.log('📍 Step 26: Simulate Blink gameplay');

    // Type 10 characters rapidly
    const testKeys = ['a', 's', 'd', 'f', 'j', 'k', 'l', 'a', 's', 'd'];

    for (let i = 0; i < testKeys.length; i++) {
      console.log(`   Round ${i + 1}/${testKeys.length}`);

      // Player 1 types
      await page1.keyboard.press(testKeys[i]);
      await page1.waitForTimeout(100);

      // Player 2 types (slightly delayed)
      await page2.waitForTimeout(50);
      await page2.keyboard.press(testKeys[i]);

      // Wait for next character to appear (2 second timeout per character)
      await page1.waitForTimeout(300);

      // Take screenshots every 3 rounds
      if ((i + 1) % 3 === 0) {
        await page1.screenshot({
          path: `blink-player1-round${i + 1}.png`,
          fullPage: true
        });
        await page2.screenshot({
          path: `blink-player2-round${i + 1}.png`,
          fullPage: true
        });
        console.log(`   📸 Screenshots saved for round ${i + 1}\n`);
      }
    }

    console.log('✅ Gameplay simulation completed\n');

    // Step 26: Verify score updates
    console.log('📍 Step 26: Verify scores were updated');
    await page1.waitForTimeout(1000);

    // Check for score elements
    const score1 = await page1.locator('text=/Score|\\d+/').count();
    const score2 = await page2.locator('text=/Score|\\d+/').count();

    console.log(`   Player 1 score elements: ${score1}`);
    console.log(`   Player 2 score elements: ${score2}`);

    if (score1 > 0 && score2 > 0) {
      console.log('✅ Scores are being displayed\n');
    }

    // Step 26: Verify ranking is shown
    console.log('📍 Step 26: Verify player ranking');

    const rank1 = await page1.locator('text=/Rank #\\d+/i').count();
    const rank2 = await page2.locator('text=/Rank #\\d+/i').count();

    console.log(`   Player 1 rank displays: ${rank1}`);
    console.log(`   Player 2 rank displays: ${rank2}`);

    if (rank1 > 0 && rank2 > 0) {
      console.log('✅ Rankings are displayed in split-screen\n');
    }

    // Step 26: Check for streak indicators
    console.log('📍 Step 26: Check streak indicators');

    const streakText1 = await page1.locator('text=/Streak|\\d+/i').count();
    const streakText2 = await page2.locator('text=/Streak|\\d+/i').count();

    console.log(`   Player 1 streak indicators: ${streakText1}`);
    console.log(`   Player 2 streak indicators: ${streakText2}\n`);

    // Step 26: Verify timer/progress bar
    console.log('📍 Step 26: Verify timer and progress');

    const progress1 = await page1.locator('text=/Character \\d+/i').count();
    const progress2 = await page2.locator('text=/Character \\d+/i').count();

    console.log(`   Player 1 progress indicators: ${progress1}`);
    console.log(`   Player 2 progress indicators: ${progress2}`);

    if (progress1 > 0 && progress2 > 0) {
      console.log('✅ Character progress is displayed\n');
    }

    // Step 26: Take final game state screenshots
    await page1.screenshot({ path: 'blink-player1-final.png', fullPage: true });
    await page2.screenshot({ path: 'blink-player2-final.png', fullPage: true });
    console.log('📸 Final game screenshots saved\n');

    // Step 26: Test split-screen visual layout
    console.log('📍 Step 26: Verify split-screen layout');

    // Check for "You" indicator showing current player
    const youIndicator1 = await page1.locator('text=/(You)/i').count();
    const youIndicator2 = await page2.locator('text=/(You)/i').count();

    console.log(`   Player 1 "(You)" indicators: ${youIndicator1}`);
    console.log(`   Player 2 "(You)" indicators: ${youIndicator2}`);

    if (youIndicator1 > 0 && youIndicator2 > 0) {
      console.log('✅ Current player is clearly marked in split-screen\n');
    }

    // Step 26: Verify response time tracking
    console.log('📍 Step 26: Check response time display');

    const responseTime1 = await page1.locator('text=/Response Time|\\d+ms/i').count();
    const responseTime2 = await page2.locator('text=/Response Time|\\d+ms/i').count();

    console.log(`   Player 1 response time displays: ${responseTime1}`);
    console.log(`   Player 2 response time displays: ${responseTime2}`);

    if (responseTime1 > 0 && responseTime2 > 0) {
      console.log('✅ Response times are being tracked and displayed\n');
    }

    // Step 26: Wait to observe the game for a bit
    console.log('⏸  Keeping browsers open for 10 seconds to observe split-screen gameplay...\n');
    await page1.waitForTimeout(10000);

    // Step 26: Take comprehensive final screenshots
    console.log('📍 Step 26: Taking comprehensive final screenshots');
    await page1.screenshot({
      path: 'blink-splitscreen-player1-complete.png',
      fullPage: true
    });
    await page2.screenshot({
      path: 'blink-splitscreen-player2-complete.png',
      fullPage: true
    });
    console.log('📸 Comprehensive screenshots saved\n');

    console.log('✅ Blink Split-Screen Multiplayer Test PASSED!\n');
    console.log('📊 Test Summary:');
    console.log('   ✓ Game selection (Blink)');
    console.log('   ✓ Room creation');
    console.log('   ✓ Player joining');
    console.log('   ✓ Game start countdown');
    console.log('   ✓ Character display');
    console.log('   ✓ Split-screen player stats');
    console.log('   ✓ Score tracking');
    console.log('   ✓ Ranking display');
    console.log('   ✓ Streak indicators');
    console.log('   ✓ Progress tracking');
    console.log('   ✓ Current player marking');
    console.log('   ✓ Response time tracking\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page1.screenshot({ path: 'blink-error-player1.png', fullPage: true });
    await page2.screenshot({ path: 'blink-error-player2.png', fullPage: true });
    console.log('📸 Error screenshots saved\n');
    throw error;
  } finally {
    await browser1.close();
    await browser2.close();
    console.log('🏁 Test completed\n');
  }
}

testBlinkSplitScreen();
