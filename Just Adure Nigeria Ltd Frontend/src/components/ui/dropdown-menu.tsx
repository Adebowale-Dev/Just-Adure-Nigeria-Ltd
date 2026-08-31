"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils.js";

const DropdownMenuContext = createContext(null);

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const ref = useRef(null);
  const triggerRef = useRef(null);

  function updatePosition() {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const safeHeaderSpace = 112;
    const gap = 8;
    const minWidth = Math.max(rect.width, 224);
    const availableRight = window.innerWidth - 16;
    const preferredLeft = rect.left;
    const left = Math.min(Math.max(16, preferredLeft), Math.max(16, availableRight - minWidth));

    setPosition({
      top: Math.max(rect.bottom + gap, safeHeaderSpace),
      left,
      minWidth,
      triggerWidth: rect.width,
    });
  }

  useEffect(() => {
    if (!open) return;
    updatePosition();

    function handleReposition() {
      updatePosition();
    }

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef, position }}><div ref={ref} className="relative">{children}</div></DropdownMenuContext.Provider>;
}

export function DropdownMenuTrigger({ children, className = "", ...props }) {
  const context = useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenuTrigger must be used inside DropdownMenu.");

  return (
    <button
      ref={context.triggerRef}
      type="button"
      aria-haspopup="menu"
      aria-expanded={context.open}
      className={className}
      onClick={() => context.setOpen((current) => !current)}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({ children, className, align = "end" }) {
  const context = useContext(DropdownMenuContext);
  if (!context || !context.open) return null;

  const fixedStyle = context.position ? {
    top: context.position.top,
    minWidth: context.position.minWidth,
    ...(align === "end" ? { right: Math.max(16, window.innerWidth - context.position.left - context.position.minWidth) } : { left: context.position.left }),
    ...(className?.includes("w-full") ? { width: context.position.triggerWidth } : {}),
  } : undefined;

  return (
    <div
      role="menu"
      style={fixedStyle}
      className={cn(
        "fixed z-[120] max-h-[min(22rem,calc(100vh-8rem))] overflow-y-auto overscroll-contain rounded-2xl border border-black/8 bg-white p-3 opacity-100 shadow-[0_24px_70px_rgba(28,34,31,.18)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ children, className = "", asChild = false, ...props }) {
  const classes = cn("block w-full rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-[#fbfaf6]", className);

  if (asChild) {
    return children;
  }

  return <button type="button" role="menuitem" className={classes} {...props}>{children}</button>;
}

export function DropdownMenuLabel({ children, className = "" }) {
  return <p className={cn("px-3 pb-2 text-xs font-black uppercase tracking-[.14em] text-[var(--muted)]", className)}>{children}</p>;
}

export function DropdownMenuSeparator({ className = "" }) {
  return <div className={cn("my-2 h-px bg-black/8", className)} />;
}
