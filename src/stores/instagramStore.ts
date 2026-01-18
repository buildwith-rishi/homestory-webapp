import { create } from 'zustand';
import { InstagramPost, AnalyticsData, DirectMessage, Comment, InstagramPostType, InstagramPostStatus } from '../types';

interface InstagramState {
  posts: InstagramPost[];
  analytics: AnalyticsData | null;
  directMessages: DirectMessage[];
  comments: Comment[];
  calendarView: 'month' | 'week';
  selectedDate: Date;
  isLoading: boolean;
  fetchPosts: () => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  fetchDirectMessages: () => Promise<void>;
  fetchComments: () => Promise<void>;
  schedulePost: (post: Omit<InstagramPost, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePost: (id: string, updates: Partial<InstagramPost>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  setCalendarView: (view: 'month' | 'week') => void;
  setSelectedDate: (date: Date) => void;
}

const mockPosts: InstagramPost[] = [
  {
    id: 'ig1',
    type: InstagramPostType.CAROUSEL,
    caption: 'Modern kitchen transformation ✨ Swipe to see the before and after of this stunning HSR Layout project.',
    hashtags: ['#InteriorDesign', '#BangaloreHomes', '#KitchenMakeover', '#ModernHome'],
    location: 'HSR Layout, Bangalore',
    media: [
      { url: 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg', type: 'image', altText: 'Modern kitchen with island' },
      { url: 'https://images.pexels.com/photos/1599791/pexels-photo-1599791.jpeg', type: 'image', altText: 'Kitchen before renovation' },
    ],
    scheduledDate: '2026-01-20T09:00:00Z',
    status: InstagramPostStatus.SCHEDULED,
    createdAt: '2026-01-17T00:00:00Z',
    updatedAt: '2026-01-17T00:00:00Z',
  },
  {
    id: 'ig2',
    type: InstagramPostType.REEL,
    caption: '30 seconds of pure design inspiration! Watch this space transform 🎬',
    hashtags: ['#ConstructionReel', '#TimelapseVideo', '#HomeBuild', '#BangaloreBuilders'],
    media: [
      { url: 'https://images.pexels.com/photos/7078619/pexels-photo-7078619.jpeg', type: 'video', altText: 'Construction timelapse' },
    ],
    scheduledDate: '2026-01-22T17:30:00Z',
    status: InstagramPostStatus.SCHEDULED,
    createdAt: '2026-01-16T00:00:00Z',
    updatedAt: '2026-01-16T00:00:00Z',
  },
  {
    id: 'ig3',
    type: InstagramPostType.SINGLE,
    caption: 'Behind the scenes of our latest project. Quality craftsmanship at every step 🔨',
    hashtags: ['#ConstructionLife', '#BangaloreConstruction', '#QualityHomes'],
    media: [
      { url: 'https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg', type: 'image', altText: 'Construction site progress' },
    ],
    publishedDate: '2026-01-15T10:00:00Z',
    status: InstagramPostStatus.PUBLISHED,
    metrics: {
      likes: 342,
      comments: 28,
      reach: 5420,
      engagement: 6.8,
    },
    createdAt: '2026-01-14T00:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
  },
];

const mockAnalytics: AnalyticsData = {
  followers: {
    total: 12450,
    change: 234,
    changePercent: 1.9,
  },
  engagement: {
    rate: 5.8,
    change: 0.4,
  },
  reach: {
    total: 45230,
    change: 3420,
  },
  profileVisits: {
    total: 1820,
    change: 156,
  },
  topPosts: mockPosts.slice(0, 3),
  audienceDemographics: {
    ageRanges: [
      { range: '18-24', percentage: 15 },
      { range: '25-34', percentage: 45 },
      { range: '35-44', percentage: 28 },
      { range: '45-54', percentage: 10 },
      { range: '55+', percentage: 2 },
    ],
    gender: { male: 58, female: 40, other: 2 },
    topLocations: [
      { city: 'Bangalore', percentage: 65 },
      { city: 'Mumbai', percentage: 15 },
      { city: 'Delhi', percentage: 10 },
      { city: 'Hyderabad', percentage: 6 },
      { city: 'Chennai', percentage: 4 },
    ],
  },
  activeHours: Array(7).fill(null).map(() => Array(24).fill(0).map(() => Math.floor(Math.random() * 100))),
};

export const useInstagramStore = create<InstagramState>((set) => ({
  posts: mockPosts,
  analytics: mockAnalytics,
  directMessages: [],
  comments: [],
  calendarView: 'month',
  selectedDate: new Date(),
  isLoading: false,

  fetchPosts: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set({ posts: mockPosts, isLoading: false });
  },

  fetchAnalytics: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 400));
    set({ analytics: mockAnalytics, isLoading: false });
  },

  fetchDirectMessages: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set({ directMessages: [], isLoading: false });
  },

  fetchComments: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set({ comments: [], isLoading: false });
  },

  schedulePost: async (postData) => {
    const newPost: InstagramPost = {
      ...postData,
      id: `ig${Date.now()}`,
      status: postData.scheduledDate ? InstagramPostStatus.SCHEDULED : InstagramPostStatus.DRAFT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      posts: [...state.posts, newPost],
    }));
  },

  updatePost: async (id: string, updates: Partial<InstagramPost>) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    }));
  },

  deletePost: async (id: string) => {
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== id),
    }));
  },

  setCalendarView: (view: 'month' | 'week') => {
    set({ calendarView: view });
  },

  setSelectedDate: (date: Date) => {
    set({ selectedDate: date });
  },
}));
