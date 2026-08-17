export type Locale = 'en' | 'pt'

export const locales: Locale[] = ['en', 'pt']

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  pt: 'Português',
}

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  pt: '🇵🇹',
}

/**
 * Detects the user's preferred language from the browser.
 * Falls back to 'en' if neither 'pt' nor 'en' is detected.
 */
export function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale

  const browserLangs = navigator.languages ?? [navigator.language]

  for (const lang of browserLangs) {
    const code = lang.split('-')[0].toLowerCase()
    if (code === 'pt') return 'pt'
    if (code === 'en') return 'en'
  }

  return defaultLocale
}

const STORAGE_KEY = 'gameverse-locale'

/**
 * Saves the locale preference to localStorage.
 */
export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // localStorage might be unavailable
  }
}

/**
 * Loads the saved locale from localStorage.
 * If none is saved, detects from the browser.
 */
export function loadLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (saved && locales.includes(saved)) return saved
  } catch {
    // localStorage might be unavailable
  }
  return detectBrowserLocale()
}
