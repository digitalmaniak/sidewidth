'use client'

import { createPost } from '@/app/actions'
import { CATEGORIES } from '@/lib/constants'
import { useEffect, useState, Suspense } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

function CreateForm() {
    const searchParams = useSearchParams()
    const message = searchParams.get('message')

    const [location, setLocation] = useState<{ lat: number; long: number } | null>(null)
    const [locLoading, setLocLoading] = useState(true)
    const [locError, setLocError] = useState<string | null>(null)

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocError('Geolocation is not supported by your browser')
            setLocLoading(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    long: position.coords.longitude
                })
                setLocLoading(false)
            },
            (error) => {
                console.error("Error getting location", error)
                setLocError('Unable to retrieve your location')
                setLocLoading(false)
            }
        )
    }, [])

    return (
        <div className="max-w-2xl mx-auto pt-[50px] px-4">
            <h1 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-pink-400">
                Create New Argument
            </h1>

            <form action={createPost} className="space-y-6 bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
                {/* Hidden Location Inputs */}
                <input type="hidden" name="lat" value={location?.lat || ''} />
                <input type="hidden" name="long" value={location?.long || ''} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="side_a" className="block text-sm font-medium text-gray-300">
                            Side A
                        </label>
                        <input
                            type="text"
                            name="side_a"
                            id="side_a"
                            required
                            placeholder="e.g. Cats"
                            className="block w-full rounded-xl border-white/10 bg-black/20 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm sm:leading-6 px-4 py-3"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="side_b" className="block text-sm font-medium text-gray-300">
                            Side B
                        </label>
                        <input
                            type="text"
                            name="side_b"
                            id="side_b"
                            required
                            placeholder="e.g. Dogs"
                            className="block w-full rounded-xl border-white/10 bg-black/20 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all sm:text-sm sm:leading-6 px-4 py-3"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-300">
                        Category
                    </label>
                    <select
                        name="category"
                        id="category"
                        required
                        className="block w-full rounded-xl border-white/10 bg-black/20 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm sm:leading-6 px-4 py-3"
                    >
                        <option value="" className="bg-slate-900">Select a category</option>
                        {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat} className="bg-slate-900">
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center justify-center text-xs text-white/40 gap-2">
                    {locLoading ? (
                        <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Acquiring location tag...</span>
                        </>
                    ) : location ? (
                        <>
                            <MapPin className="w-3 h-3 text-green-400" />
                            <span className="text-green-400">Location tagged</span>
                        </>
                    ) : (
                        <>
                            <MapPin className="w-3 h-3 text-red-400" />
                            <span className="text-red-400">Location hidden (Global only)</span>
                        </>
                    )}
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        className="flex w-full justify-center rounded-full bg-gradient-to-r from-blue-600 to-pink-600 px-3 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        Start Argument
                    </button>
                    {message && (
                        <p className="mt-4 text-center text-sm text-red-400 bg-red-900/20 p-2 rounded-lg border border-red-500/20">
                            {message}
                        </p>
                    )}
                </div>
            </form>
        </div>
    )
}

export default function CreatePage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-white/50">Loading form...</div>}>
            <CreateForm />
        </Suspense>
    )
}

