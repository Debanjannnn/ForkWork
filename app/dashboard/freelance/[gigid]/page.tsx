"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Poppins } from "next/font/google"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useReadContract } from "wagmi"
import { formatUnits, formatEther } from "viem"

import { cn } from "@/lib/utils"
import { FREELANCE_CONTRACT_ADDRESS, FREELANCE_ABI } from "@/lib/contracts"
import { getFromPinata } from "@/lib/pinata"
import { useWallet } from "@/contexts/wallet-context"

import { AuroraText } from "@/components/magicui/aurora-text"
import { WalletConnectModal } from "@/components/wallet-connect-module"
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Clock,
  User,
  Users,
  CheckCircle,
  AlertCircle,
  FileText,
  Calendar,
  Target,
  Loader,
  Send,
} from "lucide-react"

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

function GigDetailPage() {
  const params = useParams()
  const { address, isConnected } = useWallet()
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [metadata, setMetadata] = useState<GigMetadata | null>(null)
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true)

  const gigIdString = params.gigId as string
  const isIdValid = typeof gigIdString === "string" && !isNaN(Number.parseInt(gigIdString))
  const gigId = isIdValid ? BigInt(Number.parseInt(gigIdString)) : 0n

  const { data: gigDetails, isLoading: isLoadingGigDetails } = useReadContract({
    address: FREELANCE_CONTRACT_ADDRESS,
    abi: FREELANCE_ABI,
    functionName: "getGigDetails",
    args: [gigId],
    enabled: isIdValid,
  })

  const { data: proposals } = useReadContract({
    address: FREELANCE_CONTRACT_ADDRESS,
    abi: FREELANCE_ABI,
    functionName: "getAllProposals",
    args: [gigId],
    enabled: isIdValid,
  })

  const { data: canUserPropose } = useReadContract({
    address: FREELANCE_CONTRACT_ADDRESS,
    abi: FREELANCE_ABI,
    functionName: "canUserPropose",
    args: [gigId, address || "0x0000000000000000000000000000000000000000"],
    enabled: isIdValid && isConnected,
  })

  useEffect(() => {
    const fetchMetadata = async () => {
      if (gigDetails?.detailsUri) {
        setIsLoadingMetadata(true)
        try {
          const data = await getFromPinata(gigDetails.detailsUri)
          setMetadata(data as GigMetadata)
        } catch (error) {
          console.error("Failed to fetch metadata:", error)
        } finally {
          setIsLoadingMetadata(false)
        }
      } else if (gigDetails) {
        setIsLoadingMetadata(false)
      }
    }
    fetchMetadata()
  }, [gigDetails])

  const formatDate = (timestamp: bigint) => {
    if (!timestamp) return "N/A"
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }

  const getDaysLeft = (timestamp: bigint) => {
    if (!timestamp) return 0
    const now = new Date()
    const deadline = new Date(Number(timestamp) * 1000)
    const diffTime = deadline.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
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

  if (isLoadingGigDetails) {
    return (
      <div className={cn("min-h-screen bg-black text-white flex items-center justify-center", poppins.className)}>
        <div className="text-center">
          <Loader className="w-16 h-16 text-[#E23E6B] mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-thin">Loading Gig Details...</h3>
        </div>
      </div>
    )
  }

  if (!gigDetails) {
    return (
      <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-thin mb-2">Gig Not Found</h3>
            <p className="text-gray-400 mb-6">The gig you're looking for doesn't exist or is invalid.</p>
            <Link href="/dashboard/freelance">
              <motion.button
                className="px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Back to Freelance
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const status = getGigStatus(gigDetails)
  const daysLeft = getDaysLeft(gigDetails.deadline)
  const proposalDaysLeft = getDaysLeft(gigDetails.proposalDeadline)
  const isClient = address === gigDetails.client
  const proposalCount = proposals?.length || 0

  return (
    <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
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
          <div className={`text-sm font-medium px-4 py-2 rounded-full border ${status.color}`}>{status.label}</div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Gig Header */}
            <motion.div
              className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#E23E6B] to-[#cc4368] rounded-2xl flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-thin mb-2">
                      <AuroraText colors={["#cc4368", "#e6295c", "#ffffff", "#E23E6B"]}>
                        <span className="text-transparent">{metadata?.title || gigDetails.title}</span>
                      </AuroraText>
                    </h1>
                    <p className="text-gray-400">Gig #{gigIdString}</p>
                  </div>
                </div>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">{gigDetails.description}</p>
              {metadata?.skills && metadata.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {metadata.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="text-sm px-3 py-1 bg-white/10 text-white/80 rounded-full border border-white/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Detailed Description */}
            {isLoadingMetadata ? (
              <div className="text-center p-8">
                <Loader className="animate-spin" />
              </div>
            ) : (
              metadata && (
                <motion.div
                  className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-2xl font-thin mb-6 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-[#E23E6B]" />
                    Project Details
                  </h2>
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">{metadata.description}</div>
                  </div>
                  {metadata.requirements && metadata.requirements.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-blue-400" />
                        Requirements
                      </h3>
                      <ul className="space-y-2">
                        {metadata.requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-2 text-gray-300">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {metadata.deliverables && metadata.deliverables.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-green-400" />
                        Deliverables
                      </h3>
                      <ul className="space-y-2">
                        {metadata.deliverables.map((deliverable, index) => (
                          <li key={index} className="flex items-start gap-2 text-gray-300">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span>{deliverable}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )
            )}

            {/* Proposals Section */}
            <div className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-thin flex items-center gap-2">
                  <Users className="w-6 h-6 text-[#E23E6B]" />
                  Proposals ({proposalCount})
                </h2>
                {isClient && proposalCount > 0 && (
                  <Link href={`/dashboard/freelance/${gigIdString}/proposals`}>
                    <motion.button
                      className="px-4 py-2 bg-[#E23E6B] text-white rounded-xl hover:bg-[#cc4368] transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Manage Proposals
                    </motion.button>
                  </Link>
                )}
              </div>
              {proposalCount === 0 ? (
                <p className="text-gray-400">No proposals submitted yet.</p>
              ) : (
                <p className="text-gray-300">
                  {proposalCount} freelancer{proposalCount !== 1 ? "s" : ""} have submitted proposals for this gig.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Apply Button */}
            {canUserPropose && (
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Link href={`/dashboard/freelance/${gigIdString}/apply`}>
                  <motion.button
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-2xl hover:from-emerald-600 hover:to-green-500 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Send className="w-5 h-5" />
                    Apply Now
                  </motion.button>
                </Link>
              </motion.div>
            )}

            {/* Gig Stats */}
            <motion.div
              className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-6 mb-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h3 className="text-xl font-medium mb-6">Gig Information</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-400">Budget</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatUnits(gigDetails.usdtAmount, 6)} USDT</div>
                    {gigDetails.nativeStakeRequired > 0n && (
                      <div className="text-xs text-yellow-400">
                        +{formatEther(gigDetails.nativeStakeRequired)} EDU stake
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-400">Deadline</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{formatDate(gigDetails.deadline)}</div>
                    <div
                      className={`text-xs ${daysLeft > 7 ? "text-green-400" : daysLeft > 3 ? "text-yellow-400" : "text-red-400"}`}
                    >
                      {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-400">Proposals</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{proposalCount}</div>
                    <div className="text-xs text-gray-400">
                      {proposalDaysLeft > 0 ? `${proposalDaysLeft} days to apply` : "Closed"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-gray-400">Posted</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{formatDate(gigDetails.createdAt)}</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Client Info */}
            <motion.div
              className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-xl font-medium mb-4">Client</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#E23E6B] to-[#cc4368] rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-medium">
                    {`${gigDetails.client.slice(0, 6)}...${gigDetails.client.slice(-4)}`}
                  </div>
                  <div className="text-sm text-gray-400">Project Owner</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <WalletConnectModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </div>
  )
}

export default GigDetailPage
