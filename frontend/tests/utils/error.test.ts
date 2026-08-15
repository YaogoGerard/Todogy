import { describe, it, expect } from 'vitest'
import { getErrorMessage } from '../../src/utils/error'
import { oauthErrorText } from '../../src/utils/oauth'

describe('getErrorMessage', () => {
  it('extracts the server error message from an Axios error', () => {
    const err = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { data: { error: 'Invalid email or password' } },
    })

    expect(getErrorMessage(err, 'fallback')).toBe('Invalid email or password')
  })

  it('uses the fallback when the payload has no message', () => {
    const err = Object.assign(new Error('Request failed'), { isAxiosError: true, response: { data: {} } })

    expect(getErrorMessage(err, 'fallback')).toBe('fallback')
  })

  it('uses the fallback for a non-axios error', () => {
    expect(getErrorMessage(new Error('boom'), 'fallback')).toBe('fallback')
  })
})

describe('oauthErrorText', () => {
  it('maps known error codes to friendly messages', () => {
    expect(oauthErrorText('invalid_state')).toContain('Invalid OAuth session')
    expect(oauthErrorText('missing_code')).toContain('OAuth code missing')
    expect(oauthErrorText('no_account')).toContain('No account found')
  })

  it('falls back for unknown codes', () => {
    expect(oauthErrorText('something-weird')).toContain('OAuth sign-in failed')
  })
})