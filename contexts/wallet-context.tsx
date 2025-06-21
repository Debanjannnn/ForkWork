"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { motion, AnimatePresence } from "motion/react"
import { useRouter } from "next/navigation"

interface WalletContextType {
  isConnected: boolean
  address: string | undefined
  isConnecting: boolean
  connect: (connectorId: string) => void
  disconnect: () => void
  showConnectionAnimation: boolean
  setShowConnectionAnimation: (show: boolean) => void
  shouldRedirectToDashboard: boolean
  setShouldRedirectToDashboard: (should: boolean) => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount()
  const { connect: wagmiConnect, connectors, isPending } = useConnect()
  const { disconnect: wagmiDisconnect } = useDisconnect()
  const router = useRouter()
  const [showConnectionAnimation, setShowConnectionAnimation] = useState(false)
  const [hasShownAnimation, setHasShownAnimation] = useState(false)
  const [shouldRedirectToDashboard, setShouldRedirectToDashboard] = useState(false)

  useEffect(() => {
    // Only show animation when wallet connects for the first time in this session
    if (isConnected && !hasShownAnimation) {
      setShowConnectionAnimation(true)
      setHasShownAnimation(true)
      // Hide animation after 3 seconds
      const timer = setTimeout(() => {
        setShowConnectionAnimation(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isConnected, hasShownAnimation])

  // Reset animation state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setShowConnectionAnimation(false)
    }
  }, [isConnected])

  // Handle redirect to dashboard when wallet connects
  useEffect(() => {
    if (isConnected && address && shouldRedirectToDashboard) {
      // Check if we're not already on a dashboard page
      const currentPath = window.location.pathname
      if (!currentPath.startsWith('/dashboard')) {
        router.push('/dashboard')
      }
      setShouldRedirectToDashboard(false)
    }
  }, [isConnected, address, shouldRedirectToDashboard, router])

  const connect = (connectorId: string) => {
    const connector = connectors.find((c: any) => c.id === connectorId)
    if (connector) {
      wagmiConnect({ connector })
      // Set redirect flag when connecting
      setShouldRedirectToDashboard(true)
    }
  }

  const disconnect = () => {
    wagmiDisconnect()
    setShowConnectionAnimation(false)
    setShouldRedirectToDashboard(false)
  }

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        isConnecting: isPending,
        connect,
        disconnect,
        showConnectionAnimation,
        setShowConnectionAnimation,
        shouldRedirectToDashboard,
        setShouldRedirectToDashboard,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
