'use client'

import { useEffect, useRef, useState } from 'react'
import { useVisibilityGatedAnimationFrame } from '@/hooks/useVisibilityGatedAnimationFrame'

type Node = { x: number; y: number; vx: number; vy: number; r: number; matched: boolean }

const NODE_COUNT = 60
const LINK_DISTANCE = 160
const LINK_DISTANCE_SQ = LINK_DISTANCE * LINK_DISTANCE
const MATCH_RATIO = 0.16
const RESIZE_DEBOUNCE_MS = 150

export function LandingConstellation() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const tickRef = useRef((_time: number) => {})
    const [reduceMotion, setReduceMotion] = useState(false)

    useEffect(() => {
        setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        const parent = canvas?.parentElement
        const ctx = canvas?.getContext('2d')
        if (!canvas || !parent || !ctx) return

        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const rootStyle = getComputedStyle(document.documentElement)
        const matchedColor = rootStyle.getPropertyValue('--interactive-action').trim()
        const dimColor = rootStyle.getPropertyValue('--muted-foreground').trim()

        let width = 0
        let height = 0
        let nodes: Node[] = []
        let resizeTimer = 0

        function resize() {
            width = parent!.clientWidth
            height = parent!.clientHeight
            canvas!.width = width * dpr
            canvas!.height = height * dpr
            canvas!.style.width = `${width}px`
            canvas!.style.height = `${height}px`
            ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
        }

        function init() {
            nodes = Array.from({ length: NODE_COUNT }, () => {
                const matched = Math.random() < MATCH_RATIO
                return {
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.12,
                    vy: (Math.random() - 0.5) * 0.12,
                    r: matched ? 3.2 : 1.8,
                    matched,
                }
            })
        }

        function draw() {
            ctx!.clearRect(0, 0, width, height)
            ctx!.lineWidth = 1

            for (let a = 0; a < nodes.length; a++) {
                for (let b = a + 1; b < nodes.length; b++) {
                    const dx = nodes[a].x - nodes[b].x
                    const dy = nodes[a].y - nodes[b].y
                    const distSq = dx * dx + dy * dy
                    if (distSq >= LINK_DISTANCE_SQ) continue

                    const d = Math.sqrt(distSq)
                    const matched = nodes[a].matched || nodes[b].matched
                    ctx!.globalAlpha = (1 - d / LINK_DISTANCE) * (matched ? 0.5 : 0.35)
                    ctx!.strokeStyle = matched ? matchedColor : dimColor
                    ctx!.beginPath()
                    ctx!.moveTo(nodes[a].x, nodes[a].y)
                    ctx!.lineTo(nodes[b].x, nodes[b].y)
                    ctx!.stroke()
                }
            }

            for (const n of nodes) {
                ctx!.globalAlpha = n.matched ? 0.9 : 0.5
                ctx!.fillStyle = n.matched ? matchedColor : dimColor
                ctx!.beginPath()
                ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2)
                ctx!.fill()
            }

            ctx!.globalAlpha = 1
        }

        tickRef.current = () => {
            for (const n of nodes) {
                n.x += n.vx
                n.y += n.vy
                if (n.x < -20) n.x = width + 20
                if (n.x > width + 20) n.x = -20
                if (n.y < -20) n.y = height + 20
                if (n.y > height + 20) n.y = -20
            }
            draw()
        }

        function handleResize() {
            window.clearTimeout(resizeTimer)
            resizeTimer = window.setTimeout(() => {
                resize()
                init()
                draw()
            }, RESIZE_DEBOUNCE_MS)
        }

        resize()
        init()
        draw()
        window.addEventListener('resize', handleResize)

        return () => {
            window.clearTimeout(resizeTimer)
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    useVisibilityGatedAnimationFrame(canvasRef, (time) => tickRef.current(time), {
        enabled: !reduceMotion,
    })

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
        />
    )
}
