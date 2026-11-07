export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          details: string | null;
          id: string;
          resource: string | null;
          result: string;
          role: string;
          user_name: string;
        };
        Insert: {
          action: string;
          created_at?: string;
          details?: string | null;
          id: string;
          resource?: string | null;
          result?: string;
          role: string;
          user_name: string;
        };
        Update: {
          action?: string;
          created_at?: string;
          details?: string | null;
          id?: string;
          resource?: string | null;
          result?: string;
          role?: string;
          user_name?: string;
        };
        Relationships: [];
      };
      cases: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          investigator: string;
          location: string | null;
          priority: string;
          status: string;
          title: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id: string;
          investigator: string;
          location?: string | null;
          priority?: string;
          status?: string;
          title: string;
          type?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          investigator?: string;
          location?: string | null;
          priority?: string;
          status?: string;
          title?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      custody_events: {
        Row: {
          action: string;
          created_at: string;
          evidence_id: string;
          id: string;
          ip_address: string | null;
          remarks: string | null;
          role: string;
          status: string | null;
          user_name: string;
        };
        Insert: {
          action: string;
          created_at?: string;
          evidence_id: string;
          id: string;
          ip_address?: string | null;
          remarks?: string | null;
          role: string;
          status?: string | null;
          user_name: string;
        };
        Update: {
          action?: string;
          created_at?: string;
          evidence_id?: string;
          id?: string;
          ip_address?: string | null;
          remarks?: string | null;
          role?: string;
          status?: string | null;
          user_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "custody_events_evidence_id_fkey";
            columns: ["evidence_id"];
            isOneToOne: false;
            referencedRelation: "evidence";
            referencedColumns: ["id"];
          },
        ];
      };
      evidence: {
        Row: {
          case_id: string;
          collected_by: string | null;
          collection_date: string | null;
          collection_location: string | null;
          collection_time: string | null;
          created_at: string;
          current_hash: string | null;
          description: string | null;
          encryption_status: string;
          file_size: number;
          id: string;
          integrity_status: string;
          last_verified: string | null;
          mime_type: string | null;
          name: string;
          original_hash: string | null;
          priority: string;
          processed_at: string | null;
          processed_by: string | null;
          processing_status: string;
          remarks: string | null;
          storage_path: string;
          storage_status: string | null;
          type: string;
          uploaded_by: string | null;
          uploaded_date: string;
        };
        Insert: {
          case_id: string;
          collected_by?: string | null;
          collection_date?: string | null;
          collection_location?: string | null;
          collection_time?: string | null;
          created_at?: string;
          current_hash?: string | null;
          description?: string | null;
          encryption_status?: string;
          file_size?: number;
          id: string;
          integrity_status?: string;
          last_verified?: string | null;
          mime_type?: string | null;
          name: string;
          original_hash?: string | null;
          priority?: string;
          processed_at?: string | null;
          processed_by?: string | null;
          processing_status?: string;
          remarks?: string | null;
          storage_path: string;
          storage_status?: string | null;
          type?: string;
          uploaded_by?: string | null;
          uploaded_date?: string;
        };
        Update: {
          case_id?: string;
          collected_by?: string | null;
          collection_date?: string | null;
          collection_location?: string | null;
          collection_time?: string | null;
          created_at?: string;
          current_hash?: string | null;
          description?: string | null;
          encryption_status?: string;
          file_size?: number;
          id?: string;
          integrity_status?: string;
          last_verified?: string | null;
          mime_type?: string | null;
          name?: string;
          original_hash?: string | null;
          priority?: string;
          processed_at?: string | null;
          processed_by?: string | null;
          processing_status?: string;
          remarks?: string | null;
          storage_path?: string;
          storage_status?: string | null;
          type?: string;
          uploaded_by?: string | null;
          uploaded_date?: string;
        };
        Relationships: [];
      };
      images: {
        Row: {
          created_at: string;
          file_size: number;
          height: number | null;
          id: string;
          mime_type: string | null;
          name: string;
          owner: string;
          sha256: string;
          storage_path: string;
          width: number | null;
        };
        Insert: {
          created_at?: string;
          file_size?: number;
          height?: number | null;
          id?: string;
          mime_type?: string | null;
          name: string;
          owner: string;
          sha256: string;
          storage_path: string;
          width?: number | null;
        };
        Update: {
          created_at?: string;
          file_size?: number;
          height?: number | null;
          id?: string;
          mime_type?: string | null;
          name?: string;
          owner?: string;
          sha256?: string;
          storage_path?: string;
          width?: number | null;
        };
        Relationships: [];
      };
      image_versions: {
        Row: {
          created_at: string;
          file_size: number;
          height: number | null;
          id: string;
          mime_type: string | null;
          name: string;
          original_image_id: string;
          owner: string;
          sha256: string;
          storage_path: string;
          version_number: number;
          width: number | null;
        };
        Insert: {
          created_at?: string;
          file_size?: number;
          height?: number | null;
          id?: string;
          mime_type?: string | null;
          name: string;
          original_image_id: string;
          owner: string;
          sha256: string;
          storage_path: string;
          version_number: number;
          width?: number | null;
        };
        Update: {
          created_at?: string;
          file_size?: number;
          height?: number | null;
          id?: string;
          mime_type?: string | null;
          name?: string;
          original_image_id?: string;
          owner?: string;
          sha256?: string;
          storage_path?: string;
          version_number?: number;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "image_versions_original_image_id_fkey";
            columns: ["original_image_id"];
            isOneToOne: false;
            referencedRelation: "images";
            referencedColumns: ["id"];
          },
        ];
      };
      duplicate_uploads: {
        Row: {
          created_at: string;
          existing_image_id: string;
          id: string;
          owner: string;
          sha256: string;
          upload_name: string;
        };
        Insert: {
          created_at?: string;
          existing_image_id: string;
          id?: string;
          owner: string;
          sha256: string;
          upload_name: string;
        };
        Update: {
          created_at?: string;
          existing_image_id?: string;
          id?: string;
          owner?: string;
          sha256?: string;
          upload_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "duplicate_uploads_existing_image_id_fkey";
            columns: ["existing_image_id"];
            isOneToOne: false;
            referencedRelation: "images";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          last_login_at: string | null;
          name: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id: string;
          last_login_at?: string | null;
          name?: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          last_login_at?: string | null;
          name?: string;
          status?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      verifications: {
        Row: {
          analysis_summary: string | null;
          check_file_size: number;
          check_mime_type: string | null;
          check_name: string;
          check_height: number | null;
          check_sha256: string;
          check_storage_path: string;
          check_width: number | null;
          created_at: string;
          difference_percent: number | null;
          id: string;
          matched: boolean;
          original_image_id: string;
          original_height: number | null;
          original_name: string;
          original_sha256: string;
          original_width: number | null;
          owner: string;
          visual_similarity: number | null;
        };
        Insert: {
          analysis_summary?: string | null;
          check_file_size?: number;
          check_mime_type?: string | null;
          check_name: string;
          check_height?: number | null;
          check_sha256: string;
          check_storage_path: string;
          check_width?: number | null;
          created_at?: string;
          difference_percent?: number | null;
          id?: string;
          matched: boolean;
          original_image_id: string;
          original_height?: number | null;
          original_name: string;
          original_sha256: string;
          original_width?: number | null;
          owner: string;
          visual_similarity?: number | null;
        };
        Update: {
          analysis_summary?: string | null;
          check_file_size?: number;
          check_mime_type?: string | null;
          check_name?: string;
          check_height?: number | null;
          check_sha256?: string;
          check_storage_path?: string;
          check_width?: number | null;
          created_at?: string;
          difference_percent?: number | null;
          id?: string;
          matched?: boolean;
          original_image_id?: string;
          original_height?: number | null;
          original_name?: string;
          original_sha256?: string;
          original_width?: number | null;
          owner?: string;
          visual_similarity?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "verifications_original_image_id_fkey";
            columns: ["original_image_id"];
            isOneToOne: false;
            referencedRelation: "images";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_set_user_status: {
        Args: { _status: string; _user_id: string };
        Returns: undefined;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_admin: { Args: never; Returns: boolean };
      list_all_users: {
        Args: never;
        Returns: {
          created_at: string;
          email: string;
          id: string;
          last_login_at: string;
          name: string;
          role: string;
          status: string;
        }[];
      };
      set_user_status: {
        Args: { p_status: string; p_user_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "ADMIN" | "INVESTIGATOR" | "AUDITOR" | "LEGAL_OFFICER" | "SYSTEM";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["ADMIN", "INVESTIGATOR", "AUDITOR", "LEGAL_OFFICER", "SYSTEM"],
    },
  },
} as const;
