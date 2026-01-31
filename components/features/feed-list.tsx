"use client"

import { useEffect, useState } from "react"
import { useLocation } from "@/lib/hooks/use-location"
import { getAllPosts, getNearbyPosts } from "@/lib/actions"
import { GlassCard } from "@/components/ui/glass-card"
import { VoteSlider } from "@/components/features/vote-slider"
import { Loader2, MapPin, Globe, Plus } from "lucide-react"
import Link from "next/link"
import { User } from "@supabase/supabase-js"
import { cn } from "@/lib/utils"

interface FeedListProps {
    user: User | null
}

export function FeedList({ user }: FeedListProps) {
    const { coords, loading: locLoading, error: locError } = useLocation()
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [feedType, setFeedType] = useState<'global' | 'local'>('global')

    const fetchPosts = () => {
        setLoading(true)

        if (feedType === 'local') {
            if (!coords) {
                // Wait for coords or show error handled by UI
                setLoading(false)
                return
            }
            getNearbyPosts(coords.latitude, coords.longitude)
                .then(data => setPosts(data || []))
                .finally(() => setLoading(false))
        } else {
            getAllPosts()
                .then(data => setPosts(data || []))
                .finally(() => setLoading(false))
        }
    }

    // Refetch when feedType changes or coords become available (if local)
    useEffect(() => {
        if (feedType === 'local' && !coords) return
        fetchPosts()
    }, [feedType, coords])

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

            {/* Feed Toggle */}
            <div className="flex justify-center mb-8">
                <div className="flex bg-black/20 backdrop-blur-md p-1 rounded-full border border-white/5">
                    <button
                        onClick={() => setFeedType('global')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                            feedType === 'global'
                                ? "bg-white/10 text-white shadow-lg border border-white/10"
                                : "text-white/40 hover:text-white/60"
                        )}
                    >
                        <Globe className="h-3 w-3" />
                        Global
                    </button>
                    <button
                        onClick={() => setFeedType('local')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                            feedType === 'local'
                                ? "bg-white/10 text-white shadow-lg border border-white/10"
                                : "text-white/40 hover:text-white/60"
                        )}
                    >
                        <MapPin className="h-3 w-3" />
                        Local
                    </button>
                </div>
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center p-12 text-white/50 space-y-4">
                    <Loader2 className="animate-spin h-8 w-8" />
                    <p>{feedType === 'local' ? "Scanning local area..." : "Loading global feed..."}</p>
                </div>
            )}

            {!loading && feedType === 'local' && !coords && (
                <div className="text-center p-8 text-pink-400 bg-pink-500/10 rounded-2xl border border-pink-500/20">
                    <MapPin className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="font-bold">Location Required</p>
                    <p className="text-xs mt-1 opacity-70">Enable location services to see who's fighting nearby.</p>
                </div>
            )}

            {!loading && posts.length === 0 && (
                <div className="text-center p-12 text-white/40">
                    <p>No arguments found.</p>
                    {feedType === 'local' && <p className="text-sm">Be the first to start a local fight!</p>}
                </div>
            )}

            {!loading && posts.map((post) => (
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
