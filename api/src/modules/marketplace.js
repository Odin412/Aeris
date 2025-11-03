import { nowIso, uuid } from "../utils.js";

export class MarketplaceService {
  constructor(store, aiService) {
    this.store = store;
    this.ai = aiService;
  }

  upsertProperty({ tenantId, property }) {
    const id = property.id || uuid();
    const existing = this.store.properties.get(id);
    const next = {
      id,
      tenantId,
      address: property.address,
      city: property.city,
      state: property.state,
      zip: property.zip,
      price: property.price,
      beds: property.beds,
      baths: property.baths,
      sqft: property.sqft,
      type: property.type,
      media: property.media || [],
      description: property.description || "",
      ownerId: property.ownerId,
      metadata: property.metadata || {},
    };
    this.store.properties.set(id, next);
    if (!existing) {
      this.ai.generateInsight({
        tenantId,
        message: `New property ${next.address} added to marketplace`,
        entity: "property",
        entityId: id,
      });
    }
    return next;
  }

  search({ tenantId, filters }) {
    return Array.from(this.store.properties.values()).filter((property) => {
      if (property.tenantId !== tenantId) return false;
      if (filters.city && property.city !== filters.city) return false;
      if (filters.type && property.type !== filters.type) return false;
      if (filters.minPrice && property.price < filters.minPrice) return false;
      if (filters.maxPrice && property.price > filters.maxPrice) return false;
      if (filters.beds && property.beds < filters.beds) return false;
      return true;
    });
  }

  savePreference({ tenantId, userId, preference }) {
    const key = `${tenantId}:${userId}`;
    this.store.marketplacePreferences.set(key, preference);
    return preference;
  }

  recommendations({ tenantId, userId }) {
    const key = `${tenantId}:${userId}`;
    const pref = this.store.marketplacePreferences.get(key);
    const properties = pref
      ? this.search({ tenantId, filters: pref.filters || {} }).slice(0, 5)
      : Array.from(this.store.properties.values())
          .filter((p) => p.tenantId === tenantId)
          .slice(0, 5);
    const recommendation = {
      userId,
      properties,
      generatedAt: nowIso(),
    };
    this.ai.logWorkflow(tenantId, "Listing Optimizer", "suggest_properties", {
      userId,
      count: properties.length,
    });
    return recommendation;
  }
}
