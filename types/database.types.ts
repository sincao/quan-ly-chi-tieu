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
          display_name: string | null
          avatar_url: string | null
          survival_score: number
          current_streak: number
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          survival_score?: number
          current_streak?: number
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          survival_score?: number
          current_streak?: number
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          icon: string | null
          color: string | null
          type: 'income' | 'expense'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          color?: string | null
          type: 'income' | 'expense'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          color?: string | null
          type?: 'income' | 'expense'
          created_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          month_year: string
          amount_limit: number
          emergency_threshold: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month_year: string
          amount_limit: number
          emergency_threshold?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month_year?: string
          amount_limit?: number
          emergency_threshold?: number
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          amount: number
          type: 'income' | 'expense'
          date: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          amount: number
          type: 'income' | 'expense'
          date?: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          amount?: number
          type?: 'income' | 'expense'
          date?: string
          note?: string | null
          created_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Budget = Database['public']['Tables']['budgets']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type NewTransaction = Database['public']['Tables']['transactions']['Insert']
