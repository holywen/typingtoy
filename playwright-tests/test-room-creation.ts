import { chromium } from 'playwright';

async function testRoomCreation() {
  console.log('🧪 Testing Room Creation Flow...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Clean up handled by server auto-cleanup on connection
    console.log('📍 Step 0: Server will auto-cleanup stale rooms\n');

    // Navigate to multiplayer lobby
    console.log('📍 Step 1: Navigate to /multiplayer');
    await page.goto('http://localhost:3000/multiplayer');
    await page.waitForTimeout(3000); // Wait for socket connection
    console.log('✅ Lobby loaded\n');

    // Check if Create Room button exists
    console.log('📍 Step 2: Looking for Create Room button');
    const createRoomButton = page.locator('button:has-text("Create Room")');
    await createRoomButton.waitFor({ timeout: 5000 });
    console.log('✅ Create Room button found\n');

    // Click Create Room button
    console.log('📍 Step 3: Click Create Room button');
    await createRoomButton.click();
    await page.waitForTimeout(1000);
    console.log('✅ Create Room modal should be open\n');

    // Check if modal is visible
    console.log('📍 Step 4: Verify modal is visible');
    const modal = page.locator('[role="dialog"]').or(page.locator('.modal')).or(page.locator('form'));
    const isModalVisible = await modal.count() > 0;
    if (isModalVisible) {
      console.log('✅ Modal is visible\n');
    } else {
      console.log('⚠️  Modal not found, checking for any form elements\n');
    }

    // Fill in room name
    console.log('📍 Step 5: Fill in room name');
    const roomNameInput = page.locator('input[name="roomName"]').or(
      page.locator('input[placeholder*="Room" i]')
    ).or(
      page.locator('input[type="text"]').first()
    );
    await roomNameInput.waitFor({ timeout: 5000 });
    await roomNameInput.fill('Test Room E2E');
    console.log('✅ Room name filled: "Test Room E2E"\n');

    // Select game type if there's a dropdown
    console.log('📍 Step 6: Check for game type selector');
    const gameTypeSelect = page.locator('select[name="gameType"]');
    const hasGameTypeSelect = await gameTypeSelect.count() > 0;
    if (hasGameTypeSelect) {
      await gameTypeSelect.selectOption('falling-blocks');
      console.log('✅ Game type selected: falling-blocks\n');
    } else {
      console.log('⚠️  No game type selector found (might be pre-selected)\n');
    }

    // Set max players
    console.log('📍 Step 7: Check for max players selector');
    const maxPlayersSelect = page.locator('select[name="maxPlayers"]');
    const hasMaxPlayersSelect = await maxPlayersSelect.count() > 0;
    if (hasMaxPlayersSelect) {
      await maxPlayersSelect.selectOption('4');
      console.log('✅ Max players set to 4\n');
    } else {
      console.log('⚠️  No max players selector found (might have default)\n');
    }

    // Optional: Set password
    console.log('📍 Step 8: Check for password field');
    const passwordInput = page.locator('input[name="password"]').or(
      page.locator('input[type="password"]')
    );
    const hasPasswordInput = await passwordInput.count() > 0;
    if (hasPasswordInput) {
      // Leave password empty for public room
      console.log('✅ Password field found (leaving empty for public room)\n');
    } else {
      console.log('⚠️  No password field found\n');
    }

    // Submit the form
    console.log('📍 Step 9: Submit room creation form');
    // Be more specific: find the "Create Room" button inside the dialog
    const createButton = page.locator('button:has-text("Create Room")').last();
    await createButton.click();
    console.log('✅ Create button clicked\n');

    // Wait for navigation or room to appear
    console.log('📍 Step 10: Wait for room creation');
    await page.waitForTimeout(3000);

    // Check if we navigated to room page or if room appears in list
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}\n`);

    if (currentUrl.includes('/multiplayer/room/')) {
      console.log('✅ Successfully navigated to room page!\n');

      // Verify room details
      console.log('📍 Step 11: Verify room details');
      const roomName = await page.locator('h1').first().textContent();
      console.log(`   Room name: ${roomName}`);

      const playerCount = await page.locator('text=/\\d+\\/\\d+ Players/').textContent();
      console.log(`   Player count: ${playerCount}`);

      const status = await page.locator('text=/WAITING|PLAYING|FINISHED/').textContent();
      console.log(`   Room status: ${status}\n`);

      console.log('✅ Room creation flow PASSED!\n');
    } else if (currentUrl.includes('/multiplayer')) {
      console.log('⚠️  Still on lobby page, checking if room appears in list\n');

      // Look for the newly created room in the list
      await page.waitForTimeout(2000);
      const testRoom = page.locator('text=Test Room E2E');
      const roomExists = await testRoom.count() > 0;

      if (roomExists) {
        console.log('✅ Room "Test Room E2E" found in room list!\n');
        console.log('✅ Room creation flow PASSED!\n');
      } else {
        console.log('❌ Room not found in list\n');
        console.log('❌ Room creation flow FAILED\n');
      }
    }

    // Take a screenshot
    await page.screenshot({ path: 'room-creation-test-result.png', fullPage: true });
    console.log('📸 Screenshot saved: room-creation-test-result.png\n');

    // Keep browser open for 5 seconds to observe
    console.log('⏸  Keeping browser open for 5 seconds...\n');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page.screenshot({ path: 'room-creation-test-error.png', fullPage: true });
    console.log('📸 Error screenshot saved: room-creation-test-error.png\n');
  } finally {
    await browser.close();
    console.log('🏁 Test completed\n');
  }
}

testRoomCreation();
