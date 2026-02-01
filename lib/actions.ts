"use server"

import { createClient } from "@/lib/supabase/server"

export type SortOption = 'latest' | 'trending' | 'divided' | 'consensus'

export async function getNearbyPosts(lat: number, long: number, distKm: number = 50, page: number = 1, limit: number = 10, sortBy: SortOption = 'latest') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const start = (page - 1) * limit
    const end = start + limit - 1

    // Use the v2 RPC that supports sorting
    const { data: posts, error } = await supabase.rpc('get_nearby_posts_v2', {
        user_lat: lat,
        user_long: long,
        dist_km: distKm,
        sort_by: sortBy,
        min_lat: -90, max_lat: 90, min_long: -180, max_long: 180 // Placeholder for bound optimization
    })
        .range(start, end)

    if (error) {
        console.error('Error fetching nearby posts:', error)
        return []
    }

    if (!posts || posts.length === 0) {
        return []
    }

    // Filter by interests (in-memory as per previous logic, ideally should be in DB)
    let filteredPosts = posts
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('interests')
            .eq('id', user.id)
            .single()

        const interests = profile?.interests
        if (interests !== null && interests !== undefined) {
            if (interests.length === 0) {
                filteredPosts = []
            } else {
                filteredPosts = posts.filter((p: any) => interests.includes(p.category))
            }
        }
    }

    // Since RPC returns stats, we just need to attach userVote.
    // We can fetch user votes for these posts.
    const postIds = filteredPosts.map((p: any) => p.id)

    const userVotesMap = new Map<string, number>()
    if (user && postIds.length > 0) {
        const { data: votes } = await supabase
            .from('votes')
            .select('post_id, value')
            .eq('user_id', user.id)
            .in('post_id', postIds)

        if (votes) {
            votes.forEach(v => userVotesMap.set(v.post_id, v.value))
        }
    }

    return filteredPosts.map((post: any) => ({
        ...post,
        userVote: userVotesMap.get(post.id) || 0,
        // Stats are already in `post` from the view/RPC
        voteCount: post.vote_count,
        voteAverage: post.vote_average,
        voteStdDev: post.vote_stddev
    }))
}

export async function getAllPosts(page: number = 1, limit: number = 10, sortBy: SortOption = 'latest') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const start = (page - 1) * limit
    const end = start + limit - 1

    // Fetch user interests
    let interests: string[] | null = null
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('interests')
            .eq('id', user.id)
            .single()
        interests = profile?.interests
    }

    // Query the VIEW instead of raw table
    let query = supabase
        .from('post_stats_view')
        .select('*')

    // Sorting
    switch (sortBy) {
        case 'trending':
            // Added id tiebreaker
            query = query.order('trending_score', { ascending: false }).order('created_at', { ascending: false }).order('id', { ascending: true })
            break
        case 'divided':
            // SideWidth > 50, highest to lowest, at least 2 votes
            query = query.gte('vote_count', 2).gt('vote_stddev', 50).order('vote_stddev', { ascending: false }).order('vote_count', { ascending: false }).order('id', { ascending: true })
            break
        case 'consensus':
            // SideWidth < 50, lowest to highest, at least 2 votes
            query = query.gte('vote_count', 2).lt('vote_stddev', 50).order('vote_stddev', { ascending: true }).order('vote_count', { ascending: false }).order('id', { ascending: true })
            break
        case 'latest':
        default:
            query = query.order('created_at', { ascending: false }).order('id', { ascending: true })
            break
    }

    // Filter
    // Bypass filter if sortBy is 'latest' to ensure all posts are shown
    // Filter
    if (interests !== null && interests !== undefined) {
        if (interests.length === 0) {
            return []
        } else {
            query = query.in('category', interests)
        }
    }

    const { data: posts, error } = await query.range(start, end)

    if (error) {
        console.error('Error fetching all posts:', error)
        return []
    }

    if (!posts || posts.length === 0) {
        return []
    }

    // Attach User Vote
    const postIds = posts.map((p: any) => p.id)
    const userVotesMap = new Map<string, number>()

    if (user && postIds.length > 0) {
        const { data: votes } = await supabase
            .from('votes')
            .select('post_id, value')
            .eq('user_id', user.id)
            .in('post_id', postIds)

        if (votes) {
            votes.forEach(v => userVotesMap.set(v.post_id, v.value))
        }
    }

    return posts.map((post: any) => ({
        ...post,
        dist_meters: 0,
        userVote: userVotesMap.get(post.id) || 0,
        // View returns snake_case, map to camelCase if needed, or component uses snake?
        // Component uses `voteAverage`, `voteStdDev`.
        // The view columns are `vote_average` etc.
        voteCount: post.vote_count,
        voteAverage: post.vote_average,
        voteStdDev: post.vote_stddev
    }))
}

export async function submitVote(postId: string, value: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Must be logged in to vote")
    }

    // Ensure profile exists (just in case)
    // Although triggers should handle it, we'll do best effort or trust RLS
    // Actually, votes table references profiles(id)
    // If the profile doesn't exist, this will fail.
    // Let's do a quick upsert on profile if we want to be super safe, 
    // or just let it fail if the user is in a bad state. 
    // Given the issues with signup, let's try to ensure profile existence here too or just insert.
    // Ideally user management is cleaner, but for a quick fix:

    // Ensure profile exists before voting to satisfy FK constraint
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: user.id })

    if (profileError) {
        console.error("Error creating/updating profile during vote:", profileError)
        // We continue anyway, as the vote insert might still fail if it was a real error, 
        // but often upsert is what we need.
    }

    const { error } = await supabase
        .from('votes')
        .upsert({
            post_id: postId,
            user_id: user.id,
            value: value
        }, {
            onConflict: 'post_id, user_id'
        })

    if (error) {
        console.error("Error submitting vote:", error)
        throw new Error("Failed to save vote")
    }

    // Fetch fresh votes for this post to return stats
    const { data: votes } = await supabase
        .from('votes')
        .select('value')
        .eq('post_id', postId)

    // Stats calculation (simplified)
    let count = 0
    let sum = 0
    let sqSum = 0

    if (votes) {
        votes.forEach(v => {
            count++
            sum += v.value
            sqSum += v.value * v.value
        })
    }

    const average = count > 0 ? sum / count : 0
    const variance = count > 0 ? (sqSum / count) - (average * average) : 0
    const stdDev = Math.sqrt(Math.max(0, variance))

    return {
        success: true,
        stats: {
            voteCount: count,
            voteAverage: average,
            voteStdDev: stdDev
        }
    }
}

export async function getPostById(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !post) return null

    // Get votes for this post
    const { data: votes } = await supabase
        .from('votes') // Correct logic should fetch votes with user_id to find userVote
        .select('value, user_id')
        .eq('post_id', id)

    // Stats
    let count = 0
    let sum = 0
    let sqSum = 0
    let userVote = 0

    if (votes) {
        votes.forEach(v => {
            count++
            sum += v.value
            sqSum += v.value * v.value
            if (user && v.user_id === user.id) {
                userVote = v.value
            }
        })
    }

    const average = count > 0 ? sum / count : 0
    const variance = count > 0 ? (sqSum / count) - (average * average) : 0
    const stdDev = Math.sqrt(Math.max(0, variance))

    return {
        ...post,
        dist_meters: 0,
        userVote,
        voteCount: count,
        voteAverage: average,
        voteStdDev: stdDev
    }
}

export async function updateProfileRadius(radius: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Must be logged in to update settings")
    }

    // Upsert profile just in case
    await supabase.from('profiles').upsert({ id: user.id })

    const { error } = await supabase
        .from('profiles')
        .update({ local_radius: radius })
        .eq('id', user.id)

    if (error) {
        console.error("Error updating profile radius:", error)
        throw new Error("Failed to update radius")
    }

    return { success: true }
}

export async function updateProfileInterests(interests: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Must be logged in to update settings")
    }

    // Upsert profile just in case
    await supabase.from('profiles').upsert({ id: user.id })

    const { error } = await supabase
        .from('profiles')
        .update({ interests })
        .eq('id', user.id)

    if (error) {
        console.error("Error updating profile interests:", error)
        throw new Error("Failed to update interests")
    }

    return { success: true }
}
