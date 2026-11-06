import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@supabase/ssr', async () => {
    const actual = await vi.importActual<typeof import('@supabase/ssr')>('@supabase/ssr')
    return {
        ...actual,
        createBrowserClient: vi.fn(actual.createBrowserClient),
        createServerClient: vi.fn(actual.createServerClient),
    }
})
import { SIDEWIDTH_DB_SCHEMA } from '@/lib/supabase/options'
import { updateSession } from '@/lib/supabase/middleware'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { createClient as createServerAppClient } from '@/lib/supabase/server'

vi.mock('next/headers', () => ({
    cookies: async () => ({
        getAll: () => [],
        set: () => {},
    }),
}))

type Captured = {
    url: string
    method: string
    acceptProfile: string | null
    contentProfile: string | null
    body: string | null
}

function schemaName(client: object) {
    const rest = (client as { rest?: { schemaName?: string } }).rest
    return rest?.schemaName
}

const requests: Captured[] = []

function capture(input: RequestInfo | URL, init?: RequestInit): Captured {
    const asRequest = typeof Request !== 'undefined' && input instanceof Request ? input : null
    const url = asRequest
        ? asRequest.url
        : typeof input === 'string'
            ? input
            : input instanceof URL
                ? input.href
                : String(input)
    if (url.includes('supabase.co')) {
        throw new Error('refusing to call production Supabase from a unit test')
    }
    const headers = new Headers(init?.headers ?? asRequest?.headers)
    let body: string | null = null
    if (typeof init?.body === 'string') {
        body = init.body
        if (url.includes('/auth/')) {
            try {
                const parsed = JSON.parse(body) as Record<string, unknown>
                if ('password' in parsed) parsed.password = '[redacted]'
                body = JSON.stringify(parsed)
            } catch {
                body = '[redacted-auth-body]'
            }
        }
    }
    return {
        url,
        method: (init?.method ?? asRequest?.method ?? 'GET').toUpperCase(),
        acceptProfile: headers.get('accept-profile'),
        contentProfile: headers.get('content-profile'),
        body,
    }
}

describe('sidewidth schema selection', () => {
    beforeEach(() => {
        requests.length = 0
        vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
            const captured = capture(input, init)
            requests.push(captured)
            if (captured.url.includes('/auth/v1/token')) {
                return new Response(JSON.stringify({
                    error: 'invalid_grant',
                    error_description: 'Invalid login credentials',
                }), { status: 400, headers: { 'content-type': 'application/json' } })
            }
            if (captured.url.includes('/auth/v1/user')) {
                return new Response(JSON.stringify({
                    id: 'user-1',
                    aud: 'authenticated',
                    email: 'person@example.test',
                }), { status: 200, headers: { 'content-type': 'application/json' } })
            }
            return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            })
        })
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('names the schema sidewidth', () => {
        expect(SIDEWIDTH_DB_SCHEMA).toBe('sidewidth')
    })

    it('selects sidewidth on the browser client for reads, writes, and rpc', async () => {
        const supabase = createBrowserClient()
        expect(schemaName(supabase)).toBe('sidewidth')

        await supabase.from('profiles').select('id')
        await supabase.from('profiles').upsert({ id: '00000000-0000-0000-0000-000000000001' })
        await supabase.rpc('get_nearby_posts_v2', {
            user_lat: 40.7,
            user_long: -74,
            dist_km: 25,
            sort_by: 'latest',
            min_lat: -90,
            max_lat: 90,
            min_long: -180,
            max_long: 180,
        })

        const read = requests.find((request) => request.method === 'GET' && request.url.includes('/rest/v1/profiles'))
        const write = requests.find((request) => request.method === 'POST' && request.url.includes('/rest/v1/profiles'))
        const rpc = requests.find((request) => request.url.includes('/rest/v1/rpc/get_nearby_posts_v2'))

        expect(read?.acceptProfile).toBe('sidewidth')
        expect(read?.contentProfile).toBeNull()
        expect(write?.contentProfile).toBe('sidewidth')
        expect(write?.url.startsWith('https://sidewidth.example.test/rest/v1/profiles')).toBe(true)
        expect(rpc?.method).toBe('POST')
        expect(rpc?.contentProfile).toBe('sidewidth')
        expect(rpc?.acceptProfile).toBeNull()
        const rpcBody = JSON.parse(rpc?.body ?? '{}') as Record<string, unknown>
        expect(rpcBody.user_lat).toBe(40.7)
        expect(rpcBody.user_long).toBe(-74)
        expect(rpcBody.dist_km).toBe(25)
        expect(rpcBody.sort_by).toBe('latest')
        expect(requests.some((request) => request.acceptProfile === 'public' || request.contentProfile === 'public')).toBe(false)
    })

    it('selects sidewidth on the server client', async () => {
        const supabase = await createServerAppClient()
        expect(schemaName(supabase)).toBe('sidewidth')

        await supabase.from('post_stats_view').select('id')
        await supabase.rpc('get_nearby_posts_v2', {
            user_lat: 1,
            user_long: 2,
            dist_km: 3,
            sort_by: 'divided',
            min_lat: -90,
            max_lat: 90,
            min_long: -180,
            max_long: 180,
        })

        const read = requests.find((request) => request.url.includes('/rest/v1/post_stats_view'))
        const rpc = requests.find((request) => request.url.includes('/rest/v1/rpc/get_nearby_posts_v2'))
        expect(read?.acceptProfile).toBe('sidewidth')
        expect(rpc?.contentProfile).toBe('sidewidth')
        expect(rpc?.url.includes('/rpc/get_nearby_posts')).toBe(true)
        expect(rpc?.url.includes('get_nearby_posts_v2')).toBe(true)
    })

    it('keeps password login and session reads on the auth API', async () => {
        const supabase = createBrowserClient()
        await supabase.auth.signInWithPassword({
            email: 'person@example.test',
            password: 'not-a-real-password',
        })
        await supabase.auth.getUser('header.test.jwt')

        const authRequests = requests.filter((request) => request.url.includes('/auth/v1/'))
        expect(authRequests.length).toBeGreaterThan(0)
        expect(authRequests.every((request) => request.acceptProfile === null && request.contentProfile === null)).toBe(true)
        expect(authRequests.some((request) => request.url.includes('/auth/v1/token') && request.url.includes('grant_type=password'))).toBe(true)
        expect(authRequests.some((request) => request.url.includes('/auth/v1/user'))).toBe(true)
        expect(requests.some((request) => request.url.includes('/rest/v1/'))).toBe(false)
        const token = authRequests.find((request) => request.url.includes('/auth/v1/token'))
        expect(token?.body).toContain('[redacted]')
        expect(token?.body).not.toContain('not-a-real-password')
    })

    it('passes the sidewidth schema into middleware without querying tables', async () => {
        const serverSpy = vi.mocked(createServerClient)
        serverSpy.mockClear()

        const response = await updateSession(new NextRequest('https://sidewidth.example.test/'))
        expect(response.status).toBe(200)
        expect(serverSpy).toHaveBeenCalled()
        const options = serverSpy.mock.calls.at(-1)?.[2] as { db?: { schema?: string } }
        expect(options.db?.schema).toBe('sidewidth')
        expect(requests.some((request) => request.url.includes('/rest/v1/'))).toBe(false)
    })
})
