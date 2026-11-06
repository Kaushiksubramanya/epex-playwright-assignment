import { test, expect } from '@playwright/test';
import { MarketResultsPage } from '../pages/market-results.page';
import { writeMarketDataToCSV } from '../utils/csvHelper';

test.describe('Market Data Page Tests', () => {
    test('market data page has title', async ({ page }) => {
        const marketPage = new MarketResultsPage(page);

        // Navigate to the website
        await marketPage.navigateToMarketResults();
        await marketPage.handleHumanVerification();
        await marketPage.acceptCookies();

        // Verify page title is available
        const title = await marketPage.getPageTitle();
        console.log('Page title:', title);
        expect(title.length).toBeGreaterThan(0);

        // Identify available tables
        const tables = marketPage.getTables();
        await expect(tables.first()).toBeVisible();

        // Verify that the table headers are not empty
        const headers = await marketPage.getTableHeaders();
        console.log('Market Table Headers:', headers);
        expect(headers.length).toBeGreaterThan(0);
        const expectedHeaders = [
            'Low(£/MWh)',
            'High(£/MWh)',
            'Last(£/MWh)',
            'Weight Avg.(£/MWh)'
        ];
        for (const header of expectedHeaders) {
            expect(headers).toContain(header);
        }

        // Verify that the market data is not empty
        const records = await marketPage.getMarketData();

        console.log('Total extracted records:', records.length);
        console.log('First five records:', records.slice(0, 5));
        expect(records.length).toBeGreaterThan(0);
        await writeMarketDataToCSV(records);
    });
});