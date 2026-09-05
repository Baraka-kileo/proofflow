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
          normalized_invoice_number: string | null
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
          normalized_invoice_number?: string | null
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
          normalized_invoice_number?: string | null
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
          answer_explanations: Json | null
          answers: Json | null
          application_id: string
          approval_id: string | null
          buyer_organization_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_payload_hash: string | null
          declaration_version: string | null
          delivery_received: boolean | null
          id: string
          order_recognized: boolean | null
          reason: string | null
          representative_company: string | null
          representative_email: string | null
          representative_job_title: string | null
          representative_name: string | null
          requested_at: string
          signature_strokes: Json | null
          status: Database["public"]["Enums"]["confirmation_status"]
          transaction_snapshot: Json | null
          updated_at: string
        }
        Insert: {
          amount_recognized?: boolean | null
          answer_explanations?: Json | null
          answers?: Json | null
          application_id: string
          approval_id?: string | null
          buyer_organization_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_payload_hash?: string | null
          declaration_version?: string | null
          delivery_received?: boolean | null
          id?: string
          order_recognized?: boolean | null
          reason?: string | null
          representative_company?: string | null
          representative_email?: string | null
          representative_job_title?: string | null
          representative_name?: string | null
          requested_at?: string
          signature_strokes?: Json | null
          status?: Database["public"]["Enums"]["confirmation_status"]
          transaction_snapshot?: Json | null
          updated_at?: string
        }
        Update: {
          amount_recognized?: boolean | null
          answer_explanations?: Json | null
          answers?: Json | null
          application_id?: string
          approval_id?: string | null
          buyer_organization_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_payload_hash?: string | null
          declaration_version?: string | null
          delivery_received?: boolean | null
          id?: string
          order_recognized?: boolean | null
          reason?: string | null
          representative_company?: string | null
          representative_email?: string | null
          representative_job_title?: string | null
          representative_name?: string | null
          requested_at?: string
          signature_strokes?: Json | null
          status?: Database["public"]["Enums"]["confirmation_status"]
          transaction_snapshot?: Json | null
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
          source_label: string | null
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
          source_label?: string | null
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
          source_label?: string | null
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
          extraction_completed_at: string | null
          extraction_error_code: string | null
          extraction_model: string | null
          extraction_provider: string | null
          extraction_provider_metadata: Json | null
          extraction_response: Json | null
          extraction_schema_version: string | null
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
          extraction_completed_at?: string | null
          extraction_error_code?: string | null
          extraction_model?: string | null
          extraction_provider?: string | null
          extraction_provider_metadata?: Json | null
          extraction_response?: Json | null
          extraction_schema_version?: string | null
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
          extraction_completed_at?: string | null
          extraction_error_code?: string | null
          extraction_model?: string | null
          extraction_provider?: string | null
          extraction_provider_metadata?: Json | null
          extraction_response?: Json | null
          extraction_schema_version?: string | null
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
      external_evidence_snapshots: {
        Row: {
          application_id: string
          canonical_evidence: Json
          created_at: string
          external_invoice_id: string | null
          external_po_id: string | null
          external_supplier_id: string | null
          id: string
          payload_hash: string
          provider: Database["public"]["Enums"]["integration_provider"]
          provider_mode: Database["public"]["Enums"]["integration_mode"]
          retrieved_at: string
          sync_run_id: string
        }
        Insert: {
          application_id: string
          canonical_evidence: Json
          created_at?: string
          external_invoice_id?: string | null
          external_po_id?: string | null
          external_supplier_id?: string | null
          id?: string
          payload_hash: string
          provider: Database["public"]["Enums"]["integration_provider"]
          provider_mode: Database["public"]["Enums"]["integration_mode"]
          retrieved_at: string
          sync_run_id: string
        }
        Update: {
          application_id?: string
          canonical_evidence?: Json
          created_at?: string
          external_invoice_id?: string | null
          external_po_id?: string | null
          external_supplier_id?: string | null
          id?: string
          payload_hash?: string
          provider?: Database["public"]["Enums"]["integration_provider"]
          provider_mode?: Database["public"]["Enums"]["integration_mode"]
          retrieved_at?: string
          sync_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_evidence_snapshots_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_evidence_snapshots_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: true
            referencedRelation: "integration_sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_checks: {
        Row: {
          application_id: string
          created_at: string
          evidence: Json
          explanation: string
          id: string
          result: Database["public"]["Enums"]["check_result"]
          rule_code: string
          sync_run_id: string
          title: string
        }
        Insert: {
          application_id: string
          created_at?: string
          evidence?: Json
          explanation: string
          id?: string
          result: Database["public"]["Enums"]["check_result"]
          rule_code: string
          sync_run_id: string
          title: string
        }
        Update: {
          application_id?: string
          created_at?: string
          evidence?: Json
          explanation?: string
          id?: string
          result?: Database["public"]["Enums"]["check_result"]
          rule_code?: string
          sync_run_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_checks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_checks_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "integration_sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_connections: {
        Row: {
          buyer_organization_id: string
          connected_at: string
          connected_by: string | null
          created_at: string
          credential_reference: string | null
          demo_scenario: string
          id: string
          instance_url: string | null
          last_error_code: string | null
          last_successful_sync_at: string | null
          mode: Database["public"]["Enums"]["integration_mode"]
          provider: Database["public"]["Enums"]["integration_provider"]
          status: Database["public"]["Enums"]["integration_connection_status"]
          updated_at: string
        }
        Insert: {
          buyer_organization_id: string
          connected_at?: string
          connected_by?: string | null
          created_at?: string
          credential_reference?: string | null
          demo_scenario?: string
          id?: string
          instance_url?: string | null
          last_error_code?: string | null
          last_successful_sync_at?: string | null
          mode?: Database["public"]["Enums"]["integration_mode"]
          provider: Database["public"]["Enums"]["integration_provider"]
          status?: Database["public"]["Enums"]["integration_connection_status"]
          updated_at?: string
        }
        Update: {
          buyer_organization_id?: string
          connected_at?: string
          connected_by?: string | null
          created_at?: string
          credential_reference?: string | null
          demo_scenario?: string
          id?: string
          instance_url?: string | null
          last_error_code?: string | null
          last_successful_sync_at?: string | null
          mode?: Database["public"]["Enums"]["integration_mode"]
          provider?: Database["public"]["Enums"]["integration_provider"]
          status?: Database["public"]["Enums"]["integration_connection_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_connections_buyer_organization_id_fkey"
            columns: ["buyer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_connections_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_exception_resolutions: {
        Row: {
          application_id: string
          choice: Database["public"]["Enums"]["integration_resolution_choice"]
          explanation: string | null
          id: string
          integration_check_id: string
          resolved_at: string
          resolved_by: string
        }
        Insert: {
          application_id: string
          choice: Database["public"]["Enums"]["integration_resolution_choice"]
          explanation?: string | null
          id?: string
          integration_check_id: string
          resolved_at?: string
          resolved_by: string
        }
        Update: {
          application_id?: string
          choice?: Database["public"]["Enums"]["integration_resolution_choice"]
          explanation?: string | null
          id?: string
          integration_check_id?: string
          resolved_at?: string
          resolved_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_exception_resolutions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_exception_resolutions_integration_check_id_fkey"
            columns: ["integration_check_id"]
            isOneToOne: true
            referencedRelation: "integration_checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_exception_resolutions_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_sync_runs: {
        Row: {
          application_id: string
          completed_at: string | null
          connection_id: string
          correlation_id: string
          created_at: string
          error_code: string | null
          id: string
          idempotency_key: string
          outcome: Database["public"]["Enums"]["integration_outcome"] | null
          started_at: string
          status: Database["public"]["Enums"]["integration_sync_status"]
        }
        Insert: {
          application_id: string
          completed_at?: string | null
          connection_id: string
          correlation_id: string
          created_at?: string
          error_code?: string | null
          id?: string
          idempotency_key: string
          outcome?: Database["public"]["Enums"]["integration_outcome"] | null
          started_at?: string
          status: Database["public"]["Enums"]["integration_sync_status"]
        }
        Update: {
          application_id?: string
          completed_at?: string | null
          connection_id?: string
          correlation_id?: string
          created_at?: string
          error_code?: string | null
          id?: string
          idempotency_key?: string
          outcome?: Database["public"]["Enums"]["integration_outcome"] | null
          started_at?: string
          status?: Database["public"]["Enums"]["integration_sync_status"]
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_runs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_sync_runs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
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
          advance_bps: number
          application_id: string
          created_at: string
          currency: string
          decision_kind: string
          decision_payload_hash: string | null
          expires_at: string
          fee_amount_minor: number
          fee_bps: number
          funder_organization_id: string
          id: string
          invoice_amount_minor: number | null
          made_by: string
          net_advance_minor: number
          payment_due_on: string | null
          responded_at: string | null
          responded_by: string | null
          response_reason: string | null
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
        }
        Insert: {
          advance_amount_minor: number
          advance_bps?: number
          application_id: string
          created_at?: string
          currency?: string
          decision_kind?: string
          decision_payload_hash?: string | null
          expires_at: string
          fee_amount_minor: number
          fee_bps: number
          funder_organization_id: string
          id?: string
          invoice_amount_minor?: number | null
          made_by: string
          net_advance_minor: number
          payment_due_on?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response_reason?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Update: {
          advance_amount_minor?: number
          advance_bps?: number
          application_id?: string
          created_at?: string
          currency?: string
          decision_kind?: string
          decision_payload_hash?: string | null
          expires_at?: string
          fee_amount_minor?: number
          fee_bps?: number
          funder_organization_id?: string
          id?: string
          invoice_amount_minor?: number | null
          made_by?: string
          net_advance_minor?: number
          payment_due_on?: string | null
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
      supplier_mappings: {
        Row: {
          buyer_organization_id: string
          connection_id: string
          created_at: string
          external_supplier_id: string
          external_supplier_name: string
          id: string
          sme_organization_id: string
          status: string
          verified_at: string | null
        }
        Insert: {
          buyer_organization_id: string
          connection_id: string
          created_at?: string
          external_supplier_id: string
          external_supplier_name: string
          id?: string
          sme_organization_id: string
          status?: string
          verified_at?: string | null
        }
        Update: {
          buyer_organization_id?: string
          connection_id?: string
          created_at?: string
          external_supplier_id?: string
          external_supplier_name?: string
          id?: string
          sme_organization_id?: string
          status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_mappings_buyer_organization_id_fkey"
            columns: ["buyer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_mappings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_mappings_sme_organization_id_fkey"
            columns: ["sme_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          overall_result: Database["public"]["Enums"]["check_result"] | null
          rule_version: string | null
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
          overall_result?: Database["public"]["Enums"]["check_result"] | null
          rule_version?: string | null
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
          overall_result?: Database["public"]["Enums"]["check_result"] | null
          rule_version?: string | null
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
      complete_simulated_funding: {
        Args: { target_offer_id: string }
        Returns: Json
      }
      create_funder_decision_v1: {
        Args: {
          target_advance_bps?: number
          target_application_id: string
          target_decline_reason?: string
          target_expiry_date?: string
          target_fee_bps?: number
        }
        Returns: Json
      }
      get_demo_coupa_context: {
        Args: { target_application_id: string }
        Returns: Json
      }
      has_organization_role: {
        Args: {
          target_organization_id: string
          target_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      persist_demo_coupa_result_v1: {
        Args: {
          target_application_id: string
          target_checks: Json
          target_connection_id: string
          target_correlation_id: string
          target_error_code?: string
          target_evidence: Json
          target_idempotency_key: string
          target_outcome: Database["public"]["Enums"]["integration_outcome"]
        }
        Returns: Json
      }
      persist_document_extraction_v1: {
        Args: {
          normalized_fields: Json
          provider_metadata: Json
          provider_model: string
          provider_name: string
          raw_extraction: Json
          target_actor_profile_id: string
          target_document_id: string
        }
        Returns: undefined
      }
      persist_verification_run_v1: {
        Args: {
          checks: Json
          target_application_id: string
          target_normalized_invoice_number: string
          target_overall_result: Database["public"]["Enums"]["check_result"]
          target_rule_version: string
        }
        Returns: string
      }
      record_exact_document_duplicate: {
        Args: {
          attempted_filename: string
          content_sha256: string
          target_application_id: string
        }
        Returns: string
      }
      resolve_coupa_exception_v1: {
        Args: {
          target_check_id: string
          target_choice: Database["public"]["Enums"]["integration_resolution_choice"]
          target_explanation?: string
        }
        Returns: Json
      }
      respond_to_simulated_offer_v1: {
        Args: {
          target_decision: string
          target_offer_id: string
          target_reason?: string
        }
        Returns: Json
      }
      send_application_to_buyer: {
        Args: { target_application_id: string }
        Returns: string
      }
      set_demo_coupa_scenario: {
        Args: { target_connection_id: string; target_scenario: string }
        Returns: Json
      }
      start_funder_review: {
        Args: { target_application_id: string }
        Returns: Json
      }
      submit_application_field_review: {
        Args: { reviewed_fields: Json; target_application_id: string }
        Returns: Json
      }
      submit_application_field_review_once: {
        Args: { reviewed_fields: Json; target_application_id: string }
        Returns: Json
      }
      submit_buyer_confirmation_v1: {
        Args: {
          submitted_answers: Json
          submitted_declaration_version?: string
          submitted_explanations: Json
          submitted_job_title?: string
          submitted_signature_strokes?: Json
          target_confirmation_id: string
        }
        Returns: Json
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
        | "buyer_system_checking"
        | "buyer_system_verified"
        | "buyer_exception_review"
        | "buyer_system_blocked"
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
      integration_connection_status:
        | "active"
        | "disconnected"
        | "error"
        | "revoked"
      integration_mode: "demo" | "live"
      integration_outcome:
        | "system_verified"
        | "review_required"
        | "blocked"
        | "manual_confirmation_required"
      integration_provider: "coupa"
      integration_resolution_choice:
        | "external_value"
        | "supplier_value"
        | "other_issue"
      integration_sync_status:
        | "running"
        | "completed"
        | "unavailable"
        | "failed"
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
        "buyer_system_checking",
        "buyer_system_verified",
        "buyer_exception_review",
        "buyer_system_blocked",
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
      integration_connection_status: [
        "active",
        "disconnected",
        "error",
        "revoked",
      ],
      integration_mode: ["demo", "live"],
      integration_outcome: [
        "system_verified",
        "review_required",
        "blocked",
        "manual_confirmation_required",
      ],
      integration_provider: ["coupa"],
      integration_resolution_choice: [
        "external_value",
        "supplier_value",
        "other_issue",
      ],
      integration_sync_status: [
        "running",
        "completed",
        "unavailable",
        "failed",
      ],
      offer_status: ["draft", "offered", "accepted", "declined", "expired"],
      organization_kind: ["sme", "buyer", "funder"],
      user_role: ["sme", "buyer", "funder"],
      verification_run_status: ["pending", "running", "completed", "failed"],
    },
  },
} as const
