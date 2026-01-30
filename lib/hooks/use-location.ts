"use client"

import { useState, useEffect } from "react"

interface LocationState {
    coords: {
        latitude: number
        longitude: number
    } | null
    error: string | null
    loading: boolean
}

export function useLocation() {
    const [state, setState] = useState<LocationState>({
        coords: null,
        error: null,
        loading: true,
    })

    useEffect(() => {
        if (!("geolocation" in navigator)) {
            setState((s) => ({ ...s, error: "Geolocation not supported", loading: false }))
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setState({
                    coords: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    },
                    error: null,
                    loading: false,
                })
            },
            (error) => {
                setState((s) => ({ ...s, error: error.message, loading: false }))
            }
        )
    }, [])

    return state
}
