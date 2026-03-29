'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

interface NewContentTypeTableDrawerProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (title: string) => Promise<void>
}

export function NewContentTypeTableDrawer({
    isOpen,
    onClose,
    onSubmit
}: NewContentTypeTableDrawerProps) {
    const [title, setTitle] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        setIsSubmitting(true)
        try {
            await onSubmit(title.trim())
            setTitle('')
            onClose()
        } catch (err) {
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#27272a] bg-[#141414] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex h-12 items-center justify-between border-b border-[#27272a] px-4">
                    <span className="text-sm font-semibold text-white">Buat Tabel Grup Konten</span>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-[#27272a] hover:text-white transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1.5">Nama Grup / Kategori</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Misal: Edukasi, Promosi, Hiburan..."
                            className="w-full rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-dz-primary transition-colors"
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-[#27272a] hover:text-white transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !title.trim()}
                            className="flex items-center gap-1.5 rounded-lg bg-dz-primary px-4 py-2 text-xs font-medium text-white hover:bg-[#007042] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                            Buat Tabel
                        </button>
                    </div>
                </form>
            </div>
        </>
    )
}
