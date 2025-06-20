"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAccount, useConnect, useDisconnect } from "wagmi"


interface WalletContextType {
  isConnected: boolean
  address: string | undefined
  isConnecting: boolean
  connect: (connectorId: string) => void
  disconnect: () => void
  showConnectionAnimation: boolean
  setShowConnectionAnimation: (show: boolean) => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount()
  const { connect: wagmiConnect, connectors, isPending } = useConnect()
  const { disconnect: wagmiDisconnect } = useDisconnect()
  const [showConnectionAnimation, setShowConnectionAnimation] = useState(false)
  const [wasConnected, setWasConnected] = useState(false)

  useEffect(() => {
    if (isConnected && !wasConnected) {
      setShowConnectionAnimation(true)
      setWasConnected(true)
      // Hide animation after 3 seconds
      const timer = setTimeout(() => {
        setShowConnectionAnimation(false)
      }, 3000)
      return () => clearTimeout(timer)
    } else if (!isConnected) {
      setWasConnected(false)
      setShowConnectionAnimation(false)
    }
  }, [isConnected, wasConnected])

  const connect = (connectorId: string) => {
    const connector = connectors.find((c) => c.id === connectorId)
    if (connector) {
      wagmiConnect({ connector })
    }
  }

  const disconnect = () => {
    wagmiDisconnect()
    setShowConnectionAnimation(false)
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
      }}
    >
      {children}
      <WalletConnectionAnimation />
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

function WalletConnectionAnimation() {
  const { showConnectionAnimation } = useWallet()

  return (
    <AnimatePresence>
      {showConnectionAnimation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed top-20 right-4 z-[9999] bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl border border-green-400/30"
        >
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
            />
            <div>
              <div className="font-semibold">Wallet Connected!</div>
              <div className="text-sm opacity-90">Ready to interact with dApps</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
