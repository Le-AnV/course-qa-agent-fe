"use client"

import * as React from "react"
import { cn } from "cn"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const EMPTY_VALUE = "__app_select_empty__"

export type AppSelectOption = {
  value: string
  label: React.ReactNode
  description?: React.ReactNode
  initials?: string
  icon?: React.ReactNode
  disabled?: boolean
}

type AppSelectProps = Omit<
  React.ComponentProps<typeof Select>,
  "value" | "onValueChange" | "children"
> & {
  value: string
  onValueChange: (value: string) => void
  options: AppSelectOption[]
  placeholder?: string
  size?: "xs" | "sm" | "default" | "lg"
  triggerClassName?: string
  contentClassName?: string
  id?: string
  "aria-label"?: string
  renderValue?: (selected: AppSelectOption | undefined) => React.ReactNode
  hideContent?: boolean
}

function OptionMark({ option }: { option: AppSelectOption }) {
  if (option.initials) {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-[8px] border border-[#DED8CC] bg-[#F3EFE7] text-[9.5px] font-semibold tracking-tight text-[#5E5548] transition-colors group-data-[state=checked]:border-[#C9C1B2] group-data-[state=checked]:bg-[#E4DCCF] group-data-[state=checked]:text-[#3F382E]">
        {option.initials}
      </span>
    )
  }
  if (option.icon) {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center text-[#6F6F6F]">
        {option.icon}
      </span>
    )
  }
  return null
}

export function AppSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  size = "default",
  triggerClassName,
  contentClassName,
  id,
  "aria-label": ariaLabel,
  renderValue,
  hideContent = false,
  disabled,
  ...props
}: AppSelectProps) {
  const selected = options.find((option) => option.value === value)
  const hasEmptyOption = options.some((option) => option.value === "")

  const toRadixValue = React.useCallback(
    (next: string) => (hasEmptyOption && next === "" ? EMPTY_VALUE : next),
    [hasEmptyOption]
  )

  const fromRadixValue = React.useCallback(
    (next: string) => (next === EMPTY_VALUE ? "" : next),
    []
  )

  return (
    <Select
      value={toRadixValue(value)}
      onValueChange={(next) => onValueChange(fromRadixValue(next))}
      disabled={disabled}
      {...props}
    >
      <SelectTrigger
        id={id}
        size={size}
        aria-label={ariaLabel}
        className={cn("w-full", triggerClassName)}
      >
        <SelectValue placeholder={placeholder}>
          {renderValue
            ? renderValue(selected)
            : selected
              ? (
                <span className="flex min-w-0 items-center gap-2">
                  <OptionMark option={selected} />
                  <span className="truncate">{selected.label}</span>
                </span>
              )
              : undefined}
        </SelectValue>
      </SelectTrigger>
      {!hideContent && (
        <SelectContent className={contentClassName}>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={toRadixValue(option.value)}
              disabled={option.disabled}
              className={cn(option.value === "" && "text-[#5A5A5A]")}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <OptionMark option={option} />
                <span className="min-w-0">
                  <span className="block truncate">{option.label}</span>
                  {option.description ? (
                    <span className="mt-0.5 block truncate text-[11px] font-normal text-[#6F6F6F]">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      )}
    </Select>
  )
}
