import * as React from "react"
import { cn } from "../../lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    gradient?: boolean
    hover?: boolean
    glass?: boolean
  }
>(({ className, gradient, hover, glass, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border shadow-sm transition-all duration-300",
      gradient && "gradient-border",
      hover && "hover-scale",
      glass && "glass-card",
      className
    )}
    {...props}
  />
))

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLProps<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("section-title text-lg font-semibold", className)}
    {...props}
  />
))

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))

export { Card, CardHeader, CardTitle, CardContent }
