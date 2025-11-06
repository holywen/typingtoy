import { test, expect, Browser, Page } from '@playwright/test';

/**
 * Test: Leaderboard System
 *
 * This test verifies:
 * 1. Leaderboard page loads correctly
 * 2. Global leaderboard displays
 * 3. Period tabs work
 * 4. Game type selector works
 * 5. Stats page displays
 * 6. Navigation works
 */

test.describe('Leaderboard System', () => {
  test('should display leaderboard page and navigate tabs', async ({ page }) => {
    // Navigate to multiplayer page
    await page.goto('http://localhost:3000/multiplayer');

    // Wait for page to load
    await page.waitForSelector('h1:has-text("Multiplayer Lobby")', { timeout: 10000 });

    // Take screenshot of lobby with leaderboard button
    await page.screenshot({
      path: 'playwright-tests/screenshots/01-lobby-with-leaderboard-button.png',
      fullPage: true
    });
    console.log('✅ Screenshot: Lobby with leaderboard button');

    // Click leaderboard button
    const leaderboardButton = page.locator('button:has-text("Leaderboard")');
    await expect(leaderboardButton).toBeVisible({ timeout: 5000 });
    await leaderboardButton.click();

    // Wait for leaderboard page to load
    await page.waitForURL('**/multiplayer/leaderboard', { timeout: 10000 });
    await page.waitForSelector('h1:has-text("Leaderboard")', { timeout: 5000 });

    // Take screenshot of leaderboard page
    await page.screenshot({
      path: 'playwright-tests/screenshots/02-leaderboard-page-global.png',
      fullPage: true
    });
    console.log('✅ Screenshot: Leaderboard page - Global tab');

    // Verify Global Rankings tab is active
    const globalTab = page.locator('button:has-text("Global Rankings")');
    await expect(globalTab).toHaveClass(/bg-blue-600/);
    console.log('✅ Global Rankings tab is active');

    // Verify leaderboard panel exists
    await expect(page.locator('text=All Time')).toBeVisible();
    await expect(page.locator('text=This Month')).toBeVisible();
    await expect(page.locator('text=This Week')).toBeVisible();
    await expect(page.locator('text=Today')).toBeVisible();
    console.log('✅ Period tabs visible');

    // Test game type selector
    await page.locator('button:has-text("Blink")').first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'playwright-tests/screenshots/03-leaderboard-blink-game.png',
      fullPage: true
    });
    console.log('✅ Screenshot: Leaderboard - Blink game selected');

    // Test period switching
    await page.locator('button:has-text("This Week")').click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'playwright-tests/screenshots/04-leaderboard-weekly.png',
      fullPage: true
    });
    console.log('✅ Screenshot: Leaderboard - Weekly period');

    // Switch to Daily
    await page.locator('button:has-text("Today")').click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'playwright-tests/screenshots/05-leaderboard-daily.png',
      fullPage: true
    });
    console.log('✅ Screenshot: Leaderboard - Daily period');

    // Test My Stats tab (will show sign-in required if not authenticated)
    const statsTab = page.locator('button:has-text("My Stats")');
    await statsTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'playwright-tests/screenshots/06-leaderboard-stats-tab.png',
      fullPage: true
    });
    console.log('✅ Screenshot: Leaderboard - Stats tab');

    // Test Friends tab (will show sign-in required if not authenticated)
    const friendsTab = page.locator('button:has-text("Friends")');
    await friendsTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'playwright-tests/screenshots/07-leaderboard-friends-tab.png',
      fullPage: true
    });
    console.log('✅ Screenshot: Leaderboard - Friends tab');

    // Go back to Global tab
    await globalTab.click();
    await page.waitForTimeout(1000);

    // Test different game types
    const gameTypes = ['Falling Blocks', 'Falling Words', 'Speed Race'];
    for (let i = 0; i < gameTypes.length; i++) {
      const gameButton = page.locator(`button:has-text("${gameTypes[i]}")`).first();
      await gameButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: `playwright-tests/screenshots/08-${i}-leaderboard-${gameTypes[i].toLowerCase().replace(' ', '-')}.png`,
        fullPage: true
      });
      console.log(`✅ Screenshot: Leaderboard - ${gameTypes[i]}`);
    }

    // Test navigation back to lobby
    const backButton = page.locator('button:has-text("Back to Lobby")');
    await expect(backButton).toBeVisible();
    await backButton.click();
    await page.waitForURL('**/multiplayer', { timeout: 5000 });
    await page.waitForSelector('h1:has-text("Multiplayer Lobby")');
    console.log('✅ Successfully navigated back to lobby');

    await page.screenshot({
      path: 'playwright-tests/screenshots/09-back-to-lobby.png',
      fullPage: true
    });
    console.log('✅ Screenshot: Back to lobby');
  });

  test('should display leaderboard components correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/multiplayer/leaderboard');

    // Wait for page to load
    await page.waitForSelector('h1:has-text("Leaderboard")', { timeout: 10000 });

    // Verify all main UI elements are present
    await expect(page.locator('text=Global Rankings')).toBeVisible();
    await expect(page.locator('text=Friends')).toBeVisible();
    await expect(page.locator('text=My Stats')).toBeVisible();
    console.log('✅ All tabs are visible');

    // Verify game type buttons
    await expect(page.locator('button:has-text("Falling Blocks")')).toBeVisible();
    await expect(page.locator('button:has-text("Blink")')).toBeVisible();
    await expect(page.locator('button:has-text("Falling Words")')).toBeVisible();
    await expect(page.locator('button:has-text("Speed Race")')).toBeVisible();
    console.log('✅ All game type buttons are visible');

    // Verify period buttons
    await expect(page.locator('button:has-text("All Time")')).toBeVisible();
    await expect(page.locator('button:has-text("This Month")')).toBeVisible();
    await expect(page.locator('button:has-text("This Week")')).toBeVisible();
    await expect(page.locator('button:has-text("Today")')).toBeVisible();
    console.log('✅ All period buttons are visible');

    // Take final screenshot
    await page.screenshot({
      path: 'playwright-tests/screenshots/10-leaderboard-all-elements.png',
      fullPage: true
    });
    console.log('✅ Screenshot: Leaderboard with all elements visible');
  });
});
