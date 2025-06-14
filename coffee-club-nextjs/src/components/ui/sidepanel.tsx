/* ---------------------------- Place your React imports here --------------------------- */
import {
  ComponentProps,
  ElementRef,
  createContext,
  forwardRef,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";

/* ---------------------------- Place your Component imports here ------------------------ */
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import InfoIcon from "@/components/ui/icons/assets/info_circle.svg";

/* ---------------------------- Place your util imports here ---------------------------- */
import { cn } from "@/lib/utils";

/* ---------------------------- Constants ----------------------------------------------- */
const SIDEPANEL_COOKIE_NAME = "sidepanel_state";
const SIDEPANEL_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEPANEL_WIDTH = "24rem";
const SIDEPANEL_WIDTH_MOBILE = "18rem";
const SIDEPANEL_WIDTH_ICON = "3rem";

/* ---------------------------- Types/Interfaces ---------------------------------------- */
export type SidepanelContextProps = {
  state: "expanded" | "collapsed";
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  togglePanel: () => void;
};

/* ---------------------------- Implementation ------------------------------------------ */
// Context/Hooks
const SidepanelContext = createContext<SidepanelContextProps | null>(null);

const SidepanelProvider = forwardRef<
  HTMLDivElement,
  ComponentProps<"div"> & {
    defaultIsOpen?: boolean;
    isOpen?: boolean;
    onIsOpenChange?: (open: boolean) => void;
  }
>(
  (
    {
      defaultIsOpen = false,
      isOpen: isOpenProp,
      onIsOpenChange: setIsOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    // This is the internal state of the sidepanel.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = useState(defaultIsOpen);
    const isOpen = isOpenProp ?? _open;
    const setIsOpen = useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(isOpen) : value;
        if (setIsOpenProp) {
          setIsOpenProp(openState);
        } else {
          _setOpen(openState);
        }

        // This sets the cookie to keep the sidepanel state.
        document.cookie = `${SIDEPANEL_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEPANEL_COOKIE_MAX_AGE}`;
      },
      [setIsOpenProp, isOpen],
    );

    // Helper to toggle the sidepanel.
    const togglePanel = useCallback(() => {
      return setIsOpen((isOpen) => !isOpen);
    }, [setIsOpen]);

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidepanel with Tailwind classes.
    const state = isOpen ? "expanded" : "collapsed";

    const contextValue = useMemo<SidepanelContextProps>(
      () => ({
        state,
        isOpen,
        setIsOpen,
        togglePanel,
      }),
      [state, isOpen, setIsOpen, togglePanel],
    );

    return (
      <SidepanelContext.Provider value={contextValue}>
        <div
          style={
            {
              "--sidepanel-width": SIDEPANEL_WIDTH,
              "--sidepanel-width-icon": SIDEPANEL_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidepanel-wrapper flex h-full w-full has-[[data-variant=inset]]:bg-card",
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </SidepanelContext.Provider>
    );
  },
);
SidepanelProvider.displayName = "SidePanelProvider";

const useSidepanel = () => {
  const context = useContext(SidepanelContext);
  if (!context) {
    throw new Error("useSidepanel must be used within a SidepanelProvider.");
  }

  return context;
};

// Components
const SidepanelTrigger = forwardRef<
  ElementRef<typeof Button>,
  ComponentProps<typeof Button> & { icon?: ReactNode }
>(({ className, onClick, icon, ...props }, ref) => {
  const { togglePanel } = useSidepanel();

  return (
    <Button
      ref={ref}
      data-sidepanel="trigger"
      variant="ghost"
      size="icon"
      className={cn("w-9 h-9 hover:text-primary [&_svg]:size-6", className)}
      onClick={(event) => {
        onClick?.(event);
        togglePanel();
      }}
      {...props}
    >
      {icon ?? <InfoIcon />}
      <span className="sr-only">Toggle SidePanel</span>
    </Button>
  );
});
SidepanelTrigger.displayName = "SidepanelTrigger";

const Sidepanel = forwardRef<
  HTMLDivElement,
  ComponentProps<"div"> & {
    side?: "left" | "right";
    variant?: "sidepanel" | "floating" | "inset";
    collapsible?: "offcanvas" | "icon" | "none";
  }
>(
  (
    {
      side = "right",
      variant = "sidepanel",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const { state } = useSidepanel();

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-[--sidepanel-width] flex-col bg-card text-card-foreground",
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className="group peer hidden text-card-foreground md:block"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
      >
        {/* This is what handles the sidepanel gap on desktop */}
        <div
          className={cn(
            "relative w-[--sidepanel-width] bg-transparent transition-[width] duration-200 ease-linear",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidepanel-width-icon)_+_theme(spacing.4))]"
              : "group-data-[collapsible=icon]:w-[--sidepanel-width-icon]",
          )}
        />
        <div
          className={cn(
            "fixed inset-y-0 z-10 hidden h-full w-[--sidepanel-width] py-4 transition-[left,right,width] duration-200 ease-linear md:flex",
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidepanel-width)*-1)]"
              : "right-0 pr-4 group-data-[collapsible=offcanvas]:right-[calc(var(--sidepanel-width)*-1)]",
            // Adjust the padding for floating and inset variants.
            variant === "floating"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidepanel-width-icon)_+_theme(spacing.4)_+2px)]"
              : "group-data-[collapsible=icon]:w-[--sidepanel-width-icon]",
            className,
          )}
          {...props}
        >
          <div
            data-sidepanel="sidepanel"
            className="flex h-full w-full flex-col bg-card rounded-lg px-5 py-3 group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidepanel-border group-data-[variant=floating]:shadow"
          >
            {children}
          </div>
        </div>
      </div>
    );
  },
);
Sidepanel.displayName = "SidePanel";

const SidepanelInset = forwardRef<HTMLDivElement, ComponentProps<"main">>(
  ({ className, ...props }, ref) => {
    return (
      <main
        ref={ref}
        className={cn(
          "relative flex w-full flex-1 flex-col bg-background",
          "md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
          className,
        )}
        {...props}
      />
    );
  },
);
SidepanelInset.displayName = "SidepanelInset";

const SidepanelHeader = forwardRef<HTMLDivElement, ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidepanel="header"
        className={cn("flex flex-col gap-2 p-2", className)}
        {...props}
      />
    );
  },
);
SidepanelHeader.displayName = "SidepanelHeader";

const SidepanelSeparator = forwardRef<
  ElementRef<typeof Separator>,
  ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidepanel="separator"
      className={cn("mx-2 w-auto bg-sidepanel-border", className)}
      {...props}
    />
  );
});
SidepanelSeparator.displayName = "SidepanelSeparator";

const SidepanelContent = forwardRef<HTMLDivElement, ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidepanel="content"
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
          className,
        )}
        {...props}
      />
    );
  },
);
SidepanelContent.displayName = "SidepanelContent";

const SidepanelFooter = forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidepanel="footer"
        className={cn("flex flex-col gap-2 p-2", className)}
        {...props}
      />
    );
  },
);
SidepanelFooter.displayName = "SidepanelFooter";

export {
  Sidepanel,
  SidepanelContent,
  SidepanelFooter,
  SidepanelHeader,
  SidepanelInset,
  SidepanelProvider,
  SidepanelSeparator,
  SidepanelTrigger,
  useSidepanel,
};
