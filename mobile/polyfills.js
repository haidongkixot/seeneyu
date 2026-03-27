// Polyfill WeakRef for Hermes engine compatibility
// Must run before any other module (injected via metro.config.js)

var g = typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

if (!g.WeakRef) {
  g.WeakRef = function WeakRef(target) {
    this._target = target;
  };
  g.WeakRef.prototype.deref = function () {
    return this._target;
  };
}

if (!g.FinalizationRegistry) {
  g.FinalizationRegistry = function FinalizationRegistry() {};
  g.FinalizationRegistry.prototype.register = function () {};
  g.FinalizationRegistry.prototype.unregister = function () {};
}
