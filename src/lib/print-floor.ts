import { FLOOR_CANVAS_HEIGHT, FLOOR_CANVAS_WIDTH } from './floor'
import { useLocaleStore } from '@/stores/useLocaleStore'
import type { FloorTable, QueueStatus, TableOccupancy } from '@/types/database'

type PrintFloorOptions = {
  title?: string
  occupancyByLabel?: Record<string, TableOccupancy>
}

const OCCUPANCY_FILL: Record<QueueStatus, string> = {
  waiting: '#fde68a',
  preparing: '#bfdbfe',
  ready: '#bbf7d0',
  serving: '#ddd6fe',
  completed: '#f3f4f6',
  cancelled: '#f3f4f6',
}

const OCCUPANCY_STROKE: Record<QueueStatus, string> = {
  waiting: '#d97706',
  preparing: '#2563eb',
  ready: '#16a34a',
  serving: '#7c3aed',
  completed: '#9ca3af',
  cancelled: '#9ca3af',
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildTableSvg(table: FloorTable, occupancy?: TableOccupancy) {
  const cx = table.pos_x + table.width / 2
  const cy = table.pos_y + table.height / 2

  if (table.kind === 'zone') {
    const zoneColor = /^#[0-9a-fA-F]{6}$/.test(table.color ?? '') ? table.color! : '#94a3b8'
    const zoneShape = table.shape === 'round'
      ? `<ellipse cx="${cx}" cy="${cy}" rx="${table.width / 2}" ry="${table.height / 2}" fill="${zoneColor}" fill-opacity="0.2" stroke="${zoneColor}" stroke-width="2" />`
      : `<rect x="${table.pos_x}" y="${table.pos_y}" width="${table.width}" height="${table.height}" rx="8" fill="${zoneColor}" fill-opacity="0.2" stroke="${zoneColor}" stroke-width="2" />`

    return `
      ${zoneShape}
      <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="15" font-weight="bold" fill="#0f172a">${escapeHtml(table.label)}</text>
    `
  }

  const fill = occupancy ? OCCUPANCY_FILL[occupancy.status] : '#eef2ff'
  const stroke = occupancy ? OCCUPANCY_STROKE[occupancy.status] : '#6366f1'

  const shape = table.shape === 'round'
    ? `<ellipse cx="${cx}" cy="${cy}" rx="${table.width / 2}" ry="${table.height / 2}" fill="${fill}" stroke="${stroke}" stroke-width="2" />`
    : `<rect x="${table.pos_x}" y="${table.pos_y}" width="${table.width}" height="${table.height}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="2" />`

  const seats = table.seats
    ? `<text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="11" fill="#475569">${escapeHtml(String(table.seats))} seat</text>`
    : ''

  const queue = occupancy
    ? `<text x="${cx}" y="${cy + 30}" text-anchor="middle" font-size="11" font-weight="bold" fill="${stroke}">#${occupancy.queueNumber}</text>`
    : ''

  return `
    ${shape}
    <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="16" font-weight="bold" fill="#0f172a">${escapeHtml(table.label)}</text>
    ${seats}
    ${queue}
  `
}

function buildFloorHtml(tables: FloorTable[], options?: PrintFloorOptions) {
  const localeStore = useLocaleStore()
  const t = localeStore.translate.bind(localeStore)
  const locale = localeStore.locale

  const title = options?.title ?? t('floor.printTitle')
  const generatedAt = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date())

  const tablesSvg = [...tables]
    .sort((a, b) => Number(a.kind === 'zone' ? 0 : 1) - Number(b.kind === 'zone' ? 0 : 1))
    .map((table) =>
      buildTableSvg(
        table,
        table.kind === 'zone' ? undefined : options?.occupancyByLabel?.[table.label.trim()],
      ),
    )
    .join('')

  const legend = options?.occupancyByLabel
    ? `
      <div class="legend">
        <span><i style="background:${OCCUPANCY_FILL.waiting};border-color:${OCCUPANCY_STROKE.waiting}"></i>${escapeHtml(t('status.waiting'))}</span>
        <span><i style="background:${OCCUPANCY_FILL.preparing};border-color:${OCCUPANCY_STROKE.preparing}"></i>${escapeHtml(t('status.preparing'))}</span>
        <span><i style="background:${OCCUPANCY_FILL.ready};border-color:${OCCUPANCY_STROKE.ready}"></i>${escapeHtml(t('status.ready'))}</span>
        <span><i style="background:${OCCUPANCY_FILL.serving};border-color:${OCCUPANCY_STROKE.serving}"></i>${escapeHtml(t('status.serving'))}</span>
        <span><i style="background:#eef2ff;border-color:#6366f1"></i>${escapeHtml(t('floor.legendFree'))}</span>
      </div>
    `
    : ''

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; background: #fff; padding: 8px; }
    .header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
    .title { font-size: 18px; font-weight: bold; }
    .generated { font-size: 11px; color: #64748b; }
    .legend { display: flex; gap: 16px; margin: 8px 0; font-size: 12px; }
    .legend span { display: inline-flex; align-items: center; gap: 6px; }
    .legend i { width: 14px; height: 14px; border: 2px solid; border-radius: 3px; display: inline-block; }
    .canvas { width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; }
    svg { width: 100%; height: auto; display: block; }
  </style>
</head>
<body>
  <div class="header">
    <span class="title">${escapeHtml(title)}</span>
    <span class="generated">${escapeHtml(t('floor.generatedAt'))} ${escapeHtml(generatedAt)}</span>
  </div>
  ${legend}
  <div class="canvas">
    <svg viewBox="0 0 ${FLOOR_CANVAS_WIDTH} ${FLOOR_CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      ${tablesSvg}
    </svg>
  </div>
</body>
</html>`
}

export function printFloorPlan(tables: FloorTable[], options?: PrintFloorOptions) {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = 'none'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    return
  }

  doc.open()
  doc.write(buildFloorHtml(tables, options))
  doc.close()

  const win = iframe.contentWindow
  if (!win) {
    document.body.removeChild(iframe)
    return
  }

  setTimeout(() => {
    win.focus()
    win.print()
    setTimeout(() => {
      if (iframe.parentNode) {
        document.body.removeChild(iframe)
      }
    }, 1000)
  }, 250)
}
