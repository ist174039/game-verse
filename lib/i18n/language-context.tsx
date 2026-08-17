'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Locale } from '@/lib/i18n/config'
import { loadLocale, saveLocale } from '@/lib/i18n/config'
import { t as translate } from '@/lib/i18n/translate'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (path: string, params?: Record<string, string | number>) => string
}

const defaultT = (path: string) => path

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
  t: defaultT,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [mounted, setMounted] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    setLocaleState(loadLocale())
    setMounted(true)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    saveLocale(newLocale)
    try {
      document.documentElement.lang = newLocale
    } catch {
      // SSR guard
    }
  }, [])

  // Set the lang attribute on initial hydration
  useEffect(() => {
    try {
      document.documentElement.lang = locale
    } catch {
      // SSR guard
    }
  }, [locale])

  const tFn = useCallback(
    (path: string, params?: Record<string, string | number>) =>
      translate(locale, path, params),
    [locale],
  )

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: tFn }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextType {
  return useContext(LanguageContext)
}
