declare module "react-native-razorpay" {
  interface RazorpayPrefill {
    name?: string;
    email?: string;
    contact?: string;
  }

  interface RazorpayTheme {
    color?: string;
  }

  interface RazorpayCheckoutOptions {
    key: string;
    order_id?: string;
    amount?: number;
    currency?: string;
    name?: string;
    description?: string;
    image?: string;
    prefill?: RazorpayPrefill;
    theme?: RazorpayTheme;
    [key: string]: unknown;
  }

  interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  interface RazorpayErrorResponse {
    code: number;
    description: string;
    [key: string]: unknown;
  }

  const RazorpayCheckout: {
    open(options: RazorpayCheckoutOptions): Promise<RazorpaySuccessResponse>;
  };

  export default RazorpayCheckout;
}
