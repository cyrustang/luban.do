"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import {
  Navigation,
  Clipboard,
  AlertTriangle,
  CheckCircle,
  Sunrise,
  Sunset,
  ChevronDown,
  ChevronUp,
  Hammer,
  Paintbrush,
  Wrench,
  Trash2,
  Ruler,
  Truck,
  HardHat,
  Lightbulb,
  Building,
  Axe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { BottomNavigation } from "@/components/bottom-navigation"

// Add import for the brand context and selector
import { useBrand } from "@/components/brand-context"

// API endpoints
const SITES_API_URL = "https://api.bricks.academy/api:luban/lb_site/r"
const WORK_TYPES_API_URL = "https://api.bricks.academy/api:luban/lb_worktype/r"
const SHIFT_API_URL = "https://api.bricks.academy/api:luban/lb_shift/c"
const SHIFT_SITE_API_URL = "https://api.bricks.academy/api:luban/lb_shift_site/c"

// Work types with icons
interface WorkType {
  id: number
  name: string
  icon: string
}

// Interface for site data
interface Site {
  id: number
  name?: string
  address: string
  lat: number
  lng: number
  _pb_client_id: number
  created_at: number
  _pb_client?: {
    name: string
  }
}

// Auth type
interface Auth {
  isAuthenticated: boolean
  phoneNumber: string
  countryCode: string
  userId?: string
  authToken?: string
  authResponse?: any
  userData?: UserData
  timestamp: number
}

// User data type
interface UserData {
  id: number
  firstname: string
  lastname: string
  nickname?: string
  country: string
  number: string
  otp?: string
  created_at?: number
}

// Site selection with work types
interface SiteSelection {
  siteId: number
  workTypes: number[] // Changed from string[] to number[]
}

// Check-in record type
interface CheckInRecord {
  time: Date
  siteId: number
  siteName: string
  period: "AM" | "PM"
  workTypes: number[] // Changed from string[] to number[]
}

// Shift record type for API
interface ShiftRecord {
  date: string
  shift: "am" | "pm"
  lb_user_id: number
  pb_site_id: number
  work_types: number[]
}

// Add a new interface for the shift details response
interface ShiftSite {
  id: number
  lb_shift_id: number
  lb_site_id: number
  lb_worktype_id: WorkType[] | number[]
  note: string
  created_at: number
  _lb_site?: {
    id: number
    name: string
    area: string
    lat: number
    lng: number
    _lb_client_id: number
    created_at: number
  }
}

// Update the ShiftDetails interface to match the new API response format
interface ShiftDetails {
  id: number
  date: string
  shift: "am" | "pm"
  lb_user_id: number
  created_at: number
  _lb_shift_site_of_lb_shift?: ShiftSite[]
}

export default function Home() {
  // Inside the component, add this near the top
  const { currentBrand } = useBrand()
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [auth, setAuth] = useState<Auth | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Selected sites with work types for each period
  const [selectedAMSites, setSelectedAMSites] = useState<SiteSelection[]>([])
  const [selectedPMSites, setSelectedPMSites] = useState<SiteSelection[]>([])

  // Track expanded sites for work type selection
  const [expandedAMSites, setExpandedAMSites] = useState<number[]>([])
  const [expandedPMSites, setExpandedPMSites] = useState<number[]>([])

  // Active tab
  const [activeTab, setActiveTab] = useState<"AM" | "PM">("AM")

  // Check-in records for today
  const [todayCheckIns, setTodayCheckIns] = useState<CheckInRecord[]>([])

  // Add a state for work types
  const [workTypes, setWorkTypes] = useState<WorkType[]>([])
  const [loadingWorkTypes, setLoadingWorkTypes] = useState(true)

  // Add a state to track if data has been loaded
  const [dataLoaded, setDataLoaded] = useState(false)

  // Format date as yyyy/mm/dd
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}/${month}/${day}`
  }

  // Add a function to get the icon component from the icon name string
  const getIconComponent = (iconName: string): React.ElementType => {
    const icons: Record<string, React.ElementType> = {
      Hammer,
      Wrench,
      Paintbrush,
      Trash2,
      Ruler,
      Truck,
      HardHat,
      Lightbulb,
      Building,
      Axe,
    }

    return icons[iconName] || Wrench // Default to Wrench if icon not found
  }

  // Add a function to fetch work types
  const fetchWorkTypes = useCallback(async () => {
    try {
      const response = await fetch(WORK_TYPES_API_URL)
      if (!response.ok) {
        throw new Error(`Failed to fetch work types: ${response.status}`)
      }
      const data: WorkType[] = await response.json()
      setWorkTypes(data)
      setLoadingWorkTypes(false)
    } catch (err) {
      console.error(`Error fetching work types: ${err instanceof Error ? err.message : String(err)}`)
      setError(`Error fetching work types: ${err instanceof Error ? err.message : String(err)}`)
      setLoadingWorkTypes(false)
    }
  }, [])

  // Modify the fetchShiftDetails function to add a retry mechanism and better error handling
  const fetchShiftDetails = useCallback(async (userId: number | string) => {
    try {
      // Format today's date for API - using yyyy-mm-dd format instead of yyyy/mm/dd
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      const formattedDate = `${year}-${month}-${day}`

      // Try the API with the new date format
      const url = `https://api.bricks.academy/api:luban/lb_shift/r/${userId}/${formattedDate}/${formattedDate}`

      console.log("Fetching shift details from URL:", url)

      // Add timeout to the fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          // Add cache: 'no-store' to prevent caching issues
          cache: "no-store",
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          // If the first attempt fails, try with the original date format
          console.log("First attempt failed, trying alternative date format")
          const altFormattedDate = formatDateForAPI(new Date())
          const altUrl = `https://api.bricks.academy/api:luban/lb_shift/r/${userId}/${altFormattedDate}/${altFormattedDate}`

          console.log("Trying alternative URL:", altUrl)

          const altController = new AbortController()
          const altTimeoutId = setTimeout(() => altController.abort(), 5000)

          try {
            const altResponse = await fetch(altUrl, {
              signal: altController.signal,
              cache: "no-store",
            })
            clearTimeout(altTimeoutId)

            if (!altResponse.ok) {
              console.log(`Failed to fetch shift details: ${altResponse.status}`)
              return []
            }

            const data: ShiftDetails[] = await altResponse.json()
            console.log("Fetched shift details with alternative format:", data)
            return data
          } catch (altErr) {
            console.log("Alternative fetch attempt failed:", altErr)
            return []
          }
        }

        const data: ShiftDetails[] = await response.json()
        console.log("Fetched shift details:", data)
        return data
      } catch (fetchErr) {
        if (fetchErr && typeof fetchErr === 'object' && 'name' in fetchErr && fetchErr.name === "AbortError") {
          console.log("Fetch request timed out")
        } else {
          console.log("Fetch request failed:", fetchErr)
        }
        return []
      }
    } catch (err) {
      console.error(`Error in fetchShiftDetails: ${err instanceof Error ? err.message : String(err)}`)
      // Don't show the error to the user, just return empty array
      return []
    }
  }, [])

  // Update the processShiftDetails function to handle the new API response format
  const processShiftDetails = useCallback((shiftDetails: ShiftDetails[]) => {
    console.log("Processing shift details:", shiftDetails)

    if (!shiftDetails || shiftDetails.length === 0) {
      console.log("No shift details to process")
      return
    }

    // Process AM shifts
    const amShifts = shiftDetails.filter((shift) => shift.shift === "am")
    console.log("AM shifts:", amShifts)

    if (amShifts.length > 0) {
      // Create check-in records for AM shifts
      const amCheckIns: CheckInRecord[] = []

      amShifts.forEach((shift) => {
        if (shift._lb_shift_site_of_lb_shift && shift._lb_shift_site_of_lb_shift.length > 0) {
          shift._lb_shift_site_of_lb_shift.forEach((site) => {
            // Extract work type IDs from the response
            const workTypeIds = Array.isArray(site.lb_worktype_id)
              ? site.lb_worktype_id.map((wt) => (typeof wt === "object" ? wt.id : wt))
              : []

            amCheckIns.push({
              time: new Date(shift.created_at),
              siteId: site.lb_site_id,
              siteName: site._lb_site?.name || "未知地點",
              period: "AM",
              workTypes: workTypeIds,
            })
          })
        }
      })

      if (amCheckIns.length > 0) {
        console.log("Setting AM check-ins:", amCheckIns)
        setTodayCheckIns((prev) => {
          // Filter out any existing AM check-ins
          const filteredCheckIns = prev.filter((record) => record.period !== "AM")
          return [...filteredCheckIns, ...amCheckIns]
        })
      }
    }

    // Process PM shifts
    const pmShifts = shiftDetails.filter((shift) => shift.shift === "pm")
    console.log("PM shifts:", pmShifts)

    if (pmShifts.length > 0) {
      // Create check-in records for PM shifts
      const pmCheckIns: CheckInRecord[] = []

      pmShifts.forEach((shift) => {
        if (shift._lb_shift_site_of_lb_shift && shift._lb_shift_site_of_lb_shift.length > 0) {
          shift._lb_shift_site_of_lb_shift.forEach((site) => {
            // Extract work type IDs from the response
            const workTypeIds = Array.isArray(site.lb_worktype_id)
              ? site.lb_worktype_id.map((wt) => (typeof wt === "object" ? wt.id : wt))
              : []

            pmCheckIns.push({
              time: new Date(shift.created_at),
              siteId: site.lb_site_id,
              siteName: site._lb_site?.name || "未知地點",
              period: "PM",
              workTypes: workTypeIds,
            })
          })
        }
      })

      if (pmCheckIns.length > 0) {
        console.log("Setting PM check-ins:", pmCheckIns)
        setTodayCheckIns((prev) => {
          // Filter out any existing PM check-ins
          const filteredCheckIns = prev.filter((record) => record.period !== "PM")
          return [...filteredCheckIns, ...pmCheckIns]
        })
      }
    }
  }, [])

  // Check authentication on component mount with a delay
  useEffect(() => {
    // Check if we just logged in (from verify page)
    const justLoggedIn = sessionStorage.getItem("justLoggedIn") === "true"

    // If we just logged in, clear the flag and proceed
    if (justLoggedIn) {
      sessionStorage.removeItem("justLoggedIn")
      console.log("Just logged in, skipping auth check")

      // Get auth data from localStorage
      const authData = localStorage.getItem("auth")
      if (authData) {
        try {
          const parsedAuth = JSON.parse(authData) as Auth
          setAuth(parsedAuth)
          setIsLoading(false)
        } catch (err) {
          console.error("Error parsing auth data:", err)
          router.replace("/login")
        }
      }
      return
    }

    // Add a delay before checking authentication
    const authCheckTimer = setTimeout(() => {
      console.log("Checking authentication after delay")

      // Get auth data from localStorage
      const authData = localStorage.getItem("auth")
      console.log("Auth data from localStorage:", authData)

      if (!authData) {
        console.log("No auth data found, redirecting to login")
        router.replace("/login")
        return
      }

      try {
        const parsedAuth = JSON.parse(authData) as Auth
        console.log("Parsed auth data:", parsedAuth)

        // Check if auth is valid
        if (!parsedAuth.isAuthenticated || (!parsedAuth.authToken && !parsedAuth.authResponse?.authToken)) {
          console.log("Invalid auth data, redirecting to login")
          router.replace("/login")
          return
        }

        // Check if auth is expired (24 hours)
        const now = Date.now()
        const authTime = parsedAuth.timestamp || 0
        const authAge = now - authTime
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours

        if (authAge > maxAge) {
          console.log("Auth expired, redirecting to login")
          localStorage.removeItem("auth")
          router.replace("/login")
          return
        }

        setAuth(parsedAuth)
        setIsLoading(false)
        console.log("Authentication successful")
      } catch (err) {
        console.error("Error parsing auth data:", err)
        router.replace("/login")
      }
    }, 500) // 500ms delay before checking auth

    return () => clearTimeout(authCheckTimer)
  }, [router])

  // Handle logout
  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("auth")
    router.replace("/login")
  }

  // Check if current time is valid for check-in (always true now)
  const isValidTime = true

  // Fetch sites from API
  const fetchSites = useCallback(async () => {
    try {
      const response = await fetch(SITES_API_URL)
      if (!response.ok) {
        throw new Error(`Failed to fetch sites: ${response.status}`)
      }
      const data: Site[] = await response.json()
      setSites(data)
      setLoading(false)
    } catch (err) {
      setError(`Error fetching sites: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }, [])

  // Format time for display
  const formatTime = (date: Date | null): string => {
    if (!date) return "從未"
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
  }

  // Check if a site is valid for check-in (always valid now)
  const isSiteValid = useCallback((): boolean => {
    return true
  }, [])

  // Check if user has already checked in for the current period
  const hasCheckedInForPeriod = useCallback(
    (period: "AM" | "PM"): boolean => {
      return todayCheckIns.some((record) => record.period === period)
    },
    [todayCheckIns],
  )

  // Check if a specific site has been checked in for a period
  const isSiteCheckedIn = useCallback(
    (siteId: number, period: "AM" | "PM"): boolean => {
      return todayCheckIns.some((record) => record.siteId === siteId && record.period === period)
    },
    [todayCheckIns],
  )

  const getCheckedInWorkTypes = useCallback(
    (siteId: number, period: "AM" | "PM"): number[] => {
      const checkedInRecord = todayCheckIns.find((record) => record.siteId === siteId && record.period === period)
      return checkedInRecord?.workTypes || []
    },
    [todayCheckIns],
  )

  // Check if a site is selected
  const isSiteSelected = (siteId: number, period: "AM" | "PM"): boolean => {
    const selections = period === "AM" ? selectedAMSites : selectedPMSites
    return selections.some((selection) => selection.siteId === siteId)
  }

  // Get work types for a selected site
  const getSelectedWorkTypes = (siteId: number, period: "AM" | "PM"): number[] => {
    const selections = period === "AM" ? selectedAMSites : selectedPMSites
    const selection = selections.find((s) => s.siteId === siteId)
    return selection?.workTypes || []
  }

  // Toggle site selection
  const toggleSiteSelection = (siteId: number, period: "AM" | "PM") => {
    if (period === "AM") {
      setSelectedAMSites((prev) => {
        if (prev.some((s) => s.siteId === siteId)) {
          return prev.filter((s) => s.siteId !== siteId)
        } else {
          return [...prev, { siteId, workTypes: [] }]
        }
      })
    } else {
      setSelectedPMSites((prev) => {
        if (prev.some((s) => s.siteId === siteId)) {
          return prev.filter((s) => s.siteId !== siteId)
        } else {
          return [...prev, { siteId, workTypes: [] }]
        }
      })
    }
  }

  // Toggle work type for a site
  const toggleWorkType = (siteId: number, workTypeId: number, period: "AM" | "PM") => {
    if (period === "AM") {
      setSelectedAMSites((prev) => {
        // Find the current site selection
        const siteSelection = prev.find((s) => s.siteId === siteId)

        // If site is not selected yet, create a new selection with this worktype
        if (!siteSelection) {
          return [...prev, { siteId, workTypes: [workTypeId] }]
        }

        // Check if the worktype is already selected
        const isWorkTypeSelected = siteSelection.workTypes.includes(workTypeId)

        if (isWorkTypeSelected) {
          // Remove the worktype
          const updatedWorkTypes = siteSelection.workTypes.filter((id) => id !== workTypeId)

          // If no worktypes remain, remove the site selection entirely
          if (updatedWorkTypes.length === 0) {
            return prev.filter((s) => s.siteId !== siteId)
          }

          // Otherwise update the worktypes for this site
          return prev.map((selection) => {
            if (selection.siteId === siteId) {
              return { ...selection, workTypes: updatedWorkTypes }
            }
            return selection
          })
        } else {
          // Add the worktype
          return prev.map((selection) => {
            if (selection.siteId === siteId) {
              return { ...selection, workTypes: [...selection.workTypes, workTypeId] }
            }
            return selection
          })
        }
      })
    } else {
      setSelectedPMSites((prev) => {
        // Find the current site selection
        const siteSelection = prev.find((s) => s.siteId === siteId)

        // If site is not selected yet, create a new selection with this worktype
        if (!siteSelection) {
          return [...prev, { siteId, workTypes: [workTypeId] }]
        }

        // Check if the worktype is already selected
        const isWorkTypeSelected = siteSelection.workTypes.includes(workTypeId)

        if (isWorkTypeSelected) {
          // Remove the worktype
          const updatedWorkTypes = siteSelection.workTypes.filter((id) => id !== workTypeId)

          // If no worktypes remain, remove the site selection entirely
          if (updatedWorkTypes.length === 0) {
            return prev.filter((s) => s.siteId !== siteId)
          }

          // Otherwise update the worktypes for this site
          return prev.map((selection) => {
            if (selection.siteId === siteId) {
              return { ...selection, workTypes: updatedWorkTypes }
            }
            return selection
          })
        } else {
          // Add the worktype
          return prev.map((selection) => {
            if (selection.siteId === siteId) {
              return { ...selection, workTypes: [...selection.workTypes, workTypeId] }
            }
            return selection
          })
        }
      })
    }
  }

  const toggleSiteExpansion = (siteId: number, period: "AM" | "PM") => {
    if (period === "AM") {
      setExpandedAMSites((prev) => (prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]))
    } else {
      setExpandedPMSites((prev) => (prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]))
    }
  }

  // Handle check-in for selected sites
  const handleCheckIn = async () => {
    const period = activeTab
    const selectedSites = period === "AM" ? selectedAMSites : selectedPMSites

    if (selectedSites.length === 0 || !auth) {
      setError("請選擇至少一個地點進行簽到")
      setTimeout(() => setError(null), 3000)
      return
    }

    // Validate that all selected sites have at least one work type
    const sitesWithoutWorkTypes = selectedSites.filter((site) => site.workTypes.length === 0)
    if (sitesWithoutWorkTypes.length > 0) {
      const siteNames = sitesWithoutWorkTypes
        .map((site) => {
          const siteData = sites.find((s) => s.id === site.siteId)
          return siteData?.name || siteData?._pb_client?.name || siteData?.address || "未知地點"
        })
        .join(", ")

      setError(`請為以下地點選擇至少一種工作類型: ${siteNames}`)
      setTimeout(() => setError(null), 3000)
      return
    }

    // Get user ID from auth data
    const userId = auth.userData?.id || Number.parseInt(auth.userId || "0", 10)
    if (!userId) {
      setError("無法獲取用戶ID，請重新登錄")
      setTimeout(() => setError(null), 3000)
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Format current date for API
      const formattedDate = formatDateForAPI(new Date())
      const shift = period === "AM" ? "am" : "pm"

      // Step 1: Create the shift record
      const shiftRecord = {
        date: formattedDate,
        shift: shift,
        lb_user_id: userId,
      }

      // Send the shift record to the API
      const shiftResponse = await fetch(SHIFT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shiftRecord),
      })

      if (!shiftResponse.ok) {
        const errorData = await shiftResponse.json().catch(() => ({}))
        throw new Error(`Failed to record shift: ${shiftResponse.status} ${JSON.stringify(errorData)}`)
      }

      // Get the shift ID from the response
      const shiftData = await shiftResponse.json()
      const shiftId = shiftData.id

      if (!shiftId) {
        throw new Error("無法獲取簽到記錄ID")
      }

      console.log(`Created shift record with ID: ${shiftId}`)

      // Step 2: Create site records for each selected site
      const sitePromises = selectedSites.map(async (selection) => {
        const siteRecord = {
          lb_shift_id: shiftId,
          lb_site_id: selection.siteId,
          lb_worktype_id: selection.workTypes,
          note: "",
        }

        // Send the site record to the API
        const siteResponse = await fetch(SHIFT_SITE_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(siteRecord),
        })

        if (!siteResponse.ok) {
          const errorData = await siteResponse.json().catch(() => ({}))
          throw new Error(`Failed to record site: ${siteResponse.status} ${JSON.stringify(errorData)}`)
        }

        return await siteResponse.json()
      })

      // Wait for all site API calls to complete
      await Promise.all(sitePromises)

      // Create new check-in records for each selected site
      const newCheckIns: CheckInRecord[] = selectedSites.map((selection) => {
        const site = sites.find((s) => s.id === selection.siteId)
        return {
          time: new Date(),
          siteId: selection.siteId,
          siteName: site?.name || site?._pb_client?.name || site?.address || "未知地點",
          period: period,
          workTypes: selection.workTypes,
        }
      })

      // Add to today's check-ins
      const updatedCheckIns = [...todayCheckIns, ...newCheckIns]
      setTodayCheckIns(updatedCheckIns)

      // Clear selections
      if (period === "AM") {
        setSelectedAMSites([])
      } else {
        setSelectedPMSites([])
      }

      // Replace alert with success state
      setSuccess(`已成功在${period === "AM" ? "上午更" : "下午更"}簽到 ${selectedSites.length} 個地點！`)
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => {
        setSuccess(null)
      }, 3000)

      // After successful check-in, refresh the data from API
      if (auth) {
        const userId = auth.userData?.id || auth.userId
        if (userId) {
          const shiftDetails = await fetchShiftDetails(userId)
          processShiftDetails(shiftDetails)
        }
      }
    } catch (err) {
      console.error("Error during check-in:", err)
      setError(`簽到失敗: ${err instanceof Error ? err.message : String(err)}`)
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load data from API when component mounts
  useEffect(() => {
    // Skip if auth is not loaded yet or data is already loaded
    if (!auth || dataLoaded) return

    const loadData = async () => {
      try {
        console.log("Loading data from API")
        setLoading(true)

        // Fetch sites and work types
        await Promise.all([fetchSites(), fetchWorkTypes()])

        // Fetch shift details
        const userId = auth.userData?.id || auth.userId
        if (userId) {
          const shiftDetails = await fetchShiftDetails(userId)
          processShiftDetails(shiftDetails)
        }

        // Mark data as loaded
        setDataLoaded(true)
      } catch (err) {
        console.error("Error loading data:", err)
        setError(`Error loading data: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [auth, dataLoaded, fetchSites, fetchWorkTypes, fetchShiftDetails, processShiftDetails])

  // Update the tab switching handler to avoid any re-fetching
  const handleTabChange = (value: string) => {
    // Just update the state without any other operations
    setActiveTab(value as "AM" | "PM")
    console.log(`Switched to ${value} tab - using existing data`)
  }

  // Get the user display name, prioritizing nickname if available
  const getUserDisplayName = () => {
    if (auth?.userData?.nickname) {
      return auth.userData.nickname
    } else if (auth?.userData?.firstname) {
      return auth.userData.firstname
    } else {
      return `+${auth?.countryCode} ${auth?.phoneNumber}`
    }
  }

  // If we're still checking auth, show a loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">正在載入...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <main className="flex flex-col h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="p-4 pb-2">
          {/* Three-column layout with title, date, and user info */}
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div className="flex items-center">
              <Clipboard className="h-5 w-5 mr-2" />
              <h1 className="text-xl font-bold">魯班到</h1>
            </div>

            {/* Center: Date */}
            <div className="text-sm font-medium">
              {new Date().getMonth() + 1}月{new Date().getDate()}日 (星期
              {["日", "一", "二", "三", "四", "五", "六"][new Date().getDay()]})
            </div>

            {/* Right: Brand and user info */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {currentBrand.name} | {getUserDisplayName()}
              </Badge>
            </div>
          </div>
        </div>

        {/* General Error */}
        {error && (
          <Alert variant="destructive" className="mx-4 mb-2 animate-fade-in-down">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>錯誤</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {success && (
          <Alert className="mx-4 mb-2 bg-green-50 text-green-800 border-green-200 animate-fade-in-down">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        {/* Tabs container - moved inside the header for proper stacking */}
        <div className="bg-white border-b shadow-sm">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full" defaultValue={activeTab}>
            <TabsList className="grid grid-cols-2 mx-4 my-2 w-[calc(100%-2rem)]">
              <TabsTrigger value="AM" className="relative">
                <Sunrise className="h-4 w-4 mr-1" />
                上午更
                {hasCheckedInForPeriod("AM") && (
                  <span className="absolute top-1 right-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="PM" className="relative">
                <Sunset className="h-4 w-4 mr-1" />
                下午更
                {hasCheckedInForPeriod("PM") && (
                  <span className="absolute top-1 right-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content area with independent scrolling */}
      <div className="flex-1 overflow-auto">
        <div className={`${activeTab === "AM" ? "block" : "hidden"} p-4 pb-24`}>
          <div className="space-y-2">
            {loading ? (
              // Loading skeletons
              Array(8)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-center p-3 border rounded-lg bg-white">
                    <Skeleton className="h-5 w-5 mr-3" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))
            ) : sites.length > 0 ? (
              // For the AM tab, replace the site rendering code with:
              sites.map((site) => {
                const isValid = isSiteValid()
                const isSelected = isSiteSelected(site.id, "AM")
                const isCheckedIn = hasCheckedInForPeriod("AM")
                const isSiteAlreadyCheckedIn = isSiteCheckedIn(site.id, "AM")
                const isExpanded = expandedAMSites.includes(site.id)
                const selectedWorkTypes = getSelectedWorkTypes(site.id, "AM")

                return (
                  <Collapsible
                    key={site.id}
                    open={isExpanded}
                    className={`border rounded-lg transition-colors ${
                      isValid && !isCheckedIn
                        ? `bg-white ${isSelected ? "border-primary border-2" : ""}`
                        : isSiteAlreadyCheckedIn
                          ? "bg-green-50 border-green-200 border"
                          : "bg-gray-100 opacity-70"
                    }`}
                  >
                    <div className="p-3 relative">
                      <div className="flex items-center">
                        {/* Checkbox - only toggles selection */}
                        <div className="flex-shrink-0 z-10" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            id={`am-site-${site.id}`}
                            checked={isSelected || isSiteAlreadyCheckedIn}
                            onCheckedChange={() => {
                              if (isValid && !isCheckedIn && !isSiteAlreadyCheckedIn) {
                                toggleSiteSelection(site.id, "AM")
                              }
                            }}
                            disabled={!isValid || isCheckedIn || isSiteAlreadyCheckedIn}
                            className="mr-0"
                          />
                        </div>

                        {/* Vertical divider */}
                        <div className="w-px h-10 bg-gray-200 mx-3"></div>

                        {/* Site info - clicking this area toggles expansion */}
                        <div className="flex-1 cursor-pointer" onClick={() => toggleSiteExpansion(site.id, "AM")}>
                          <div className="font-medium">
                            {site.name || site._pb_client?.name || site.address}
                            {/* Add work type counter when site is selected */}
                            {isSelected && (
                              <span className="text-primary ml-1 font-normal">({selectedWorkTypes.length})</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">{site.address}</div>

                          {isSiteAlreadyCheckedIn && (
                            <div className="text-xs text-green-600 mt-2">
                              <div className="flex items-center mb-1">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                您已在上午更簽到此地點
                              </div>
                              {getCheckedInWorkTypes(site.id, "AM").length > 0 && (
                                <div className="mt-1">
                                  <div className="text-xs text-muted-foreground">已選工作類型:</div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {getCheckedInWorkTypes(site.id, "AM").map((workTypeId) => {
                                      const workType = workTypes.find((wt) => wt.id === workTypeId)
                                      const IconComponent = workType ? getIconComponent(workType.icon) : Wrench
                                      return (
                                        <div
                                          key={workTypeId}
                                          className="inline-flex items-center px-2 py-1 bg-primary/10 rounded text-xs"
                                        >
                                          <IconComponent className="h-3 w-3 mr-1 text-muted-foreground" />
                                          {workType?.name || `Type ${workTypeId}`}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Expand/collapse arrow - right justified */}
                        <div className="flex-shrink-0 ml-2">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Work type selection */}
                    <CollapsibleContent>
                      <div className="px-3 pb-3 pt-1 border-t mt-1">
                        {isSiteAlreadyCheckedIn ? (
                          <div className="text-xs font-medium mb-2 ml-8">已選工作類型:</div>
                        ) : (
                          <div className="text-xs font-medium mb-2 ml-8">選擇工作類型:</div>
                        )}
                        <div className="grid grid-cols-2 gap-2 ml-8">
                          {loadingWorkTypes ? (
                            // Show loading skeletons for work types
                            Array(6)
                              .fill(0)
                              .map((_, i) => (
                                <div key={i} className="flex items-center p-2 rounded-md border bg-gray-50">
                                  <Skeleton className="h-4 w-4 mr-2" />
                                  <Skeleton className="h-4 w-20" />
                                </div>
                              ))
                          ) : workTypes.length > 0 ? (
                            workTypes.map((workType) => {
                              const isWorkTypeSelected = isSiteAlreadyCheckedIn
                                ? getCheckedInWorkTypes(site.id, "AM").includes(workType.id)
                                : selectedWorkTypes.includes(workType.id)
                              const IconComponent = getIconComponent(workType.icon)
                              return (
                                <div
                                  key={workType.id}
                                  className={`flex items-center p-2 rounded-md ${!isSiteAlreadyCheckedIn ? "cursor-pointer" : ""} ${
                                    isWorkTypeSelected ? "bg-primary/10 border border-primary/30" : "bg-gray-50 border"
                                  }`}
                                  onClick={() => {
                                    if (!isSiteAlreadyCheckedIn) {
                                      toggleWorkType(site.id, workType.id, "AM")
                                    }
                                  }}
                                >
                                  <Checkbox
                                    id={`am-site-${site.id}-work-${workType.id}`}
                                    checked={isWorkTypeSelected}
                                    className="mr-2"
                                    disabled={isSiteAlreadyCheckedIn}
                                    onClick={(e) => {
                                      if (!isSiteAlreadyCheckedIn) {
                                        e.stopPropagation() // Prevent double toggling
                                      }
                                    }}
                                  />
                                  <IconComponent className="h-4 w-4 mr-1 text-muted-foreground" />
                                  <label
                                    htmlFor={`am-site-${site.id}-work-${workType.id}`}
                                    className="text-xs cursor-pointer flex-1"
                                  >
                                    {workType.name}
                                  </label>
                                </div>
                              )
                            })
                          ) : (
                            <div className="col-span-2 text-center p-2 text-muted-foreground">未找到工作類型</div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )
              })
            ) : (
              <div className="text-center p-4 text-muted-foreground">未找到地點</div>
            )}
          </div>
        </div>

        <div className={`${activeTab === "PM" ? "block" : "hidden"} p-4 pb-24`}>
          <div className="space-y-2">
            {loading ? (
              // Loading skeletons
              Array(8)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-center p-3 border rounded-lg bg-white">
                    <Skeleton className="h-5 w-5 mr-3" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))
            ) : sites.length > 0 ? (
              // For the PM tab, replace the site rendering code with:
              sites.map((site) => {
                const isValid = isSiteValid()
                const isSelected = isSiteSelected(site.id, "PM")
                const isCheckedIn = hasCheckedInForPeriod("PM")
                const isSiteAlreadyCheckedIn = isSiteCheckedIn(site.id, "PM")
                const isExpanded = expandedPMSites.includes(site.id)
                const selectedWorkTypes = getSelectedWorkTypes(site.id, "PM")

                return (
                  <Collapsible
                    key={site.id}
                    open={isExpanded}
                    className={`border rounded-lg transition-colors ${
                      isValid && !isCheckedIn
                        ? `bg-white ${isSelected ? "border-primary border-2" : ""}`
                        : isSiteAlreadyCheckedIn
                          ? "bg-green-50 border-green-200 border"
                          : "bg-gray-100 opacity-70"
                    }`}
                  >
                    <div className="p-3 relative">
                      <div className="flex items-center">
                        {/* Checkbox - only toggles selection */}
                        <div className="flex-shrink-0 z-10" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            id={`pm-site-${site.id}`}
                            checked={isSelected || isSiteAlreadyCheckedIn}
                            onCheckedChange={() => {
                              if (isValid && !isCheckedIn && !isSiteAlreadyCheckedIn) {
                                toggleSiteSelection(site.id, "PM")
                              }
                            }}
                            disabled={!isValid || isCheckedIn || isSiteAlreadyCheckedIn}
                            className="mr-0"
                          />
                        </div>

                        {/* Vertical divider */}
                        <div className="w-px h-10 bg-gray-200 mx-3"></div>

                        {/* Site info - clicking this area toggles expansion */}
                        <div className="flex-1 cursor-pointer" onClick={() => toggleSiteExpansion(site.id, "PM")}>
                          <div className="font-medium">
                            {site.name || site._pb_client?.name || site.address}
                            {/* Add work type counter when site is selected */}
                            {isSelected && (
                              <span className="text-primary ml-1 font-normal">({selectedWorkTypes.length})</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">{site.address}</div>

                          {isSiteAlreadyCheckedIn && (
                            <div className="text-xs text-green-600 mt-2">
                              <div className="flex items-center mb-1">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                您已在下午更簽到此地點
                              </div>
                              {getCheckedInWorkTypes(site.id, "PM").length > 0 && (
                                <div className="mt-1">
                                  <div className="text-xs text-muted-foreground">已選工作類型:</div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {getCheckedInWorkTypes(site.id, "PM").map((workTypeId) => {
                                      const workType = workTypes.find((wt) => wt.id === workTypeId)
                                      const IconComponent = workType ? getIconComponent(workType.icon) : Wrench
                                      return (
                                        <div
                                          key={workTypeId}
                                          className="inline-flex items-center px-2 py-1 bg-primary/10 rounded text-xs"
                                        >
                                          <IconComponent className="h-3 w-3 mr-1 text-muted-foreground" />
                                          {workType?.name || `Type ${workTypeId}`}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Expand/collapse arrow - right justified */}
                        <div className="flex-shrink-0 ml-2">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Work type selection */}
                    <CollapsibleContent>
                      <div className="px-3 pb-3 pt-1 border-t mt-1">
                        {isSiteAlreadyCheckedIn ? (
                          <div className="text-xs font-medium mb-2 ml-8">已選工作類型:</div>
                        ) : (
                          <div className="text-xs font-medium mb-2 ml-8">選擇工作類型:</div>
                        )}
                        <div className="grid grid-cols-2 gap-2 ml-8">
                          {loadingWorkTypes ? (
                            // Show loading skeletons for work types
                            Array(6)
                              .fill(0)
                              .map((_, i) => (
                                <div key={i} className="flex items-center p-2 rounded-md border bg-gray-50">
                                  <Skeleton className="h-4 w-4 mr-2" />
                                  <Skeleton className="h-4 w-20" />
                                </div>
                              ))
                          ) : workTypes.length > 0 ? (
                            workTypes.map((workType) => {
                              const isWorkTypeSelected = isSiteAlreadyCheckedIn
                                ? getCheckedInWorkTypes(site.id, "PM").includes(workType.id)
                                : selectedWorkTypes.includes(workType.id)
                              const IconComponent = getIconComponent(workType.icon)
                              return (
                                <div
                                  key={workType.id}
                                  className={`flex items-center p-2 rounded-md ${!isSiteAlreadyCheckedIn ? "cursor-pointer" : ""} ${
                                    isWorkTypeSelected ? "bg-primary/10 border border-primary/30" : "bg-gray-50 border"
                                  }`}
                                  onClick={() => {
                                    if (!isSiteAlreadyCheckedIn) {
                                      toggleWorkType(site.id, workType.id, "PM")
                                    }
                                  }}
                                >
                                  <Checkbox
                                    id={`pm-site-${site.id}-work-${workType.id}`}
                                    checked={isWorkTypeSelected}
                                    className="mr-2"
                                    disabled={isSiteAlreadyCheckedIn}
                                    onClick={(e) => {
                                      if (!isSiteAlreadyCheckedIn) {
                                        e.stopPropagation() // Prevent double toggling
                                      }
                                    }}
                                  />
                                  <IconComponent className="h-4 w-4 mr-1 text-muted-foreground" />
                                  <label className="text-xs cursor-pointer flex-1">{workType.name}</label>
                                </div>
                              )
                            })
                          ) : (
                            <div className="col-span-2 text-center p-2 text-muted-foreground">未找到工作類型</div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )
              })
            ) : (
              <div className="text-center p-4 text-muted-foreground">未找到地點</div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Footer with Check In Button */}
      <div className="sticky bottom-16 z-40 bg-white border-t p-4 shadow-lg">
        <Button
          onClick={handleCheckIn}
          className="w-full"
          size="lg"
          disabled={
            isSubmitting ||
            (activeTab === "AM" && (selectedAMSites.length === 0 || hasCheckedInForPeriod("AM"))) ||
            (activeTab === "PM" && (selectedPMSites.length === 0 || hasCheckedInForPeriod("PM")))
          }
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
              正在提交...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              {activeTab === "AM"
                ? hasCheckedInForPeriod("AM")
                  ? "您已在上午更簽到"
                  : `簽到上午更 (已選擇 ${selectedAMSites.length} 個地點)`
                : hasCheckedInForPeriod("PM")
                  ? "您已在下午更簽到"
                  : `簽到下午更 (已選擇 ${selectedPMSites.length} 個地點)`}
            </>
          )}
        </Button>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </main>
  )
}

