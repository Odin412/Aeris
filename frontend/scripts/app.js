const apiBase = window.localStorage.getItem('aeris-api-base') || 'http://localhost:4000';
const headers = () => ({ 'Content-Type': 'application/json', 'x-tenant-id': state.tenantId ?? '' });

const state = {
  tenantId: null,
  agentId: null,
  leadId: null,
};

const healthButton = document.getElementById('health-check');
const healthResult = document.getElementById('health-result');
const tenantForm = document.getElementById('tenant-form');
const tenantResult = document.getElementById('tenant-result');
const leadForm = document.getElementById('lead-form');
const leadResult = document.getElementById('lead-result');
const searchForm = document.getElementById('search-form');
const searchResult = document.getElementById('search-result');
const assistantForm = document.getElementById('assistant-form');
const assistantLog = document.getElementById('assistant-log');

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || response.statusText);
  }
  return body;
}

healthButton.addEventListener('click', async () => {
  healthResult.textContent = 'Checking…';
  try {
    const body = await request('/health');
    healthResult.textContent = JSON.stringify(body, null, 2);
  } catch (error) {
    healthResult.textContent = error.message;
  }
});

tenantForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(tenantForm);
  tenantResult.textContent = 'Creating tenant…';
  try {
    const tenant = await request('/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        domain: form.get('domain'),
      }),
    });
    state.tenantId = tenant.id;
    tenantResult.textContent = `Tenant ready (${tenant.id}). Next: register agent via API.`;
    await request(`/tenants/${tenant.id}/theme`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accentColor: '#d4af37' }),
    });
    const agent = await request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: tenant.id,
        role: 'Agent',
        profile: { firstName: 'Atlas', lastName: 'Agent', email: 'agent@atlas.com' },
        password: 'secret',
      }),
    });
    state.agentId = agent.id;
    tenantResult.textContent += `\nAgent seeded (${agent.profile.email}).`;
  } catch (error) {
    tenantResult.textContent = error.message;
  }
});

leadForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.tenantId || !state.agentId) {
    leadResult.textContent = 'Create a tenant first.';
    return;
  }
  const form = new FormData(leadForm);
  leadResult.textContent = 'Submitting lead…';
  try {
    const lead = await request('/crm/leads', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        agentId: state.agentId,
        name: form.get('name'),
        email: form.get('email'),
        phone: form.get('phone'),
      }),
    });
    state.leadId = lead.id;
    leadResult.textContent = `Lead stored with ID ${lead.id}. TitanAI assigned ${lead.primaryAgentId}.`;
  } catch (error) {
    leadResult.textContent = error.message;
  }
});

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.tenantId) {
    searchResult.textContent = 'Create a tenant first.';
    return;
  }
  const form = new FormData(searchForm);
  searchResult.textContent = 'Searching…';
  try {
    const property = await request('/marketplace/properties', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        address: '123 Market St',
        city: form.get('city'),
        state: 'TX',
        zip: '78701',
        price: 750000,
        beds: 3,
        baths: 2,
        sqft: 2100,
        type: form.get('type'),
        media: [],
      }),
    });
    await request(`/marketplace/preferences`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ userId: state.leadId || property.id, preference: { role: 'Buyer', filters: { city: form.get('city') } } }),
    });
    const results = await request(`/marketplace/search?city=${encodeURIComponent(form.get('city'))}&type=${encodeURIComponent(form.get('type'))}`, {
      headers: headers(),
    });
    searchResult.textContent = JSON.stringify(results, null, 2);
  } catch (error) {
    searchResult.textContent = error.message;
  }
});

assistantForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.tenantId) {
    assistantLog.textContent = 'Create a tenant first.';
    return;
  }
  const form = new FormData(assistantForm);
  const prompt = form.get('prompt');
  assistantLog.textContent = 'Thinking…';
  try {
    const response = await request('/assistant/chat', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ userId: state.agentId, prompt }),
    });
    assistantLog.textContent = response.response || JSON.stringify(response, null, 2);
  } catch (error) {
    assistantLog.textContent = error.message;
  }
});
