import { Button } from "@/components/ui/button";
import { IconArrowDown } from "@tabler/icons-react";

interface ScrollToBottomButtonProps {
  onClick: () => void;
  isVisible: boolean;
  className?: string;
}

export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
  onClick,
  isVisible,
  className = "",
}) => {
  return (
    <div
      className={`transition-all duration-200 ease-out ${
        isVisible
          ? "opacity-100 scale-100"
          : "opacity-0 scale-90 pointer-events-none"
      } ${className}`}
    >
      <Button
        onClick={onClick}
        variant="default"
        size="sm"
        aria-label="Scroll to bottom of conversation"
        className="size-9"
      >
        <div className="relative flex items-center">
          <div>
            <IconArrowDown className="size-5" />
          </div>
        </div>
      </Button>
    </div>
  );
};
