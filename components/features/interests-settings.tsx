"use client"

import { useState } from "react"
import { CATEGORIES } from "@/lib/constants"
import { updateProfileInterests } from "@/lib/actions"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface InterestsSettingsProps {
    initialInterests: string[] | null
}

export function InterestsSettings({ initialInterests }: InterestsSettingsProps) {
    const [selected, setSelected] = useState<string[]>(initialInterests || [...CATEGORIES])
    const [saving, setSaving] = useState(false)

    const toggleInterest = async (category: string) => {
        const newSelected = selected.includes(category)
            ? selected.filter(c => c !== category)
            : [...selected, category]

        setSelected(newSelected)
        setSaving(true)

        try {
            await updateProfileInterests(newSelected)
        } catch (error) {
            console.error("Failed to save interests", error)
        } finally {
            setSaving(false)
        }
    }

    const toggleSelectAll = async () => {
        const areAllSelected = selected.length === CATEGORIES.length // Not strictly needed check, but "Deselect All" usually if >0.
        // User logic: If > 0, Deselect All. If == 0, Select All.

        const shouldSelectAll = selected.length === 0
        const newSelected = shouldSelectAll ? [...CATEGORIES] : []

        setSelected(newSelected)
        setSaving(true)
        try {
            await updateProfileInterests(newSelected)
        } catch (error) {
            console.error("Failed to save interests", error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <label className="text-sm font-medium text-gray-300">Your Interests</label>
                    <p className="text-xs text-gray-500 mt-1">
                        Select topics you want to see in your feed.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {saving && <span className="text-xs text-blue-400 animate-pulse">Saving...</span>}
                    <button
                        onClick={toggleSelectAll}
                        className="text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        {selected.length === 0 ? "Select All" : "Deselect All"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {CATEGORIES.map((category) => {
                    const isSelected = selected.includes(category)
                    return (
                        <button
                            key={category}
                            onClick={() => toggleInterest(category)}
                            className={cn(
                                "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                                isSelected
                                    ? "bg-blue-500/10 border-blue-500/50 text-blue-200"
                                    : "bg-gray-900/30 border-gray-800 text-gray-400 hover:bg-gray-800/50 hover:border-gray-700"
                            )}
                        >
                            <div className={cn(
                                "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                                isSelected
                                    ? "bg-blue-500 border-blue-500 text-white"
                                    : "border-gray-600 bg-transparent"
                            )}>
                                {isSelected && <Check className="h-3 w-3" />}
                            </div>
                            <span className="text-sm font-medium">{category}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
