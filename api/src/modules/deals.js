import { HttpError, nowIso, uuid } from "../utils.js";

export class DealService {
  constructor(store, aiService) {
    this.store = store;
    this.ai = aiService;
  }

  createDeal({ tenantId, clientId, agentId, value }) {
    const client = this.store.clients.get(clientId);
    if (!client || client.tenantId !== tenantId) throw new HttpError(404, "Client not found");
    const deal = {
      id: uuid(),
      tenantId,
      clientId,
      agentId,
      stage: "Offer",
      value,
      tasks: [],
      documents: [],
      commission: this.calculateCommission(value),
      updatedAt: nowIso(),
      createdAt: nowIso(),
    };
    this.store.deals.set(deal.id, deal);
    this.store.eventBus.emit("deal.stageChanged", { tenantId, dealId: deal.id, newStage: deal.stage });
    return deal;
  }

  calculateCommission(value) {
    const tenantSplit = value * 0.2;
    const agentSplit = value * 0.8;
    return { tenantSplit, agentSplit, otherFees: value * 0.02 };
  }

  updateStage({ tenantId, dealId, stage }) {
    const deal = this.store.deals.get(dealId);
    if (!deal || deal.tenantId !== tenantId) throw new HttpError(404, "Deal not found");
    deal.stage = stage;
    deal.updatedAt = nowIso();
    this.store.eventBus.emit("deal.stageChanged", { tenantId, dealId, newStage: stage });
    return deal;
  }

  attachDocument({ tenantId, dealId, name, category, url }) {
    const deal = this.store.deals.get(dealId);
    if (!deal || deal.tenantId !== tenantId) throw new HttpError(404, "Deal not found");
    const doc = {
      id: uuid(),
      tenantId,
      dealId,
      name,
      category,
      url,
      version: deal.documents.filter((d) => d.name === name).length + 1,
      uploadedAt: nowIso(),
    };
    deal.documents.push(doc);
    return doc;
  }

  financeSummary(tenantId) {
    const deals = Array.from(this.store.deals.values()).filter((d) => d.tenantId === tenantId);
    const totalValue = deals.reduce((acc, d) => acc + d.value, 0);
    const totalTenantSplit = deals.reduce((acc, d) => acc + d.commission.tenantSplit, 0);
    const totalAgentSplit = deals.reduce((acc, d) => acc + d.commission.agentSplit, 0);
    return {
      totalDeals: deals.length,
      totalValue,
      tenantRevenue: totalTenantSplit,
      agentRevenue: totalAgentSplit,
    };
  }
}
