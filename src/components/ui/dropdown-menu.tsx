"use client";

import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";
import {
  MenuItem as MenuItemPrimitive,
  Menu as MenuPrimitive,
  MenuTrigger as MenuTriggerPrimitive,
  Popover as PopoverPrimitive,
  Separator as SeparatorPrimitive,
  composeRenderProps,
} from "react-aria-components";
import type {
  MenuItemProps,
  MenuProps,
  MenuTriggerProps,
  PopoverProps,
  SeparatorProps,
} from "react-aria-components";

// Opens from its first child (a React Aria pressable, e.g. Button) on press.
function DropdownMenuTrigger(props: MenuTriggerProps) {
  return <MenuTriggerPrimitive data-slot="dropdown-menu" {...props} />;
}

function DropdownMenu<T extends object>({
  className,
  placement = "bottom end",
  ...props
}: Omit<MenuProps<T>, "className"> & {
  className?: string;
  placement?: PopoverProps["placement"];
}) {
  return (
    <PopoverPrimitive
      data-slot="dropdown-menu-content"
      offset={6}
      placement={placement}
      className={cn(
        "z-50 min-w-44 origin-(--trigger-anchor-point) overflow-hidden rounded-xl bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-border outline-hidden data-entering:animate-in data-entering:duration-150 data-entering:ease-out data-entering:fade-in-0 data-entering:zoom-in-95 data-exiting:animate-out data-exiting:duration-100 data-exiting:fade-out-0 data-exiting:zoom-out-95 motion-reduce:animate-none",
        className
      )}
    >
      <MenuPrimitive
        className="max-h-[inherit] overflow-y-auto outline-hidden"
        {...props}
      />
    </PopoverPrimitive>
  );
}

const dropdownMenuItemVariants = cva(
  "flex cursor-default items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-hidden select-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    defaultVariants: { variant: "default" },
    variants: {
      variant: {
        default: "data-focused:bg-muted dark:data-focused:bg-input/30",
        destructive:
          "text-destructive data-focused:bg-destructive/10 dark:data-focused:bg-destructive/20",
      },
    },
  }
);

function DropdownMenuItem({
  className,
  variant,
  ...props
}: MenuItemProps & VariantProps<typeof dropdownMenuItemVariants>) {
  return (
    <MenuItemPrimitive
      data-slot="dropdown-menu-item"
      className={composeRenderProps(className, (renderClassName) =>
        cn(dropdownMenuItemVariants({ variant }), renderClassName)
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className, ...props }: SeparatorProps) {
  return (
    <SeparatorPrimitive
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
};
