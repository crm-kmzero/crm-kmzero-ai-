// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
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
      base_conhecimento: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          categoria: string | null
          conteudo: string | null
          embedding: string | null
          id: string
          imagem_url: string | null
          produto: string | null
          subtitulo: string | null
          titulo: string | null
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          categoria?: string | null
          conteudo?: string | null
          embedding?: string | null
          id?: string
          imagem_url?: string | null
          produto?: string | null
          subtitulo?: string | null
          titulo?: string | null
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          categoria?: string | null
          conteudo?: string | null
          embedding?: string | null
          id?: string
          imagem_url?: string | null
          produto?: string | null
          subtitulo?: string | null
          titulo?: string | null
        }
        Relationships: []
      }
      interacoes_sdr: {
        Row: {
          data_hora: string
          id: string
          intencao_detectada: string | null
          lead_id: string
          mensagem_cliente: string | null
          mensagem_ia: string | null
          sentimento: Database["public"]["Enums"]["sentimento_type"] | null
        }
        Insert: {
          data_hora?: string
          id?: string
          intencao_detectada?: string | null
          lead_id: string
          mensagem_cliente?: string | null
          mensagem_ia?: string | null
          sentimento?: Database["public"]["Enums"]["sentimento_type"] | null
        }
        Update: {
          data_hora?: string
          id?: string
          intencao_detectada?: string | null
          lead_id?: string
          mensagem_cliente?: string | null
          mensagem_ia?: string | null
          sentimento?: Database["public"]["Enums"]["sentimento_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "interacoes_sdr_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          canal_origem: string | null
          dados_cotacao: Json | null
          data_atualizacao: string
          data_criacao: string
          email: string | null
          estagio: Database["public"]["Enums"]["estagio_type"] | null
          ia_ativa: boolean | null
          id: string
          nome: string
          origem: Database["public"]["Enums"]["origem_type"] | null
          prioridade: number | null
          produto_interesse:
            | Database["public"]["Enums"]["produto_interesse_type"]
            | null
          proxima_acao: string | null
          score_sdr: number | null
          telefone: string
          ultimo_contato: string | null
          valor_estimado: number | null
          vendedor_id: string | null
        }
        Insert: {
          canal_origem?: string | null
          dados_cotacao?: Json | null
          data_atualizacao?: string
          data_criacao?: string
          email?: string | null
          estagio?: Database["public"]["Enums"]["estagio_type"] | null
          ia_ativa?: boolean | null
          id?: string
          nome: string
          origem?: Database["public"]["Enums"]["origem_type"] | null
          prioridade?: number | null
          produto_interesse?:
            | Database["public"]["Enums"]["produto_interesse_type"]
            | null
          proxima_acao?: string | null
          score_sdr?: number | null
          telefone: string
          ultimo_contato?: string | null
          valor_estimado?: number | null
          vendedor_id?: string | null
        }
        Update: {
          canal_origem?: string | null
          dados_cotacao?: Json | null
          data_atualizacao?: string
          data_criacao?: string
          email?: string | null
          estagio?: Database["public"]["Enums"]["estagio_type"] | null
          ia_ativa?: boolean | null
          id?: string
          nome?: string
          origem?: Database["public"]["Enums"]["origem_type"] | null
          prioridade?: number | null
          produto_interesse?:
            | Database["public"]["Enums"]["produto_interesse_type"]
            | null
          proxima_acao?: string | null
          score_sdr?: number | null
          telefone?: string
          ultimo_contato?: string | null
          valor_estimado?: number | null
          vendedor_id?: string | null
        }
        Relationships: []
      }
      metricas_diarias: {
        Row: {
          atendimentos_ana: number | null
          data: string
          id: string
          leads_contatados: number | null
          leads_fechados: number | null
          leads_novos: number | null
          leads_qualificados: number | null
          qualificados_ana: number | null
          taxa_conversao: number | null
          total_whatsapp_ativos: number | null
        }
        Insert: {
          atendimentos_ana?: number | null
          data?: string
          id?: string
          leads_contatados?: number | null
          leads_fechados?: number | null
          leads_novos?: number | null
          leads_qualificados?: number | null
          qualificados_ana?: number | null
          taxa_conversao?: number | null
          total_whatsapp_ativos?: number | null
        }
        Update: {
          atendimentos_ana?: number | null
          data?: string
          id?: string
          leads_contatados?: number | null
          leads_fechados?: number | null
          leads_novos?: number | null
          leads_qualificados?: number | null
          qualificados_ana?: number | null
          taxa_conversao?: number | null
          total_whatsapp_ativos?: number | null
        }
        Relationships: []
      }
      notas_internas: {
        Row: {
          conteudo: string
          corretor_id: string | null
          data_criacao: string | null
          id: string
          lead_id: string | null
        }
        Insert: {
          conteudo: string
          corretor_id?: string | null
          data_criacao?: string | null
          id?: string
          lead_id?: string | null
        }
        Update: {
          conteudo?: string
          corretor_id?: string | null
          data_criacao?: string | null
          id?: string
          lead_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_internas_corretor_id_fkey"
            columns: ["corretor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_internas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buscar_documentos: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          conteudo: string
          id: string
          produto: string
          similarity: number
        }[]
      }
      is_admin_master: { Args: never; Returns: boolean }
    }
    Enums: {
      estagio_type: "novo" | "contato" | "qualificado" | "fechado" | "perdido"
      origem_type:
        | "whatsapp"
        | "site"
        | "indicacao"
        | "formulario"
        | "presencial"
      produto_interesse_type:
        | "Auto"
        | "Residencial"
        | "Vida"
        | "Consorcio"
        | "Empresarial"
        | "Outro"
      sentimento_type: "positivo" | "neutro" | "negativo"
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
      estagio_type: ["novo", "contato", "qualificado", "fechado", "perdido"],
      origem_type: [
        "whatsapp",
        "site",
        "indicacao",
        "formulario",
        "presencial",
      ],
      produto_interesse_type: [
        "Auto",
        "Residencial",
        "Vida",
        "Consorcio",
        "Empresarial",
        "Outro",
      ],
      sentimento_type: ["positivo", "neutro", "negativo"],
    },
  },
} as const

