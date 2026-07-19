// app/utils/bus.js
export function getBus() {
  if (!globalThis.__CIVIC_EVENT_BUS) {
    const handlers = {};
    globalThis.__CIVIC_EVENT_BUS = {
      on(evt, fn) {
        (handlers[evt] ||= new Set()).add(fn);
        return () => handlers[evt].delete(fn);
      },
      emit(evt, payload) {
        (handlers[evt] || []).forEach((fn) => { try { fn(payload); } catch {} });
      },
    };
  }
  return globalThis.__CIVIC_EVENT_BUS;
}
