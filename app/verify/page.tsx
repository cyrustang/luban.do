"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function VerifyPage() {
  const [code, setCode] = useState(["", "", "", ""])
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null)
  const [countryCode, setCountryCode] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [serverOtp, setServerOtp] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(60)
  const router = useRouter()

  // Create refs for each input field
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  useEffect(() => {
    // Get phone information and verification data from session storage
    const storedPhoneNumber = sessionStorage.getItem("phoneNumber")
    const storedCountryCode = sessionStorage.getItem("countryCode")
    const storedUserId = sessionStorage.getItem("userId")
    const storedServerOtp = sessionStorage.getItem("serverOtp")

    if (!storedPhoneNumber || !storedCountryCode || !storedUserId || !storedServerOtp) {
      router.replace("/login")
      return
    }

    setPhoneNumber(storedPhoneNumber)
    setCountryCode(storedCountryCode)
    setUserId(storedUserId)
    setServerOtp(storedServerOtp)

    // Focus the first input field
    if (inputRefs[0].current) {
      inputRefs[0].current.focus()
    }

    // Set up countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  // Handle input change and auto-advance
  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) {
      // If pasting multiple digits, distribute them across the inputs
      const digits = value.split("").slice(0, 4)

      const newCode = [...code]
      digits.forEach((digit, i) => {
        if (index + i < 4) {
          newCode[index + i] = digit
        }
      })

      setCode(newCode)

      // Focus the appropriate field
      const focusIndex = Math.min(index + digits.length, 3)
      inputRefs[focusIndex].current?.focus()
    } else {
      // Single digit input
      const newCode = [...code]
      newCode[index] = value
      setCode(newCode)

      // Auto-advance to next field if current field is filled
      if (value !== "" && index < 3) {
        inputRefs[index + 1].current?.focus()
      }
    }
  }

  // Handle backspace key
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && code[index] === "" && index > 0) {
      // Move to previous input when pressing backspace on an empty field
      inputRefs[index - 1].current?.focus()
    }
  }

  // Update the handleSubmit function to store user data from the response
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true) // Set loading state at the beginning

    // Combine code digits and validate
    const verificationCode = code.join("")

    if (verificationCode.length !== 4) {
      setError("請輸入完整的4位驗證碼")
      setIsLoading(false) // Make sure to reset loading state if validation fails
      return
    }

    try {
      // Check if the entered OTP matches the one from the server
      if (verificationCode !== serverOtp) {
        throw new Error("驗證碼不正確")
      }

      // Make a POST request to the signin webhook
      const response = await fetch("https://api.bricks.academy/api:luban/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: userId,
          otp: verificationCode,
        }),
      })

      // Get the response data
      const responseData = await response.json()

      if (!response.ok) {
        throw new Error("登錄失敗: " + (responseData.message || "未知錯誤"))
      }

      // Extract user data from the response
      const userData = responseData.user && responseData.user.length > 0 ? responseData.user[0] : null

      // Store authentication in localStorage
      const authData = {
        isAuthenticated: true,
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        userId: userId,
        authToken: responseData.authToken,
        authResponse: responseData,
        // Store user data if available
        userData: userData,
        timestamp: Date.now(),
      }

      // Store in localStorage
      localStorage.setItem("auth", JSON.stringify(authData))

      // Set a flag to indicate we just logged in
      sessionStorage.setItem("justLoggedIn", "true")

      console.log("Authentication successful, redirecting to home page", {
        authToken: responseData.authToken,
        userId: userId,
        userData: userData,
      })

      // Clear verification session storage
      sessionStorage.removeItem("phoneNumber")
      sessionStorage.removeItem("countryCode")
      sessionStorage.removeItem("userId")
      sessionStorage.removeItem("serverOtp")

      // Redirect to home page with a delay to ensure localStorage is set
      setTimeout(() => {
        console.log("Redirecting to home page")
        // Force a hard navigation instead of client-side routing
        window.location.href = "/"
      }, 1000) // 1 second delay
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤")
    } finally {
      // Don't set isLoading to false if we're redirecting to home page
      // This keeps the button disabled during the redirect
      if (!localStorage.getItem("auth")) {
        setIsLoading(false)
      }
    }
  }

  const handleResendCode = async () => {
    if (countdown > 0 || !phoneNumber || !countryCode) return

    try {
      setIsLoading(true)

      // Call the webhook with country code and phone number
      const webhookUrl = `https://hook.eu1.make.com/t4vvls9fo176rcms0q311r6gfcgc7jdi?country=${countryCode}&number=${phoneNumber}`

      const response = await fetch(webhookUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("無法重新發送驗證碼")
      }

      // Parse the response to get user ID and OTP
      const responseData = await response.json()

      // Update the user ID and OTP (handle both formats)
      const newUserId = responseData.id || responseData.user_id
      const newOtp = responseData.otp

      if (newUserId && newOtp) {
        setUserId(newUserId.toString())
        setServerOtp(newOtp.toString())

        // Update session storage
        sessionStorage.setItem("userId", newUserId.toString())
        sessionStorage.setItem("serverOtp", newOtp.toString())
      } else {
        throw new Error("伺服器回應無效")
      }

      // Reset countdown
      setCountdown(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 p-4 pt-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">魯班到</CardTitle>
          <CardDescription>
            輸入發送到 +{countryCode} {phoneNumber} 的驗證碼
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="code-0" className="text-sm font-medium text-center block">
                  驗證碼
                </label>
                <div className="flex justify-center gap-2">
                  {code.map((digit, index) => (
                    <Input
                      key={index}
                      id={`code-${index}`}
                      ref={inputRefs[index]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      className="w-14 h-14 text-center text-2xl"
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      required
                    />
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "驗證中..." : "驗證"}
              </Button>

              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/login")}
                  className="text-xs"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  返回登錄
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResendCode}
                  disabled={countdown > 0 || isLoading}
                  className="text-xs"
                >
                  {countdown > 0 ? `${countdown}秒後重發` : "重新發送"}
                </Button>
              </div>
            </div>
          </form>

          {/* Debug Info */}
          <div className="mt-4 p-3 bg-gray-100 rounded-md">
            <h3 className="text-sm font-medium mb-2">調試信息:</h3>
            <div className="text-xs">
              <p>用戶ID: {userId}</p>
              <p>伺服器OTP: {serverOtp}</p>
              <p>輸入的OTP: {code.join("")}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center text-xs text-muted-foreground">
          請輸入我們發送到您手機的4位驗證碼
        </CardFooter>
      </Card>
    </div>
  )
}

 