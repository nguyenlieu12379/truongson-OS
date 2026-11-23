// Minimal stand-ins for the three "framer" imports the Venom button uses outside Framer.
export function addPropertyControls() {}
export const ControlType = new Proxy({}, { get: (_, k) => String(k) });
export function useIsStaticRenderer() { return false; }
