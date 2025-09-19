
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sun, Moon, Laptop } from "lucide-react"

export function ThemeSwitcher() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-4">
      <Label>Theme</Label>
      <RadioGroup
        value={theme}
        onValueChange={setTheme}
        className="grid max-w-md grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <Label className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
          <RadioGroupItem value="light" className="sr-only" />
          <Sun className="h-6 w-6" />
          <span className="mt-2 text-sm font-medium">Light</span>
        </Label>
        <Label className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
          <RadioGroupItem value="dark" className="sr-only" />
          <Moon className="h-6 w-6" />
          <span className="mt-2 text-sm font-medium">Dark</span>
        </Label>
        <Label className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
          <RadioGroupItem value="system" className="sr-only" />
          <Laptop className="h-6 w-6" />
          <span className="mt-2 text-sm font-medium">System</span>
        </Label>
      </RadioGroup>
      <p className="text-sm text-muted-foreground">
        Select a theme for the application. "System" will match your operating system's settings.
      </p>
    </div>
  )
}
