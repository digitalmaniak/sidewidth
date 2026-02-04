'use client'

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function ShareButton({ url }: { url: string }) {
    const [copied, setCopied] = useState(false)

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    return (
        <button
            onClick={handleShare}
            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-white/60 hover:text-white"
        >
            <div className="relative w-4 h-4">
                <AnimatePresence mode="wait">
                    {copied ? (
                        <motion.div
                            key="check"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                        >
                            <Check className="w-4 h-4 text-green-400" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="copy"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                        >
                            <Copy className="w-4 h-4" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <span className="text-sm font-medium">
                {copied ? "Copied!" : "Share Post"}
            </span>
        </button>
    )
}
