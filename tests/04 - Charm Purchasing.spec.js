import { test, expect } from '@playwright/test';


test.describe('Add To Cart Functionality', () =>{
    test.beforeEach(async ({page}) =>{
        // Go to the homepage of the website before each test
        await page.goto('http://localhost:3000') // temporary
    })

    test('Individual Charms Visibility', async ({ page }) => {
        // Locate and click the Charms option in the navigation bar
        const charmsButton = page.getByRole('link', { name: 'Charms' });
        await expect(charmsButton).toBeVisible();
        await charmsButton.click();

        // Assert charm page loads and contains at least one item
        const charmsHeading = page.getByRole('heading', { name: 'Shop Charms' });
        await expect(charmsHeading).toBeVisible();

        const itemButton = page.getByRole('button', { name: 'Add to Cart' }).first();
        await expect(itemButton).toBeVisible();

        // Assert that the name, image, category, price, and number of stocks is visible
        const image = page.getByRole('img', { name: 'B05' });
        const itemName = page.getByRole('heading', { name: 'B05' });
        const price = page.getByText('₱').first();
        const category = page.getByText('Cars, Boy Stuff').nth(1);
        const stocks = page.getByText('in stock').first();

        await expect(image).toBeVisible();
        await expect(itemName).toBeVisible();
        await expect(price).toBeVisible();
        await expect(category).toBeVisible();
        await expect(stocks).toBeVisible();
    })

    test('Charm Categorization', async({page})=>{
        // Locate and click the Charms option in the navigation bar
        const charmsButton = page.getByRole('link', { name: 'Charms' });
        await expect(charmsButton).toBeVisible();
        await charmsButton.click();

        // Locate the Charms Categories section
        const categorySection = page.locator('div').filter({ hasText: 'All CharmsCars, Boy Stuff' }).nth(2);
        await expect(categorySection).toBeVisible();

        // Assert that multiple categories are visible
        const allCategory = page.getByRole('button', { name: 'All Charms' });
        const firstCategory = page.getByRole('button', { name: 'Cars, Boy Stuff Charms' });
        const secondCategory = page.getByRole('button', { name: 'Animals Charms' });

        await expect(allCategory).toBeVisible();
        await expect(firstCategory).toBeVisible();
        await expect(secondCategory).toBeVisible();

        // Assert that the category elements are clickable and items fall within the category
        await allCategory.click();
        await expect(page.getByText('Cars, Boy Stuff').nth(1)).toBeVisible();
        await expect(page.getByText('Animals').nth(1)).toBeVisible();
        await expect(page.getByText('Characters').nth(2)).toBeVisible();

        await firstCategory.click();
        await expect(page.getByText('Cars, Boy Stuff').nth(1)).toBeVisible();
        await expect(page.getByText('Cars, Boy Stuff').nth(2)).toBeVisible();

        await secondCategory.click();
        await expect(page.getByText('Animals').nth(1)).toBeVisible();
        await expect(page.getByText('Animals').nth(2)).toBeVisible();
    });

    test('Charm Search', async({page})=>{
        // Locate and click the Charms option in the navigation bar
        const charmsButton = page.getByRole('link', { name: 'Charms' });
        await expect(charmsButton).toBeVisible();
        await charmsButton.click();

        // Locate the Search Bar and type a valid charm name
        const searchBar = page.getByRole('textbox', { name: 'Search charms...' });
        await expect(searchBar).toBeVisible();
        await searchBar.fill('B05');

        // Assert that only charms with the matching name appear in the result
        const charmItem = page.getByRole('heading', { name: 'B05' });
        await expect(charmItem).toBeVisible();
    });

    test('Add Individual Charms to Cart', async({page})=>{
        // Locate and click the Charms option in the navigation bar
        const charmsButton = page.getByRole('link', { name: 'Charms' });
        await expect(charmsButton).toBeVisible();
        await charmsButton.click();
    
        // Select the first item and add it to cart
        await page.getByRole('button', { name: 'Add to Cart' }).first().click();
        await page.locator('.confirm-btn').click();

        // Locate and click the Cart option in the navigation bar
        const cartButton = page.getByRole('link', { name: 'Cart' });
        await cartButton.click();

        // Assert that there is exactly one item in the cart
        await expect(page.getByText('Individual Charms (1 Charm Item)B05Cars, Boy Stuff₱90 each-1+Total:₱')).toBeVisible();
        await expect(page.getByText('1', { exact: true })).toBeVisible();

        // Charm name should match the one in the cart
        const cartItemName = await page.getByRole('heading', { name: 'B05' }).textContent();
        expect(cartItemName.trim()).toBe('B05');
    });

    test('Puchase Flow for Individual Charms', async({page})=>{
        // Locate and click the Charms option in the navigation bar
        const charmsButton = page.getByRole('link', { name: 'Charms' });
        await expect(charmsButton).toBeVisible();
        await charmsButton.click();
    
        // Select the first item and add it to cart
        await page.getByRole('button', { name: 'Add to Cart' }).first().click();
        await page.locator('.confirm-btn').click();

        // Locate and click the Cart option in the navigation bar
        const cartButton = page.getByRole('link', { name: 'Cart' });
        await cartButton.click();

        // Locate and click the checkout button
        const checkoutButton = page.getByRole('button', { name: 'CHECKOUT' });
        await checkoutButton.click();
    });
    
})
