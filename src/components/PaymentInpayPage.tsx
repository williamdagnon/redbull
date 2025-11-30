// src/pages/PaymentInpayPage.tsx
import React, { useState, useCallback } from "react";
import Loader from "../components/Loader";
import { useOrderCheck } from "../hooks/useOrderCheck";

export default function PaymentInpayPage(props: Partial<{orderCode:string; amount:string; checkUrl:string; paymentBase:string; payByIdBase:string}>) {
  // Allow passing params via querystring for SPA routing
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const orderCode = props.orderCode || params?.get('orderCode') || 'I' + Date.now();
  const amount = props.amount || params?.get('amount') || '0.00';
  const defaultHost = props.paymentBase || params?.get('paymentBase') || '//t175672243746440wkpaytgcard.inpayafrica.net/inpays/payin/payment?code=';
  const paymentBase = props.paymentBase || defaultHost;
  const payByIdBase = props.payByIdBase || params?.get('payByIdBase') || '//t175672243746440wkpaytgcard.inpayafrica.net/inpays/payin/topaybyid?code=';
  const checkUrl = props.checkUrl || params?.get('checkUrl') || `//t175672243746440wkpaytgcard.inpayafrica.net/inpays/payin/checkorderqr?orderid=${orderCode}`;
  const [loading, setLoading] = useState(false);

  const onSuccess = useCallback(() => {
    // redirect to success page (match original behaviour)
    window.location.href = decodeURIComponent("https://payments.inpayafrica.com/order_status/success.php?total_fee%3D" + encodeURIComponent(amount) + "%26order_number%3D" + encodeURIComponent(orderCode) + "%26pay_gateway%3Dinpay");
  }, [amount, orderCode]);

  // start polling - the hook will POST to checkUrl
  useOrderCheck({ checkUrl, intervalMs: 5000, onSuccess });

  const redirectToLink = async (payUrl?: string) => {
    setLoading(true);
    try {
      // original code posted to same check url before redirect, we mimic a quick POST to checkUrl
      await fetch(checkUrl, { method: "POST", credentials: "include" });
    } catch (e) { /* ignore */ }
    setLoading(false);
    // open payment page
    const target = payUrl ?? (paymentBase + orderCode);
    // If it's a protocol-less URL (starts with //) preserve it
    window.location.href = target;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow p-6 mt-6">
        <div className="text-center mb-4">
          <div className="text-3xl font-bold">{amount}</div>
          <div className="text-sm text-gray-500">XOF</div>
        </div>

        <div className="mb-6 text-gray-700">Sélectionnez le mode de paiement :</div>

        <div className="space-y-3">
          <button
            onClick={() => redirectToLink(payByIdBase + orderCode + "&channel_id=1643")}
            className="w-full flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
          >
            <span className="font-medium">TMoney</span>
            <img src="/static/polymeric/images/right.png" alt=">" className="h-6" />
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          Attendez la confirmation de paiement — la page vérifiera automatiquement le statut.
        </div>
      </div>

      <Loader visible={loading} />
    </div>
  );
}
