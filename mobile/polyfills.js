// Polyfill WeakRef if not available (some Hermes versions lack it)
if (typeof globalThis.WeakRef === 'undefined') {
  globalThis.WeakRef = class WeakRef {
    constructor(target) {
      this._target = target;
    }
    deref() {
      return this._target;
    }
  };
}

// Polyfill FinalizationRegistry if not available
if (typeof globalThis.FinalizationRegistry === 'undefined') {
  globalThis.FinalizationRegistry = class FinalizationRegistry {
    constructor(callback) {}
    register() {}
    unregister() {}
  };
}
