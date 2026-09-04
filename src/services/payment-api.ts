import { apiClient } from './api-client';

/**
 * payment-api.ts
 * Client for the server-side Razorpay routes.
 *
 * The amount is deliberately NOT a parameter for booking/enrolment purchases:
 * the server prices the purchase from its own records so a tampered client
 * cannot pay ₹1 for a ₹2500 class. `topUpAmount` is the one caller-supplied
 * figure, and the server still floors it at its own minimum.
 *
 * Every call here fails loudly. That matters because the flows this replaced
 * credited wallets and confirmed bookings with no payment at all — a silent
 * failure would put that behaviour straight back.
 */

export type PaymentPurpose = 'booking' | 'enrollment' | 'wallet_topup';

export interface PaymentOrder {
  paymentId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  /** Razorpay publishable key, needed to open checkout. */
  keyId: string;
}

export interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** Thrown when the server has no Razorpay credentials configured. */
export class PaymentsUnavailableError extends Error {
  constructor() {
    super(
      'Payments are not set up on the server yet. ' +
        'Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET in the backend .env.'
    );
    this.name = 'PaymentsUnavailableError';
  }
}

function rethrow(err: any): never {
  // The order route answers 503 specifically when credentials are absent, which
  // is a setup problem rather than a payment failure — worth naming separately
  // so the UI can say something actionable.
  const status = err?.status ?? err?.response?.status;
  const message = String(err?.message ?? '');
  if (status === 503 || /not configured/i.test(message)) {
    throw new PaymentsUnavailableError();
  }
  throw err;
}

export const paymentApi = {
  /** True when the server can actually take money. */
  isConfigured: async (): Promise<boolean> => {
    try {
      const res = await apiClient.get('/payments/config');
      return Boolean(res?.configured ?? res?.keyId);
    } catch {
      return false;
    }
  },

  /**
   * Open an order. `referenceId` identifies the booking or class being paid
   * for; `topUpAmount` (in rupees) applies only to wallet top-ups.
   */
  createOrder: async (
    purpose: PaymentPurpose,
    referenceId?: string,
    topUpAmount?: number
  ): Promise<PaymentOrder> => {
    try {
      return await apiClient.post('/payments/order', {
        purpose,
        ...(referenceId ? { referenceId } : {}),
        ...(topUpAmount != null ? { topUpAmount } : {}),
      });
    } catch (err) {
      rethrow(err);
    }
  },

  /**
   * Hand the gateway's signed response back for verification. Only a payment
   * the server has verified may credit a wallet or confirm a booking — never
   * the client's own word that checkout succeeded.
   */
  verify: async (payload: PaymentVerification) => {
    try {
      return await apiClient.post('/payments/verify', payload);
    } catch (err) {
      rethrow(err);
    }
  },

  getPayment: async (id: string) => apiClient.get(`/payments/${id}`),
};
