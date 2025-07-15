"use client"
import { UserButton } from "@civic/auth/react"
import { prisma } from "@/db"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Wallet, LogOut, Copy, Check, User, Shield, CloudCog } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShimmerButton } from "../magicui/shimmer-button"
import { BorderBeam } from "../magicui/border-beam"
import { useWallet } from "@/contexts/wallet-context"
import { WalletConnectModal } from "../wallet-connect-module"
import { useUser } from "@civic/auth/react"
import { useRouter } from "next/navigation"
import axios from "axios"

type AuthStep = "connect-wallet" | "checking-db" | "civic-auth" | "saving-user" | "complete"

export const WalletConnection = () => {
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showAuthFlow, setShowAuthFlow] = useState(false)
  const [copied, setCopied] = useState(false)
  const [currentStep, setCurrentStep] = useState<AuthStep>("connect-wallet")
  const [userExists, setUserExists] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { isConnected, address, disconnect, isConnecting } = useWallet()
  const { user } = useUser()
  const router = useRouter()

  const checkUserInDatabase = async () => {
    if (!address) return

    setCurrentStep("checking-db")
    setIsLoading(true)

    try {
      const userExist = await prisma.user.findUnique({
        where: {
          walletAddress: address,
        },
      })

      if (userExist) {
        setUserExists(true)
        setCurrentStep("complete")
        setTimeout(() => {
          router.push(`/dashboard`)
        }, 1500)
      } else {
        setUserExists(false)
        setCurrentStep("civic-auth")
      }
    } catch (error) {
      console.error("Database operation failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveUserToDatabase = async () => {
    if (!address || !user) return

    setCurrentStep("saving-user")
    setIsLoading(true)

    try {

      const res = await axios.post("/api/save", {
        userId: user.id,
        walletAddress: address,
        userName: user.name,
      })

      console.log(res)

      setUserExists(true)
      setCurrentStep("complete")

      setTimeout(() => {
        setShowAuthFlow(false)
        router.push(`/dashboard`)
      }, 2000)
    } catch (error) {
      console.error("Failed to save user to database:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Check database when wallet connects
  useEffect(() => {
    if (isConnected && address && showAuthFlow) {
      checkUserInDatabase()
    }
  }, [isConnected, address, showAuthFlow])

  // Save user when they authenticate with Civic
  useEffect(() => {
    if (user && address && userExists === false && currentStep === "civic-auth") {
      saveUserToDatabase()
    }
  }, [user, address, userExists, currentStep])

  // Show auth flow when wallet connects for the first time
  useEffect(() => {
    if (isConnected && address && !showAuthFlow) {
      setShowAuthFlow(true)
      setCurrentStep("checking-db")
    }
  }, [isConnected, address])

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

  const handleDisconnect = () => {
    disconnect()
    setShowAuthFlow(false)
    setUserExists(null)
    setCurrentStep("connect-wallet")
  }

  const getStepContent = () => {
    switch (currentStep) {
      case "checking-db":
        return {
          title: "Checking Account",
          description: "Verifying your wallet in our database...",
          icon: (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
            />
          ),
        }
      case "civic-auth":
        return {
          title: "Identity Verification Required",
          description: "Please complete identity verification to continue",
          icon: <Shield className="w-6 h-6 text-yellow-500" />,
        }
      case "saving-user":
        return {
          title: "Creating Account",
          description: "Saving your verified identity...",
          icon: (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full"
            />
          ),
        }
      case "complete":
        return {
          title: "Welcome!",
          description: "Account setup complete. Redirecting to dashboard...",
          icon: <Check className="w-6 h-6 text-green-500" />,
        }
      default:
        return null
    }
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {isConnected && userExists === true && !showAuthFlow ? (
          // Wallet connected and user exists - show wallet dropdown
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
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    className="w-2 h-2 bg-green-400 rounded-full mr-2"
                  />
                  <span className="font-mono text-sm">{formatAddress(address!)}</span>
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
                <DropdownMenuItem onClick={handleDisconnect} className="hover:bg-gray-800 text-red-400 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        ) : (
          // Show connect wallet button
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

      {/* Auth Flow Modal */}
      <AnimatePresence>
        {showAuthFlow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="w-full max-w-md bg-gray-900/95 border-gray-700 text-white">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">{getStepContent()?.icon}</div>
                  <CardTitle className="text-xl">{getStepContent()?.title}</CardTitle>
                  <CardDescription className="text-gray-400">{getStepContent()?.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Steps */}
                  <div className="flex justify-between items-center mb-6">
                    {["checking-db", "civic-auth", "saving-user", "complete"].map((step, index) => (
                      <div key={step} className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                            currentStep === step
                              ? "bg-blue-500 text-white"
                              : ["checking-db", "civic-auth", "saving-user", "complete"].indexOf(currentStep) > index
                                ? "bg-green-500 text-white"
                                : "bg-gray-600 text-gray-400"
                          }`}
                        >
                          {["checking-db", "civic-auth", "saving-user", "complete"].indexOf(currentStep) > index ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        {index < 3 && (
                          <div
                            className={`w-8 h-0.5 mx-2 transition-colors ${
                              ["checking-db", "civic-auth", "saving-user", "complete"].indexOf(currentStep) > index
                                ? "bg-green-500"
                                : "bg-gray-600"
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Wallet Info */}
                  {address && (
                    <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Connected Wallet:</span>
                        <span className="font-mono text-sm text-green-400">{formatAddress(address)}</span>
                      </div>
                    </div>
                  )}

                  {/* Civic Auth Section */}
                  {currentStep === "civic-auth" && (
                    <div className="text-center space-y-4">
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                        <User className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-sm text-yellow-200 mb-3">
                          Complete identity verification to secure your account
                        </p>
                        <UserButton />
                      </div>
                    </div>
                  )}

                  {/* Loading States */}
                  {(currentStep === "checking-db" || currentStep === "saving-user") && (
                    <div className="text-center py-4">
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                        className="text-sm text-gray-400"
                      >
                        Please wait...
                      </motion.div>
                    </div>
                  )}

                  {/* Success State */}
                  {currentStep === "complete" && (
                    <div className="text-center py-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3"
                      >
                        <Check className="w-8 h-8 text-green-500" />
                      </motion.div>
                      <p className="text-green-400 font-medium">Account setup complete!</p>
                    </div>
                  )}

                  {/* Cancel Button */}
                  {currentStep !== "complete" && currentStep !== "saving-user" && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAuthFlow(false)
                        handleDisconnect()
                      }}
                      className="w-full mt-4 border-gray-600 text-gray-400 hover:bg-gray-800"
                    >
                      Cancel
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <WalletConnectModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </>
  )
}
