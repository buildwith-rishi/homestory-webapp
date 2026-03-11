export enum UserRole {
  // New RBAC roles (match backend /api/roles)
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  BDR = "BDR",
  SALES = "SALES",
  HR = "HR",
  PROJECT_MANAGER = "PROJECT_MANAGER",
  LEAD_PROJECT_MANAGER = "LEAD_PROJECT_MANAGER",
  ACCOUNTS = "ACCOUNTS",
  SITE_ENGINEER = "SITE_ENGINEER",
  DESIGNER = "DESIGNER",
  DESIGN_HEAD = "DESIGN_HEAD",
  // Legacy aliases (kept for backward compatibility)
  MANAGER = "PROJECT_MANAGER",
  ENGINEER = "SITE_ENGINEER",
  CUSTOMER = "BDR",
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** Raw role string from the API (e.g. "ADMIN", "BDR") */
  apiRole?: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  permissions?: string[];
}

export enum ProjectStage {
  PRE_CONSTRUCTION = "pre_construction",
  EXECUTION = "execution",
  FINISHING = "finishing",
  FINAL_FIXES = "final_fixes",
  COMPLETE = "complete",
}

// Task API Enums
export enum TaskType {
  CALL = "CALL",
  MEETING = "MEETING",
  PRESENTATION = "PRESENTATION",
  SURVEY = "SURVEY",
  INTERVIEW = "INTERVIEW",
  SITE_VISIT = "SITE_VISIT",
  FOLLOW_UP = "FOLLOW_UP",
  DOCUMENT_UPLOAD = "DOCUMENT_UPLOAD",
  APPROVAL_PENDING = "APPROVAL_PENDING",
  DESIGN_REVIEW = "DESIGN_REVIEW",
  PAYMENT_COLLECTION = "PAYMENT_COLLECTION",
  HANDOVER = "HANDOVER",
  OTHER = "OTHER",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  BLOCKED = "BLOCKED",
  CANCELLED = "CANCELLED",
}

// Task Category Interface (from /api/tasks/categories)
export interface TaskCategory {
  id: string;
  name: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
}

// Task Interface (matches API response)
export interface Task {
  id: string;
  projectId: string;
  title: string;
  taskType: string;
  dueDate: string;
  priority: string;
  status: string;
  assignedToId?: string;
  assigneeIds?: string[];
  assignees?: { id: string; name: string; email?: string }[];
  categoryId?: string;
  category?: { id: string; name: string; color: string } | null;
  notes?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  // Legacy fields for backwards compatibility
  description?: string;
  dueTime?: string;
  assignedTo?: string;
  completedAt?: string;
}

// Task API Request Types
export interface CreateTaskRequest {
  title: string;
  taskType: string;
  projectId: string;
  dueDate: string;
  priority: string;
  status: string;
  assignedToId?: string;
  assigneeIds?: string[];
  categoryId?: string;
  notes?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  taskType?: string;
  dueDate?: string;
  priority?: string;
  status?: string;
  assignedToId?: string;
  assigneeIds?: string[];
  categoryId?: string;
  notes?: string;
  completed?: boolean;
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
  HEALTHCARE = "HEALTHCARE",
}

export enum ScopeType {
  FULL_HOME = "FULL_HOME",
  INTERIORS = "INTERIORS",
  MODULAR = "MODULAR",
  CIVIL = "CIVIL",
  TURNKEY = "TURNKEY",
  ARCHITECTURE = "ARCHITECTURE",
  ARCHITECTURE_AND_INTERIORS = "ARCHITECTURE_AND_INTERIORS",
  DRAWINGS_ONLY = "DRAWINGS_ONLY",
}

export enum BudgetTier {
  BUDGET = "BUDGET",
  MID_RANGE = "MID_RANGE",
  PREMIUM = "PREMIUM",
  LUXURY = "LUXURY",
  STANDARD = "STANDARD",
}

export enum PropertySubtype {
  APARTMENT = "APARTMENT",
  VILLA = "VILLA",
  INDEPENDENT_HOUSE = "INDEPENDENT_HOUSE",
  PENTHOUSE = "PENTHOUSE",
  ROW_HOUSE = "ROW_HOUSE",
  STUDIO = "STUDIO",
  RETAIL_SHOP = "RETAIL_SHOP",
  HEALTHCARE_FACILITY = "HEALTHCARE_FACILITY",
  RESTAURANT = "RESTAURANT",
  OFFICE_SPACE = "OFFICE_SPACE",
}

// Project Status from API
export type ProjectStatus =
  | "ACTIVE"
  | "ON_HOLD"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED"
  | "YET_TO_START"
  | "ONGOING"
  | "active"
  | "on_hold"
  | "completed";

// Project Options Types
export interface OptionItem {
  value: string;
  label: string;
}

export interface OptionItemWithDescription extends OptionItem {
  description?: string;
}

export interface StageOption extends OptionItem {
  phase: string;
}

export interface PropertySubtypeOptions {
  [category: string]: OptionItem[];
}

export interface ProjectOptions {
  categories: OptionItem[];
  budgetTiers: OptionItem[];
  scopeTypes: OptionItem[];
  pipelineTypes: OptionItem[];
  propertySubtypes: PropertySubtypeOptions;
  statuses: OptionItemWithDescription[];
  stages: StageOption[];
  stageStatuses: OptionItem[];
  referenceCategories: string[];
}

// Pause Project Request
export interface PauseProjectRequest {
  reason: string;
  pauseDays: number;
  expectedResumeDate: string; // ISO 8601 format
}

// Pause Status Response
export interface PauseStatusResponse {
  isPaused: boolean;
  status: string;
  pausedAt: string | null;
  pausedUntil: string | null;
  pauseReason: string | null;
  pausedBy: string | null;
  previousStatus: string | null;
  isExpired: boolean;
  daysRemaining: number | null;
  daysOverdue: number | null;
}

// Main Project Interface (from API)
export interface Project {
  id: string;
  projectName: string;
  name?: string; // Legacy alias — maps to projectName for backward compatibility
  projectNumber?: string;
  leadId: string;
  accountId?: string | null;
  pipelineType: PipelineType;
  projectCategory: ProjectCategory;
  scopeType: ScopeType;
  propertySubtype: PropertySubtype;
  budgetTier: BudgetTier;
  propertySizeSqft: number;
  propertyBHK: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState?: string;
  propertyPincode?: string;
  propertyBuilding?: string;
  propertyUnit?: string;
  propertyLandmarks?: string;
  siteContactName?: string;
  siteContactPhone?: string;
  constructionStatus?: string;
  tentativeHandoverDate?: string | null;
  specialRequirements?: string | null;
  designTeam?: string[] | null;
  executionTeam?: string[] | null;
  assignedDesignerId?: string | null;
  assignedPMId?: string | null;
  designPackage?: string | null;
  numberOfMeetings?: number;
  moodBoardShared?: boolean;
  design3DStatus?: string | null;
  currentStageCode?: string | null;
  currentStage?: ProjectStageCode; // Legacy alias
  currentPhase?: string | null;
  status: ProjectStatus;
  pausedAt?: string | null;
  pausedUntil?: string | null;
  pauseReason?: string | null;
  pausedByUserId?: string | null;
  previousStatus?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  cancelledByUserId?: string | null;
  remarks?: string | null;
  totalValue: number | string;
  paidAmount?: number | string;
  createdAt: string;
  updatedAt: string;

  // Related data from API
  lead?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  account?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  } | null;
  assignedDesigner?: {
    id: string;
    name: string;
    email: string;
  } | null;
  assignedPM?: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count?: {
    stages: number;
    payments: number;
    documents: number;
  };

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
  // API passthrough aliases (some backend responses use these names)
  projectType?: string;
  propertyType?: string;
}

// Create Project Request Interface
export interface CreateProjectRequest {
  accountId: string;
  projectName: string;
  leadId?: string;
  pipelineType: PipelineType | string;
  projectCategory: ProjectCategory | string;
  scopeType: ScopeType | string;
  budgetTier?: BudgetTier | string;
  propertySubtype?: PropertySubtype | string;
  propertySizeSqft?: number;
  propertyBHK?: string;
  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  propertyPincode?: string;
  propertyBuilding?: string;
  propertyUnit?: string;
  propertyLandmarks?: string;
  siteContactName?: string;
  siteContactPhone?: string;
  constructionStatus?: string;
  tentativeHandoverDate?: string;
  specialRequirements?: string;
  designTeam?: string[];
  executionTeam?: string[];
  assignedDesignerId?: string;
  assignedPMId?: string;
  designPackage?: string;
  totalValue?: number | string;
  remarks?: string;
  numberOfMeetings?: number;
  moodBoardShared?: boolean;
  design3DStatus?: string;
  status?: string;
  paidAmount?: number;
}

// Update Project Request Interface
export interface UpdateProjectRequest {
  projectName?: string;
  leadId?: string;
  pipelineType?: string;
  projectCategory?: string;
  scopeType?: string;
  budgetTier?: string;
  propertySubtype?: string;
  propertySizeSqft?: number;
  propertyBHK?: string;
  currentStageCode?: string;
  assignedDesignerId?: string | null;
  assignedPMId?: string | null;
  designTeam?: string[];
  executionTeam?: string[];
  moodBoardShared?: boolean;
  design3DStatus?: string;
  designPackage?: string;
  numberOfMeetings?: number;
  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  propertyPincode?: string;
  propertyBuilding?: string;
  propertyUnit?: string;
  propertyLandmarks?: string;
  siteContactName?: string;
  siteContactPhone?: string;
  constructionStatus?: string;
  tentativeHandoverDate?: string;
  specialRequirements?: string;
  totalValue?: number | string;
  paidAmount?: number | string;
  status?: ProjectStatus;
  pauseReason?: string;
  pausedUntil?: string;
  cancellationReason?: string;
  remarks?: string;
}

// Update Stage Request Interface
export interface UpdateStageRequest {
  status?: string;
  startDate?: string;
  tentativeEndDate?: string;
  endDate?: string;
  remarks?: string;
  checklistItems?: Record<string, unknown>[] | null;
  completedById?: string;
}

// Update Payment Request Interface  (PUT /api/payments/:id)
export interface UpdatePaymentRequest {
  status?: string;
  actualAmount?: number | string;
  paymentMethod?: string;
  transactionRef?: string;
  notes?: string;
  invoiceAmount?: number;
  projectStageId?: string;
}

// Create Payment Request Interface (POST /api/payments)
export interface CreatePaymentRequest {
  projectId: string;
  title: string;
  description?: string;
  stageCode?: string;
  phaseType: string;
  paymentStage: number;
  percentage: number;
  expectedAmount: number | string;
  invoiceAmount?: number;
  projectStageId?: string;
  taxPercentage?: number;
  status?: string;
  dueDate?: string;
  notes?: string;
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

export enum ReferenceType {
  IMAGE = "IMAGE",
  PHOTO = "PHOTO",
  PDF = "PDF",
  DOCUMENT = "DOCUMENT",
  LINK = "LINK",
  VIDEO = "VIDEO",
}

// Project Reference (Inspiration) from API
export interface ProjectReference {
  id: string;
  projectId: string;
  referenceType: "PHOTO" | "PDF" | "DOCUMENT" | "LINK";
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  storageUrl: string | null;
  linkUrl: string | null;
  linkTitle: string | null;
  title: string | null;
  description: string | null;
  notes: string | null;
  category: string | null;
  subCategory: string | null;
  tags: string[];
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy: {
    id: string;
    name: string;
    email?: string;
  };
  project?: {
    id: string;
    projectName: string;
    projectNumber: string;
  };
}

export interface ProjectReferencesResponse {
  references: ProjectReference[];
  total: number;
  limit: number;
  offset: number;
}

export interface AddLinkReferenceRequest {
  linkUrl: string;
  linkTitle: string;
  category: string;
  subCategory?: string;
  tags?: string[];
}

export interface AddReferenceRequest {
  referenceType: "PHOTO" | "PDF" | "DOCUMENT" | "LINK";
  linkUrl?: string;
  linkTitle?: string;
  category: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateReferenceRequest {
  linkTitle?: string;
  notes?: string;
  category?: string;
  subCategory?: string;
  tags?: string[];
}

export interface LeadReference {
  id: string;
  leadId: string;
  type: ReferenceType;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  fileSize?: number; // in bytes
  fileName?: string;
  mimeType?: string;
  tags?: string[];
  category?:
    | "Inspiration"
    | "Requirement"
    | "Reference"
    | "Competitor"
    | "Other";
  uploadedBy: string;
  uploadedAt: string;
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
  status?: string; // API status: NEW, WORKING, QUALIFIED, DISQUALIFIED, CONVERTED

  // Stage History from API (for tracking moves in Kanban)
  stageHistory?: Array<{
    id: string;
    leadId: string;
    fromStage: string;
    toStage: string;
    changedByUserId?: string;
    reason?: string;
    changedAt: string;
    changedByUser?: {
      id: string;
      name: string;
    };
  }>;

  // Contacts from API
  contacts?: Array<{
    id: string;
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    isPrimary?: boolean;
  }>;

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
  assignedTo?: { id: string; name: string } | null; // BDR (Business Development Representative)
  assignedToId?: string | null;
  assignedDesigner?: string;
  activities?: LeadActivity[];
  references?: LeadReference[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  convertedToProject?: boolean;
  conversionDate?: string;
  lostReason?: string;
}

export interface LeadAssignee {
  id: string;
  name: string;
  email: string;
  role: string;
  assignedAt: string;
  notes?: string;
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

// Meeting entity types
export type MeetingEntityType = "LEAD" | "PROJECT" | "CUSTOMER";
export type MeetingStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "in_progress"
  | "PROCESSING"
  | "ANALYZED"
  | "COMPLETED";
export type MeetingType =
  | "CLIENT_INTAKE"
  | "DESIGN_PRESENTATION"
  | "SITE_VISIT"
  | "PROGRESS_REVIEW"
  | "HANDOVER"
  | "GENERAL";

// Participant interface for meeting participants
export interface Participant {
  id: string;
  meetingId: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface DiscussionPoint {
  key: string;
  label: string;
  checked: boolean;
  notes?: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;

  // Legacy entity references (backwards compatibility)
  leadId?: string;
  projectId?: string;
  customerId?: string;

  // New generic entity references
  entityType?: MeetingEntityType;
  entityId?: string;

  // Meeting type for templates
  type?: MeetingType;

  scheduledAt?: string; // ISO 8601 format (new API field)
  scheduledDate?: string; // Legacy field for backwards compatibility
  duration?: number;
  location?: string;
  attendees: string[];
  participants?: Participant[];
  recordingUrl?: string;
  recordingId?: string;
  transcription?: TranscriptionSegment[];
  aiAnalysis?: AIAnalysis;
  summary?: string;
  actionItems?: string[];
  keyPoints?: string[];
  discussionPoints?: DiscussionPoint[];
  // Fields from server (raw names)
  transcriptJson?: TranscriptionSegment[];
  transcriptText?: string;
  audioUrl?: string;
  audioSize?: number;
  durationSeconds?: number;
  startedAt?: string;
  endedAt?: string;
  speakerMap?: Record<string, string> | null;
  status: MeetingStatus;
  createdAt: string;
  updatedAt: string;
}

// Meeting Note interface for timestamped notes
export interface MeetingNote {
  id: string;
  meetingId: string;
  content: string;
  timestamp: number; // Timestamp in seconds marking when in the recording this note refers to
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
    | "SUPER_ADMIN"
    | "ADMIN"
    | "BDR"
    | "SALES"
    | "HR"
    | "PROJECT_MANAGER"
    | "LEAD_PROJECT_MANAGER"
    | "ACCOUNTS"
    | "SITE_ENGINEER"
    | "DESIGNER"
    | "DESIGN_HEAD"
    | "CIVIL"
    | "PAINTER"
    | "ELECTRICIAN"
    | "PLUMBER"
    | "CARPENTER";
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
    | "SUPER_ADMIN"
    | "ADMIN"
    | "BDR"
    | "SALES"
    | "HR"
    | "PROJECT_MANAGER"
    | "LEAD_PROJECT_MANAGER"
    | "ACCOUNTS"
    | "SITE_ENGINEER"
    | "DESIGNER"
    | "DESIGN_HEAD"
    | "CIVIL"
    | "PAINTER"
    | "ELECTRICIAN"
    | "PLUMBER"
    | "CARPENTER";
  phone?: string;
}

export interface BanUserRequest {
  reason: string;
}

// Project-related enums and types
// Updated to match real API stage codes
export enum ProjectStageCode {
  ENQUIRY = "ENQUIRY",
  DESIGN_SIGNUP = "DESIGN_SIGNUP",
  DESIGN = "DESIGN",
  FIRST_PRESENTATION = "FIRST_PRESENTATION",
  FINAL_DESIGN = "FINAL_DESIGN",
  COSTING = "COSTING",
  EXECUTION = "EXECUTION",
  HANDOVER = "HANDOVER",
  TESTIMONIAL = "TESTIMONIAL",
  // Legacy values (kept for backward compatibility)
  LEAD = "LEAD",
  SITE_VISIT = "SITE_VISIT",
  PROPOSAL = "PROPOSAL",
  WARRANTY = "WARRANTY",
}

export enum StageStatus {
  PENDING = "PENDING",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
  NOT_APPLICABLE = "NOT_APPLICABLE",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COLLECTED = "COLLECTED",
  OVERDUE = "OVERDUE",
  WAIVED = "WAIVED",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  // Legacy aliases kept for backward compatibility
  PAID = "COLLECTED",
  INVOICED = "PENDING",
  PARTIAL = "PARTIALLY_PAID",
}

export enum PaymentMethod {
  UPI = "UPI",
  BANK_TRANSFER = "BANK_TRANSFER",
  CHEQUE = "CHEQUE",
  CASH = "CASH",
  CREDIT_CARD = "CREDIT_CARD",
  DEBIT_CARD = "DEBIT_CARD",
  OTHER = "OTHER",
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
  stageTemplateId?: string | null;
  stageCode: string; // Allow any string to handle all API stage codes
  stageName: string;
  phaseType: string; // e.g. "DESIGN" or "EXECUTION"
  orderIndex: number;
  status: StageStatus | string;
  startDate?: string | null;
  tentativeEndDate?: string | null;
  endDate?: string | null;
  completedById?: string | null;
  checklistItems?: Record<string, unknown>[] | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPayment {
  id: string;
  projectId: string;
  title?: string;
  description?: string;
  stageCode?: string | null;
  projectStageId?: string | null;
  paymentStage: number;
  phaseType: string; // e.g. "DESIGN" or "EXECUTION"
  percentage: number;
  expectedAmount: string | number;
  invoiceAmount?: number | null;
  actualAmount?: string | number | null;
  taxPercentage?: number | null;
  status: PaymentStatus | string;
  paymentMethod?: PaymentMethod | string | null;
  transactionRef?: string | null;
  dueDate?: string | null;
  collectedAt?: string | null;
  collectedById?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  collectedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;

  // Receipt / document
  receiptUrl?: string | null;
  receiptFileName?: string | null;
  // Multiple documents (returned by API if backend supports it)
  documents?: Array<{
    id?: string;
    url: string;
    fileName?: string;
    fileType?: string;
    documentType: string;
    createdAt?: string;
  }>;

  // Invoice metadata
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  invoiceSentAt?: string | null;
  invoiceSentToEmail?: string | null;

  // Legacy fields for backward compatibility
  milestoneName?: string;
  milestone?: string;
  amount?: number;
  paidDate?: string;
  collectedDate?: string;
  remarks?: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: ProjectTaskStatus;
  dueDate?: string;
  assignedTo?: string | { name: string }; // Support both string and object
  createdAt: string;
  updatedAt: string;
}

// Stage Template for available-stages endpoint
export interface StageTemplate {
  id: string;
  code: string;
  name: string;
  description?: string;
  phaseType: string;
  orderIndex: number;
  isActive: boolean;
  isDefault: boolean;
  pipelineType?: string | null;
  defaultChecklistItems?: { key: string; label: string }[] | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    projectStages: number;
  };
}

export interface StageTemplatePhaseType {
  value: string;
  label: string;
}

export interface CreateStageTemplateRequest {
  code: string;
  name: string;
  description: string;
  phaseType: string;
  orderIndex: number;
  isActive: boolean;
  isDefault: boolean;
  pipelineType?: string | null;
  defaultChecklistItems?: { key: string; label: string }[];
}

export interface UpdateStageTemplateRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface ReorderStageTemplatesRequest {
  orderings: { id: string; orderIndex: number }[];
}

// ==========================================
// COMPREHENSIVE STAGES SYSTEM TYPES
// ==========================================

// Pipeline type determines which stages are available
export enum StagePipelineType {
  DESIGN_ONLY = "DESIGN_ONLY",
  DESIGN_AND_EXECUTION = "DESIGN_AND_EXECUTION",
}

// Worker categories for task assignment
export enum WorkerCategory {
  PAINTER = "PAINTER",
  CARPENTER = "CARPENTER",
  PLUMBER = "PLUMBER",
  ELECTRICIAN = "ELECTRICIAN",
  MASON = "MASON",
  TILER = "TILER",
  FABRICATOR = "FABRICATOR",
  HVAC_TECHNICIAN = "HVAC_TECHNICIAN",
  FLOORING_SPECIALIST = "FLOORING_SPECIALIST",
  GLASS_WORKER = "GLASS_WORKER",
  CIVIL_WORKER = "CIVIL_WORKER",
  SUPERVISOR = "SUPERVISOR",
  HELPER = "HELPER",
  OTHER = "OTHER",
}

// Task status in day plan
export enum DayTaskStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  PAUSED = "PAUSED",
  BLOCKED = "BLOCKED",
  CANCELLED = "CANCELLED",
}

// Overall day status
export enum DayPlanStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  PARTIALLY_COMPLETED = "PARTIALLY_COMPLETED",
  CANCELLED = "CANCELLED",
  HOLIDAY = "HOLIDAY",
}

// Stage phase for Design & Execution projects
export enum StagePhase {
  // Design Phase Stages
  CONCEPT_DESIGN = "CONCEPT_DESIGN",
  DESIGN_DEVELOPMENT = "DESIGN_DEVELOPMENT",
  MATERIAL_SELECTION = "MATERIAL_SELECTION",
  FINAL_DESIGN_APPROVAL = "FINAL_DESIGN_APPROVAL",

  // Execution Phase Stages
  SITE_PREPARATION = "SITE_PREPARATION",
  CIVIL_WORK = "CIVIL_WORK",
  ELECTRICAL_PLUMBING = "ELECTRICAL_PLUMBING",
  CARPENTRY_WORK = "CARPENTRY_WORK",
  PAINTING = "PAINTING",
  FLOORING = "FLOORING",
  FINISHING = "FINISHING",
  FINAL_INSPECTION = "FINAL_INSPECTION",
  HANDOVER = "HANDOVER",
}

// Worker interface
export interface Worker {
  id: string;
  name: string;
  category: WorkerCategory;
  phone: string;
  email?: string;
  dailyRate: number;
  isAvailable: boolean;
  skills: string[];
  rating?: number;
  avatar?: string;
  createdAt: string;
}

// Task within a day plan
export interface DayTask {
  id: string;
  dayPlanId: string;
  title: string;
  description?: string;
  category: WorkerCategory;
  status: DayTaskStatus;
  assignedWorkers: Worker[];
  estimatedHours: number;
  actualHours?: number;
  startTime?: string;
  endTime?: string;
  completionNotes?: string;
  photos?: string[];
  isPaused: boolean;
  pausedAt?: string;
  pauseReason?: string;
  resumedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Day plan represents work for a single day
export interface DayPlan {
  id: string;
  projectId: string;
  stageId: string;
  dayNumber: number;
  date: string;
  status: DayPlanStatus;
  tasks: DayTask[];
  totalWorkers: number;
  totalCost: number;
  supervisorId?: string;
  supervisor?: Worker;
  weatherCondition?: string;
  siteNotes?: string;
  startTime?: string;
  endTime?: string;
  completionSummary?: string;
  completedTasks: string[];
  pendingTasks: string[];
  blockedTasks: string[];
  photos?: string[];
  isPaused: boolean;
  pausedAt?: string;
  pauseReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Project stage with day plans
export interface ProjectStageWithDays {
  id: string;
  projectId: string;
  phase: StagePhase;
  phaseName: string;
  phaseDescription: string;
  phaseCategory: "DESIGN" | "EXECUTION";
  status: StageStatus;
  progress: number;
  startDate?: string;
  estimatedEndDate?: string;
  actualEndDate?: string;
  totalDays: number;
  completedDays: number;
  dayPlans: DayPlan[];
  totalBudget: number;
  spentBudget: number;
  isPaused: boolean;
  pausedAt?: string;
  pauseReason?: string;
  remarks?: string;

  // Payment related fields
  paymentRequired: boolean;
  paymentAmount?: number;
  paymentStatus: PaymentStatus;
  paymentDueDate?: string;
  paymentCollectedDate?: string;
  paymentNotes?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;

  createdAt: string;
  updatedAt: string;
}

// Full project stages overview
export interface ProjectStagesOverview {
  projectId: string;
  pipelineType: StagePipelineType;
  designPhase: {
    stages: ProjectStageWithDays[];
    totalProgress: number;
    status: StageStatus;
    startDate?: string;
    estimatedEndDate?: string;
  };
  executionPhase?: {
    stages: ProjectStageWithDays[];
    totalProgress: number;
    status: StageStatus;
    startDate?: string;
    estimatedEndDate?: string;
  };
  overallProgress: number;
  projectStartDate?: string;
  projectEstimatedEndDate?: string;
  totalBudget: number;
  spentBudget: number;
  totalDays: number;
  completedDays: number;
  isPaused: boolean;
}

// Task assignment request
export interface AssignTaskRequest {
  dayPlanId: string;
  taskTitle: string;
  taskDescription?: string;
  category: WorkerCategory;
  workerIds: string[];
  estimatedHours: number;
  startTime?: string;
}

// Update day task request
export interface UpdateDayTaskRequest {
  status?: DayTaskStatus;
  actualHours?: number;
  completionNotes?: string;
  photos?: string[];
  isPaused?: boolean;
  pauseReason?: string;
}

// Complete day summary
export interface CompleteDaySummary {
  dayPlanId: string;
  completionSummary: string;
  completedTasks: string[];
  pendingTasks: string[];
  photos?: string[];
  endTime: string;
}

// Testimonial Types — matches actual API response shape

// ==========================================
// STAGE TASK MATRIX TYPES (Day-wise Task Management)
// ==========================================

export enum MatrixTaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  OVERDUE = "OVERDUE",
}

export enum MatrixAttachmentType {
  PHOTO = "PHOTO",
  VIDEO = "VIDEO",
  DOCUMENT = "DOCUMENT",
  AUDIO = "AUDIO",
  OTHER = "OTHER",
}

export interface MatrixCategory {
  id: string;
  name: string;
  orderIndex: number;
  color: string;
  assignedTo?: string;
}

export interface MatrixTask {
  id: string;
  dayNumber: number;
  title: string;
  description?: string;
  status: MatrixTaskStatus | string;
  startDate?: string;
  taskDate?: string;
  completionNotes?: string;
  completedAt?: string | null;
  completedBy?: { id?: string; name: string } | null;
  /** Reason stored when the task was pushed to a different day */
  pushReason?: string | null;
  /** Some API responses use 'reason' directly */
  reason?: string | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; email?: string } | null;
  category?: { id?: string; name: string; color?: string } | null;
  categoryId?: string;
  _count?: { attachments: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskAttachment {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  attachmentType: MatrixAttachmentType | string;
  description?: string;
  uploadedBy?: { id?: string; name: string } | null;
  task?: { id: string; title: string } | null;
  createdAt?: string;
}

export interface TaskMatrix {
  id: string;
  projectId?: string;
  stageId?: string;
  totalDays: number;
  startDate: string;
  categories?: MatrixCategory[];
  dayTasks?: MatrixTask[];
  project?: { id: string; projectName: string };
  projectStage?: { id: string; stageName: string; stageCode: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMatrixRequest {
  totalDays: number;
  startDate: string;
  categories: {
    name: string;
    orderIndex: number;
    color: string;
    assignedTo?: string;
  }[];
  tasks?: {
    dayNumber: number;
    categoryId?: string;
    title: string;
    description?: string;
    taskDate: string;
    startDate?: string;
    assignedToUserId?: string;
    assignedToMemberId?: string;
  }[];
}

export interface UpdateMatrixRequest {
  totalDays?: number;
  startDate?: string;
}

export interface UpdateTaskStatusRequest {
  status: string;
  completionNotes?: string;
}

export interface UpdateMatrixTaskRequest {
  title?: string;
  description?: string;
  categoryId?: string;
  dayNumber?: number;
  startDate?: string;
  taskDate?: string;
  status?: string;
  assignedToUserId?: string | null;
  assignedToMemberId?: string | null;
  completionNotes?: string;
}

export interface NotifyCustomerRequest {
  customMessage?: string;
  includeAttachments?: boolean;
}

export interface CreateMatrixResponse {
  matrix: TaskMatrix;
  categories: MatrixCategory[];
  tasks: MatrixTask[];
  message: string;
}

export interface NotifyCustomerResponse {
  sent: boolean;
  emailId: string;
  customerEmail: string;
  attachmentsCount: number;
}

export interface MatrixStats {
  matrixId: string;
  totalDays: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completionPercentage: number;
  categoryCount: number;
  dayStats: {
    dayNumber: number;
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
  }[];
}

// Testimonial Types — matches actual API response shape
export enum TestimonialStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  PUBLISHED = "PUBLISHED",
  REJECTED = "REJECTED",
}

export interface TestimonialDesigner {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

export interface TestimonialProject {
  id: string;
  projectName: string;
  projectNumber: string;
  propertyCity?: string;
}

export interface ProjectTestimonial {
  id: string;
  projectId: string;
  capturedByDesignerId: string;
  testimonialText: string;
  rating: number;
  videoUrl: string | null;
  videoFileName: string | null;
  audioUrl: string | null;
  audioFileName: string | null;
  photoUrls: string[] | null;
  customerName: string | null;
  customerDesignation: string | null;
  customerCompany: string | null;
  customerCity: string | null;
  canSharePublicly: boolean;
  canUsePhoto: boolean;
  canUseName: boolean;
  status: TestimonialStatus;
  capturedAt: string;
  approvedAt: string | null;
  approvedById: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  capturedByDesigner?: TestimonialDesigner;
  approvedBy?: TestimonialDesigner | null;
  project?: TestimonialProject;
}

export interface CreateTestimonialRequest {
  capturedByDesignerId: string;
  rating: number;
  testimonialText: string;
  customerName?: string;
  canSharePublicly?: boolean;
  canUsePhoto?: boolean;
  canUseName?: boolean;
  customerDesignation?: string;
  customerCompany?: string;
  customerCity?: string;
  notes?: string;
}

export interface UpdateTestimonialRequest {
  rating?: number;
  testimonialText?: string;
  customerName?: string;
  customerDesignation?: string;
  customerCompany?: string;
  customerCity?: string;
  canSharePublicly?: boolean;
  canUsePhoto?: boolean;
  canUseName?: boolean;
  notes?: string;
}

export interface TestimonialAnalytics {
  byDesigner: {
    designer: TestimonialDesigner;
    totalTestimonials: number;
    averageRating: number;
  }[];
  byStatus: {
    status: string;
    count: number;
  }[];
  byRating: {
    rating: number;
    count: number;
  }[];
}

// ==========================================
// Handover & Goodwill Types
// ==========================================

export interface HandoverActivity {
  id: string;
  projectId: string;
  name: string;
  description: string;
  cost: string;
  isCompleted: boolean;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHandoverActivityRequest {
  name: string;
  description: string;
  cost: number;
}

export interface UpdateHandoverActivityRequest {
  name?: string;
  description?: string;
  cost?: number;
  isCompleted?: boolean;
  completedAt?: string;
  notes?: string;
}

export interface HandoverPhoto {
  id: string;
  projectId: string;
  fileUrl: string;
  fileName: string;
  caption: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// VOICE API TYPES
// ==========================================

/**
 * Request payload for voice processing
 * POST /api/voice
 */
export interface VoiceProcessRequest {
  /** Base64-encoded audio data */
  audioBase64: string;
  /** Session UUID for maintaining conversation context */
  sessionId: string;
}

/**
 * Response from voice processing endpoint
 */
export interface VoiceProcessResponse {
  /** Whether the processing was successful */
  success: boolean;
  /** The transcribed text from the audio */
  transcription?: string;
  /** AI-generated response (if applicable) */
  aiResponse?: string;
  /** Synthesized audio response as base64 (if applicable) */
  audioResponseBase64?: string;
  /** Session ID for subsequent requests */
  sessionId: string;
  /** Any error message */
  error?: string;
  /** Processing timestamp */
  processedAt?: string;
}

/**
 * Request payload for text-to-speech synthesis
 * POST /api/voice/synthesize
 */
export interface VoiceSynthesizeRequest {
  /** Text to convert to speech */
  text: string;
  /** Voice model to use (e.g., "en-IN-Wavenet-A", "en-US-Neural2-A") */
  voice?: string;
  /** Language code (e.g., "en-IN", "en-US") */
  languageCode?: string;
  /** Speaking rate (0.25 to 4.0, default 1.0) */
  speakingRate?: number;
  /** Pitch adjustment (-20.0 to 20.0, default 0) */
  pitch?: number;
}

/**
 * Response from text-to-speech synthesis endpoint
 */
export interface VoiceSynthesizeResponse {
  /** Whether the synthesis was successful */
  success: boolean;
  /** Base64-encoded audio data */
  audioBase64?: string;
  /** Audio content type (e.g., "audio/mp3", "audio/wav") */
  contentType?: string;
  /** Duration of the audio in seconds */
  durationSeconds?: number;
  /** Any error message */
  error?: string;
}

/**
 * Request payload for audio transcription
 * POST /api/voice/transcribe
 */
export interface VoiceTranscribeRequest {
  /** Base64-encoded audio data */
  audioBase64: string;
  /** Language code for transcription (e.g., "en-IN", "en-US", "hi-IN") */
  languageCode?: string;
  /** Audio encoding type (e.g., "WEBM_OPUS", "LINEAR16", "MP3") */
  encoding?: string;
  /** Sample rate in hertz (e.g., 16000, 48000) */
  sampleRateHertz?: number;
  /** Enable speaker diarization */
  enableSpeakerDiarization?: boolean;
  /** Minimum number of speakers (for diarization) */
  minSpeakerCount?: number;
  /** Maximum number of speakers (for diarization) */
  maxSpeakerCount?: number;
  /** Enable automatic punctuation */
  enableAutomaticPunctuation?: boolean;
  /** Model to use (e.g., "latest_long", "phone_call", "video") */
  model?: string;
}

/**
 * Single word/segment in transcription with timing
 */
export interface VoiceTranscriptionWord {
  /** The transcribed word */
  word: string;
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
  /** Confidence score (0-1) */
  confidence?: number;
  /** Speaker tag (if diarization enabled) */
  speakerTag?: number;
}

/**
 * A segment of voice transcription (typically a sentence or phrase)
 */
export interface VoiceTranscriptionSegment {
  /** Speaker identifier */
  speaker: string;
  /** The transcribed text */
  text: string;
  /** Start timestamp in seconds */
  timestamp: number;
  /** End timestamp in seconds */
  endTimestamp?: number;
  /** Confidence score (0-1) */
  confidence?: number;
  /** Individual words with timing */
  words?: VoiceTranscriptionWord[];
}

/**
 * Response from audio transcription endpoint
 */
export interface VoiceTranscribeResponse {
  /** Whether the transcription was successful */
  success: boolean;
  /** Full transcribed text */
  transcription?: string;
  /** Segmented transcription with speaker info and timestamps */
  segments?: VoiceTranscriptionSegment[];
  /** Detected language code */
  languageCode?: string;
  /** Total duration of the audio in seconds */
  durationSeconds?: number;
  /** Number of detected speakers (if diarization enabled) */
  speakerCount?: number;
  /** Any error message */
  error?: string;
  /** Processing metadata */
  metadata?: {
    model: string;
    processingTimeMs: number;
    audioChannels: number;
    sampleRateHertz: number;
  };
}

/**
 * Available voice options for synthesis
 */
export interface VoiceOption {
  /** Voice ID (e.g., "en-IN-Wavenet-A") */
  id: string;
  /** Display name (e.g., "Indian English - Female 1") */
  name: string;
  /** Language code */
  languageCode: string;
  /** Voice gender */
  gender: "MALE" | "FEMALE" | "NEUTRAL";
  /** Voice type (Standard, Wavenet, Neural2, etc.) */
  type: "STANDARD" | "WAVENET" | "NEURAL2";
}

/**
 * Available language options for transcription
 */
export interface LanguageOption {
  /** Language code (e.g., "en-IN") */
  code: string;
  /** Display name (e.g., "English (India)") */
  name: string;
  /** Is this the default option */
  isDefault?: boolean;
}

// ==========================================
// Activity Types
// ==========================================

/**
 * Types of activities that can be logged in the system
 */
export type ActivityType =
  | "NOTE"
  | "CALL"
  | "MEETING"
  | "EMAIL"
  | "WHATSAPP"
  | "SITE_VISIT"
  | "STAGE_CHANGE"
  | "STATUS_CHANGE"
  | "PAYMENT"
  | "DOCUMENT_UPLOAD"
  | "TASK_COMPLETED";

/**
 * Entity types that can have activities
 */
export type EntityType = "LEAD" | "PROJECT" | "CUSTOMER";

/**
 * Main Activity interface
 */
export interface Activity {
  id: string;
  entityType: EntityType;
  entityId: string;
  type: ActivityType;
  description: string;
  durationMinutes?: number;
  metadata?: Record<string, any>;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request payload for creating an activity
 */
export interface CreateActivityRequest {
  entityType: EntityType;
  entityId: string;
  type: ActivityType;
  description: string;
  durationMinutes?: number;
  metadata?: Record<string, any>;
}

/**
 * Request payload for logging specific activity types
 */
export interface LogActivityRequest {
  entityType: EntityType;
  entityId: string;
  description: string;
  durationMinutes?: number;
}

// ─── Email Template Types ────────────────────────────────────────

/**
 * Email template variable definition
 */
export interface EmailTemplateVariable {
  name: string;
  required: boolean;
  description?: string;
}

/**
 * Email template entity
 */
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  category: string;
  description?: string;
  variables?: EmailTemplateVariable[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Request payload for creating an email template
 */
export interface CreateEmailTemplateRequest {
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  category: string;
  description?: string;
  variables?: EmailTemplateVariable[];
}

/**
 * Request payload for updating an email template
 */
export interface UpdateEmailTemplateRequest {
  name?: string;
  subject?: string;
  htmlBody?: string;
  textBody?: string;
  category?: string;
  description?: string;
  variables?: EmailTemplateVariable[];
}
