import React from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button, ButtonProps } from "@/components/ui/button";

interface BackButtonProps extends ButtonProps {
  fallback: string;
  label?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  fallback,
  label = "Back",
  onClick,
  ...props
}) => {
  const [, setLocation] = useLocation();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (window.history.state && window.history.state.idx > 0) {
      window.history.back();
    } else {
      setLocation(fallback);
    }
  };

  return (
    <Button onClick={handleClick} {...props}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
};
