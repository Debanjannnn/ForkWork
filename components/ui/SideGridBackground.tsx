import { cn } from "@/lib/utils";
import React from "react";
import { Particles } from "../magicui/particles";

export function SideGridBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex w-full items-center justify-center bg-black z-0">
     
      {/* Left side grid */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-[20%]",
          "[background-size:40px_40px]",
          "[background-image:linear-gradient(to_right,#b81f48_1px,transparent_1px),linear-gradient(to_bottom,#b81f48_1px,transparent_1px)]",
        )}
      />
      
      {/* Right side grid */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-[20%]",
          "[background-size:40px_40px]",
          "[background-image:linear-gradient(to_right,#b81f48_1px,transparent_1px),linear-gradient(to_bottom,#b81f48_1px,transparent_1px)]",
        )}
      />
       
      {/* Radial gradient overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black)]"></div>
     
      {/* Content */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
} 