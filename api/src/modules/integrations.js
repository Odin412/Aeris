import { createCipheriv, createDecipheriv } from "crypto";
import { HttpError, nowIso, uuid } from "../utils.js";

const ENCRYPTION_KEY = Buffer.alloc(32, 5);
const ENCRYPTION_IV = Buffer.alloc(16, 9);

export class IntegrationService {
  constructor(store) {
    this.store = store;
  }

  encrypt(text) {
    const cipher = createCipheriv("aes-256-cbc", ENCRYPTION_KEY, ENCRYPTION_IV);
    let encrypted = cipher.update(JSON.stringify(text), "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  }

  decrypt(payload) {
    const decipher = createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, ENCRYPTION_IV);
    let decrypted = decipher.update(payload, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
  }

  storeCredential({ tenantId, provider, config }) {
    const credential = {
      id: uuid(),
      tenantId,
      provider,
      encryptedConfig: this.encrypt(config),
      createdAt: nowIso(),
    };
    this.store.integrationCredentials.set(credential.id, credential);
    return credential;
  }

  recordEvent({ tenantId, provider, type, payload }) {
    const event = {
      id: uuid(),
      tenantId,
      provider,
      type,
      payload,
      timestamp: nowIso(),
    };
    this.store.integrationEvents.push(event);
    return event;
  }

  fetchCredential(tenantId, provider) {
    const credential = Array.from(this.store.integrationCredentials.values()).find(
      (item) => item.tenantId === tenantId && item.provider === provider
    );
    if (!credential) throw new HttpError(404, "Credential not found");
    return { ...credential, config: this.decrypt(credential.encryptedConfig) };
  }
}
