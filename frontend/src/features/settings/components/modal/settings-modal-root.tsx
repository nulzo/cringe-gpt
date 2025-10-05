import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sidebar } from './settings-modal-sidebar.tsx';
import { SectionRenderer } from './settings-modal-section-renderer.tsx';

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
}

export const SettingsRoot = ({ open, onOpenChange }: Props) => {

    const blockClose = (dirty: boolean, next: boolean) => {
        if (!dirty) return onOpenChange(next);
        if (confirm('You have unsaved changes. Discard them?')) onOpenChange(next);
    };

    return (
        <Dialog open={open} onOpenChange={(next) => blockClose(false, next)}>
            <DialogContent
                className="flex p-0 max-w-4xl h-[70vh] overflow-hidden"
                onKeyDown={(e) => {
                    if (e.key === 'Escape') e.stopPropagation(); // disable Esc
                }}
            >
                <Sidebar />
                <div className="flex-1 p-6 overflow-y-auto">
                    <SectionRenderer />
                </div>
            </DialogContent>
        </Dialog>
    );
};