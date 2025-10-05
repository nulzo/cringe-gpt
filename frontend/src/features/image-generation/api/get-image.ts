import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

const getImage = async (fileId: string | number): Promise<Blob> => {
    const response = await api.get(`/files/${fileId}`, {
        responseType: 'blob',
    });
    // When using 'blob' responseType with axios, the data is the response itself.
    return response as unknown as Blob;
};

export const useGetImage = (fileId: string | number) => {
    return useQuery<Blob, Error>({
        queryKey: ["images", fileId],
        queryFn: () => getImage(fileId),
        enabled: !!fileId,
        staleTime: Infinity,
        gcTime: Infinity,
    });
};
