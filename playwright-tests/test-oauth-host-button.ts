import { chromium } from 'playwright';

/**
 * Test: OAuth Host Button Fix
 *
 * Purpose: Verify that OAuth users who create rooms can see the "Start Game" button
 * Bug: Previously, OAuth hosts could only see "Ready" button because playerId mismatch
 * Fix: Room page now uses userId || deviceId (same as server) for playerId
 */

async function testOAuthHostButton() {
  console.log('🧪 Testing OAuth Host Button Fix...\n');

  let browser = null;
  let hostContext = null;
  let guestContext = null;
  let hostPage = null;
  let guestPage = null;

  try {
    browser = await chromium.launch({ headless: false });

    // Test 1: Guest user (non-OAuth) - should work as before
    console.log('========== TEST 1: Guest User (Control) ==========\n');
    guestContext = await browser.newContext();
    guestPage = await guestContext.newPage();

    // Enable console logging
    guestPage.on('console', msg => {
      if (msg.text().includes('🔍') || msg.text().includes('ROOM PAGE')) {
        console.log(`[GUEST BROWSER] ${msg.text()}`);
      }
    });

    console.log('📍 Guest: Navigate to /multiplayer');
    await guestPage.goto('http://localhost:3000/multiplayer');
    await guestPage.waitForTimeout(3000);
    console.log('✅ Guest: Lobby loaded\n');

    console.log('📍 Guest: Create a room');
    const guestCreateButton = guestPage.locator('button:has-text("Create Room")');
    await guestCreateButton.waitFor({ timeout: 5000 });
    await guestCreateButton.click();
    await guestPage.waitForTimeout(1000);

    const guestRoomNameInput = guestPage.locator('input[name="roomName"]').or(
      guestPage.locator('input[placeholder*="Room" i]')
    );
    await guestRoomNameInput.fill('Guest Test Room');

    const guestCreateSubmit = guestPage.locator('button:has-text("Create Room")').last();
    await guestCreateSubmit.click();
    await guestPage.waitForTimeout(3000);

    // Check for Start Game button (guest host should see it)
    const guestStartButton = guestPage.locator('button:has-text("Start Game")');
    const guestHasStartButton = await guestStartButton.count() > 0;

    if (guestHasStartButton) {
      console.log('✅ Guest host can see "Start Game" button (as expected)\n');
    } else {
      console.log('❌ Guest host CANNOT see "Start Game" button (unexpected!)\n');
    }

    // Close guest session
    await guestContext.close();
    console.log('🔒 Guest session closed\n');

    // Test 2: OAuth user - this is the fix we're testing
    console.log('========== TEST 2: OAuth User (The Fix) ==========\n');
    hostContext = await browser.newContext();
    hostPage = await hostContext.newPage();

    // Enable console logging for debugging
    hostPage.on('console', msg => {
      if (msg.text().includes('🔍') || msg.text().includes('ROOM PAGE')) {
        console.log(`[OAUTH BROWSER] ${msg.text()}`);
      }
    });

    console.log('📍 OAuth: Simulating OAuth session');

    // Navigate first to set up session storage
    await hostPage.goto('http://localhost:3000');

    // Mock NextAuth session in sessionStorage (NextAuth uses this for client-side session)
    const mockUserId = '507f1f77bcf86cd799439011'; // MongoDB ObjectId format
    const mockSession = {
      user: {
        id: mockUserId,
        name: 'OAuth Test User',
        email: 'oauth@test.com',
        image: null
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    // Set the session in localStorage (where NextAuth client stores it)
    await hostPage.evaluate((session) => {
      // NextAuth stores session token
      localStorage.setItem('__Secure-next-auth.session-token', JSON.stringify(session));
      // Also set in sessionStorage for immediate availability
      sessionStorage.setItem('__Secure-next-auth.session-token', JSON.stringify(session));
    }, mockSession);

    console.log(`✅ OAuth: Mocked session with userId: ${mockUserId}\n`);

    console.log('📍 OAuth: Navigate to /multiplayer');
    await hostPage.goto('http://localhost:3000/multiplayer', { waitUntil: 'networkidle' });
    await hostPage.waitForTimeout(4000); // Wait for socket and session to initialize
    console.log('✅ OAuth: Lobby loaded\n');

    console.log('📍 OAuth: Create a room');
    const hostCreateButton = hostPage.locator('button:has-text("Create Room")');
    await hostCreateButton.waitFor({ timeout: 5000 });
    await hostCreateButton.click();
    await hostPage.waitForTimeout(1000);

    const hostRoomNameInput = hostPage.locator('input[name="roomName"]').or(
      hostPage.locator('input[placeholder*="Room" i]')
    );
    await hostRoomNameInput.fill('OAuth Test Room');

    const hostCreateSubmit = hostPage.locator('button:has-text("Create Room")').last();
    await hostCreateSubmit.click();
    await hostPage.waitForTimeout(3000);

    // THE CRITICAL TEST: Check for Start Game button
    console.log('📍 OAuth: Checking for "Start Game" button...');
    const startButton = hostPage.locator('button:has-text("Start Game")');
    const hasStartButton = await startButton.count() > 0;

    // Also check for Ready button (should be disabled for host)
    const readyButton = hostPage.locator('button:has-text("Ready")').or(
      hostPage.locator('button:has-text("Not Ready")')
    );
    const hasReadyButton = await readyButton.count() > 0;
    const readyButtonDisabled = hasReadyButton ? await readyButton.isDisabled() : false;

    console.log('\n========== TEST RESULTS ==========');
    console.log(`OAuth host has "Start Game" button: ${hasStartButton ? '✅ YES' : '❌ NO'}`);
    console.log(`OAuth host has "Ready" button: ${hasReadyButton ? 'YES' : 'NO'}`);
    if (hasReadyButton) {
      console.log(`OAuth host "Ready" button disabled: ${readyButtonDisabled ? 'YES (correct)' : 'NO (should be disabled)'}`);
    }
    console.log('==================================\n');

    if (hasStartButton) {
      console.log('🎉 TEST PASSED: OAuth host can see "Start Game" button!');
      console.log('   The fix is working correctly.\n');
    } else {
      console.log('❌ TEST FAILED: OAuth host CANNOT see "Start Game" button');
      console.log('   The bug still exists.\n');
    }

    // Test 3: Have a guest join and verify host can still start
    console.log('========== TEST 3: Guest Joins OAuth Host Room ==========\n');

    // Open second browser context for guest joining
    const joinerContext = await browser.newContext();
    const joinerPage = await joinerContext.newPage();

    console.log('📍 Joiner: Navigate to /multiplayer');
    await joinerPage.goto('http://localhost:3000/multiplayer');
    await joinerPage.waitForTimeout(3000);

    // Find and join the OAuth Test Room
    console.log('📍 Joiner: Looking for "OAuth Test Room"');
    const roomListItem = joinerPage.locator('text=OAuth Test Room').first();
    const roomExists = await roomListItem.count() > 0;

    if (roomExists) {
      console.log('✅ Joiner: Found room in list');

      // Click the room card or join button
      const joinButton = roomListItem.locator('..').locator('button:has-text("Join")');
      if (await joinButton.count() > 0) {
        await joinButton.click();
      } else {
        // Try clicking the room card itself
        await roomListItem.click();
      }

      await joinerPage.waitForTimeout(3000);
      console.log('✅ Joiner: Joined room\n');

      // Back to host page - verify Start Game button is now enabled
      await hostPage.waitForTimeout(2000);
      console.log('📍 OAuth Host: Checking if "Start Game" is enabled...');

      const startButtonEnabled = await startButton.isEnabled();
      console.log(`   "Start Game" button enabled: ${startButtonEnabled ? '✅ YES' : '⚠️  NO (waiting for players to ready)'}\n`);

    } else {
      console.log('⚠️  Joiner: Room not found in list\n');
    }

    // Take screenshots
    await hostPage.screenshot({ path: 'oauth-host-button-test.png', fullPage: true });
    console.log('📸 Screenshot saved: oauth-host-button-test.png\n');

    // Keep browsers open to observe
    console.log('⏸  Keeping browsers open for 8 seconds to observe...\n');
    await hostPage.waitForTimeout(8000);

    await joinerContext.close();

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    if (hostPage) {
      await hostPage.screenshot({ path: 'oauth-host-button-error.png', fullPage: true });
      console.log('📸 Error screenshot saved: oauth-host-button-error.png\n');
    }
  } finally {
    if (hostContext) await hostContext.close();
    if (guestContext) await guestContext.close();
    if (browser) await browser.close();
    console.log('🏁 Test completed\n');
  }
}

testOAuthHostButton();
