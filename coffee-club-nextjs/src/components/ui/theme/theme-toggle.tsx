"use client";

import * as React from "react";
// import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import DarkModeIcon from "@/components/ui/icons/assets/dark_mode.svg";
import LightModeIcon from "@/components/ui/icons/assets/light_mode.svg";
import SystemModeIcon from "@/components/ui/icons/assets/system_mode.svg";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="theme-switcher" size="circle-icon" className="data-[state=open]:bg-primary data-[state=open]:text-primary-foreground">
          {/* <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" /> */}
          {/* <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" /> */}
          <LightModeIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <DarkModeIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={10} className="bg-popover p-0 font-neue-montreal font-medium">
        <DropdownMenuItem onClick={() => setTheme("system")} className="group">
          <span className="flex justify-start items-center gap-3 w-full cursor-pointer">
            <SystemModeIcon className="h-[1.2rem] w-[1.2rem] text-[#f7f7f7]/[.5] group-hover:text-popover-foreground rotate-0 scale-100 transition-all" />
            System
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("light")} className="group">
          <span className="flex justify-start items-center gap-3 w-full cursor-pointer">
            <LightModeIcon className="h-[1.2rem] w-[1.2rem] text-[#f7f7f7]/[.5] group-hover:text-popover-foreground rotate-0 scale-100 transition-all" />
            Light
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="group">
          <span className="flex justify-start items-center gap-3 w-full cursor-pointer">
            <DarkModeIcon className="h-[1.2rem] w-[1.2rem] text-[#f7f7f7]/[.5] group-hover:text-popover-foreground rotate-0 scale-100 transition-all" />
            Dark
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
