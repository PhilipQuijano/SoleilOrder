import { test, expect } from '@playwright/test';


test.describe('Add To Cart Functionality', () =>{
    test.beforeEach(async ({page}) =>{
        // Go to the homepage of the website before each test
        await page.goto('http://localhost:3000') // temporary
    })

    test('Add Customized Bracelets to Cart', async ({ page }) => {
        // Locate and click the Customize option in the navigation bar
        const customizeButton =  page.getByRole('link', { name: 'Customize', exact: true });
        await expect(customizeButton).toBeVisible();
        await customizeButton.click();

        // Simulate the customization process
        await page.getByRole('button', { name: 'Close help' }).click(); // close tutorial
        
        const finalizeButton = page.getByRole('button', { name: 'Finalize your Bracelet' })
        await expect(finalizeButton).toBeVisible();
        await finalizeButton.click()

        const addToCart = page.getByRole('button', { name: '🛒 Add to Cart' })
        await expect(addToCart).toBeVisible();
        await addToCart.click();

        // Bracelet should appear in the cart
        const bracelet = page.getByRole('heading', { name: 'Bracelet #1 - 17cm' });
        await expect(bracelet).toBeVisible();

        // Click the price breakdown and assert that it is visible
        const priceBreakdown =  page.getByRole('button', { name: 'Price Breakdown ▼' });
        await priceBreakdown.click();
        const braceletPrice =  page.getByText('₱').nth(1);
        await expect(braceletPrice).toBeVisible;
    })

    test('Add Individual Charms to Cart', async ({ page }) => {
        // Locate and click the Charms option in the navigation bar
        const charmsButton = page.getByRole('link', { name: 'Charms' });
        await expect(charmsButton).toBeVisible();
        await charmsButton.click();
    
        // Select the first item, update the quantity to 2, and add it to cart
        await page.getByRole('button', { name: 'Add to Cart' }).first().click();
        await page.getByRole('button', { name: '+' }).click();
        await page.locator('.confirm-btn').click();

        // Locate and click the Cart option in the navigation bar
        const cartButton = page.getByRole('link', { name: 'Cart' });
        await cartButton.click();

        // The newly added charm should appear in the cart
        await expect(page.locator('div').filter({ hasText: /^B05Cars, Boy Stuff₱90 each-2\+Total:₱180$/ }).nth(1)).toBeVisible();

        // The quantity and price should be displayed
        await expect(page.getByText('2')).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^Total:₱180$/ }).first()).toBeVisible();
    })

    test('Clear Cart Functionality', async ({ page }) => {
        // Locate and click the Charms option in the navigation bar
        const charmsButton = page.getByRole('link', { name: 'Charms' });
        await expect(charmsButton).toBeVisible();
        await charmsButton.click();
    
        // Select the first item, update the quantity to 2, and add it to cart
        await page.getByRole('button', { name: 'Add to Cart' }).first().click();
        await page.getByRole('button', { name: '+' }).click();
        await page.locator('.confirm-btn').click();

        // Locate and click the Cart option in the navigation bar
        const cartButton = page.getByRole('link', { name: 'Cart' });
        await cartButton.click();

        // Locate and click the clear cart
        const clearButton =  page.getByRole('button', { name: 'CLEAR CART' });
        await expect(clearButton).toBeVisible();
        await clearButton.click();
        await page.getByRole('button', { name: 'Confirm' }).click();

        // Assert that there are no items in the cart
        await expect(page.getByRole('heading', { name: 'Your Cart is Empty' })).toBeVisible();
    })

    test('Remove Individual Item from Cart', async ({ page }) => {
        // Locate and click the Charms option in the navigation bar
        const charmsButton = page.getByRole('link', { name: 'Charms' });
        await expect(charmsButton).toBeVisible();
        await charmsButton.click();
    
        // Select the first item and add it to cart
        await page.getByRole('button', { name: 'Add to Cart' }).first().click();
        await page.getByRole('button', { name: '+' }).click();
        await page.locator('.confirm-btn').click();
    
        // Select the second item and add it to cart
        await page.getByRole('button', { name: 'Add to Cart' }).first().click();
        await page.getByRole('button', { name: '+' }).nth(1).click()  
        await page.locator('.confirm-btn').click();

        // Locate and click the Cart option in the navigation bar
        const cartButton = page.getByRole('link', { name: 'Cart' });
        await cartButton.click();

        // Delete the first charm in the cart
        const deleteButton = page.getByRole('button', { name: 'Remove charm' }).first();
        await expect(deleteButton).toBeVisible();
        await deleteButton.click();

        // Assert that only one charm remains in the cart
        const cartDetails = page.getByText('Individual Charms (1 Charm Item)B18Cars, Boy Stuff₱90 each-2+Total:₱');
        await expect(cartDetails).toBeVisible();
    })


    test('Quantitiy Update Functionality', async ({ page }) => {
        // Locate and click the Charms option in the navigation bar
        const charmsButton = page.getByRole('link', { name: 'Charms' });
        await expect(charmsButton).toBeVisible();
        await charmsButton.click();
    
        // Select the first item, update the quantity to 2, and add it to cart
        await page.getByRole('button', { name: 'Add to Cart' }).first().click();
        await page.getByRole('button', { name: '+' }).click();
        await page.locator('.confirm-btn').click();

        // Locate and click the Cart option in the navigation bar
        const cartButton = page.getByRole('link', { name: 'Cart' });
        await cartButton.click();

        // Add one more of the same item and assert the new quantity to 3
        await page.getByRole('button', { name: '+' }).click();
        await expect(page.getByText('3')).toBeVisible();
        
        // The new total price should be updated
        const newPrice =   page.locator('div').filter({ hasText: /^Total:₱270$/ }).first();
        await expect(newPrice).toBeVisible();
    })

    test('Edit a Bracelet in Cart', async ({ page }) => {
        // Locate and click the Customize option in the navigation bar
        const customizeButton =  page.getByRole('link', { name: 'Customize', exact: true });
        await expect(customizeButton).toBeVisible();
        await customizeButton.click();

        // Simulate the customization process
        await page.getByRole('button', { name: 'Close help' }).click(); // close tutorial
        
        const finalizeButton = page.getByRole('button', { name: 'Finalize your Bracelet' })
        await expect(finalizeButton).toBeVisible();
        await finalizeButton.click()

        const addToCart = page.getByRole('button', { name: '🛒 Add to Cart' })
        await expect(addToCart).toBeVisible();
        await addToCart.click();

        // Bracelet should appear in the cart
        const bracelet = page.getByRole('heading', { name: 'Bracelet #1 - 17cm' });
        await expect(bracelet).toBeVisible();

        // Edit the bracelet
        const editBracelet = page.getByRole('button', { name: 'Edit Bracelet' });
        await expect(editBracelet).toBeVisible();
        await editBracelet.click();

        // Add a new charm to the bracelet
        await page.getByTitle('B05 - ₱').click();
        await page.getByTitle('Click to place charm here or').first().click();
        await page.getByRole('button', { name: 'Update Bracelet' }).click();
        await page.getByRole('button', { name: '💾 Save Changes' }).click();

        // The newly added charm should appear in the bracelet
        await expect(page.locator('.charm-preview').first()).toBeVisible();

        // Click the price breakdown and assert that it is visible
        const priceBreakdown =  page.getByRole('button', { name: 'Price Breakdown ▼' });
        await priceBreakdown.click();

        // The charm and bracelet price should both be displayed in the price breakdown
        const charmPrice = page.getByText('B05 × 1₱');
        await expect(charmPrice).toBeVisible();        
        const braceletPrice =  page.getByText('Silver × 16₱');
        await expect(braceletPrice).toBeVisible;
    })

    test('Prevent Updating Cart with Invalid Quantities', async ({ page }) => {
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

        // Assert that the minus option is not clickable (does not allow zero/negative values)
        const minusButton =  page.getByRole('button', { name: '-' });
        await expect(minusButton).toBeVisible();
        await expect(minusButton).toBeDisabled();
    })
})
