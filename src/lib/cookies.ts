const AUTH_COOKIE_NAMES = [
  '_access_token',
  '_token_type',
  '_refresh_token',
  '_expires_in',
  '_user_email',
] as const

export const clearAuthCookies = () => {
  for (const name of AUTH_COOKIE_NAMES) {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  }
}
