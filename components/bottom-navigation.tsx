"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Clipboard, Upload, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration errors by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const tabs = [
    {
      name: "執勤",
      href: "/",
      icon: Clipboard,
      isActive: pathname === "/",
    },
    {
      name: "上傳",
      href: "/upload",
      icon: Upload,
      isActive: pathname === "/upload",
    },
    {
      name: "帳戶",
      href: "/account",
      icon: User,
      isActive: pathname === "/account",
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => router.push(tab.href)}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full",
              tab.isActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <tab.icon className={cn("h-6 w-6", tab.isActive ? "text-primary" : "text-muted-foreground")} />
            <span className="text-xs mt-1">{tab.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

