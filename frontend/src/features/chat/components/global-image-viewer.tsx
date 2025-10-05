"use client"

import {ImageViewer} from "./image-viewer"
import {useImageViewer} from "@/context/image-viewer-context"

export function GlobalImageViewer() {
    const {isOpen, images, currentIndex, closeViewer} = useImageViewer()

    return (
        <ImageViewer
            images={images}
            initialIndex={currentIndex}
            onClose={closeViewer}
            isOpen={isOpen}
        />
    )
} 