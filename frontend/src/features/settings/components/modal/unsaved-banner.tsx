import { Button } from '@/components/ui/button';
import { IconDeviceFloppy } from '@tabler/icons-react';

export function UnsavedBanner({
                                  onSave,
                                  onDiscard,
                              }: {
    onSave: () => void;
    onDiscard: () => void;
}) {
    return (
        <div className="sticky bottom-0 left-0 w-full bg-background border-t p-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={onDiscard}>
                Discard
            </Button>
            <Button onClick={onSave}>
                <IconDeviceFloppy size={16} className="mr-1.5" />
                Save Changes
            </Button>
        </div>
    );
}