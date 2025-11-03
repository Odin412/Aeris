import { createServer } from "http";
import { parse } from "url";
import { DataStore } from "./datastore.js";
import { Router } from "./router.js";
import { readJson, sendJson, HttpError, requireFields } from "./utils.js";
import { AuthService } from "./modules/auth.js";
import { TenantService } from "./modules/tenant.js";
import { OnboardingService } from "./modules/onboarding.js";
import { CRMService } from "./modules/crm.js";
import { CommunicationService } from "./modules/communications.js";
import { TitanAIService } from "./modules/ai.js";
import { DealService } from "./modules/deals.js";
import { IntegrationService } from "./modules/integrations.js";
import { MarketplaceService } from "./modules/marketplace.js";
import { AssistantService } from "./modules/assistant.js";
import { MobileService } from "./modules/mobile.js";
import { SecurityService } from "./modules/security.js";
import { HealthService } from "./modules/health.js";

function getTenantId(req) {
  return req.headers["x-tenant-id"] || req.query.tenantId;
}

function getAuthToken(req) {
  const header = req.headers.authorization;
  if (!header) return null;
  const parts = header.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    return parts[1];
  }
  return header;
}

export class AerisApplication {
  constructor() {
    this.store = new DataStore();
    this.router = new Router();
    this.ai = new TitanAIService(this.store);
    this.auth = new AuthService(this.store);
    this.tenants = new TenantService(this.store);
    this.onboarding = new OnboardingService(this.store);
    this.crm = new CRMService(this.store);
    this.deals = new DealService(this.store, this.ai);
    this.integrations = new IntegrationService(this.store);
    this.marketplace = new MarketplaceService(this.store, this.ai);
    this.communications = new CommunicationService(this.store);
    this.assistant = new AssistantService(this.store, this.ai, this.crm, this.deals);
    this.mobile = new MobileService(this.store);
    this.security = new SecurityService(this.store);
    this.health = new HealthService(this.store, this.ai);
    this.server = createServer((req, res) => this.handle(req, res));
    this.registerRoutes();
  }

  async handle(req, res) {
    const handled = await this.router.handle(req, res, this.contextFor(req));
    if (!handled) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Found" }));
    }
  }

  contextFor(req) {
    const tenantId = getTenantId(req);
    const token = getAuthToken(req);
    const session = this.auth.authenticate(token);
    return {
      tenantId,
      session,
      services: {
        auth: this.auth,
        tenants: this.tenants,
        onboarding: this.onboarding,
        crm: this.crm,
        communications: this.communications,
        deals: this.deals,
        integrations: this.integrations,
        marketplace: this.marketplace,
        assistant: this.assistant,
        mobile: this.mobile,
        security: this.security,
        ai: this.ai,
        health: this.health,
      },
    };
  }

  requireTenant(context) {
    if (!context.tenantId) {
      throw new HttpError(400, "Tenant ID required");
    }
    const tenant = this.store.tenants.get(context.tenantId);
    if (!tenant) {
      throw new HttpError(404, "Tenant not found");
    }
    return tenant;
  }

  requireAuth(context) {
    if (!context.session) {
      throw new HttpError(401, "Authentication required");
    }
    const user = context.session.user;
    return user;
  }

  registerRoutes() {
    // Health
    this.router.register("GET", "/health", async (req, res, ctx) => {
      sendJson(res, 200, this.health.getState());
    });

    // Tenants
    this.router.register("POST", "/tenants", async (req, res, ctx) => {
      const body = await readJson(req);
      requireFields(body, ["name", "domain"]);
      const tenant = this.tenants.createTenant(body);
      sendJson(res, 201, tenant);
    });

    this.router.register("PUT", "/tenants/:tenantId/theme", async (req, res, ctx) => {
      const body = await readJson(req);
      const theme = this.tenants.updateTheme({ tenantId: req.params.tenantId, theme: body });
      sendJson(res, 200, theme);
    });

    this.router.register("PUT", "/tenants/:tenantId/settings", async (req, res, ctx) => {
      const body = await readJson(req);
      requireFields(body, ["settings"]);
      const settings = this.tenants.updateSettings({ tenantId: req.params.tenantId, settings: body.settings });
      sendJson(res, 200, settings);
    });

    this.router.register("POST", "/tenants/:tenantId/branding", async (req, res) => {
      const body = await readJson(req);
      requireFields(body, ["type", "url"]);
      const asset = this.tenants.addBrandingAsset({ tenantId: req.params.tenantId, type: body.type, url: body.url });
      sendJson(res, 201, asset);
    });

    this.router.register("GET", "/tenants/:tenantId/branding", async (req, res) => {
      const assets = this.store.brandingAssets.filter((asset) => asset.tenantId === req.params.tenantId);
      sendJson(res, 200, assets);
    });

    // Auth
    this.router.register("POST", "/auth/register", async (req, res, ctx) => {
      const body = await readJson(req);
      requireFields(body, ["tenantId", "role", "profile", "password"]);
      const user = this.auth.register({ tenantId: body.tenantId, roleName: body.role, profile: body.profile, password: body.password });
      sendJson(res, 201, user);
    });

    this.router.register("POST", "/auth/login", async (req, res, ctx) => {
      const body = await readJson(req);
      requireFields(body, ["tenantId", "email", "password"]);
      const session = this.auth.login(body);
      sendJson(res, 200, session);
    });

    // Onboarding
    this.router.register("GET", "/onboarding/steps", async (req, res, ctx) => {
      this.requireTenant(ctx);
      const steps = this.onboarding.getSteps(ctx.tenantId);
      sendJson(res, 200, steps);
    });

    this.router.register("PUT", "/onboarding/steps", async (req, res, ctx) => {
      this.requireTenant(ctx);
      const body = await readJson(req);
      requireFields(body, ["steps"]);
      const steps = this.onboarding.configureSteps(ctx.tenantId, body.steps);
      sendJson(res, 200, steps);
    });

    this.router.register("POST", "/onboarding/:userId/documents", async (req, res) => {
      const body = await readJson(req);
      requireFields(body, ["name", "url"]);
      const doc = this.onboarding.uploadDocument({ userId: req.params.userId, document: body });
      sendJson(res, 201, doc);
    });

    this.router.register("POST", "/onboarding/:userId/steps/:stepId/complete", async (req, res) => {
      const state = this.onboarding.completeStep({ userId: req.params.userId, stepId: req.params.stepId });
      sendJson(res, 200, state);
    });

    this.router.register("POST", "/onboarding/:userId/verify", async (req, res) => {
      const body = await readJson(req);
      const state = this.onboarding.verifyLicense({ userId: req.params.userId, brokerId: body.brokerId });
      sendJson(res, 200, state);
    });

    // CRM
    this.router.register("POST", "/crm/leads", async (req, res, ctx) => {
      const body = await readJson(req);
      this.requireTenant(ctx);
      requireFields(body, ["agentId", "name", "email"]);
      const lead = this.crm.createLead({
        tenantId: ctx.tenantId,
        agentId: body.agentId,
        name: body.name,
        email: body.email,
        phone: body.phone,
        source: body.source,
      });
      sendJson(res, 201, lead);
    });

    this.router.register("PATCH", "/crm/leads/:leadId/stage", async (req, res, ctx) => {
      const body = await readJson(req);
      this.requireTenant(ctx);
      requireFields(body, ["stage", "userId"]);
      const lead = this.crm.updateLeadStage({
        tenantId: ctx.tenantId,
        leadId: req.params.leadId,
        stage: body.stage,
        userId: body.userId,
      });
      sendJson(res, 200, lead);
    });

    this.router.register("POST", "/crm/leads/:leadId/activity", async (req, res, ctx) => {
      const body = await readJson(req);
      this.requireTenant(ctx);
      requireFields(body, ["message", "userId"]);
      const activity = this.crm.logActivity({
        tenantId: ctx.tenantId,
        entity: "lead",
        entityId: req.params.leadId,
        message: body.message,
        createdBy: body.userId,
      });
      sendJson(res, 201, activity);
    });

    this.router.register("POST", "/crm/leads/:leadId/contact", async (req, res, ctx) => {
      const body = await readJson(req);
      this.requireTenant(ctx);
      requireFields(body, ["userId", "method", "notes"]);
      const contact = this.crm.logContact({
        tenantId: ctx.tenantId,
        userId: body.userId,
        leadId: req.params.leadId,
        method: body.method,
        notes: body.notes,
      });
      sendJson(res, 201, contact);
    });

    this.router.register("GET", "/crm/leads", async (req, res, ctx) => {
      this.requireTenant(ctx);
      const leads = this.crm.listLeads(ctx.tenantId);
      sendJson(res, 200, leads);
    });

    // Communications
    this.router.register("POST", "/communications/feed", async (req, res, ctx) => {
      const body = await readJson(req);
      this.requireTenant(ctx);
      requireFields(body, ["channel", "authorId", "message"]);
      const post = this.communications.createPost({ tenantId: ctx.tenantId, ...body });
      sendJson(res, 201, post);
    });

    this.router.register("POST", "/communications/feed/:postId/like", async (req, res, ctx) => {
      const body = await readJson(req);
      this.requireTenant(ctx);
      requireFields(body, ["userId"]);
      const post = this.communications.likePost({ tenantId: ctx.tenantId, postId: req.params.postId, userId: body.userId });
      sendJson(res, 200, post);
    });

    this.router.register("POST", "/communications/feed/:postId/comment", async (req, res, ctx) => {
      const body = await readJson(req);
      this.requireTenant(ctx);
      requireFields(body, ["authorId", "message"]);
      const comment = this.communications.commentOnPost({
        tenantId: ctx.tenantId,
        postId: req.params.postId,
        authorId: body.authorId,
        message: body.message,
      });
      sendJson(res, 201, comment);
    });

    this.router.register("POST", "/communications/direct", async (req, res, ctx) => {
      const body = await readJson(req);
      this.requireTenant(ctx);
      requireFields(body, ["participants", "senderId", "body"]);
      const thread = this.communications.sendDirectMessage({
        tenantId: ctx.tenantId,
        participantIds: body.participants,
        senderId: body.senderId,
        body: body.body,
      });
      sendJson(res, 201, thread);
    });

    this.router.register("GET", "/communications/stream", async (req, res, ctx) => {
      this.requireTenant(ctx);
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      this.communications.subscribe(ctx.tenantId, res);
      res.write(`data: ${JSON.stringify({ type: "stream.opened" })}\n\n`);
    });

    // Deals
    this.router.register("POST", "/deals", async (req, res, ctx) => {
      const body = await readJson(req);
      this.requireTenant(ctx);
      requireFields(body, ["clientId", "agentId", "value"]);
      const deal = this.deals.createDeal({ tenantId: ctx.tenantId, ...body });
      sendJson(res, 201, deal);
    });

    this.router.register("PATCH", "/deals/:dealId/stage", async (req, res, ctx) => {
      const body = await readJson(req);
      this.requireTenant(ctx);
      requireFields(body, ["stage"]);
      const deal = this.deals.updateStage({ tenantId: ctx.tenantId, dealId: req.params.dealId, stage: body.stage });
      sendJson(res, 200, deal);
    });

    this.router.register("POST", "/deals/:dealId/documents", async (req, res, ctx) => {
      const body = await readJson(req);
      this.requireTenant(ctx);
      requireFields(body, ["name", "category", "url"]);
      const doc = this.deals.attachDocument({ tenantId: ctx.tenantId, dealId: req.params.dealId, ...body });
      sendJson(res, 201, doc);
    });

    this.router.register("GET", "/finance/summary", async (req, res, ctx) => {
      this.requireTenant(ctx);
      const summary = this.deals.financeSummary(ctx.tenantId);
      sendJson(res, 200, summary);
    });

    // Integrations
    this.router.register("POST", "/integrations/credentials", async (req, res, ctx) => {
      const body = await readJson(req);
      this.requireTenant(ctx);
      requireFields(body, ["provider", "config"]);
      const credential = this.integrations.storeCredential({ tenantId: ctx.tenantId, provider: body.provider, config: body.config });
      sendJson(res, 201, credential);
    });

    this.router.register("GET", "/integrations/credentials/:provider", async (req, res, ctx) => {
      this.requireTenant(ctx);
      const credential = this.integrations.fetchCredential(ctx.tenantId, req.params.provider);
      sendJson(res, 200, credential);
    });

    this.router.register("POST", "/integrations/events", async (req, res, ctx) => {
      const body = await readJson(req);
      this.requireTenant(ctx);
      requireFields(body, ["provider", "type", "payload"]);
      const event = this.integrations.recordEvent({ tenantId: ctx.tenantId, ...body });
      sendJson(res, 201, event);
    });

    // Marketplace
    this.router.register("POST", "/marketplace/properties", async (req, res, ctx) => {
      const body = await readJson(req);
      this.requireTenant(ctx);
      requireFields(body, ["address", "city", "state", "zip", "price", "beds", "baths", "sqft", "type"]);
      const property = this.marketplace.upsertProperty({ tenantId: ctx.tenantId, property: body });
      sendJson(res, 201, property);
    });

    this.router.register("GET", "/marketplace/search", async (req, res, ctx) => {
      this.requireTenant(ctx);
      const { query } = parse(req.url, true);
      const filters = {
        city: query.city,
        type: query.type,
        minPrice: query.minPrice ? Number(query.minPrice) : undefined,
        maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
        beds: query.beds ? Number(query.beds) : undefined,
      };
      const results = this.marketplace.search({ tenantId: ctx.tenantId, filters });
      sendJson(res, 200, results);
    });

    this.router.register("POST", "/marketplace/preferences", async (req, res, ctx) => {
      const body = await readJson(req);
      this.requireTenant(ctx);
      requireFields(body, ["userId", "preference"]);
      const pref = this.marketplace.savePreference({ tenantId: ctx.tenantId, userId: body.userId, preference: body.preference });
      sendJson(res, 201, pref);
    });

    this.router.register("GET", "/marketplace/recommendations", async (req, res, ctx) => {
      this.requireTenant(ctx);
      const userId = req.query.userId;
      const recs = this.marketplace.recommendations({ tenantId: ctx.tenantId, userId });
      sendJson(res, 200, recs);
    });

    // AI
    this.router.register("POST", "/ai/trigger", async (req, res, ctx) => {
      const body = await readJson(req);
      this.requireTenant(ctx);
      requireFields(body, ["agent", "action", "context"]);
      const log = this.ai.triggerWorkflow({ tenantId: ctx.tenantId, agent: body.agent, action: body.action, context: body.context });
      sendJson(res, 201, log);
    });

    this.router.register("GET", "/ai/logs", async (req, res, ctx) => {
      this.requireTenant(ctx);
      const logs = this.store.aiLogs.filter((log) => log.tenantId === ctx.tenantId);
      sendJson(res, 200, logs);
    });

    this.router.register("GET", "/ai/insights", async (req, res, ctx) => {
      this.requireTenant(ctx);
      const insights = this.store.aiInsights.filter((insight) => insight.tenantId === ctx.tenantId);
      sendJson(res, 200, insights);
    });

    // Assistant
    this.router.register("POST", "/assistant/chat", async (req, res, ctx) => {
      const body = await readJson(req);
      this.requireTenant(ctx);
      requireFields(body, ["userId", "prompt"]);
      const response = this.assistant.chat({ tenantId: ctx.tenantId, userId: body.userId, prompt: body.prompt });
      sendJson(res, 200, response);
    });

    this.router.register("POST", "/assistant/voice", async (req, res, ctx) => {
      const body = await readJson(req);
      this.requireTenant(ctx);
      requireFields(body, ["channel", "content"]);
      const transcript = this.assistant.recordVoice({
        tenantId: ctx.tenantId,
        channel: body.channel,
        content: body.content,
        relatedEntity: body.relatedEntity,
      });
      sendJson(res, 201, transcript);
    });

    // Mobile
    this.router.register("GET", "/mobile/quick-actions", async (req, res, ctx) => {
      this.requireTenant(ctx);
      const actions = this.mobile.listQuickActions(ctx.tenantId);
      sendJson(res, 200, actions);
    });

    this.router.register("POST", "/mobile/quick-actions", async (req, res, ctx) => {
      const body = await readJson(req);
      this.requireTenant(ctx);
      requireFields(body, ["title", "description", "action"]);
      const action = this.mobile.addQuickAction({ tenantId: ctx.tenantId, ...body });
      sendJson(res, 201, action);
    });

    this.router.register("POST", "/mobile/push", async (req, res, ctx) => {
      const body = await readJson(req);
      this.requireTenant(ctx);
      requireFields(body, ["recipientId", "message"]);
      const notification = this.mobile.pushNotification({ tenantId: ctx.tenantId, ...body });
      sendJson(res, 201, notification);
    });

    // Security & audit
    this.router.register("GET", "/security/audit", async (req, res, ctx) => {
      this.requireTenant(ctx);
      const logs = this.security.listAuditLogs(ctx.tenantId);
      sendJson(res, 200, logs);
    });

    // Notifications
    this.router.register("GET", "/notifications", async (req, res, ctx) => {
      this.requireTenant(ctx);
      const notifications = this.store.notifications.filter((n) => n.tenantId === ctx.tenantId);
      sendJson(res, 200, notifications);
    });
  }
}
