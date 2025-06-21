"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Poppins } from "next/font/google"
import Link from "next/link"
import { useReadContract } from "wagmi"
import { formatUnits } from "viem"

import { cn } from "@/lib/utils"
import { FREELANCE_CONTRACT_ADDRESS, FREELANCE_ABI } from "@/lib/contracts"
import { getFromPinata } from "@/lib/pinata"
import { useWallet } from "@/contexts/wallet-context"

import { AuroraText } from "@/components/magicui/aurora-text"
import { WalletConnectModal } from "@/components/wallet-connect-module"
import { ArrowLeft, Briefcase, DollarSign, Clock, User, Users, AlertCircle, Eye, ChevronRight } from "lucide-react"

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
})

interface GigMetadata {
  title: string
  description: string
  requirements: string[]
  deliverables: string[]
  skills: string[]
}

interface MyGigCardProps {
  gigId: number
  index: number
  type: "client" | "freelancer"
}

function MyGigCard({ gigId, index, type }: MyGigCardProps) {
  const [metadata, setMetadata] = useState<GigMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const { data: gigDetails } = useReadContract({
    address: FREELANCE_CONTRACT_ADDRESS,
    abi: FREELANCE_ABI,
    functionName: "getGigDetails",
    args: [BigInt(gigId)],
  })

  const { data: proposals } = useReadContract({
    address: FREELANCE_CONTRACT_ADDRESS,
    abi: FREELANCE_ABI,
    functionName: "getAllProposals",
    args: [BigInt(gigId)],
  })

  useEffect(() => {
    const fetchMetadata = async () => {
      if (gigDetails && gigDetails.detailsUri) {
        try {
          const data = await getFromPinata(gigDetails.detailsUri)
          setMetadata(data as GigMetadata)
        } catch (error) {
          console.error("Failed to fetch metadata:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchMetadata()
  }, [gigDetails])

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }

  const getDaysLeft = (timestamp: bigint) => {
    const now = new Date()
    const deadline = new Date(Number(timestamp) * 1000)
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getGigStatus = (gig: any) => {
    if (gig.isCompleted) return { label: "Completed", color: "text-green-400 bg-green-400/10 border-green-400/20" }
    if (gig.selectedFreelancer !== "0x0000000000000000000000000000000000000000") {
      if (gig.isApproved) return { label: "In Progress", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" }
      return { label: "Assigned", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" }
    }
    if (Date.now() > Number(gig.proposalDeadline) * 1000) {
      return { label: "Proposal Closed", color: "text-red-400 bg-red-400/10 border-red-400/20" }
    }
    return { label: "Open", color: "text-green-400 bg-green-400/10 border-green-400/20" }
  }

  if (!gigDetails) return null

  const status = getGigStatus(gigDetails)
  const daysLeft = getDaysLeft(gigDetails.deadline)
  const proposalCount = proposals?.length || 0

  return (
    <motion.div
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 group overflow-hidden relative hover:border-white/20 transition-all duration-500"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.5 }}
      whileHover={{ y: -8, scale: 1.02 }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-[#E23E6B]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors duration-300">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-sm font-medium text-white/90">
                {type === "client" ? "Posted Gig" : "Applied Gig"}
              </span>
              <div className="text-xs text-gray-400 mt-0.5">#{gigId}</div>
            </div>
          </div>
          <div className={`text-xs font-medium px-3 py-1.5 rounded-full border ${status.color}`}>{status.label}</div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-xl mb-3 line-clamp-2 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#E23E6B] transition-all duration-300">
          {metadata?.title || gigDetails.title}
        </h3>

        {/* Description */}
        <p className="text-gray-300 text-sm mb-6 line-clamp-3 leading-relaxed">{gigDetails.description}</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 group-hover:border-white/20 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Budget</span>
            </div>
            <div className="text-white font-semibold text-lg">{formatUnits(gigDetails.usdtAmount, 6)} USDT</div>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 group-hover:border-white/20 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Deadline</span>
            </div>
            <div className="text-white font-semibold text-sm">{formatDate(gigDetails.deadline)}</div>
            <div
              className={`text-xs mt-1 ${daysLeft > 7 ? "text-green-400" : daysLeft > 3 ? "text-yellow-400" : "text-red-400"}`}
            >
              {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        {type === "client" && (
          <div className="flex items-center gap-2 mb-6 p-3 bg-white/5 rounded-2xl border border-white/10">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-white">{proposalCount} Proposals</span>
          </div>
        )}

        {/* Action Button */}
        <Link href={`/dashboard/freelance/${gigId}`}>
          <motion.button
            className="w-full py-4 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-lg hover:shadow-xl group/btn relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{type === "client" ? "Manage Gig" : "View Gig"}</span>
              <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
            </div>
          </motion.button>
        </Link>
      </div>
    </motion.div>
  )
}

function MyGigsPage() {
  const { address, isConnected } = useWallet()
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [activeTab, setActiveTab] = useState<"posted" | "applied">("posted")

  const { data: clientGigs } = useReadContract({
    address: FREELANCE_CONTRACT_ADDRESS,
    abi: FREELANCE_ABI,
    functionName: "getClientGigs",
    args: [address || "0x0000000000000000000000000000000000000000"],
  })

  const { data: freelancerGigs } = useReadContract({
    address: FREELANCE_CONTRACT_ADDRESS,
    abi: FREELANCE_ABI,
    functionName: "getFreelancerGigs",
    args: [address || "0x0000000000000000000000000000000000000000"],
  })

  if (!isConnected) {
    return (
      <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
        <motion.div
          className="max-w-xl mx-auto bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center mt-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="w-12 h-12 text-[#E23E6B] mx-auto mb-4" />
          <h3 className="text-xl font-thin mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400 mb-6">You need to connect your wallet to view your gigs.</p>
          <motion.button
            onClick={() => setShowWalletModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Connect Wallet
          </motion.button>
        </motion.div>
        <WalletConnectModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
      </div>
    )
  }

  const postedGigs = clientGigs || []
  const appliedGigs = freelancerGigs || []

  return (
    <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-4xl font-thin mb-2">
              <AuroraText colors={["#cc4368", "#e6295c", "#ffffff", "#E23E6B"]}>
                <span className="text-transparent">My Gigs</span>
              </AuroraText>
            </h1>
            <p className="text-gray-300/80 font-light">Manage your posted gigs and track your applications</p>
          </div>
          <Link href="/dashboard/freelance">
            <motion.button
              className="flex items-center space-x-2 px-5 py-3 bg-white/10 border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Freelance</span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="flex space-x-1 bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-1 mb-8 w-fit"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={() => setActiveTab("posted")}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeTab === "posted"
                ? "bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Posted Gigs ({postedGigs.length})
          </button>
          <button
            onClick={() => setActiveTab("applied")}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeTab === "applied"
                ? "bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Applied Gigs ({appliedGigs.length})
          </button>
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "posted" ? (
            postedGigs.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {postedGigs.map((gigId, index) => (
                  <MyGigCard key={Number(gigId)} gigId={Number(gigId)} index={index} type="client" />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-thin mb-2">No Posted Gigs</h3>
                <p className="text-gray-400 mb-6">You haven't posted any gigs yet. Start by creating your first gig!</p>
                <Link href="/dashboard/freelance/post">
                  <motion.button
                    className="px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Post Your First Gig
                  </motion.button>
                </Link>
              </div>
            )
          ) : appliedGigs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {appliedGigs.map((gigId, index) => (
                <MyGigCard key={Number(gigId)} gigId={Number(gigId)} index={index} type="freelancer" />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-thin mb-2">No Applied Gigs</h3>
              <p className="text-gray-400 mb-6">
                You haven't applied to any gigs yet. Browse available gigs and submit your proposals!
              </p>
              <Link href="/dashboard/freelance">
                <motion.button
                  className="px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Browse Gigs
                </motion.button>
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      <WalletConnectModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </div>
  )
}

export default MyGigsPage
