'use client'

import { useState, useEffect } from 'react'
import { Joyride, EVENTS } from 'react-joyride'
import type { EventData } from 'react-joyride'
import { TourTooltip } from './TourTooltip'
import { dashboardTourSteps, getTourDoneKey, TOUR_IDS } from '@/constants/tour-steps'

const TOUR_START_DELAY_MS = 800
const DASHBOARD_TOUR_KEY = getTourDoneKey(TOUR_IDS.dashboard)

export function DashboardTour() {
    const [run, setRun] = useState(false)

    useEffect(() => {
        if (localStorage.getItem(DASHBOARD_TOUR_KEY)) return

        const id = setTimeout(() => setRun(true), TOUR_START_DELAY_MS)
        return () => clearTimeout(id)
    }, [])

    function handleEvent(data: EventData) {
        if (data.type === EVENTS.TOUR_END) {
            localStorage.setItem(DASHBOARD_TOUR_KEY, '1')
            setRun(false)
        }
    }

    return (
        <Joyride
            steps={dashboardTourSteps}
            run={run}
            continuous
            scrollToFirstStep={false}
            tooltipComponent={TourTooltip}
            onEvent={handleEvent}
            options={{
                overlayColor: 'rgba(0, 0, 0, 0.35)',
                spotlightPadding: 6,
                zIndex: 1000,
                skipScroll: true,
            }}
        />
    )
}
