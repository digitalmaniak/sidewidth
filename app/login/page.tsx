
import { login, signup } from '@/app/actions'

export default async function LoginPage(props: { searchParams: Promise<{ message?: string; view?: string }> }) {
    const searchParams = await props.searchParams
    const isSignup = searchParams.view === 'signup'

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements to match main page vibe but subtler */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md space-y-8 z-10 glass-panel p-8 rounded-2xl shadow-xl border border-white/10 bg-white/5 backdrop-blur-md">
                <div className="mb-8 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-pink-500 flex items-center justify-center font-bold text-white text-xl mb-4 shadow-[0_0_20px_rgba(236,72,153,0.5)]">
                        SW
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-white">SideWidth</h1>
                    <p className="text-white/50 mt-2 text-sm uppercase tracking-widest">Consensus Engine</p>
                </div>

                <form className="mt-8 space-y-6">
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                // autoComplete="email"
                                required
                                className="relative block w-full rounded-t-md border-0 py-3 text-gray-100 ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-gray-800/50 px-4"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                // autoComplete={isSignup ? "new-password" : "current-password"}
                                required
                                className="relative block w-full rounded-b-md border-0 py-3 text-gray-100 ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-gray-800/50 px-4"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            formAction={isSignup ? signup : login}
                            className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-3 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors shadow-lg shadow-indigo-500/30"
                        >
                            {isSignup ? 'Sign up' : 'Log in'}
                        </button>
                    </div>

                    <div className="text-center text-sm">
                        {isSignup ? (
                            <div className="text-gray-400">
                                Already have an account?{' '}
                                <a href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">
                                    Log in
                                </a>
                            </div>
                        ) : (
                            <div className="text-gray-400">
                                Need an account?{' '}
                                <a href="/login?view=signup" className="font-semibold text-indigo-400 hover:text-indigo-300">
                                    Sign up
                                </a>
                            </div>
                        )}
                    </div>

                    {searchParams?.message && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-center text-sm text-red-600 dark:text-red-400">
                                {searchParams.message}
                            </p>
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}

