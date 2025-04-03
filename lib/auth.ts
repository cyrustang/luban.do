import { cookies } from "next/headers"

export interface User {
  phoneNumber: string
  authenticated: boolean
  exp: number
}

export function getUser(): User | null {
  const cookieStore = cookies()
  const authToken = cookieStore.get("authToken")?.value

  if (!authToken) return null

  try {
    const decoded = JSON.parse(Buffer.from(authToken, "base64").toString())

    // Check if the token is expired
    if (decoded.exp < Date.now()) return null

    return decoded as User
  } catch (error) {
    return null
  }
}

export function logout() {
  const cookieStore = cookies()
  cookieStore.delete("authToken")
}

