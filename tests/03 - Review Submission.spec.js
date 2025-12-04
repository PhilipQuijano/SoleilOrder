import { test, expect } from '@playwright/test';

test.describe('Review Submission Functionality', () => {
    test.beforeEach(async ({page}) =>{
        // Go to the homepage of the website before each test
        await page.goto('http://localhost:3000') // temporary
    })

    test('Submitting a review with valid data', async ({ page }) => {
        // Locate and click the Contact option in the navigation bar
        const contactButton = page.getByRole('link', { name: 'Contact' });
        await expect(contactButton).toBeVisible();
        await contactButton.click();

        // Fill the name field with "User"
        await page.getByRole('textbox', { name: 'Name' }).fill('User');
        
        // Fill the email field with "user@example.com"
        await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');
        
        // In the rating field, click on the fourth star to indicate a 4-star rating
        const fourthStar = page.getByRole('button', { name: 'Rate 4 stars' });
        await fourthStar.click();

        // Fill the comment field with "Good product!"
        await page.getByRole('textbox', { name: 'Comment' }).fill('Good product!');

        // Verify that the given data is applied to all the fields
        await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('User');
        await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue('user@example.com');
        await expect(page.getByRole('textbox', { name: 'Comment' })).toHaveValue('Good product!');

        // Verify that the chosen rating is reflected by the number of yellow stars and the displayed number
        await expect(fourthStar).toHaveAttribute('aria-pressed', 'true');
        const ratingText = page.locator('.rating-text');
        await expect(ratingText).toContainText('(4 stars)');

        // Press "Submit Feedback"
        const submitButton = page.getByRole('button', { name: 'Submit Feedback' });
        await submitButton.click();

        // Verify that there is a confirmation message upon successful submission
        const successMessage = page.locator('.submit-message.success');
        await expect(successMessage).toContainText('Thank you for your review!');

        // Verify that the fields are reset after a successful submission
        await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('');
        await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue('');
        await expect(page.getByRole('textbox', { name: 'Comment' })).toHaveValue('');

        const fifthStar = page.getByRole('button', { name: 'Rate 5 stars' });
        await expect(fifthStar).toHaveAttribute('aria-pressed', 'true');
        await expect(ratingText).toContainText('(5 stars)');
    })

    test('Testing rating star functionality', async ({ page }) => {
        // Locate and click the Contact option in the navigation bar
        const contactButton = page.getByRole('link', { name: 'Contact' });
        await expect(contactButton).toBeVisible();
        await contactButton.click();
    
        const ratingText = page.locator('.rating-text');

        // In the rating field, click on the first star to indicate a 1-star rating; verify
        const firstStar = page.getByRole('button', { name: 'Rate 1 star' });
        await firstStar.click();
        await expect(firstStar).toHaveAttribute('aria-pressed', 'true');
        await expect(ratingText).toContainText('(1 star)');

        // In the rating field, click on the second star to indicate a 2-star rating; verify
        const secondStar = page.getByRole('button', { name: 'Rate 2 stars' });
        await secondStar.click();
        await expect(secondStar).toHaveAttribute('aria-pressed', 'true');
        await expect(ratingText).toContainText('(2 stars)');

        // In the rating field, click on the third star to indicate a 3-star rating; verify
        const thirdStar = page.getByRole('button', { name: 'Rate 3 stars' });
        await thirdStar.click();
        await expect(thirdStar).toHaveAttribute('aria-pressed', 'true');
        await expect(ratingText).toContainText('(3 stars)');

        // In the rating field, click on the fourth star to indicate a 4-star rating; verify
        const fourthStar = page.getByRole('button', { name: 'Rate 4 stars' });
        await fourthStar.click();
        await expect(fourthStar).toHaveAttribute('aria-pressed', 'true');
        await expect(ratingText).toContainText('(4 stars)');

        // In the rating field, click on the fifth star to indicate a 5-star rating; verify
        const fifthStar = page.getByRole('button', { name: 'Rate 5 stars' });
        await fifthStar.click();
        await expect(fifthStar).toHaveAttribute('aria-pressed', 'true');
        await expect(ratingText).toContainText('(5 stars)');
    })

    test('Attempt to submit a review without filling in the name field', async ({ page }) => {
        // Locate and click the Contact option in the navigation bar
        const contactButton = page.getByRole('link', { name: 'Contact' });
        await expect(contactButton).toBeVisible();
        await contactButton.click();

        // Fill the e-mail field with "user@example.com".
        await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');

        // In the rating field, click on the fourth star to indicate a 4-star rating
        const fourthStar = page.getByRole('button', { name: 'Rate 4 stars' });
        await fourthStar.click();

        // Fill the comment field with "Good product!"
        await page.getByRole('textbox', { name: 'Comment' }).fill('Good product!');

        // Verify that the given data is applied to all the fields
        await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('');
        await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue('user@example.com');
        await expect(page.getByRole('textbox', { name: 'Comment' })).toHaveValue('Good product!');

        // Verify that the rating is set to 4 stars
        const ratingText = page.locator('.rating-text');
        await expect(ratingText).toContainText('(4 stars)');

        // Press "Submit Feedback"
        const submitButton = page.getByRole('button', { name: 'Submit Feedback' });
        await submitButton.click();

        // Verify that the review does not submit
        const successMessage = page.locator('.submit-message.success');
        await expect(successMessage).not.toBeVisible();
    })

    test('Attempt to submit a review without filling in the e-mail field', async ({ page }) => {
        // Locate and click the Contact option in the navigation bar
        const contactButton = page.getByRole('link', { name: 'Contact' });
        await expect(contactButton).toBeVisible();
        await contactButton.click();

        // Fill the name field with "User"
        await page.getByRole('textbox', { name: 'Name' }).fill('User');

        // In the rating field, click on the fourth star to indicate a 4-star rating
        const fourthStar = page.getByRole('button', { name: 'Rate 4 stars' });
        await fourthStar.click();

        // Fill the comment field with "Good product!"
        await page.getByRole('textbox', { name: 'Comment' }).fill('Good product!');

        // Verify that the given data is applied to all the fields
        await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('User');
        await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue('');
        await expect(page.getByRole('textbox', { name: 'Comment' })).toHaveValue('Good product!');

        // Verify that the rating is set to 4 stars
        const ratingText = page.locator('.rating-text');
        await expect(ratingText).toContainText('(4 stars)');

        // Press "Submit Feedback"
        const submitButton = page.getByRole('button', { name: 'Submit Feedback' });
        await submitButton.click();

        // Verify that the review does not submit
        const successMessage = page.locator('.submit-message.success');
        await expect(successMessage).not.toBeVisible();
    })

    test('Attempt to submit a review with an invalid e-mail address', async ({ page }) => {
        // Locate and click the Contact option in the navigation bar
        const contactButton = page.getByRole('link', { name: 'Contact' });
        await expect(contactButton).toBeVisible();
        await contactButton.click();

        // Fill the name field with "User"
        await page.getByRole('textbox', { name: 'Name' }).fill('User');

        // Fill the email field with "user"
        await page.getByRole('textbox', { name: 'Email' }).fill('user');

        // In the rating field, click on the fourth star to indicate a 4-star rating
        const fourthStar = page.getByRole('button', { name: 'Rate 4 stars' });
        await fourthStar.click();

        // Fill the comment field with "Good product!"
        await page.getByRole('textbox', { name: 'Comment' }).fill('Good product!');

        // Verify that the given data is applied to all the fields
        await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('User');
        await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue('user');
        await expect(page.getByRole('textbox', { name: 'Comment' })).toHaveValue('Good product!');

        // Verify that the rating is set to 4 stars
        const ratingText = page.locator('.rating-text');
        await expect(ratingText).toContainText('(4 stars)');

        // Press "Submit Feedback"
        const submitButton = page.getByRole('button', { name: 'Submit Feedback' });
        await submitButton.click();

        // Verify that the review does not submit
        const successMessage = page.locator('.submit-message.success');
        await expect(successMessage).not.toBeVisible();
    })

    test('Attempt to submit a review without filling in the comment field', async ({ page }) => {
        // Locate and click the Contact option in the navigation bar
        const contactButton = page.getByRole('link', { name: 'Contact' });
        await expect(contactButton).toBeVisible();
        await contactButton.click();

        // Fill the name field with "User"
        await page.getByRole('textbox', { name: 'Name' }).fill('User');

        // Fill the email field with "user@example.com"
        await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');

        // In the rating field, click on the fourth star to indicate a 4-star rating
        const fourthStar = page.getByRole('button', { name: 'Rate 4 stars' });
        await fourthStar.click();

        // Verify that the given data is applied to all the fields
        await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('User');
        await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue('user@example.com');
        await expect(page.getByRole('textbox', { name: 'Comment' })).toHaveValue('');

        // Verify that the rating is set to 4 stars
        const ratingText = page.locator('.rating-text');
        await expect(ratingText).toContainText('(4 stars)');

        // Press "Submit Feedback"
        const submitButton = page.getByRole('button', { name: 'Submit Feedback' });
        await submitButton.click();

        // Verify that the review does not submit
        const successMessage = page.locator('.submit-message.success');
        await expect(successMessage).not.toBeVisible();
    })
})