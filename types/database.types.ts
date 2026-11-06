export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

type Relationship = {
    foreignKeyName: string
    columns: string[]
    isOneToOne?: boolean
    referencedRelation: string
    referencedColumns: string[]
}

type Profiles = {
    Row: {
        id: string
        created_at: string
        karma: number
        local_radius: number
        interests: string[] | null
    }
    Insert: {
        id: string
        created_at?: string
        karma?: number
        local_radius?: number
        interests?: string[] | null
    }
    Update: {
        id?: string
        created_at?: string
        karma?: number
        local_radius?: number
        interests?: string[] | null
    }
    Relationships: Relationship[]
}

type Posts = {
    Row: {
        id: string
        created_at: string
        created_by: string | null
        side_a: string
        side_b: string
        category: string
        lat: number | null
        long: number | null
        location_name: string | null
        description: string | null
    }
    Insert: {
        id?: string
        created_at?: string
        created_by?: string | null
        side_a: string
        side_b: string
        category: string
        lat?: number | null
        long?: number | null
        location_name?: string | null
        description?: string | null
    }
    Update: {
        id?: string
        created_at?: string
        created_by?: string | null
        side_a?: string
        side_b?: string
        category?: string
        lat?: number | null
        long?: number | null
        location_name?: string | null
        description?: string | null
    }
    Relationships: Relationship[]
}

type Votes = {
    Row: {
        id: string
        post_id: string
        user_id: string
        value: number
        created_at: string
    }
    Insert: {
        id?: string
        post_id: string
        user_id: string
        value: number
        created_at?: string
    }
    Update: {
        id?: string
        post_id?: string
        user_id?: string
        value?: number
        created_at?: string
    }
    Relationships: [
        {
            foreignKeyName: 'votes_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
        },
        {
            foreignKeyName: 'votes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
        },
    ]
}

type PostStatsView = {
    Row: {
        id: string
        created_at: string
        created_by: string | null
        side_a: string
        side_b: string
        category: string
        lat: number | null
        long: number | null
        location_name: string | null
        description: string | null
        vote_count: number
        vote_average: number
        vote_stddev: number
        trending_score: number
    }
    Relationships: Relationship[]
}

type NearbyPostsArgs = {
    user_lat: number
    user_long: number
    dist_km: number
    sort_by: string
    min_lat: number
    max_lat: number
    min_long: number
    max_long: number
}

type NearbyPostRow = PostStatsView['Row'] & {
    dist_meters: number
}

/**
 * App schema derived from repo SQL (supabase/schema.sql and the root
 * migration_*.sql scripts). `public` remains the pre-cutover shape.
 * `sidewidth` is the schema the clients query. Live columns were not verified.
 */
type AppSchema = {
    Tables: {
        profiles: Profiles
        posts: Posts
        votes: Votes
    }
    Views: {
        post_stats_view: PostStatsView
    }
    Functions: {
        get_nearby_posts_v2: {
            Args: NearbyPostsArgs
            Returns: NearbyPostRow[]
        }
    }
}

export interface Database {
    public: AppSchema
    sidewidth: AppSchema
}
