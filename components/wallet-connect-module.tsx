"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import { useConnect } from "wagmi"

interface WalletConnectModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const { connect, isConnecting, setShouldRedirectToDashboard } = useWallet()
  const { connectors } = useConnect()
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null)

  const handleConnect = async (connectorId: string) => {
    setSelectedConnector(connectorId)
    try {
      await connect(connectorId)
      setShouldRedirectToDashboard(true)
      onClose()
    } catch (error) {
      console.error("Connection failed:", error)
    } finally {
      setSelectedConnector(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black/95 border border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-[#E23E6B]" />
            <span>Connect Wallet</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {connectors.map((connector) => (
            <motion.div key={connector.uid} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => handleConnect(connector.id)}
                disabled={isConnecting}
                className="w-full justify-start space-x-3 h-12 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-[#E23E6B] to-[#8c2744] rounded-full flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <span className="flex-1 text-left">
                  {selectedConnector === connector.id && isConnecting ? "Connecting..." : `Connect ${connector.name}`}
                </span>
                {selectedConnector === connector.id && isConnecting && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                )}
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="text-center text-sm text-gray-400 mt-4">
          By connecting a wallet, you agree to our Terms of Service
        </div>
      </DialogContent>
    </Dialog>
  )
}