"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface Brand {
  id: string
  name: string
  displayName: string
  logo?: string
}

interface BrandContextType {
  currentBrand: Brand
  availableBrands: Brand[]
  switchBrand: (brandId: string) => void
}

const defaultBrands: Brand[] = [
  {
    id: "baitai",
    name: "百泰工程",
    displayName: "百泰工程",
  },
  // Add more brands here as needed
]

const BrandContext = createContext<BrandContextType>({
  currentBrand: defaultBrands[0],
  availableBrands: defaultBrands,
  switchBrand: () => {},
})

export function BrandProvider({ children }: { children: ReactNode }) {
  const [currentBrand, setCurrentBrand] = useState<Brand>(defaultBrands[0])

  const switchBrand = (brandId: string) => {
    const brand = defaultBrands.find((b) => b.id === brandId)
    if (brand) {
      setCurrentBrand(brand)
      // In a real app, you might want to save this preference
      localStorage.setItem("preferredBrand", brandId)
    }
  }

  return (
    <BrandContext.Provider
      value={{
        currentBrand,
        availableBrands: defaultBrands,
        switchBrand,
      }}
    >
      {children}
    </BrandContext.Provider>
  )
}

export const useBrand = () => useContext(BrandContext)

 