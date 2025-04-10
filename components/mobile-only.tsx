"use client"

import { useState, useEffect } from "react"
import { AlertTriangle } from "lucide-react"

export function MobileOnly({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(true)
  const [bypassEnabled, setBypassEnabled] = useState(false)
  
  useEffect(() => {
    // Function to check if the device is mobile
    const checkIfMobile = () => {
      // Check if the screen width is greater than 768px (typical tablet/desktop breakpoint)
      const isMobileDevice = window.innerWidth <= 768
      setIsMobile(isMobileDevice)
    }
    
    // Call once on mount
    checkIfMobile()
    
    // Set up listener for window resize
    window.addEventListener('resize', checkIfMobile)

    // Check if bypass is stored in localStorage
    const bypass = localStorage.getItem('desktop-bypass')
    if (bypass === 'true') {
      setBypassEnabled(true)
    }
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])
  
  // Enable bypass function
  const enableBypass = () => {
    localStorage.setItem('desktop-bypass', 'true')
    setBypassEnabled(true)
  }
  
  if (isMobile || bypassEnabled) {
    // If it's a mobile device or bypass is enabled, render the children normally
    return <>{children}</>
  }
  
  // If it's a desktop, show the blocking screen
  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center p-8 z-[9999]">
      <AlertTriangle className="h-16 w-16 text-yellow-500 mb-6" />
      <h1 className="text-2xl font-bold mb-4 text-center">僅限移動設備訪問</h1>
      <p className="text-center mb-6">
        此應用程序僅適用於移動設備。請使用手機或平板電腦訪問。
      </p>
      <p className="text-center text-sm opacity-70 mb-8">
        This application is only available on mobile devices. Please access using a phone or tablet.
      </p>
      
      {/* Debug button to bypass the restriction */}
      <button 
        onClick={enableBypass}
        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
      >
        Enable Desktop Access (Debug Mode)
      </button>
    </div>
  )
} 