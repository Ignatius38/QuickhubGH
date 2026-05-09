// TypeScript interfaces for QuickHubGH Platform

// Base User interface
export interface User {
  id: string;
  display_name: string;
  email: string;
  role: 'seeker' | 'poster';
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  resume_url: string | null;
  avg_rating: number | null;
  rating_count: number;
  created_at: string;
}

// Seeker profile extends User with seeker-specific properties
export interface SeekerProfile extends User {
  role: 'seeker';
  portfolio_items: PortfolioItem[];
  user_tags: Tag[];
}

// Poster profile extends User with poster-specific properties
export interface PosterProfile extends User {
  role: 'poster';
  // Poster-specific properties could be added here
  // For example: total_jobs_posted, etc.
}

// Tag interface
export interface Tag {
  id: number;
  name: string;
  category: string | null;
}

// Portfolio Item interface
export interface PortfolioItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  created_at: string;
}

// Profile update input
export interface ProfileUpdateInput {
  display_name?: string;
  bio?: string | null;
  location?: string | null;
  role?: 'seeker' | 'poster';
  tag_ids?: number[];
}

// Portfolio item input
export interface PortfolioItemInput {
  title: string;
  description?: string | null;
  image_url?: string | null;
  link_url?: string | null;
}

// Job-related interfaces
export interface Job {
  id: string;
  poster_id: string;
  title: string;
  description: string;
  location: string;
  budget_ghs: number;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface JobWithTags extends Job {
  tags: Tag[];
  poster: User;
}

export interface JobUpdateInput {
  title?: string;
  description?: string;
  location?: string;
  budget_ghs?: number;
  tag_ids?: number[];
}

// Application interface
export interface Application {
  id: string;
  job_id: string;
  seeker_id: string;
  status: 'pending' | 'viewed' | 'engaged';
  applied_at: string;
}

export interface ApplicationWithSeeker extends Application {
  seeker: SeekerProfile;
}

// Rating interface
export interface Rating {
  id: string;
  job_id: string;
  rater_id: string;
  ratee_id: string;
  score: number;
  created_at: string;
}

// Subscription interface
export interface Subscription {
  id: string;
  user_id: string;
  tier: string;
  starts_at: string;
  ends_at: string;
  payment_reference: string;
  status: 'active' | 'expired';
  created_at: string;
}

// Notification payload types
export type NotificationPayload = 
  | { job_id: string; applicant_id: string; application_id: string } // new_application
  | { job_id: string; job_title: string; status: string } // application_viewed
  | { job_id: string; rater_id: string; score: number } // new_rating
  | { tier: string; ends_at: string } // subscription_activated
  | { message: string }; // other notifications

// Notification interface
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  payload: NotificationPayload;
  created_at: string;
  read_at: string | null;
}

// Database types for Supabase queries
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'rating_count'> & {
          id?: string;
          rating_count?: number;
        };
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      tags: {
        Row: Tag;
        Insert: Omit<Tag, 'id'>;
        Update: Partial<Omit<Tag, 'id'>>;
      };
      user_tags: {
        Row: {
          user_id: string;
          tag_id: number;
        };
        Insert: {
          user_id: string;
          tag_id: number;
        };
        Update: {
          user_id?: string;
          tag_id?: number;
        };
      };
      portfolio_items: {
        Row: PortfolioItem;
        Insert: Omit<PortfolioItem, 'id' | 'created_at'>;
        Update: Partial<Omit<PortfolioItem, 'id' | 'user_id' | 'created_at'>>;
      };
      jobs: {
        Row: Job;
        Insert: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'status'> & {
          id?: string;
          status?: 'open';
        };
        Update: Partial<Omit<Job, 'id' | 'poster_id' | 'created_at' | 'updated_at'>>;
      };
      job_tags: {
        Row: {
          job_id: string;
          tag_id: number;
        };
        Insert: {
          job_id: string;
          tag_id: number;
        };
        Update: {
          job_id?: string;
          tag_id?: number;
        };
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, 'id' | 'created_at'>;
        Update: Partial<Omit<Subscription, 'id' | 'user_id' | 'created_at'>>;
      };
      applications: {
        Row: Application;
        Insert: Omit<Application, 'id' | 'applied_at'>;
        Update: Partial<Omit<Application, 'id' | 'job_id' | 'seeker_id' | 'applied_at'>>;
      };
      ratings: {
        Row: Rating;
        Insert: Omit<Rating, 'id' | 'created_at'>;
        Update: Partial<Omit<Rating, 'id' | 'created_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id' | 'user_id' | 'created_at'>>;
      };
    };
  };
};