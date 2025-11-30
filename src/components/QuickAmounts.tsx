// src/components/QuickAmounts.tsx
import React from "react";

export default function QuickAmounts({
  values,
  selected,
  onSelect,
}: {
  values: number[];
  selected?: number | null;
  onSelect: (v: number) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {values.map((v) => (
        <button
          key={v}
          type="button"
          className={`rounded-full h-14 w-14 flex items-center justify-center border transition ${
            selected === v ? "border-blue-600 text-blue-600 font-semibold" : "border-gray-300 text-gray-500"
          }`}
          onClick={() => onSelect(v)}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
