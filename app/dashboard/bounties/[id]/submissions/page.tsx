"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Poppins } from "next/font/google"
import { useParams, useRouter } from "next/navigation"
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
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { BOUNTY_CONTRACT_ADDRESS, BOUNTY_ABI } from "@/lib/contracts"
import { AuroraText } from "@/components/magicui/aurora-text"
import { getFromPinata, type PinataMetadata } from "@/lib/pinata"

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
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
  evidenceUris: string[]
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
    return `${address.slice(0, 6)}...${address.slice(-4)}`
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#E23E6B] mx-auto mb-4" />
          <p className="text-gray-400">Loading bounty details...</p>
        </div>
      </div>
    )
  }

  // Error states
  if (bountyError || !bounty) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-thin mb-2">Bounty Not Found</h2>
        <p className="text-gray-400 mb-6">The bounty you're looking for doesn't exist.</p>
        <Button
          onClick={() => router.push("/dashboard/bounty")}
          className="bg-gradient-to-r from-[#E23E6B] to-[#cc4368]"
        >
          Back to Bounties
        </Button>
      </div>
    )
  }

  // Access control
  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-thin mb-2">Connect Your Wallet</h2>
        <p className="text-gray-400 mb-6">Please connect your wallet to manage bounty submissions.</p>
      </div>
    )
  }

  if (!isCreator) {
    return (
      <div className="text-center py-12">
        <Ban className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-thin mb-2">Access Denied</h2>
        <p className="text-gray-400 mb-6">Only the bounty creator can manage submissions.</p>
        <Button onClick={() => router.push(`/dashboard/bounty/${bountyId}`)} variant="outline">
          View Bounty Details
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <motion.h1 className="text-3xl md:text-4xl font-thin mb-2">
              <AuroraText colors={["#cc4368", "#e6295c", "#ffffff", "#E23E6B"]}>
                <span className="text-transparent">Manage Submissions</span>
              </AuroraText>
            </motion.h1>
            <motion.p className="text-gray-300/80 text-lg font-light">{bounty.name}</motion.p>
          </div>
          <Button
            onClick={() => router.push(`/dashboard/bounty/${bountyId}`)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bounty
          </Button>
        </motion.div>

        {/* Bounty Status Card */}
        <motion.div
          className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-[#E23E6B]/20 rounded-2xl mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-[#E23E6B]" />
              </div>
              <div className="text-2xl font-semibold">{formatUnits(bounty.totalReward, 6)}</div>
              <div className="text-sm text-gray-400">USDT Reward</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-2xl mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-2xl font-semibold">{bounty.submissionCount.toString()}</div>
              <div className="text-sm text-gray-400">Submissions</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-2xl mx-auto mb-3">
                <Trophy className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-2xl font-semibold">{existingWinners?.length || 0}</div>
              <div className="text-sm text-gray-400">Winners</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-2xl mx-auto mb-3">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-sm font-semibold">{formatDate(bounty.deadline)}</div>
              <div className="text-sm text-gray-400">Deadline</div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-white/10">
            <Badge
              variant={isBountyOpen ? "default" : "secondary"}
              className={isBountyOpen ? "bg-green-500/20 text-green-400" : ""}
            >
              {statusLabels[bounty.status]}
            </Badge>
            {isDeadlinePassed && isBountyOpen && (
              <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                Deadline Passed - Can Select Winners
              </Badge>
            )}
            {!isDeadlinePassed && isBountyOpen && (
              <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                Active - Accepting Submissions
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/20">
            <TabsTrigger value="submissions" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Submissions ({submissionsWithMetadata.length})
            </TabsTrigger>
            <TabsTrigger value="winners" disabled={!canSelectWinners} className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Select Winners
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Manage Bounty
            </TabsTrigger>
          </TabsList>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="space-y-6">
            {submissionsWithMetadata.length === 0 ? (
              <Card className="bg-white/5 border-white/20">
                <CardContent className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Submissions Yet</h3>
                  <p className="text-gray-400">
                    Submissions will appear here once users start submitting to your bounty.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {submissionsWithMetadata.map((submission, index) => (
                  <motion.div
                    key={index}
                    className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-mono text-lg">{formatAddress(submission.submitter)}</div>
                          <div className="text-sm text-gray-400">{formatDate(submission.timestamp)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(submission.submitter)}
                          className="border-white/20"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        {canSelectWinners && (
                          <Button
                            size="sm"
                            onClick={() => quickSelectWinner(submission.submitter)}
                            className="bg-gradient-to-r from-[#E23E6B] to-[#cc4368]"
                          >
                            <Crown className="w-4 h-4 mr-2" />
                            Select as Winner
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Submission Content */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-300 mb-2 block">Main Submission</Label>
                        <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                          {submission.isLoadingMetadata ? (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Loading IPFS metadata...</span>
                            </div>
                          ) : submission.metadataError ? (
                            <div className="text-red-400 text-sm">{submission.metadataError}</div>
                          ) : submission.metadata ? (
                            <div className="space-y-3">
                              <div className="prose prose-invert prose-sm max-w-none">
                                {submission.metadata.explanation && (
                                  <div>
                                    <h4 className="text-white font-semibold mb-2">Explanation</h4>
                                    <p className="text-gray-300">{submission.metadata.explanation}</p>
                                  </div>
                                )}
                                {submission.metadata.approach && (
                                  <div>
                                    <h4 className="text-white font-semibold mb-2">Approach</h4>
                                    <p className="text-gray-300">{submission.metadata.approach}</p>
                                  </div>
                                )}
                                {submission.metadata.deliverables && submission.metadata.deliverables.length > 0 && (
                                  <div>
                                    <h4 className="text-white font-semibold mb-2">Deliverables</h4>
                                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                                      {submission.metadata.deliverables.map((item, i) => (
                                        <li key={i}>{item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-blue-400 bg-blue-500/10 p-2 rounded border border-blue-500/20">
                                <strong>IPFS URI:</strong> {submission.mainUri}
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-300 break-all">{submission.mainUri}</div>
                          )}
                        </div>
                      </div>

                      {/* Evidence URIs */}
                      {submission.evidenceUris.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-gray-300 mb-2 block">
                            Evidence Files ({submission.evidenceUris.length})
                          </Label>
                          <div className="space-y-2">
                            {submission.evidenceUris.map((uri, i) => (
                              <div key={i} className="bg-black/20 border border-white/10 rounded-xl p-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-300 font-mono break-all">{uri}</span>
                                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(uri)}>
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Winners Tab */}
          <TabsContent value="winners" className="space-y-6">
            <Card className="bg-white/5 border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#E23E6B]" />
                  Select Winners and Distribute Prizes
                </CardTitle>
                <CardDescription>Choose winners from submissions and set their prize amounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!canSelectWinners ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {!isDeadlinePassed
                        ? "Winners can only be selected after the deadline passes."
                        : "This bounty is not eligible for winner selection."}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-4">
                      {winners.map((winner, index) => (
                        <div key={index} className="flex gap-4 items-end p-4 bg-white/5 rounded-2xl">
                          <div className="flex-1">
                            <Label>Winner Address</Label>
                            <Input
                              placeholder="0x..."
                              value={winner.recipient}
                              onChange={(e) => updateWinner(index, "recipient", e.target.value)}
                              className="bg-black/20 border-white/20"
                            />
                          </div>
                          <div className="w-32">
                            <Label>Prize (USDT)</Label>
                            <Input
                              type="number"
                              step="0.000001"
                              placeholder="0.00"
                              value={winner.prize}
                              onChange={(e) => updateWinner(index, "prize", e.target.value)}
                              className="bg-black/20 border-white/20"
                            />
                          </div>
                          {winners.length > 1 && (
                            <Button variant="outline" size="icon" onClick={() => removeWinner(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <Button onClick={addWinner} variant="outline" className="w-full border-white/20">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Winner
                    </Button>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Total Prizes:</span>
                          <div className="font-semibold text-white">{totalPrizes.toFixed(6)} USDT</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Max Reward:</span>
                          <div className="font-semibold text-white">{maxReward.toFixed(6)} USDT</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Remaining:</span>
                          <div className="font-semibold text-white">{(maxReward - totalPrizes).toFixed(6)} USDT</div>
                        </div>
                      </div>
                    </div>

                    {totalPrizes > maxReward && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>Total prizes exceed the bounty reward.</AlertDescription>
                      </Alert>
                    )}

                    <Dialog open={showWinnersDialog} onOpenChange={setShowWinnersDialog}>
                      <DialogTrigger asChild>
                        <Button
                          className="w-full bg-gradient-to-r from-[#E23E6B] to-[#cc4368]"
                          disabled={
                            totalPrizes > maxReward || winners.filter((w) => w.recipient && w.prize).length === 0
                          }
                        >
                          <Award className="w-4 h-4 mr-2" />
                          Select Winners & Distribute Prizes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-black border-white/20">
                        <DialogHeader>
                          <DialogTitle>Confirm Winner Selection</DialogTitle>
                          <DialogDescription>
                            This action will distribute prizes to selected winners and close the bounty. This cannot be
                            undone.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                            <h4 className="font-semibold text-yellow-400 mb-2">Winners Summary</h4>
                            {winners
                              .filter((w) => w.recipient && w.prize)
                              .map((winner, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="font-mono">{formatAddress(winner.recipient)}</span>
                                  <span>{winner.prize} USDT</span>
                                </div>
                              ))}
                            <div className="border-t border-yellow-500/20 mt-2 pt-2 flex justify-between font-semibold">
                              <span>Total Distribution:</span>
                              <span>{totalPrizes.toFixed(6)} USDT</span>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setShowWinnersDialog(false)} className="flex-1">
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSelectWinners}
                              disabled={isPending || isConfirming || isProcessing}
                              className="flex-1 bg-gradient-to-r from-[#E23E6B] to-[#cc4368]"
                            >
                              {isPending || isConfirming || isProcessing ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {isPending ? "Confirming..." : isConfirming ? "Processing..." : "Processing..."}
                                </>
                              ) : (
                                "Confirm Selection"
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-6">
            <div className="grid gap-6">
              {/* Cancel Bounty */}
              <Card className="bg-white/5 border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-400">
                    <X className="w-5 h-5" />
                    Cancel Bounty
                  </CardTitle>
                  <CardDescription>Cancel the bounty and refund remaining funds (penalty may apply)</CardDescription>
                </CardHeader>
                <CardContent>
                  {!canCancel ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {bounty.status !== 0
                          ? "This bounty has already been closed or cancelled."
                          : "Bounty cannot be cancelled after the deadline passes."}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {penalty && (
                        <Alert className="border-yellow-500/50">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <AlertDescription className="text-yellow-400">
                            Cancelling will incur a penalty of {formatUnits(penalty, 6)} USDT. This will be distributed
                            among submitters.
                          </AlertDescription>
                        </Alert>
                      )}

                      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                        <DialogTrigger asChild>
                          <Button variant="destructive" className="w-full">
                            <Ban className="w-4 h-4 mr-2" />
                            Cancel Bounty
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-black border-white/20">
                          <DialogHeader>
                            <DialogTitle className="text-red-400">Cancel Bounty</DialogTitle>
                            <DialogDescription>
                              This action will cancel the bounty and cannot be undone. Please provide a reason for
                              cancellation.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Reason for Cancellation</Label>
                              <Textarea
                                placeholder="Please explain why you're cancelling this bounty..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="bg-black/20 border-white/20"
                              />
                            </div>
                            {penalty && (
                              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                <h4 className="font-semibold text-red-400 mb-2">Cancellation Impact</h4>
                                <div className="text-sm space-y-1">
                                  <div className="flex justify-between">
                                    <span>Penalty Amount:</span>
                                    <span className="text-red-400">{formatUnits(penalty, 6)} USDT</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Refund Amount:</span>
                                    <span className="text-green-400">
                                      {formatUnits(bounty.totalReward - penalty, 6)} USDT
                                    </span>
                                  </div>
                                  <div className="flex justify-between font-semibold border-t border-red-500/20 pt-1 mt-2">
                                    <span>Total Bounty:</span>
                                    <span>{formatUnits(bounty.totalReward, 6)} USDT</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="flex gap-3">
                              <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="flex-1">
                                Keep Bounty Active
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleCancelBounty}
                                disabled={isPending || isConfirming || isProcessing || !cancelReason.trim()}
                                className="flex-1"
                              >
                                {isPending || isConfirming || isProcessing ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isPending ? "Confirming..." : isConfirming ? "Processing..." : "Processing..."}
                                  </>
                                ) : (
                                  "Confirm Cancellation"
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bounty Statistics */}
              <Card className="bg-white/5 border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-400" />
                    Bounty Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white/5 rounded-2xl">
                      <div className="text-2xl font-semibold text-[#E23E6B]">{bounty.submissionCount.toString()}</div>
                      <div className="text-sm text-gray-400">Total Submissions</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-2xl">
                      <div className="text-2xl font-semibold text-green-400">{existingWinners?.length || 0}</div>
                      <div className="text-sm text-gray-400">Winners Selected</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-2xl">
                      <div className="text-2xl font-semibold text-blue-400">{formatUnits(bounty.totalReward, 6)}</div>
                      <div className="text-sm text-gray-400">Total Reward</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-2xl">
                      <div className="text-2xl font-semibold text-purple-400">
                        {Math.ceil((Number(bounty.deadline) * 1000 - Date.now()) / (1000 * 60 * 60 * 24))}
                      </div>
                      <div className="text-sm text-gray-400">Days {isDeadlinePassed ? "Overdue" : "Remaining"}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
      <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-thin mb-2">Invalid Bounty ID</h2>
            <p className="text-gray-400 mb-6">The bounty ID provided is not valid.</p>
            <Button className="bg-gradient-to-r from-[#E23E6B] to-[#cc4368]">Back to Bounties</Button>
          </div>
        </div>
      </div>
    )
  }

  return <BountySubmissionsComponent bountyId={bountyId} />
}
