import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NavigationOverlay from './navigation-overlay'

export default async function Header() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
            <div className="container mx-auto flex h-14 items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <NavigationOverlay user={user} />

                    <Link href="/" className="flex items-center space-x-2 group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-pink-500 flex items-center justify-center font-bold text-white text-lg shadow-[0_0_15px_rgba(236,72,153,0.5)] transition-transform group-hover:scale-110">
                            SW
                        </div>
                        <span className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                            SideWidth
                        </span>
                    </Link>
                </div>

                <nav className="flex items-center gap-4">
                    {user ? (
                        <span className="text-xs text-gray-500 hidden sm:inline-block font-mono">
                            {user.email}
                        </span>
                    ) : (
                        <Link
                            href="/login"
                            className="text-sm font-medium hover:underline underline-offset-4 text-gray-300 hover:text-white"
                        >
                            Login
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    )
}
