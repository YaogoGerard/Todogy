import { test, expect } from '@playwright/test'
import { stubGuestApi, stubTodosApi } from './api'

test.beforeEach(async ({ page }) => {
  await stubGuestApi(page)
})

test.describe('guest (unauthenticated) experience', () => {
  test('loads the app in guest mode: add input visible, Login button, no Logout', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByPlaceholder('Add a task…')).toBeVisible()
    await expect(page.getByText(/Nothing here/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Logout' })).toHaveCount(0)
  })

  test('adds, toggles, filters and removes todos locally', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder('Add a task…')

    await input.fill('Buy milk')
    await input.press('Enter')
    await expect(page.getByText('Buy milk')).toBeVisible()

    await input.fill('Walk dog')
    await input.press('Enter')
    await expect(page.getByText('Walk dog')).toBeVisible()

    await page.locator('.item').first().locator('.check').click()
    await expect(page.locator('.item').first()).toHaveClass(/done/)

    await page.getByRole('button', { name: 'Done', exact: true }).click()
    await expect(page.getByText('Buy milk')).toBeVisible()
    await expect(page.getByText('Walk dog')).toBeHidden()

    await page.getByRole('button', { name: 'Active', exact: true }).click()
    await expect(page.getByText('Walk dog')).toBeVisible()
    await expect(page.getByText('Buy milk')).toBeHidden()

    await page.getByRole('button', { name: 'All', exact: true }).click()
    await expect(page.locator('.item')).toHaveCount(2)

    await page.locator('.item').first().getByRole('button', { name: 'Delete' }).click()
    await expect(page.locator('.item')).toHaveCount(1)
    await expect(page.getByText('Buy milk')).toBeHidden()
  })

  test('does not persist guest todos across reloads (in-memory only)', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder('Add a task…')

    await input.fill('Temporary task')
    await input.press('Enter')
    await expect(page.getByText('Temporary task')).toBeVisible()

    await page.reload()

    await expect(page.getByText('Temporary task')).toHaveCount(0)
    await expect(page.getByText(/Nothing here/)).toBeVisible()
  })

  test('can browse sign in / sign up pages and return to the todos page', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: 'Login' }).click()
    await expect(page).toHaveURL(/\/signin$/)
    await expect(page.getByText('Welcome back')).toBeVisible()
    await expect(page.locator('.oauth-btn')).toHaveCount(2)

    await page.getByRole('link', { name: 'Sign up' }).click()
    await expect(page).toHaveURL(/\/signup$/)
    await expect(page.getByText('Get started')).toBeVisible()
    await expect(page.locator('.oauth-btn')).toHaveCount(2)

    await page.goto('/')
    await expect(page.getByPlaceholder('Add a task…')).toBeVisible()
  })

  test('OAuth links carry ?mode=signin only on the sign in page', async ({ page }) => {
    await page.goto('/signin')
    for (const btn of await page.locator('.oauth-btn').all()) {
      await expect(btn).toHaveAttribute('href', /mode=signin$/)
    }
  })
})

test.describe('authenticated transitions', () => {
  test('signing in with valid credentials lands on / and shows Logout', async ({ page }) => {
    await page.route('**/auth/login', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ accessToken: 'at', user: { id: 'u1', email: 'user@example.com', name: 'Tester' } }) }),
    )
    stubTodosApi(page)

    await page.goto('/signin')
    await page.getByLabel('Email').fill('user@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Login' })).toHaveCount(0)
  })

  test('an authenticated session is redirected from /signin to the todos page', async ({ page }) => {
    await page.route('**/auth/refresh', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ accessToken: 'at', user: { id: 'u1', email: 'user@example.com', name: 'Tester' } }) }),
    )
    stubTodosApi(page)

    await page.goto('/signin')

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible()
  })

  test('logging out clears the session and the visible todos immediately', async ({ page }) => {
    await page.route('**/auth/login', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ accessToken: 'at', user: { id: 'u1', email: 'user@example.com', name: 'Tester' } }) }),
    )
    await page.route('**/auth/logout', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) }))
    await page.route('**/todos', route => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ _id: 't1', title: 'Server task', completed: false, userId: 'u1', createdAt: '2026-01-01T00:00:00.000Z' }]),
        })
      }
      return route.continue()
    })

    await page.goto('/signin')
    await page.getByLabel('Email').fill('user@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible()
    await expect(page.getByText('Server task')).toBeVisible()

    await page.getByRole('button', { name: 'Logout' }).click()

    await expect(page).toHaveURL(/\/signin$/)
    await page.goto('/')
    await expect(page.getByText('Server task')).toHaveCount(0)
    await expect(page.getByText(/Nothing here/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible()
  })
})