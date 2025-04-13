export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      allergies: {
        Row: {
          created_at: string
          id: string
          name: string
          reaction: string | null
          severity: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          reaction?: string | null
          severity?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          reaction?: string | null
          severity?: string | null
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          issue: string | null
          notes: string | null
          patient_id: string
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          issue?: string | null
          notes?: string | null
          patient_id: string
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          issue?: string | null
          notes?: string | null
          patient_id?: string
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      doctors: {
        Row: {
          availability: Json | null
          created_at: string
          experience_years: number | null
          id: string
          qualification: string | null
          specialty: string
        }
        Insert: {
          availability?: Json | null
          created_at?: string
          experience_years?: number | null
          id: string
          qualification?: string | null
          specialty: string
        }
        Update: {
          availability?: Json | null
          created_at?: string
          experience_years?: number | null
          id?: string
          qualification?: string | null
          specialty?: string
        }
        Relationships: []
      }
      medical_conditions: {
        Row: {
          created_at: string
          diagnosed_date: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          diagnosed_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          diagnosed_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      medical_events: {
        Row: {
          created_at: string
          date: string
          description: string | null
          id: string
          related_file_url: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          related_file_url?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          related_file_url?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      medications: {
        Row: {
          created_at: string
          dosage: string | null
          end_date: string | null
          frequency: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          name: string
          start_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          name: string
          start_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          name?: string
          start_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_type: string | null
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_type?: string | null
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_type?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          appointment_id: string | null
          content: string
          created_at: string
          doctor_id: string
          id: string
          is_sent: boolean | null
          patient_id: string
          prescription: string | null
          title: string
          updated_at: string
          visit_summary: string | null
        }
        Insert: {
          appointment_id?: string | null
          content: string
          created_at?: string
          doctor_id: string
          id?: string
          is_sent?: boolean | null
          patient_id: string
          prescription?: string | null
          title: string
          updated_at?: string
          visit_summary?: string | null
        }
        Update: {
          appointment_id?: string | null
          content?: string
          created_at?: string
          doctor_id?: string
          id?: string
          is_sent?: boolean | null
          patient_id?: string
          prescription?: string | null
          title?: string
          updated_at?: string
          visit_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
