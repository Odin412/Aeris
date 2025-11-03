import { createHash, randomBytes } from "crypto";
import { nowIso, uuid, HttpError } from "../utils.js";

export class AuthService {
  constructor(store) {
    this.store = store;
  }

  hashPassword(password, salt) {
    return createHash("sha256").update(`${salt}:${password}`).digest("hex");
  }

  register({ tenantId, roleName, profile, password }) {
    const tenant = this.store.tenants.get(tenantId);
    if (!tenant) {
      throw new HttpError(404, "Tenant not found");
    }
    const role = Array.from(this.store.roles.values()).find(
      (r) => r.tenantId === tenantId && r.name === roleName
    );
    if (!role) {
      throw new HttpError(400, `Role ${roleName} unavailable for tenant`);
    }
    const id = uuid();
    const salt = randomBytes(8).toString("hex");
    const hashedPassword = this.hashPassword(password, salt);
    const user = {
      id,
      tenantId,
      roleId: role.id,
      roles: [role.name],
      profile,
      status: role.name === "Client" ? "active" : "pending",
      hashedPassword: `${salt}:${hashedPassword}`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      onboardingCompleted: role.name !== "Agent",
    };
    this.store.users.set(id, user);
    this.store.auditLogs.push({
      id: uuid(),
      tenantId,
      actorId: id,
      action: "user.registered",
      entity: "user",
      entityId: id,
      details: { role: role.name },
      timestamp: nowIso(),
    });
    return user;
  }

  login({ tenantId, email, password }) {
    const user = Array.from(this.store.users.values()).find(
      (u) => u.tenantId === tenantId && u.profile.email === email
    );
    if (!user) {
      throw new HttpError(401, "Invalid credentials");
    }
    const [salt, hashValue] = user.hashedPassword.split(":");
    const hashed = this.hashPassword(password, salt);
    if (hashed !== hashValue) {
      throw new HttpError(401, "Invalid credentials");
    }
    const token = randomBytes(16).toString("hex");
    this.store.sessions.set(token, { userId: user.id, tenantId, createdAt: nowIso() });
    this.store.auditLogs.push({
      id: uuid(),
      tenantId,
      actorId: user.id,
      action: "user.login",
      entity: "session",
      entityId: token,
      timestamp: nowIso(),
    });
    return { token, user };
  }

  authenticate(token) {
    if (!token) return null;
    const session = this.store.sessions.get(token);
    if (!session) return null;
    const user = this.store.users.get(session.userId);
    if (!user) return null;
    return { session, user };
  }
}
