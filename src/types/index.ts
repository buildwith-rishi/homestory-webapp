export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  ENGINEER = "engineer",
  CUSTOMER = "customer",
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

export enum ProjectStage {
  PRE_CONSTRUCTION = "pre_construction",
  EXECUTION = "execution",
  FINISHING = "finishing",
  FINAL_FIXES = "final_fixes",
  COMPLETE = "complete",
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  completed: boolean;
  assignedTo?: string;
  createdAt: string;
  completedAt?: string;
}

// Project API Enums
export enum PipelineType {
  DESIGN_ONLY = "DESIGN_ONLY",
  DESIGN_AND_EXECUTION = "DESIGN_AND_EXECUTION",
}

export enum ProjectCategory {
  RESIDENTIAL = "RESIDENTIAL",
  COMMERCIAL = "COMMERCIAL",
  HOSPITALITY = "HOSPITALITY",
}

export enum ScopeType {
  FULL_HOME = "FULL_HOME",
  INTERIORS = "INTERIORS",
  MODULAR = "MODULAR",
  CIVIL = "CIVIL",
  TURNKEY = "TURNKEY",
}

export enum BudgetTier {
  BUDGET = "BUDGET",
  MID_RANGE = "MID_RANGE",
  PREMIUM = "PREMIUM",
  LUXURY = "LUXURY",
}

export enum PropertySubtype {
  APARTMENT = "APARTMENT",
  VILLA = "VILLA",
  INDEPENDENT_HOUSE = "INDEPENDENT_HOUSE",
  PENTHOUSE = "PENTHOUSE",
  ROW_HOUSE = "ROW_HOUSE",
  STUDIO = "STUDIO",
}

// Main Project Interface (from API)
export interface Project {
  id: string;
  name: string;
  projectName?: string; // API uses projectName
  leadId: string;
  pipelineType: PipelineType;
  projectCategory: ProjectCategory;
  scopeType: ScopeType;
  budgetTier: BudgetTier;
  propertySubtype: PropertySubtype;
  propertySizeSqft: number;
  propertyBHK: string;
  propertyAddress: string;
  propertyCity: string;
  totalValue: number;
  assignedDesignerId?: string;
  assignedPMId?: string;
  moodBoardShared?: boolean;
  currentStage?: ProjectStageCode;

  // Related data
  lead?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  assignedDesigner?: {
    id: string;
    name: string;
    email: string;
  };
  assignedPM?: {
    id: string;
    name: string;
    email: string;
  };

  status: "active" | "on_hold" | "completed";
  createdAt: string;
  updatedAt: string;

  // Legacy fields for backwards compatibility
  location?: string;
  customerId?: string;
  stage?: ProjectStage;
  progress?: number;
  startDate?: string;
  estimatedEndDate?: string;
  actualEndDate?: string;
  siteEngineerId?: string;
  budget?: number;
}

// Create Project Request Interface
export interface CreateProjectRequest {
  leadId: string;
  projectName: string;
  pipelineType: PipelineType;
  projectCategory: ProjectCategory;
  scopeType: ScopeType;
  budgetTier: BudgetTier;
  propertySubtype: PropertySubtype;
  propertySizeSqft: number;
  propertyBHK: string;
  propertyAddress: string;
  propertyCity: string;
  totalValue: number;
}

// Update Project Request Interface
export interface UpdateProjectRequest {
  assignedDesignerId?: string;
  assignedPMId?: string;
  moodBoardShared?: boolean;
  projectName?: string;
  propertyAddress?: string;
  propertyCity?: string;
  totalValue?: number;
}

// Update Stage Request Interface
export interface UpdateStageRequest {
  status: string;
  endDate?: string;
  remarks?: string;
}

// Update Payment Request Interface
export interface UpdatePaymentRequest {
  status: string;
  actualAmount?: number;
  invoiceNumber?: string;
}

// Project Filters Interface
export interface ProjectFilters {
  status?: string;
  pipelineType?: string;
  projectCategory?: string;
  assignedDesignerId?: string;
  assignedPMId?: string;
}

export enum LeadStage {
  INQUIRY = "inquiry",
  CONTACTED = "contacted",
  MEETING_SCHEDULED = "meeting_scheduled",
  PROPOSAL_SENT = "proposal_sent",
  NEGOTIATION = "negotiation",
  WON = "won",
  LOST = "lost",
}

export enum LeadSource {
  WEBSITE = "website",
  INSTAGRAM = "instagram",
  REFERRAL = "referral",
  WALK_IN = "walk_in",
  OTHER = "other",
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: "call" | "email" | "meeting" | "note" | "stage_change";
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  stage: LeadStage;

  // Project Requirements
  projectType?: string;
  propertyType?:
    | "Apartment"
    | "Villa"
    | "Independent House"
    | "Penthouse"
    | "Commercial"
    | "Office"
    | "Restaurant"
    | "Showroom";
  bhkConfig?: "1 BHK" | "2 BHK" | "3 BHK" | "4 BHK" | "5+ BHK" | "Studio";
  carpetArea?: number; // in sq.ft
  location?: string;
  city?: string;
  locality?: string;

  // Budget & Timeline
  budget?: number;
  budgetRange?: "Below 10L" | "10-20L" | "20-50L" | "50L-1Cr" | "1Cr+";
  timeline?: string;
  expectedStartDate?: string;
  moveinDate?: string;

  // Design Preferences
  designStyle?:
    | "Modern"
    | "Contemporary"
    | "Traditional"
    | "Scandinavian"
    | "Industrial"
    | "Minimalist"
    | "Luxury"
    | "Eclectic";
  colorPreferences?: string[];
  inspirationImages?: string[];

  // Scope of Work
  scopeOfWork?: (
    | "Modular Kitchen"
    | "Wardrobes"
    | "Living Room"
    | "Master Bedroom"
    | "Kids Room"
    | "Bathroom"
    | "Pooja Room"
    | "Full Home"
    | "Furniture"
    | "False Ceiling"
    | "Lighting"
    | "Flooring"
    | "Painting"
  )[];
  servicesInterested?: (
    | "Design Only"
    | "Design + Execution"
    | "Turnkey"
    | "Consultation"
  )[];

  // Lead Quality & Status
  score?: number; // Lead score 0-100
  priority?: "Hot" | "Warm" | "Cold";
  qualification?: "Qualified" | "Unqualified" | "In Review";
  competitorInfo?: string;

  // Follow-up & Communication
  notes?: string;
  followUpDate?: string;
  lastContactedAt?: string;
  meetingScheduled?: boolean;
  siteVisitDone?: boolean;
  quotationSent?: boolean;

  // Assignment & Activities
  assignedTo?: string;
  assignedDesigner?: string;
  activities?: LeadActivity[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  convertedToProject?: boolean;
  conversionDate?: string;
  lostReason?: string;
}

export interface TranscriptionSegment {
  speaker: string;
  text: string;
  timestamp: number;
}

export interface AIAnalysis {
  summary: string;
  actionItems: string[];
  keyPoints: string[];
  sentiment: "positive" | "neutral" | "negative";
  concerns: string[];
  decisions: string[];
}

export interface Meeting {
  id: string;
  title: string;
  leadId?: string;
  projectId?: string;
  customerId?: string;
  scheduledDate: string;
  duration?: number;
  location?: string;
  attendees: string[];
  recordingUrl?: string;
  transcription?: TranscriptionSegment[];
  aiAnalysis?: AIAnalysis;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  projects?: Project[];
  createdAt: string;
}

export interface Communication {
  id: string;
  customerId: string;
  projectId?: string;
  type: "update" | "photo" | "video" | "issue" | "milestone";
  title: string;
  content: string;
  media?: string[];
  sentAt: string;
  readAt?: string;
}

export enum IssueCategory {
  MATERIAL = "material",
  QUALITY = "quality",
  SAFETY = "safety",
  DELAY = "delay",
  OTHER = "other",
}

export enum IssueSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum IssueStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
}

export interface Issue {
  id: string;
  projectId: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  title: string;
  description: string;
  location?: string;
  photos: string[];
  reportedBy: string;
  assignedTo?: string;
  reportedAt: string;
  resolvedAt?: string;
}

export interface PhotoRequirement {
  id: string;
  label: string;
  required: boolean;
  description?: string;
}

export interface UploadedPhoto {
  id: string;
  projectId: string;
  stage: ProjectStage;
  requirementId: string;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
  aiQualityCheck?: {
    passed: boolean;
    issues?: string[];
    score: number;
  };
}

export enum InstagramPostType {
  SINGLE = "single",
  CAROUSEL = "carousel",
  REEL = "reel",
  STORY = "story",
}

export enum InstagramPostStatus {
  DRAFT = "draft",
  SCHEDULED = "scheduled",
  PUBLISHED = "published",
  FAILED = "failed",
}

export interface InstagramPost {
  id: string;
  type: InstagramPostType;
  caption: string;
  hashtags: string[];
  location?: string;
  media: {
    url: string;
    type: "image" | "video";
    altText?: string;
  }[];
  scheduledDate?: string;
  publishedDate?: string;
  status: InstagramPostStatus;
  metrics?: {
    likes: number;
    comments: number;
    reach: number;
    engagement: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsData {
  followers: {
    total: number;
    change: number;
    changePercent: number;
  };
  engagement: {
    rate: number;
    change: number;
  };
  reach: {
    total: number;
    change: number;
  };
  profileVisits: {
    total: number;
    change: number;
  };
  topPosts: InstagramPost[];
  audienceDemographics: {
    ageRanges: { range: string; percentage: number }[];
    gender: { male: number; female: number; other: number };
    topLocations: { city: string; percentage: number }[];
  };
  activeHours: number[][];
}

export interface DirectMessage {
  id: string;
  username: string;
  userAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: boolean;
  messages: {
    id: string;
    from: "user" | "brand";
    text: string;
    timestamp: string;
  }[];
}

export interface Comment {
  id: string;
  postId: string;
  username: string;
  userAvatar?: string;
  text: string;
  timestamp: string;
  replied: boolean;
}

export interface NotificationType {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface LeadFilters {
  stage?: LeadStage;
  source?: LeadSource;
  assignedTo?: string;
  search?: string;
}

export interface PipelineStats {
  inquiry: number;
  contacted: number;
  meetingScheduled: number;
  proposalSent: number;
  negotiation: number;
  won: number;
  lost: number;
  conversionRate: number;
}

// Widget System Types
export type WidgetCategory =
  | "featured"
  | "sales"
  | "leads"
  | "team"
  | "actions";

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  category: WidgetCategory;
  icon: string; // Lucide icon name
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  maxSize?: { w: number; h: number };
}

export interface DashboardWidget {
  instanceId: string;
  widgetId: string;
  position: { x: number; y: number };
  size: { w: number; h: number };
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
  lastModified: string;
}

// Admin - User Management Types
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role:
    | "ADMIN"
    | "FOUNDER_ARCHITECT"
    | "PROJECT_MANAGER"
    | "DESIGNER"
    | "SITE_ENGINEER"
    | "SALES_EXECUTIVE"
    | "CUSTOMER";
  phone?: string;
  avatar?: string;
  isBanned: boolean;
  banReason?: string;
  bannedAt?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role:
    | "ADMIN"
    | "FOUNDER_ARCHITECT"
    | "PROJECT_MANAGER"
    | "DESIGNER"
    | "SITE_ENGINEER"
    | "SALES_EXECUTIVE"
    | "CUSTOMER";
  phone?: string;
}

export interface BanUserRequest {
  reason: string;
}

// Project-related enums and types
export enum ProjectStageCode {
  LEAD = "LEAD",
  SITE_VISIT = "SITE_VISIT",
  PROPOSAL = "PROPOSAL",
  DESIGN = "DESIGN",
  EXECUTION = "EXECUTION",
  HANDOVER = "HANDOVER",
  WARRANTY = "WARRANTY",
}

export enum StageStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ON_HOLD = "ON_HOLD",
  SKIPPED = "SKIPPED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  COLLECTED = "COLLECTED",
  INVOICED = "INVOICED",
  OVERDUE = "OVERDUE",
  PARTIAL = "PARTIAL",
}

export enum ProjectTaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  DONE = "DONE",
  BLOCKED = "BLOCKED",
}

export interface ProjectStageData {
  id: string;
  projectId: string;
  stageCode: ProjectStageCode;
  stageName: string;
  status: StageStatus;
  startDate?: string;
  endDate?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPayment {
  id: string;
  projectId: string;
  milestoneName: string;
  milestone?: string; // Alias for milestoneName
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  paidDate?: string;
  collectedDate?: string; // Add this field
  actualAmount?: number;
  invoiceNumber?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: ProjectTaskStatus;
  dueDate?: string;
  assignedTo?: string | { name: string }; // Update to support both string and object
  createdAt: string;
  updatedAt: string;
}
