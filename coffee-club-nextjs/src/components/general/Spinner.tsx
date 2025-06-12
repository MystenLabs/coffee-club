import { Loader2 } from "lucide-react";
import React from "react";

interface SpinnerProps {
  className?: string
}

export const Spinner = ({
  className = "",
}: SpinnerProps) => {
  return (
    <div className="flex justify-center items-center">
      <Loader2 className={`${className} w-7 h-7 text-white animate-spin`} />
    </div>
  );
};
