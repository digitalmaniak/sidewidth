/**
 * PostgREST schema for SideWidth tables, views, and RPCs.
 *
 * supabase-js applies this only to `/rest/v1` requests (Accept-Profile on
 * reads, Content-Profile on writes and RPC). Auth stays on `/auth/v1`.
 * See https://supabase.com/docs/guides/api/using-custom-schemas
 */
export const SIDEWIDTH_DB_SCHEMA = 'sidewidth' as const

export const sidewidthDbOptions = {
    db: {
        schema: SIDEWIDTH_DB_SCHEMA,
    },
} as const
