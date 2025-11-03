import { CoreRole } from "../constants/roles";

export type UUID = string;

export interface TenantTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  marketingUrl?: string;
}

export interface TenantSetting {
  key: string;
  value: string | number | boolean | Record<string, unknown>;
}

export interface Tenant {
  id: UUID;
  name: string;
  domain: string;
  theme: TenantTheme;
  settings: TenantSetting[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: UUID;
  tenantId: UUID;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Role {
  id: UUID;
  tenantId: UUID;
  name: CoreRole | string;
  permissions: Permission["id"][];
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  licenseNumber?: string;
  timezone?: string;
}

export type UserStatus = "pending" | "active" | "suspended" | "invited";

export interface User {
  id: UUID;
  tenantId: UUID;
  roleId: UUID;
  roles: Role["name"][];
  profile: UserProfile;
  status: UserStatus;
  hashedPassword: string;
  createdAt: string;
  updatedAt: string;
  onboardingCompleted: boolean;
}

export interface OnboardingStep {
  id: UUID;
  tenantId: UUID;
  label: string;
  description?: string;
  order: number;
  required: boolean;
}

export interface AgentOnboardingState {
  userId: UUID;
  tenantId: UUID;
  completedStepIds: UUID[];
  documents: Document[];
  licenseVerified: boolean;
  approvedByBrokerId?: UUID;
  completedAt?: string;
}

export type LeadStage = "Lead" | "Qualified" | "Active" | "Closed" | "Follow-up";

export interface LeadSource {
  type: "LandingPage" | "MLS" | "API" | "Manual";
  reference?: string;
}

export interface ActivityLogEntry {
  id: UUID;
  tenantId: UUID;
  entity: string;
  entityId: UUID;
  message: string;
  createdAt: string;
  createdBy: UUID;
}

export interface Task {
  id: UUID;
  tenantId: UUID;
  title: string;
  description?: string;
  dueDate?: string;
  status: "pending" | "completed" | "cancelled";
  assigneeId?: UUID;
  relatedEntity?: { type: string; id: UUID };
  createdAt: string;
  createdBy: UUID;
}

export interface ContactRecord {
  id: UUID;
  tenantId: UUID;
  userId: UUID;
  method: "call" | "email" | "text" | "meeting";
  notes: string;
  timestamp: string;
}

export interface Client {
  id: UUID;
  tenantId: UUID;
  primaryAgentId: UUID;
  name: string;
  email: string;
  phone?: string;
  stage: LeadStage;
  source: LeadSource;
  tags: string[];
  activity: ActivityLogEntry[];
  tasks: Task[];
  contacts: ContactRecord[];
  preferences?: Record<string, unknown>;
}

export interface Lead extends Client {
  pipelineId: UUID;
}

export interface FeedPost {
  id: UUID;
  tenantId: UUID;
  channel: "announcements" | "deals" | "collaboration";
  authorId: UUID;
  message: string;
  createdAt: string;
  likes: UUID[];
  comments: FeedComment[];
}

export interface FeedComment {
  id: UUID;
  tenantId: UUID;
  postId: UUID;
  authorId: UUID;
  message: string;
  createdAt: string;
}

export interface DirectMessage {
  id: UUID;
  tenantId: UUID;
  participants: UUID[];
  messages: Message[];
}

export interface Message {
  id: UUID;
  senderId: UUID;
  body: string;
  timestamp: string;
}

export type DealStage = "Offer" | "Escrow" | "Inspection" | "Closing";

export interface DealDocument {
  id: UUID;
  tenantId: UUID;
  dealId: UUID;
  name: string;
  category: string;
  url: string;
  version: number;
  uploadedAt: string;
}

export interface CommissionBreakdown {
  tenantSplit: number;
  agentSplit: number;
  otherFees: number;
}

export interface Deal {
  id: UUID;
  tenantId: UUID;
  clientId: UUID;
  agentId: UUID;
  stage: DealStage;
  value: number;
  tasks: Task[];
  documents: DealDocument[];
  commission: CommissionBreakdown;
  updatedAt: string;
  createdAt: string;
}

export interface IntegrationCredential {
  id: UUID;
  tenantId: UUID;
  provider: "RealEstateAPI" | "MLS" | "Salesforce" | "HubSpot" | "FollowUpBoss" | "DocuSign" | "n8n";
  encryptedConfig: string;
  createdAt: string;
}

export interface IntegrationEvent {
  id: UUID;
  tenantId: UUID;
  provider: IntegrationCredential["provider"];
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface Property {
  id: UUID;
  tenantId: UUID;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  type: "buy" | "sell" | "rent" | "invest";
  media: string[];
  description: string;
  ownerId?: UUID;
  metadata?: Record<string, unknown>;
}

export interface MarketplacePreference {
  role: "Buyer" | "Seller" | "Renter" | "Investor" | "Browser";
  filters: Record<string, unknown>;
}

export interface AIInsight {
  id: UUID;
  tenantId: UUID;
  type: string;
  message: string;
  relatedEntity?: { type: string; id: UUID };
  createdAt: string;
}

export interface AIWorkflowLog {
  id: UUID;
  tenantId: UUID;
  agent: string;
  action: string;
  context: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLog {
  id: UUID;
  tenantId: UUID;
  actorId: UUID;
  action: string;
  entity: string;
  entityId?: UUID;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface Notification {
  id: UUID;
  tenantId: UUID;
  recipientId: UUID;
  message: string;
  type: string;
  createdAt: string;
  read: boolean;
}

export interface VoiceTranscript {
  id: UUID;
  tenantId: UUID;
  channel: "call" | "text" | "email";
  content: string;
  relatedEntity?: { type: string; id: UUID };
  createdAt: string;
}

export interface MobileQuickAction {
  id: UUID;
  tenantId: UUID;
  title: string;
  description: string;
  action: string;
}

export interface ApiHealthState {
  ok: boolean;
  db: boolean;
  ai: "ready" | "offline";
  message?: string;
}

export interface MarketplaceRecommendation {
  userId: UUID;
  properties: Property[];
  generatedAt: string;
}

export interface VoiceCommandResult {
  id: UUID;
  tenantId: UUID;
  command: string;
  executed: boolean;
  response: string;
}

export interface BrandingAsset {
  id: UUID;
  tenantId: UUID;
  type: "logo" | "favicon" | "splash" | "marketing";
  url: string;
  createdAt: string;
}
