// Arquivo GERADO pelo Supabase CLI — não edite manualmente. Regenerar com: pnpm db:types

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "tbldispositivosiot": {
                  Row: {
                    "ativo": boolean,"atualizado_em": string,"criado_em": string,"id": string,"identificador": string,"token_hash": string,"ultimo_contato_em": string | null,"vaga_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"atualizado_em"?: string,"criado_em"?: string,"id"?: string,"identificador": string,"token_hash": string,"ultimo_contato_em"?: string | null,"vaga_id": string
                  }
                  Update: {
                    "ativo"?: boolean,"atualizado_em"?: string,"criado_em"?: string,"id"?: string,"identificador"?: string,"token_hash"?: string,"ultimo_contato_em"?: string | null,"vaga_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tbldispositivosiot_vaga_id_fkey"
      columns: ["vaga_id"]
isOneToOne: true
      referencedRelation: "tblvagas"
      referencedColumns: ["id"]
    }
                  ]
                },"tblestacionamentos": {
                  Row: {
                    "ativo": boolean,"atualizado_em": string,"criado_em": string,"descricao": string | null,"dono_id": string,"endereco": string | null,"id": string,"nome": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"atualizado_em"?: string,"criado_em"?: string,"descricao"?: string | null,"dono_id"?: string,"endereco"?: string | null,"id"?: string,"nome": string
                  }
                  Update: {
                    "ativo"?: boolean,"atualizado_em"?: string,"criado_em"?: string,"descricao"?: string | null,"dono_id"?: string,"endereco"?: string | null,"id"?: string,"nome"?: string
                  }
                  Relationships: [
                    
                  ]
                },"tblhistoricovagas": {
                  Row: {
                    "alterado_por": string | null,"criado_em": string,"id": number,"origem": string,"situacao_anterior": string | null,"situacao_nova": string,"vaga_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alterado_por"?: string | null,"criado_em"?: string,"id"?: never,"origem": string,"situacao_anterior"?: string | null,"situacao_nova": string,"vaga_id": string
                  }
                  Update: {
                    "alterado_por"?: string | null,"criado_em"?: string,"id"?: never,"origem"?: string,"situacao_anterior"?: string | null,"situacao_nova"?: string,"vaga_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tblhistoricovagas_vaga_id_fkey"
      columns: ["vaga_id"]
isOneToOne: false
      referencedRelation: "tblvagas"
      referencedColumns: ["id"]
    }
                  ]
                },"tblvagas": {
                  Row: {
                    "atualizado_em": string,"criado_em": string,"estacionamento_id": string,"id": string,"numero": number,"situacao": string,"situacao_atualizada_em": string,"tipo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "atualizado_em"?: string,"criado_em"?: string,"estacionamento_id": string,"id"?: string,"numero": number,"situacao"?: string,"situacao_atualizada_em"?: string,"tipo"?: string
                  }
                  Update: {
                    "atualizado_em"?: string,"criado_em"?: string,"estacionamento_id"?: string,"id"?: string,"numero"?: number,"situacao"?: string,"situacao_atualizada_em"?: string,"tipo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tblvagas_estacionamento_id_fkey"
      columns: ["estacionamento_id"]
isOneToOne: false
      referencedRelation: "tblestacionamentos"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "eh_dono_estacionamento":
{ Args: { "p_estacionamento_id": string }; Returns: boolean
                           },
"registrar_dispositivo_iot":
{ Args: { "p_identificador": string,"p_vaga_id": string }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
