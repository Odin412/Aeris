import { nowIso, uuid } from "../utils.js";

export class MobileService {
  constructor(store) {
    this.store = store;
  }

  listQuickActions(tenantId) {
    return this.store.quickActions.filter((action) => action.tenantId === tenantId);
  }

  addQuickAction({ tenantId, title, description, action }) {
    const quickAction = {
      id: uuid(),
      tenantId,
      title,
      description,
      action,
    };
    this.store.quickActions.push(quickAction);
    return quickAction;
  }

  pushNotification({ tenantId, recipientId, message }) {
    const notification = {
      id: uuid(),
      tenantId,
      recipientId,
      message,
      type: "mobile_push",
      createdAt: nowIso(),
      read: false,
    };
    this.store.notifications.push(notification);
    return notification;
  }
}
