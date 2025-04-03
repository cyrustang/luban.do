"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Upload,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  Plus,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building,
  FileText,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Camera,
  Grid2X2,
  Rows,
  CalendarDays,
} from "lucide-react"
import { BottomNavigation } from "@/components/bottom-navigation"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Toggle } from "@/components/ui/toggle"

// Update the API endpoint constant to reflect the new API usage
// Find the UPLOADS_API_URL constant and update it
const UPLOADS_API_URL = "https://api.bricks.academy/api:luban/lb_upload/u"
const UPLOAD_WEBHOOK_URL = "https://hook.eu1.make.com/mlsygo8a8mp8dsnv7cwj0p8sg2q6e8sq"
const IMAGE_BASE_URL = "https://churchnas.com/luban.do/"

// Add interface for upload data
interface UploadData {
  id: string
  date: string
  time: string
  timestamp: number
  lb_user_id: number
  file_name_ori: string
  file_mime: string
  file_name: string
  file_ext: string
  file_path: string
  classified: boolean
  file_class: string
  created_at: number
  sort_date?: string // Add this field
  sort_time?: string // Add this field
  _lb_upload_image_of_lb_upload?: {
    id: number
    lb_upload_id: string
    exif_date: string
    exif_time: string
    exif_lat?: number
    exif_lng?: number
    created_at: number
  }
}

interface Auth {
  isAuthenticated: boolean
  phoneNumber: string
  countryCode: string
  userId?: string
  authToken?: string
  authResponse?: any
  userData?: {
    id: number
    firstname?: string
    lastname?: string
  }
  timestamp: number
}

interface FileWithProgress extends File {
  id: string
  progress: number
  status: "pending" | "uploading" | "success" | "error"
  error?: string
}

// Add a new type for sort options after the existing interfaces
type SortOption = "upload" | "content"

// Add a new type for view mode
type ViewMode = "week" | "month"

// Update the useFetchUploads function to use the new API endpoint structure without date parameters
const useFetchUploads = () => {
  return useCallback(async (userId: string | number, sort: SortOption) => {
    if (!userId) return []

    try {
      // Construct the API URL with only userId and sort option
      // Format: /userId/sortOption
      const url = `${UPLOADS_API_URL}/${userId}/${sort}`

      console.log(`Fetching all uploads from: ${url}`)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store", // Prevent caching
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch uploads: ${response.status}`)
      }

      const data: UploadData[] = await response.json()
      console.log(`Fetched ${data.length} total uploads`)
      return data
    } catch (err) {
      console.error(`Error fetching uploads: ${err instanceof Error ? err.message : String(err)}`)
      return []
    }
  }, [])
}

// Remove the useFetchMonthUploads function as we'll now get all uploads at once

export default function UploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<FileWithProgress[]>([])
  const [previewUrls, setPreviewUrls] = useState<{ id: string; url: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [weekDays, setWeekDays] = useState<Date[]>([])
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [overallProgress, setOverallProgress] = useState<number>(0)
  const [auth, setAuth] = useState<Auth | null>(null)
  const [hasSuccessfulUploads, setHasSuccessfulUploads] = useState<boolean>(false)
  // Add state for uploads
  const [uploads, setUploads] = useState<UploadData[]>([])
  const [loadingUploads, setLoadingUploads] = useState(false)
  // Add state for dates with photos
  const [datesWithPhotos, setDatesWithPhotos] = useState<string[]>([])
  const [loadingMonthData, setLoadingMonthData] = useState(false)
  // Add state for photo viewer
  const [viewerOpen, setViewerOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  // Add a state for sort option in the component
  const [sortOption, setSortOption] = useState<SortOption>("upload")
  // Add a state for sort direction
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  // Add state for upload sheet
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false)
  // Add state for view mode (week or month)
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  // Add state for month days
  const [monthDays, setMonthDays] = useState<Date[][]>([])

  const fetchUploads = useFetchUploads()

  // Check authentication and get user data
  useEffect(() => {
    const authCheckKey = "camera_auth_checked"
    const authChecked = sessionStorage.getItem(authCheckKey)

    const checkAuth = async () => {
      const authData = localStorage.getItem("auth")
      if (!authData) {
        router.replace("/login")
        return
      }

      try {
        // Parse auth data
        const parsedAuth = JSON.parse(authData) as Auth
        if (!parsedAuth.isAuthenticated) {
          router.replace("/login")
        } else {
          // Set auth data in state
          setAuth(parsedAuth)
          // Set flag to prevent multiple checks
          sessionStorage.setItem(authCheckKey, "true")
        }
      } catch (err) {
        console.error("Error parsing auth data:", err)
        router.replace("/login")
      }
    }

    if (!authChecked) {
      checkAuth()
    } else {
      // If already checked, just get the auth data
      const authData = localStorage.getItem("auth")
      if (authData) {
        try {
          const parsedAuth = JSON.parse(authData) as Auth
          setAuth(parsedAuth)
        } catch (err) {
          console.error("Error parsing auth data:", err)
        }
      }
    }
  }, [router])

  // Generate week days when component mounts or selected date changes
  useEffect(() => {
    generateWeekDays(selectedDate)
    generateMonthDays(selectedDate)
  }, [selectedDate])

  // Add a function to load uploads for the selected date
  // Update the loadUploadsForSelectedDate function to filter by date client-side
  const loadUploadsForSelectedDate = useCallback(async () => {
    if (!auth) return

    const userId = auth.userData?.id || auth.userId
    if (!userId) return

    try {
      setLoadingUploads(true)
      console.log(`Fetching all uploads with sort option: ${sortOption}`)
      const allData = await fetchUploads(userId, sortOption)

      // Filter uploads for the selected date using sort_date
      const formattedDate = selectedDate.toISOString().split("T")[0]
      const filteredData = allData.filter((upload) => upload.sort_date === formattedDate)

      // Sort the filtered data by sort_time in ascending order
      const sortedData = [...filteredData].sort((a, b) => {
        if (!a.sort_time || !b.sort_time) return 0
        return a.sort_time.localeCompare(b.sort_time)
      })

      console.log(`Filtered ${sortedData.length} uploads for date ${formattedDate}`)

      // Set the filtered and sorted data
      setUploads(sortedData)
    } catch (err) {
      console.error(`Error loading uploads: ${err instanceof Error ? err.message : "未知錯誤"}`)
      setError(`無法載入照片: ${err instanceof Error ? err.message : "未知錯誤"}`)
    } finally {
      setLoadingUploads(false)
    }
  }, [auth, selectedDate, fetchUploads, sortOption])

  // Add a function to load all uploads for the current month
  // Update the loadMonthUploads function to extract dates from all uploads
  const loadMonthUploads = useCallback(async () => {
    if (!auth) return

    const userId = auth.userData?.id || auth.userId
    if (!userId) return

    try {
      setLoadingMonthData(true)
      const year = selectedDate.getFullYear()
      const month = selectedDate.getMonth()

      console.log(`Loading month data for ${month + 1}/${year}`)
      const allData = await fetchUploads(userId, sortOption)

      // Extract unique dates with photos for the current month
      const currentMonthDates = allData
        .filter((upload) => {
          if (!upload.sort_date) return false;
          const uploadDate = new Date(upload.sort_date);
          return uploadDate.getFullYear() === year && uploadDate.getMonth() === month;
        })
        .map((upload) => upload.sort_date)
        .filter((date): date is string => date !== undefined);

      const uniqueDates = [...new Set(currentMonthDates)];
      console.log(`Found photos on ${uniqueDates.length} different dates in ${month + 1}/${year}`);
      setDatesWithPhotos(uniqueDates);
    } catch (err) {
      console.error(`Error loading month data: ${err instanceof Error ? err.message : String(err)}`)
      // Don't show error to user, just log it
      setDatesWithPhotos([])
    } finally {
      setLoadingMonthData(false)
    }
  }, [auth, selectedDate, fetchUploads, sortOption])

  // Update the useEffect to load uploads when the selected date changes
  // Update the useEffect dependencies to include sortOption
  useEffect(() => {
    if (auth) {
      loadUploadsForSelectedDate()
    }
  }, [auth, selectedDate, loadUploadsForSelectedDate, sortOption])

  // Add a new useEffect to load month data when the month changes
  // Update the useEffect dependencies to include sortOption
  useEffect(() => {
    if (auth) {
      loadMonthUploads()
    }
  }, [auth, selectedDate.getMonth(), selectedDate.getFullYear(), loadMonthUploads, sortOption])

  // Add a function to refresh uploads after successful upload
  const refreshUploads = async () => {
    await loadUploadsForSelectedDate()
    await loadMonthUploads()
  }

  // Function to generate week days starting from Monday
  const generateWeekDays = (date: Date) => {
    const days: Date[] = []
    const currentDay = new Date(date)

    // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = currentDay.getDay()

    // Calculate the Monday of the current week
    // If today is Sunday (0), go back 6 days to get to Monday
    // Otherwise, go back (dayOfWeek - 1) days
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    currentDay.setDate(currentDay.getDate() - mondayOffset)

    // Generate 7 days starting from Monday
    for (let i = 0; i < 7; i++) {
      days.push(new Date(currentDay))
      currentDay.setDate(currentDay.getDate() + 1)
    }

    setWeekDays(days)
  }

  // Function to generate month days as a 2D array of weeks
  const generateMonthDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()

    // Get the first day of the month
    const firstDay = new Date(year, month, 1)
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0)

    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay()

    // Calculate the Monday before the first day of the month
    // If first day is Sunday (0), go back 6 days to get to Monday
    // Otherwise, go back (firstDayOfWeek - 1) days
    const mondayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

    // Create a new date for the first Monday to display
    const firstMonday = new Date(firstDay)
    firstMonday.setDate(firstMonday.getDate() - mondayOffset)

    // Calculate how many weeks we need to display
    // We'll show 6 weeks maximum to ensure we cover the entire month
    const weeks: Date[][] = []

    // Current date we're processing
    const currentDate = new Date(firstMonday)

    // Generate 6 weeks (42 days) starting from the first Monday
    for (let week = 0; week < 6; week++) {
      const weekDays: Date[] = []

      for (let day = 0; day < 7; day++) {
        weekDays.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
      }

      weeks.push(weekDays)

      // If we've gone past the end of the month and completed a week, we can stop
      if (currentDate > lastDay && currentDate.getDay() === 1) {
        break
      }
    }

    setMonthDays(weeks)
  }

  // Function to navigate to previous week
  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 7)
    setSelectedDate(newDate)
  }

  // Function to navigate to next week
  const goToNextWeek = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 7)
    setSelectedDate(newDate)
  }

  // Function to navigate to previous month
  const goToPreviousMonth = () => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setSelectedDate(newDate)
  }

  // Function to navigate to next month
  const goToNextMonth = () => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setSelectedDate(newDate)
  }

  // Function to go to today
  const goToToday = () => {
    setSelectedDate(new Date())
  }

  // Function to check if a date is today
  const isToday = (date: Date): boolean => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Function to check if a date is in the current month
  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear()
  }

  // Function to format date for display
  const formatDate = (date: Date): string => {
    return date.getDate().toString()
  }

  // Function to get day name
  const getDayName = (date: Date): string => {
    const days = ["日", "一", "二", "三", "四", "五", "六"]
    return days[date.getDay()]
  }

  // Function to get month name
  const getMonthName = (month: number): string => {
    const months = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"]
    return months[month]
  }

  // Update the function to check if a date has photos
  const hasPhotosOnDate = (date: Date): boolean => {
    if (datesWithPhotos.length === 0) return false

    const formattedDate = date.toISOString().split("T")[0]
    return datesWithPhotos.includes(formattedDate)
  }

  // Toggle view mode between week and month
  const toggleViewMode = () => {
    setViewMode(viewMode === "week" ? "month" : "week")
  }

  // Add functions for the photo viewer
  const openPhotoViewer = (index: number) => {
    setCurrentPhotoIndex(index)
    setViewerOpen(true)
  }

  const closePhotoViewer = () => {
    setViewerOpen(false)
  }

  const goToPreviousPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : uploads.length - 1))
  }

  const goToNextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev < uploads.length - 1 ? prev + 1 : 0))
  }

  // Function to get classification label and icon
  const getClassificationInfo = (upload: UploadData) => {
    // First determine classification status icon and color
    const classificationStatus = upload.classified
      ? { icon: CheckCircle, color: "text-green-500" }
      : { icon: AlertCircle, color: "text-orange-500" }

    // Then determine file class icon (always black and white)
    let fileClassIcon
    if (!upload.classified || !upload.file_class) {
      fileClassIcon = HelpCircle
    } else if (upload.file_class === "site_photo") {
      fileClassIcon = Building
    } else if (upload.file_class === "doc_photo") {
      fileClassIcon = FileText
    } else {
      fileClassIcon = HelpCircle
    }

    return {
      status: classificationStatus,
      fileClassIcon,
      label: !upload.classified
        ? "待處理"
        : upload.file_class === "site_photo"
          ? "工地照片"
          : upload.file_class === "doc_photo"
            ? "單據照片"
            : "其他照片",
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      // Clear any previous errors or success messages
      setError(null)
      setSuccess(null)

      // Convert FileList to array without filtering for image files only
      const fileArray = Array.from(files)

      if (fileArray.length === 0) {
        setError("請選擇有效的文件")
        return
      }

      // Add new files to existing selection with progress tracking
      const newFiles = fileArray.map((file) => {
        const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        return Object.assign(file, {
          id: fileId,
          progress: 0,
          status: "pending" as const,
        })
      })

      setSelectedFiles((prev) => [...prev, ...newFiles])

      // Create preview URLs for each file
      newFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviewUrls((prev) => [...prev, { id: file.id, url: reader.result as string }])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const resetUpload = () => {
    setSelectedFiles([])
    setPreviewUrls([])
    setError(null)
    setOverallProgress(0)
    setHasSuccessfulUploads(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeFile = (fileId: string) => {
    setSelectedFiles((prev) => prev.filter((file) => file.id !== fileId))
    setPreviewUrls((prev) => prev.filter((preview) => preview.id !== fileId))
  }

  // Update the uploadSingleFile function to better handle progress tracking
  const uploadSingleFile = (
    file: FileWithProgress,
    userId: string | number,
    formattedDate: string,
    fileIndex: number,
    totalFiles: number,
  ): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      // Create FormData for this specific file
      const formData = new FormData()

      // Add user ID to the form data
      formData.append("user_id", userId.toString())

      // Add date information
      formData.append("date", formattedDate)

      // Add count as 1 since we're uploading one file at a time
      formData.append("count", "1")

      // Add the file
      formData.append("photo", file)

      // Create a custom XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          // Calculate progress for this file (0-90%)
          const filePercentComplete = Math.round((event.loaded / event.total) * 90)

          // Update this specific file's progress
          setSelectedFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, progress: filePercentComplete, status: "uploading" } : f)),
          )

          // Calculate overall progress based on completed files and current file progress
          const completedFilesProgress = fileIndex * 100
          const currentFileContribution = filePercentComplete
          const overallPercent = Math.round((completedFilesProgress + currentFileContribution) / totalFiles)

          setOverallProgress(overallPercent)
        }
      })

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            // Parse the response JSON
            const response = JSON.parse(xhr.responseText)

            // Check if the response has status "ok"
            if (response && response.status === "ok") {
              // Success for this file - set to 100%
              setSelectedFiles((prev) =>
                prev.map((f) => (f.id === file.id ? { ...f, progress: 100, status: "success" } : f)),
              )

              // Update overall progress to include this completed file
              const newOverallProgress = Math.round(((fileIndex + 1) * 100) / totalFiles)
              setOverallProgress(newOverallProgress)

              resolve(true)
            } else {
              // Server responded but status is not "ok"
              const errorMsg = response.message || "伺服器回應無效"
              setSelectedFiles((prev) =>
                prev.map((f) => (f.id === file.id ? { ...f, status: "error", error: errorMsg } : f)),
              )
              reject(new Error(errorMsg))
            }
          } catch (error) {
            // Error parsing JSON response
            console.error("Error parsing response:", error)
            setSelectedFiles((prev) =>
              prev.map((f) => (f.id === file.id ? { ...f, status: "error", error: "伺服器回應格式錯誤" } : f)),
            )
            reject(new Error("伺服器回應格式錯誤"))
          }
        } else {
          // Error for this file
          const errorMsg = xhr.statusText || "伺服器錯誤"
          setSelectedFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, status: "error", error: errorMsg } : f)),
          )
          reject(new Error(errorMsg))
        }
      })

      xhr.addEventListener("error", () => {
        setSelectedFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: "error", error: "網絡錯誤" } : f)),
        )
        reject(new Error("網絡錯誤"))
      })

      xhr.addEventListener("abort", () => {
        setSelectedFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: "error", error: "上傳已取消" } : f)),
        )
        reject(new Error("上傳已取消"))
      })

      // Open and send the request
      xhr.open("POST", UPLOAD_WEBHOOK_URL)
      xhr.send(formData)
    })
  }

  // Replace the uploadPhotos function with this improved version
  const uploadPhotos = async () => {
    if (selectedFiles.length === 0) return

    // Clear previous messages
    setError(null)
    setSuccess(null)

    // Check if we have user ID
    const userId = auth?.userData?.id || auth?.userId
    if (!userId) {
      setError("無法獲取用戶ID，請重新登錄")
      return
    }

    try {
      setIsUploading(true)
      setOverallProgress(0)

      // Format date for API
      const formattedDate = selectedDate.toISOString().split("T")[0] // YYYY-MM-DD format

      // Filter only pending files
      const filesToUpload = selectedFiles.filter((file) => file.status === "pending")
      const totalFiles = filesToUpload.length

      if (totalFiles === 0) {
        setError("沒有待上傳的文件")
        setIsUploading(false)
        return
      }

      // Upload files one by one
      let successCount = 0
      let errorCount = 0

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i]
        try {
          // Pass the file index and total files count for progress calculation
          await uploadSingleFile(file, userId, formattedDate, i, totalFiles)
          successCount++
        } catch (err) {
          console.error(`Error uploading file ${file.name}:`, err)
          errorCount++
        }
      }

      // Ensure progress is set to 100% when all files are processed
      if (successCount + errorCount === totalFiles) {
        setOverallProgress(100)
      }

      // Show final status message
      if (successCount > 0) {
        if (errorCount === 0) {
          setSuccess(`成功上傳 ${successCount} 張照片`)
        } else {
          setSuccess(`成功上傳 ${successCount} 張照片，${errorCount} 張上傳失敗`)
        }

        // Refresh uploads after successful upload
        await refreshUploads()

        // Auto-dismiss success message after 3 seconds - KEEP THIS AT 3 SECONDS
        setTimeout(() => {
          setSuccess(null)
        }, 3000)

        // Automatically reset the upload strip after 1 second - SEPARATE TIMER
        setTimeout(() => {
          resetUpload()
          setUploadSheetOpen(false) // Close the upload sheet after successful upload
        }, 1000)
      } else if (errorCount > 0) {
        setError(`上傳失敗: ${errorCount} 張照片無法上傳`)

        // Auto-dismiss error message after 5 seconds
        setTimeout(() => {
          setError(null)
        }, 5000)
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError(`上傳失敗: ${err instanceof Error ? err.message : "未知錯誤"}`)
    } finally {
      setIsUploading(false)
    }
  }

  // Add a function to handle sort option change
  // Update to call the API directly instead of sorting client-side
  const handleSortOptionChange = (option: SortOption) => {
    console.log(`Changing sort option to: ${option}`)
    setSortOption(option)
    // The API call will be triggered by the useEffect that depends on sortOption
  }

  return (
    <main className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="p-4 pb-2">
          {/* Three-column layout with title, date, and view toggle */}
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              <h1 className="text-xl font-bold">魯班到</h1>
            </div>

            {/* Right: Today button and View toggle */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={goToToday} className="h-8 w-8 p-0" title="今天">
                <CalendarDays className="h-4 w-4" />
              </Button>
              <Toggle
                pressed={viewMode === "month"}
                onPressedChange={() => toggleViewMode()}
                aria-label="Toggle view mode"
                className="h-8 w-8 p-0"
              >
                {viewMode === "week" ? <Grid2X2 className="h-4 w-4" /> : <Rows className="h-4 w-4" />}
              </Toggle>
            </div>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="px-4 pb-2 pt-0">
          {viewMode === "week" ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={goToPreviousWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-xs font-medium flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>
                    {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日 (星期
                    {["日", "一", "二", "三", "四", "五", "六"][selectedDate.getDay()]})
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={goToNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Week view calendar */}
              <div className="grid grid-cols-7 gap-1 scale-90 origin-top">
                {weekDays.map((day, index) => {
                  const hasPhotos = hasPhotosOnDate(day)
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex flex-col items-center justify-center py-1 rounded-md cursor-pointer",
                        isToday(day) ? "bg-primary/10 font-bold" : "hover:bg-gray-100",
                        selectedDate.getDate() === day.getDate() && selectedDate.getMonth() === day.getMonth()
                          ? "ring-1 ring-primary"
                          : "",
                      )}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="text-[10px] text-muted-foreground">{getDayName(day)}</div>
                      <div className="text-sm">{formatDate(day)}</div>
                      <div
                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${hasPhotos ? "bg-green-500" : "bg-gray-200"}`}
                      ></div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-xs font-medium flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>
                    {getMonthName(selectedDate.getMonth())} {selectedDate.getFullYear()}
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Month view calendar */}
              <div className="mb-2">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {["一", "二", "三", "四", "五", "六", "日"].map((day, index) => (
                    <div key={index} className="text-[10px] text-muted-foreground text-center">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                {monthDays.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-1 mb-1">
                    {week.map((day, dayIndex) => {
                      const hasPhotos = hasPhotosOnDate(day)
                      const isSelected =
                        selectedDate.getDate() === day.getDate() &&
                        selectedDate.getMonth() === day.getMonth() &&
                        selectedDate.getFullYear() === day.getFullYear()

                      return (
                        <div
                          key={dayIndex}
                          className={cn(
                            "flex flex-col items-center justify-center h-8 rounded-md cursor-pointer",
                            isToday(day) ? "bg-primary/10 font-bold" : "hover:bg-gray-100",
                            !isCurrentMonth(day) ? "opacity-40" : "",
                            isSelected ? "ring-1 ring-primary" : "",
                          )}
                          onClick={() => setSelectedDate(day)}
                        >
                          <div className="text-xs">{formatDate(day)}</div>
                          {hasPhotos && <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-0.5"></div>}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sort toggle in its own sticky row - moved inside the header to eliminate gap */}
        <div className="bg-white border-b shadow-sm">
          <div className="flex justify-center py-2 px-4">
            <div className="bg-gray-100 rounded-full p-0.5 flex text-xs">
              <button
                className={`px-3 py-1 rounded-full transition-colors ${
                  sortOption === "upload" ? "bg-white shadow-sm" : "text-gray-600"
                }`}
                onClick={() => handleSortOptionChange("upload")}
              >
                上傳時間
              </button>
              <button
                className={`px-3 py-1 rounded-full transition-colors ${
                  sortOption === "content" ? "bg-white shadow-sm" : "text-gray-600"
                }`}
                onClick={() => handleSortOptionChange("content")}
              >
                內容時間
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 pt-2 pb-28">
        {/* Status messages */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Floating success message */}
        {success && (
          <div className="fixed top-20 left-0 right-0 z-50 flex justify-center px-4 animate-in fade-in slide-in-from-top duration-300">
            <div className="bg-green-50 text-green-800 border border-green-200 rounded-lg shadow-lg px-4 py-3 flex items-center max-w-md">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Main content area for displaying photos */}

        {loadingUploads ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">載入照片中...</span>
          </div>
        ) : uploads.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {/* Update the image card to include classification overlay and make time overlay smaller */}
            {uploads.map((upload, index) => (
              <Card key={upload.id} className="overflow-hidden">
                <CardContent className="p-0 relative">
                  <div className="w-full aspect-square cursor-pointer" onClick={() => openPhotoViewer(index)}>
                    <img
                      src={`${IMAGE_BASE_URL}${upload.file_path}`}
                      alt={upload.file_name_ori}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback if image fails to load
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=300&width=300"
                      }}
                    />
                  </div>
                  {/* Time overlay - smaller and more transparent */}
                  <div className="absolute bottom-0 right-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-tl-md">
                    {upload.time}
                  </div>

                  {/* Classification overlay */}
                  <div className="absolute bottom-0 left-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-tr-md flex items-center">
                    {(() => {
                      const { status, fileClassIcon: FileClassIcon, label } = getClassificationInfo(upload)
                      const StatusIcon = status.icon
                      return (
                        <>
                          <StatusIcon className={`h-3 w-3 mr-1 ${status.color}`} />
                          <FileClassIcon className="h-3 w-3 mr-1 text-white" />
                          <span>{label}</span>
                        </>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center p-8 border rounded-md bg-gray-50">
            該日期暫無照片記錄
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="*" multiple className="hidden" />

      {/* Floating action button for upload */}
      <Button
        onClick={() => setUploadSheetOpen(true)}
        className="fixed bottom-20 right-4 z-40 rounded-full h-14 w-14 shadow-lg"
        size="icon"
      >
        <Camera className="h-6 w-6" />
      </Button>

      {/* Upload Sheet (replacing the fixed bottom strip) */}
      <Sheet open={uploadSheetOpen} onOpenChange={setUploadSheetOpen}>
        <SheetContent side="bottom" className="px-0 py-0">
          <SheetHeader className="px-4 pt-4 pb-2 text-left border-b">
            <SheetTitle className="text-base flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              上傳照片
              {selectedFiles.length > 0 && (
                <Badge variant="outline" className="text-xs ml-2">
                  {selectedFiles.length} 張
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="p-4">
            {/* Upload progress bar */}
            {isUploading && (
              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-in-out"
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
            )}

            {/* Photo preview area */}
            <div className="min-h-[5rem]">
              {previewUrls.length > 0 ? (
                <ScrollArea className="w-full" orientation="horizontal">
                  <div className="flex space-x-2 pb-1">
                    {previewUrls.map((preview) => {
                      const file = selectedFiles.find((f) => f.id === preview.id)
                      return (
                        <div key={preview.id} className="relative flex-shrink-0">
                          <div className="h-20 w-20 rounded-md overflow-hidden bg-black">
                            <img
                              src={preview.url || "/placeholder.svg"}
                              alt={`Preview ${preview.id}`}
                              className="h-full w-full object-cover"
                            />

                            {/* Show progress overlay for uploading files */}
                            {file && file.status === "uploading" && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-white text-xs font-medium">{file.progress}%</span>
                              </div>
                            )}

                            {/* Show success indicator */}
                            {file && file.status === "success" && (
                              <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-white" />
                              </div>
                            )}

                            {/* Show error indicator */}
                            {file && file.status === "error" && (
                              <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                                <AlertCircle className="h-6 w-6 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Only show remove button for pending files or files with errors */}
                          {(!file || file.status === "pending" || file.status === "error") && (
                            <button
                              className="absolute -top-1 -right-1 bg-black/70 rounded-full p-0.5"
                              onClick={() => removeFile(preview.id)}
                              disabled={isUploading}
                            >
                              <X className="h-3 w-3 text-white" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="w-full text-center text-sm text-muted-foreground py-8">
                  尚未選擇照片，點擊下方按鈕選擇
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-4">
              {selectedFiles.length > 0 && (
                <Button variant="outline" className="flex-1" onClick={resetUpload} disabled={isUploading}>
                  <X className="h-4 w-4 mr-1" />
                  清除
                </Button>
              )}

              {selectedFiles.length > 0 ? (
                <Button className="flex-1" onClick={uploadPhotos} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                      上傳中 {overallProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" />
                      上傳照片
                    </>
                  )}
                </Button>
              ) : (
                <Button className="flex-1" onClick={triggerFileInput}>
                  <Plus className="h-4 w-4 mr-1" />
                  選擇照片
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Photo Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={closePhotoViewer}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-black/90">
          <div className="relative h-[80vh] flex flex-col">
            {/* Navigation buttons */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-10">
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-black/50 text-white hover:bg-black/70">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-black/50 text-white hover:bg-black/70"
                  onClick={() => window.open(`${IMAGE_BASE_URL}${uploads[currentPhotoIndex]?.file_path}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Main image with filename above */}
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              {uploads[currentPhotoIndex] && (
                <>
                  <div className="text-white text-sm mb-2 text-center max-w-full px-4 truncate">
                    {uploads[currentPhotoIndex].file_name_ori}
                  </div>
                  <img
                    src={`${IMAGE_BASE_URL}${uploads[currentPhotoIndex].file_path}`}
                    alt={uploads[currentPhotoIndex].file_name_ori}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=600&width=600"
                    }}
                  />
                </>
              )}
            </div>

            {/* Left/Right navigation buttons */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
              onClick={goToPreviousPhoto}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
              onClick={goToNextPhoto}
            >
              <ArrowRight className="h-6 w-6" />
            </Button>

            {/* Photo info footer */}
            {uploads[currentPhotoIndex] && (
              <div className="bg-black/70 p-4 text-white">
                <div className="flex justify-between items-center">
                  {/* Classification info - now on the left */}
                  <div className="flex items-center">
                    {(() => {
                      const {
                        status,
                        fileClassIcon: FileClassIcon,
                        label,
                      } = getClassificationInfo(uploads[currentPhotoIndex])
                      const StatusIcon = status.icon
                      return (
                        <>
                          <StatusIcon className={`h-4 w-4 mr-1 ${status.color}`} />
                          <FileClassIcon className="h-4 w-4 mr-1 text-white" />
                          <span className="text-sm">{label}</span>
                        </>
                      )
                    })()}
                  </div>

                  {/* Date and time - now on the right */}
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      {uploads[currentPhotoIndex].date} {uploads[currentPhotoIndex].time}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </main>
  )
}

