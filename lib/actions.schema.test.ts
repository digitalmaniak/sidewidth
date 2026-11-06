import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPost, login, signup } from '@/app/actions'
import {
    getAllPosts,
    getNearbyPosts,
    getPostById,
    submitVote,
    updateProfileInterests,
    updateProfileRadius,
} from '@/lib/actions'

type Call = { op: string; table?: string; args: unknown[] }

const state = vi.hoisted(() => ({
    calls: [] as Call[],
    user: null as { id: string } | null,
    profile: null as { interests?: string[] | null; local_radius?: number } | null,
    posts: [] as Array<Record<string, unknown>>,
    post: null as Record<string, unknown> | null,
    votes: [] as Array<{ post_id?: string; user_id?: string; value: number }>,
}))

function builder(table: string) {
    const api = {
        select(args?: unknown) {
            state.calls.push({ op: 'select', table, args: [args] })
            return api
        },
        eq(...args: unknown[]) {
            state.calls.push({ op: 'eq', table, args })
            return api
        },
        in(...args: unknown[]) {
            state.calls.push({ op: 'in', table, args })
            return api
        },
        order(...args: unknown[]) {
            state.calls.push({ op: 'order', table, args })
            return api
        },
        gte(...args: unknown[]) {
            state.calls.push({ op: 'gte', table, args })
            return api
        },
        gt(...args: unknown[]) {
            state.calls.push({ op: 'gt', table, args })
            return api
        },
        lt(...args: unknown[]) {
            state.calls.push({ op: 'lt', table, args })
            return api
        },
        upsert(...args: unknown[]) {
            state.calls.push({ op: 'upsert', table, args })
            return Promise.resolve({ error: null })
        },
        insert(...args: unknown[]) {
            state.calls.push({ op: 'insert', table, args })
            return Promise.resolve({ error: null })
        },
        update(...args: unknown[]) {
            state.calls.push({ op: 'update', table, args })
            return api
        },
        single() {
            state.calls.push({ op: 'single', table, args: [] })
            const data = table === 'profiles' ? state.profile : table === 'posts' ? state.post : null
            return Promise.resolve({ data, error: data ? null : { code: 'PGRST116', message: 'not found' } })
        },
        range(...args: unknown[]) {
            state.calls.push({ op: 'range', table, args })
            const data = table === 'rpc' || table === 'post_stats_view' ? state.posts : []
            return Promise.resolve({ data, error: null })
        },
        then(
            onFulfilled: (value: { data: unknown; error: null }) => unknown,
            onRejected?: (reason: unknown) => unknown,
        ) {
            const data = table === 'votes' ? state.votes : table === 'post_stats_view' ? state.posts : []
            return Promise.resolve({ data, error: null }).then(onFulfilled, onRejected)
        },
    }
    return api
}

vi.mock('@/lib/supabase/server', () => ({
    createClient: async () => ({
        auth: {
            getUser: async () => ({
                data: { user: state.user },
                error: state.user ? null : { message: 'Auth session missing' },
            }),
            signInWithPassword: async (credentials: unknown) => {
                state.calls.push({ op: 'signInWithPassword', args: [credentials] })
                return { error: null }
            },
            signUp: async (credentials: unknown) => {
                state.calls.push({ op: 'signUp', args: [credentials] })
                return { data: { user: { id: 'new-user' }, session: { access_token: 'local' } }, error: null }
            },
            signOut: async () => {
                state.calls.push({ op: 'signOut', args: [] })
                return { error: null }
            },
        },
        from: (table: string) => {
            state.calls.push({ op: 'from', table, args: [table] })
            return builder(table)
        },
        rpc: (name: string, args: unknown) => {
            state.calls.push({ op: 'rpc', table: 'rpc', args: [name, args] })
            return builder('rpc')
        },
    }),
}))

vi.mock('next/headers', () => ({
    headers: async () => ({ get: () => 'http://localhost:3000' }),
    cookies: async () => ({ getAll: () => [], set: () => {} }),
}))

vi.mock('next/navigation', () => ({
    redirect: (url: string) => {
        throw new Error(`REDIRECT:${url}`)
    },
}))

vi.mock('next/cache', () => ({
    revalidatePath: () => {},
}))

function reset(partial: Partial<Pick<typeof state, 'user' | 'profile' | 'posts' | 'post' | 'votes'>> = {}) {
    state.calls = []
    state.user = partial.user ?? null
    state.profile = partial.profile ?? null
    state.posts = partial.posts ?? []
    state.post = partial.post ?? null
    state.votes = partial.votes ?? []
}

const samplePost = {
    id: 'post-1',
    created_at: '2026-01-01T00:00:00.000Z',
    created_by: 'user-1',
    side_a: 'Cats',
    side_b: 'Dogs',
    category: 'FOOD',
    lat: 40.7,
    long: -74,
    location_name: 'Here',
    description: 'A local argument',
    vote_count: 2,
    vote_average: 10,
    vote_stddev: 60,
    trending_score: 1,
}

describe('schema-backed app behavior', () => {
    beforeEach(() => {
        reset()
        vi.stubGlobal('fetch', () => {
            throw new Error('unexpected network call')
        })
    })

    it('calls get_nearby_posts_v2 with numeric geospatial args and filters interests', async () => {
        reset({
            user: { id: 'user-1' },
            profile: { interests: ['FOOD'] },
            posts: [samplePost, { ...samplePost, id: 'post-2', category: 'SPORTS' }],
            votes: [{ post_id: 'post-1', value: 25 }],
        })

        const posts = await getNearbyPosts(40.7, -74, 25, 1, 10, 'latest')
        const rpc = state.calls.find((call) => call.op === 'rpc')
        expect(rpc?.args[0]).toBe('get_nearby_posts_v2')
        expect(rpc?.args[1]).toEqual({
            user_lat: 40.7,
            user_long: -74,
            dist_km: 25,
            sort_by: 'latest',
            min_lat: -90,
            max_lat: 90,
            min_long: -180,
            max_long: 180,
        })
        expect(posts).toHaveLength(1)
        expect(posts[0].id).toBe('post-1')
        expect(posts[0].userVote).toBe(25)
        const voteRead = state.calls.find((call) => call.op === 'eq' && call.table === 'votes')
        expect(voteRead?.args).toEqual(['user_id', 'user-1'])
    })

    it('lets anonymous visitors read the local and global feeds without writing', async () => {
        reset({ posts: [samplePost] })
        const nearby = await getNearbyPosts(40.7, -74, 50)
        const global = await getAllPosts(1, 10, 'divided')

        expect(nearby).toHaveLength(1)
        expect(nearby[0].userVote).toBe(0)
        expect(global).toHaveLength(1)
        expect(state.calls.some((call) => call.op === 'upsert' || call.op === 'insert' || call.op === 'update')).toBe(false)
        expect(state.calls.some((call) => call.op === 'from' && call.table === 'post_stats_view')).toBe(true)
        expect(state.calls.some((call) => call.op === 'gte' && call.table === 'post_stats_view' && call.args[0] === 'vote_count')).toBe(true)
        expect(state.calls.some((call) => call.op === 'gt' && call.table === 'post_stats_view' && call.args[0] === 'vote_stddev')).toBe(true)
        expect(state.calls.some((call) => call.op === 'from' && call.table === 'votes')).toBe(false)
    })

    it('hides the global feed when the signed-in profile has no interests', async () => {
        reset({ user: { id: 'user-1' }, profile: { interests: [] }, posts: [samplePost] })
        const posts = await getAllPosts()
        expect(posts).toEqual([])
        expect(state.calls.some((call) => call.op === 'range')).toBe(false)
    })

    it('reads a post anonymously and attaches the signed-in vote', async () => {
        reset({ post: samplePost, votes: [{ user_id: 'user-1', value: -40 }] })
        const anonymous = await getPostById('post-1')
        expect(anonymous?.userVote).toBe(0)
        expect(anonymous?.side_a).toBe('Cats')
        expect(anonymous?.description).toBe('A local argument')

        reset({ user: { id: 'user-1' }, post: samplePost, votes: [{ user_id: 'user-1', value: -40 }, { user_id: 'user-2', value: 10 }] })
        const signedIn = await getPostById('post-1')
        expect(signedIn?.userVote).toBe(-40)
        expect(signedIn?.voteCount).toBe(2)
    })

    it('rejects votes and profile writes when nobody is signed in', async () => {
        await expect(submitVote('post-1', 10)).rejects.toThrow('Must be logged in to vote')
        await expect(updateProfileRadius(10)).rejects.toThrow('Must be logged in to update settings')
        await expect(updateProfileInterests(['FOOD'])).rejects.toThrow('Must be logged in to update settings')
        expect(state.calls.some((call) => call.op === 'from')).toBe(false)
    })

    it('provisions the caller profile and stores the vote under that user id', async () => {
        reset({ user: { id: 'user-1' }, votes: [{ value: 15 }] })
        const result = await submitVote('post-1', 15)
        expect(result.success).toBe(true)
        expect(result.stats.voteCount).toBe(1)

        const profileUpsert = state.calls.find((call) => call.op === 'upsert' && call.table === 'profiles')
        const voteUpsert = state.calls.find((call) => call.op === 'upsert' && call.table === 'votes')
        expect(profileUpsert?.args[0]).toEqual({ id: 'user-1' })
        expect(voteUpsert?.args[0]).toEqual({ post_id: 'post-1', user_id: 'user-1', value: 15 })
        expect(voteUpsert?.args[1]).toEqual({ onConflict: 'post_id, user_id' })
        expect(state.calls.findIndex((call) => call.op === 'upsert' && call.table === 'profiles'))
            .toBeLessThan(state.calls.findIndex((call) => call.op === 'upsert' && call.table === 'votes'))
    })

    it('updates radius and interests only for the signed-in profile', async () => {
        reset({ user: { id: 'user-1' } })
        await updateProfileRadius(12)
        await updateProfileInterests(['FOOD', 'TECHNOLOGY'])

        const radius = state.calls.find((call) => call.op === 'update' && call.args[0] && (call.args[0] as { local_radius?: number }).local_radius === 12)
        const interests = state.calls.find((call) => call.op === 'update' && Array.isArray((call.args[0] as { interests?: string[] }).interests))
        expect(radius?.table).toBe('profiles')
        expect(interests?.args[0]).toEqual({ interests: ['FOOD', 'TECHNOLOGY'] })
        const eqs = state.calls.filter((call) => call.op === 'eq' && call.table === 'profiles')
        expect(eqs.every((call) => call.args[0] === 'id' && call.args[1] === 'user-1')).toBe(true)
    })

    it('creates a post only after ensuring the caller profile', async () => {
        reset()
        const missing = new FormData()
        missing.set('side_a', 'Cats')
        missing.set('side_b', 'Dogs')
        missing.set('category', 'FOOD')
        missing.set('description', 'Local')
        await expect(createPost(missing)).rejects.toThrow('REDIRECT:/login')
        expect(state.calls.some((call) => call.op === 'from')).toBe(false)

        reset({ user: { id: 'user-1' } })
        const form = new FormData()
        form.set('side_a', 'Cats')
        form.set('side_b', 'Dogs')
        form.set('category', 'FOOD')
        form.set('description', 'Local')
        await expect(createPost(form)).rejects.toThrow('REDIRECT:/')
        const profileUpsert = state.calls.find((call) => call.op === 'upsert' && call.table === 'profiles')
        const insert = state.calls.find((call) => call.op === 'insert' && call.table === 'posts')
        expect(profileUpsert?.args[0]).toEqual({ id: 'user-1' })
        expect(profileUpsert?.args[1]).toEqual({ onConflict: 'id', ignoreDuplicates: true })
        expect(insert?.args[0]).toMatchObject({
            side_a: 'Cats',
            side_b: 'Dogs',
            category: 'FOOD',
            created_by: 'user-1',
            description: 'Local',
        })
    })

    it('signs up through Auth and does not insert a profile from the app', async () => {
        const form = new FormData()
        form.set('email', 'person@example.test')
        form.set('password', 'not-a-real-password')
        await expect(signup(form)).rejects.toThrow('REDIRECT:/')
        const signUp = state.calls.find((call) => call.op === 'signUp')
        expect(signUp?.args[0]).toMatchObject({
            email: 'person@example.test',
            options: { emailRedirectTo: 'https://sidewidth.com/auth/callback' },
        })
        expect(state.calls.some((call) => call.op === 'from')).toBe(false)

        reset()
        await expect(login(form)).rejects.toThrow('REDIRECT:/')
        expect(state.calls.some((call) => call.op === 'signInWithPassword')).toBe(true)
        expect(state.calls.some((call) => call.op === 'from')).toBe(false)
    })
})
