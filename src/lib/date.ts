const SHOP_TIMEZONE = 'Asia/Jakarta'

/** Calendar date (YYYY-MM-DD) in shop timezone — queue/order numbers reset at local midnight. */
export function getShopDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SHOP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function buildScheduledAtIso(bookingDate: string, time: string) {
  const [hours = '00', minutes = '00'] = time.trim().split(':')
  const hh = hours.padStart(2, '0').slice(0, 2)
  const mm = minutes.padStart(2, '0').slice(0, 2)
  return `${bookingDate}T${hh}:${mm}:00+07:00`
}

export function formatShopDateTime(value: string | Date, locale = 'id') {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'id-ID', {
    timeZone: SHOP_TIMEZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function addDaysToShopDate(dateString: string, days: number) {
  const date = new Date(`${dateString}T12:00:00+07:00`)
  date.setUTCDate(date.getUTCDate() + days)
  return getShopDateString(date)
}
