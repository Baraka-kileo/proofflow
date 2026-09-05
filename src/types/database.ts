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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      applications: {
        Row: {
          ai_processing_consented_at: string | null
          buyer_organization_id: string
          created_at: string
          created_by: string
          currency: string
          id: string
          invoice_due_on: string | null
          invoice_issued_on: string | null
          invoice_number: string | null
          invoice_total_minor: number | null
          owner_organization_id: string
          purchase_order_reference: string | null
          requested_amount_minor: number | null
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_processing_consented_at?: string | null
          buyer_organization_id: string
          created_at?: string
          created_by: string
          currency?: string
          id?: string
          invoice_due_on?: string | null
          invoice_issued_on?: string | null
          invoice_number?: string | null
          invoice_total_minor?: number | null
          owner_organization_id: string
          purchase_order_reference?: string | null
          requested_amount_minor?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_processing_consented_at?: string | null
          buyer_organization_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          invoice_due_on?: string | null
          invoice_issued_on?: string | null
          invoice_number?: string | null
          invoice_total_minor?: number | null
          owner_organization_id?: string
          purchase_order_reference?: string | null
          requested_amount_minor?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_buyer_organization_id_fkey"
            columns: ["buyer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_owner_organization_id_fkey"
            columns: ["owner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_profile_id: string | null
          application_id: string | null
          created_at: string
          id: string
          metadata: Json
          organization_id: string
          resource_id: string
          resource_type: string
        }
        Insert: {
          action: string
          actor_profile_id?: string | null
          application_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          resource_id: string
          resource_type: string
        }
        Update: {
          action?: string
          actor_profile_id?: string | null
          application_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          resource_id?: string
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      confirmations: {
        Row: {
          amount_recognized: boolean | null
          application_id: string
          buyer_organization_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          delivery_received: boolean | null
          id: string
          order_recognized: boolean | null
          reason: string | null
          requested_at: string
          status: Database["public"]["Enums"]["confirmation_status"]
          updated_at: string
        }
        Insert: {
          amount_recognized?: boolean | null
          application_id: string
          buyer_organization_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          delivery_received?: boolean | null
          id?: string
          order_recognized?: boolean | null
          reason?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["confirmation_status"]
          updated_at?: string
        }
        Update: {
          amount_recognized?: boolean | null
          application_id?: string
          buyer_organization_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          delivery_received?: boolean | null
          id?: string
          order_recognized?: boolean | null
          reason?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["confirmation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "confirmations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmations_buyer_organization_id_fkey"
            columns: ["buyer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmations_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_fields: {
        Row: {
          confidence_bps: number | null
          created_at: string
          document_id: string
          field_name: string
          id: string
          normalized_value: Json | null
          review_status: Database["public"]["Enums"]["field_review_status"]
          reviewed_at: string | null
          reviewed_by: string | null
          source_value: Json | null
          updated_at: string
        }
        Insert: {
          confidence_bps?: number | null
          created_at?: string
          document_id: string
          field_name: string
          id?: string
          normalized_value?: Json | null
          review_status?: Database["public"]["Enums"]["field_review_status"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_value?: Json | null
          updated_at?: string
        }
        Update: {
          confidence_bps?: number | null
          created_at?: string
          document_id?: string
          field_name?: string
          id?: string
          normalized_value?: Json | null
          review_status?: Database["public"]["Enums"]["field_review_status"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_value?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_fields_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_fields_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          application_id: string
          byte_size: number
          created_at: string
          extraction_status: Database["public"]["Enums"]["extraction_status"]
          id: string
          kind: Database["public"]["Enums"]["document_kind"]
          mime_type: string
          original_filename: string
          owner_organization_id: string
          page_count: number | null
          sha256: string
          storage_path: string
          updated_at: string
          upload_completed_at: string | null
          uploaded_by: string
        }
        Insert: {
          application_id: string
          byte_size: number
          created_at?: string
          extraction_status?: Database["public"]["Enums"]["extraction_status"]
          id?: string
          kind: Database["public"]["Enums"]["document_kind"]
          mime_type: string
          original_filename: string
          owner_organization_id: string
          page_count?: number | null
          sha256: string
          storage_path: string
          updated_at?: string
          upload_completed_at?: string | null
          uploaded_by: string
        }
        Update: {
          application_id?: string
          byte_size?: number
          created_at?: string
          extraction_status?: Database["public"]["Enums"]["extraction_status"]
          id?: string
          kind?: Database["public"]["Enums"]["document_kind"]
          mime_type?: string
          original_filename?: string
          owner_organization_id?: string
          page_count?: number | null
          sha256?: string
          storage_path?: string
          updated_at?: string
          upload_completed_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_owner_organization_id_fkey"
            columns: ["owner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          profile_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          profile_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          advance_amount_minor: number
          application_id: string
          created_at: string
          currency: string
          expires_at: string
          fee_amount_minor: number
          fee_bps: number
          funder_organization_id: string
          id: string
          made_by: string
          net_advance_minor: number
          responded_at: string | null
          responded_by: string | null
          response_reason: string | null
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
        }
        Insert: {
          advance_amount_minor: number
          application_id: string
          created_at?: string
          currency?: string
          expires_at: string
          fee_amount_minor: number
          fee_bps: number
          funder_organization_id: string
          id?: string
          made_by: string
          net_advance_minor: number
          responded_at?: string | null
          responded_by?: string | null
          response_reason?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Update: {
          advance_amount_minor?: number
          application_id?: string
          created_at?: string
          currency?: string
          expires_at?: string
          fee_amount_minor?: number
          fee_bps?: number
          funder_organization_id?: string
          id?: string
          made_by?: string
          net_advance_minor?: number
          responded_at?: string | null
          responded_by?: string | null
          response_reason?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_funder_organization_id_fkey"
            columns: ["funder_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_made_by_fkey"
            columns: ["made_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          is_demo: boolean
          kind: Database["public"]["Enums"]["organization_kind"]
          name: string
          registration_number: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_demo?: boolean
          kind: Database["public"]["Enums"]["organization_kind"]
          name: string
          registration_number?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_demo?: boolean
          kind?: Database["public"]["Enums"]["organization_kind"]
          name?: string
          registration_number?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      verification_checks: {
        Row: {
          application_id: string
          created_at: string
          evidence: Json
          explanation: string
          id: string
          result: Database["public"]["Enums"]["check_result"]
          rule_code: string
          verification_run_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          evidence?: Json
          explanation: string
          id?: string
          result: Database["public"]["Enums"]["check_result"]
          rule_code: string
          verification_run_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          evidence?: Json
          explanation?: string
          id?: string
          result?: Database["public"]["Enums"]["check_result"]
          rule_code?: string
          verification_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_checks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_checks_verification_run_id_fkey"
            columns: ["verification_run_id"]
            isOneToOne: false
            referencedRelation: "verification_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_runs: {
        Row: {
          application_id: string
          completed_at: string | null
          created_at: string
          id: string
          initiated_by: string
          started_at: string | null
          status: Database["public"]["Enums"]["verification_run_status"]
          updated_at: string
        }
        Insert: {
          application_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          initiated_by: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["verification_run_status"]
          updated_at?: string
        }
        Update: {
          application_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          initiated_by?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["verification_run_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_runs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_runs_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_sme_application: {
        Args: { target_application_id: string }
        Returns: boolean
      }
      can_read_application: {
        Args: { target_application_id: string }
        Returns: boolean
      }
      can_read_application_document: {
        Args: { object_name: string }
        Returns: boolean
      }
      can_write_application_document: {
        Args: { object_name: string }
        Returns: boolean
      }
      has_organization_role: {
        Args: {
          target_organization_id: string
          target_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      record_exact_document_duplicate: {
        Args: {
          attempted_filename: string
          content_sha256: string
          target_application_id: string
        }
        Returns: string
      }
    }
    Enums: {
      application_status:
        | "draft"
        | "documents_uploaded"
        | "fields_extracted"
        | "sme_reviewed"
        | "checks_complete"
        | "buyer_pending"
        | "buyer_confirmed"
        | "buyer_disputed"
        | "funder_review"
        | "offer_made"
        | "offer_accepted"
        | "offer_declined"
        | "funded_simulated"
      check_result: "pass" | "review" | "fail"
      confirmation_status: "pending" | "confirmed" | "disputed"
      document_kind: "purchase_order" | "delivery_evidence" | "invoice"
      extraction_status:
        | "pending"
        | "processing"
        | "extracted"
        | "reviewed"
        | "failed"
      field_review_status: "unreviewed" | "accepted" | "corrected"
      offer_status: "draft" | "offered" | "accepted" | "declined" | "expired"
      organization_kind: "sme" | "buyer" | "funder"
      user_role: "sme" | "buyer" | "funder"
      verification_run_status: "pending" | "running" | "completed" | "failed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      application_status: [
        "draft",
        "documents_uploaded",
        "fields_extracted",
        "sme_reviewed",
        "checks_complete",
        "buyer_pending",
        "buyer_confirmed",
        "buyer_disputed",
        "funder_review",
        "offer_made",
        "offer_accepted",
        "offer_declined",
        "funded_simulated",
      ],
      check_result: ["pass", "review", "fail"],
      confirmation_status: ["pending", "confirmed", "disputed"],
      document_kind: ["purchase_order", "delivery_evidence", "invoice"],
      extraction_status: [
        "pending",
        "processing",
        "extracted",
        "reviewed",
        "failed",
      ],
      field_review_status: ["unreviewed", "accepted", "corrected"],
      offer_status: ["draft", "offered", "accepted", "declined", "expired"],
      organization_kind: ["sme", "buyer", "funder"],
      user_role: ["sme", "buyer", "funder"],
      verification_run_status: ["pending", "running", "completed", "failed"],
    },
  },
} as const
