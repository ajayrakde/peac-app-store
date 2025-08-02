import React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  countryCode?: string;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, countryCode = "+91", ...props }, ref) => {
    return (
      <div className="flex">
        <div className="flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 rounded-l-lg">
          <span className="text-sm text-gray-600">{countryCode}</span>
        </div>
        <Input
          type="tel"
          className={cn(
            "rounded-l-none border-l-0 focus:ring-2 focus:ring-primary focus:border-transparent",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
