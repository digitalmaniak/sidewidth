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
            }
            posts: {
                Row: {
                    id: string
                    created_at: string
                    created_by: string
                    side_a: string
                    side_b: string
                    category: string
                    lat: number | null
                    long: number | null
                    location_name: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    created_by: string
                    side_a: string
                    side_b: string
                    category: string
                    lat?: number | null
                    long?: number | null
                    location_name?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    created_by?: string
                    side_a?: string
                    side_b?: string
                    category?: string
                    lat?: number | null
                    long?: number | null
                    location_name?: string | null
                }
            }
            votes: {
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
            }
        }
    }
}
