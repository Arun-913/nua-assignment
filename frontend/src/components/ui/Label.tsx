import * as React from "react"
import * as LabelPrimitive from '@radix-ui/react-label';

import { cn } from '@/lib/utils'

function Label({ className, htmlFor, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root 
        htmlFor={htmlFor}
        className={cn(
          "text-sm font-medium text-white",
          className
        )}
        {...props}
    />
  )
}

export { Label }