import { HttpError, nowIso, uuid } from "../utils.js";

export class CRMService {
  constructor(store) {
    this.store = store;
  }

  ensureTenantUser(tenantId, userId) {
    const user = this.store.users.get(userId);
    if (!user || user.tenantId !== tenantId) {
      throw new HttpError(404, "User not found for tenant");
    }
    return user;
  }

  createLead({ tenantId, agentId, name, email, phone, source }) {
    const agent = this.ensureTenantUser(tenantId, agentId);
    const id = uuid();
    const lead = {
      id,
      tenantId,
      primaryAgentId: agent.id,
      name,
      email,
      phone,
      stage: "Lead",
      source: source || { type: "Manual" },
      tags: [],
      activity: [],
      tasks: [],
      contacts: [],
      preferences: {},
      pipelineId: uuid(),
    };
    this.store.clients.set(id, lead);
    this.logActivity({
      tenantId,
      entity: "lead",
      entityId: id,
      message: `Lead ${name} created`,
      createdBy: agentId,
    });
    this.store.eventBus.emit("lead.created", { tenantId, leadId: id });
    return lead;
  }

  updateLeadStage({ tenantId, leadId, stage, userId }) {
    const lead = this.store.clients.get(leadId);
    if (!lead || lead.tenantId !== tenantId) {
      throw new HttpError(404, "Lead not found");
    }
    lead.stage = stage;
    this.logActivity({
      tenantId,
      entity: "lead",
      entityId: leadId,
      message: `Stage updated to ${stage}`,
      createdBy: userId,
    });
    return lead;
  }

  logActivity({ tenantId, entity, entityId, message, createdBy }) {
    const activity = {
      id: uuid(),
      tenantId,
      entity,
      entityId,
      message,
      createdAt: nowIso(),
      createdBy,
    };
    const lead = this.store.clients.get(entityId);
    if (lead) {
      lead.activity.push(activity);
    }
    this.store.eventBus.emit("activity.logged", { tenantId, message, entity, entityId });
    return activity;
  }

  logContact({ tenantId, userId, leadId, method, notes }) {
    const lead = this.store.clients.get(leadId);
    if (!lead || lead.tenantId !== tenantId) throw new HttpError(404, "Lead not found");
    const record = {
      id: uuid(),
      tenantId,
      userId,
      method,
      notes,
      timestamp: nowIso(),
    };
    lead.contacts.push(record);
    return record;
  }

  assignTask({ tenantId, title, description, dueDate, assigneeId, relatedEntity, createdBy }) {
    const task = {
      id: uuid(),
      tenantId,
      title,
      description,
      dueDate,
      status: "pending",
      assigneeId,
      relatedEntity,
      createdAt: nowIso(),
      createdBy,
    };
    this.store.tasks.set(task.id, task);
    const lead = relatedEntity && relatedEntity.type === "lead" ? this.store.clients.get(relatedEntity.id) : null;
    if (lead) {
      lead.tasks.push(task);
    }
    return task;
  }

  listLeads(tenantId) {
    return Array.from(this.store.clients.values()).filter((lead) => lead.tenantId === tenantId);
  }
}
