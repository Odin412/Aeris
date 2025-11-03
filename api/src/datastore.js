import { EventEmitter } from "events";
import { nowIso, uuid } from "./utils.js";

export class DataStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.tenants = new Map();
    this.roles = new Map();
    this.permissions = new Map();
    this.users = new Map();
    this.sessions = new Map();
    this.onboardingSteps = new Map();
    this.onboardingStates = new Map();
    this.clients = new Map();
    this.feedPosts = new Map();
    this.directMessages = new Map();
    this.deals = new Map();
    this.tasks = new Map();
    this.integrationCredentials = new Map();
    this.integrationEvents = [];
    this.properties = new Map();
    this.marketplacePreferences = new Map();
    this.aiInsights = [];
    this.aiLogs = [];
    this.auditLogs = [];
    this.notifications = [];
    this.voiceLogs = [];
    this.quickActions = [];
    this.brandingAssets = [];
    this.settings = new Map();
    this.themeStreams = new Map();
    this.eventBus = new EventEmitter();
  }

  createTenant({ name, domain, theme }) {
    const id = uuid();
    const timestamp = nowIso();
    const tenant = {
      id,
      name,
      domain,
      theme: theme || defaultTheme(),
      settings: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.tenants.set(id, tenant);
    this.auditLogs.push({
      id: uuid(),
      tenantId: id,
      actorId: id,
      action: "tenant.created",
      entity: "tenant",
      entityId: id,
      timestamp,
    });
    this.bootstrapTenantRoles(id);
    this.bootstrapOnboardingSteps(id);
    this.bootstrapQuickActions(id);
    return tenant;
  }

  bootstrapTenantRoles(tenantId) {
    const brokerRole = {
      id: uuid(),
      tenantId,
      name: "BrokerAdmin",
      permissions: ["manage_tenant", "manage_agents", "manage_finance"],
    };
    const agentRole = {
      id: uuid(),
      tenantId,
      name: "Agent",
      permissions: ["manage_clients", "view_deals", "view_marketplace"],
    };
    const clientRole = {
      id: uuid(),
      tenantId,
      name: "Client",
      permissions: ["view_properties", "upload_documents"],
    };
    [brokerRole, agentRole, clientRole].forEach((role) => {
      this.roles.set(role.id, role);
    });
  }

  bootstrapOnboardingSteps(tenantId) {
    const steps = [
      {
        id: uuid(),
        tenantId,
        label: "Profile Setup",
        description: "Complete personal and license details",
        order: 1,
        required: true,
      },
      {
        id: uuid(),
        tenantId,
        label: "Document Upload",
        description: "Submit compliance and tax documents",
        order: 2,
        required: true,
      },
      {
        id: uuid(),
        tenantId,
        label: "Broker Interview",
        description: "Meet with broker for final approval",
        order: 3,
        required: false,
      },
    ];
    this.onboardingSteps.set(tenantId, steps);
  }

  bootstrapQuickActions(tenantId) {
    const actions = [
      {
        id: uuid(),
        tenantId,
        title: "New Lead",
        description: "Capture a new lead while on the go",
        action: "create_lead",
      },
      {
        id: uuid(),
        tenantId,
        title: "Log Call",
        description: "Record call notes in CRM",
        action: "log_call",
      },
    ];
    actions.forEach((action) => {
      this.quickActions.push(action);
    });
  }
}

export function defaultTheme() {
  return {
    primaryColor: "#000000",
    secondaryColor: "#ffffff",
    accentColor: "#d4af37",
  };
}
