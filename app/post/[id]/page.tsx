import { getPostById } from "@/lib/actions"
import { createClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { VoteSlider } from "@/components/features/vote-slider"
import { MapPin } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function Page({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { id } = await params
    const { source } = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const post = await getPostById(id)

    if (!post) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-white/50 space-y-4">
                <p>Argument not found.</p>
                <Link href="/" className="text-blue-400 hover:underline">Return Home</Link>
            </div>
        )
    }

    const isFromProfile = source === 'profile'
    const backHref = isFromProfile ? '/profile' : '/'
    const backText = isFromProfile ? 'Back to Profile' : 'Back to Feed'

    return (
        <div className="flex flex-col items-center px-4 py-8 pb-24 w-full">
            <Link href={backHref} className="mb-8 text-sm text-white/50 hover:text-white transition-colors self-start max-w-2xl w-full mx-auto">
                &larr; {backText}
            </Link>

            <GlassCard className="max-w-2xl w-full animate-in-fade">
                <div className="mb-6 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-white/60 mb-2 uppercase tracking-wider border border-white/5">
                        {post.category}
                    </span>
                    <h1 className="text-2xl font-bold flex items-center justify-center gap-2 mb-2">
                        {post.side_a} <span className="text-white/30 text-sm">vs</span> {post.side_b}
                    </h1>
                    <p className="text-xs text-white/40 mt-1 flex items-center justify-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {post.location_name || 'Unknown Location'}
                    </p>
                </div>

                <VoteSlider
                    postId={post.id}
                    sideA={post.side_a}
                    sideB={post.side_b}
                    initialValue={post.userVote || 0}
                    disabled={!user}
                    average={post.voteAverage}
                    stdDev={post.voteStdDev}
                    count={post.voteCount}
                />
            </GlassCard>
        </div>
    )
}
