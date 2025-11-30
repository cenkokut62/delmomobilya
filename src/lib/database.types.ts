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
    }
  }
}
