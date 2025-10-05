import {useQuery} from "@tanstack/react-query";
import {api} from "@/lib/api-client";

export interface FileMetadata {
    id: string | number;
    filename: string;
    contentType: string;
    size: number;
    dimensions?: {
        width: number;
        height: number;
    };
    createdAt: string;
    updatedAt: string;
}

const getFileMetadata = async (fileId: string | number): Promise<FileMetadata> => {
    const response = await api.get(`/files/${fileId}/metadata`);
    return response.data;
};

export const useGetFileMetadata = (fileId: string | number) => {
    return useQuery<FileMetadata, Error>({
        queryKey: ["file-metadata", fileId],
        queryFn: () => getFileMetadata(fileId),
        enabled: !!fileId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
};

// Utility functions
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDimensions = (dimensions?: { width: number; height: number }): string => {
    if (!dimensions) return '';
    return `${dimensions.width} × ${dimensions.height}`;
}; 