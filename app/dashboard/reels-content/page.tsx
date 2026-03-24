'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { ContentHeader } from '@/components/content-editor/ContentHeader'
import { ContentSidebar } from '@/components/content-editor/ContentSidebar'
import { ContentTable } from '@/components/content-editor/ContentTable'
import { NewTableDrawer } from '@/components/content-editor/NewTableDrawer'
import { NewContentSidebar } from '@/components/content-editor/NewContentSidebar'
import { ContentDetailSidebar } from '@/components/content-editor/ContentDetailSidebar'
import { ContentTable as ContentTableType, ReelsContent, ContentStatus, Priority } from '@/lib/types'

export default function ReelsContentPage() {
    const router = useRouter()
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [tables, setTables] = useState<ContentTableType[]>([])
    const [activeTableId, setActiveTableId] = useState<string>('')
    const [contents, setContents] = useState<ReelsContent[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [isTableDrawerOpen, setIsTableDrawerOpen] = useState(false)
    const [isContentSidebarOpen, setIsContentSidebarOpen] = useState(false)
    const [detailContent, setDetailContent] = useState<ReelsContent | null>(null)

    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setIsSidebarOpen(false)
        }
    }, [])

    const fetchData = useCallback(async () => {
        try {
            const [tablesRes, contentsRes] = await Promise.all([
                fetch('/api/content-tables'),
                fetch('/api/reels-content'),
            ])
            if (!tablesRes.ok || !contentsRes.ok) throw new Error('Failed to fetch data')
            const tablesData: ContentTableType[] = await tablesRes.json()
            const contentsData: ReelsContent[] = await contentsRes.json()
            setTables(tablesData)
            setContents(contentsData)
            if (!activeTableId && tablesData.length > 0) {
                setActiveTableId(tablesData[0].id)
            }
        } catch (err) {
            console.error('Error loading data:', err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const activeTable = tables.find(t => t.id === activeTableId) || tables[0]
    const sprintTables = tables.filter(t => t.type === 'sprint')
    const nextSprintNumber = sprintTables.length > 0
        ? Math.max(...sprintTables.map(t => t.sprint_number || 0)) + 1
        : 1

    const getSprintLabel = (sprintId: string | null | undefined) => {
        if (!sprintId) return '—'
        const t = tables.find(t => t.id === sprintId)
        return t ? (t.title || `Sprint ${t.sprint_number}`) : '—'
    }

    const handleCreateTable = async (label: string) => {
        try {
            const res = await fetch('/api/content-tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: label, type: 'sprint' }),
            })
            if (!res.ok) throw new Error('Failed to create table')
            const newTable = await res.json()
            setTables(prev => [...prev, newTable])
            setActiveTableId(newTable.id)
        } catch (err) { console.error(err) }
    }

    const handleCreateContent = async (data: { topic: string; status: ContentStatus; priority: Priority; table_id: string; sprint_id?: string | null; format?: string; content_type?: string; funnel?: string; section?: string }) => {
        try {
            const res = await fetch('/api/reels-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to create content')
            const newContent = await res.json()
            setContents(prev => [...prev, newContent])
        } catch (err) { console.error(err) }
    }

    const handleContentUpdate = async (id: string, field: string, value: string | null) => {
        // Optimistic update: update local state immediately for instant UI feedback
        setContents(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
        try {
            const res = await fetch('/api/reels-content', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, [field]: value }),
            })
            if (!res.ok) {
                // Revert on failure
                fetchData()
                throw new Error('Failed to update')
            }
        } catch (err) { console.error(err) }
    }

    const handleContentDelete = async (ids: string[]) => {
        try {
            await fetch('/api/reels-content', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
            })
        } catch (err) { console.error(err) }
    }

    const handleUpdateTable = async (id: string, title: string) => {
        try {
            const res = await fetch('/api/content-tables', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, title }),
            })
            if (!res.ok) throw new Error('Failed to update table')
            const updated = await res.json()
            setTables(prev => prev.map(t => t.id === id ? updated : t))
        } catch (err) { console.error(err) }
    }

    const handleDeleteTable = async (id: string) => {
        try {
            const res = await fetch('/api/content-tables', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            })
            if (!res.ok) throw new Error('Failed to delete table')
            setTables(prev => prev.filter(t => t.id !== id))
            if (activeTableId === id) setActiveTableId(tables[0]?.id || '')
        } catch (err) { console.error(err) }
    }

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-dz-background">
                <Loader2 size={32} className="animate-spin text-zinc-500" />
            </div>
        )
    }

    return (
        <div className="flex h-full w-full flex-col bg-dz-background overflow-hidden">
            <ContentHeader title="Reels Content" />

            <div className="flex flex-1 overflow-hidden">
                <ContentSidebar
                    isOpen={isSidebarOpen}
                    tables={tables}
                    activeTableId={activeTableId}
                    onSelectTable={setActiveTableId}
                    onNewTable={() => setIsTableDrawerOpen(true)}
                    onUpdateTable={handleUpdateTable}
                    onDeleteTable={handleDeleteTable}
                />

                <main className="flex-1 h-full overflow-hidden bg-dz-background">
                    {activeTable ? (
                        <ContentTable
                            isSidebarOpen={isSidebarOpen}
                            onOpenSidebar={() => setIsSidebarOpen(true)}
                            onCloseSidebar={() => setIsSidebarOpen(false)}
                            activeTable={activeTable}
                            allTables={tables}
                            contents={contents}
                            onContentsChange={setContents}
                            onContentUpdate={handleContentUpdate}
                            onContentDelete={handleContentDelete}
                            onInsertRow={() => setIsContentSidebarOpen(true)}
                            onRefresh={fetchData}
                            onViewDetail={setDetailContent}
                            onEditContent={(id) => router.push(`/dashboard/reels-content/${id}`)}
                        />
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-zinc-500">
                            <div className="flex flex-col items-center text-center">
                                <h3 className="text-lg font-medium text-white mb-1">Belum Ada Table</h3>
                                <p className="text-sm">Buat tabel pertama untuk mulai menambahkan konten.</p>
                            </div>
                            <button
                                onClick={() => setIsTableDrawerOpen(true)}
                                className="rounded-lg bg-dz-primary px-5 py-2 text-sm font-medium text-white hover:bg-[#007042] transition-colors cursor-pointer"
                            >
                                + New Table
                            </button>
                        </div>
                    )}
                </main>
            </div>

            {/* Drawers */}
            <NewTableDrawer
                isOpen={isTableDrawerOpen}
                onClose={() => setIsTableDrawerOpen(false)}
                onSubmit={handleCreateTable}
                nextSprintNumber={nextSprintNumber}
            />
            <NewContentSidebar
                isOpen={isContentSidebarOpen}
                onClose={() => setIsContentSidebarOpen(false)}
                onSubmit={handleCreateContent}
                activeTable={activeTable}
                sprintTables={sprintTables}
            />

            {/* Detail / Edit sidebar */}
            <ContentDetailSidebar
                content={detailContent}
                onClose={() => setDetailContent(null)}
                sprintTables={sprintTables}
                onRefresh={fetchData}
            />
            {detailContent && (
                <div className="fixed inset-0 z-40 hidden md:block" onClick={() => setDetailContent(null)} />
            )}
        </div>
    )
}
