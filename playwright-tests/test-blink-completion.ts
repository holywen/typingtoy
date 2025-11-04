import { chromium } from 'playwright';

async function testBlinkCompletion() {
  console.log('🧪 Testing Blink Game Completion (50 characters)...\n');

  const browser1 = await chromium.launch({ headless: false });
  const context1 = await browser1.newContext();
  const page1 = await context1.newPage();

  const browser2 = await chromium.launch({ headless: false });
  const context2 = await browser2.newContext();
  const page2 = await context2.newPage();

  try {
    // Setup - Navigate to multiplayer
    console.log('📍 Setup: Navigate to multiplayer lobby');
    await page1.goto('http://localhost:3000/multiplayer?testMode=true');
    await page2.goto('http://localhost:3000/multiplayer?testMode=true');
    await page1.waitForTimeout(2000);

    // Select Blink game type
    console.log('📍 Select Blink game type');
    await page1.locator('button:has-text("Blink")').click();
    await page2.locator('button:has-text("Blink")').click();
    await page1.waitForTimeout(500);

    // Create room
    console.log('📍 Create room');
    const createButton = page1.locator('button:has-text("Create Room")').first();
    await createButton.click();
    await page1.waitForTimeout(500);

    const roomNameInput = page1.locator('input[name="roomName"]').or(
      page1.locator('input[placeholder*="Room" i]')
    ).or(
      page1.locator('input[type="text"]').first()
    );
    await roomNameInput.fill('Completion Test');

    await page1.locator('button:has-text("Create Room")').last().click();
    await page1.waitForTimeout(2000);

    const url1 = page1.url();
    console.log(`   Room URL: ${url1}`);

    // Player 2 joins
    console.log('📍 Player 2 joins');
    await page2.waitForTimeout(2000);
    const joinButton = page2.locator('button:has-text("Join")').first();
    await joinButton.click();
    await page2.waitForTimeout(2000);

    // Players ready and start
    console.log('📍 Ready up and start game');
    await page1.locator('button:has-text("Ready")').click();
    await page1.waitForTimeout(500);
    await page2.locator('button:has-text("Ready")').click();
    await page1.waitForTimeout(1000);
    await page1.locator('button:has-text("Start Game")').click();

    // Wait for countdown
    console.log('📍 Wait for countdown');
    await page1.waitForTimeout(4000);

    // Wait for game to start
    await page1.waitForTimeout(1000);

    console.log('✅ Game started');
    console.log('📍 Player 1 will complete all 50 characters rapidly...\n');

    // Type 50 characters for Player 1 only (to test completion)
    const testKeys = 'abcdefghijklmnopqrstuvwxyz'.split('');
    let keyIndex = 0;

    for (let i = 0; i < 50; i++) {
      const key = testKeys[keyIndex % testKeys.length];
      await page1.keyboard.press(key);

      // Short delay between keystrokes
      await page1.waitForTimeout(50);

      keyIndex++;

      // Progress update
      if ((i + 1) % 10 === 0) {
        console.log(`   Typed ${i + 1}/50 characters`);
      }
    }

    console.log('\n✅ Player 1 completed all 50 characters!');
    console.log('📍 Checking if game ended...\n');

    // Wait a moment for game to end
    await page1.waitForTimeout(2000);

    // Check for game over screen
    const gameOverText1 = await page1.locator('text=/Game Over|Winner|It\'s a Draw/i').count();
    const gameOverText2 = await page2.locator('text=/Game Over|Winner|It\'s a Draw/i').count();

    console.log(`   Player 1 sees game over elements: ${gameOverText1}`);
    console.log(`   Player 2 sees game over elements: ${gameOverText2}`);

    if (gameOverText1 > 0 && gameOverText2 > 0) {
      console.log('\n✅ SUCCESS: Game ended and showing results screen!\n');

      // Take screenshots
      await page1.screenshot({ path: 'blink-completion-player1.png', fullPage: true });
      await page2.screenshot({ path: 'blink-completion-player2.png', fullPage: true });
      console.log('📸 Screenshots saved\n');

      // Wait to view results
      await page1.waitForTimeout(5000);
    } else {
      console.log('\n❌ FAILURE: Game did not end properly!\n');

      // Check what's showing instead
      const charPrompt1 = await page1.locator('text=/Type this character/i').count();
      const charPrompt2 = await page2.locator('text=/Type this character/i').count();

      console.log(`   Player 1 still sees character prompt: ${charPrompt1 > 0}`);
      console.log(`   Player 2 still sees character prompt: ${charPrompt2 > 0}\n`);

      await page1.screenshot({ path: 'blink-completion-failure-p1.png', fullPage: true });
      await page2.screenshot({ path: 'blink-completion-failure-p2.png', fullPage: true });
      console.log('📸 Failure screenshots saved\n');

      throw new Error('Game did not end after 50 characters');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page1.screenshot({ path: 'blink-completion-error-p1.png', fullPage: true });
    await page2.screenshot({ path: 'blink-completion-error-p2.png', fullPage: true });
    throw error;
  } finally {
    await browser1.close();
    await browser2.close();
    console.log('🏁 Test completed\n');
  }
}

testBlinkCompletion();
