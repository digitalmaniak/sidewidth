"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useLocation } from "@/lib/hooks/use-location"
import { getAllPosts, getNearbyPosts, SortOption } from "@/lib/actions"
import { GlassCard } from "@/components/ui/glass-card"
import { VoteSlider } from "@/components/features/vote-slider"
import { Loader2, MapPin, Globe, Plus, ChevronDown } from "lucide-react"
import Link from "next/link"
import { User } from "@supabase/supabase-js"
import { cn } from "@/lib/utils"

interface FeedListProps {
    user: User | null
    localRadius: number
}

interface PostWithStats {
    id: string
    created_at: string
    created_by: string | null
    side_a: string
    side_b: string
    category: string
    lat: number | null
    long: number | null
    location_name: string | null
    description: string | null
    voteCount: number
    voteAverage: number
    voteStdDev: number
    dist_meters: number
    userVote: number
}

export function FeedList({ user, localRadius }: FeedListProps) {
    const router = useRouter()
    const { coords, loading: locLoading, error: locError } = useLocation()
    const [posts, setPosts] = useState<PostWithStats[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [feedType, setFeedType] = useState<'global' | 'local'>('global')
    const [sortBy, setSortBy] = useState<SortOption>('latest')
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)

    // Reset pagination when switching feed type or sort
    useEffect(() => {
        setPosts([])
        setPage(1)
        setHasMore(true)
        setLoading(true)
        fetchPosts(1, true)
    }, [feedType, coords, sortBy])

    const fetchPosts = (pageNum: number, isReset: boolean) => {
        if (!isReset) setLoadingMore(true)

        const limit = 10

        if (feedType === 'local') {
            if (!coords) {
                setLoading(false)
                setLoadingMore(false)
                return
            }
            getNearbyPosts(coords.latitude, coords.longitude, localRadius, pageNum, limit, sortBy)
                .then(data => {
                    if (data.length < limit) setHasMore(false)
                    setPosts(prev => {
                        if (isReset) return data
                        const existingIds = new Set(prev.map(p => p.id))
                        const newPosts = data.filter((p: PostWithStats) => !existingIds.has(p.id))
                        return [...prev, ...newPosts]
                    })
                })
                .finally(() => {
                    setLoading(false)
                    setLoadingMore(false)
                })
        } else {
            getAllPosts(pageNum, limit, sortBy)
                .then(data => {
                    if (data.length < limit) setHasMore(false)
                    setPosts(prev => {
                        if (isReset) return data
                        // Deduplicate based on ID
                        const existingIds = new Set(prev.map(p => p.id))
                        const newPosts = data.filter((p: PostWithStats) => !existingIds.has(p.id))
                        return [...prev, ...newPosts]
                    })
                })
                .finally(() => {
                    setLoading(false)
                    setLoadingMore(false)
                })
        }
    }

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
                    const nextPage = page + 1
                    setPage(nextPage)
                    fetchPosts(nextPage, false)
                }
            },
            { threshold: 1.0 }
        )

        const sentinel = document.getElementById('sentinel')
        if (sentinel) observer.observe(sentinel)

        return () => {
            if (sentinel) observer.unobserve(sentinel)
        }
    }, [hasMore, loading, loadingMore, page, feedType, sortBy])

    // Reload single post logic for voting updates (optional optimization: update local state instead of refetch)
    const refreshPost = (postId: string) => {
        // For simplicity, we won't refetch the whole list, just update locally if we had the new stats.
        // But since we need fresh stats from DB, we might want a single post fetch function?
        // Or just let it be optimistic. Ideally we update the specific item in the array.
        // For now, let's leave it as is, or trigger a re-fetch of everything (which resets scroll).
        // Better: Find the post in `posts` and update it. 
        // We'll skip complex optimistic updates for this step and focus on pagination first.
        // Actually, let's just not break the scroll. We can ignore the refresh or implement a single fetch.
    }

    return (
        <div className="space-y-6 w-full max-w-2xl px-4 pb-24">
            {/* Header Controls */}
            <div className="flex justify-between items-center mb-8">
                {/* Left Aligned Toggle */}
                <div className="flex bg-black/20 backdrop-blur-md p-1 rounded-full border border-white/5">
                    <button
                        onClick={() => setFeedType('global')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
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
                            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                            feedType === 'local'
                                ? "bg-white/10 text-white shadow-lg border border-white/10"
                                : "text-white/40 hover:text-white/60"
                        )}
                    >
                        <MapPin className="h-3 w-3" />
                        Local
                    </button>
                </div>

                {/* Right Aligned Sorting Dropdown */}
                <div className="relative group">
                    <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-3 rounded-full border border-white/5 text-xs font-bold uppercase tracking-wider text-white cursor-pointer hover:bg-white/5 transition-colors">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="appearance-none bg-transparent border-none outline-none cursor-pointer pr-6 text-right"
                        >
                            <option value="latest" className="text-black">Latest</option>
                            <option value="trending" className="text-black">Trending</option>
                            <option value="divided" className="text-black">Controversial</option>
                            <option value="consensus" className="text-black">Consensus</option>
                        </select>
                        <ChevronDown className="h-3 w-3 absolute right-3 pointer-events-none opacity-50" />
                    </div>
                </div>
            </div>

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

            {posts.map((post) => (
                <FeedPostCard key={post.id} post={post} user={user} refreshPost={refreshPost} />
            ))}

            {/* Sentinel for Infinite Scroll */}
            {!loading && (
                <div id="sentinel" className="h-20 flex items-center justify-center text-white/20">
                    {loadingMore && <Loader2 className="animate-spin h-6 w-6" />}
                    {!hasMore && posts.length > 0 && <span className="text-xs uppercase tracking-widest opacity-50">No more arguments</span>}
                </div>
            )}
        </div>
    )
}

function FeedPostCard({ post, user, refreshPost }: { post: PostWithStats, user: User | null, refreshPost: (id: string) => void }) {
    const router = useRouter()
    const isDraggingRef = useRef(false)

    const handleCardClick = () => {
        if (!isDraggingRef.current) {
            router.push(`/post/${post.id}?source=feed`)
        }
    }

    return (
        <GlassCard
            className="animate-in-fade relative group/card cursor-pointer transition-colors hover:bg-white/5"
            onClick={handleCardClick}
        >
            {/* Header Area (formerly Link) */}
            <div className="block mb-6 hover:opacity-80 transition-opacity">
                <div className="flex justify-between items-center mb-4">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-white/60 uppercase tracking-wider border border-white/5">
                        {post.category}
                    </span>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center">
                        <MapPin className="h-3 w-3 mr-1 opacity-50" />
                        {post.dist_meters > 0 ? `${Math.round(post.dist_meters / 1000)}km • ` : ''}{post.location_name || 'Global'}
                    </span>
                </div>

                {post.description && (
                    <p className="text-center text-sm text-white/60 px-4 font-normal">
                        {post.description.length > 150 ? (
                            <>
                                {post.description.slice(0, 150)}... <span className="text-blue-400 hover:underline">Read More</span>
                            </>
                        ) : (
                            post.description
                        )}
                    </p>
                )}
            </div>

            <VoteSlider
                postId={post.id}
                sideA={post.side_a}
                sideB={post.side_b}
                initialValue={post.userVote || 0}
                onCommit={(val) => {
                    console.log(`Voted ${val} on ${post.id}`)
                    refreshPost(post.id)
                }}
                disabled={!user}
                average={post.voteAverage}
                stdDev={post.voteStdDev}
                count={post.voteCount}
                onDragStateChange={(isDragging) => {
                    isDraggingRef.current = isDragging
                }}
            />
        </GlassCard>
    )
}
