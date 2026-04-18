export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audio_guestbook: {
        Row: {
          created_at: string
          duration_seconds: number | null
          event_id: string
          guest_id: string | null
          guest_name: string | null
          id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          event_id: string
          guest_id?: string | null
          guest_name?: string | null
          id?: string
          storage_path: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          event_id?: string
          guest_id?: string | null
          guest_name?: string | null
          id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_guestbook_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_guestbook_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "event_guests"
            referencedColumns: ["id"]
          },
        ]
      }
      event_guests: {
        Row: {
          claimed_by_user_id: string | null
          created_at: string
          event_id: string
          guest_identifier: string
          guest_name: string | null
          id: string
          snaps_remaining: number
        }
        Insert: {
          claimed_by_user_id?: string | null
          created_at?: string
          event_id: string
          guest_identifier: string
          guest_name?: string | null
          id?: string
          snaps_remaining?: number
        }
        Update: {
          claimed_by_user_id?: string | null
          created_at?: string
          event_id?: string
          guest_identifier?: string
          guest_name?: string | null
          id?: string
          snaps_remaining?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          allow_video: boolean
          countdown_seconds: number
          cover_photo_url: string | null
          created_at: string
          description: string | null
          event_date: string | null
          filter_preset: string
          gallery_type: Database["public"]["Enums"]["gallery_type"]
          host_id: string
          id: string
          is_active: boolean
          name: string
          qr_code_url: string | null
          reveal_date: string | null
          reveal_timing: Database["public"]["Enums"]["reveal_timing"]
          scavenger_prompts: string[] | null
          short_link: string | null
          snaps_per_guest: number
          theme_color: string | null
          updated_at: string
          watermark_enabled: boolean
          welcome_message: string | null
        }
        Insert: {
          allow_video?: boolean
          countdown_seconds?: number
          cover_photo_url?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          filter_preset?: string
          gallery_type?: Database["public"]["Enums"]["gallery_type"]
          host_id: string
          id?: string
          is_active?: boolean
          name: string
          qr_code_url?: string | null
          reveal_date?: string | null
          reveal_timing?: Database["public"]["Enums"]["reveal_timing"]
          scavenger_prompts?: string[] | null
          short_link?: string | null
          snaps_per_guest?: number
          theme_color?: string | null
          updated_at?: string
          watermark_enabled?: boolean
          welcome_message?: string | null
        }
        Update: {
          allow_video?: boolean
          countdown_seconds?: number
          cover_photo_url?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          filter_preset?: string
          gallery_type?: Database["public"]["Enums"]["gallery_type"]
          host_id?: string
          id?: string
          is_active?: boolean
          name?: string
          qr_code_url?: string | null
          reveal_date?: string | null
          reveal_timing?: Database["public"]["Enums"]["reveal_timing"]
          scavenger_prompts?: string[] | null
          short_link?: string | null
          snaps_per_guest?: number
          theme_color?: string | null
          updated_at?: string
          watermark_enabled?: boolean
          welcome_message?: string | null
        }
        Relationships: []
      }
      photo_likes: {
        Row: {
          created_at: string
          id: string
          liker_identifier: string
          photo_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liker_identifier: string
          photo_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liker_identifier?: string
          photo_id?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          ai_caption: string | null
          created_at: string
          event_id: string
          guest_id: string | null
          id: string
          is_flagged: boolean
          is_revealed: boolean
          media_type: string
          mood_tag: string | null
          storage_path: string
          thumbnail_path: string | null
        }
        Insert: {
          ai_caption?: string | null
          created_at?: string
          event_id: string
          guest_id?: string | null
          id?: string
          is_flagged?: boolean
          is_revealed?: boolean
          media_type?: string
          mood_tag?: string | null
          storage_path: string
          thumbnail_path?: string | null
        }
        Update: {
          ai_caption?: string | null
          created_at?: string
          event_id?: string
          guest_id?: string | null
          id?: string
          is_flagged?: boolean
          is_revealed?: boolean
          media_type?: string
          mood_tag?: string | null
          storage_path?: string
          thumbnail_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "event_guests"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country_code: string | null
          created_at: string
          display_name: string | null
          id: string
          preferred_currency: string | null
          referral_code: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_currency?: string | null
          referral_code?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_currency?: string | null
          referral_code?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          commission_ksh: number | null
          converted: boolean
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          commission_ksh?: number | null
          converted?: boolean
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          commission_ksh?: number | null
          converted?: boolean
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_kes: number | null
          created_at: string
          current_period_end: string | null
          id: string
          paystack_customer_id: string | null
          paystack_subscription_code: string | null
          plan_code: string | null
          provider: string
          reference: string | null
          status: string
          stripe_customer_id: string | null
          stripe_session_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_kes?: number | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          paystack_customer_id?: string | null
          paystack_subscription_code?: string | null
          plan_code?: string | null
          provider?: string
          reference?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_kes?: number | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          paystack_customer_id?: string | null
          paystack_subscription_code?: string | null
          plan_code?: string | null
          provider?: string
          reference?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      gallery_type: "shared" | "private"
      reveal_timing: "immediate" | "after_event" | "24h_delay" | "custom"
      subscription_tier: "free" | "starter" | "pro" | "platinum"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      gallery_type: ["shared", "private"],
      reveal_timing: ["immediate", "after_event", "24h_delay", "custom"],
      subscription_tier: ["free", "starter", "pro", "platinum"],
    },
  },
} as const
