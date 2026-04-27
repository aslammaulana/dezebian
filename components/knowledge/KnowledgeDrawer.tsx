import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

interface KnowledgeData {
    id?: string;
    title: string;
    context: string;
}

interface KnowledgeDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: KnowledgeData) => Promise<void>;
    initialData?: KnowledgeData | null;
    isSubmitting: boolean;
}

export function KnowledgeDrawer({ isOpen, onClose, onSubmit, initialData, isSubmitting }: KnowledgeDrawerProps) {
    const [title, setTitle] = useState('');
    const [context, setContext] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title);
                setContext(initialData.context);
            } else {
                setTitle('');
                setContext('');
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !context.trim()) return;
        await onSubmit({ id: initialData?.id, title: title.trim(), context: context.trim() });
    };

    return (
        <>
            <div
                className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />
            <div className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[500px] md:w-[600px] bg-[#1A1A1A] border-l border-[#27272a] transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex items-center justify-between border-b border-[#27272a] px-6 py-4 shrink-0">
                    <h2 className="text-lg font-semibold text-white">
                        {initialData ? 'Edit Dokumen' : 'Tambah Dokumen'}
                    </h2>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-[#27272a] transition-colors cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                        <div className="space-y-2">
                            <label htmlFor="knowledge-title" className="text-sm font-bold text-gray-300">
                                Judul Dokumen <span className="text-red-400">*</span>
                            </label>
                            <input
                                id="knowledge-title"
                                required
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Masukkan judul..."
                                className="w-full bg-[#121212] border border-[#27272a] rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-dz-primary transition-all placeholder:text-zinc-600 text-white text-sm"
                            />
                        </div>

                        <div className="space-y-2 flex flex-col" style={{ minHeight: 300 }}>
                            <label className="text-sm font-bold text-gray-300">
                                Konteks / Referensi <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                required
                                value={context}
                                onChange={e => setContext(e.target.value)}
                                placeholder="Masukkan teks referensi untuk Natasha..."
                                className="flex-1 w-full bg-[#121212] border border-[#27272a] rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-dz-primary transition-all placeholder:text-zinc-600 font-mono text-sm resize-none text-white scrollbar-thin min-h-[250px]"
                            />
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-[#27272a] bg-[#111] shrink-0 flex items-center justify-end gap-3">
                        <button type="button" onClick={onClose} disabled={isSubmitting}
                            className="px-5 py-2.5 text-sm font-medium text-zinc-300 border border-[#27272a] hover:bg-[#27272a] rounded-lg transition-colors cursor-pointer disabled:opacity-50">
                            Batal
                        </button>
                        <button type="submit" disabled={isSubmitting || !title.trim() || !context.trim()}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-dz-primary hover:bg-[#007042] rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {initialData ? 'Perbarui' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
