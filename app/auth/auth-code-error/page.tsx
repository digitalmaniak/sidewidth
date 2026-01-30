import Link from 'next/link'

// This needs to be a client component or handle searchParams in a server component way
// For simplicity in this stack, we'll keep it server-side compatible by accessing props
export default async function AuthCodeError(props: { searchParams: Promise<{ error?: string }> }) {
    const searchParams = await props.searchParams
    const error = searchParams.error || 'There was a problem signing you in. The link may have expired or is invalid.'

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md space-y-8 z-10 glass-panel p-8 rounded-2xl shadow-xl border border-white/10 bg-white/5 backdrop-blur-md text-center">
                <h2 className="text-3xl font-black tracking-tighter text-white mb-2">Authentication Error</h2>
                <div className="text-gray-300 mb-6 break-words">
                    {error}
                </div>

                <Link
                    href="/login"
                    className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-3 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors shadow-lg shadow-indigo-500/30"
                >
                    Return to Login
                </Link>
            </div>
        </div>
    )
}
