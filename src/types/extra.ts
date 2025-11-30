export interface Referral {
  id: string;
  full_name?: string;
  phone?: string;
  created_at?: string;
  status?: string;
}

export interface PaymentMethodPayload {
  name: string;
  code: string;
  description?: string;
  bank_id: string;
  account_holder_name?: string;
  account_number?: string;
  min_deposit?: number;
}
