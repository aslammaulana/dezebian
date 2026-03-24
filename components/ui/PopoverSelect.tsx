'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import clsx from 'clsx'

export interface PopoverSelectProps {
    label?: string
    value: string
    onChange: (v: string) => void
    options: string[]
    placeholder?: string
    colorMap?: Record<string, string> // e.g., { 'Low': 'text-blue-500' }
    variant?: 'default' | 'inline'
    disabled?: boolean
}

export function PopoverSelect({
    label,
    value,
    onChange,
    options,
    placeholder = '— Pilih —',
    colorMap,
    variant = 'default',
    disabled = false
}: PopoverSelectProps) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const displayValue = value || placeholder
    const activeColor = colorMap && value ? colorMap[value] : '' // expects format "text-color bg-color"
    const triggerTextClass = activeColor ? activeColor.split(' ')[0] : ''
    const triggerBgDotClass = activeColor ? activeColor.split(' ')[1] : 'bg-zinc-600'

    return (
        <div ref={ref} className="relative">
            {label && <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(p => !p)}
                className={clsx(
                    'w-full flex items-center justify-between text-left transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                    // Variant Default (like form input)
                    variant === 'default' && clsx(
                        'rounded-lg border px-3 py-2.5 text-sm',
                        open ? 'border-dz-primary bg-[#1f1f1f]' : 'border-[#3a3a3a] bg-[#1f1f1f] hover:border-zinc-500'
                    ),
                    // Variant Inline (like plain text in table, now bordered as requested)
                    variant === 'inline' && clsx(
                        'min-w-fit rounded-md border text-xs px-2.5 py-1.5',
                        open ? 'border-dz-primary bg-[#27272a]' : 'border-[#3a3a3a] bg-[#1a1a1a] hover:border-zinc-500 hover:bg-[#222]'
                    )
                )}
            >
                <div className="flex items-center gap-2 truncate">
                    {/* Active Dot */}
                    {activeColor ? (
                        <span className={clsx("w-1.5 h-1.5 mt-px shrink-0 rounded-full", triggerBgDotClass)} />
                    ) : value ? (
                        <span className="w-1.5 h-1.5 mt-px shrink-0 rounded-full bg-zinc-600" />
                    ) : null}

                    {/* Active Text */}
                    <span className={clsx("truncate capitalize", activeColor ? triggerTextClass : (!value ? 'text-zinc-500' : 'text-zinc-300'))}>
                        {displayValue}
                    </span>
                </div>

                <ChevronDown size={14} className={clsx('shrink-0 text-zinc-500 transition-transform duration-150 ml-2', open && 'rotate-180')} />
            </button>

            {open && (
                <div className={clsx(
                    "absolute left-0 mt-1 z-50 rounded-lg border border-[#3a3a3a] bg-[#1a1a1a] shadow-2xl overflow-hidden py-1",
                    variant === 'default' ? "w-full" : "min-w-[200px] max-w-[300px]"
                )}>
                    {/* Clear option */}
                    {value && (
                        <div className="px-1 mb-1 border-b border-[#27272a] pb-1">
                            <button
                                type="button"
                                onClick={() => { onChange(''); setOpen(false) }}
                                className="w-full text-left px-2.5 py-1.5 text-xs text-zinc-500 hover:bg-[#27272a] hover:text-white rounded transition-colors cursor-pointer"
                            >
                                Clear Selection
                            </button>
                        </div>
                    )}
                    <div className="max-h-52 overflow-y-auto scrollbar-thin px-1">
                        {options.length === 0 ? (
                            <p className="px-3 py-4 text-xs text-zinc-600 text-center italic">Tidak ada opsi</p>
                        ) : (
                            options.map(opt => {
                                const optColor = colorMap?.[opt] || ''
                                const optTextClass = optColor ? optColor.split(' ')[0] : 'text-zinc-400'
                                const optBgDotClass = optColor ? optColor.split(' ')[1] : 'bg-zinc-600'

                                return (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => { onChange(opt); setOpen(false) }}
                                        className={clsx(
                                            'flex w-full items-center gap-2.5 px-2.5 py-2 text-sm rounded transition-colors cursor-pointer',
                                            value === opt ? 'bg-[#27272a]' : 'hover:bg-[#27272a]'
                                        )}
                                    >
                                        <span className={clsx("w-1.5 h-1.5 mt-px rounded-full shrink-0", optBgDotClass)} />
                                        <span className="flex-1 text-left truncate text-zinc-300 font-medium capitalize">
                                            {opt}
                                        </span>
                                        {value === opt && <Check size={14} strokeWidth={2.5} className={clsx("ml-auto shrink-0", optTextClass)} />}
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
