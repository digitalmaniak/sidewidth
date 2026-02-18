"use client"

import * as React from "react"
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

import { submitVote } from "@/lib/actions"

interface VoteSliderProps {
    postId: string
    sideA: string
    sideB: string
    onCommit?: (value: number) => void
    initialValue?: number
    disabled?: boolean
    average?: number
    stdDev?: number
    count?: number
    onDragStateChange?: (isDragging: boolean) => void
}

export function VoteSlider({
    postId,
    sideA,
    sideB,
    onCommit,
    initialValue = 0,
    disabled = false,
    average = 0,
    stdDev = 0,
    count = 0,
    onDragStateChange
}: VoteSliderProps) {
    // Initialize committed state if already voted
    const [committed, setCommitted] = React.useState(Math.abs(initialValue) > 0)
    // New state for pre-commit (pulsing) phase
    const [preCommitted, setPreCommitted] = React.useState(false)

    const constraintsRef = React.useRef<HTMLDivElement>(null)

    // Motion value - we can't set initial value easily on motionValue without knowing width pixels yet.
    // But we know 0 is center. 
    // We'll set it in useEffect once width is known or just rely on react state for visual?
    // Actually, useMotionValue starts at 0.

    const x = useMotionValue(0)
    const [sliderWidth, setSliderWidth] = React.useState(0)
    const [dragConstraints, setDragConstraints] = React.useState<{ left: number, right: number }>({ left: 0, right: 0 })

    // Thumb width is w-14 = 3.5rem = 56px. Half is 28px.
    const THUMB_RADIUS = 28;

    // Transform x (pixels) to value (-100 to 100)
    // We need to know the width of the track to map pixels to Percentage

    React.useEffect(() => {
        if (constraintsRef.current) {
            const width = constraintsRef.current.offsetWidth
            setSliderWidth(width)

            // Calculate constraints to keep thumb fully inside
            // The thumb is centered (x=0). To stay inside, it can move +/- (W/2 - ThumbRadius)
            const maxOffset = (width / 2) - THUMB_RADIUS
            setDragConstraints({ left: -maxOffset, right: maxOffset })

            // If we have an initial value, set the x position
            if (initialValue !== 0) {
                // Value (-100 to 100) -> Pixels (-maxOffset to maxOffset)
                // x = (Value / 100) * maxOffset
                const pixelX = (initialValue / 100) * maxOffset
                x.set(pixelX)
            }
        }
    }, [initialValue, x])

    // Calculate value based on position using the actual constraints
    // If width is 0 (first render), this range is [0, 0] which is fine.
    const maxUseableOffset = Math.max(0, (sliderWidth / 2) - THUMB_RADIUS)

    const currentValue = useTransform(x,
        [-maxUseableOffset, maxUseableOffset],
        [-100, 100]
    )

    // Dynamic Colors based on side
    const barColor = useTransform(x,
        [-maxUseableOffset, 0, maxUseableOffset],
        ["rgba(59, 130, 246, 0.8)", "rgba(255, 255, 255, 0.1)", "rgba(236, 72, 153, 0.8)"] // Blue to Transparent to Pink
    )

    const fillBarX = useTransform(x, (val) => val < 0 ? val : 0)
    const fillBarWidth = useTransform(x, (val) => Math.abs(val))

    const handleDragStart = () => {
        if (disabled || committed) return
        setPreCommitted(false)
        if (onDragStateChange) onDragStateChange(true)
    }

    const handleDragEnd = async () => {
        if (onDragStateChange) {
            // Delay resetting drag state slightly to allow onClick to fire and be ignored
            setTimeout(() => onDragStateChange(false), 50)
        }
        if (disabled || committed) return

        const val = currentValue.get()
        // Snap to 0 if close to center? Maybe small deadzone.
        const finalVal = Math.abs(val) < 5 ? 0 : Math.round(val)

        if (Math.abs(finalVal) > 10) {
            // Enter pre-committed state instead of committing immediately
            setPreCommitted(true)
        } else {
            // Spring back to center if not committed/strong enough opinion
            animate(x, 0, { type: "spring", stiffness: 300, damping: 30 })
            setPreCommitted(false)
        }
    }

    const confirmVote = async () => {
        if (disabled || committed || !preCommitted) return

        const val = currentValue.get()
        const finalVal = Math.round(val)

        setCommitted(true)
        setPreCommitted(false)

        if (onCommit) onCommit(finalVal)

        try {
            const result = await submitVote(postId, finalVal)
            // If result contains stats, we could update local state if we had it, 
            // but for now relying on onCommit to trigger parent refresh 
            // OR we can make this component self-sufficient for stats display.
            // Ideally onCommit callback handles the data refresh if needed, but 
            // if we want "Instant Feedback" without refetching parent, we should use the result here.

            // To do this properly without prop drilling everything back down, 
            // we'd need internal state for average/stdDev initialized from props.
            // But for MVP, `feed-list`'s onCommit calls `fetchPosts`, which updates props.
            // That flow is robust. 
            // The "Optimized" part is: `submitVote` returns stats, so `feed-list` COULD use them 
            // if we passed them up. `onCommit` only takes value currently.
            // Let's rely on the parent refresh for now as implemented in step 96/124.
            // But we need to update the text "Consensus Reached" -> "SideWidth: ..."

        } catch (err) {
            console.error("Failed to submit vote:", err)
            setCommitted(false) // Unlock on error
            setPreCommitted(true) // Go back to pre-committed
            // Maybe show toast? 
        }
    }

    // Generate ticks for the ruler
    // We want ticks at e.g. -75, -50, -25, 25, 50, 75
    // We can map these percentages to positions using percentages of width? 
    // Easier to just use absolute positioning with %.
    const ticks = [-75, -50, -25, 25, 50, 75]

    // Calculate details for glow visualization
    const glowCenterPct = 50 + (average / 2)
    const glowWidthPct = Math.max(5, (stdDev / 2) * 4)

    return (
        <div className="w-full max-w-md mx-auto space-y-6">

            {/* Side Labels */}
            <div className={cn(
                "flex justify-between text-sm font-bold tracking-widest uppercase text-foreground/80",
                disabled && "opacity-50"
            )}>
                <span className="text-blue-400 text-left">{sideA}</span>
                <span className="text-pink-400 text-right">{sideB}</span>
            </div>

            {/* Slider Container - Defines the drag constraints area */}
            <div
                ref={constraintsRef}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                    "relative h-16 w-full z-10 touch-none", // heavy z-index? touch-none for gestures
                    disabled && "cursor-not-allowed opacity-50 grayscale"
                )}
            >
                {/* Visual Track (Clipped) */}
                <div className={cn(
                    "absolute inset-0 rounded-full glass-panel overflow-hidden transition-all duration-300 pointer-events-none",
                    // committed && !disabled && "opacity-100" // kept original logic intent?
                )}>
                    {/* Ruler Ticks */}
                    <div className="absolute inset-0 pointer-events-none z-0 opacity-30">
                        {ticks.map(t => (
                            <div
                                key={t}
                                className="absolute top-1/2 -translate-y-1/2 w-0.5 bg-white/40 h-3 rounded-full"
                                style={{
                                    left: `${50 + (t / 2)}%`,
                                }}
                            />
                        ))}
                    </div>

                    {/* Center Indicator */}
                    <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-0.5 h-6 bg-white/40 rounded-full z-0" />

                    {/* Dynamic Fill Bar */}
                    {(!committed || count <= 1) && (
                        <motion.div
                            className="absolute top-0 bottom-0 left-1/2 z-0"
                            style={{
                                backgroundColor: barColor,
                                x: fillBarX,
                                width: fillBarWidth,
                            }}
                        />
                    )}

                    {/* SideWidth Glow Gradient */}
                    {((committed || disabled) && count > 1) && (
                        <div className="absolute inset-y-0 w-full overflow-hidden pointer-events-none">
                            {(() => {
                                const getGlowColor = (avg: number) => {
                                    const t = (avg + 100) / 200;
                                    const blue = [59, 130, 246];
                                    const white = [255, 255, 255];
                                    const pink = [236, 72, 153];
                                    let r, g, b;

                                    if (t < 0.5) {
                                        const localT = t * 2;
                                        r = Math.round(blue[0] + (white[0] - blue[0]) * localT);
                                        g = Math.round(blue[1] + (white[1] - blue[1]) * localT);
                                        b = Math.round(blue[2] + (white[2] - blue[2]) * localT);
                                    } else {
                                        const localT = (t - 0.5) * 2;
                                        r = Math.round(white[0] + (pink[0] - white[0]) * localT);
                                        g = Math.round(white[1] + (pink[1] - white[1]) * localT);
                                        b = Math.round(white[2] + (pink[2] - white[2]) * localT);
                                    }
                                    return `rgba(${r}, ${g}, ${b}, 0.6)`;
                                };

                                const glowColor = getGlowColor(average);

                                return (
                                    <>
                                        <div
                                            className="absolute top-0 bottom-0 blur-2xl rounded-full opacity-60"
                                            style={{
                                                left: `${glowCenterPct}%`,
                                                width: `${Math.max(20, glowWidthPct * 2)}%`,
                                                backgroundColor: glowColor,
                                                transform: 'translateX(-50%)',
                                            }}
                                        />
                                        <div
                                            className="absolute top-0 bottom-0 blur-xl rounded-full"
                                            style={{
                                                left: `${glowCenterPct}%`,
                                                width: `${glowWidthPct}%`,
                                                backgroundColor: glowColor,
                                                transform: 'translateX(-50%)', // Use CSS transform for static pos
                                                boxShadow: `0 0 ${Math.min(50, glowWidthPct)}px ${glowColor}`
                                            }}
                                        />
                                        <div
                                            className="absolute top-0 bottom-0 bg-white blur-md mix-blend-overlay"
                                            style={{
                                                left: `${glowCenterPct}%`,
                                                width: '8px',
                                                transform: 'translateX(-50%)',
                                                opacity: 0.9
                                            }}
                                        />
                                        <div
                                            className="absolute top-2 bottom-2 bg-white/90 rounded-full shadow-[0_0_10px_white]"
                                            style={{
                                                left: `${glowCenterPct}%`,
                                                width: '2px',
                                                transform: 'translateX(-50%)',
                                            }}
                                        />
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    {/* Average Indicator (Triangle + Text) - ONLY if results are shown */}
                    {((committed || disabled) && count > 1) && (
                        <div
                            className="absolute -top-10 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-500 z-30"
                            style={{ left: `${glowCenterPct}%` }}
                        >
                            <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest mb-1 shadow-black drop-shadow-md">Avg</span>
                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white/90 drop-shadow-md" />
                            {/* Vertical Line connecting to bar */}
                            <div className="w-[1px] h-3 bg-white/50" />
                        </div>
                    )}
                </div>

                {/* Draggable Thumb & Confirm Button */}
                {!disabled && (
                    <motion.div
                        className={cn(
                            "absolute top-1 left-1/2 -ml-7 h-14 w-14 z-20 flex items-center justify-center",
                            "cursor-grab active:cursor-grabbing"
                        )}
                        drag={committed ? false : "x"}
                        dragConstraints={dragConstraints}
                        dragElastic={0.05}
                        dragMomentum={false}
                        style={{ x }}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {/* The Thumb Itself */}
                        <motion.div
                            className={cn(
                                "h-14 w-14 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)] flex items-center justify-center",
                                committed && "shadow-none bg-white/20 backdrop-blur-md border border-white/30"
                            )}
                            animate={
                                committed ? { rotate: 90, scale: 0.8 } :
                                    { rotate: 0, scale: 1 }
                            }
                        >
                            <motion.div
                                className={cn(
                                    "w-1 h-6 bg-slate-300 rounded-full transition-colors",
                                    (preCommitted || committed) && "bg-slate-400"
                                )}
                                animate={committed ? { height: 14, width: 14, borderRadius: 4, opacity: 0.5 } : { height: 24, width: 4, borderRadius: 9999 }}
                            />
                        </motion.div>

                        {/* Pop-out Confirm Button */}
                        <AnimatePresence>
                            {preCommitted && !committed && (
                                <motion.button
                                    initial={{ opacity: 0, y: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 60, scale: 1 }} // 60px down from center of thumb (thumb is 56px tall, so ~32px clearance)
                                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 bg-green-500 hover:bg-green-400 text-white text-sm font-bold rounded-full shadow-[0_0_20px_rgba(34,197,94,0.6)] border border-green-300 z-50 pointer-events-auto"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        confirmVote()
                                    }}
                                >
                                    Confirm
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>


            {/* Feedback Text */}
            <div className={cn(
                "font-mono text-xs text-white/50 h-4 flex items-center w-full transition-all",
                ((committed || disabled) && count > 1) ? "justify-between px-1" : "justify-center"
            )}>
                {disabled ? (
                    count <= 1 ? (
                        <span>Login to vote</span>
                    ) : (
                        <>
                            <span>Votes: {count}</span>
                            <span>
                                SideWidth: {stdDev.toFixed(1)} ({(() => {
                                    if (stdDev < 20) return "Tight Consensus"
                                    if (stdDev < 40) return "General Consensus"
                                    if (stdDev < 60) return "Mixed Opinions"
                                    if (stdDev < 80) return "Divided"
                                    return "Strong Disagreement"
                                })()})
                            </span>
                        </>
                    )
                ) : committed ? (
                    count <= 1 ? (
                        <span>Waiting for more votes...</span>
                    ) : (
                        <>
                            <span>Votes: {count}</span>
                            <span>
                                SideWidth: {stdDev.toFixed(1)} ({(() => {
                                    if (stdDev < 20) return "Tight Consensus"
                                    if (stdDev < 40) return "General Consensus"
                                    if (stdDev < 60) return "Mixed Opinions"
                                    if (stdDev < 80) return "Divided"
                                    return "Strong Disagreement"
                                })()})
                            </span>
                        </>
                    )
                ) : preCommitted ? (
                    <span></span> // Empty, because the button says Confirm now
                ) : (
                    <span>Slide to vote</span>
                )}
            </div>
        </div>
    )
}
