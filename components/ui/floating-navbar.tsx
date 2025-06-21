"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence, useScroll } from "motion/react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Poppins } from "next/font/google"
import { Sparkles, Wallet, LogOut, Copy, Check } from "lucide-react"
import { ShimmerButton } from "../magicui/shimmer-button"
import { BorderBeam } from "../magicui/border-beam"
import { useWallet } from "@/contexts/wallet-context"
import { WalletConnectModal } from "../wallet-connect-module"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
})

export const FloatingNav = ({
  navItems,
  className,
}: {
  navItems: {
    name: string
    link: string
    icon?: any
  }[]
  className?: string
}) => {
  const { scrollYProgress } = useScroll()
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const { isConnected, address, disconnect, isConnecting } = useWallet()

  React.useEffect(() => {
    setIsVisible(true)
  }, [])

  const getScale = (index: number) => {
    if (hoveredIndex === null) return 1

    if (index === hoveredIndex) {
      return 1.2 // Scale up the hovered item
    }

    return 1 // Keep other items at normal size
  }

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
        <motion.div
          initial={{
            opacity: 0,
            y: -100,
          }}
          animate={{
            y: 0,
            opacity: 1,
          }}
          transition={{
            duration: 0.8,
            type: "spring",
            stiffness: 50,
            damping: 15,
          }}
          className={cn(
            "flex max-w-4xl mx-auto border border-gray-800 dark:border-white/[0.2] rounded-3xl bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#8c2743] via-black to-black shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] anim z-[5000] px-4 py-2 items-center justify-between space-x-2 relative overflow-hidden",
            className,
          )}
        >
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#8c2743] via-black to-black rounded-3xl"
            animate={{
              scale: [1, 1.03, 0.97, 1.02, 1],
              y: [0, -2, 3, -2, 0],
              rotate: [0, 0.5, -0.5, 0.3, 0],
              opacity: [0.7, 0.8, 0.75, 0.8, 0.7],
            }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              times: [0, 0.25, 0.5, 0.75, 1],
            }}
          />

          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-[#E23E6B]" />
            <span className={cn("text-xl font-semibold text-white", poppins.className)}>AllIn1</span>
          </div>

          <div className="flex items-center space-x-6">
            {navItems.map((navItem: any, idx: number) => (
              <motion.a
                key={`link=${idx}`}
                href={navItem.link}
                className={cn(
                  "relative text-gray-400 items-center flex space-x-1 hover:text-white transition-colors",
                  poppins.className,
                )}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                whileHover={{ scale: getScale(idx) }}
                transition={{ duration: 0.2 }}
              >
                <span className="block sm:hidden">{navItem.icon}</span>
                <span className="hidden sm:block text-sm">{navItem.name}</span>
              </motion.a>
            ))}
          </div>

          {/* Wallet Connection Section */}
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
        </motion.div>
      </AnimatePresence>

      <WalletConnectModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </>
  )
}