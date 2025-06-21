"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Wallet, LogOut, Copy, Check } from "lucide-react"
import { ShimmerButton } from "../magicui/shimmer-button"
import { BorderBeam } from "../magicui/border-beam"
import { useWallet } from "@/contexts/wallet-context"
import { WalletConnectModal } from "../wallet-connect-module"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export const WalletDisplay = () => {
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const { isConnected, address, disconnect, isConnecting } = useWallet()

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {isConnected ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-green-900/20 border-green-500/30 text-green-400 hover:bg-green-900/30 transition-all duration-300 relative overflow-hidden"
                > 
                {/* //@ts-ignore */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    className="w-2 h-2 bg-green-400 rounded-full mr-2"
                  />
                  <span className="font-mono text-sm">{formatAddress(address!)}</span>

                  {/* Success pulse effect */}
                  <motion.div
                    className="absolute inset-0 bg-green-400/10 rounded-md"
                    animate={{ opacity: [0, 0.3, 0] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-black/95 border-gray-800 text-white backdrop-blur-sm">
                <DropdownMenuItem onClick={copyAddress} className="hover:bg-gray-800 cursor-pointer">
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-green-400" />
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Address
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={disconnect} className="hover:bg-gray-800 text-red-400 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <ShimmerButton onClick={() => setShowWalletModal(true)} disabled={isConnecting} className="relative">
              <BorderBeam duration={8} colorFrom="#E23E6B" size={40} colorTo="#8c2744" />
              <div className="flex items-center space-x-2">
                {isConnecting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <Wallet className="w-4 h-4" />
                )}
                <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
              </div>
            </ShimmerButton>
          </motion.div>
        )}
      </AnimatePresence>

      <WalletConnectModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </>
  )
} 