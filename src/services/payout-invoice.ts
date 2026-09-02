/**
 * payout-invoice.ts
 *
 * Renders the settlement statement an owner gets for a booking: what the player
 * paid, what we deducted, what we reimbursed, and what was credited to their
 * account. Mirrors the export approach in `score-sheet-pdf.ts` (print on web,
 * share a PDF on native) so the two behave the same way.
 *
 * This is a payout statement, not a tax invoice for the player's booking — the
 * GST line is the tax on OUR service fee to the owner, which is why the owner's
 * own GSTIN appears on it.
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { PLATFORM_FEE_GST_RATE, PLATFORM_FEE_PER_SLOT, type Settlement } from '@/lib/settlement';

export interface InvoiceData {
  invoiceNumber: string;
  issuedOn: string;
  bookingRef: string;
  venueName: string;
  slotDate: string;
  slots: string[];
  settlement: Settlement;
  discountCode?: string;
  /** 'platform' discounts appear as a reimbursement line. */
  discountFunder?: 'platform' | 'owner';
  payee: {
    legalName: string;
    address: string;
    gstin?: string;
  };
  creditedOn?: string;
  status: string;
}

const rupees = (n: number) => `₹${n.toFixed(2)}`;

export function generateInvoiceHTML(d: InvoiceData): string {
  const s = d.settlement;
  const reimbursementRow =
    s.ownerReimbursement > 0
      ? `<tr>
           <td>Voucher reimbursed by platform${d.discountCode ? ` (${d.discountCode})` : ''}</td>
           <td class="num pos">+ ${rupees(s.ownerReimbursement)}</td>
         </tr>`
      : '';

  const ownerFundedNote =
    d.discountFunder === 'owner' && s.discountApplied > 0
      ? `<p class="note">Discount ${d.discountCode || ''} was funded by your own offer, so it is not reimbursed.</p>`
      : '';

  return `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1d1b1a; padding: 28px; }
  h1 { font-size: 18px; margin: 0 0 2px; }
  .muted { color: #6b7280; font-size: 11px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
  .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  td { padding: 6px 0; }
  .num { text-align: right; white-space: nowrap; }
  .pos { color: #10b981; }
  .rule td { border-top: 1px solid #e5e7eb; }
  .total td { font-weight: 700; font-size: 14px; padding-top: 10px; }
  .status { display: inline-block; padding: 3px 9px; border-radius: 999px; background: #eef2ff; color: #4f46e5; font-size: 11px; font-weight: 600; }
  .note { font-size: 11px; color: #6b7280; margin-top: 10px; }
</style></head>
<body>
  <div class="head">
    <div>
      <h1>Payout Statement</h1>
      <div class="muted">${d.invoiceNumber} · Issued ${d.issuedOn}</div>
    </div>
    <div class="status">${d.status}</div>
  </div>

  <div class="box">
    <div style="font-weight:600;font-size:13px">${d.payee.legalName}</div>
    <div class="muted">${d.payee.address}</div>
    ${d.payee.gstin ? `<div class="muted">GSTIN: ${d.payee.gstin}</div>` : `<div class="muted">GSTIN: not registered</div>`}
  </div>

  <div class="box">
    <div class="muted">Booking ${d.bookingRef} · ${d.venueName}</div>
    <div class="muted">${d.slotDate} · ${d.slots.join(', ')} (${d.slots.length} slot${d.slots.length === 1 ? '' : 's'})</div>
  </div>

  <table>
    <tr><td>Slot value</td><td class="num">${rupees(s.gross)}</td></tr>
    ${s.discountApplied > 0 ? `<tr><td>Discount applied${d.discountCode ? ` (${d.discountCode})` : ''}</td><td class="num">− ${rupees(s.discountApplied)}</td></tr>` : ''}
    <tr class="rule"><td>Player paid</td><td class="num">${rupees(s.playerPays)}</td></tr>
    <tr><td>Platform fee (₹${PLATFORM_FEE_PER_SLOT} × ${d.slots.length} slot${d.slots.length === 1 ? '' : 's'})</td><td class="num">− ${rupees(s.platformFee)}</td></tr>
    <tr><td>GST on platform fee (${Math.round(PLATFORM_FEE_GST_RATE * 100)}%)</td><td class="num">− ${rupees(s.platformFeeGst)}</td></tr>
    ${reimbursementRow}
    <tr class="rule total"><td>Credited to your account</td><td class="num">${rupees(s.ownerPayout)}</td></tr>
  </table>

  ${d.creditedOn ? `<p class="note">Credited on ${d.creditedOn}.</p>` : ''}
  ${ownerFundedNote}
  <p class="note">Payments are held for 24 hours after booking and then credited automatically.</p>
</body></html>`;
}

/** Deterministic, human-quotable invoice number derived from the booking. */
export function invoiceNumberFor(bookingRef: string, bookedAtIso: string): string {
  const d = new Date(bookedAtIso);
  const y = Number.isFinite(d.getTime()) ? d.getFullYear() : new Date().getFullYear();
  const m = Number.isFinite(d.getTime()) ? String(d.getMonth() + 1).padStart(2, '0') : '01';
  return `INV-${y}${m}-${bookingRef.replace(/^BK-/, '')}`;
}

export async function exportInvoicePDF(data: InvoiceData): Promise<string> {
  const html = generateInvoiceHTML(data);

  if (Platform.OS === 'web') {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 300);
    }
    return 'web-printed';
  }

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  }
  return uri;
}
