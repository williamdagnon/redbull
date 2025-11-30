// src/components/PaymentOption.tsx
import React from "react";

export default function PaymentOption({
  id,
  label,
  checked,
  onChange,
}: {
  id: number;
  label: string;
  checked: boolean;
  onChange: (id: number) => void;
}) {
  return (
    <label className="flex justify-between p-4 bg-white border rounded-lg mb-3 cursor-pointer">
      <span>{label}</span>
      <input
        type="radio"
        name="pay_way"
        checked={checked}
        onChange={() => onChange(id)}
      />
    </label>
  );
}
