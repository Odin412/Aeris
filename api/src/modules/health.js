export class HealthService {
  constructor(store, ai) {
    this.store = store;
    this.ai = ai;
  }

  getState() {
    const dbHealthy = this.store.tenants instanceof Map;
    return {
      ok: dbHealthy && this.ai.isReady(),
      db: dbHealthy,
      ai: this.ai.isReady() ? "ready" : "offline",
    };
  }
}
