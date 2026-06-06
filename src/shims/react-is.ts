// Minimal shim for `react-is`.
//
// Recharts depends on `react-is` but this project doesn't directly require it.
// In some environments the dependency may not be installed correctly.
//
// This shim is sufficient for Recharts' internal checks.

export const isFragment = () => false;
export const typeOf = () => undefined;
export const ContextConsumer = Symbol.for('react.context');
export const ContextProvider = Symbol.for('react.provider');

