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
      audit_logs: {
        Row: {
          action: string
          basin: string | null
          created_at: string
          details: Json
          id: number
          project_id: number | null
          si_code: string | null
          user_session: string | null
        }
        Insert: {
          action: string
          basin?: string | null
          created_at?: string
          details?: Json
          id?: number
          project_id?: number | null
          si_code?: string | null
          user_session?: string | null
        }
        Update: {
          action?: string
          basin?: string | null
          created_at?: string
          details?: Json
          id?: number
          project_id?: number | null
          si_code?: string | null
          user_session?: string | null
        }
        Relationships: []
      }
      processing_records: {
        Row: {
          azimuth: string | null
          bbox_max_lat: number | null
          bbox_max_lon: number | null
          bbox_min_lat: number | null
          bbox_min_lon: number | null
          centroid_lat: number | null
          centroid_lon: number | null
          corners: Json
          created_at: string
          flagged_for_review: boolean
          fold: string | null
          g1_il: number | null
          g1_x: number | null
          g1_xl: number | null
          g1_y: number | null
          g2_il: number | null
          g2_x: number | null
          g2_xl: number | null
          g2_y: number | null
          g3_il: number | null
          g3_x: number | null
          g3_xl: number | null
          g3_y: number | null
          g4_il: number | null
          g4_x: number | null
          g4_xl: number | null
          g4_y: number | null
          geometry_notes: string[]
          geometry_status: string | null
          id: number
          is_mapped: boolean
          processing_bin: string | null
          project_id: number
          project_timeline: string | null
          project_year: string | null
          projection: string | null
          quantum_skm: number | null
          quantum_slkm: number | null
          record_length: string | null
          sampling_interval: string | null
          si_code: string | null
          spheroid: string | null
          type_of_processing: string | null
          utm_zone: string | null
        }
        Insert: {
          azimuth?: string | null
          bbox_max_lat?: number | null
          bbox_max_lon?: number | null
          bbox_min_lat?: number | null
          bbox_min_lon?: number | null
          centroid_lat?: number | null
          centroid_lon?: number | null
          corners?: Json
          created_at?: string
          flagged_for_review?: boolean
          fold?: string | null
          g1_il?: number | null
          g1_x?: number | null
          g1_xl?: number | null
          g1_y?: number | null
          g2_il?: number | null
          g2_x?: number | null
          g2_xl?: number | null
          g2_y?: number | null
          g3_il?: number | null
          g3_x?: number | null
          g3_xl?: number | null
          g3_y?: number | null
          g4_il?: number | null
          g4_x?: number | null
          g4_xl?: number | null
          g4_y?: number | null
          geometry_notes?: string[]
          geometry_status?: string | null
          id?: number
          is_mapped?: boolean
          processing_bin?: string | null
          project_id: number
          project_timeline?: string | null
          project_year?: string | null
          projection?: string | null
          quantum_skm?: number | null
          quantum_slkm?: number | null
          record_length?: string | null
          sampling_interval?: string | null
          si_code?: string | null
          spheroid?: string | null
          type_of_processing?: string | null
          utm_zone?: string | null
        }
        Update: {
          azimuth?: string | null
          bbox_max_lat?: number | null
          bbox_max_lon?: number | null
          bbox_min_lat?: number | null
          bbox_min_lon?: number | null
          centroid_lat?: number | null
          centroid_lon?: number | null
          corners?: Json
          created_at?: string
          flagged_for_review?: boolean
          fold?: string | null
          g1_il?: number | null
          g1_x?: number | null
          g1_xl?: number | null
          g1_y?: number | null
          g2_il?: number | null
          g2_x?: number | null
          g2_xl?: number | null
          g2_y?: number | null
          g3_il?: number | null
          g3_x?: number | null
          g3_xl?: number | null
          g3_y?: number | null
          g4_il?: number | null
          g4_x?: number | null
          g4_xl?: number | null
          g4_y?: number | null
          geometry_notes?: string[]
          geometry_status?: string | null
          id?: number
          is_mapped?: boolean
          processing_bin?: string | null
          project_id?: number
          project_timeline?: string | null
          project_year?: string | null
          projection?: string | null
          quantum_skm?: number | null
          quantum_slkm?: number | null
          record_length?: string | null
          sampling_interval?: string | null
          si_code?: string | null
          spheroid?: string | null
          type_of_processing?: string | null
          utm_zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processing_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_reports: {
        Row: {
          created_at: string
          file_name: string | null
          id: number
          project_id: number
          report_path: string | null
          report_type: string | null
          si_code: string | null
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          id?: number
          project_id: number
          report_path?: string | null
          report_type?: string | null
          si_code?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string | null
          id?: number
          project_id?: number
          report_path?: string | null
          report_type?: string | null
          si_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      projects: {
        Row: {
          basin: string | null
          created_at: string
          data_dimension: string | null
          project_id: number
          project_name: string
          project_type: string | null
        }
        Insert: {
          basin?: string | null
          created_at?: string
          data_dimension?: string | null
          project_id: number
          project_name: string
          project_type?: string | null
        }
        Update: {
          basin?: string | null
          created_at?: string
          data_dimension?: string | null
          project_id?: number
          project_name?: string
          project_type?: string | null
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
