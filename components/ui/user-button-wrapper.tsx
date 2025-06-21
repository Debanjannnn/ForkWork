"use client"

import { UserButton } from "@civic/auth/react"
import { Button } from "@/components/ui/button"

export const UserButtonWrapper = () => {
  return (
    <Button
      variant="outline"
      size="sm"
      className="bg-blue-900/20 border-blue-500/30 text-blue-400 hover:bg-blue-900/30 transition-all duration-300 h-8 px-3"
    >
      <UserButton />
    </Button>
  )
} 