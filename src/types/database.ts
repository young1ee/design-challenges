export type Database = {
  public: {
    Tables: {
      designers: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          bio: string | null
          social_links: Record<string, string> | null
          joined_year: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['designers']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['designers']['Insert']>
      }
      challenges: {
        Row: {
          id: string
          year: number
          title: string
          prompt: string
          start_date: string
          end_date: string
          status: 'upcoming' | 'active' | 'voting' | 'completed'
          winner_id: string | null
          next_prompt: string | null
          next_prompt_set_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['challenges']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['challenges']['Insert']>
      }
      entries: {
        Row: {
          id: string
          challenge_id: string
          designer_id: string
          image_url: string
          title: string | null
          description: string | null
          submitted_at: string
        }
        Insert: Omit<Database['public']['Tables']['entries']['Row'], 'id' | 'submitted_at'>
        Update: Partial<Database['public']['Tables']['entries']['Insert']>
      }
      results: {
        Row: {
          id: string
          challenge_id: string
          designer_id: string
          rank: number
          points_awarded: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['results']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['results']['Insert']>
      }
      point_rules: {
        Row: {
          id: string
          year_from: number
          year_to: number | null
          rank_1_points: number
          rank_2_points: number
          rank_3_points: number
          participation_points: number
        }
        Insert: Omit<Database['public']['Tables']['point_rules']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['point_rules']['Insert']>
      }
    }
  }
}
