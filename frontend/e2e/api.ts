import type { Page } from '@playwright/test'

export const user = { id: 'u1', email: 'user@example.com', name: 'Tester' }

export function json(body: unknown, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) }
}

export async function stubGuestApi(page: Page) {
  await page.route('**/auth/refresh', route => route.fulfill(json({ error: 'unauthorized' }, 401)))
}

export async function stubAuthenticatedApi(page: Page) {
  await page.route('**/auth/refresh', route =>
    route.fulfill(json({ accessToken: 'at', user })),
  )
  stubTodosApi(page)
}

export async function stubTodosApi(page: Page) {
  await page.route('**/todos', route => {
    if (route.request().method() === 'GET') return route.fulfill(json([]))
    return route.continue()
  })
}