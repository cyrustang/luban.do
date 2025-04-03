"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Phone } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [countryCode, setCountryCode] = useState("853") // Default to Macau
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [webhookResponse, setWebhookResponse] = useState<any>(null)
  const router = useRouter()

  // Check if already logged in
  useEffect(() => {
    const authData = localStorage.getItem("auth")
    if (authData) {
      try {
        const parsedAuth = JSON.parse(authData)
        if (parsedAuth.isAuthenticated) {
          router.replace("/")
        }
      } catch (err) {
        // Invalid auth data, continue with login
        console.error("Error parsing auth data:", err)
      }
    }
  }, [router])

  // Country codes - reduced by 20% and added Hong Kong (+852)
  const countryCodes = [
    { code: "853", name: "澳門" },
    { code: "852", name: "香港" },
    { code: "86", name: "中國" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setWebhookResponse(null)

    // Basic validation
    if (!phoneNumber || phoneNumber.length < 4) {
      setError("請輸入有效的手機號碼")
      return
    }

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
        throw new Error("無法發送驗證碼")
      }

      // Parse the response to get user ID and OTP
      const responseData = await response.json()

      // Store the webhook response for debugging
      setWebhookResponse(responseData)

      // Store phone information in session storage for the verification page
      sessionStorage.setItem("phoneNumber", phoneNumber)
      sessionStorage.setItem("countryCode", countryCode)

      // Check for id/user_id and otp in the response (handle both formats)
      const userId = responseData.id || responseData.user_id
      const otp = responseData.otp

      if (userId && otp) {
        sessionStorage.setItem("userId", userId.toString())
        sessionStorage.setItem("serverOtp", otp.toString())

        // Redirect to verification page
        router.push("/verify")
      } else {
        // Don't throw an error, just display the response for debugging
        setError("伺服器回應無效 - 請查看下方響應詳情")
      }
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
          <div className="space-y-1">
            <div className="text-3xl font-bold">魯班到</div>
          </div>
          <CardDescription>輸入您的手機號碼以登錄</CardDescription>
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
                <label htmlFor="phone" className="text-sm font-medium">
                  手機號碼
                </label>
                <div className="flex gap-2">
                  <div className="w-1/3">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇國家代碼" />
                      </SelectTrigger>
                      <SelectContent>
                        {countryCodes.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            +{country.code} {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <div className="flex">
                      <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="輸入您的手機號碼"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="rounded-l-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "發送中..." : "發送驗證碼"}
              </Button>
            </div>
          </form>

          {/* Webhook Response Display */}
          {webhookResponse && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <h3 className="text-sm font-medium mb-2">Webhook 響應:</h3>
              <pre className="text-xs overflow-auto max-h-40 bg-gray-200 p-2 rounded">
                {JSON.stringify(webhookResponse, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-center text-xs text-muted-foreground">
          <div>我們將通過短信向您發送驗證碼</div>
          <div className="mt-1">魯班到 v1.0</div>
        </CardFooter>
      </Card>
    </div>
  )
}

