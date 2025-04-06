"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { useBrand } from "./brand-context"

export function BrandSelector() {
  const { currentBrand, availableBrands, switchBrand } = useBrand()

  // If there's only one brand, don't show the selector
  if (availableBrands.length <= 1) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          {currentBrand.displayName}
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableBrands.map((brand) => (
          <DropdownMenuItem
            key={brand.id}
            onClick={() => switchBrand(brand.id)}
            className={currentBrand.id === brand.id ? "bg-muted" : ""}
          >
            {brand.displayName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

 