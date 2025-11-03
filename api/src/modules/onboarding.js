import { HttpError, nowIso, uuid } from "../utils.js";

export class OnboardingService {
  constructor(store) {
    this.store = store;
  }

  getSteps(tenantId) {
    return this.store.onboardingSteps.get(tenantId) || [];
  }

  configureSteps(tenantId, steps) {
    this.store.onboardingSteps.set(
      tenantId,
      steps.map((step, index) => ({
        id: step.id || uuid(),
        tenantId,
        label: step.label,
        description: step.description,
        order: step.order ?? index + 1,
        required: step.required !== false,
      }))
    );
    return this.getSteps(tenantId);
  }

  initAgentState(userId) {
    const user = this.store.users.get(userId);
    if (!user) throw new HttpError(404, "User not found");
    const state = {
      userId,
      tenantId: user.tenantId,
      completedStepIds: [],
      documents: [],
      licenseVerified: false,
      approvedByBrokerId: undefined,
    };
    this.store.onboardingStates.set(userId, state);
    return state;
  }

  uploadDocument({ userId, document }) {
    const state = this.store.onboardingStates.get(userId) || this.initAgentState(userId);
    const doc = {
      id: uuid(),
      tenantId: state.tenantId,
      dealId: document.dealId || null,
      name: document.name,
      category: document.category || "general",
      url: document.url,
      version: 1,
      uploadedAt: nowIso(),
    };
    state.documents.push(doc);
    return doc;
  }

  completeStep({ userId, stepId }) {
    const state = this.store.onboardingStates.get(userId) || this.initAgentState(userId);
    if (!state.completedStepIds.includes(stepId)) {
      state.completedStepIds.push(stepId);
    }
    const user = this.store.users.get(userId);
    const steps = this.getSteps(user.tenantId);
    const requiredIds = steps.filter((s) => s.required).map((s) => s.id);
    const allCompleted = requiredIds.every((id) => state.completedStepIds.includes(id)) && state.licenseVerified;
    if (allCompleted) {
      state.completedAt = nowIso();
      user.onboardingCompleted = true;
      user.status = "active";
    }
    return state;
  }

  verifyLicense({ userId, brokerId }) {
    const state = this.store.onboardingStates.get(userId) || this.initAgentState(userId);
    state.licenseVerified = true;
    state.approvedByBrokerId = brokerId;
    return state;
  }
}
