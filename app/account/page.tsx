"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, LogOut, Calendar, ChevronLeft, ChevronRight, Image, Receipt, MapPin, X } from "lucide-react"
import { BottomNavigation } from "@/components/bottom-navigation"

interface UserData {
  id: number
  firstname?: string
  lastname?: string
  country?: string
  number?: string
  created_at?: number
}

interface Auth {
  isAuthenticated: boolean
  phoneNumber: string
  countryCode: string
  userId?: string
  authToken?: string
  userData?: UserData
  timestamp: number
}

// Interface for check-in data
interface CheckInData {
  date: string // YYYY-MM-DD
  periods: {
    AM: boolean
    PM: boolean
  }
  amSites?: number // Number of sites marked in AM
  pmSites?: number // Number of sites marked in PM
  photos?: number
  claims?: number
}

export default function AccountPage() {
  const [auth, setAuth] = useState<Auth | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [checkInData, setCheckInData] = useState<CheckInData[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Optimize the account page to avoid unnecessary auth checks
  useEffect(() => {
    const authCheckKey = "account_auth_checked"
    const authChecked = sessionStorage.getItem(authCheckKey)

    const fetchUserData = async () => {
      const authData = localStorage.getItem("auth")
      if (!authData) {
        router.replace("/login")
        return
      }

      try {
        const parsedAuth = JSON.parse(authData) as Auth

        // Check if auth is valid
        if (!parsedAuth.isAuthenticated) {
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

        // Set flag to prevent multiple checks
        sessionStorage.setItem(authCheckKey, "true")

        // Fetch check-in data for the current month
        await fetchCheckInData(parsedAuth.userId || parsedAuth.userData?.id)
      } catch (err) {
        console.error("Error parsing auth data:", err)
        router.replace("/login")
      } finally {
        setIsLoading(false)
      }
    }

    if (!authChecked) {
      fetchUserData()
    } else {
      // If we've already checked auth, just load from localStorage
      const authData = localStorage.getItem("auth")
      if (authData) {
        try {
          const parsedAuth = JSON.parse(authData) as Auth
          setAuth(parsedAuth)

          // Fetch check-in data for the current month
          fetchCheckInData(parsedAuth.userId || parsedAuth.userData?.id)
        } catch (err) {
          console.error("Error parsing auth data:", err)
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }
  }, [router])

  // Function to fetch check-in data for the current month
  const fetchCheckInData = async (userId: string | number | undefined) => {
    if (!userId) return

    try {
      // For demo purposes, we'll create some mock data
      // In a real app, you would fetch this from your API
      const mockData: CheckInData[] = [
        {
          date: formatDate(new Date()),
          periods: { AM: true, PM: false },
          amSites: 2,
          photos: 2,
          claims: 0,
        },
        {
          date: formatDate(new Date(Date.now() - 86400000)), // Yesterday
          periods: { AM: true, PM: true },
          amSites: 1,
          pmSites: 3,
          photos: 3,
          claims: 1,
        },
        {
          date: formatDate(new Date(Date.now() - 86400000 * 2)), // Day before yesterday
          periods: { AM: false, PM: true },
          pmSites: 2,
          photos: 0,
          claims: 2,
        },
        {
          date: formatDate(new Date(Date.now() - 86400000 * 5)), // 5 days ago
          periods: { AM: true, PM: false },
          amSites: 1,
          photos: 1,
          claims: 0,
        },
      ]

      setCheckInData(mockData)
    } catch (error) {
      console.error("Error fetching check-in data:", error)
    }
  }

  const handleLogout = async () => {
    try {
      // Call logout API
      await fetch("/api/auth/logout", {
        method: "POST",
      })

      // Clear localStorage
      localStorage.removeItem("auth")
      router.replace("/login")
    } catch (error) {
      console.error("Logout error:", error)
      // Fallback: still clear localStorage and redirect
      localStorage.removeItem("auth")
      router.replace("/login")
    }
  }

  // Helper function to format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  // Function to get days in month
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Function to get the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay()
  }

  // Function to check if a date has check-in data
  const getCheckInStatus = (dateStr: string): { AM: boolean; PM: boolean; photos: number; claims: number } => {
    const checkIn = checkInData.find((data) => data.date === dateStr)
    return checkIn
      ? {
          AM: checkIn.periods.AM,
          PM: checkIn.periods.PM,
          photos: checkIn.photos || 0,
          claims: checkIn.claims || 0,
        }
      : { AM: false, PM: false, photos: 0, claims: 0 }
  }

  // Function to get detailed data for a specific date
  const getDateDetails = (dateStr: string): CheckInData | undefined => {
    return checkInData.find((data) => data.date === dateStr)
  }

  // Function to navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth((prevMonth) => {
      const newMonth = new Date(prevMonth)
      newMonth.setMonth(newMonth.getMonth() - 1)
      return newMonth
    })
  }

  // Function to navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth((prevMonth) => {
      const newMonth = new Date(prevMonth)
      newMonth.setMonth(newMonth.getMonth() + 1)
      return newMonth
    })
  }

  // Function to handle day selection
  const handleDayClick = (dateStr: string) => {
    // Toggle selection if clicking the same date
    if (selectedDate === dateStr) {
      setSelectedDate(null)
    } else {
      setSelectedDate(dateStr)
    }
  }

  // Function to format date for display
  const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    })
  }

  // Function to render the calendar
  const renderCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDayOfMonth = getFirstDayOfMonth(year, month)

    // Create array of day numbers
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    // Create array for empty cells before the first day
    const emptyCells = Array.from({ length: firstDayOfMonth }, (_, i) => null)

    // Combine empty cells and days
    const allCells = [...emptyCells, ...days]

    // Get current date for highlighting
    const today = new Date()
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year
    const currentDate = today.getDate()

    // Month names
    const monthNames = [
      "一月",
      "二月",
      "三月",
      "四月",
      "五月",
      "六月",
      "七月",
      "八月",
      "九月",
      "十月",
      "十一月",
      "十二月",
    ]

    // Day names
    const dayNames = ["日", "一", "二", "三", "四", "五", "六"]

    return (
      <div>
        <div className="flex justify-between items-center mb-2">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-xs font-medium">
            {monthNames[month]} {year}
          </h3>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Day headers */}
          {dayNames.map((day, index) => (
            <div key={`header-${index}`} className="text-[10px] text-muted-foreground py-1">
              {day}
            </div>
          ))}

          {/* Calendar cells */}
          {allCells.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="h-6 p-0.5"></div>
            }

            const date = new Date(year, month, day)
            const dateStr = formatDate(date)
            const status = getCheckInStatus(dateStr)
            const isToday = isCurrentMonth && day === currentDate
            const hasData = status.AM || status.PM || status.photos > 0 || status.claims > 0
            const isSelected = selectedDate === dateStr

            return (
              <div
                key={`day-${index}`}
                className={`h-6 p-0.5 text-[10px] relative flex flex-col items-center justify-start ${
                  isToday ? "bg-primary/10 rounded-sm font-bold" : ""
                } ${isSelected ? "bg-primary/20 rounded-sm" : ""} ${hasData ? "cursor-pointer hover:bg-gray-100" : ""}`}
                onClick={() => hasData && handleDayClick(dateStr)}
              >
                <span>{day}</span>

                {/* Indicators */}
                <div className="flex space-x-0.5 mt-0.5">
                  {/* Check-in indicator (split for AM/PM) */}
                  <div className="flex w-2 h-1">
                    <div
                      className={`w-1 h-1 rounded-l-full ${status.AM ? "bg-green-500" : "bg-gray-300 opacity-30"}`}
                    ></div>
                    <div
                      className={`w-1 h-1 rounded-r-full ${status.PM ? "bg-green-500" : "bg-gray-300 opacity-30"}`}
                    ></div>
                  </div>

                  {/* Photo indicator - pill shaped */}
                  <div
                    className={`w-2 h-1 rounded-full ${status.photos > 0 ? "bg-blue-400" : "bg-blue-400 opacity-20"}`}
                  ></div>

                  {/* Claims indicator - pill shaped */}
                  <div
                    className={`w-2 h-1 rounded-full ${status.claims > 0 ? "bg-yellow-400" : "bg-yellow-400 opacity-20"}`}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Render day details section
  const renderDateDetails = () => {
    if (!selectedDate) return null

    const details = getDateDetails(selectedDate)
    const formattedDate = formatDisplayDate(selectedDate)

    return (
      <div className="mt-4 border rounded-lg bg-white p-4 animate-in fade-in-50 duration-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium">{formattedDate}</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedDate(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Check-in details */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium flex items-center">
              <MapPin className="h-3 w-3 mr-1 text-primary" />
              簽到地點
            </h4>

            {details?.periods.AM || details?.periods.PM ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div
                  className={`p-2 rounded-md border ${details?.periods.AM ? "bg-green-50 border-green-200" : "bg-gray-50"}`}
                >
                  <div className="text-xs font-medium">上午更</div>
                  <div className="text-xs">{details?.periods.AM ? `${details.amSites} 個地點` : "未簽到"}</div>
                </div>
                <div
                  className={`p-2 rounded-md border ${details?.periods.PM ? "bg-green-50 border-green-200" : "bg-gray-50"}`}
                >
                  <div className="text-xs font-medium">下午更</div>
                  <div className="text-xs">{details?.periods.PM ? `${details.pmSites} 個地點` : "未簽到"}</div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">該日無簽到記錄</div>
            )}
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium flex items-center">
              <Image className="h-3 w-3 mr-1 text-primary" />
              照片上傳
            </h4>

            {details?.photos && details.photos > 0 ? (
              <div className="p-2 rounded-md border bg-blue-50 border-blue-200">
                <div className="text-xs">已上傳 {details.photos} 張照片</div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">該日無照片上傳</div>
            )}
          </div>

          {/* Claims */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium flex items-center">
              <Receipt className="h-3 w-3 mr-1 text-primary" />
              報銷申請
            </h4>

            {details?.claims && details.claims > 0 ? (
              <div className="p-2 rounded-md border bg-yellow-50 border-yellow-200">
                <div className="text-xs">已提交 {details.claims} 個報銷申請</div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">該日無報銷申請</div>
            )}
          </div>
        </div>
      </div>
    )
  }

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
    <main className="flex flex-col min-h-screen bg-gray-50 pb-16">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <User className="h-5 w-5" />
              魯班到
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        {/* Compact User Info Card */}
        <Card className="w-full mb-4">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center">
              <div className="bg-primary/10 p-2 rounded-full mr-3">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {auth?.userData?.firstname && auth?.userData?.lastname
                    ? `${auth.userData.firstname} ${auth.userData.lastname}`
                    : auth?.userData?.firstname || "未設置"}
                </p>
                <p className="text-xs text-muted-foreground">
                  +{auth?.countryCode} {auth?.phoneNumber}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Card */}
        <Card className="w-full mb-4">
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              <CardTitle className="text-base">考勤日曆</CardTitle>
            </div>
            <CardDescription className="text-xs">點擊日期查看詳細記錄</CardDescription>
          </CardHeader>
          <CardContent>
            {renderCalendar()}

            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              <div className="flex items-center">
                <div className="flex mr-1">
                  <div className="w-1 h-2 rounded-l-full bg-green-500"></div>
                  <div className="w-1 h-2 rounded-r-full bg-green-500"></div>
                </div>
                <span className="text-muted-foreground">簽到 (上午/下午)</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-400 mr-1"></div>
                <span className="text-muted-foreground">照片</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-yellow-400 mr-1"></div>
                <span className="text-muted-foreground">報銷</span>
              </div>
            </div>

            {/* Date details section - shown below the calendar when a date is selected */}
            {selectedDate && renderDateDetails()}
          </CardContent>
        </Card>
      </div>

      {/* Footer text */}
      <div className="text-xs text-center text-muted-foreground mt-4 mb-2">魯班到 v1.0 | 百泰工程</div>

      <BottomNavigation />
    </main>
  )
}

