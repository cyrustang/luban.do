import { type NextRequest, NextResponse } from "next/server"

// In a real app, you would use a proper SMS service like Twilio
// This is a mock implementation for demonstration purposes
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ message: "Phone number is required" }, { status: 400 })
    }

    // Validate phone number format (basic validation)
    if (phoneNumber.length < 8) {
      return NextResponse.json({ message: "Invalid phone number format" }, { status: 400 })
    }

    // In a real app, you would:
    // 1. Generate a random verification code
    // 2. Store the code in your database with the phone number and expiration time
    // 3. Send the code via SMS using a service like Twilio

    // For demo purposes, we'll just simulate success
    console.log(`[MOCK] Sending verification code to ${phoneNumber}`)

    // Set a cookie to simulate storing the verification code
    // In a real app, you would NOT store the code in a cookie for security reasons
    const mockCode = "123456" // In a real app, generate a random code

    // Create a response
    return NextResponse.json(
      { message: "Verification code sent successfully" },
      {
        status: 200,
        headers: {
          // This is just for demo purposes - in a real app, store this securely in your database
          "Set-Cookie": `verificationData=${JSON.stringify({
            phoneNumber,
            code: mockCode,
            expires: Date.now() + 10 * 60 * 1000, // 10 minutes
          })}; Path=/; HttpOnly; SameSite=Strict; Max-Age=600`,
        },
      },
    )
  } catch (error) {
    console.error("Error sending verification code:", error)
    return NextResponse.json({ message: "Failed to send verification code" }, { status: 500 })
  }
}

