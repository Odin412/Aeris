import { nowIso, uuid } from "../utils.js";

export class TitanAIService {
  constructor(store) {
    this.store = store;
    this.ready = true;
    this.registerListeners();
  }

  registerListeners() {
    this.store.eventBus.on("lead.created", (payload) => this.handleLeadCreated(payload));
    this.store.eventBus.on("deal.stageChanged", (payload) => this.handleDealStageChanged(payload));
    this.store.eventBus.on("activity.logged", (payload) => this.generateInsight(payload));
  }

  logWorkflow(tenantId, agent, action, context) {
    const entry = {
      id: uuid(),
      tenantId,
      agent,
      action,
      context,
      createdAt: nowIso(),
    };
    this.store.aiLogs.push(entry);
    this.store.eventBus.emit("ai.log.created", entry);
    return entry;
  }

  generateInsight({ tenantId, message, entity, entityId }) {
    const insight = {
      id: uuid(),
      tenantId,
      type: entity,
      message,
      relatedEntity: entity && entityId ? { type: entity, id: entityId } : undefined,
      createdAt: nowIso(),
    };
    this.store.aiInsights.push(insight);
    return insight;
  }

  handleLeadCreated({ tenantId, leadId }) {
    const lead = this.store.clients.get(leadId);
    if (!lead) return;
    const tenantUsers = Array.from(this.store.users.values()).filter(
      (user) => user.tenantId === tenantId && user.roles.includes("Agent") && user.status === "active"
    );
    if (tenantUsers.length === 0) {
      return;
    }
    const leadsByAgent = new Map();
    for (const client of this.store.clients.values()) {
      if (client.tenantId !== tenantId) continue;
      if (!client.primaryAgentId) continue;
      const count = leadsByAgent.get(client.primaryAgentId) || 0;
      leadsByAgent.set(client.primaryAgentId, count + 1);
    }
    let selected = tenantUsers[0];
    let min = leadsByAgent.get(selected.id) || 0;
    for (const user of tenantUsers) {
      const count = leadsByAgent.get(user.id) || 0;
      if (count < min) {
        min = count;
        selected = user;
      }
    }
    lead.primaryAgentId = selected.id;
    this.createTask({
      tenantId,
      title: `Call ${lead.name}`,
      description: "Initial outreach to new lead",
      assigneeId: selected.id,
      relatedEntity: { type: "lead", id: lead.id },
      createdBy: selected.id,
    });
    this.sendNotification({
      tenantId,
      recipientId: selected.id,
      message: `New lead ${lead.name} assigned to you`,
      type: "lead_assigned",
    });
    this.logWorkflow(tenantId, "Lead Router", "assign_owner", { leadId: lead.id, agentId: selected.id });
  }

  handleDealStageChanged({ tenantId, dealId, newStage }) {
    const deal = this.store.deals.get(dealId);
    if (!deal) return;
    const tasks = this.stageTasks(newStage, deal);
    tasks.forEach((task) => this.createTask(task));
    this.logWorkflow(tenantId, "Deal Copilot", "update_record", {
      dealId,
      stage: newStage,
      taskCount: tasks.length,
    });
  }

  stageTasks(stage, deal) {
    const baseTask = {
      tenantId: deal.tenantId,
      assigneeId: deal.agentId,
      relatedEntity: { type: "deal", id: deal.id },
      createdBy: deal.agentId,
    };
    switch (stage) {
      case "Offer":
        return [
          {
            ...baseTask,
            title: "Send offer package",
            description: "Prepare and send offer documents",
          },
        ];
      case "Escrow":
        return [
          {
            ...baseTask,
            title: "Open escrow",
            description: "Coordinate with escrow officer",
          },
          {
            ...baseTask,
            title: "Schedule inspection",
            description: "Book inspection with client",
          },
        ];
      case "Inspection":
        return [
          {
            ...baseTask,
            title: "Review inspection report",
            description: "Summarize key findings for client",
          },
        ];
      case "Closing":
        return [
          {
            ...baseTask,
            title: "Confirm closing statement",
            description: "Verify commission totals and payouts",
          },
        ];
      default:
        return [];
    }
  }

  createTask({ tenantId, title, description, assigneeId, relatedEntity, createdBy }) {
    const id = uuid();
    const task = {
      id,
      tenantId,
      title,
      description,
      status: "pending",
      assigneeId,
      relatedEntity,
      createdAt: nowIso(),
      createdBy,
    };
    this.store.tasks.set(id, task);
    return task;
  }

  sendNotification({ tenantId, recipientId, message, type }) {
    const notification = {
      id: uuid(),
      tenantId,
      recipientId,
      message,
      type,
      createdAt: nowIso(),
      read: false,
    };
    this.store.notifications.push(notification);
    return notification;
  }

  triggerWorkflow({ tenantId, agent, action, context }) {
    switch (action) {
      case "assign_owner":
        this.handleLeadCreated({ tenantId, leadId: context.leadId });
        break;
      case "create_task":
        this.createTask({ tenantId, ...context });
        break;
      case "send_message":
        this.store.eventBus.emit("communication.outbound", { tenantId, ...context });
        break;
      case "update_record":
        this.store.eventBus.emit("record.updated", { tenantId, ...context });
        break;
      case "trigger_n8n":
        this.store.integrationEvents.push({
          id: uuid(),
          tenantId,
          provider: "n8n",
          type: context.workflow,
          payload: context.payload || {},
          timestamp: nowIso(),
        });
        break;
      case "schedule_followup":
        this.createTask({
          tenantId,
          title: context.title || "Follow up",
          description: context.description || "AI scheduled follow-up",
          assigneeId: context.assigneeId,
          relatedEntity: context.relatedEntity,
          createdBy: agent,
        });
        break;
      default:
        break;
    }
    return this.logWorkflow(tenantId, agent, action, context);
  }

  isReady() {
    return this.ready;
  }

  setReady(state) {
    this.ready = state;
  }
}
