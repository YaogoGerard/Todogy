import { test, expect } from '@playwright/test'
import { stubGuestApi, json, user } from './api'

const authBody = { accessToken: 'at', user }

test.describe('authentication flows', () => {
  test.beforeEach(async ({ page }) => {
    await stubGuestApi(page)
  })

  test('sign up with mismatched passwords shows an inline error without calling the API', async ({ page }) => {
    await page.goto('/signup')
    await page.getByLabel('Name', { exact: true }).fill('Tester')
    await page.getByLabel('Email', { exact: true }).fill('user@example.com')
    await page.getByLabel('Password', { exact: true }).fill('password123')
    await page.getByLabel('Confirm password', { exact: true }).fill('different')

    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page.getByText('Passwords do not match.')).toBeVisible()
    await expect(page).toHaveURL(/\/signup$/)
  })

  test('sign up with valid details lands on / and shows Logout', async ({ page }) => {
    await page.route('**/auth/register', route => route.fulfill(json(authBody)))
    await page.route('**/todos', route => {
      if (route.request().method() === 'GET') return route.fulfill(json([]))
      return route.continue()
    })

    await page.goto('/signup')
    await page.getByLabel('Name', { exact: true }).fill('Tester')
    await page.getByLabel('Email', { exact: true }).fill('user@example.com')
    await page.getByLabel('Password', { exact: true }).fill('password123')
    await page.getByLabel('Confirm password', { exact: true }).fill('password123')

    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible()
  })

  test('an expired session is redirected back to /signin', async ({ page }) => {
    let refreshCalls = 0
    await page.route('**/auth/refresh', route => {
      refreshCalls += 1
      if (refreshCalls === 1) return route.fulfill(json(authBody))
      return route.fulfill(json({ error: 'unauthorized' }, 401))
    })
    await page.route('**/todos', route => {
      if (route.request().method() === 'GET') return route.fulfill(json({ error: 'unauthorized' }, 401))
      return route.continue()
    })

    await page.goto('/')

    await expect(page).toHaveURL(/\/signin$/)
    await expect(page.getByText('Welcome back')).toBeVisible()
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Logout' })).toHaveCount(0)
  })

  test('an authenticated user can toggle a server todo', async ({ page }) => {
    const todo = { _id: 't1', title: 'Server task', completed: false, userId: 'u1', createdAt: '2026-01-01T00:00:00.000Z' }
    await page.route('**/auth/refresh', route => route.fulfill(json(authBody)))
    await page.route('**/todos', route => {
      if (route.request().method() === 'GET') return route.fulfill(json([todo]))
      return route.continue()
    })
    await page.route('**/todos/*', route => {
      if (route.request().method() === 'PUT') return route.fulfill(json({ ...todo, completed: true }))
      return route.continue()
    })

    await page.goto('/')
    const item = page.locator('.item').first()
    await expect(page.getByText('Server task')).toBeVisible()
    await expect(item).not.toHaveClass(/done/)

    await item.locator('.check').click()

    await expect(item).toHaveClass(/done/)
    await expect(page.locator('.nav-dial')).toContainText('100%')
  })
})