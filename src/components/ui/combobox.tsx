import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

const Combobox = React.forwardRef<
  HTMLInputElement,
  {
    value?: string
    onValueChange?: (value: string) => void
    placeholder?: string
    options?: string[]
    categoryIds?: string[]
    className?: string
  }
>(({ value, onValueChange, placeholder, options = [], categoryIds = [], className, ...props }, ref) => {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value || "")

  React.useEffect(() => {
    setInputValue(value || "")
  }, [value])

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <input
            ref={ref}
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              onValueChange?.(e.target.value)
            }}
            className="flex-1 bg-transparent border-none outline-none placeholder:text-muted-foreground"
            {...props}
          />
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="max-h-48 overflow-y-auto">
          {filteredOptions.length === 0 && inputValue.trim() ? (
            <div
              className="flex items-center px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                onValueChange?.(inputValue.trim())
                setOpen(false)
              }}
            >
              <Check className="mr-2 h-4 w-4 opacity-100" />
              Add "{inputValue.trim()}"
            </div>
          ) : (
            <>
              {inputValue.trim() && !options.some(option =>
                option.toLowerCase() === inputValue.toLowerCase().trim()
              ) && (
                <div
                  className="flex items-center px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground border-b"
                  onClick={() => {
                    onValueChange?.(inputValue.trim())
                    setOpen(false)
                  }}
                >
                  <Check className="mr-2 h-4 w-4 opacity-100" />
                  Add "{inputValue.trim()}"
                </div>
              )}
              {filteredOptions.map((option, index) => (
                <div
                  key={option}
                  className={cn(
                    "flex items-center px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    inputValue === option && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => {
                    setInputValue(option)
                    onValueChange?.(categoryIds[index] || option)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      inputValue === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </div>
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
})
Combobox.displayName = "Combobox"

export { Combobox }
