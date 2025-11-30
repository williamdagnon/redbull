// src/hooks/useOrderCheck.ts
import { useEffect, useRef } from "react";

type CheckResult = { code: number; data?: { result?: { status?: string } } };

export function useOrderCheck({
  checkUrl,
  intervalMs = 5000,
  onSuccess,
}: {
  checkUrl: string;            // full URL to POST to (e.g. /inpays/payin/checkorderqr?orderid=... or a proxied endpoint)
  intervalMs?: number;
  onSuccess: () => void;
}) {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!checkUrl) return;
    const fn = async () => {
      try {
        const res = await fetch(checkUrl, { method: "POST", credentials: "include" });
        if (!res.ok) return;
        const json = (await res.json()) as CheckResult;
        if (json?.code === 0 && json.data?.result?.status === "payin_success") {
          onSuccess();
        }
      } catch (err) {
        // ignore network errors, continue polling
      }
    };

    fn();
    timerRef.current = window.setInterval(fn, intervalMs);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [checkUrl, intervalMs, onSuccess]);
}
