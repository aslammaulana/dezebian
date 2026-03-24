// utils/markdown.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Globe } from 'lucide-react';
import { GroundingChunk } from '@/types/chat';

export const Citations: React.FC<{ chunks?: GroundingChunk[] }> = ({ chunks }) => {
    const validChunks = chunks ? chunks.filter(c => c.web) : [];
    if (validChunks.length === 0) return null;

    return (
        <div className="mt-3 pt-3 border-t border-gray-700/50 flex flex-wrap gap-2">
            <div className="w-full text-xs text-gray-400 mb-1 flex items-center gap-1">
                <Globe size={12} className="text-blue-400" /> Sumber
            </div>
            {validChunks.map((chunk, idx) => (
                <a
                    key={idx}
                    href={chunk.web!.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-blue-400 border border-gray-700 px-2 py-1 rounded-full transition-colors truncate max-w-[200px]"
                    title={chunk.web!.title}
                >
                    {chunk.web!.title}
                </a>
            ))}
        </div>
    );
};

export const CustomRenderers = {
    h1: ({ children }: any) => <h1 className="text-xl font-bold mt-4 mb-2 text-gray-100">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-lg font-bold mt-3 mb-1 text-gray-200">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-base font-bold mt-3 mb-1 text-[#ffffffc5]">{children}</h3>,
    strong: ({ children }: any) => <strong className="font-bold text-[#ffffffc5]">{children}</strong>,
    ul: ({ children }: any) => <ul className="list-disc ml-5 my-2 space-y-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal ml-5 my-2 space-y-1">{children}</ol>,
    li: ({ children }: any) => <li className="pl-1">{children}</li>,
    code: ({ node, inline, className, children, ...props }: any) => {
        if (inline) {
            return (
                <code className="bg-gray-700/50 px-1 py-0.5 rounded text-xs font-mono text-emerald-300" {...props}>
                    {children}
                </code>
            )
        }
        return (
            <div className="bg-gray-700/50 p-3 rounded-md overflow-x-auto my-3 text-sm font-mono border border-gray-600">
                <code className={className} {...props}>{children}</code>
            </div>
        )
    },
    p: ({ children, node }: any) => {
        if (node.children.length === 1 && node.children[0].type === 'element') {
            const tagName = node.children[0].tagName;
            if (tagName === 'pre' || tagName === 'table' || tagName === 'blockquote' || tagName === 'hr') {
                return <>{children}</>;
            }
        }
        return <div className="mb-2 last:mb-0">{children}</div>;
    },
    blockquote: ({ children }: any) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-400 my-4">{children}</blockquote>,
    hr: () => <hr className="border-t border-[#ffffff6c] my-[20px]" />,
    a: ({ children, href }: any) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline transition-colors">{children}</a>
};

function stripTimestamps(text: string): string {
    return text.replace(/^\s*\[\d{1,2}[:.']\d{2}\]\s*/gm, '').trimStart();
}

export const renderContent = (text: string) => {
    const cleaned = stripTimestamps(text);
    return (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={CustomRenderers as any}>
            {cleaned}
        </ReactMarkdown>
    );
};
