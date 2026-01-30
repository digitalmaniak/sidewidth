'use client'

import { motion } from "framer-motion";

interface HamburgerButtonProps {
    isOpen: boolean;
    toggle: () => void;
}

export default function HamburgerButton({ isOpen, toggle }: HamburgerButtonProps) {
    return (
        <button
            onClick={toggle}
            className="relative z-[110] flex h-10 w-10 flex-col items-center justify-center gap-1.5 p-2 focus:outline-none"
            aria-label="Toggle Menu"
        >
            <motion.span
                animate={isOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                className="h-0.5 w-6 rounded-full bg-white transition-colors"
            />
            <motion.span
                animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
                className="h-0.5 w-6 rounded-full bg-white transition-colors"
            />
            <motion.span
                animate={isOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                className="h-0.5 w-6 rounded-full bg-white transition-colors"
            />
        </button>
    );
}
