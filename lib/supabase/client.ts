import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'
import { sidewidthDbOptions } from '@/lib/supabase/options'

export const createClient = () => {
  return createBrowserClient<Database, 'sidewidth'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...sidewidthDbOptions,
    }
  )
}
