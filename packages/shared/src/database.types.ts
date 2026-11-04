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
                    "created_at": string,"device_identifier": string,"device_token_hash": string,"id": string,"is_active": boolean,"last_seen_at": string | null,"parking_spot_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"device_identifier": string,"device_token_hash": string,"id"?: string,"is_active"?: boolean,"last_seen_at"?: string | null,"parking_spot_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"device_identifier"?: string,"device_token_hash"?: string,"id"?: string,"is_active"?: boolean,"last_seen_at"?: string | null,"parking_spot_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tbldispositivosiot_parking_spot_id_fkey"
      columns: ["parking_spot_id"]
isOneToOne: true
      referencedRelation: "tblvagas"
      referencedColumns: ["id"]
    }
                  ]
                },"tblestacionamentos": {
                  Row: {
                    "address": string | null,"created_at": string,"description": string | null,"id": string,"is_active": boolean,"name": string,"owner_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"name": string,"owner_id"?: string,"updated_at"?: string
                  }
                  Update: {
                    "address"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"name"?: string,"owner_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"tblhistoricovagas": {
                  Row: {
                    "changed_by": string | null,"created_at": string,"id": number,"new_status": string,"parking_spot_id": string,"previous_status": string | null,"source": string
                  }
                  ComputedFields: never
                  Insert: {
                    "changed_by"?: string | null,"created_at"?: string,"id"?: never,"new_status": string,"parking_spot_id": string,"previous_status"?: string | null,"source": string
                  }
                  Update: {
                    "changed_by"?: string | null,"created_at"?: string,"id"?: never,"new_status"?: string,"parking_spot_id"?: string,"previous_status"?: string | null,"source"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tblhistoricovagas_parking_spot_id_fkey"
      columns: ["parking_spot_id"]
isOneToOne: false
      referencedRelation: "tblvagas"
      referencedColumns: ["id"]
    }
                  ]
                },"tblvagas": {
                  Row: {
                    "created_at": string,"id": string,"last_updated_at": string,"parking_lot_id": string,"spot_number": number,"status": string,"type": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"last_updated_at"?: string,"parking_lot_id": string,"spot_number": number,"status"?: string,"type"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"last_updated_at"?: string,"parking_lot_id"?: string,"spot_number"?: number,"status"?: string,"type"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tblvagas_parking_lot_id_fkey"
      columns: ["parking_lot_id"]
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
            "is_parking_lot_owner":
{ Args: { "p_parking_lot_id": string }; Returns: boolean
                           },
"register_iot_device":
{ Args: { "p_device_identifier": string,"p_parking_spot_id": string }; Returns: Json
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
