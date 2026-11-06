import { writeFile, mkdir } from 'node:fs/promises';
import path from 'path';
import { MarketRecord } from '../interfaces/market_record.interface';

// Escape values to maintain valid CSV formatting
function escapeCsvValue(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
}

export async function writeMarketDataToCSV(
    records: MarketRecord[]
): Promise<void> {

    try {
        // Step 1: Create output directory
        const filePath = path.join(
            process.cwd(),
            'output',
            'market-results.csv'
        );
        //Step 2: Ensure the output directory exists
        await mkdir(path.dirname(filePath), { recursive: true });

        // Step 3: Create CSV header
        const csvHeader = 'Low,High,Last,Weight Avg.';


        // Step 4: Convert records into CSV rows
        const csvRows = records.map(record =>
            [
                record.low,
                record.high,
                record.last,
                record.weightAvg
            ].map(escapeCsvValue).join(',')
        );

        // Step 5: Combine header and rows
        const csvContent = [
            csvHeader,
            ...csvRows
        ].join('\n');

        // Step 6: Write CSV file
        await writeFile(filePath, csvContent, 'utf-8');

        console.log(`CSV successfully generated: ${filePath}`);
    }
    catch (error) {
        throw new Error(
            `Failed to generate market results CSV: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}