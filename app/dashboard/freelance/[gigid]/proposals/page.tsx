"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Poppins } from "next/font/google"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useReadContract } from "wagmi"

import { useWallet } from "@/contexts/wallet-context"
import { FREELANCE_CONTRACT_ADDRESS, FREELANCE_ABI } from "@/lib/contracts"
import { cn } from "@/lib/utils"

import { AuroraText } from "@/components/magicui/aurora-text"
import { WalletConnectModal } from "@/components/wallet-connect-module"
import { WalletDisplay } from "@/components/ui/wallet-display"
import ProposalsList from "@/components/freelance/proposals-list"
import {
  ArrowLeft,
  Loader,
  AlertCircle,
  Shield,
} from "lucide-react"

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
})

function ProposalsPage() {
  const params = useParams()
  const { address, isConnected } = useWallet()
  const [showWalletModal, setShowWalletModal] = useState(false)

  // Extract and validate params from URL
  const gigIdString = params.gigid as string
  const isParamsValid = typeof gigIdString === "string" && !isNaN(Number.parseInt(gigIdString))
  const gigId = isParamsValid ? Number.parseInt(gigIdString) : 0

  // --- Smart Contract Read Operations ---
  const {
    data: gigDetails,
    isLoading: isLoadingGigDetails,
  } = useReadContract({
    address: FREELANCE_CONTRACT_ADDRESS,
    abi: FREELANCE_ABI,
    functionName: "getGigDetails",
    args: [BigInt(gigId)],
    ...(isParamsValid && isConnected ? {} : { query: { enabled: false } }),
  })

  const {
    data: proposals,
    isLoading: isLoadingProposals,
  } = useReadContract({
    address: FREELANCE_CONTRACT_ADDRESS,
    abi: FREELANCE_ABI,
    functionName: "getAllProposals",
    args: [BigInt(gigId)],
    ...(isParamsValid && isConnected ? {} : { query: { enabled: false } }),
  })

  // --- Loading States ---
  const isLoadingOnChain = isLoadingGigDetails || isLoadingProposals

  // --- Render Conditions ---
  if (!isConnected) {
    return (
      <div className={cn("min-h-screen bg-black text-white py-8 px-4", poppins.className)}>
        <motion.div className="max-w-xl mx-auto bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center mt-24">
          <AlertCircle className="w-12 h-12 text-[#E23E6B] mx-auto mb-4" />
          <h3 className="text-xl font-thin mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400 mb-6">You need to connect your wallet to view proposals.</p>
          <motion.button
            onClick={() => setShowWalletModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl font-medium"
          >
            Connect Wallet
          </motion.button>
        </motion.div>
        <WalletConnectModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
      </div>
    )
  }

  if (isLoadingOnChain) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-[#E23E6B] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading proposals...</p>
        </div>
      </div>
    )
  }

  if (!gigDetails) {
    return (
      <div className={cn("min-h-screen bg-black text-white py-8 px-4", poppins.className)}>
        <div className="max-w-xl mx-auto bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center mt-24">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-thin mb-2">Gig Not Found</h3>
          <p className="text-gray-400 mb-6">Could not find data for this gig. Please check the URL.</p>
          <Link href="/dashboard/freelance">
            <motion.button className="flex items-center mx-auto gap-2 px-6 py-3 bg-white/10 border border-white/20 rounded-2xl font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </motion.button>
          </Link>
        </div>
      </div>
    )
  }

  // Access control
  if (gigDetails.client.toLowerCase() !== address?.toLowerCase()) {
    return (
      <div className={cn("min-h-screen bg-black text-white py-8 px-4", poppins.className)}>
        <div className="max-w-xl mx-auto bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center mt-24">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-thin mb-2">Access Denied</h3>
          <p className="text-gray-400 mb-6">Only the client who posted the gig can view its proposals.</p>
          <Link href={`/dashboard/freelance/${gigIdString}`}>
            <motion.button className="flex items-center mx-auto gap-2 px-6 py-3 bg-white/10 border border-white/20 rounded-2xl font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back to Gig
            </motion.button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-4xl font-thin mb-2">
              <AuroraText colors={["#cc4368", "#e6295c", "#ffffff", "#E23E6B"]}>
                <span className="text-transparent">Proposals</span>
              </AuroraText>
            </h1>
            <p className="text-gray-300/80 font-light">
              For Gig: <span className="text-white font-medium">{gigDetails.title}</span>
            </p>
          </div>
          <div className="flex justify-end items-center gap-4">
            <div className="flex items-center gap-4">
              <WalletDisplay />
              <Link href={`/dashboard/freelance/${gigIdString}`}>
                <motion.button
                  className="flex items-center space-x-2 px-5 py-3 bg-white/10 border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Gig</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Proposals List */}
        <ProposalsList 
          gigId={gigId} 
          proposals={Array.from(proposals || [])} 
          gigDetails={gigDetails} 
        />
      </div>

      <WalletConnectModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </div>
  )
}

export default ProposalsPage
