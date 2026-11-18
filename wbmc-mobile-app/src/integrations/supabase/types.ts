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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_featured: boolean
          scheduled_at: string | null
          sort_order: number
          status: string
          submitted_by: string | null
          title: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean
          scheduled_at?: string | null
          sort_order?: number
          status?: string
          submitted_by?: string | null
          title: string
          type?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean
          scheduled_at?: string | null
          sort_order?: number
          status?: string
          submitted_by?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      bible_bookmarks: {
        Row: {
          book_name: string
          chapter_id: string
          chapter_reference: string
          created_at: string
          id: string
          label: string | null
          reminder_date: string | null
          user_id: string
        }
        Insert: {
          book_name: string
          chapter_id: string
          chapter_reference: string
          created_at?: string
          id?: string
          label?: string | null
          reminder_date?: string | null
          user_id: string
        }
        Update: {
          book_name?: string
          chapter_id?: string
          chapter_reference?: string
          created_at?: string
          id?: string
          label?: string | null
          reminder_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bible_chapter_cache: {
        Row: {
          chapter_id: string
          content: string
          fetched_at: string
          reference: string
        }
        Insert: {
          chapter_id: string
          content: string
          fetched_at?: string
          reference: string
        }
        Update: {
          chapter_id?: string
          content?: string
          fetched_at?: string
          reference?: string
        }
        Relationships: []
      }
      bible_highlights: {
        Row: {
          book_name: string
          chapter_id: string
          chapter_reference: string
          color: string
          created_at: string
          end_offset: number
          id: string
          selected_text: string
          start_offset: number
          user_id: string
        }
        Insert: {
          book_name: string
          chapter_id: string
          chapter_reference: string
          color: string
          created_at?: string
          end_offset?: number
          id?: string
          selected_text: string
          start_offset?: number
          user_id: string
        }
        Update: {
          book_name?: string
          chapter_id?: string
          chapter_reference?: string
          color?: string
          created_at?: string
          end_offset?: number
          id?: string
          selected_text?: string
          start_offset?: number
          user_id?: string
        }
        Relationships: []
      }
      bible_notes: {
        Row: {
          book_name: string
          chapter_id: string
          chapter_reference: string
          color: string
          content: string
          created_at: string
          id: string
          pinned: boolean
          reminder_date: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          book_name: string
          chapter_id: string
          chapter_reference: string
          color?: string
          content: string
          created_at?: string
          id?: string
          pinned?: boolean
          reminder_date?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          book_name?: string
          chapter_id?: string
          chapter_reference?: string
          color?: string
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          reminder_date?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      building_fund: {
        Row: {
          current_amount: number
          goal_amount: number
          id: string
          updated_at: string
        }
        Insert: {
          current_amount?: number
          goal_amount?: number
          id?: string
          updated_at?: string
        }
        Update: {
          current_amount?: number
          goal_amount?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_slides: {
        Row: {
          created_at: string
          google_drive_link: string
          id: string
          images: string[]
          mobile_images: string[]
          status: string
          submitted_by: string | null
          title: string
        }
        Insert: {
          created_at?: string
          google_drive_link: string
          id?: string
          images?: string[]
          mobile_images?: string[]
          status?: string
          submitted_by?: string | null
          title: string
        }
        Update: {
          created_at?: string
          google_drive_link?: string
          id?: string
          images?: string[]
          mobile_images?: string[]
          status?: string
          submitted_by?: string | null
          title?: string
        }
        Relationships: []
      }
      hymns: {
        Row: {
          created_at: string
          hymn_number: number
          id: string
          lyrics: string
          title: string
        }
        Insert: {
          created_at?: string
          hymn_number: number
          id?: string
          lyrics: string
          title: string
        }
        Update: {
          created_at?: string
          hymn_number?: number
          id?: string
          lyrics?: string
          title?: string
        }
        Relationships: []
      }
      marketplace_items: {
        Row: {
          category: string
          contact_info: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          price: number
          status: string
          subcategory: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          category: string
          contact_info?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          price: number
          status?: string
          subcategory?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          category?: string
          contact_info?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          price?: number
          status?: string
          subcategory?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      membership_applications: {
        Row: {
          address: string | null
          cell_number: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          declaration: boolean | null
          email: string | null
          family_members: Json | null
          full_name: string
          gender: string | null
          id: string
          is_baptized: boolean | null
          marital_status: string | null
          matched_user_id: string | null
          postal_code: string | null
          previous_church: string | null
          serving_ministries: Json | null
          signature: string | null
          source: string
          spouse: Json | null
          status: string
          updated_at: string
          wants_baptism: boolean | null
          work_number: string | null
        }
        Insert: {
          address?: string | null
          cell_number?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          declaration?: boolean | null
          email?: string | null
          family_members?: Json | null
          full_name: string
          gender?: string | null
          id?: string
          is_baptized?: boolean | null
          marital_status?: string | null
          matched_user_id?: string | null
          postal_code?: string | null
          previous_church?: string | null
          serving_ministries?: Json | null
          signature?: string | null
          source?: string
          spouse?: Json | null
          status?: string
          updated_at?: string
          wants_baptism?: boolean | null
          work_number?: string | null
        }
        Update: {
          address?: string | null
          cell_number?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          declaration?: boolean | null
          email?: string | null
          family_members?: Json | null
          full_name?: string
          gender?: string | null
          id?: string
          is_baptized?: boolean | null
          marital_status?: string | null
          matched_user_id?: string | null
          postal_code?: string | null
          previous_church?: string | null
          serving_ministries?: Json | null
          signature?: string | null
          source?: string
          spouse?: Json | null
          status?: string
          updated_at?: string
          wants_baptism?: boolean | null
          work_number?: string | null
        }
        Relationships: []
      }
      mentorship_applications: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          details: Json | null
          education_level: string | null
          email: string
          first_name: string
          id: string
          interests: string | null
          last_name: string
          matched_user_id: string | null
          max_mentees: number | null
          phone: string
          role: string
          selected_both: boolean
          sessions_per_month: number | null
          starting_role: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          details?: Json | null
          education_level?: string | null
          email: string
          first_name: string
          id?: string
          interests?: string | null
          last_name: string
          matched_user_id?: string | null
          max_mentees?: number | null
          phone: string
          role: string
          selected_both?: boolean
          sessions_per_month?: number | null
          starting_role?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          details?: Json | null
          education_level?: string | null
          email?: string
          first_name?: string
          id?: string
          interests?: string | null
          last_name?: string
          matched_user_id?: string | null
          max_mentees?: number | null
          phone?: string
          role?: string
          selected_both?: boolean
          sessions_per_month?: number | null
          starting_role?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      mentorship_connections: {
        Row: {
          created_at: string
          id: string
          mentee_user_id: string
          mentor_application_id: string
          mentor_user_id: string | null
          message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentee_user_id: string
          mentor_application_id: string
          mentor_user_id?: string | null
          message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mentee_user_id?: string
          mentor_application_id?: string
          mentor_user_id?: string | null
          message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_connections_mentor_application_id_fkey"
            columns: ["mentor_application_id"]
            isOneToOne: false
            referencedRelation: "mentorship_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      ministries_cache: {
        Row: {
          data: Json
          fetched_at: string
          id: string
        }
        Insert: {
          data: Json
          fetched_at?: string
          id?: string
        }
        Update: {
          data?: Json
          fetched_at?: string
          id?: string
        }
        Relationships: []
      }
      pastor_post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pastor_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "pastor_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      pastor_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pastor_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "pastor_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      pastor_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          media_type: string | null
          media_urls: string[]
          scheduled_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_urls?: string[]
          scheduled_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_urls?: string[]
          scheduled_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          developer_applied_at: string | null
          developer_reason: string | null
          developer_skills: string | null
          developer_status: string
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_kids_account: boolean
          is_wbmc_member: boolean
          last_name: string | null
          membership_application_data: Json | null
          membership_applied_at: string | null
          membership_status: string
          mentorship_prompt_dismissals: number
          mentorship_role: string | null
          merchant_payment_proof_url: string | null
          merchant_status: string
          parent_email: string | null
          parent_full_name: string | null
          parent_phone: string | null
          phone_number: string | null
          updated_at: string
          user_id: string
          wants_mentorship: boolean
          wants_merchant: boolean
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          developer_applied_at?: string | null
          developer_reason?: string | null
          developer_skills?: string | null
          developer_status?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_kids_account?: boolean
          is_wbmc_member?: boolean
          last_name?: string | null
          membership_application_data?: Json | null
          membership_applied_at?: string | null
          membership_status?: string
          mentorship_prompt_dismissals?: number
          mentorship_role?: string | null
          merchant_payment_proof_url?: string | null
          merchant_status?: string
          parent_email?: string | null
          parent_full_name?: string | null
          parent_phone?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id: string
          wants_mentorship?: boolean
          wants_merchant?: boolean
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          developer_applied_at?: string | null
          developer_reason?: string | null
          developer_skills?: string | null
          developer_status?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_kids_account?: boolean
          is_wbmc_member?: boolean
          last_name?: string | null
          membership_application_data?: Json | null
          membership_applied_at?: string | null
          membership_status?: string
          mentorship_prompt_dismissals?: number
          mentorship_role?: string | null
          merchant_payment_proof_url?: string | null
          merchant_status?: string
          parent_email?: string | null
          parent_full_name?: string | null
          parent_phone?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id?: string
          wants_mentorship?: boolean
          wants_merchant?: boolean
        }
        Relationships: []
      }
      support_conversations: {
        Row: {
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          unread_for_admin: number
          unread_for_user: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          unread_for_admin?: number
          unread_for_user?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          unread_for_admin?: number
          unread_for_user?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          user_email: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          user_email?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          user_email?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
          sender_role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
          sender_role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
          user_name: string | null
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
          user_name?: string | null
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string
          user_name?: string | null
          video_id?: string
        }
        Relationships: []
      }
      video_likes: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          created_at: string
          id: string
          source: string
          status: string
          submitted_by: string | null
          thumbnail_url: string
          title: string
          youtube_url: string
          youtube_video_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          source?: string
          status?: string
          submitted_by?: string | null
          thumbnail_url: string
          title: string
          youtube_url: string
          youtube_video_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          source?: string
          status?: string
          submitted_by?: string | null
          thumbnail_url?: string
          title?: string
          youtube_url?: string
          youtube_video_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_self_mentorship_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      grant_mentorship_roles: {
        Args: {
          _role: string
          _selected_both: boolean
          _starting_role: string
          _user_id: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "general_user"
        | "approved_merchant"
        | "manager"
        | "admin"
        | "pastor"
        | "developer"
        | "mentor"
        | "mentee"
        | "church_member"
        | "kids"
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
      app_role: [
        "general_user",
        "approved_merchant",
        "manager",
        "admin",
        "pastor",
        "developer",
        "mentor",
        "mentee",
        "church_member",
        "kids",
      ],
    },
  },
} as const
