import { test, expect } from '@playwright/test';


test.describe('Bracelet Customization Functionality', () => {
    test.beforeEach(async ({ page }) => {
        // Go to the homepage of the website before each test
        await page.goto('http://localhost:3000') // temporary
    })

    test('Create a simple charm in the customize page', async ({ page }) => {
        await page.goto('http://localhost:3000/');
        await page.getByRole('link', { name: 'Customize', exact: true }).click();
        await page.getByRole('button', { name: 'Close help' }).click();
        await page.getByTitle('B05 - ₱').click();
        await page.getByTitle('Click to place charm here or').first().click();
        await page.getByTitle('B18 - ₱').click();
        await page.getByTitle('Click to place charm here or').nth(1).click();
        await page.getByTitle('B10 - ₱').click();
        await page.getByTitle('Click to place charm here or').nth(2).click();
    });

    test('Testing reset button', async ({ page }) => {
        await page.goto('http://localhost:3000/');
        await page.getByRole('link', { name: 'Customize', exact: true }).click();
        await page.getByRole('button', { name: 'Close help' }).click();
        await page.getByTitle('B02 - ₱').click();
        await page.getByTitle('Click to place charm here or').first().click();
        await page.getByTitle('B07 - ₱').click();
        await page.getByTitle('Click to place charm here or').nth(1).click();
        await page.getByRole('button', { name: 'Reset bracelet to starting' }).click();
        await page.getByRole('button', { name: 'Confirm' }).click();
    });

    test('Changing starting charm', async ({ page }) => {
        await page.goto('http://localhost:3000/');
        await page.getByRole('link', { name: 'Customize', exact: true }).click();
        await page.getByRole('button', { name: 'Close help' }).click();
        await page.getByRole('combobox').nth(1).selectOption('152');
        await page.getByRole('combobox').nth(1).selectOption('153');
    });

    test('Browse charms by category', async ({ page }) => {
        await page.goto('http://localhost:3000/');
        await page.getByRole('link', { name: 'Customize', exact: true }).click();
        await page.getByRole('button', { name: 'Close help' }).click();
        await page.locator('div').filter({ hasText: /^Animals$/ }).click();
        await page.getByTitle('A01 - ₱').click();
        await page.getByTitle('Click to place charm here or').first().click();
        await page.getByTitle('A07 - ₱').click();
        await page.getByTitle('Click to place charm here or').nth(1).click();
        await page.getByRole('img', { name: 'Characters Charms' }).click();
        await page.getByTitle('C04 - ₱').click();
        await page.getByTitle('Click to place charm here or').nth(2).click();
        await page.getByTitle('C05 - ₱').click();
        await page.getByTitle('Click to place charm here or').nth(3).click();
    });

    test('Changing the charms size', async ({ page }) => {
        await page.goto('http://localhost:3000/');
        await page.getByRole('link', { name: 'Customize', exact: true }).click();
        await page.getByRole('button', { name: 'Close help' }).click();
        await page.getByRole('combobox').first().selectOption('18');
        await page.getByRole('combobox').first().selectOption('24');
        await page.getByTitle('B05 - ₱').click();
        await page.getByTitle('Click to place charm here or').first().click();
        await page.getByTitle('B05 - ₱').click();
        await page.getByTitle('Click to place charm here or').nth(1).click();
        await page.getByTitle('B05 - ₱').click();
        await page.locator('div:nth-child(19)').first().click();
        await page.getByRole('combobox').first().selectOption('18');
    });
})
