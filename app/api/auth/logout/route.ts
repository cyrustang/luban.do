import { NextResponse } from "next/server"

export async function POST() {
  // Update success message
  return NextResponse.json(
    { message: "成功登出" },
    {
      status: 200,
      headers: {
        // Clear the auth cookie by setting it to expire in the past
        "Set-Cookie": "authToken=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0",
      },
    },
  )
}

