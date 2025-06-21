"use client"

import { DialogDescription } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { motion, type Variants } from "framer-motion"
import { Poppins } from "next/font/google"
import { useRouter, useParams } from "next/navigation"
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi"
import { formatUnits, parseUnits } from "viem"
import { toast } from "sonner"
import {
  ArrowLeft,
  Trophy,
  DollarSign,
  User,
  FileText,
  AlertCircle,
  X,
  Plus,
  Trash2,
  Copy,
  Loader2,
  Crown,
  Award,
  Clock,
  Users,
  Target,
  AlertTriangle,
  Ban,
  CheckCircle,
  Calendar,
  Building2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { BOUNTY_CONTRACT_ADDRESS, BOUNTY_ABI } from "@/lib/contracts"
import { AuroraText } from "@/components/magicui/aurora-text"
import { getFromPinata, type PinataMetadata } from "@/lib/pinata"

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
})

interface Winner {
  recipient: string
  prize: string
}

interface SubmissionWithMetadata {
  submitter: string
  mainUri: string
  evidenceUris: readonly string[]
  timestamp: bigint
  metadata?: PinataMetadata
  isLoadingMetadata?: boolean
  metadataError?: string
}

const categories = ["Content", "Development", "Design", "Research", "Marketing", "Other"]
const statusLabels = ["Open", "Closed", "Cancelled"]

function BountySubmissionsComponent({ bountyId }: { bountyId: string }) {
  const router = useRouter()
  const { address, isConnected } = useAccount()

  // State management
  const [activeTab, setActiveTab] = useState("submissions")
  const [winners, setWinners] = useState<Winner[]>([{ recipient: "", prize: "" }])
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set())
  const [submissionsWithMetadata, setSubmissionsWithMetadata] = useState<SubmissionWithMetadata[]>([])
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showWinnersDialog, setShowWinnersDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Animation variants
  const cardVariants: Variants = {
    initial: { opacity: 0, y: 30, scale: 0.95 },
    animate: (index: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: 0.1 * index,
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    }),
    hover: {
      y: -8,
      scale: 1.02,
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  }

  // Contract reads
  const {
    data: bounty,
    isLoading: isLoadingBounty,
    error: bountyError,
    refetch: refetchBounty,
  } = useReadContract({
    address: BOUNTY_CONTRACT_ADDRESS,
    abi: BOUNTY_ABI,
    functionName: "getBounty",
    args: [BigInt(bountyId)],
  })

  const { data: submissions, refetch: refetchSubmissions } = useReadContract({
    address: BOUNTY_CONTRACT_ADDRESS,
    abi: BOUNTY_ABI,
    functionName: "getBountySubmissions",
    args: [BigInt(bountyId)],
  })

  const { data: existingWinners } = useReadContract({
    address: BOUNTY_CONTRACT_ADDRESS,
    abi: BOUNTY_ABI,
    functionName: "getBountyWinners",
    args: [BigInt(bountyId)],
  })

  const { data: penalty } = useReadContract({
    address: BOUNTY_CONTRACT_ADDRESS,
    abi: BOUNTY_ABI,
    functionName: "calculatePenalty",
    args: [BigInt(bountyId)],
    query: {
      enabled: bounty && bounty.status === 0,
    },
  })

  // Contract writes
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Access control check
  const isCreator = bounty && address && bounty.creator.toLowerCase() === address.toLowerCase()
  const isBountyOpen = bounty && bounty.status === 0
  const isDeadlinePassed = bounty && Date.now() > Number(bounty.deadline) * 1000
  const canSelectWinners = isCreator && isBountyOpen && isDeadlinePassed
  const canCancel = isCreator && isBountyOpen && !isDeadlinePassed

  // Load IPFS metadata for submissions
  useEffect(() => {
    if (submissions && submissions.length > 0) {
      const loadMetadata = async () => {
        const submissionsWithMeta: SubmissionWithMetadata[] = []

        for (const submission of submissions) {
          const submissionWithMeta: SubmissionWithMetadata = {
            ...submission,
            isLoadingMetadata: submission.mainUri.startsWith("ipfs://"),
          }

          if (submission.mainUri.startsWith("ipfs://")) {
            try {
              const metadata = await getFromPinata(submission.mainUri)
              submissionWithMeta.metadata = metadata
              submissionWithMeta.isLoadingMetadata = false
            } catch (error) {
              submissionWithMeta.metadataError = `Failed to load metadata: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
              submissionWithMeta.isLoadingMetadata = false
            }
          }

          submissionsWithMeta.push(submissionWithMeta)
        }

        setSubmissionsWithMetadata(submissionsWithMeta)
      }

      loadMetadata()
    }
  }, [submissions])

  // Handle transaction success
  useEffect(() => {
    if (isSuccess) {
      toast.success("Transaction successful!", {
        description: "Your action has been completed successfully.",
      })
      refetchBounty()
      refetchSubmissions()
      setShowCancelDialog(false)
      setShowWinnersDialog(false)
      setIsProcessing(false)
    }
  }, [isSuccess, refetchBounty, refetchSubmissions])

  // Handle transaction errors
  useEffect(() => {
    if (writeError) {
      toast.error("Transaction failed", {
        description: writeError.message.includes("User rejected")
          ? "You rejected the transaction in your wallet."
          : writeError.message || "An unknown error occurred.",
      })
      setIsProcessing(false)
    }
  }, [writeError])

  // Helper functions
  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const handleSelectWinners = async () => {
    if (!isConnected || !bountyId) {
      toast.error("Please connect your wallet")
      return
    }

    const validWinners = winners.filter((w) => w.recipient && w.prize)
    if (validWinners.length === 0) {
      toast.error("Please add at least one winner")
      return
    }

    try {
      setIsProcessing(true)
      const winnersArray = validWinners.map((w) => ({
        recipient: w.recipient as `0x${string}`,
        prize: parseUnits(w.prize, 6),
      }))

      writeContract({
        address: BOUNTY_CONTRACT_ADDRESS,
        abi: BOUNTY_ABI,
        functionName: "selectWinners",
        args: [BigInt(bountyId), winnersArray],
      })
    } catch (err) {
      console.error("Error selecting winners:", err)
      setIsProcessing(false)
    }
  }

  const handleCancelBounty = async () => {
    if (!isConnected || !bountyId) {
      toast.error("Please connect your wallet")
      return
    }

    try {
      setIsProcessing(true)
      writeContract({
        address: BOUNTY_CONTRACT_ADDRESS,
        abi: BOUNTY_ABI,
        functionName: "cancelBounty",
        args: [BigInt(bountyId)],
      })
    } catch (err) {
      console.error("Error cancelling bounty:", err)
      setIsProcessing(false)
    }
  }

  const addWinner = () => {
    setWinners([...winners, { recipient: "", prize: "" }])
  }

  const removeWinner = (index: number) => {
    setWinners(winners.filter((_, i) => i !== index))
  }

  const updateWinner = (index: number, field: "recipient" | "prize", value: string) => {
    const updated = [...winners]
    updated[index][field] = value
    setWinners(updated)
  }

  const quickSelectWinner = (submitter: string) => {
    const existingIndex = winners.findIndex((w) => w.recipient === submitter)
    if (existingIndex === -1) {
      const newWinners = [...winners]
      const emptyIndex = newWinners.findIndex((w) => !w.recipient)
      if (emptyIndex !== -1) {
        newWinners[emptyIndex].recipient = submitter
      } else {
        newWinners.push({ recipient: submitter, prize: "" })
      }
      setWinners(newWinners)
    }
  }

  const totalPrizes = winners.reduce((sum, winner) => {
    const prize = Number.parseFloat(winner.prize || "0")
    return sum + prize
  }, 0)

  const maxReward = bounty ? Number.parseFloat(formatUnits(bounty.totalReward, 6)) : 0

  // Loading state
  if (isLoadingBounty) {
    return (
      <div className={cn("min-h-screen bg-black text-white py-12 px-4 md:px-6", poppins.className)}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[500px]">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-white" />
                </div>
                <div className="absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-full animate-ping opacity-20"></div>
              </div>
              <h3 className="text-xl font-medium mb-2">Loading Bounty Management</h3>
              <p className="text-gray-400">Please wait while we fetch the bounty details...</p>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // Error states
  if (bountyError || !bounty) {
    return (
      <div className={cn("min-h-screen bg-black text-white py-12 px-4 md:px-6", poppins.className)}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-light mb-4">Bounty Not Found</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                The bounty you're looking for doesn't exist or may have been removed.
              </p>
              <motion.button
                onClick={() => router.push("/dashboard/bounties")}
                className="px-8 py-4 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl font-medium hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Back to Bounties
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // Access control
  if (!isConnected) {
    return (
      <div className={cn("min-h-screen bg-black text-white py-12 px-4 md:px-6", poppins.className)}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-light mb-4">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Please connect your wallet to manage bounty submissions and select winners.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  if (!isCreator) {
    return (
      <div className={cn("min-h-screen bg-black text-white py-12 px-4 md:px-6", poppins.className)}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center">
                <Ban className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-light mb-4">Access Denied</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Only the bounty creator can manage submissions and select winners.
              </p>
              <motion.button
                onClick={() => router.push(`/dashboard/bounty/${bountyId}`)}
                className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl font-medium hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                View Bounty Details
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen bg-black text-white py-12 px-4 md:px-6", poppins.className)}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-6"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="flex-1">
            <motion.div
              className="flex items-center gap-3 mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <div className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium text-gray-300">
                Bounty #{bountyId}
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-full text-white text-sm font-medium">
                Management Panel
              </div>
            </motion.div>

            <motion.h1
              className={cn("text-4xl md:text-5xl lg:text-6xl font-light mb-4", poppins.className)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <AuroraText colors={["#cc4368", "#e6295c", "#ffffff", "#E23E6B"]}>
                <span className="text-transparent">Manage Submissions</span>
              </AuroraText>
            </motion.h1>

            <motion.p
              className="text-gray-300/80 text-xl font-light max-w-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              {bounty.name}
            </motion.p>
          </div>

          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <motion.button
              onClick={() => router.push(`/dashboard/bounties/${bountyId}`)}
              className="flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium rounded-2xl hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Bounty</span>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Bounty Status Card */}
        <motion.div
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-12 group overflow-hidden relative shadow-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          whileHover={{ y: -4, scale: 1.01 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#E23E6B]/10 to-[#cc4368]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
          <div className="relative z-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                className="text-center p-6 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/10 group/stat hover:border-[#E23E6B]/30 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-full flex items-center justify-center group-hover/stat:scale-110 transition-transform duration-300">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-semibold mb-1">{formatUnits(bounty.totalReward, 6)}</div>
                <div className="text-sm text-gray-400 font-medium">USDT Reward</div>
              </motion.div>

              <motion.div
                className="text-center p-6 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/10 group/stat hover:border-[#E23E6B]/30 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center group-hover/stat:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-semibold mb-1">{bounty.submissionCount.toString()}</div>
                <div className="text-sm text-gray-400 font-medium">Submissions</div>
              </motion.div>

              <motion.div
                className="text-center p-6 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/10 group/stat hover:border-[#E23E6B]/30 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center group-hover/stat:scale-110 transition-transform duration-300">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-semibold mb-1">{existingWinners?.length || 0}</div>
                <div className="text-sm text-gray-400 font-medium">Winners</div>
              </motion.div>

              <motion.div
                className="text-center p-6 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/10 group/stat hover:border-[#E23E6B]/30 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full flex items-center justify-center group-hover/stat:scale-110 transition-transform duration-300">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="text-sm font-semibold mb-1">{formatDate(bounty.deadline)}</div>
                <div className="text-sm text-gray-400 font-medium">Deadline</div>
              </motion.div>
            </div>

            {/* Status Indicators */}
            <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-white/10">
              <div
                className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
                  isBountyOpen
                    ? "bg-gradient-to-r from-emerald-500/20 to-green-600/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-gradient-to-r from-gray-500/20 to-slate-600/20 text-gray-400 border border-gray-500/30"
                }`}
              >
                {isBountyOpen ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {statusLabels[bounty.status]}
              </div>
              {isDeadlinePassed && isBountyOpen && (
                <div className="px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Deadline Passed - Can Select Winners
                </div>
              )}
              {!isDeadlinePassed && isBountyOpen && (
                <div className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 text-blue-400 border border-blue-500/30 rounded-full text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Active - Accepting Submissions
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-2">
            <TabsList className="grid w-full grid-cols-3 bg-transparent gap-2">
              <TabsTrigger
                value="submissions"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#E23E6B] data-[state=active]:to-[#cc4368] data-[state=active]:text-white rounded-xl py-3 text-white"
              >
                <FileText className="w-4 h-4" />
                Submissions ({submissionsWithMetadata.length})
              </TabsTrigger>
              <TabsTrigger
                value="winners"
                disabled={!canSelectWinners}
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#E23E6B] data-[state=active]:to-[#cc4368] data-[state=active]:text-white rounded-xl py-3 disabled:opacity-50 text-white"
              >
                <Trophy className="w-4 h-4" />
                Select Winners
              </TabsTrigger>
              <TabsTrigger
                value="manage"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#E23E6B] data-[state=active]:to-[#cc4368] data-[state=active]:text-white rounded-xl py-3 text-white"
              >
                <Target className="w-4 h-4 text-white" />
                Manage Bounty
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="space-y-8">
            {submissionsWithMetadata.length === 0 ? (
              <motion.div
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-12 text-center group overflow-hidden relative shadow-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#E23E6B]/5 to-[#cc4368]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-gray-500 to-slate-600 rounded-full flex items-center justify-center">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-light mb-4">No Submissions Yet</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    Submissions will appear here once users start submitting to your bounty. Share your bounty to get
                    more participants!
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {submissionsWithMetadata.map((submission, index) => (
                  <motion.div
                    key={index}
                    className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 group overflow-hidden relative shadow-2xl"
                    variants={cardVariants}
                    custom={index}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#E23E6B]/10 to-[#cc4368]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-full flex items-center justify-center">
                            <User className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <div className="font-mono text-lg font-medium">{formatAddress(submission.submitter)}</div>
                            <div className="text-sm text-gray-400 flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {formatDate(submission.timestamp)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <motion.button
                            onClick={() => copyToClipboard(submission.submitter)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm flex items-center gap-2 transition-all duration-200 border border-white/10 hover:border-[#E23E6B]/30"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Copy className="w-4 h-4" />
                            Copy
                          </motion.button>
                          {canSelectWinners && (
                            <motion.button
                              onClick={() => quickSelectWinner(submission.submitter)}
                              className="px-4 py-2 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white rounded-xl text-sm flex items-center gap-2 hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Crown className="w-4 h-4" />
                              Select Winner
                            </motion.button>
                          )}
                        </div>
                      </div>

                      {/* Submission Content */}
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-[#E23E6B]" />
                            <span className="text-lg font-medium text-gray-200">Main Submission</span>
                          </div>
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            {submission.isLoadingMetadata ? (
                              <div className="flex items-center gap-3 text-gray-400 py-8 justify-center">
                                <div className="w-8 h-8 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-full flex items-center justify-center">
                                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                                </div>
                                <span className="text-lg">Loading IPFS metadata...</span>
                              </div>
                            ) : submission.metadataError ? (
                              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertCircle className="w-5 h-5" />
                                  <span className="font-medium">Error Loading Content</span>
                                </div>
                                <p className="text-sm">{submission.metadataError}</p>
                              </div>
                            ) : submission.metadata ? (
                              <div className="space-y-4">
                                <div className="prose prose-invert prose-sm max-w-none">
                                  {(submission.metadata as any).explanation && (
                                    <div className="mb-4">
                                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-[#E23E6B]" />
                                        Explanation
                                      </h4>
                                      <p className="text-gray-300 leading-relaxed bg-white/5 p-4 rounded-xl">
                                        {(submission.metadata as any).explanation}
                                      </p>
                                    </div>
                                  )}
                                  {(submission.metadata as any).approach && (
                                    <div className="mb-4">
                                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                                        <Target className="w-4 h-4 text-[#E23E6B]" />
                                        Approach
                                      </h4>
                                      <p className="text-gray-300 leading-relaxed bg-white/5 p-4 rounded-xl">
                                        {(submission.metadata as any).approach}
                                      </p>
                                    </div>
                                  )}
                                  {(submission.metadata as any).deliverables && (submission.metadata as any).deliverables.length > 0 && (
                                    <div className="mb-4">
                                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-[#E23E6B]" />
                                        Deliverables
                                      </h4>
                                      <ul className="space-y-2">
                                        {(submission.metadata as any).deliverables.map((item: string, i: number) => (
                                          <li
                                            key={i}
                                            className="text-gray-300 bg-white/5 p-3 rounded-lg flex items-center gap-2"
                                          >
                                            <div className="w-2 h-2 bg-[#E23E6B] rounded-full"></div>
                                            {item}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-blue-400">IPFS URI</span>
                                    <button
                                      onClick={() => copyToClipboard(submission.mainUri)}
                                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-500/10 transition-colors duration-200"
                                    >
                                      <Copy className="w-3 h-3" />
                                      Copy
                                    </button>
                                  </div>
                                  <div className="font-mono text-sm text-blue-300 break-all bg-blue-500/5 p-3 rounded-lg">
                                    {submission.mainUri}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-gray-300 break-all font-mono bg-white/5 p-4 rounded-xl">
                                {submission.mainUri}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Evidence URIs */}
                        {submission.evidenceUris.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <FileText className="w-5 h-5 text-[#E23E6B]" />
                              <span className="text-lg font-medium text-gray-200">
                                Evidence Files ({submission.evidenceUris.length})
                              </span>
                            </div>
                            <div className="space-y-3">
                              {submission.evidenceUris.map((uri: string, i: number) => (
                                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-300 font-mono break-all flex-1 mr-4">
                                      {uri}
                                    </span>
                                    <button
                                      onClick={() => copyToClipboard(uri)}
                                      className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm flex items-center gap-1 transition-colors duration-200"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Winners Tab */}
          <TabsContent value="winners" className="space-y-8">
            <motion.div
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 group overflow-hidden relative shadow-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#E23E6B]/10 to-[#cc4368]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-light">Select Winners and Distribute Prizes</h3>
                    <p className="text-gray-400">Choose winners from submissions and set their prize amounts</p>
                  </div>
                </div>

                {!canSelectWinners ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                      <span className="font-medium text-yellow-400">Winner Selection Not Available</span>
                    </div>
                    <p className="text-yellow-300/80">
                      {!isDeadlinePassed
                        ? "Winners can only be selected after the deadline passes."
                        : "This bounty is not eligible for winner selection."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {winners.map((winner, index) => (
                        <motion.div
                          key={index}
                          className="flex gap-4 items-end p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-[#E23E6B]/30 transition-all duration-300"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex-1">
                            <Label className="text-gray-300 mb-2 block">Winner Address</Label>
                            <Input
                              placeholder="0x..."
                              value={winner.recipient}
                              onChange={(e) => updateWinner(index, "recipient", e.target.value)}
                              className="bg-black/20 border-white/20 text-white placeholder:text-gray-500"
                            />
                          </div>
                          <div className="w-40">
                            <Label className="text-gray-300 mb-2 block">Prize (USDT)</Label>
                            <Input
                              type="number"
                              step="0.000001"
                              placeholder="0.00"
                              value={winner.prize}
                              onChange={(e) => updateWinner(index, "prize", e.target.value)}
                              className="bg-black/20 border-white/20 text-white placeholder:text-gray-500"
                            />
                          </div>
                          {winners.length > 1 && (
                            <motion.button
                              onClick={() => removeWinner(index)}
                              className="p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-400 transition-colors duration-200"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </motion.button>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    <motion.button
                      onClick={addWinner}
                      className="w-full px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-[#E23E6B]/30 rounded-2xl text-white flex items-center justify-center gap-2 transition-all duration-300"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Plus className="h-5 w-5" />
                      Add Winner
                    </motion.button>

                    <div className="bg-gradient-to-r from-blue-500/10 to-indigo-600/10 border border-blue-500/20 rounded-2xl p-6">
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <div className="text-2xl font-semibold text-white mb-1">{totalPrizes.toFixed(6)}</div>
                          <div className="text-sm text-gray-400">Total Prizes (USDT)</div>
                        </div>
                        <div>
                          <div className="text-2xl font-semibold text-white mb-1">{maxReward.toFixed(6)}</div>
                          <div className="text-sm text-gray-400">Max Reward (USDT)</div>
                        </div>
                        <div>
                          <div
                            className={`text-2xl font-semibold mb-1 ${
                              maxReward - totalPrizes >= 0 ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {(maxReward - totalPrizes).toFixed(6)}
                          </div>
                          <div className="text-sm text-gray-400">Remaining (USDT)</div>
                        </div>
                      </div>
                    </div>

                    {totalPrizes > maxReward && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-red-400">
                          <AlertCircle className="h-5 w-5" />
                          <span className="font-medium">Total prizes exceed the bounty reward.</span>
                        </div>
                      </div>
                    )}

                    <Dialog open={showWinnersDialog} onOpenChange={setShowWinnersDialog}>
                      <DialogTrigger asChild>
                        <motion.button
                          className="w-full px-6 py-4 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={
                            totalPrizes > maxReward || winners.filter((w) => w.recipient && w.prize).length === 0
                          }
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Award className="w-5 h-5" />
                          Select Winners & Distribute Prizes
                        </motion.button>
                      </DialogTrigger>
                      <DialogContent className="bg-black border-white/20 max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-white">Confirm Winner Selection</DialogTitle>
                          <DialogDescription className="text-gray-400">
                            This action will distribute prizes to selected winners and close the bounty. This cannot be
                            undone.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-4">
                            <h4 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                              <Trophy className="w-4 h-4" />
                              Winners Summary
                            </h4>
                            <div className="space-y-2">
                              {winners
                                .filter((w) => w.recipient && w.prize)
                                .map((winner, index) => (
                                  <div key={index} className="flex justify-between text-sm bg-yellow-500/5 p-2 rounded">
                                    <span className="font-mono">{formatAddress(winner.recipient)}</span>
                                    <span className="font-medium">{winner.prize} USDT</span>
                                  </div>
                                ))}
                              <div className="border-t border-yellow-500/20 mt-3 pt-3 flex justify-between font-semibold">
                                <span>Total Distribution:</span>
                                <span className="text-yellow-400">{totalPrizes.toFixed(6)} USDT</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              onClick={() => setShowWinnersDialog(false)}
                              className="flex-1 border-white/20 text-white hover:bg-white/10"
                            >
                              Cancel
                            </Button>
                            <motion.button
                              onClick={handleSelectWinners}
                              disabled={isPending || isConfirming || isProcessing}
                              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white rounded-lg hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {isPending || isConfirming || isProcessing ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  {isPending ? "Confirming..." : isConfirming ? "Processing..." : "Processing..."}
                                </>
                              ) : (
                                "Confirm Selection"
                              )}
                            </motion.button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </motion.div>
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-8">
            <div className="grid gap-8">
              {/* Cancel Bounty */}
              <motion.div
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 group overflow-hidden relative shadow-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center">
                      <X className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-light text-red-400">Cancel Bounty</h3>
                      <p className="text-gray-400">Cancel the bounty and refund remaining funds (penalty may apply)</p>
                    </div>
                  </div>

                  {!canCancel ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                        <span className="font-medium text-yellow-400">Cancellation Not Available</span>
                      </div>
                      <p className="text-yellow-300/80">
                        {bounty.status !== 0
                          ? "This bounty has already been closed or cancelled."
                          : "Bounty cannot be cancelled after the deadline passes."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {penalty && (
                        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                            <span className="font-medium text-yellow-400">Cancellation Penalty</span>
                          </div>
                          <p className="text-yellow-300/80">
                            Cancelling will incur a penalty of {formatUnits(penalty, 6)} USDT. This will be distributed
                            among submitters.
                          </p>
                        </div>
                      )}

                      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                        <DialogTrigger asChild>
                          <motion.button
                            className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium rounded-2xl hover:from-rose-600 hover:to-red-500 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Ban className="w-5 h-5" />
                            Cancel Bounty
                          </motion.button>
                        </DialogTrigger>
                        <DialogContent className="bg-black border-white/20 max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-red-400">Cancel Bounty</DialogTitle>
                            <DialogDescription className="text-gray-400">
                              This action will cancel the bounty and cannot be undone. Please provide a reason for
                              cancellation.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6">
                            <div>
                              <Label className="text-gray-300 mb-2 block">Reason for Cancellation</Label>
                              <Textarea
                                placeholder="Please explain why you're cancelling this bounty..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="bg-black/20 border-white/20 text-white placeholder:text-gray-500"
                              />
                            </div>
                            {penalty && (
                              <div className="bg-gradient-to-r from-red-500/10 to-rose-600/10 border border-red-500/20 rounded-2xl p-4">
                                <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  Cancellation Impact
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between bg-red-500/5 p-2 rounded">
                                    <span>Penalty Amount:</span>
                                    <span className="text-red-400 font-medium">
                                      {formatUnits(penalty, 6)} USDT
                                    </span>
                                  </div>
                                  <div className="flex justify-between bg-green-500/5 p-2 rounded">
                                    <span>Refund Amount:</span>
                                    <span className="text-green-400 font-medium">
                                      {formatUnits(bounty.totalReward - penalty, 6)} USDT
                                    </span>
                                  </div>
                                  <div className="flex justify-between font-semibold border-t border-red-500/20 pt-2 mt-2">
                                    <span>Total Bounty:</span>
                                    <span>{formatUnits(bounty.totalReward, 6)} USDT</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="flex gap-3">
                              <Button
                                variant="outline"
                                onClick={() => setShowCancelDialog(false)}
                                className="flex-1 border-white/20 text-white hover:bg-white/10"
                              >
                                Keep Active
                              </Button>
                              <motion.button
                                onClick={handleCancelBounty}
                                disabled={isPending || isConfirming || isProcessing || !cancelReason.trim()}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-rose-600 hover:to-red-500 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                {isPending || isConfirming || isProcessing ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {isPending ? "Confirming..." : isConfirming ? "Processing..." : "Processing..."}
                                  </>
                                ) : (
                                  "Confirm Cancellation"
                                )}
                              </motion.button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Bounty Statistics */}
              <motion.div
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 group overflow-hidden relative shadow-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#E23E6B]/10 to-[#cc4368]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-light">Bounty Statistics</h3>
                      <p className="text-gray-400">Overview of bounty performance and metrics</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div
                      className="text-center p-6 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/10 group/stat hover:border-[#E23E6B]/30 transition-all duration-300"
                      whileHover={{ scale: 1.05, y: -2 }}
                    >
                      <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-full flex items-center justify-center group-hover/stat:scale-110 transition-transform duration-300">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl font-semibold text-[#E23E6B] mb-1">
                        {bounty.submissionCount.toString()}
                      </div>
                      <div className="text-sm text-gray-400 font-medium">Total Submissions</div>
                    </motion.div>

                    <motion.div
                      className="text-center p-6 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/10 group/stat hover:border-[#E23E6B]/30 transition-all duration-300"
                      whileHover={{ scale: 1.05, y: -2 }}
                    >
                      <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center group-hover/stat:scale-110 transition-transform duration-300">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl font-semibold text-green-400 mb-1">{existingWinners?.length || 0}</div>
                      <div className="text-sm text-gray-400 font-medium">Winners Selected</div>
                    </motion.div>

                    <motion.div
                      className="text-center p-6 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/10 group/stat hover:border-[#E23E6B]/30 transition-all duration-300"
                      whileHover={{ scale: 1.05, y: -2 }}
                    >
                      <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center group-hover/stat:scale-110 transition-transform duration-300">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl font-semibold text-blue-400 mb-1">
                        {formatUnits(bounty.totalReward, 6)}
                      </div>
                      <div className="text-sm text-gray-400 font-medium">Total Reward (USDT)</div>
                    </motion.div>

                    <motion.div
                      className="text-center p-6 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/10 group/stat hover:border-[#E23E6B]/30 transition-all duration-300"
                      whileHover={{ scale: 1.05, y: -2 }}
                    >
                      <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full flex items-center justify-center group-hover/stat:scale-110 transition-transform duration-300">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl font-semibold text-purple-400 mb-1">
                        {Math.abs(Math.ceil((Number(bounty.deadline) * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))}
                      </div>
                      <div className="text-sm text-gray-400 font-medium">
                        Days {isDeadlinePassed ? "Overdue" : "Remaining"}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function BountySubmissions() {
  const params = useParams()
  const bountyId = params?.id as string

  if (!bountyId || isNaN(Number(bountyId))) {
    return (
      <div className={cn("min-h-screen bg-black text-white py-12 px-4 md:px-6", poppins.className)}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-light mb-4">Invalid Bounty ID</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                The bounty ID provided is not valid or properly formatted.
              </p>
              <motion.button
                onClick={() => window.history.back()}
                className="px-8 py-4 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl font-medium hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Back to Bounties
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  return <BountySubmissionsComponent bountyId={bountyId} />
}
