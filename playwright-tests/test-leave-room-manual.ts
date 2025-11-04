import { chromium } from 'playwright';

async function testLeaveRoomManual() {
  console.log('🧪 Testing Leave Room - Manual Click Test...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('📍 Step 1: Navigate to lobby and create a room\n');
    await page.goto('http://localhost:3000/multiplayer');
    await page.waitForTimeout(3000);

    const createButton = page.locator('button:has-text("Create Room")');
    await createButton.click();
    await page.waitForTimeout(1000);

    // Just click create without filling anything (will use defaults)
    const modalCreateButton = page.locator('button:has-text("Create Room")').last();
    await modalCreateButton.click();
    await page.waitForTimeout(3000);

    const roomUrl = page.url();
    console.log(`✅ Room created: ${roomUrl}\n`);

    console.log('📍 Step 2: Verify "Leave Room" button exists\n');
    await page.screenshot({ path: 'test-leave-manual-1-room-page.png', fullPage: true });

    // Look for leave button/link
    const leaveLink = page.locator('text=Leave Room').or(
      page.locator('a:has-text("Leave")').or(
        page.locator('button:has-text("Leave")')
      )
    );

    const leaveExists = await leaveLink.count() > 0;
    if (leaveExists) {
      console.log(`✅ Found "Leave Room" link/button\n`);

      console.log('📍 Step 3: Click "Leave Room"\n');
      await leaveLink.first().click();
      await page.waitForTimeout(2000);

      const afterLeaveUrl = page.url();
      console.log(`   URL after leaving: ${afterLeaveUrl}\n`);

      if (afterLeaveUrl.includes('/multiplayer/room/')) {
        console.log('❌ ISSUE: Still on room page after clicking Leave!\n');
      } else if (afterLeaveUrl.includes('/multiplayer')) {
        console.log('✅ SUCCESS: Returned to lobby\n');
      } else {
        console.log(`⚠️  Unexpected URL: ${afterLeaveUrl}\n`);
      }

      await page.screenshot({ path: 'test-leave-manual-2-after-leave.png', fullPage: true });

      console.log('📍 Step 4: Check server logs for leave event\n');
      console.log('   (Check terminal for socket disconnect/leave messages)\n');

    } else {
      console.log('❌ No "Leave Room" button/link found!\n');
      console.log('   Available navigation options on page:\n');

      const allLinks = await page.locator('a, button').allTextContents();
      console.log('   All clickable elements:', allLinks.slice(0, 20));
    }

    console.log('\n⏸  Keeping browser open for 15 seconds for manual inspection...\n');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: 'test-leave-manual-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('🏁 Test completed\n');
  }
}

testLeaveRoomManual();
