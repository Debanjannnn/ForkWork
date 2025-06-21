"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Poppins } from "next/font/google"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

import { useWallet } from "@/contexts/wallet-context"
import { FREELANCE_CONTRACT_ADDRESS, FREELANCE_ABI } from "@/lib/contracts"
import { getFromPinata } from "@/lib/pinata"
import { cn } from "@/lib/utils"

import { AuroraText } from "@/components/magicui/aurora-text"
import { WalletConnectModal } from "@/components/wallet-connect-module"
import { ProposalRenderer } from "@/components/freelance/proposal-rendered"
import {
  ArrowLeft,
  Loader,
  AlertCircle,
  XCircle,
  CheckCircle,
  FileText,
  User,
  Calendar,
  UserCheck,
  MessageSquare,
  Clock,
  Shield,
  ExternalLink,
} from "lucide-react"

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
})

type ActionType = "select" | "fund" | "approve" | null

function ProposalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { address, isConnected } = useWallet()
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [proposalContent, setProposalContent] = useState<any>(null)
  const [isLoadingContent, setIsLoadingContent] = useState(true)
  const [contentError, setContentError] = useState<string | null>(null)
  const [currentAction, setCurrentAction] = useState<ActionType>(null)

  // Extract and validate params from URL
  const gigIdString = params.id as string
  const freelancerAddress = params.address as `0x${string}`
  const isParamsValid =
    typeof gigIdString === "string" &&
    !isNaN(Number.parseInt(gigIdString)) &&
    /^0x[a-fA-F0-9]{40}$/.test(freelancerAddress)
  const gigId = isParamsValid ? BigInt(Number.parseInt(gigIdString)) : 0n

  // --- Smart Contract Read Operations ---
  const {
    data: gigDetails,
    isLoading: isLoadingGigDetails,
    refetch: refetchGig,
  } = useReadContract({
    address: FREELANCE_CONTRACT_ADDRESS,
    abi: FREELANCE_ABI,
    functionName: "getGigDetails",
    args: [gigId],
    enabled: isParamsValid && isConnected,
  })

  const {
    data: proposal,
    isLoading: isLoadingProposal,
    refetch: refetchProposal,
  } = useReadContract({
    address: FREELANCE_CONTRACT_ADDRESS,
    abi: FREELANCE_ABI,
    functionName: "getProposal",
    args: [gigId, freelancerAddress],
    enabled: isParamsValid && isConnected,
  })

  // --- Smart Contract Write Operations ---
  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash })

  // --- IPFS Content Fetching ---
  useEffect(() => {
    async function fetchProposalContent() {
      if (!proposal?.proposalUri) {
        setIsLoadingContent(false)
        return
      }

      setIsLoadingContent(true)
      setContentError(null)

      try {
        const content = await getFromPinata(proposal.proposalUri)
        setProposalContent(content)
      } catch (error) {
        console.error("Failed to fetch proposal content:", error)
        setContentError("Could not load proposal content from IPFS.")
        setProposalContent(null)
      } finally {
        setIsLoadingContent(false)
      }
    }

    fetchProposalContent()
  }, [proposal?.proposalUri])

  // --- Transaction Success Handling ---
  useEffect(() => {
    if (isConfirmed && currentAction) {
      const actionMessages = {
        select: "Freelancer selected successfully! 🎉",
        fund: "Gig funded successfully! 💰",
        approve: "Work approved and payment released! ✅",
      }

      toast.success(actionMessages[currentAction])

      // Refetch data to update UI
      refetchGig()
      refetchProposal()

      // Reset action state
      setCurrentAction(null)
      resetWrite()

      // Redirect after a delay
      setTimeout(() => {
        router.push(`/dashboard/freelance/${gigIdString}/proposals`)
      }, 2500)
    }
  }, [isConfirmed, currentAction, refetchGig, refetchProposal, resetWrite, router, gigIdString])

  // --- Error Handling ---
  useEffect(() => {
    if (writeError || confirmError) {
      const error = writeError || confirmError
      const errorMessage = (error as any)?.shortMessage || error?.message || "Transaction failed"
      toast.error(`Error: ${errorMessage}`)
      setCurrentAction(null)
    }
  }, [writeError, confirmError])

  // --- Action Handlers ---
  const handleSelectFreelancer = async () => {
    if (!gigId || !freelancerAddress) return

    setCurrentAction("select")
    toast.loading("Selecting freelancer...")

    try {
      await writeContract({
        address: FREELANCE_CONTRACT_ADDRESS,
        abi: FREELANCE_ABI,
        functionName: "selectFreelancer",
        args: [gigId, freelancerAddress],
      })
    } catch (error) {
      setCurrentAction(null)
      toast.dismiss()
    }
  }

  const handleFundGig = async () => {
    if (!gigId) return

    setCurrentAction("fund")
    toast.loading("Funding gig...")

    try {
      await writeContract({
        address: FREELANCE_CONTRACT_ADDRESS,
        abi: FREELANCE_ABI,
        functionName: "fundGig",
        args: [gigId],
      })
    } catch (error) {
      setCurrentAction(null)
      toast.dismiss()
    }
  }

  const handleApproveWork = async () => {
    if (!gigId) return

    setCurrentAction("approve")
    toast.loading("Approving work and releasing payment...")

    try {
      await writeContract({
        address: FREELANCE_CONTRACT_ADDRESS,
        abi: FREELANCE_ABI,
        functionName: "approveWork",
        args: [gigId],
      })
    } catch (error) {
      setCurrentAction(null)
      toast.dismiss()
    }
  }

  // --- Loading States ---
  const isLoadingOnChain = isLoadingGigDetails || isLoadingProposal
  const isProcessing = isWritePending || isConfirming

  // --- Render Conditions ---
  if (!isConnected) {
    return (
      <div className={cn("min-h-screen bg-black text-white py-8 px-4", poppins.className)}>
        <motion.div className="max-w-xl mx-auto bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center mt-24">
          <AlertCircle className="w-12 h-12 text-[#E23E6B] mx-auto mb-4" />
          <h3 className="text-xl font-thin mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400 mb-6">You need to connect your wallet to view this proposal.</p>
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
          <p className="text-gray-400">Loading proposal details...</p>
        </div>
      </div>
    )
  }

  if (!proposal || !gigDetails) {
    return (
      <div className={cn("min-h-screen bg-black text-white py-8 px-4", poppins.className)}>
        <div className="max-w-xl mx-auto bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center mt-24">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-thin mb-2">Proposal Not Found</h3>
          <p className="text-gray-400 mb-6">Could not find data for this gig or proposal. Please check the URL.</p>
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

  // Determine gig and proposal states
  const hasSelectedFreelancer = gigDetails.selectedFreelancer !== "0x0000000000000000000000000000000000000000"
  const isThisFreelancerSelected = gigDetails.selectedFreelancer.toLowerCase() === freelancerAddress.toLowerCase()
  const isProposalWithdrawn = proposal.isWithdrawn
  const isGigFunded = gigDetails.isFunded
  const isWorkApproved = gigDetails.isApproved
  const isGigCompleted = gigDetails.isCompleted

  return (
    <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-4xl font-thin mb-2">
              <AuroraText colors={["#cc4368", "#e6295c", "#ffffff", "#E23E6B"]}>
                <span className="text-transparent">Review Proposal</span>
              </AuroraText>
            </h1>
            <p className="text-gray-300/80 font-light">
              For Gig: <span className="text-white font-medium">{gigDetails.title}</span>
            </p>
          </div>
          <Link href={`/dashboard/freelance/${gigIdString}/proposals`}>
            <motion.button
              className="flex items-center space-x-2 px-5 py-3 bg-white/10 border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All Proposals</span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Status Banners */}
        {isConfirmed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/30 text-green-300 p-4 rounded-2xl mb-6 flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Transaction successful! Redirecting you back to proposals...</span>
          </motion.div>
        )}

        {isGigCompleted && (
          <motion.div className="bg-blue-500/10 border border-blue-500/30 text-blue-300 p-4 rounded-2xl mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span>This gig has been completed and payment has been released.</span>
          </motion.div>
        )}

        {hasSelectedFreelancer && !isThisFreelancerSelected && (
          <motion.div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 p-4 rounded-2xl mb-6 flex items-center gap-3">
            <UserCheck className="w-5 h-5" />
            <span>A different freelancer has been selected for this gig.</span>
          </motion.div>
        )}

        {isProposalWithdrawn && (
          <motion.div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-2xl mb-6 flex items-center gap-3">
            <XCircle className="w-5 h-5" />
            <span>This proposal was withdrawn by the freelancer and cannot be selected.</span>
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 space-y-8"
        >
          {/* Freelancer Info */}
          <div className="pb-6 border-b border-white/10">
            <h2 className="text-lg font-medium text-gray-300 mb-4">Freelancer Details</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-[#E23E6B]" />
                <p className="font-mono text-sm md:text-base break-all">{freelancerAddress}</p>
                <a
                  href={`https://opencampus-codex.blockscout.com/address/${freelancerAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E23E6B] hover:text-[#cc4368] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Calendar className="w-4 h-4" />
                <p className="text-sm">
                  Submitted {formatDistanceToNow(new Date(Number(proposal.submittedAt) * 1000))} ago
                </p>
              </div>
              {proposal.lastUpdatedAt !== proposal.submittedAt && (
                <div className="flex items-center gap-3 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <p className="text-sm">
                    Last updated {formatDistanceToNow(new Date(Number(proposal.lastUpdatedAt) * 1000))} ago
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Proposal Content */}
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-300">Proposal Details</h2>

            {isLoadingContent ? (
              <div className="flex items-center justify-center py-10 space-x-3">
                <Loader className="w-6 h-6 text-[#E23E6B] animate-spin" />
                <span className="text-gray-300">Loading proposal content...</span>
              </div>
            ) : contentError ? (
              <div className="text-center py-10 text-red-400">
                <FileText className="w-10 h-10 mx-auto mb-3" />
                <p>{contentError}</p>
                <p className="text-sm text-gray-500 mt-2">URI: {proposal.proposalUri}</p>
              </div>
            ) : proposalContent ? (
              <ProposalRenderer content={proposalContent} />
            ) : (
              <div className="text-center py-10 text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-3" />
                <p>No proposal content available</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isProposalWithdrawn && !isGigCompleted && (
            <div className="pt-8 border-t border-white/10">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* Select Freelancer Button */}
                {!hasSelectedFreelancer && (
                  <motion.button
                    onClick={handleSelectFreelancer}
                    disabled={isProcessing}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    whileHover={{ scale: isProcessing ? 1 : 1.05 }}
                    whileTap={{ scale: isProcessing ? 1 : 0.95 }}
                  >
                    {isProcessing && currentAction === "select" && <Loader className="w-5 h-5 animate-spin" />}
                    <UserCheck className="w-5 h-5" />
                    {isProcessing && currentAction === "select" ? "Selecting..." : "Select Freelancer"}
                  </motion.button>
                )}

                {/* Fund Gig Button */}
                {isThisFreelancerSelected && !isGigFunded && (
                  <motion.button
                    onClick={handleFundGig}
                    disabled={isProcessing}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    whileHover={{ scale: isProcessing ? 1 : 1.05 }}
                    whileTap={{ scale: isProcessing ? 1 : 0.95 }}
                  >
                    {isProcessing && currentAction === "fund" && <Loader className="w-5 h-5 animate-spin" />}
                    <MessageSquare className="w-5 h-5" />
                    {isProcessing && currentAction === "fund" ? "Funding..." : "Fund Gig"}
                  </motion.button>
                )}

                {/* Approve Work Button */}
                {isThisFreelancerSelected && isGigFunded && !isWorkApproved && (
                  <motion.button
                    onClick={handleApproveWork}
                    disabled={isProcessing}
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    whileHover={{ scale: isProcessing ? 1 : 1.05 }}
                    whileTap={{ scale: isProcessing ? 1 : 0.95 }}
                  >
                    {isProcessing && currentAction === "approve" && <Loader className="w-5 h-5 animate-spin" />}
                    <CheckCircle className="w-5 h-5" />
                    {isProcessing && currentAction === "approve" ? "Approving..." : "Approve & Release Payment"}
                  </motion.button>
                )}
              </div>

              {/* Transaction Hash */}
              {hash && (
                <div className="mt-6 text-center text-sm text-gray-400">
                  <p className="mb-2">Transaction Hash:</p>
                  <a
                    href={`https://opencampus-codex.blockscout.com/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#E23E6B] hover:underline break-all"
                  >
                    {hash}
                  </a>
                </div>
              )}

              {/* Help Text */}
              <div className="mt-6 text-center text-sm text-gray-500">
                {!hasSelectedFreelancer && <p>Select this freelancer to begin the project workflow.</p>}
                {isThisFreelancerSelected && !isGigFunded && (
                  <p>Fund the gig to enable the freelancer to start working.</p>
                )}
                {isThisFreelancerSelected && isGigFunded && !isWorkApproved && (
                  <p>Approve the completed work to release payment to the freelancer.</p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <WalletConnectModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </div>
  )
}

export default ProposalDetailPage
