"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      duration={3500}
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 !text-[#4B9E76]" />
        ),
        info: (
          <InfoIcon className="size-4 !text-[#5A5A5A]" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 !text-[#B4881F]" />
        ),
        error: (
          <OctagonXIcon className="size-4 !text-[#C4644C]" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin !text-[#111111]" />
        ),
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#111111",
          "--normal-border": "#DADADA",
          "--border-radius": "0.75rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "!w-[340px] !bg-white !text-[#111111] !border-[#DADADA] !rounded-xl !shadow-[0_1px_2px_rgba(17,17,17,0.04),0_8px_24px_rgba(17,17,17,0.08)] !text-[13px]",
          title: "!text-[13px] !font-semibold !text-[#111111]",
          description: "!text-[12.5px] !text-[#5A5A5A]",
          icon: "!mt-0",
          actionButton: "!bg-[#111111] !text-white !rounded-lg !text-[12px] !font-semibold",
          cancelButton: "!bg-[#F7F7F7] !text-[#111111] !rounded-lg !text-[12px] !font-semibold",
          closeButton: "!bg-white !border-[#DADADA] !text-[#5A5A5A]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
