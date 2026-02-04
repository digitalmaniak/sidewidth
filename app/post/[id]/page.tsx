import { getPostById } from "@/lib/actions"
import { createClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { VoteSlider } from "@/components/features/vote-slider"
import { MapPin } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ShareButton } from "@/components/features/share-button"

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
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/5 text-white/60 uppercase tracking-wider border border-white/5">
                            {post.category}
                        </span>
                        <span className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center">
                            <MapPin className="h-3 w-3 mr-1 opacity-50" />
                            {post.location_name || 'Global'}
                        </span>
                    </div>

                    {post.description ? (
                        <p className="text-left text-sm text-white/80 leading-relaxed font-light px-4">
                            {post.description}
                        </p>
                    ) : (
                        <h1 className="text-3xl font-bold flex items-center justify-center gap-2 mb-2">
                            {post.side_a} <span className="text-white/30 text-lg">vs</span> {post.side_b}
                        </h1>
                    )}
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

            <div className="max-w-2xl w-full flex justify-end mt-4">
                <ShareButton url={`${process.env.NEXT_PUBLIC_APP_URL || 'https://sidewidth.com'}/post/${post.id}`} />
            </div>
        </div>
    )
}
