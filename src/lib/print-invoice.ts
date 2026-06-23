import {
  formatInvoiceDateTime,
  getPaymentMethodLabel,
  type InvoiceData,
} from '@/lib/invoice'
import { formatPrice, formatQueueNumber } from '@/lib/format'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatPricePlain(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price).replace(/\s/g, ' ')
}

function buildInvoiceHtml(data: InvoiceData) {
  const itemRows = data.items.map((item) => `
    <tr>
      <td class="item-name">${escapeHtml(item.label)}</td>
      <td class="item-price">${formatPricePlain(item.subtotal)}</td>
    </tr>
  `).join('')

  const addressBlock = data.shopAddress
    ? `<p class="shop-address">${escapeHtml(data.shopAddress)}</p>`
    : ''

  const notesBlock = data.notes
    ? `<p class="notes">Catatan: ${escapeHtml(data.notes)}</p>`
    : ''

  const queueBlock = data.queueNumber != null
    ? `<p>Antrian: ${escapeHtml(formatQueueNumber(data.queueNumber))}</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(data.invoiceNumber)}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 72mm;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      line-height: 1.4;
      color: #000;
      background: #fff;
    }
    .center { text-align: center; }
    .shop-name { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
    .shop-address { font-size: 10px; margin-bottom: 6px; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .meta p { margin-bottom: 2px; }
    table { width: 100%; border-collapse: collapse; }
    .item-name { padding: 3px 4px 3px 0; vertical-align: top; }
    .item-price { padding: 3px 0; text-align: right; white-space: nowrap; vertical-align: top; }
    .total-row { font-weight: bold; font-size: 12px; }
    .total-row td { padding-top: 6px; }
    .footer { margin-top: 8px; font-size: 10px; }
    .thanks { margin-top: 6px; font-weight: bold; }
    @media print {
      body { width: 72mm; }
    }
  </style>
</head>
<body>
  <div class="center">
    <p class="shop-name">${escapeHtml(data.shopName)}</p>
    ${addressBlock}
  </div>
  <div class="divider"></div>
  <div class="meta">
    <p>No: ${escapeHtml(data.invoiceNumber)}</p>
    <p>Tgl: ${escapeHtml(formatInvoiceDateTime(data.paidAt))}</p>
    <p>Pelanggan: ${escapeHtml(data.customerName)}</p>
  </div>
  <div class="divider"></div>
  <table>
    <tbody>
      ${itemRows}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td>TOTAL</td>
        <td class="item-price">${formatPricePlain(data.totalAmount)}</td>
      </tr>
    </tfoot>
  </table>
  <div class="divider"></div>
  <div class="footer">
    <p>Bayar: ${escapeHtml(getPaymentMethodLabel(data.paymentMethod))}</p>
    ${queueBlock}
    ${notesBlock}
    <p class="center thanks">Terima kasih</p>
  </div>
</body>
</html>`
}

export function printInvoice(data: InvoiceData) {
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
  doc.write(buildInvoiceHtml(data))
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

export function formatInvoiceSummaryAmount(amount: number) {
  return formatPrice(amount)
}
