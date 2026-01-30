import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft, Clock, MessageSquare, ThumbsUp } from "lucide-react"

async function getProfileData(userId: string) {
    const supabase = await createClient()

    // Fetch Created Posts
    const { data: createdPosts } = await supabase
        .from('posts')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })

    // Fetch vote counts for created posts
    const createdPostIds = createdPosts?.map(p => p.id) || []

    // We can fetch raw votes and count in JS for now (similar to above)
    // Or use rpc/view if available. Sticking to simple JS aggregation for consistency.
    const { data: createdPostVotes } = await supabase
        .from('votes')
        .select('post_id')
        .in('post_id', createdPostIds)

    const createdPostCounts = new Map<string, number>()
    if (createdPostVotes) {
        createdPostVotes.forEach(v => {
            const count = createdPostCounts.get(v.post_id) || 0
            createdPostCounts.set(v.post_id, count + 1)
        })
    }

    const createdPostsWithStats = createdPosts?.map(post => ({
        ...post,
        vote_count: createdPostCounts.get(post.id) || 0
    }))

    // Fetch Voted Posts (with joins if possible, or just raw)
    // Fetch Voted Posts
    const { data: votes } = await supabase
        .from('votes')
        .select(`
            value,
            created_at,
            post:posts (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    // Fetch all votes for these posts to calculate community stats
    const postIds = votes?.map((v: any) => v.post?.id) || []

    // We can't easily join aggregated stats in the above query without a view/RPC.
    // So we'll fetch raw votes for these posts and aggregate in JS (MVP style).
    const { data: relatedVotes } = await supabase
        .from('votes')
        .select('post_id, value')
        .in('post_id', postIds)

    // Calculate stats per post
    const postStats = new Map<string, { count: number, sum: number, min: number, max: number }>()
    if (relatedVotes) {
        relatedVotes.forEach(v => {
            const stats = postStats.get(v.post_id) || { count: 0, sum: 0, min: 100, max: -100 }
            stats.count++
            stats.sum += v.value
            stats.min = Math.min(stats.min, v.value)
            stats.max = Math.max(stats.max, v.value)
            postStats.set(v.post_id, stats)
        })
    }

    // Attach stats to the votes list
    const votesWithStats = votes?.map((vote: any) => {
        const stats = postStats.get(vote.post.id) || { count: 0, sum: 0, min: 0, max: 0 }
        const average = stats.count > 0 ? stats.sum / stats.count : 0
        return {
            ...vote,
            postStats: {
                average,
                count: stats.count,
                min: stats.min,
                max: stats.max
            }
        }
    }) || []

    return {
        createdPosts: createdPostsWithStats || [],
        votes: votesWithStats
    }
}

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { createdPosts, votes } = await getProfileData(user.id)

    // Calculate stats
    const totalCreated = createdPosts.length
    const totalVotes = votes.length

    // Helper to get color for a value (-100 to 100)
    const getGradientColor = (val: number) => {
        // -100 (Blue: 59, 130, 246) -> 100 (Pink: 236, 72, 153)
        const t = (val + 100) / 200 // 0 to 1

        const r = Math.round(59 + (236 - 59) * t)
        const g = Math.round(130 + (72 - 130) * t)
        const b = Math.round(246 + (153 - 246) * t)

        return `rgb(${r}, ${g}, ${b})`
    }

    return (
        <div className="min-h-screen bg-gray-950 pb-20 pt-8">
            <div className="container mx-auto max-w-2xl px-4">

                {/* Header Section */}
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-3xl font-black tracking-tight text-white">
                        Your Profile
                    </h1>
                </div>

                {/* Stats Grid */}
                <div className="mb-10 flex gap-4">
                    <div className="flex-1 rounded-2xl border border-gray-800 bg-gray-900/50 p-6 text-center shadow-sm backdrop-blur-sm">
                        <div className="mb-2 flex justify-center text-blue-400">
                            <MessageSquare className="h-6 w-6" />
                        </div>
                        <div className="text-3xl font-bold text-white">{totalCreated}</div>
                        <div className="text-sm font-medium text-gray-400">Arguments Created</div>
                    </div>
                    <div className="flex-1 rounded-2xl border border-gray-800 bg-gray-900/50 p-6 text-center shadow-sm backdrop-blur-sm">
                        <div className="mb-2 flex justify-center text-purple-400">
                            <ThumbsUp className="h-6 w-6" />
                        </div>
                        <div className="text-3xl font-bold text-white">{totalVotes}</div>
                        <div className="text-sm font-medium text-gray-400">Votes Cast</div>
                    </div>
                </div>

                {/* Created Posts Section */}
                <div className="mb-10">
                    <h2 className="mb-4 text-xl font-bold text-gray-200">
                        My Arguments <span className="text-gray-500 text-sm font-normal">({totalCreated})</span>
                    </h2>

                    {createdPosts.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-800 p-8 text-center text-gray-500">
                            You haven't created any arguments yet.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {createdPosts.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/post/${post.id}?source=profile`}
                                    className="block group"
                                >
                                    <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-4 transition-all hover:border-gray-700 hover:bg-gray-800/50">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                                <span className="font-semibold text-blue-400">{post.side_a}</span>
                                                <span className="text-gray-600">vs</span>
                                                <span className="font-semibold text-pink-400">{post.side_b}</span>
                                            </div>
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                {new Date(post.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex items-center justify-between">
                                            <div className="text-xs text-gray-500 font-mono uppercase tracking-wide">
                                                {post.category}
                                            </div>
                                            <div className="text-xs text-gray-500 font-mono">
                                                {post.vote_count} Votes
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Voted Posts Section */}
                <div>
                    <h2 className="mb-4 text-xl font-bold text-gray-200">
                        Voted History <span className="text-gray-500 text-sm font-normal">({totalVotes})</span>
                    </h2>

                    {votes.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-800 p-8 text-center text-gray-500">
                            You haven't voted on any arguments yet.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {votes.map((vote: any) => {
                                const post = vote.post;
                                if (!post) return null; // Handle deleted posts if simplified FK

                                const { min, max } = vote.postStats;

                                // Calculate visualization of range
                                const leftPct = (min + 100) / 2;
                                const widthPct = Math.max(2, (max - min) / 2); // Ensure at least a sliver

                                const startColor = getGradientColor(min);
                                const endColor = getGradientColor(max);

                                return (
                                    <Link
                                        key={vote.created_at + post.id} // Composite key just in case
                                        href={`/post/${post.id}?source=profile`}
                                        className="block group"
                                    >
                                        <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-4 transition-all hover:border-gray-700 hover:bg-gray-800/50">
                                            <div className="mb-2 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                                    <span className="font-semibold">{post.side_a}</span>
                                                    <span className="text-gray-600">vs</span>
                                                    <span className="font-semibold">{post.side_b}</span>
                                                </div>
                                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                                    {new Date(vote.created_at).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {/* Vote Indicator */}
                                            <div className="mt-2 flex items-center gap-2 text-xs">
                                                <span className="text-gray-500">Your Vote:</span>
                                                <div className="relative h-1.5 flex-1">
                                                    <div className="absolute inset-0 rounded-full bg-gray-800/50 overflow-hidden ring-1 ring-white/10">
                                                        {/* Range Bar (Min to Max) */}
                                                        <div
                                                            className="absolute top-0 bottom-0 rounded-full opacity-80"
                                                            style={{
                                                                left: `${leftPct}%`,
                                                                width: `${widthPct}%`,
                                                                background: `linear-gradient(to right, ${startColor}, ${endColor})`
                                                            }}
                                                        />
                                                    </div>

                                                    {/* White Circle Indicator (User Vote) */}
                                                    <div
                                                        className="absolute top-1/2 h-2.5 w-2.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] transform -translate-y-1/2 -translate-x-1/2 z-10"
                                                        style={{ left: `${(vote.value + 100) / 2}%` }}
                                                    />
                                                </div>
                                                <span className="font-mono text-white w-8 text-right">{vote.value}</span>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>

            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    )
}
