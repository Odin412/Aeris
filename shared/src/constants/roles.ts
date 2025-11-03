export const CORE_ROLES = [
  "BrokerAdmin",
  "Agent",
  "Client",
  "Investor",
  "Tenant"
] as const;

export type CoreRole = typeof CORE_ROLES[number];
