export function oauthErrorText(code: string): string {
  switch (code) {
    case 'invalid_state':
      return 'Invalid OAuth session. Please try again.'
    case 'missing_code':
      return 'OAuth code missing. Please try again.'
    case 'no_account':
      return 'No account found for this provider. Please sign up first.'
    default:
      return 'OAuth sign-in failed. Please try again.'
  }
}