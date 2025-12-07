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
      app_settings: {
        Row: {
          id: string
          logo_url: string | null
          light_primary_color: string
          dark_primary_color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          logo_url?: string | null
          light_primary_color?: string
          dark_primary_color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          logo_url?: string | null
          light_primary_color?: string
          dark_primary_color?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          first_name: string | null
          last_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stages: {
        Row: {
          id: string
          name: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          order_index?: number
          created_at?: string
        }
      }
      sub_stages: {
        Row: {
          id: string
          stage_id: string
          name: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          stage_id: string
          name: string
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          stage_id?: string
          name?: string
          order_index?: number
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          customer_name: string
          phone: string
          email: string | null
          address: string
          total_amount: number
          current_stage_id: string | null
          current_sub_stage_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          phone: string
          email?: string | null
          address: string
          total_amount?: number
          current_stage_id?: string | null
          current_sub_stage_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          phone?: string
          email?: string | null
          address?: string
          total_amount?: number
          current_stage_id?: string | null
          current_sub_stage_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          project_id: string
          amount: number
          payment_date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          amount: number
          payment_date?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          amount?: number
          payment_date?: string
          notes?: string | null
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          project_id: string | null
          category: string
          amount: number
          expense_date: string
          description: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          category: string
          amount: number
          expense_date?: string
          description?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string | null
          category?: string
          amount?: number
          expense_date?: string
          description?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      project_stage_history: {
        Row: {
          id: string
          project_id: string
          stage_id: string
          sub_stage_id: string | null
          entered_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          project_id: string
          stage_id: string
          sub_stage_id?: string | null
          entered_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          stage_id?: string
          sub_stage_id?: string | null
          entered_at?: string
          notes?: string | null
        }
      }
      sub_stage_details: {
        Row: {
          id: string
          project_id: string
          stage_id: string
          sub_stage_id: string | null
          is_completed: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          stage_id: string
          sub_stage_id?: string | null
          is_completed?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          stage_id?: string
          sub_stage_id?: string | null
          is_completed?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sub_stage_comments: {
        Row: {
          id: string
          detail_id: string
          user_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          detail_id: string
          user_id?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          detail_id?: string
          user_id?: string | null
          content?: string
          created_at?: string
        }
      }
      sub_stage_files: {
        Row: {
          id: string
          detail_id: string
          user_id: string | null
          file_url: string
          file_name: string
          created_at: string
        }
        Insert: {
          id?: string
          detail_id: string
          user_id?: string | null
          file_url: string
          file_name: string
          created_at?: string
        }
        Update: {
          id?: string
          detail_id?: string
          user_id?: string | null
          file_url?: string
          file_name?: string
          created_at?: string
        }
      }
    }
    Views: {
      profiles_view: {
        Row: {
          id: string
          email: string
          raw_user_meta_data: Json
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}