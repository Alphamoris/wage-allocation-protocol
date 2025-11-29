import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#E85A4F] to-[#F4A259] text-white shadow-md hover:shadow-[0_12px_35px_rgba(232,90,79,0.4)] hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98] active:shadow-sm",
        destructive:
          "bg-[#E85A4F] text-white hover:bg-[#d64a3f] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border-2 border-[#E8DED4] text-[#1A1A2E] bg-white hover:border-[#E85A4F]/50 hover:bg-[#FAF6F1] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:bg-[#F5EDE6]",
        secondary:
          "bg-[#2B4570] text-white hover:bg-[#223660] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
        ghost: "hover:bg-[#FAF6F1] text-[#4A5568] hover:text-[#E85A4F] active:bg-[#F5EDE6]",
        link: "text-[#6BB3D9] underline-offset-4 hover:underline hover:text-[#E85A4F]",
        gradient: "bg-gradient-to-r from-[#E85A4F] via-[#F4A259] to-[#F2B5D4] text-white shadow-lg hover:shadow-[0_12px_40px_rgba(232,90,79,0.35)] hover:-translate-y-1 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98]",
        warm: "bg-gradient-to-r from-[#F4A259] to-[#E85A4F] text-white shadow-md hover:shadow-[0_12px_35px_rgba(244,162,89,0.4)] hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98]",
        cool: "bg-gradient-to-r from-[#2B4570] to-[#6BB3D9] text-white shadow-md hover:shadow-[0_12px_35px_rgba(107,179,217,0.4)] hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98]",
      },
      size: {
        default: "h-12 px-6 py-3 text-sm",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-xl px-8 text-base",
        xl: "h-16 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
