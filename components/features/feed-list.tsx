"use client"

import { useEffect, useState } from "react"
// import { useLocation } from "@/lib/hooks/use-location"
import { getAllPosts } from "@/lib/actions"
import { GlassCard } from "@/components/ui/glass-card"
import { VoteSlider } from "@/components/features/vote-slider"
import { Loader2, MapPin, Plus } from "lucide-react"
import Link from "next/link"
import { User } from "@supabase/supabase-js"

interface FeedListProps {
    user: User | null
}

export function FeedList({ user }: FeedListProps) {
    // const { coords, loading: locLoading, error: locError } = useLocation()
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchPosts = () => {
        setLoading(true)
        getAllPosts()
            .then(data => setPosts(data || []))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchPosts()
    }, [])

    /* 
    // Temporarily disabled location blocking
    if (locLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-white/50 space-y-4">
                <Loader2 className="animate-spin h-8 w-8" />
                <p>Locating your debate circle...</p>
            </div>
        )
    }

    if (locError) {
        return (
            <div className="text-center p-8 text-pink-400">
                <p>Could not get location. Enable permissions to see local fights.</p>
                <p className="text-xs mt-2 opacity-70">{locError}</p>
            </div>
        )
    }
    */

    if (!loading && posts.length === 0) {
        return (
            <div className="text-center p-12 text-white/40">
                <p>No arguments found nearby.</p>
                <p className="text-sm pb-4">Maybe everyone agrees here? (Unlikely)</p>
                {user && (
                    <Link
                        href="/create"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 font-bold hover:bg-blue-500 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Start an Argument
                    </Link>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6 w-full max-w-2xl px-4 pb-24">
            {user && (
                <Link
                    href="/create"
                    className="w-full flex items-center justify-center gap-2 p-4 mb-6 rounded-2xl bg-gradient-to-r from-blue-600/20 to-pink-600/20 border border-white/10 hover:border-white/20 transition-all group"
                >
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-lg">Start New Argument</span>
                </Link>
            )}

            <div className="flex items-center space-x-2 text-xs text-blue-300 uppercase tracking-widest mb-4 justify-center">
                <MapPin className="h-4 w-4" />
                <span> Global Feed </span>
            </div>

            {posts.map((post) => (
                <GlassCard key={post.id} className="animate-in-fade relative group/card">
                    {/* Clickable Header Area */}
                    <Link href={`/post/${post.id}?source=feed`} className="block mb-6 text-center hover:opacity-80 transition-opacity">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-white/60 mb-2 uppercase tracking-wider border border-white/5">
                            {post.category}
                        </span>
                        <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                            {post.side_a} <span className="text-white/30 text-sm">vs</span> {post.side_b}
                        </h3>
                        <p className="text-xs text-white/40 mt-1">
                            {post.dist_meters > 0 ? `${Math.round(post.dist_meters / 1000)}km away • ` : ''}{post.location_name || 'Unknown Location'}
                        </p>
                    </Link>

                    <VoteSlider
                        postId={post.id}
                        sideA={post.side_a}
                        sideB={post.side_b}
                        initialValue={post.userVote || 0}
                        onCommit={(val) => {
                            console.log(`Voted ${val} on ${post.id}`)
                            fetchPosts() // Refresh data to show consensus
                        }}
                        disabled={!user}
                        average={post.voteAverage}
                        stdDev={post.voteStdDev}
                        count={post.voteCount}
                    />
                </GlassCard>
            ))}
        </div>
    )
}
