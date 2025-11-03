import test from 'node:test';
import assert from 'node:assert/strict';
import { AerisApplication } from '../src/app.js';

const createAgentProfile = (firstName, email) => ({
  firstName,
  lastName: 'Agent',
  email,
});

test('platform services satisfy phases 0-11', async () => {
  const app = new AerisApplication();
  const { health, tenants, auth, onboarding, crm, communications, deals, integrations, marketplace, ai, assistant, mobile, security } = app;
  const store = app.store;

  // Phase 0
  assert.deepEqual(health.getState(), { ok: true, db: true, ai: 'ready' });

  // Phase 1 – tenant + theming
  const tenant = tenants.createTenant({ name: 'Atlas Realty', domain: 'atlas.example.com' });
  tenants.updateTheme({ tenantId: tenant.id, theme: { accentColor: '#d4af37' } });

  const broker = auth.register({
    tenantId: tenant.id,
    roleName: 'BrokerAdmin',
    profile: createAgentProfile('Bianca', 'bianca@atlas.com'),
    password: 'secret',
  });
  const agent = auth.register({
    tenantId: tenant.id,
    roleName: 'Agent',
    profile: createAgentProfile('Alex', 'alex@atlas.com'),
    password: 'secret',
  });
  assert.equal(agent.status, 'pending');

  // Phase 2 – onboarding + CRM
  const steps = onboarding.getSteps(tenant.id);
  onboarding.uploadDocument({ userId: agent.id, document: { name: 'W-9.pdf', url: 'https://example.com/w9.pdf' } });
  onboarding.verifyLicense({ userId: agent.id, brokerId: broker.id });
  steps.forEach((step) => onboarding.completeStep({ userId: agent.id, stepId: step.id }));
  const activeAgent = store.users.get(agent.id);
  assert.equal(activeAgent.status, 'active');

  const lead = crm.createLead({ tenantId: tenant.id, agentId: agent.id, name: 'Jamie Client', email: 'jamie@example.com', phone: '555-1000' });
  crm.updateLeadStage({ tenantId: tenant.id, leadId: lead.id, stage: 'Qualified', userId: agent.id });
  assert.equal(store.clients.get(lead.id).stage, 'Qualified');

  // Phase 3 – communications hub
  const feedPost = communications.createPost({ tenantId: tenant.id, channel: 'announcements', authorId: broker.id, message: 'Welcome Alex!' });
  communications.likePost({ tenantId: tenant.id, postId: feedPost.id, userId: agent.id });
  communications.commentOnPost({ tenantId: tenant.id, postId: feedPost.id, authorId: agent.id, message: 'Excited to join!' });
  assert.equal(store.feedPosts.get(feedPost.id).comments.length, 1);

  // Phase 4 – deals, docs, finance
  const deal = deals.createDeal({ tenantId: tenant.id, clientId: lead.id, agentId: agent.id, value: 500000 });
  deals.updateStage({ tenantId: tenant.id, dealId: deal.id, stage: 'Escrow' });
  deals.attachDocument({ tenantId: tenant.id, dealId: deal.id, name: 'Purchase Agreement', category: 'legal', url: 'https://docs.example.com/pa.pdf' });
  const finance = deals.financeSummary(tenant.id);
  assert.equal(finance.totalDeals, 1);

  // Phase 5 – integrations
  const credential = integrations.storeCredential({ tenantId: tenant.id, provider: 'DocuSign', config: { token: 'abc123' } });
  const fetchedCredential = integrations.fetchCredential(tenant.id, 'DocuSign');
  assert.equal(fetchedCredential.provider, 'DocuSign');
  assert.deepEqual(fetchedCredential.config, { token: 'abc123' });
  integrations.recordEvent({ tenantId: tenant.id, provider: 'n8n', type: 'webhook', payload: { id: 'evt_1' } });
  assert.equal(store.integrationEvents.length, 1);

  // Phase 6 – marketplace
  marketplace.upsertProperty({
    tenantId: tenant.id,
    property: {
      address: '123 Market St',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      price: 750000,
      beds: 3,
      baths: 2,
      sqft: 2100,
      type: 'buy',
      media: [],
      description: 'Downtown modern loft',
    },
  });
  const searchResults = marketplace.search({ tenantId: tenant.id, filters: { city: 'Austin', type: 'buy' } });
  assert.equal(searchResults.length, 1);
  marketplace.savePreference({ tenantId: tenant.id, userId: lead.id, preference: { role: 'Buyer', filters: { city: 'Austin' } } });
  const recs = marketplace.recommendations({ tenantId: tenant.id, userId: lead.id });
  assert.equal(recs.properties.length, 1);

  // Phase 7 – TitanAI automations
  ai.triggerWorkflow({ tenantId: tenant.id, agent: 'Broker Insights Agent', action: 'schedule_followup', context: { title: 'Review pipeline', assigneeId: agent.id } });
  const aiLogs = store.aiLogs.filter((log) => log.tenantId === tenant.id);
  assert.ok(aiLogs.length > 0);

  // Phase 8 – chat + voice
  const chatResponse = assistant.chat({ tenantId: tenant.id, userId: broker.id, prompt: 'Deal status for Jamie Client' });
  assert.ok(chatResponse.response.includes('Jamie'));
  assistant.recordVoice({ tenantId: tenant.id, channel: 'call', content: 'Left voicemail for Jamie', relatedEntity: { type: 'lead', id: lead.id, assigneeId: agent.id } });
  assert.ok(store.voiceLogs.length > 0);

  // Phase 9 – mobile quick actions
  const quickActions = mobile.listQuickActions(tenant.id);
  assert.ok(quickActions.length >= 2);
  mobile.pushNotification({ tenantId: tenant.id, recipientId: agent.id, message: 'Escrow opened' });
  assert.ok(store.notifications.length > 0);

  // Phase 10 – branding
  tenants.addBrandingAsset({ tenantId: tenant.id, type: 'logo', url: 'https://cdn.example.com/logo.png' });
  assert.equal(store.brandingAssets.length, 1);

  // Phase 11 – security & audit
  const auditLogs = security.listAuditLogs(tenant.id);
  assert.ok(auditLogs.length > 0);
  const notifications = store.notifications.filter((n) => n.tenantId === tenant.id);
  assert.ok(notifications.length > 0);

  await new Promise((resolve) => app.server.close(resolve));
});
