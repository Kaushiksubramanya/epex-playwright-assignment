import { Page, Locator } from '@playwright/test';
import { MarketRecord } from '../interfaces/market_record.interface';

export class MarketResultsPage {
    readonly page: Page;
    //private readonly url = 'https://www.epexspot.com/en/market-results?market_area=GB&auction=&delivery_date=2026-11-04&underlying_year=&modality=Continuous&sub_modality=&technology=&data_mode=table&period=&production_period=&product=30';


    constructor(page: Page) {
        this.page = page;
    }

    private readonly baseUrl ='https://www.epexspot.com/en/market-results';

    private getPreviousDayDate(): string {
        const date = new Date();

        // Subtract one calendar day
        date.setDate(date.getDate() - 1);

        // Format as YYYY-MM-DD
        return date.toISOString().split('T')[0];
    }

    async navigateToMarketResults() {
        const url = new URL(this.baseUrl);

        url.searchParams.set('market_area', 'GB');
        url.searchParams.set('auction', '');
        url.searchParams.set('delivery_date', this.getPreviousDayDate());
        url.searchParams.set('underlying_year', '');
        url.searchParams.set('modality', 'Continuous');
        url.searchParams.set('sub_modality', '');
        url.searchParams.set('technology', '');
        url.searchParams.set('data_mode', 'table');
        url.searchParams.set('period', '');
        url.searchParams.set('production_period', '');
        url.searchParams.set('product', '30');

        console.log('Navigating to:', url.toString());

        await this.page.goto(url.toString(),{
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });
    }
    // async navigateToMarketResults(): Promise<void> {
    //     await this.page.goto(this.url, {
    //         waitUntil: 'domcontentloaded',
    //         timeout: 60000
    //     });
    // }

    async acceptCookies(): Promise<void> {
        await this.page.getByRole('button', { name: 'Allow all cookies' }).click();
    }

    async handleHumanVerification(): Promise<void> {

        const title = await this.page.title();

        if (title.includes('Human Verification')) {

            console.log('Human verification detected.');
            console.log('Please complete the verification in the browser.');

            await this.page.pause();

            console.log('Resuming Playwright execution.');
        }
    }


    async getPageTitle(): Promise<string> {
        await this.page.waitForFunction(
            () => document.title.length > 0,
            { timeout: 30000 }
        );

        return await this.page.title();
    }

    getTables(): Locator {
        return this.page.locator('table');
    }
    // Return the page body text
    async getPageContent(): Promise<string> {
        return await this.page.locator('body').innerText();
    }

    async getTableHeaders(): Promise<string[]> {

        // Wait for the market results container
        await this.page.locator('.custom-tables').waitFor({
            state: 'visible',
            timeout: 30000
        });

        // Locate the market results table
        const table = this.page.locator('.custom-tables table').first();

        // Locate all column headers
        const headers = table.getByRole('columnheader');

        // Retrieve header text
        const headerTexts = await headers.allTextContents();

        //console.log('Headers retrieved:', headerTexts);

        return headerTexts
            .map(header => header.replace(/\s+/g, ' ').trim())
            .filter(header => header.length > 0);
    }

    async getMarketData(): Promise<MarketRecord[]> {

        // Identify the market results table
        const table = this.page.locator('.custom-tables table').first();

        // Get all column headers
        const headers = await table.getByRole('columnheader').allTextContents();

        // Clean header names
        const cleanHeaders = headers
            .map(header => header.replace(/\s+/g, ' ').trim())
            .filter(header => header.length > 0);

        // Identify required column positions
        const lowIndex = cleanHeaders.findIndex(header => header.startsWith('Low'));
        const highIndex = cleanHeaders.findIndex(header => header.startsWith('High'));
        const lastIndex = cleanHeaders.findIndex(header => header.startsWith('Last'));
        const weightAvgIndex = cleanHeaders.findIndex(header => header.startsWith('Weight Avg.'));

        // Validate that all required columns exist
        if (
            lowIndex === -1 ||
            highIndex === -1 ||
            lastIndex === -1 ||
            weightAvgIndex === -1
        ) {
            throw new Error('One or more required market data headers were not found.');
        }

        // Get all data rows
        const rows = table.locator('tbody tr');

        const rowCount = await rows.count();

        const marketRecords: MarketRecord[] = [];

        for (let i = 0; i < rowCount; i++) {

            const cells = await rows.nth(i).locator('td').allTextContents();

            marketRecords.push({
                low: cells[lowIndex]?.trim() ?? '',
                high: cells[highIndex]?.trim() ?? '',
                last: cells[lastIndex]?.trim() ?? '',
                weightAvg: cells[weightAvgIndex]?.trim() ?? ''
            });
        }

        return marketRecords;
    }
}