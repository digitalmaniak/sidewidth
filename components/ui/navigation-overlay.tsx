'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import HamburgerButton from "./hamburger-button";
import { LogOut, Plus, User } from "lucide-react";
import { signOut } from "@/app/actions";
import { createPortal } from "react-dom";

export default function NavigationOverlay({ user }: { user: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const menuItems = [
        {
            href: user ? "/create" : "/login",
            label: "New Argument",
            icon: Plus,
            color: "text-blue-400"
        },
        {
            href: "/profile",
            label: "Profile & History",
            icon: User,
            color: "text-purple-400"
        }
    ];

    const toggle = () => setIsOpen(!isOpen);

    return (
        <>
            <HamburgerButton isOpen={isOpen} toggle={toggle} />

            {mounted && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-[100] flex flex-col bg-gray-950/98 backdrop-blur-xl"
                        >
                            {/* Close Button Header */}
                            <div className="container mx-auto flex h-14 items-center px-4">
                                <HamburgerButton isOpen={true} toggle={toggle} />
                            </div>

                            <div className="flex flex-1 flex-col items-center justify-center gap-8 p-4">
                                {menuItems.map((item, idx) => (
                                    <motion.div
                                        key={item.href}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        transition={{ delay: idx * 0.1, duration: 0.3 }}
                                    >
                                        <Link
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className="group flex flex-col items-center gap-3 p-4 transition-all hover:scale-105"
                                        >
                                            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900/50 shadow-lg ring-1 ring-white/10 ${item.color} group-hover:ring-${item.color}`}>
                                                <item.icon className="h-8 w-8" />
                                            </div>
                                            <span className="text-xl font-bold tracking-tight text-gray-200 group-hover:text-white">
                                                {item.label}
                                            </span>
                                        </Link>
                                    </motion.div>
                                ))}

                                {user && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        transition={{ delay: 0.2, duration: 0.3 }}
                                    >
                                        <form action={async () => {
                                            await signOut(); // Server action
                                            setIsOpen(false);
                                        }}>
                                            <button className="group flex flex-col items-center gap-3 p-4 transition-all hover:scale-105">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900/50 shadow-lg ring-1 ring-white/10 text-red-500 group-hover:ring-red-500">
                                                    <LogOut className="h-8 w-8" />
                                                </div>
                                                <span className="text-xl font-bold tracking-tight text-gray-200 group-hover:text-red-400">
                                                    Logout
                                                </span>
                                            </button>
                                        </form>
                                    </motion.div>
                                )}

                            </div>

                            {/* Footer / Info if needed */}
                            <div className="p-8 text-center text-sm text-gray-500">
                                SideWidth &copy; 2026
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
