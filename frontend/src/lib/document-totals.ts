/**
 * Live totals for the document forms (invoice, quotation, sales order, purchase order, purchase bill), computed the
 * way the backend saves them (`TaxMath`): quantity and rate at 2 decimals, each line's taxable value and tax rounded
 * half-up to paise, CGST = half the tax rounded half-up and SGST the remainder. Working in integer paise keeps the
 * preview equal to the saved document — float arithmetic drifted by paise and split CGST/SGST on the total instead
 * of per line.
 */

type Numeric = number | string | null | undefined;

export interface DocumentLineInput {
  quantity: Numeric;
  unitPrice: Numeric;
  /** GST rate in percent (18 for 18%); empty for an untaxed line */
  taxRate?: Numeric;
}

export interface LineAmounts {
  taxable: number;
  tax: number;
  total: number;
}

export interface DocumentTotals {
  subtotal: number;
  taxTotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

/** A decimal as an integer number of hundredths, rounded half-up (1.005 → 101, despite 1.005 * 100 = 100.4999…). */
function hundredths(value: Numeric): number {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  if (!Number.isFinite(n)) return 0;
  return Math.round(Number(((n as number) * 100).toFixed(6)));
}

/** Integer division rounding half-up, for non-negative amounts. */
function divideHalfUp(numerator: number, denominator: number): number {
  return Math.floor((numerator + denominator / 2) / denominator);
}

function linePaise(line: DocumentLineInput): { taxable: number; tax: number } {
  const quantity = Math.max(0, hundredths(line.quantity));
  const price = Math.max(0, hundredths(line.unitPrice));
  const rate = Math.max(0, hundredths(line.taxRate));
  const taxable = divideHalfUp(quantity * price, 100);
  const tax = divideHalfUp(taxable * rate, 10000);
  return { taxable, tax };
}

export function lineAmounts(line: DocumentLineInput): LineAmounts {
  const { taxable, tax } = linePaise(line);
  return { taxable: taxable / 100, tax: tax / 100, total: (taxable + tax) / 100 };
}

export function documentTotals(lines: DocumentLineInput[], interState: boolean): DocumentTotals {
  let subtotal = 0;
  let taxTotal = 0;
  let cgst = 0;
  let sgst = 0;
  for (const line of lines) {
    const { taxable, tax } = linePaise(line);
    subtotal += taxable;
    taxTotal += tax;
    if (!interState) {
      const half = divideHalfUp(tax, 2);
      cgst += half;
      sgst += tax - half;
    }
  }
  return {
    subtotal: subtotal / 100,
    taxTotal: taxTotal / 100,
    cgst: cgst / 100,
    sgst: sgst / 100,
    igst: interState ? taxTotal / 100 : 0,
    total: (subtotal + taxTotal) / 100,
  };
}

/** Rounds a rupee amount to paise, e.g. a balance of 0.30 - 0.10 (0.19999999999999998) to 0.2. */
export function roundToPaise(value: number): number {
  return hundredths(value) / 100;
}
