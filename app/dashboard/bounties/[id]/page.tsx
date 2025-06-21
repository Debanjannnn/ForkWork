"use client"

import { useState, useEffect } from "react"
import { motion, type Variants } from "framer-motion"
import { Poppins } from "next/font/google"
import { cn } from "@/lib/utils"
import { AuroraText } from "@/components/magicui/aurora-text"
import {
  ArrowLeft,
  Trophy,
  Calendar,
  DollarSign,
  User,
  Target,
  AlertCircle,
  Copy,
  Loader2,
  Clock,
  Award,
  Users,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { useReadContract } from "wagmi"
import { formatUnits } from "viem"
import { BOUNTY_CONTRACT_ADDRESS, BOUNTY_ABI } from "@/lib/contracts"
import { getFromPinata, type PinataMetadata } from "@/lib/pinata"
import { useWallet } from "@/contexts/wallet-context"
import { useParams } from "next/navigation"
import { WalletDisplay } from "@/components/ui/wallet-display"

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
})

const categories = ["Content", "Development", "Design", "Research", "Marketing", "Other"]
const statusLabels = ["Open", "Closed", "Cancelled"]

function SingleBounty({ bountyId }: { bountyId: string }) {
  const { address, isConnected } = useWallet()
  const [ipfsMetadata, setIpfsMetadata] = useState<PinataMetadata | null>(null)
  const [isLoadingIpfs, setIsLoadingIpfs] = useState(false)
  const [ipfsError, setIpfsError] = useState<string>("")

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

  const { data: bounty, isLoading } = useReadContract({
    address: BOUNTY_CONTRACT_ADDRESS,
    abi: BOUNTY_ABI,
    functionName: "getBounty",
    args: [BigInt(bountyId)],
  })

  const { data: submissions } = useReadContract({
    address: BOUNTY_CONTRACT_ADDRESS,
    abi: BOUNTY_ABI,
    functionName: "getBountySubmissions",
    args: [BigInt(bountyId)],
  })

  const { data: winners } = useReadContract({
    address: BOUNTY_CONTRACT_ADDRESS,
    abi: BOUNTY_ABI,
    functionName: "getBountyWinners",
    args: [BigInt(bountyId)],
  })

  const fetchIpfsMetadata = async (description: string) => {
    if (!description.startsWith("ipfs://")) return

    setIsLoadingIpfs(true)
    setIpfsError("")
    try {
      const metadata = await getFromPinata(description)
      setIpfsMetadata(metadata)
    } catch (error) {
      setIpfsError(`Failed to load IPFS metadata: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoadingIpfs(false)
    }
  }

  useEffect(() => {
    if (bounty && bounty.description) {
      fetchIpfsMetadata(bounty.description)
    }
  }, [bounty])

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return "from-emerald-500 to-green-600"
      case 1:
        return "from-blue-500 to-indigo-600"
      case 2:
        return "from-red-500 to-rose-600"
      default:
        return "from-gray-500 to-slate-600"
    }
  }

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 0:
        return <Target className="w-4 h-4" />
      case 1:
        return <Award className="w-4 h-4" />
      case 2:
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const renderMarkdown = (markdown: string) => {
    return (
      <div className="prose prose-invert prose-sm max-w-none">
        {markdown.split("\n").map((line, i) => {
          if (line.startsWith("# ")) {
            return (
              <h1
                key={i}
                className="text-2xl font-bold mt-8 mb-4 text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text"
              >
                {line.slice(2)}
              </h1>
            )
          }
          if (line.startsWith("## ")) {
            return (
              <h2 key={i} className="text-xl font-semibold mt-6 mb-3 text-gray-200">
                {line.slice(3)}
              </h2>
            )
          }
          if (line.startsWith("### ")) {
            return (
              <h3 key={i} className="text-lg font-medium mt-5 mb-2 text-gray-300">
                {line.slice(4)}
              </h3>
            )
          }
          if (line.startsWith("- [ ] ")) {
            return (
              <div key={i} className="flex items-center gap-3 my-3 p-2 rounded-lg bg-white/5">
                <input type="checkbox" disabled className="rounded bg-white/10 border-white/20" />
                <span className="text-gray-300">{line.slice(6)}</span>
              </div>
            )
          }
          if (line.startsWith("- [x] ")) {
            return (
              <div key={i} className="flex items-center gap-3 my-3 p-2 rounded-lg bg-green-500/10">
                <input type="checkbox" checked disabled className="rounded bg-green-500 border-green-500" />
                <span className="text-gray-300 line-through">{line.slice(6)}</span>
              </div>
            )
          }
          if (line.startsWith("- ")) {
            return (
              <li key={i} className="ml-6 my-2 text-gray-300 list-disc">
                {line.slice(2)}
              </li>
            )
          }
          if (line.trim() === "---") {
            return <hr key={i} className="my-6 border-white/20" />
          }
          return line ? (
            <p key={i} className="mb-4 text-gray-300 leading-relaxed">
              {line}
            </p>
          ) : (
            <br key={i} />
          )
        })}
      </div>
    )
  }

  if (isLoading) {
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
              <h3 className="text-xl font-medium mb-2">Loading Bounty Details</h3>
              <p className="text-gray-400">Please wait while we fetch the bounty information...</p>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  if (!bounty) {
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
              <Link href="/dashboard/bounty">
                <motion.button
                  className="px-8 py-4 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl font-medium hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Back to Bounties
                </motion.button>
              </Link>
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
              <div
                className={`px-4 py-2 bg-gradient-to-r ${getStatusColor(bounty.status)} rounded-full text-white text-sm font-medium flex items-center gap-2`}
              >
                {getStatusIcon(bounty.status)}
                {statusLabels[bounty.status]}
              </div>
            </motion.div>

            <motion.h1
              className={cn("text-4xl md:text-5xl lg:text-6xl font-light mb-4", poppins.className)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <AuroraText colors={["#cc4368", "#e6295c", "#ffffff", "#E23E6B"]}>
                <span className="text-transparent">Bounty Details</span>
              </AuroraText>
            </motion.h1>

            <motion.p
              className="text-gray-300/80 text-xl font-light max-w-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              Explore the complete details, requirements, and submissions for this bounty opportunity.
            </motion.p>
          </div>

          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <WalletDisplay />
            <Link href="/dashboard/bounties">
              <motion.button
                className="flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium rounded-2xl hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Bounties</span>
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bounty Header Card */}
            <motion.div
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 group overflow-hidden relative shadow-2xl"
              variants={cardVariants}
              custom={0}
              initial="initial"
              animate="animate"
              whileHover="hover"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#E23E6B]/10 to-[#cc4368]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex-1">
                    <h2 className={cn("text-3xl font-light mb-4 text-white", poppins.className)}>{bounty.name}</h2>
                    <div className="flex items-center gap-6 text-gray-400">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#E23E6B]" />
                        <span className="font-medium">{categories[bounty.category]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-[#E23E6B]" />
                        <span>ID #{bounty.id.toString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

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
                    <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-full flex items-center justify-center group-hover/stat:scale-110 transition-transform duration-300">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-sm font-semibold mb-1">{formatDate(bounty.deadline)}</div>
                    <div className="text-sm text-gray-400 font-medium">Deadline</div>
                  </motion.div>

                  <motion.div
                    className="text-center p-6 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/10 group/stat hover:border-[#E23E6B]/30 transition-all duration-300"
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-full flex items-center justify-center group-hover/stat:scale-110 transition-transform duration-300">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-semibold mb-1">{bounty.submissionCount.toString()}</div>
                    <div className="text-sm text-gray-400 font-medium">Submissions</div>
                  </motion.div>

                  <motion.div
                    className="text-center p-6 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/10 group/stat hover:border-[#E23E6B]/30 transition-all duration-300"
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-full flex items-center justify-center group-hover/stat:scale-110 transition-transform duration-300">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-semibold mb-1">{winners?.length || 0}</div>
                    <div className="text-sm text-gray-400 font-medium">Winners</div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Description Card */}
            <motion.div
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 group overflow-hidden relative shadow-2xl"
              variants={cardVariants}
              custom={1}
              initial="initial"
              animate="animate"
              whileHover="hover"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#E23E6B]/10 to-[#cc4368]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className={cn("text-2xl font-light flex items-center gap-3", poppins.className)}>
                    <FileText className="w-6 h-6 text-[#E23E6B]" />
                    Description
                  </h3>
                  {bounty.description.startsWith("ipfs://") && (
                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium border border-blue-500/30">
                        IPFS Content
                      </div>
                      {isLoadingIpfs && (
                        <div className="w-8 h-8 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-full flex items-center justify-center">
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isLoadingIpfs ? (
                  <div className="flex items-center gap-4 text-gray-400 py-12 justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#E23E6B]" />
                    <span className="text-lg">Loading IPFS metadata...</span>
                  </div>
                ) : ipfsError ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Error Loading Content</span>
                    </div>
                    <p className="text-sm">{ipfsError}</p>
                  </div>
                ) : ipfsMetadata ? (
                  <div className="space-y-6">
                    <div className="bg-white/5 rounded-2xl p-6">{renderMarkdown(ipfsMetadata.description)}</div>
                    <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-blue-400">IPFS URI</span>
                        <button
                          onClick={() => copyToClipboard(bounty.description)}
                          className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-blue-500/10 transition-colors duration-200"
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </button>
                      </div>
                      <div className="font-mono text-sm text-blue-300 break-all bg-blue-500/5 p-3 rounded-lg">
                        {bounty.description}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-2xl p-6">
                    <p className="text-gray-300 leading-relaxed text-lg">{bounty.description}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Submissions */}
            {submissions && submissions.length > 0 && (
              <motion.div
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 group overflow-hidden relative shadow-2xl"
                variants={cardVariants}
                custom={2}
                initial="initial"
                animate="animate"
                whileHover="hover"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#E23E6B]/10 to-[#cc4368]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                <div className="relative z-10">
                  <h3 className={cn("text-2xl font-light mb-8 flex items-center gap-3", poppins.className)}>
                    <Users className="w-6 h-6 text-[#E23E6B]" />
                    Submissions ({submissions.length})
                  </h3>
                  <div className="space-y-4">
                    {submissions.map((submission: any, index: number) => (
                      <motion.div
                        key={index}
                        className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-[#E23E6B]/30 transition-all duration-300 group/submission"
                        whileHover={{ scale: 1.02, y: -2 }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-mono text-sm text-white font-medium">
                                {submission.submitter.slice(0, 8)}...{submission.submitter.slice(-6)}
                              </div>
                              <div className="text-xs text-gray-400">Submitter</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-300">{formatDate(submission.timestamp)}</div>
                            <div className="text-xs text-gray-400">Submitted</div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="bg-white/5 rounded-lg p-4">
                            <div className="text-sm text-gray-400 mb-2 font-medium">Main Submission</div>
                            <div className="text-blue-400 break-all text-sm font-mono bg-blue-500/10 p-2 rounded">
                              {submission.mainUri}
                            </div>
                          </div>

                          {submission.evidenceUris.length > 0 && (
                            <div className="bg-white/5 rounded-lg p-4">
                              <div className="text-sm text-gray-400 mb-3 font-medium">
                                Evidence Files ({submission.evidenceUris.length})
                              </div>
                              <div className="space-y-2">
                                {submission.evidenceUris.map((uri: string, i: number) => (
                                  <div
                                    key={i}
                                    className="text-blue-400 break-all text-xs font-mono bg-blue-500/10 p-2 rounded"
                                  >
                                    {uri}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Creator Info */}
            <motion.div
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 group overflow-hidden relative shadow-2xl"
              variants={cardVariants}
              custom={3}
              initial="initial"
              animate="animate"
              whileHover="hover"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#E23E6B]/10 to-[#cc4368]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              <div className="relative z-10">
                <h3 className={cn("text-xl font-light mb-6 flex items-center gap-3", poppins.className)}>
                  <User className="w-5 h-5 text-[#E23E6B]" />
                  Creator
                </h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-full flex items-center justify-center">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-mono text-sm font-medium mb-1">
                      {bounty.creator.slice(0, 8)}...{bounty.creator.slice(-6)}
                    </div>
                    <div className="text-xs text-gray-400">Bounty Creator</div>
                  </div>
                </div>
                <motion.button
                  onClick={() => copyToClipboard(bounty.creator)}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-200 border border-white/10 hover:border-[#E23E6B]/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Copy className="w-4 h-4" />
                  Copy Address
                </motion.button>
              </div>
            </motion.div>

            {/* Winners */}
            {winners && winners.length > 0 && (
              <motion.div
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 group overflow-hidden relative shadow-2xl"
                variants={cardVariants}
                custom={4}
                initial="initial"
                animate="animate"
                whileHover="hover"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#E23E6B]/10 to-[#cc4368]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                <div className="relative z-10">
                  <h3 className={cn("text-xl font-light mb-6 flex items-center gap-3", poppins.className)}>
                    <Trophy className="w-5 h-5 text-[#E23E6B]" />
                    Winners
                  </h3>
                  <div className="space-y-4">
                    {winners.map((winner: any, index: number) => (
                      <motion.div
                        key={index}
                        className="flex justify-between items-center p-4 bg-gradient-to-r from-white/10 to-white/5 rounded-xl border border-white/10 hover:border-[#E23E6B]/30 transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                            <Trophy className="w-4 h-4 text-white" />
                          </div>
                          <div className="font-mono text-sm">
                            {winner.recipient.slice(0, 6)}...{winner.recipient.slice(-4)}
                          </div>
                        </div>
                        <div className="text-[#E23E6B] font-semibold">{formatUnits(winner.prize, 6)} USDT</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Button */}
            {isConnected && bounty.status === 0 && (
              <motion.div
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 group overflow-hidden relative shadow-2xl"
                variants={cardVariants}
                custom={5}
                initial="initial"
                animate="animate"
                whileHover="hover"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#E23E6B]/10 to-[#cc4368]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                <div className="relative z-10">
                  <h3 className={cn("text-xl font-light mb-6 flex items-center gap-3", poppins.className)}>
                    <Target className="w-5 h-5 text-[#E23E6B]" />
                    Take Action
                  </h3>
                  <Link href={`/dashboard/bounties/${bountyId}/submit`}>
                    <motion.button
                      className="w-full px-6 py-4 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Target className="w-5 h-5" />
                      Submit to Bounty
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BountyPage() {
  const params = useParams()
  const bountyId = params?.id as string

  // Handle case where bountyId is undefined or invalid
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
              <Link href="/dashboard/bounty">
                <motion.button
                  className="px-8 py-4 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl font-medium hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Back to Bounties
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  return <SingleBounty bountyId={bountyId} />
}
