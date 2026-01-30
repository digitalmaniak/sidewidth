"use server"

import { createClient } from "@/lib/supabase/server"

export async function getNearbyPosts(lat: number, long: number, distKm: number = 50) {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_nearby_posts', {
        user_lat: lat,
        user_long: long,
        dist_km: distKm
    })

    if (error) {
        console.error('Error fetching nearby posts:', error)
        return []
    }

    return data
}

export async function getAllPosts() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch posts
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching all posts:', error)
        return []
    }

    // Fetch all votes to calculate stats
    const { data: allVotes } = await supabase
        .from('votes')
        .select('post_id, value')

    // Calculate stats per post
    const postStats = new Map<string, { count: number, sum: number, sqSum: number }>()

    if (allVotes) {
        allVotes.forEach(v => {
            const stats = postStats.get(v.post_id) || { count: 0, sum: 0, sqSum: 0 }
            stats.count++
            stats.sum += v.value
            stats.sqSum += v.value * v.value
            postStats.set(v.post_id, stats)
        })
    }

    let userVotesMap = new Map<string, number>()

    if (user) {


        // Let's keep the existing user fetch for simplicity and to avoid fetching user_ids for everyone (privacy/payload size, though minimal here)
        const { data: votes } = await supabase
            .from('votes')
            .select('post_id, value')
            .eq('user_id', user.id)

        if (votes) {
            votes.forEach(v => userVotesMap.set(v.post_id, v.value))
        }
    }

    return posts.map(post => {
        const stats = postStats.get(post.id) || { count: 0, sum: 0, sqSum: 0 }
        const average = stats.count > 0 ? stats.sum / stats.count : 0

        // Variance = (SumSQ / N) - (Mean^2)
        // StdDev = Sqrt(Variance)
        const variance = stats.count > 0 ? (stats.sqSum / stats.count) - (average * average) : 0
        const stdDev = Math.sqrt(Math.max(0, variance)) // Ensure non-negative

        return {
            ...post,
            dist_meters: 0,
            userVote: userVotesMap.get(post.id) || 0,
            voteCount: stats.count,
            voteAverage: average,
            voteStdDev: stdDev
        }
    })
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
