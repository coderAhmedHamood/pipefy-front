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
          name: string
          avatar_url: string | null
          phone: string | null
          department: string | null
          position: string | null
          is_active: boolean
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          avatar_url?: string | null
          phone?: string | null
          department?: string | null
          position?: string | null
          is_active?: boolean
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          phone?: string | null
          department?: string | null
          position?: string | null
          is_active?: boolean
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          is_system_role: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_system_role?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_system_role?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      permissions: {
        Row: {
          id: string
          name: string
          resource: string
          action: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          resource: string
          action: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          resource?: string
          action?: string
          description?: string | null
          created_at?: string
        }
      }
      processes: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          icon: string
          is_active: boolean
          settings: Json
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          icon?: string
          is_active?: boolean
          settings?: Json
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          icon?: string
          is_active?: boolean
          settings?: Json
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      stages: {
        Row: {
          id: string
          process_id: string
          name: string
          description: string | null
          color: string
          priority: number
          is_initial: boolean
          is_final: boolean
          sla_hours: number | null
          required_permissions: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          process_id: string
          name: string
          description?: string | null
          color?: string
          priority: number
          is_initial?: boolean
          is_final?: boolean
          sla_hours?: number | null
          required_permissions?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          process_id?: string
          name?: string
          description?: string | null
          color?: string
          priority?: number
          is_initial?: boolean
          is_final?: boolean
          sla_hours?: number | null
          required_permissions?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      stage_transitions: {
        Row: {
          id: string
          from_stage_id: string
          to_stage_id: string
          transition_type: string
          conditions: Json
          required_permissions: string[]
          is_automatic: boolean
          is_default: boolean
          display_name: string | null
          confirmation_required: boolean
          created_at: string
        }
        Insert: {
          id?: string
          from_stage_id: string
          to_stage_id: string
          transition_type?: string
          conditions?: Json
          required_permissions?: string[]
          is_automatic?: boolean
          is_default?: boolean
          display_name?: string | null
          confirmation_required?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          from_stage_id?: string
          to_stage_id?: string
          transition_type?: string
          conditions?: Json
          required_permissions?: string[]
          is_automatic?: boolean
          is_default?: boolean
          display_name?: string | null
          confirmation_required?: boolean
          created_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          ticket_number: string | null
          title: string
          description: string | null
          process_id: string
          current_stage_id: string
          assigned_to: string | null
          created_by: string
          priority: string
          status: string
          due_date: string | null
          completed_at: string | null
          data: Json
          parent_ticket_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ticket_number?: string | null
          title: string
          description?: string | null
          process_id: string
          current_stage_id: string
          assigned_to?: string | null
          created_by: string
          priority?: string
          status?: string
          due_date?: string | null
          completed_at?: string | null
          data?: Json
          parent_ticket_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ticket_number?: string | null
          title?: string
          description?: string | null
          process_id?: string
          current_stage_id?: string
          assigned_to?: string | null
          created_by?: string
          priority?: string
          status?: string
          due_date?: string | null
          completed_at?: string | null
          data?: Json
          parent_ticket_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ticket_activities: {
        Row: {
          id: string
          ticket_id: string
          user_id: string
          activity_type: string
          description: string
          old_value: Json | null
          new_value: Json | null
          field_name: string | null
          data: Json
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          user_id: string
          activity_type: string
          description: string
          old_value?: Json | null
          new_value?: Json | null
          field_name?: string | null
          data?: Json
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          user_id?: string
          activity_type?: string
          description?: string
          old_value?: Json | null
          new_value?: Json | null
          field_name?: string | null
          data?: Json
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          notification_type: string
          is_read: boolean
          read_at: string | null
          data: Json
          action_url: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          notification_type: string
          is_read?: boolean
          read_at?: string | null
          data?: Json
          action_url?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          notification_type?: string
          is_read?: boolean
          read_at?: string | null
          data?: Json
          action_url?: string | null
          expires_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
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