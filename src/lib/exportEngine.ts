import jsPDF from 'jspdf';
import { safeHtml2Canvas, makeElementExportSafe } from './html2canvasSanitizer';
import { ProposalQuotation, ProposalItem, PaymentDetails } from '../types';

/**
 * Format monetary amount with currency symbol and 2 decimal places (e.g. $970.00, $1,250.00)
 */
export const formatCurrency = (amount: number | undefined | null, symbol: string = '$'): string => {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Format export filename with sanitized client name and date
 */
export const formatFilename = (prefix: string, clientName: string, extension: string): string => {
  const sanitizedClient = (clientName || 'Client')
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  return `${prefix}-${sanitizedClient}-${dateStr}.${extension}`;
};

/**
 * Helper to trigger browser file download with fallback support
 */
export const triggerDownload = (url: string, filename: string): void => {
  console.log('[Proposal Generator] Download started for:', filename);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    link.target = '_self';
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      console.log('[Proposal Generator] Download completed for:', filename);
    }, 1000);
  } catch (err) {
    console.error('[Proposal Generator] Exception during download trigger:', err);
    window.open(url, '_blank');
  }
};

/**
 * Convert DataURL to Blob and trigger download
 */
export const downloadDataUrl = (dataUrl: string, filename: string): void => {
  try {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    console.log('[Proposal Generator] Blob created, size:', blob.size);

    const blobUrl = URL.createObjectURL(blob);
    triggerDownload(blobUrl, filename);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } catch (err) {
    console.error('[Proposal Generator] Exception in downloadDataUrl:', err);
    triggerDownload(dataUrl, filename);
  }
};

/**
 * Render Payment Terms HTML block according to selected Payment Structure
 */
const renderPaymentTermsHtml = (proposal: ProposalQuotation, symbol: string): string => {
  const grandTotal = proposal.grandTotal || proposal.oneTimeTotal || 0;
  const structure = proposal.paymentStructure || 'split_50_50';

  if (structure === 'full') {
    return `
      <div style="margin-bottom: 25px; font-size: 13px; color: #111827; border-top: 1px solid #e5e7eb; padding-top: 16px;">
        <div style="font-size: 11px; font-weight: 800; color: #4b5563; text-transform: ; letter-spacing: 1px; margin-bottom: 8px;">PAYMENT TERMS</div>
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px;">
          <div style="font-weight: 700; color: #111827; margin-bottom: 4px; font-size: 14px;">Full Payment</div>
          <div style="color: #374151; font-size: 13px; line-height: 1.5;">
            Full payment of <strong style="color: #111827; font-size: 14px;">${formatCurrency(grandTotal, symbol)}</strong> is required upon approval.
          </div>
        </div>
      </div>
    `;
  }

  if (structure === 'split_50_50') {
    const half = grandTotal * 0.5;
    return `
      <div style="margin-bottom: 25px; font-size: 13px; color: #111827; border-top: 1px solid #e5e7eb; padding-top: 16px;">
        <div style="font-size: 11px; font-weight: 800; color: #4b5563; text-transform: ; letter-spacing: 1px; margin-bottom: 8px;">PAYMENT TERMS</div>
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px;">
          <div style="font-weight: 700; color: #111827; margin-bottom: 10px; font-size: 14px;">50% Advance + 50% Upon Completion</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px;">
              <div style="font-size: 11px; font-weight: 700; color: #4b5563; text-transform: ; letter-spacing: 0.5px;">50% Advance Upon Approval</div>
              <div style="font-size: 16px; font-weight: 800; color: #111827; margin-top: 4px;">${formatCurrency(half, symbol)}</div>
            </div>
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px;">
              <div style="font-size: 11px; font-weight: 700; color: #4b5563; text-transform: ; letter-spacing: 0.5px;">50% Upon Project Completion</div>
              <div style="font-size: 16px; font-weight: 800; color: #111827; margin-top: 4px;">${formatCurrency(half, symbol)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Custom schedule
  const schedule = proposal.paymentSchedule && proposal.paymentSchedule.length > 0
    ? proposal.paymentSchedule
    : [
        { id: '1', name: 'Project Start', percentage: 50, amount: grandTotal * 0.5 },
        { id: '2', name: 'Project Completion', percentage: 50, amount: grandTotal * 0.5 }
      ];

  return `
    <div style="margin-bottom: 25px; font-size: 13px; color: #111827; border-top: 1px solid #e5e7eb; padding-top: 16px;">
      <div style="font-size: 11px; font-weight: 800; color: #4b5563; text-transform: ; letter-spacing: 1px; margin-bottom: 8px;">PAYMENT TERMS</div>
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px;">
        <div style="font-weight: 700; color: #111827; margin-bottom: 10px; font-size: 14px;">Custom Payment Schedule</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${schedule.map((stage, idx) => {
            const stageAmt = stage.amount || ((grandTotal * (stage.percentage || 0)) / 100);
            return `
              <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px;">
                <div>
                  <span style="font-weight: 700; color: #111827; font-size: 13px;">${stage.name || `Stage ${idx + 1}`}</span>
                  <span style="font-size: 12px; font-weight: 700; color: #4b5563; margin-left: 8px;">(${stage.percentage}%)</span>
                </div>
                <div style="font-size: 15px; font-weight: 800; color: #111827;">${formatCurrency(stageAmt, symbol)}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
};

/**
 * Build clean, export-safe HTML for Proposal PDF
 */
export const buildProposalExportHtml = (proposal: ProposalQuotation, paymentDetails?: PaymentDetails | null): string => {
  const symbol = proposal.currencySymbol || '$';
  
  const itemsHtml = (proposal.items || []).map((item) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; vertical-align: top; color: #111827; font-weight: 600;">${item.categoryName || 'Service'}</td>
      <td style="padding: 12px; vertical-align: top; color: #374151;">
        <div style="font-weight: 600; color: #111827;">${item.optionName}</div>
        ${(item.selectedAddons || []).map(a => `<div style="font-size: 11px; color: #4b5563; margin-top: 2px;">• ${a.name} (${formatCurrency(a.price, symbol)})</div>`).join('')}
      </td>
      <td style="padding: 12px; vertical-align: top; text-align: center; color: #111827; font-weight: 600;">${item.quantity || 1}</td>
      <td style="padding: 12px; vertical-align: top; text-align: right; font-weight: 700; color: #111827;">${formatCurrency(item.itemTotal || 0, symbol)}</td>
    </tr>
  `).join('');

  const showPayment = paymentDetails && (
    paymentDetails.accountTitle || 
    paymentDetails.bankName || 
    paymentDetails.accountNumber || 
    paymentDetails.iban ||
    paymentDetails.swiftBic
  );

  const grandTotal = proposal.grandTotal || proposal.oneTimeTotal || 0;

  return `
    <div style="width: 800px; padding: 50px; background-color: #ffffff; color: #111827; font-family: Helvetica, Arial, sans-serif; box-sizing: border-box; line-height: 1.5;">
      
      <!-- HEADER -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 35px; border-bottom: 3px solid #111827; padding-bottom: 20px;">
        <div>
          <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #111827; letter-spacing: -1px;">Zyqitek</h1>
          <div style="margin-top: 6px; font-size: 12px; font-weight: 800; text-transform: ; letter-spacing: 1px; color: #374151;">PROPOSAL</div>
        </div>
        <div style="text-align: right; font-size: 12px; color: #374151;">
          <div style="font-weight: bold; color: #111827; margin-bottom: 4px;">Proposal Number: ${proposal.proposalNumber}</div>
          <div>Date: ${new Date(proposal.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div>Valid Until: ${proposal.validUntilDate || '30 Days'}</div>
        </div>
      </div>

      <!-- CLIENT INFORMATION -->
      <div style="margin-bottom: 25px;">
        <h2 style="font-size: 11px; font-weight: 800; color: #4b5563; text-transform: ; letter-spacing: 1px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">Client Information</h2>
        <div style="font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 2px;">${proposal.clientName}</div>
        ${proposal.clientCompany ? `<div style="font-size: 14px; color: #374151;">${proposal.clientCompany}</div>` : ''}
        ${proposal.clientEmail ? `<div style="font-size: 13px; color: #4b5563;">${proposal.clientEmail}</div>` : ''}
      </div>

      <!-- PROJECT INFORMATION -->
      <div style="margin-bottom: 25px;">
        <h2 style="font-size: 11px; font-weight: 800; color: #4b5563; text-transform: ; letter-spacing: 1px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">Project Information</h2>
        <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 4px;">Project Name: ${proposal.title}</div>
        ${proposal.notes ? `<div style="font-size: 13px; color: #374151; margin-top: 4px; white-space: pre-wrap;"><strong>Description / Requirements:</strong><br/>${proposal.notes}</div>` : ''}
      </div>

      <!-- PRICING TABLE -->
      <div style="margin-bottom: 25px;">
        <h2 style="font-size: 11px; font-weight: 800; color: #4b5563; text-transform: ; letter-spacing: 1px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">Pricing & Deliverables</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 3px solid #111827; text-align: left; color: #111827;">
              <th style="padding: 10px 8px; font-weight: 800;">Service</th>
              <th style="padding: 10px 8px; font-weight: 800;">Description</th>
              <th style="padding: 10px 8px; font-weight: 800; text-align: center;">Qty</th>
              <th style="padding: 10px 8px; font-weight: 800; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <!-- TOTALS -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 25px;">
        <div style="width: 280px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between; padding: 6px 0; color: #374151;">
            <span>Subtotal:</span>
            <span style="font-weight: 700; color: #111827;">${formatCurrency(proposal.subtotal || 0, symbol)}</span>
          </div>
          ${(proposal.discountAmount || 0) > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; color: #e11d48;">
              <span>Discount:</span>
              <span style="font-weight: 700;">-${formatCurrency(proposal.discountAmount || 0, symbol)}</span>
            </div>
          ` : ''}
          ${(proposal.taxAmount || 0) > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; color: #374151;">
              <span>Tax (${proposal.taxPercentage}%):</span>
              <span style="font-weight: 700; color: #111827;">+${formatCurrency(proposal.taxAmount || 0, symbol)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 10px 0; margin-top: 6px; border-top: 2px solid #111827; font-size: 18px; font-weight: 900; color: #111827;">
            <span>TOTAL:</span>
            <span>${formatCurrency(grandTotal, symbol)}</span>
          </div>
        </div>
      </div>

      <!-- PAYMENT TERMS SECTION -->
      ${renderPaymentTermsHtml(proposal, symbol)}

      <!-- TERMS & CONDITIONS -->
      <div style="margin-bottom: 25px; font-size: 12px; color: #374151;">
        <div style="font-size: 11px; font-weight: 800; color: #4b5563; text-transform: ; letter-spacing: 1px; margin-bottom: 6px;">TERMS & CONDITIONS</div>
        <div style="white-space: pre-line; color: #4b5563; line-height: 1.6; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px;">${proposal.termsAndConditions || '1. Valid for 30 days from issuance date.\n2. Scope changes or additional deliverables are subject to mutually agreed revision.\n3. Final deliverables and assets released upon milestone completion.'}</div>
      </div>

      <!-- BANK DETAILS (IF PRESENT) -->
      ${showPayment ? `
        <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background-color: #f9fafb;">
          <h3 style="font-size: 11px; font-weight: 800; text-transform: ; margin: 0 0 10px 0; color: #111827; letter-spacing: 1px;">Bank Details</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; color: #111827;">
            ${paymentDetails?.bankName ? `<div><strong>Bank Name:</strong> ${paymentDetails.bankName}</div>` : ''}
            ${paymentDetails?.accountTitle ? `<div><strong>Account Name:</strong> ${paymentDetails.accountTitle}</div>` : ''}
            ${paymentDetails?.accountNumber ? `<div><strong>Account Number:</strong> ${paymentDetails.accountNumber}</div>` : ''}
            ${paymentDetails?.iban ? `<div><strong>IBAN:</strong> ${paymentDetails.iban}</div>` : ''}
            ${paymentDetails?.swiftBic ? `<div><strong>SWIFT/BIC:</strong> ${paymentDetails.swiftBic}</div>` : ''}
          </div>
        </div>
      ` : ''}

      <!-- CUSTOMER SUPPORT CONTACT -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; font-size: 12px; color: #4b5563;">
        <p style="margin: 0 0 4px 0; font-weight: 800; color: #111827; text-transform: ; letter-spacing: 0.5px;">CUSTOMER SUPPORT</p>
        <p style="margin: 0 0 4px 0; color: #374151; font-weight: 600;">zyqitek@gmail.com</p>
        <p style="margin: 0; font-weight: 700; color: #111827;">Website: https://zyqitek.site.je</p>
      </div>

    </div>
  `;
};

/**
 * Build clean, export-safe HTML for Invoice PDF
 */
export const buildInvoiceExportHtml = (
  proposal: ProposalQuotation,
  paymentDetails?: PaymentDetails | null,
  paymentPurpose?: string
): string => {
  const symbol = proposal.currencySymbol || '$';
  const invNo = proposal.proposalNumber.replace('QUO-', 'INV-');
  const itemsHtml = (proposal.items || []).map((item) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; vertical-align: top; color: #111827; font-weight: 600;">${item.categoryName || 'Service'}</td>
      <td style="padding: 12px; vertical-align: top; color: #374151;">
        <div style="font-weight: 600; color: #111827;">${item.optionName}</div>
        ${(item.selectedAddons || []).map(a => `<div style="font-size: 11px; color: #4b5563; margin-top: 2px;">• ${a.name} (${formatCurrency(a.price, symbol)})</div>`).join('')}
      </td>
      <td style="padding: 12px; vertical-align: top; text-align: center; color: #111827; font-weight: 600;">${item.quantity || 1}</td>
      <td style="padding: 12px; vertical-align: top; text-align: right; font-weight: 700; color: #111827;">${formatCurrency(item.itemTotal || 0, symbol)}</td>
    </tr>
  `).join('');

  const showPayment = paymentDetails && (
    paymentDetails.accountTitle || 
    paymentDetails.bankName || 
    paymentDetails.accountNumber || 
    paymentDetails.iban ||
    paymentDetails.swiftBic
  );

  const grandTotal = proposal.grandTotal || proposal.oneTimeTotal || 0;

  return `
    <div style="width: 800px; padding: 50px; background-color: #ffffff; color: #111827; font-family: Helvetica, Arial, sans-serif; box-sizing: border-box; line-height: 1.5;">
      
      <!-- INVOICE HEADER -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 35px; border-bottom: 3px solid #111827; padding-bottom: 20px;">
        <div>
          <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #111827; letter-spacing: -1px;">Zyqitek</h1>
          <div style="margin-top: 6px; font-size: 12px; font-weight: 800; text-transform: ; letter-spacing: 1px; color: #374151;">INVOICE</div>
        </div>
        <div style="text-align: right; font-size: 12px; color: #374151;">
          <div style="font-weight: bold; color: #111827; margin-bottom: 4px;">Invoice Number: ${invNo}</div>
          <div>Invoice Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div>Due Date: Upon Receipt</div>
        </div>
      </div>

      <!-- BILL TO -->
      <div style="margin-bottom: 25px;">
        <h2 style="font-size: 11px; font-weight: 800; color: #4b5563; text-transform: ; letter-spacing: 1px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">Bill To</h2>
        <div style="font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 2px;">${proposal.clientName}</div>
        ${proposal.clientCompany ? `<div style="font-size: 14px; color: #374151;">${proposal.clientCompany}</div>` : ''}
        ${proposal.clientEmail ? `<div style="font-size: 13px; color: #4b5563;">${proposal.clientEmail}</div>` : ''}
      </div>

      <!-- SERVICE / PROJECT -->
      <div style="margin-bottom: 25px;">
        <h2 style="font-size: 11px; font-weight: 800; color: #4b5563; text-transform: ; letter-spacing: 1px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">Service / Project</h2>
        <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 2px;">${proposal.title}</div>
        <div style="font-size: 13px; color: #374151;">Purpose: ${paymentPurpose || paymentDetails?.paymentPurpose || 'Website Development'}</div>
      </div>

      <!-- ITEMS TABLE -->
      <div style="margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 3px solid #111827; text-align: left; color: #111827;">
              <th style="padding: 10px 8px; font-weight: 800;">Description</th>
              <th style="padding: 10px 8px; font-weight: 800;">Specification</th>
              <th style="padding: 10px 8px; font-weight: 800; text-align: center;">Qty</th>
              <th style="padding: 10px 8px; font-weight: 800; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <!-- FINANCIAL SUMMARY -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 25px;">
        <div style="width: 280px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between; padding: 6px 0; color: #374151;">
            <span>Subtotal:</span>
            <span style="font-weight: 700; color: #111827;">${formatCurrency(proposal.subtotal || 0, symbol)}</span>
          </div>
          ${(proposal.discountAmount || 0) > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; color: #e11d48;">
              <span>Discount:</span>
              <span style="font-weight: 700;">-${formatCurrency(proposal.discountAmount || 0, symbol)}</span>
            </div>
          ` : ''}
          ${(proposal.taxAmount || 0) > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; color: #374151;">
              <span>Tax (${proposal.taxPercentage}%):</span>
              <span style="font-weight: 700; color: #111827;">+${formatCurrency(proposal.taxAmount || 0, symbol)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 10px 0; margin-top: 6px; border-top: 2px solid #111827; font-size: 18px; font-weight: 900; color: #111827;">
            <span>TOTAL:</span>
            <span>${formatCurrency(grandTotal, symbol)}</span>
          </div>
        </div>
      </div>

      <!-- PAYMENT TERMS -->
      ${renderPaymentTermsHtml(proposal, symbol)}

      <!-- BANK DETAILS -->
      ${showPayment ? `
        <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; background-color: #f9fafb;">
          <h3 style="font-size: 11px; font-weight: 800; text-transform: ; margin: 0 0 10px 0; color: #111827; letter-spacing: 1px;">Bank Details</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; color: #111827;">
            ${paymentDetails?.bankName ? `<div><strong>Bank Name:</strong> ${paymentDetails.bankName}</div>` : ''}
            ${paymentDetails?.accountTitle ? `<div><strong>Account Name:</strong> ${paymentDetails.accountTitle}</div>` : ''}
            ${paymentDetails?.accountNumber ? `<div><strong>Account Number:</strong> ${paymentDetails.accountNumber}</div>` : ''}
            ${paymentDetails?.iban ? `<div><strong>IBAN:</strong> ${paymentDetails.iban}</div>` : ''}
            ${paymentDetails?.swiftBic ? `<div><strong>SWIFT/BIC:</strong> ${paymentDetails.swiftBic}</div>` : ''}
          </div>
        </div>
      ` : ''}

      <!-- CUSTOMER SUPPORT CONTACT -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; font-size: 12px; color: #4b5563;">
        <p style="margin: 0 0 4px 0; font-weight: 800; color: #111827; text-transform: ; letter-spacing: 0.5px;">CUSTOMER SUPPORT</p>
        <p style="margin: 0 0 4px 0; color: #374151; font-weight: 600;">zyqitek@gmail.com</p>
        <p style="margin: 0; font-weight: 700; color: #111827;">Website: https://zyqitek.site.je</p>
      </div>

    </div>
  `;
};

/**
 * Build clean, export-safe HTML for Proposal Image (.PNG) - exact match with Proposal PDF
 */
export const buildProposalImageExportHtml = (proposal: ProposalQuotation, paymentDetails?: PaymentDetails | null): string => {
  return buildProposalExportHtml(proposal, paymentDetails);
};

/**
 * Generate PDF Document for Proposal or Invoice
 */
export const generatePdfFromProposal = async (
  proposal: ProposalQuotation,
  type: 'proposal' | 'invoice',
  paymentDetails?: PaymentDetails | null,
  paymentPurpose?: string,
  customElementRef?: HTMLElement | null
): Promise<string> => {
  console.log('[Proposal Generator] PDF generation started...');

  let tempContainer: HTMLElement | null = null;
  let elementToRender: HTMLElement;

  if (customElementRef) {
    tempContainer = makeElementExportSafe(customElementRef);
    document.body.appendChild(tempContainer);
    elementToRender = tempContainer;
    await new Promise(resolve => setTimeout(resolve, 150));
  } else {
    const div = document.createElement('div');
    div.id = 'export-template-temp-container';
    div.style.position = 'absolute';
    div.style.left = '-9999px';
    div.style.top = '0';
    div.style.width = '800px';
    div.style.backgroundColor = '#ffffff';
    div.style.boxSizing = 'border-box';
    div.style.zIndex = '-9999';

    if (type === 'invoice') {
      div.innerHTML = buildInvoiceExportHtml(proposal, paymentDetails, paymentPurpose);
    } else {
      div.innerHTML = buildProposalExportHtml(proposal, paymentDetails);
    }

    document.body.appendChild(div);
    tempContainer = div;
    elementToRender = tempContainer;
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  try {
    const canvas = await safeHtml2Canvas(elementToRender, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 800
    });

    console.log('[Proposal Generator] PDF canvas generated');

    if (tempContainer && document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
      tempContainer = null;
    }

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas rendering produced zero width or height.');
    }

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidthMm = pdfWidth;
    const imgHeightMm = (canvas.height * pdfWidth) / canvas.width;

    if (imgHeightMm <= pageHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidthMm, imgHeightMm);
    } else {
      let position = 0;
      let heightLeft = imgHeightMm;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidthMm, imgHeightMm);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidthMm, imgHeightMm);
        heightLeft -= pageHeight;
      }
    }

    const filename = formatFilename(
      type === 'invoice' ? 'Invoice' : 'Proposal',
      proposal.clientName,
      'pdf'
    );

    const pdfBlob = pdf.output('blob');
    console.log('[Proposal Generator] PDF Blob created, size:', pdfBlob.size);

    try {
      console.log('[Proposal Generator] Download started for:', filename);
      pdf.save(filename);
      console.log('[Proposal Generator] Download completed for:', filename);
    } catch (saveErr) {
      console.warn('[Proposal Generator] pdf.save() fallback to Blob URL:', saveErr);
      const blobUrl = URL.createObjectURL(pdfBlob);
      triggerDownload(blobUrl, filename);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    }

    return filename;
  } catch (err: any) {
    if (tempContainer && document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }
    console.error('[Proposal Generator] Exception during PDF generation:', err);
    throw err;
  }
};

/**
 * Generate Image Document (.PNG) for Proposal
 */
export const generateImageFromProposal = async (
  proposal: ProposalQuotation,
  customElementRef?: HTMLElement | null
): Promise<string> => {
  console.log('[Proposal Generator] Image generation started...');

  let tempContainer: HTMLElement | null = null;
  let elementToRender: HTMLElement;

  if (customElementRef) {
    tempContainer = makeElementExportSafe(customElementRef);
    document.body.appendChild(tempContainer);
    elementToRender = tempContainer;
    await new Promise(resolve => setTimeout(resolve, 150));
  } else {
    const div = document.createElement('div');
    div.id = 'export-template-temp-container';
    div.style.position = 'absolute';
    div.style.left = '-9999px';
    div.style.top = '0';
    div.style.width = '800px';
    div.style.backgroundColor = '#ffffff';
    div.style.boxSizing = 'border-box';
    div.style.zIndex = '-9999';

    div.innerHTML = buildProposalImageExportHtml(proposal);

    document.body.appendChild(div);
    tempContainer = div;
    elementToRender = tempContainer;
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  try {
    const canvas = await safeHtml2Canvas(elementToRender, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 800
    });

    console.log('[Proposal Generator] Image canvas generated');

    if (tempContainer && document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
      tempContainer = null;
    }

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas rendering produced zero width or height.');
    }

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const filename = formatFilename('Proposal', proposal.clientName, 'png');

    downloadDataUrl(dataUrl, filename);
    return filename;
  } catch (err: any) {
    if (tempContainer && document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }
    console.error('[Proposal Generator] Exception during Image generation:', err);
    throw err;
  }
};
