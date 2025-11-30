// src/components/Loader.tsx
import React from "react";

export default function Loader({ visible = false }: { visible?: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-t-blue-600 rounded-full animate-spin" />
        <div>wait...</div>
      </div>
    </div>
  );
}
