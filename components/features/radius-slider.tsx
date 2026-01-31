"use client"

import { useState, useRef, useEffect } from "react"
import { updateProfileRadius } from "@/lib/actions"
import { MapPin } from "lucide-react"

interface RadiusSliderProps {
    initialRadius: number
}

export function RadiusSlider({ initialRadius }: RadiusSliderProps) {
    const [radius, setRadius] = useState(initialRadius)
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Snap to 5km increments
    const steps = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]
    const min = 5
    const max = 50

    // Update server when drag ends
    const handleRelease = async (finalRadius: number) => {
        try {
            await updateProfileRadius(finalRadius)
            console.log("Updated radius to", finalRadius)
        } catch (error) {
            console.error("Failed to save radius", error)
            // Optionally revert UI logic here if needed
        }
    }

    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault()
        setIsDragging(true)
        updateValue(e.clientX)
    }

    const handlePointerMove = (e: PointerEvent) => {
        if (isDragging) {
            updateValue(e.clientX)
        }
    }

    const handlePointerUp = (e: PointerEvent) => {
        if (isDragging) {
            setIsDragging(false)
            // We need to pass the current radius here, but state updates might be async.
            // Best is to calculate it again or use a ref, but usually state is fine for the release action if using latest.
            // Actually, let's use the calculated value from the event to be sure.
            // Or just trigger the save in the effect when isDragging becomes false? 
            // Better: updateValue returns the value, we can use that if we refactored, 
            // but simpler: just look at `radius` state in a useEffect dependent on isDragging?
            // No, stale closures.
            // Let's just handle it in updateValue or track last value in a ref.
            // Re-calculating from clientX is safest.

            // Wait, react state is fine if we use the value from the last move. 
            // But pointerUp might happen without a move.

            // Let's just use the current radius value, usually user stops moving then lifts.
            // But to be precise, better trigger logic in the useEffect hook on `isDragging` change:
            // if (!isDragging && wasDragging) -> save.
        }
    }

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('pointermove', handlePointerMove)
            window.addEventListener('pointerup', handlePointerUp)
        } else {
            window.removeEventListener('pointermove', handlePointerMove)
            window.removeEventListener('pointerup', handlePointerUp)
        }
        return () => {
            window.removeEventListener('pointermove', handlePointerMove)
            window.removeEventListener('pointerup', handlePointerUp)
        }
    }, [isDragging])

    // Save on drag end
    // We use a ref to track if we just stopped dragging to avoid initial mount trigger
    const prevDragging = useRef(false)
    useEffect(() => {
        if (prevDragging.current && !isDragging) {
            handleRelease(radius)
        }
        prevDragging.current = isDragging
    }, [isDragging, radius])


    const updateValue = (clientX: number) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
        const percent = x / rect.width

        // Map percent to value range [5, 50]
        const rawValue = min + percent * (max - min)

        // Round to nearest step (5)
        const steppedValue = Math.round(rawValue / 5) * 5
        const clampedValue = Math.max(min, Math.min(max, steppedValue))

        setRadius(clampedValue)
    }

    // Visualization
    // Percent for the slider handle
    const percent = ((radius - min) / (max - min)) * 100

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4">

            </div>

            <div
                ref={containerRef}
                className="relative h-12 w-full touch-none select-none cursor-pointer flex items-center"
                onPointerDown={handlePointerDown}
            >
                {/* Track Background */}
                <div className="absolute left-0 right-0 h-2 bg-gray-800 rounded-full overflow-hidden">
                    {/* Active Track */}
                    <div
                        className="h-full bg-blue-500 transition-all duration-75 ease-out"
                        style={{ width: `${percent}%` }}
                    />
                </div>

                {/* Steps Dots (Optional, but user asked for step slider) */}
                <div className="absolute inset-0 flex justify-between items-center pointer-events-none px-[6px]">
                    {/* px adjustment to align dots with handle center roughly */}
                    {steps.map((step) => {
                        const stepPercent = ((step - min) / (max - min)) * 100
                        // Don't show start and end dots if they overlap too much or style preference
                        // Let's show all for clarity
                        return (
                            <div
                                key={step}
                                className={`h-1 w-1 rounded-full ${step <= radius ? 'bg-blue-300' : 'bg-gray-700'}`}
                                style={{
                                    left: `${stepPercent}%`,
                                    position: 'absolute',
                                    transform: 'translateX(-50%)'
                                }}
                            />
                        )
                    })}
                </div>

                {/* Handle */}
                <div
                    className="absolute h-6 w-6 bg-white rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform duration-75"
                    style={{ left: `${percent}%`, transform: 'translateX(-50%)' }}
                >
                    <div className="h-2 w-2 bg-blue-500 rounded-full" />
                </div>

                {/* Tooltip / Label */}
                <div
                    className="absolute -top-6 bg-gray-900 border border-gray-700 text-xs px-2 py-1 rounded text-white font-mono whitespace-nowrap pointer-events-none"
                    style={{ left: `${percent}%`, transform: 'translateX(-50%)' }}
                >
                    {radius}km
                </div>

            </div>

            <div className="flex justify-between text-xs text-gray-500 font-mono mt-1">
                <span>{min}km</span>
                <span>{max}km</span>
            </div>
        </div>
    )
}
