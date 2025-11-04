import { chromium } from 'playwright';

async function testQuickMatch() {
  console.log('🧪 Testing Quick Match Flow...\n');

  const browser1 = await chromium.launch({ headless: false });
  const context1 = await browser1.newContext();
  const page1 = await context1.newPage();

  const browser2 = await chromium.launch({ headless: false });
  const context2 = await browser2.newContext();
  const page2 = await context2.newPage();

  try {
    // Clean up handled by server auto-cleanup on connection
    console.log('📍 Step 0: Server will auto-cleanup stale rooms\n');

    // Player 1: Navigate to multiplayer lobby
    console.log('📍 Step 1: Player 1 - Navigate to /multiplayer');
    await page1.goto('http://localhost:3000/multiplayer');
    await page1.waitForTimeout(3000); // Wait for socket connection
    console.log('✅ Player 1 lobby loaded\n');

    // Player 2: Navigate to multiplayer lobby
    console.log('📍 Step 2: Player 2 - Navigate to /multiplayer');
    await page2.goto('http://localhost:3000/multiplayer');
    await page2.waitForTimeout(3000); // Wait for socket connection
    console.log('✅ Player 2 lobby loaded\n');

    // Get player names
    const player1Name = await page1.locator('text=/Playing as:.*/')?.textContent();
    const player2Name = await page2.locator('text=/Playing as:.*/')?.textContent();
    console.log(`   Player 1: ${player1Name}`);
    console.log(`   Player 2: ${player2Name}\n`);

    // Player 1: Click Quick Match
    console.log('📍 Step 3: Player 1 - Click Quick Match button');
    const quickMatch1 = page1.locator('button:has-text("Quick Match")').or(
      page1.locator('button:has-text("Find Match")')
    );
    await quickMatch1.waitFor({ timeout: 5000 });
    await quickMatch1.click();
    console.log('✅ Player 1 joined matchmaking queue\n');

    await page1.waitForTimeout(1000);

    // Player 2: Click Quick Match
    console.log('📍 Step 4: Player 2 - Click Quick Match button');
    const quickMatch2 = page2.locator('button:has-text("Quick Match")').or(
      page2.locator('button:has-text("Find Match")')
    );
    await quickMatch2.waitFor({ timeout: 5000 });
    await quickMatch2.click();
    console.log('✅ Player 2 joined matchmaking queue\n');

    // Wait for match to be found
    console.log('📍 Step 5: Wait for match to be found (max 10 seconds)');
    await page1.waitForTimeout(5000);

    // Check if both players navigated to a room
    const url1 = page1.url();
    const url2 = page2.url();
    console.log(`   Player 1 URL: ${url1}`);
    console.log(`   Player 2 URL: ${url2}\n`);

    if (url1.includes('/multiplayer/room/') && url2.includes('/multiplayer/room/')) {
      // Extract room IDs from URLs
      const roomId1 = url1.split('/multiplayer/room/')[1];
      const roomId2 = url2.split('/multiplayer/room/')[1];

      if (roomId1 === roomId2) {
        console.log('✅ Both players matched to the same room!\n');
        console.log(`   Room ID: ${roomId1}\n`);

        // Verify room details for player 1
        console.log('📍 Step 6: Verify room details for Player 1');
        const roomName1 = await page1.locator('h1').first().textContent();
        const playerCount1 = await page1.locator('text=/\\d+\\/\\d+ Players/').textContent();
        console.log(`   Room name: ${roomName1}`);
        console.log(`   Player count: ${playerCount1}\n`);

        // Verify room details for player 2
        console.log('📍 Step 7: Verify room details for Player 2');
        const roomName2 = await page2.locator('h1').first().textContent();
        const playerCount2 = await page2.locator('text=/\\d+\\/\\d+ Players/').textContent();
        console.log(`   Room name: ${roomName2}`);
        console.log(`   Player count: ${playerCount2}\n`);

        // Check if both show 2/4 players
        if (playerCount1?.includes('2/') && playerCount2?.includes('2/')) {
          console.log('✅ Both players see 2 players in the room\n');
        } else {
          console.log('⚠️  Player count mismatch\n');
        }

        console.log('✅ Quick Match flow PASSED!\n');
      } else {
        console.log('❌ Players matched to different rooms\n');
        console.log(`   Player 1 room: ${roomId1}`);
        console.log(`   Player 2 room: ${roomId2}\n`);
        console.log('❌ Quick Match flow FAILED\n');
      }
    } else {
      console.log('⚠️  One or both players did not navigate to a room\n');

      // Check for "Searching" or "Waiting" status
      const searching1 = await page1.locator('text=/Searching|Finding|Waiting/i').count();
      const searching2 = await page2.locator('text=/Searching|Finding|Waiting/i').count();

      if (searching1 > 0 || searching2 > 0) {
        console.log('⚠️  Players still in matchmaking queue (timeout may need adjustment)\n');
      }

      console.log('❌ Quick Match flow FAILED\n');
    }

    // Take screenshots
    await page1.screenshot({ path: 'quick-match-player1.png', fullPage: true });
    await page2.screenshot({ path: 'quick-match-player2.png', fullPage: true });
    console.log('📸 Screenshots saved\n');

    // Keep browsers open for 5 seconds to observe
    console.log('⏸  Keeping browsers open for 5 seconds...\n');
    await page1.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page1.screenshot({ path: 'quick-match-error-player1.png', fullPage: true });
    await page2.screenshot({ path: 'quick-match-error-player2.png', fullPage: true });
    console.log('📸 Error screenshots saved\n');
  } finally {
    await browser1.close();
    await browser2.close();
    console.log('🏁 Test completed\n');
  }
}

testQuickMatch();
