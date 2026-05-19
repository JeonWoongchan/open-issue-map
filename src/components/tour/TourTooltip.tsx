'use client'

import type { TooltipRenderProps } from 'react-joyride'
import { Button } from '@/components/ui/button'

export function TourTooltip({
    step,
    index,
    size,
    isLastStep,
    primaryProps,
    backProps,
    skipProps,
    tooltipProps,
}: TooltipRenderProps) {
    const progress = ((index + 1) / size) * 100

    return (
        <div
            {...tooltipProps}
            className="w-72 rounded-lg border border-border bg-card shadow-lg outline-none"
        >
            <div className="p-4">
                {step.title ? (
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                ) : null}
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {step.content}
                </p>

                {/* 진행률 바 */}
                <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full rounded-full bg-interactive-action transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="mt-3 flex items-center justify-between">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={skipProps.onClick}
                    >
                        건너뛰기
                    </Button>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">
                            {index + 1}/{size}
                        </span>
                        {index > 0 ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={backProps.onClick}
                            >
                                이전
                            </Button>
                        ) : null}
                        <Button
                            type="button"
                            size="sm"
                            className="h-7 px-3 text-xs"
                            onClick={primaryProps.onClick}
                        >
                            {isLastStep ? '완료' : '다음'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
