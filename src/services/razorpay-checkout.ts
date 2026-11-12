import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { paymentApi } from './payment-api';

export interface CheckoutParams {
  orderId: string;
  paymentId?: string;
  keyId: string;
  amountPaise: number;
  currency?: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (res: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature?: string;
  }) => Promise<void> | void;
  onDismiss?: () => void;
  onError?: (err: any) => void;
}

/**
 * Loads Razorpay Standard Web Checkout script dynamically on web.
 */
function loadWebScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Universal Razorpay Checkout handler that seamlessly adapts to Web and Native.
 */
export async function openRazorpayCheckout(params: CheckoutParams): Promise<void> {
  const {
    orderId,
    paymentId,
    keyId,
    amountPaise,
    currency = 'INR',
    name = 'Turf Arena V2',
    description = 'Booking & Wallet Topup',
    prefill,
    onSuccess,
    onDismiss,
    onError,
  } = params;

  if (Platform.OS === 'web') {
    const loaded = await loadWebScript();
    if (!loaded) {
      onError?.(new Error('Failed to load Razorpay payment SDK.'));
      return;
    }

    const RazorpayConstructor = (window as any).Razorpay;
    if (!RazorpayConstructor) {
      onError?.(new Error('Razorpay SDK not available.'));
      return;
    }

    const options = {
      key: keyId,
      amount: amountPaise,
      currency,
      name,
      description,
      order_id: orderId,
      prefill: {
        name: prefill?.name || '',
        email: prefill?.email || '',
        contact: prefill?.contact || '',
      },
      theme: {
        color: '#0284c7',
      },
      handler: async (response: any) => {
        try {
          if (response.razorpay_signature) {
            // Verify HMAC signature on backend
            await paymentApi.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
          }
          await onSuccess({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        } catch (err) {
          onError?.(err);
        }
      },
      modal: {
        ondismiss: () => {
          onDismiss?.();
        },
      },
    };

    const rzpInstance = new RazorpayConstructor(options);
    rzpInstance.open();
  } else {
    // Native / Expo Go: Open hosted secure checkout
    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:5070/api';
      const checkoutUrl = `${baseUrl}/payments/checkout/${orderId}`;
      const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, 'turfapp://');

      if (result.type === 'success' && result.url) {
        const urlObj = new URL(result.url);
        const razorpay_order_id = urlObj.searchParams.get('order_id') || orderId;
        const razorpay_payment_id = urlObj.searchParams.get('payment_id') || '';
        await onSuccess({ razorpay_order_id, razorpay_payment_id });
      } else {
        // Poll status if dismissed to see if webhook or background verify finished
        if (paymentId) {
          try {
            const statusRes: any = await paymentApi.getPayment(paymentId);
            if (statusRes?.status === 'paid') {
              await onSuccess({ razorpay_order_id: orderId, razorpay_payment_id: statusRes.razorpayPaymentId || '' });
              return;
            }
          } catch {
            // Ignored
          }
        }
        onDismiss?.();
      }
    } catch (err) {
      onError?.(err);
    }
  }
}

