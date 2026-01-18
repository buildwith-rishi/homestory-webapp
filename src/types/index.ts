export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ENGINEER = 'engineer',
  CUSTOMER = 'customer'
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
  PRE_CONSTRUCTION = 'pre_construction',
  EXECUTION = 'execution',
  FINISHING = 'finishing',
  FINAL_FIXES = 'final_fixes',
  COMPLETE = 'complete'
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

export interface Project {
  id: string;
  name: string;
  location: string;
  customerId: string;
  stage: ProjectStage;
  progress: number;
  startDate: string;
  estimatedEndDate: string;
  actualEndDate?: string;
  siteEngineerId?: string;
  budget?: number;
  status: 'active' | 'on_hold' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export enum LeadStage {
  INQUIRY = 'inquiry',
  CONTACTED = 'contacted',
  MEETING_SCHEDULED = 'meeting_scheduled',
  PROPOSAL_SENT = 'proposal_sent',
  NEGOTIATION = 'negotiation',
  WON = 'won',
  LOST = 'lost'
}

export enum LeadSource {
  WEBSITE = 'website',
  INSTAGRAM = 'instagram',
  REFERRAL = 'referral',
  WALK_IN = 'walk_in',
  OTHER = 'other'
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'stage_change';
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
  projectType?: string;
  location?: string;
  budget?: number;
  notes?: string;
  assignedTo?: string;
  activities?: LeadActivity[];
  createdAt: string;
  updatedAt: string;
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
  sentiment: 'positive' | 'neutral' | 'negative';
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
  status: 'scheduled' | 'completed' | 'cancelled';
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
  type: 'update' | 'photo' | 'video' | 'issue' | 'milestone';
  title: string;
  content: string;
  media?: string[];
  sentAt: string;
  readAt?: string;
}

export enum IssueCategory {
  MATERIAL = 'material',
  QUALITY = 'quality',
  SAFETY = 'safety',
  DELAY = 'delay',
  OTHER = 'other'
}

export enum IssueSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum IssueStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved'
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
  SINGLE = 'single',
  CAROUSEL = 'carousel',
  REEL = 'reel',
  STORY = 'story'
}

export enum InstagramPostStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  FAILED = 'failed'
}

export interface InstagramPost {
  id: string;
  type: InstagramPostType;
  caption: string;
  hashtags: string[];
  location?: string;
  media: {
    url: string;
    type: 'image' | 'video';
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
    from: 'user' | 'brand';
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
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ProjectFilters {
  stage?: ProjectStage;
  status?: 'active' | 'on_hold' | 'completed';
  search?: string;
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
