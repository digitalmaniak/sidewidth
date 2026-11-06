import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'node',
        include: ['**/*.test.ts'],
        env: {
            NEXT_PUBLIC_SUPABASE_URL: 'https://sidewidth.example.test',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-publishable-key',
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname),
        },
    },
})
