export enum Role {
    SYSTEM = 'system',
    USER = 'user',
    MODEL = 'model'
}

export interface GroundingWeb {
    uri: string;
    title: string;
}

export interface GroundingChunk {
    web?: GroundingWeb;
}

export interface GroundingMetadata {
    groundingChunks?: GroundingChunk[];
    groundingSupports?: any[];
    webSearchQueries?: string[];
}

export interface Message {
    id: number;
    role: Role;
    content: string;
    text?: string;
    timestamp: number;
    created_at?: string;
    groundingMetadata?: GroundingMetadata;
    isError?: boolean;
}

export interface UploadedFile {
    id: string;
    name: string;
    content: string;
    type: string;
    size: number;
}

export type ModelType = 'gemini-3-pro-preview' | 'gemini-2.5-flash';

export interface AvailableDocument {
    id: string;
    name: string;
}
