import { randomUUID } from "crypto";
import { HttpError } from "../utils.js";

export class SecurityService {
  constructor(store) {
    this.store = store;
  }

  requireRole(user, roles) {
    if (!roles.some((role) => user.roles.includes(role))) {
      throw new HttpError(403, "Insufficient role");
    }
  }

  requirePermission(user, permission) {
    const roleEntries = user.roles
      .map((roleName) =>
        Array.from(this.store.roles.values()).find(
          (role) => role.tenantId === user.tenantId && role.name === roleName
        )
      )
      .filter(Boolean);
    const hasPermission = roleEntries.some((role) => role.permissions.includes(permission));
    if (!hasPermission) {
      throw new HttpError(403, "Missing permission");
    }
  }

  auditLog(tenantId, actorId, action, entity, entityId, details) {
    this.store.auditLogs.push({
      id: randomUUID(),
      tenantId,
      actorId,
      action,
      entity,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  listAuditLogs(tenantId) {
    return this.store.auditLogs.filter((log) => log.tenantId === tenantId);
  }
}
