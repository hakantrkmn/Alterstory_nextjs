export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  has_uploaded_avatar: boolean;
  created_at: string;
  updated_at: string;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  author_id: string;
  parent_id?: string; // null for root stories
  story_root_id: string; // references the root story
  level: number; // depth in tree (0 for root)
  position: number; // order among siblings
  like_count: number;
  dislike_count: number;
  comment_count: number;
  continuation_count: number;
  max_continuations: number; // configurable limit
  created_at: string;
  updated_at: string;
}

export interface StoryContribution {
  id: string;
  user_id: string;
  story_root_id: string;
  story_id: string;
  contribution_type: "create" | "continue";
  created_at: string;
}

export interface StoryVote {
  id: string;
  user_id: string;
  story_id: string;
  vote_type: "like" | "dislike";
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  story_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Input types for API operations
export interface CreateStoryInput {
  title: string;
  content: string;
  authorId: string;
  storyRootId?: string;
  parentId?: string;
  level?: number;
  position?: number;
}

export interface AddContinuationInput {
  title: string;
  content: string;
  authorId: string;
  parentId: string;
  storyRootId: string;
  level: number;
}

export interface AddCommentInput {
  storyId: string;
  userId: string;
  content: string;
}// Supabase Database Types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          avatar_url: string | null
          bio: string | null
          has_uploaded_avatar: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name: string
          avatar_url?: string | null
          bio?: string | null
          has_uploaded_avatar?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string
          avatar_url?: string | null
          bio?: string | null
          has_uploaded_avatar?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      stories: {
        Row: {
          id: string
          title: string
          content: string
          author_id: string
          parent_id: string | null
          story_root_id: string
          level: number
          position: number
          like_count: number
          dislike_count: number
          comment_count: number
          continuation_count: number
          max_continuations: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          author_id: string
          parent_id?: string | null
          story_root_id: string
          level?: number
          position?: number
          like_count?: number
          dislike_count?: number
          comment_count?: number
          continuation_count?: number
          max_continuations?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          author_id?: string
          parent_id?: string | null
          story_root_id?: string
          level?: number
          position?: number
          like_count?: number
          dislike_count?: number
          comment_count?: number
          continuation_count?: number
          max_continuations?: number
          created_at?: string
          updated_at?: string
        }
      }
      story_contributions: {
        Row: {
          id: string
          user_id: string
          story_root_id: string
          story_id: string
          contribution_type: 'create' | 'continue'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          story_root_id: string
          story_id: string
          contribution_type: 'create' | 'continue'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          story_root_id?: string
          story_id?: string
          contribution_type?: 'create' | 'continue'
          created_at?: string
        }
      }
      story_votes: {
        Row: {
          id: string
          user_id: string
          story_id: string
          vote_type: 'like' | 'dislike'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          story_id: string
          vote_type: 'like' | 'dislike'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          story_id?: string
          vote_type?: 'like' | 'dislike'
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          story_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          username: string
          password_hash: string
          created_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          username: string
          password_hash: string
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          username?: string
          password_hash?: string
          created_at?: string
          last_login?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user_cascade: {
        Args: {
          user_id_param: string
        }
        Returns: undefined
      }
      delete_story_cascade: {
        Args: {
          story_id_param: string
        }
        Returns: undefined
      }
      get_platform_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_login: {
        Args: {
          username_param: string
          password_param: string
        }
        Returns: {
          id: string
          username: string
          last_login: string | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}