// app/core/http.js
import * as Network from "expo-network";

const DEFAULT_TIMEOUT = 12000;
const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function http(url, opts = {}, { timeout = DEFAULT_TIMEOUT, retries = 1 } = {}) {
  try {
    const state = await Network.getNetworkStateAsync();
    if (state && state.isConnected === false) throw new Error("offline");
  } catch {}

  // 항상 내부 controller를 만든 뒤, 외부 signal과 '합성'
  const inner = new AbortController();
  const { signal: extSignal, ...restOpts } = opts || {};
  if (extSignal) {
    if (extSignal.aborted) inner.abort();
    else
      extSignal.addEventListener("abort", () => {
        try {
          inner.abort(extSignal.reason);
        } catch {}
      });
  }

  // 타임아웃 시에도 실제 fetch를 abort
  const to = setTimeout(() => {
    try {
      inner.abort(new Error("timeout"));
    } catch {}
  }, timeout);

  try {
    const res = await fetch(url, { ...restOpts, signal: inner.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } catch (e) {
    if (retries > 0) {
      await sleep(600);
      return http(url, opts, { timeout, retries: retries - 1 });
    }
    throw e;
  } finally {
    clearTimeout(to);
  }
}
