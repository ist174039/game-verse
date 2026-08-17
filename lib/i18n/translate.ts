import { en, pt, type Translations } from './dictionaries'
import type { Locale } from './config'

const dictionaries: Record<Locale, Translations> = { en, pt }

/**
 * Gets the full translations object for a given locale.
 */
export function getTranslations(locale: Locale): Translations {
  return dictionaries[locale] ?? en
}

/**
 * Simple template interpolation.
 * Replaces {{key}} with the corresponding value from params.
 */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = params[key]
    return value != null ? String(value) : `{{${key}}}`
  })
}

/**
 * Translates a dot-separated key path into the translated string.
 *
 * @example
 *   t('auth.login.title')           // "Welcome back"
 *   t('dashboard.welcome', { name: 'John' })  // "Welcome back, John"
 */
export function t(
  locale: Locale,
  path: string,
  params?: Record<string, string | number>,
): string {
  const dict = getTranslations(locale)
  const keys = path.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = dict

  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      console.warn(`i18n: key "${path}" not found for locale "${locale}"`)
      return path
    }
    result = result[key]
  }

  if (typeof result !== 'string') {
    console.warn(`i18n: key "${path}" is not a string for locale "${locale}"`)
    return path
  }

  return interpolate(result, params)
}
