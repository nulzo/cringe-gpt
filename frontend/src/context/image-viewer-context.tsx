"use client"

import React, {createContext, type ReactNode, useContext, useState} from 'react'

export interface ImageData {
    id: string | number
    fileId?: string | number
    sourceUrl?: string
    filename?: string
    fileType?: string
    fileSize?: string
    dimensions?: string
    description?: string
    altText: string
    conversationId?: string
    messageId?: string | number
}

interface ImageViewerContextType {
    isOpen: boolean
    images: ImageData[]
    currentIndex: number
    openViewer: (images: ImageData[], index?: number) => void
    closeViewer: () => void
    addImage: (image: ImageData) => void
    removeImage: (imageId: string | number) => void
    setCurrentIndex: (index: number) => void
}

const ImageViewerContext = createContext<ImageViewerContextType | undefined>(undefined)

export function ImageViewerProvider({children}: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [images, setImages] = useState<ImageData[]>([])
    const [currentIndex, setCurrentIndexState] = useState(0)

    const openViewer = (newImages: ImageData[], index = 0) => {
        setImages(newImages)
        setCurrentIndexState(index)
        setIsOpen(true)
    }

    const closeViewer = () => {
        setIsOpen(false)
        // Clear images after animation completes
        setTimeout(() => {
            setImages([])
            setCurrentIndexState(0)
        }, 300)
    }

    const addImage = (image: ImageData) => {
        setImages(prev => [...prev, image])
    }

    const removeImage = (imageId: string | number) => {
        setImages(prev => {
            const filtered = prev.filter(img => img.id !== imageId)
            // Adjust current index if needed
            if (currentIndex >= filtered.length && filtered.length > 0) {
                setCurrentIndexState(filtered.length - 1)
            } else if (filtered.length === 0) {
                closeViewer()
            }
            return filtered
        })
    }

    const setCurrentIndex = (index: number) => {
        if (index >= 0 && index < images.length) {
            setCurrentIndexState(index)
        }
    }

    return (
        <ImageViewerContext.Provider
            value={{
                isOpen,
                images,
                currentIndex,
                openViewer,
                closeViewer,
                addImage,
                removeImage,
                setCurrentIndex,
            }}
        >
            {children}
        </ImageViewerContext.Provider>
    )
}

export function useImageViewer() {
    const context = useContext(ImageViewerContext)
    if (context === undefined) {
        throw new Error('useImageViewer must be used within an ImageViewerProvider')
    }
    return context
}

// Utility function to create ImageData from file ID
export function createImageData(
    fileId?: string | number,
    options: Partial<ImageData> = {}
): ImageData {
    const fallbackId = options.sourceUrl || fileId || `image-${Date.now()}`

    return {
        id: options.id || fallbackId,
        fileId,
        sourceUrl: options.sourceUrl,
        filename: options.filename,
        fileType: options.fileType,
        fileSize: options.fileSize,
        dimensions: options.dimensions,
        description: options.description,
        altText: options.altText || 'Image',
        conversationId: options.conversationId,
        messageId: options.messageId,
        ...options,
    }
} 