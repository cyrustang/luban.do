import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// In a real app, you would verify against your database
// This is a mock implementation for demonstration purposes
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, code } = await request.json()

    if (!phoneNumber || !code) {
      return NextResponse.json({ message: "Phone number and verification code are required" }, { status: 400 })
    }

    // Get the verification data from the cookie (for demo purposes only)
    // In a real app, you would check against your database
    const cookieStore = cookies()
    const verificationCookie = cookieStore.get("verificationData")

    if (!verificationCookie?.value) {
      return NextResponse.json({ message: "Verification session expired or invalid" }, { status: 400 })
    }

    const verificationData = JSON.parse(verificationCookie.value)

    // Check if the verification data is valid
    if (
      verificationData.phoneNumber !== phoneNumber ||
      verificationData.code !== code ||
      verificationData.expires < Date.now()
    ) {
      return NextResponse.json({ message: "Invalid verification code" }, { status: 400 })
    }

    // In a real app, you would:
    // 1. Mark the verification as complete in your database
    // 2. Create a user session or JWT token

    // For demo purposes, we'll create a simple auth cookie
    const authToken = Buffer.from(
      JSON.stringify({
        phoneNumber,
        authenticated: true,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      }),
    ).toString("base64")

    // Clear the verification cookie
    cookieStore.delete("verificationData")

    // Create a response with the auth cookie
    return NextResponse.json(
      { message: "Verification successful" },
      {
        status: 200,
        headers: {
          "Set-Cookie": `authToken=${authToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`, // 7 days
        },
      },
    )
  } catch (error) {
    console.error("Error verifying code:", error)
    return NextResponse.json({ message: "Failed to verify code" }, { status: 500 })
  }
}

