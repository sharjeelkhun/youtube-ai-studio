import * as React from "react"
import { cn } from "../../lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    gradient?: boolean
    hover?: boolean
  }
>(({ className, gradient, hover, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200",
      gradient && "bg-gradient-to-br from-white to-gray-50/50",
      hover && "hover:shadow-md hover:scale-[1.02]",
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

// ...add other card components (Title, Content, Footer)

export { Card, CardHeader }
