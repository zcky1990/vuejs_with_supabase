export type BookingSuccessPayload = {
  bookingIds: string[]
  tableNumbers: string
  scheduledAt: string
  partySize: number
  totalAmount: number
  status: string
}

const STORAGE_KEY = 'booking_success_payload'

export function saveBookingSuccessPayload(payload: BookingSuccessPayload) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function readBookingSuccessPayload(): BookingSuccessPayload | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as BookingSuccessPayload
    if (
      !Array.isArray(parsed.bookingIds)
      || typeof parsed.tableNumbers !== 'string'
      || typeof parsed.scheduledAt !== 'string'
      || typeof parsed.partySize !== 'number'
      || typeof parsed.totalAmount !== 'number'
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearBookingSuccessPayload() {
  sessionStorage.removeItem(STORAGE_KEY)
}
