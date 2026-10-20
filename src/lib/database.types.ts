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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      ai_assignments: {
        Row: {
          model_id: string | null
          surface: string
          updated_at: string
        }
        Insert: {
          model_id?: string | null
          surface: string
          updated_at?: string
        }
        Update: {
          model_id?: string | null
          surface?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_assignments_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_models: {
        Row: {
          base_url: string
          created_at: string
          dialect: string
          has_key: boolean
          id: string
          key_secret_name: string | null
          label: string
          last_error: string | null
          model: string
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          base_url: string
          created_at?: string
          dialect?: string
          has_key?: boolean
          id?: string
          key_secret_name?: string | null
          label: string
          last_error?: string | null
          model: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Update: {
          base_url?: string
          created_at?: string
          dialect?: string
          has_key?: boolean
          id?: string
          key_secret_name?: string | null
          label?: string
          last_error?: string | null
          model?: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      attachments: {
        Row: {
          created_at: string
          id: string
          mime_type: string
          name: string
          size: number
          storage_path: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mime_type?: string
          name: string
          size?: number
          storage_path: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mime_type?: string
          name?: string
          size?: number
          storage_path?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          title: string
          url: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          title: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          reasoning: string
          role: string
          thread_id: string
          tool_call_id: string | null
          tool_calls: Json | null
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          reasoning?: string
          role: string
          thread_id: string
          tool_call_id?: string | null
          tool_calls?: Json | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          reasoning?: string
          role?: string
          thread_id?: string
          tool_call_id?: string | null
          tool_calls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      commands: {
        Row: {
          action: string
          created_at: string
          defaults: Json
          delete_message: boolean
          enabled: boolean
          id: string
          position: number
          send_confirmation: boolean
          trigger: string
          updated_at: string
        }
        Insert: {
          action: string
          created_at?: string
          defaults?: Json
          delete_message?: boolean
          enabled?: boolean
          id?: string
          position?: number
          send_confirmation?: boolean
          trigger: string
          updated_at?: string
        }
        Update: {
          action?: string
          created_at?: string
          defaults?: Json
          delete_message?: boolean
          enabled?: boolean
          id?: string
          position?: number
          send_confirmation?: boolean
          trigger?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          color: string
          created_at: string
          id: string
          is_default: boolean
          name: string
          position: number
          updated_at: string
          work_end: string | null
          work_start: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          position?: number
          updated_at?: string
          work_end?: string | null
          work_start?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          position?: number
          updated_at?: string
          work_end?: string | null
          work_start?: string | null
        }
        Relationships: []
      }
      expense_payments: {
        Row: {
          amount_paid: number | null
          expense_id: string
          id: string
          month: string
          paid_at: string
        }
        Insert: {
          amount_paid?: number | null
          expense_id: string
          id?: string
          month: string
          paid_at?: string
        }
        Update: {
          amount_paid?: number | null
          expense_id?: string
          id?: string
          month?: string
          paid_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_payments_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          active: boolean
          amount: number
          created_at: string
          description: string
          id: string
          installments_total: number | null
          kind: string
          notes: string
          recurrence: string
          start_month: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount?: number
          created_at?: string
          description: string
          id?: string
          installments_total?: number | null
          kind?: string
          notes?: string
          recurrence?: string
          start_month: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount?: number
          created_at?: string
          description?: string
          id?: string
          installments_total?: number | null
          kind?: string
          notes?: string
          recurrence?: string
          start_month?: string
          updated_at?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          created_at: string
          folder_id: string | null
          id: string
          mime_type: string
          name: string
          size: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          folder_id?: string | null
          id?: string
          mime_type?: string
          name: string
          size?: number
          storage_path: string
        }
        Update: {
          created_at?: string
          folder_id?: string | null
          id?: string
          mime_type?: string
          name?: string
          size?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      incomes: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          month: string
          recurring: boolean
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          id?: string
          month: string
          recurring?: boolean
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          month?: string
          recurring?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          company_id: string | null
          config: Json
          created_at: string
          has_secret: boolean
          id: string
          label: string
          last_error: string | null
          last_sync_at: string | null
          secret_name: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          config?: Json
          created_at?: string
          has_secret?: boolean
          id?: string
          label?: string
          last_error?: string | null
          last_sync_at?: string | null
          secret_name?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          config?: Json
          created_at?: string
          has_secret?: boolean
          id?: string
          label?: string
          last_error?: string | null
          last_sync_at?: string | null
          secret_name?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      labels: {
        Row: {
          color: string
          company_id: string | null
          created_at: string
          id: string
          name: string
          name_key: string | null
          updated_at: string
        }
        Insert: {
          color?: string
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
          name_key?: string | null
          updated_at?: string
        }
        Update: {
          color?: string
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          name_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "labels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          created_at: string
          description: string
          folder_id: string | null
          id: string
          is_favorite: boolean
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string
          folder_id?: string | null
          id?: string
          is_favorite?: boolean
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string
          folder_id?: string | null
          id?: string
          is_favorite?: boolean
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "links_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          content: string
          created_at: string
          id: string
          kind: string
          subject: string
          subject_key: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          kind?: string
          subject: string
          subject_key?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          kind?: string
          subject?: string
          subject_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          is_favorite: boolean
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          title?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          acao_direta: boolean
          ai_api_key: string
          ai_base_url: string
          ai_instructions: string
          ai_model: string
          drive_app_id: string
          drive_app_secret: string
          drive_folder: string
          drive_renewal: string
          id: boolean
          tavily_api_key: string
          updated_at: string
        }
        Insert: {
          acao_direta?: boolean
          ai_api_key?: string
          ai_base_url?: string
          ai_instructions?: string
          ai_model?: string
          drive_app_id?: string
          drive_app_secret?: string
          drive_folder?: string
          drive_renewal?: string
          id?: boolean
          tavily_api_key?: string
          updated_at?: string
        }
        Update: {
          acao_direta?: boolean
          ai_api_key?: string
          ai_base_url?: string
          ai_instructions?: string
          ai_model?: string
          drive_app_id?: string
          drive_app_secret?: string
          drive_folder?: string
          drive_renewal?: string
          id?: boolean
          tavily_api_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      snippets: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string
          id: string
          is_favorite: boolean
          last_used_at: string | null
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          code?: string
          created_at?: string
          description?: string
          id?: string
          is_favorite?: boolean
          last_used_at?: string | null
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string
          id?: string
          is_favorite?: boolean
          last_used_at?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          created_at: string
          icon: string
          id: string
          name: string
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          name: string
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          name?: string
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_labels: {
        Row: {
          created_at: string
          label_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          label_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          label_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_labels_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_labels_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          company_id: string | null
          completed_at: string | null
          context: string
          created_at: string
          description: string
          due_date: string | null
          external_id: string | null
          external_type: string | null
          external_url: string | null
          highlighted: boolean
          id: string
          position: number
          priority: string
          source_id: string | null
          status: string
          tags: string[]
          title: string
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          context?: string
          created_at?: string
          description?: string
          due_date?: string | null
          external_id?: string | null
          external_type?: string | null
          external_url?: string | null
          highlighted?: boolean
          id?: string
          position?: number
          priority?: string
          source_id?: string | null
          status?: string
          tags?: string[]
          title: string
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          context?: string
          created_at?: string
          description?: string
          due_date?: string | null
          external_id?: string | null
          external_type?: string | null
          external_url?: string | null
          highlighted?: boolean
          id?: string
          position?: number
          priority?: string
          source_id?: string | null
          status?: string
          tags?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      app_get_secret: { Args: { p_name: string }; Returns: string }
      app_set_secret: {
        Args: { p_name: string; p_secret: string }
        Returns: undefined
      }
      is_owner: { Args: never; Returns: boolean }
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
    Enums: {},
  },
} as const
