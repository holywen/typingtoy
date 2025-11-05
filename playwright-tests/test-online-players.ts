import { chromium } from 'playwright';

async function testOnlinePlayers() {
  let browser: any = null;
  let page1: any = null;
  let page2: any = null;

  try {
    console.log('🚀 Starting Online Players List Test...\n');

    // Launch browser
    browser = await chromium.launch({ headless: false });

    // Create two browser contexts (simulating two different users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    page1 = await context1.newPage();
    page2 = await context2.newPage();

    // Player 1: Navigate to multiplayer lobby
    console.log('👤 Player 1: Opening multiplayer lobby...');

    // Listen to browser console logs
    page1.on('console', (msg: any) => {
      console.log('🖥️  BROWSER 1:', msg.text());
    });

    await page1.goto('http://localhost:3000/multiplayer');
    await page1.waitForLoadState('networkidle');
    await page1.waitForTimeout(2000);

    // Check initial online players count
    console.log('👤 Player 1: Checking online players count...');
    const player1Count = await page1.textContent('text=Online Players');
    console.log(`   Player 1 sees: ${player1Count}`);

    // Take screenshot of player 1's view
    await page1.screenshot({ path: 'test-results/player1-initial.png' });

    // Player 2: Navigate to multiplayer lobby
    console.log('\n👤 Player 2: Opening multiplayer lobby...');

    // Listen to browser console logs
    page2.on('console', (msg: any) => {
      console.log('🖥️  BROWSER 2:', msg.text());
    });

    await page2.goto('http://localhost:3000/multiplayer');
    await page2.waitForLoadState('networkidle');
    await page2.waitForTimeout(2000);

    // Check if player 2 sees updated count
    console.log('👤 Player 2: Checking online players count...');
    const player2Count = await page2.textContent('text=Online Players');
    console.log(`   Player 2 sees: ${player2Count}`);

    // Take screenshot of player 2's view
    await page2.screenshot({ path: 'test-results/player2-initial.png' });

    // Wait for updates to propagate
    await page1.waitForTimeout(2000);
    await page2.waitForTimeout(2000);

    // Check if player 1 sees the updated count (should now show 2 players)
    console.log('\n👤 Player 1: Checking updated online players count...');
    await page1.reload();
    await page1.waitForLoadState('networkidle');
    await page1.waitForTimeout(2000);

    const player1UpdatedCount = await page1.textContent('text=Online Players');
    console.log(`   Player 1 sees after update: ${player1UpdatedCount}`);

    // Check the online players list section
    console.log('\n🔍 Checking Online Players List section...');

    const onlinePlayersList1 = await page1.locator('[class*="OnlinePlayerList"]').count();
    console.log(`   Player 1: Found ${onlinePlayersList1} online players list components`);

    // Check for individual player entries
    const playerEntries1 = await page1.locator('[class*="player"]').count();
    console.log(`   Player 1: Found ${playerEntries1} player entries`);

    // Log the actual HTML content for debugging
    console.log('\n📋 Debugging info - Page 1 HTML structure:');
    const bodyHTML1 = await page1.locator('body').innerHTML();
    const relevantHTML1 = bodyHTML1.substring(0, 2000); // First 2000 chars
    console.log(relevantHTML1);

    await page1.screenshot({ path: 'test-results/player1-final.png', fullPage: true });
    await page2.screenshot({ path: 'test-results/player2-final.png', fullPage: true });

    console.log('\n✅ Test completed - check screenshots in test-results/');
    console.log('   - test-results/player1-initial.png');
    console.log('   - test-results/player2-initial.png');
    console.log('   - test-results/player1-final.png');
    console.log('   - test-results/player2-final.png');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    // Cleanup
    if (page1) await page1.close();
    if (page2) await page2.close();
    if (browser) await browser.close();
  }
}

// Run test
testOnlinePlayers().catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
