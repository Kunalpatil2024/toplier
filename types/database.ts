import type { Category } from "@/lib/constants";

export type Listing = {
  id: string;
  name: string;
  description: string;
  website_url: string;
  category: Category;
  displayCategory?: string;
  twitter_url: string | null;
  logo_url: string | null;
  rank_value: number;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
};

export type ListingInsert = Omit<Listing, "id" | "created_at" | "updated_at" | "owner_id">;

export type UserProfile = {
  id: string;
  email: string;
  created_at: string;
};

export type ClimbEvent = {
  id: string;
  listing_id: string;
  previous_rank_value: number;
  new_rank_value: number;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      listings: {
        Row: Listing;
        Insert: ListingInsert;
        Update: Partial<ListingInsert>;
        Relationships: [];
      };
      users: {
        Row: UserProfile;
        Insert: Pick<UserProfile, "id" | "email">;
        Update: Partial<Pick<UserProfile, "email">>;
        Relationships: [];
      };
      climb_events: {
        Row: ClimbEvent;
        Insert: Omit<ClimbEvent, "id" | "created_at" | "razorpay_payment_id" | "razorpay_order_id"> & {
          razorpay_payment_id?: string | null;
          razorpay_order_id?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      leaderboard_settings: {
        Row: { id: boolean; minimum_increment: number };
        Insert: { id?: boolean; minimum_increment?: number };
        Update: { minimum_increment?: number };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_listing: {
        Args: {
          p_name: string;
          p_description: string;
          p_website_url: string;
          p_category: string;
          p_twitter_url: string | null;
          p_logo_url: string | null;
          p_rank_value: number;
        };
        Returns: string;
      };
      complete_paid_climb: {
        Args: {
          p_listing_id: string;
          p_user_id: string;
          p_new_rank_value: number;
          p_razorpay_payment_id: string;
          p_razorpay_order_id: string;
        };
        Returns: { new_rank_value: number; next_required_value: number }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};