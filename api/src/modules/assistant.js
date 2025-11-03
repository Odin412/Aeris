import { HttpError, nowIso, uuid } from "../utils.js";

export class AssistantService {
  constructor(store, aiService, crmService, dealService) {
    this.store = store;
    this.ai = aiService;
    this.crm = crmService;
    this.deals = dealService;
  }

  chat({ tenantId, userId, prompt }) {
    const lower = prompt.toLowerCase();
    if (lower.includes("assign lead")) {
      const match = prompt.match(/assign lead (.+) to (.+)/i);
      if (match) {
        const leadName = match[1].trim();
        const agentName = match[2].trim();
        return this.assignLeadByName({ tenantId, leadName, agentName, userId });
      }
    }
    if (lower.includes("schedule follow")) {
      const match = prompt.match(/schedule follow.?up for (.+)/i);
      if (match) {
        const leadName = match[1].trim();
        return this.scheduleFollowUp({ tenantId, leadName, userId });
      }
    }
    if (lower.includes("deal status")) {
      const match = prompt.match(/deal status for (.+)/i);
      if (match) {
        const clientName = match[1].trim();
        return this.dealStatus({ tenantId, clientName });
      }
    }
    return {
      response: "I can help with assigning leads, scheduling follow-ups, or checking deal status.",
    };
  }

  assignLeadByName({ tenantId, leadName, agentName, userId }) {
    const lead = Array.from(this.store.clients.values()).find(
      (client) => client.tenantId === tenantId && client.name.toLowerCase() === leadName.toLowerCase()
    );
    if (!lead) throw new HttpError(404, "Lead not found");
    const agent = Array.from(this.store.users.values()).find(
      (user) =>
        user.tenantId === tenantId &&
        user.profile.firstName &&
        `${user.profile.firstName} ${user.profile.lastName}`.toLowerCase() === agentName.toLowerCase()
    );
    if (!agent) throw new HttpError(404, "Agent not found");
    lead.primaryAgentId = agent.id;
    this.ai.triggerWorkflow({
      tenantId,
      agent: "Lead Router",
      action: "assign_owner",
      context: { leadId: lead.id },
    });
    return { response: `Assigned ${lead.name} to ${agent.profile.firstName}` };
  }

  scheduleFollowUp({ tenantId, leadName, userId }) {
    const lead = Array.from(this.store.clients.values()).find(
      (client) => client.tenantId === tenantId && client.name.toLowerCase() === leadName.toLowerCase()
    );
    if (!lead) throw new HttpError(404, "Lead not found");
    const task = this.ai.createTask({
      tenantId,
      title: `Follow up with ${lead.name}`,
      description: "AI scheduled follow-up",
      assigneeId: lead.primaryAgentId || userId,
      relatedEntity: { type: "lead", id: lead.id },
      createdBy: userId,
    });
    return { response: `Follow-up scheduled`, task };
  }

  dealStatus({ tenantId, clientName }) {
    const client = Array.from(this.store.clients.values()).find(
      (c) => c.tenantId === tenantId && c.name.toLowerCase() === clientName.toLowerCase()
    );
    if (!client) throw new HttpError(404, "Client not found");
    const deal = Array.from(this.store.deals.values()).find(
      (d) => d.tenantId === tenantId && d.clientId === client.id
    );
    if (!deal) return { response: `${client.name} has no active deals.` };
    return { response: `${client.name}'s deal is in ${deal.stage} stage.` };
  }

  recordVoice({ tenantId, channel, content, relatedEntity }) {
    const transcript = {
      id: uuid(),
      tenantId,
      channel,
      content,
      relatedEntity,
      createdAt: nowIso(),
    };
    this.store.voiceLogs.push(transcript);
    if (relatedEntity) {
      this.ai.triggerWorkflow({
        tenantId,
        agent: "Client Success Agent",
        action: "schedule_followup",
        context: {
          title: `Follow up after ${channel}`,
          description: content.slice(0, 120),
          assigneeId: relatedEntity.assigneeId,
          relatedEntity,
        },
      });
    }
    return transcript;
  }
}
