import 'server-only'

import { cookies, headers } from 'next/headers'
import Negotiator from 'negotiator'
import { match } from '@formatjs/intl-localematcher'
import type { Locale } from '.'
import { i18n } from '.'

export const getLocaleOnServer = async (): Promise<Locale> => {
  try {
    // @ts-expect-error locales are readonly
    const locales: string[] = i18n.locales

    let languages: string[] = []
    // get locale from cookie
    try {
      const cookieStore = await cookies()
      const localeCookie = cookieStore.get('locale')
      if (localeCookie?.value && locales.includes(localeCookie.value)) {
        languages = [localeCookie.value]
      }
    } catch {
      // ignore
    }

    if (!languages.length) {
      try {
        const negotiatorHeaders: Record<string, string> = {}
        const headersList = await headers()
        headersList.forEach((value, key) => (negotiatorHeaders[key] = value))
        const rawLanguages = new Negotiator({ headers: negotiatorHeaders }).languages()
        languages = (rawLanguages || []).filter(l => l && l !== '*' && typeof l === 'string')
      } catch {
        // ignore
      }
    }

    if (!languages.length) {
      return (i18n.defaultLocale || 'es') as Locale
    }

    // match locale safely
    try {
      const matchedLocale = match(languages, locales, i18n.defaultLocale) as Locale
      return matchedLocale || (i18n.defaultLocale as Locale)
    } catch {
      return (i18n.defaultLocale || 'es') as Locale
    }
  } catch {
    return (i18n.defaultLocale || 'es') as Locale
  }
}
