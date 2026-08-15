import { test, expect } from '@playwright/test'
import { stubGuestApi } from './api'

test.beforeEach(async ({ page }) => {
  await stubGuestApi(page)
})

test.describe('guest todo UI edge cases', () => {
  test('ignores empty and whitespace-only submissions', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder('Add a task…')

    await page.getByRole('button', { name: 'Add' }).click()
    await expect(page.getByText(/Nothing here/)).toBeVisible()

    await input.fill('   ')
    await input.press('Enter')
    await expect(page.getByText(/Nothing here/)).toBeVisible()
    await expect(page.locator('.item')).toHaveCount(0)
  })

  test('adds a task via the + button and clears the input', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder('Add a task…')

    await input.fill('From button')
    await page.getByRole('button', { name: 'Add' }).click()

    await expect(page.getByText('From button')).toBeVisible()
    await expect(input).toHaveValue('')
  })

  test('toggles a todo back and forth and updates the progress dial', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder('Add a task…')

    await input.fill('Task A')
    await input.press('Enter')
    await input.fill('Task B')
    await input.press('Enter')

    const first = page.locator('.item').first()
    await first.locator('.check').click()
    await expect(first).toHaveClass(/done/)
    await expect(page.locator('.nav-dial')).toContainText('50%')

    await first.locator('.check').click()
    await expect(first).not.toHaveClass(/done/)
    await expect(page.locator('.nav-dial')).toContainText('0%')
  })

  test('deleting the last todo restores the empty state', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder('Add a task…')

    await input.fill('Only one')
    await input.press('Enter')
    await expect(page.getByText('Only one')).toBeVisible()

    await page.getByRole('button', { name: 'Delete' }).click()

    await expect(page.locator('.item')).toHaveCount(0)
    await expect(page.getByText(/Nothing here/)).toBeVisible()
  })

  test('completing every todo triggers the celebration and 100%', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder('Add a task…')

    await input.fill('Done task')
    await input.press('Enter')

    await page.locator('.item').locator('.check').click()

    await expect(page.locator('.confetti')).toBeVisible()
    await expect(page.locator('.nav-dial')).toContainText('100%')
  })

  test('guest todos survive client-side navigation away and back', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder('Add a task…')

    await input.fill('Kept task')
    await input.press('Enter')
    await expect(page.getByText('Kept task')).toBeVisible()

    await page.getByRole('link', { name: 'Login' }).click()
    await expect(page).toHaveURL(/\/signin$/)

    await page.goBack()
    await expect(page).toHaveURL('/')
    await expect(page.getByPlaceholder('Add a task…')).toBeVisible()
    await expect(page.getByText('Kept task')).toBeVisible()
  })
})