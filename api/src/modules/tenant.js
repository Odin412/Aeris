import { defaultTheme } from "../datastore.js";
import { HttpError, nowIso, uuid } from "../utils.js";

export class TenantService {
  constructor(store) {
    this.store = store;
  }

  createTenant({ name, domain, theme }) {
    const existing = Array.from(this.store.tenants.values()).find((t) => t.domain === domain);
    if (existing) {
      throw new HttpError(400, "Domain already in use");
    }
    const tenant = this.store.createTenant({ name, domain, theme: theme || defaultTheme() });
    return tenant;
  }

  updateTheme({ tenantId, theme }) {
    const tenant = this.store.tenants.get(tenantId);
    if (!tenant) throw new HttpError(404, "Tenant not found");
    tenant.theme = { ...tenant.theme, ...theme };
    tenant.updatedAt = nowIso();
    this.store.eventBus.emit("tenant.theme.updated", { tenantId, theme: tenant.theme });
    return tenant.theme;
  }

  updateSettings({ tenantId, settings }) {
    const tenant = this.store.tenants.get(tenantId);
    if (!tenant) throw new HttpError(404, "Tenant not found");
    settings.forEach((item) => {
      const existingIndex = tenant.settings.findIndex((s) => s.key === item.key);
      if (existingIndex >= 0) {
        tenant.settings[existingIndex] = item;
      } else {
        tenant.settings.push(item);
      }
    });
    tenant.updatedAt = nowIso();
    return tenant.settings;
  }

  addBrandingAsset({ tenantId, type, url }) {
    const tenant = this.store.tenants.get(tenantId);
    if (!tenant) throw new HttpError(404, "Tenant not found");
    const asset = {
      id: uuid(),
      tenantId,
      type,
      url,
      createdAt: nowIso(),
    };
    this.store.brandingAssets.push(asset);
    return asset;
  }
}
