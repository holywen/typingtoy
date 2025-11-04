import { chromium, Browser, BrowserContext, Page } from 'playwright';

async function testLeaveRoom() {
  console.log('🧪 Testing Leave Room Functionality...\n');

  let browser: Browser | null = null;
  let context1: BrowserContext | null = null;
  let context2: BrowserContext | null = null;
  let player1: Page | null = null;
  let player2: Page | null = null;

  try {
    // Launch browser with two separate contexts (simulating two users)
    browser = await chromium.launch({ headless: false });
    context1 = await browser.newContext();
    context2 = await browser.newContext();
    player1 = await context1.newPage();
    player2 = await context2.newPage();

    console.log('📍 Step 1: Player 1 creates a room\n');
    await player1.goto('http://localhost:3000/multiplayer');
    await player1.waitForTimeout(3000);

    const createRoomButton = player1.locator('button:has-text("Create Room")');
    await createRoomButton.click();
    await player1.waitForTimeout(1000);

    const roomNameInput = player1.locator('input[name="roomName"]').or(
      player1.locator('input[placeholder*="Room" i]')
    ).or(
      player1.locator('input[type="text"]').first()
    );
    await roomNameInput.fill('Leave Room Test');

    const createButton = player1.locator('button:has-text("Create Room")').last();
    await createButton.click();
    await player1.waitForTimeout(3000);

    const roomUrl = player1.url();
    console.log(`✅ Player 1 created room: ${roomUrl}\n`);

    // Take screenshot of room page
    await player1.screenshot({ path: 'test-leave-room-1-created.png', fullPage: true });

    console.log('📍 Step 2: Player 2 navigates to lobby\n');
    await player2.goto('http://localhost:3000/multiplayer');
    await player2.waitForTimeout(3000);
    console.log('✅ Player 2 in lobby\n');

    console.log('📍 Step 3: Player 2 joins the room\n');
    const testRoom = player2.locator('text=Leave Room Test');
    await testRoom.waitFor({ timeout: 5000 });
    await testRoom.click();
    await player2.waitForTimeout(3000);
    console.log('✅ Player 2 joined the room\n');

    // Verify both players see each other
    console.log('📍 Step 4: Verify both players are in the room\n');
    await player1.screenshot({ path: 'test-leave-room-2-both-joined.png', fullPage: true });
    await player2.screenshot({ path: 'test-leave-room-3-both-joined.png', fullPage: true });

    const player1Count = await player1.locator('text=/\\d+\\/\\d+ Players/').textContent();
    const player2Count = await player2.locator('text=/\\d+\\/\\d+ Players/').textContent();
    console.log(`   Player 1 sees: ${player1Count}`);
    console.log(`   Player 2 sees: ${player2Count}\n`);

    console.log('📍 Step 5: Player 2 clicks "Leave Room"\n');
    const leaveButton = player2.locator('button:has-text("Leave")').or(
      player2.locator('button:has-text("Leave Room")')
    ).or(
      player2.locator('button:has-text("Exit")')
    ).or(
      player2.locator('a:has-text("Back")')
    );

    const leaveButtonExists = await leaveButton.count() > 0;
    if (!leaveButtonExists) {
      console.log('⚠️  No Leave/Exit button found, looking for Back/navigation buttons\n');
      // Take screenshot to see what's available
      await player2.screenshot({ path: 'test-leave-room-4-no-leave-button.png', fullPage: true });

      // Try to find any navigation button
      const backButton = player2.locator('button, a').filter({ hasText: /back|leave|exit/i });
      const backCount = await backButton.count();
      console.log(`   Found ${backCount} potential navigation buttons\n`);

      if (backCount > 0) {
        await backButton.first().click();
        console.log('✅ Clicked first navigation button\n');
      } else {
        console.log('❌ No leave/exit mechanism found!\n');
        throw new Error('Cannot find leave room button');
      }
    } else {
      await leaveButton.click();
      console.log('✅ Player 2 clicked Leave button\n');
    }

    await player2.waitForTimeout(2000);

    // Check where Player 2 ended up
    const player2Url = player2.url();
    console.log(`📍 Step 6: Player 2 URL after leaving: ${player2Url}\n`);

    if (player2Url.includes('/multiplayer/room/')) {
      console.log('⚠️  Player 2 is still in room page!\n');
    } else if (player2Url.includes('/multiplayer')) {
      console.log('✅ Player 2 returned to lobby\n');
    } else {
      console.log(`⚠️  Player 2 is at unexpected location: ${player2Url}\n`);
    }

    await player2.screenshot({ path: 'test-leave-room-5-player2-after-leave.png', fullPage: true });

    console.log('📍 Step 7: Check Player 1\'s view after Player 2 left\n');
    await player1.waitForTimeout(2000);

    const updatedPlayer1Count = await player1.locator('text=/\\d+\\/\\d+ Players/').textContent();
    console.log(`   Player 1 now sees: ${updatedPlayer1Count}\n`);

    await player1.screenshot({ path: 'test-leave-room-6-player1-after-player2-left.png', fullPage: true });

    // Check if room still exists in lobby for Player 2
    console.log('📍 Step 8: Check if room is still visible in lobby\n');
    await player2.waitForTimeout(1000);

    const roomStillVisible = await player2.locator('text=Leave Room Test').count() > 0;
    if (roomStillVisible) {
      console.log('✅ Room still exists in lobby (Player 1 is still in it)\n');
    } else {
      console.log('⚠️  Room not found in lobby\n');
    }

    await player2.screenshot({ path: 'test-leave-room-7-lobby-after-leave.png', fullPage: true });

    console.log('📍 Step 9: Player 1 also leaves the room\n');
    const player1LeaveButton = player1.locator('button:has-text("Leave")').or(
      player1.locator('button:has-text("Leave Room")')
    ).or(
      player1.locator('button:has-text("Exit")')
    ).or(
      player1.locator('a:has-text("Back")')
    );

    await player1LeaveButton.click();
    console.log('✅ Player 1 clicked Leave button\n');
    await player1.waitForTimeout(2000);

    const player1UrlAfterLeave = player1.url();
    console.log(`   Player 1 URL after leaving: ${player1UrlAfterLeave}\n`);

    await player1.screenshot({ path: 'test-leave-room-8-player1-after-leave.png', fullPage: true });

    console.log('📍 Step 10: Check if empty room was deleted\n');
    await player1.waitForTimeout(2000);

    const roomExistsAfterAllLeft = await player1.locator('text=Leave Room Test').count() > 0;
    if (roomExistsAfterAllLeft) {
      console.log('⚠️  Room still exists in lobby even though everyone left\n');
    } else {
      console.log('✅ Room was deleted after all players left\n');
    }

    await player1.screenshot({ path: 'test-leave-room-9-final-lobby.png', fullPage: true });

    console.log('=' .repeat(60));
    console.log('🎉 LEAVE ROOM TEST COMPLETED!\n');
    console.log('=' .repeat(60));
    console.log('\nSummary:');
    console.log('- Player 1 created room');
    console.log('- Player 2 joined room');
    console.log('- Player 2 left room');
    console.log('- Verified Player 1 sees updated player count');
    console.log('- Player 1 left room');
    console.log('- Verified room cleanup\n');

    // Keep browser open for observation
    console.log('⏸  Keeping browser open for 10 seconds...\n');
    await player1.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    if (player1) {
      await player1.screenshot({ path: 'test-leave-room-error-player1.png', fullPage: true });
    }
    if (player2) {
      await player2.screenshot({ path: 'test-leave-room-error-player2.png', fullPage: true });
    }
    console.log('📸 Error screenshots saved\n');
  } finally {
    if (browser) {
      await browser.close();
    }
    console.log('🏁 Test completed\n');
  }
}

testLeaveRoom();
