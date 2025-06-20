"use client"

import { useState, useEffect } from "react"
import { motion, type Variants } from "framer-motion"
import { Poppins } from "next/font/google"
import { cn } from "@/lib/utils"
import { AuroraText } from "@/components/magicui/aurora-text"
import { ArrowLeft, Trophy, Calendar, DollarSign, User, Target, AlertCircle, Copy, Loader2 } from "lucide-react"
import Link from "next/link"
import { useReadContract } from "wagmi"
import { formatUnits } from "viem"
import { BOUNTY_CONTRACT_ADDRESS, BOUNTY_ABI } from "@/lib/contracts"
import { getFromPinata, type PinataMetadata } from "@/lib/pinata"
import { useWallet } from "@/contexts/wallet-context"
import { useParams } from "next/navigation"

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
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
    initial: { opacity: 0, y: 20 },
    animate: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1 * index,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
    hover: {
      y: -4,
      scale: 1.01,
      transition: { duration: 0.3, ease: "easeInOut" },
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
        return "from-green-500 to-green-700"
      case 1:
        return "from-blue-500 to-blue-700"
      case 2:
        return "from-red-500 to-red-700"
      default:
        return "from-gray-500 to-gray-700"
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
              <h1 key={i} className="text-2xl font-bold mt-6 mb-3 text-white">
                {line.slice(2)}
              </h1>
            )
          }
          if (line.startsWith("## ")) {
            return (
              <h2 key={i} className="text-xl font-bold mt-5 mb-3 text-gray-200">
                {line.slice(3)}
              </h2>
            )
          }
          if (line.startsWith("### ")) {
            return (
              <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-gray-300">
                {line.slice(4)}
              </h3>
            )
          }
          if (line.startsWith("- [ ] ")) {
            return (
              <div key={i} className="flex items-center gap-2 my-2">
                <input type="checkbox" disabled className="rounded bg-white/10 border-white/20" />
                <span className="text-gray-300">{line.slice(6)}</span>
              </div>
            )
          }
          if (line.startsWith("- [x] ")) {
            return (
              <div key={i} className="flex items-center gap-2 my-2">
                <input type="checkbox" checked disabled className="rounded bg-green-500 border-green-500" />
                <span className="text-gray-300 line-through">{line.slice(6)}</span>
              </div>
            )
          }
          if (line.startsWith("- ")) {
            return (
              <li key={i} className="ml-4 my-1 text-gray-300">
                {line.slice(2)}
              </li>
            )
          }
          if (line.trim() === "---") {
            return <hr key={i} className="my-4 border-white/20" />
          }
          return line ? (
            <p key={i} className="mb-3 text-gray-300 leading-relaxed">
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
      <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-[#E23E6B] mx-auto mb-4" />
              <p className="text-gray-400">Loading bounty details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!bounty) {
    return (
      <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-thin mb-2">Bounty Not Found</h2>
            <p className="text-gray-400 mb-6">The bounty you're looking for doesn't exist.</p>
            <Link href="/dashboard/bounty">
              <motion.button
                className="px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl font-medium hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Back to Bounties
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <motion.h1
              className={cn("text-3xl md:text-4xl font-thin mb-2", poppins.className)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <AuroraText colors={["#cc4368", "#e6295c", "#ffffff", "#E23E6B"]}>
                <span className="text-transparent">Bounty Details</span>
              </AuroraText>
            </motion.h1>
            <motion.p
              className="text-gray-300/80 text-lg font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              Bounty #{bountyId}
            </motion.p>
          </div>

          <Link href="/dashboard/bounty">
            <motion.button
              className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Bounties</span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bounty Header Card */}
            <motion.div
              className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 group overflow-hidden relative"
              variants={cardVariants}
              custom={0}
              initial="initial"
              animate="animate"
              whileHover="hover"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white to-[#E23E6B] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className={cn("text-2xl font-thin mb-3", poppins.className)}>{bounty.name}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Category: {categories[bounty.category]}</span>
                      <span>•</span>
                      <span>ID: #{bounty.id.toString()}</span>
                    </div>
                  </div>
                  <div
                    className={`px-4 py-2 bg-gradient-to-r ${getStatusColor(bounty.status)} rounded-2xl text-white text-sm font-medium`}
                  >
                    {statusLabels[bounty.status]}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white/5 rounded-2xl">
                    <DollarSign className="w-6 h-6 text-[#E23E6B] mx-auto mb-2" />
                    <div className="text-lg font-medium">{formatUnits(bounty.totalReward, 6)}</div>
                    <div className="text-xs text-gray-400">USDT Reward</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-2xl">
                    <Calendar className="w-6 h-6 text-[#E23E6B] mx-auto mb-2" />
                    <div className="text-sm font-medium">{formatDate(bounty.deadline)}</div>
                    <div className="text-xs text-gray-400">Deadline</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-2xl">
                    <Target className="w-6 h-6 text-[#E23E6B] mx-auto mb-2" />
                    <div className="text-lg font-medium">{bounty.submissionCount.toString()}</div>
                    <div className="text-xs text-gray-400">Submissions</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-2xl">
                    <Trophy className="w-6 h-6 text-[#E23E6B] mx-auto mb-2" />
                    <div className="text-lg font-medium">{winners?.length || 0}</div>
                    <div className="text-xs text-gray-400">Winners</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Description Card */}
            <motion.div
              className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 group overflow-hidden relative"
              variants={cardVariants}
              custom={1}
              initial="initial"
              animate="animate"
              whileHover="hover"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white to-[#E23E6B] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className={cn("text-xl font-thin", poppins.className)}>Description</h3>
                  {bounty.description.startsWith("ipfs://") && (
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">IPFS</div>
                      {isLoadingIpfs && <Loader2 className="w-4 h-4 animate-spin text-[#E23E6B]" />}
                    </div>
                  )}
                </div>

                {isLoadingIpfs ? (
                  <div className="flex items-center gap-2 text-gray-400 py-8">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading IPFS metadata...</span>
                  </div>
                ) : ipfsError ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400">
                    <AlertCircle className="w-5 h-5 inline mr-2" />
                    {ipfsError}
                  </div>
                ) : ipfsMetadata ? (
                  <div className="space-y-4">
                    {renderMarkdown(ipfsMetadata.description)}
                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-400">IPFS URI:</span>
                        <button
                          onClick={() => copyToClipboard(bounty.description)}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>
                      </div>
                      <div className="font-mono text-xs text-blue-300 mt-1 break-all">{bounty.description}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-300 leading-relaxed">{bounty.description}</p>
                )}
              </div>
            </motion.div>

            {/* Submissions */}
            {submissions && submissions.length > 0 && (
              <motion.div
                className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 group overflow-hidden relative"
                variants={cardVariants}
                custom={2}
                initial="initial"
                animate="animate"
                whileHover="hover"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white to-[#E23E6B] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl"></div>
                <div className="relative z-10">
                  <h3 className={cn("text-xl font-thin mb-6", poppins.className)}>
                    Submissions ({submissions.length})
                  </h3>
                  <div className="space-y-4">
                    {submissions.map((submission: any, index: number) => (
                      <div key={index} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <div className="flex justify-between items-start mb-3">
                          <div className="font-mono text-sm text-gray-300">
                            {submission.submitter.slice(0, 6)}...{submission.submitter.slice(-4)}
                          </div>
                          <div className="text-xs text-gray-400">{formatDate(submission.timestamp)}</div>
                        </div>
                        <div className="text-sm">
                          <div className="text-gray-400 mb-1">Main URI:</div>
                          <div className="text-blue-400 break-all">{submission.mainUri}</div>
                        </div>
                        {submission.evidenceUris.length > 0 && (
                          <div className="mt-3 text-sm">
                            <div className="text-gray-400 mb-1">Evidence:</div>
                            <ul className="space-y-1">
                              {submission.evidenceUris.map((uri: string, i: number) => (
                                <li key={i} className="text-blue-400 break-all text-xs">
                                  {uri}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Creator Info */}
            <motion.div
              className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-6 group overflow-hidden relative"
              variants={cardVariants}
              custom={3}
              initial="initial"
              animate="animate"
              whileHover="hover"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white to-[#E23E6B] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl"></div>
              <div className="relative z-10">
                <h3 className={cn("text-lg font-thin mb-4", poppins.className)}>Creator</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-mono text-sm">
                      {bounty.creator.slice(0, 6)}...{bounty.creator.slice(-4)}
                    </div>
                    <div className="text-xs text-gray-400">Bounty Creator</div>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(bounty.creator)}
                  className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors duration-200"
                >
                  <Copy className="w-4 h-4" />
                  Copy Address
                </button>
              </div>
            </motion.div>

            {/* Winners */}
            {winners && winners.length > 0 && (
              <motion.div
                className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-6 group overflow-hidden relative"
                variants={cardVariants}
                custom={4}
                initial="initial"
                animate="animate"
                whileHover="hover"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white to-[#E23E6B] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl"></div>
                <div className="relative z-10">
                  <h3 className={cn("text-lg font-thin mb-4", poppins.className)}>Winners</h3>
                  <div className="space-y-3">
                    {winners.map((winner: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                        <div className="font-mono text-sm">
                          {winner.recipient.slice(0, 6)}...{winner.recipient.slice(-4)}
                        </div>
                        <div className="text-[#E23E6B] font-medium">{formatUnits(winner.prize, 6)} USDT</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Button */}
            {isConnected && bounty.status === 0 && (
              <motion.div
                className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-6 group overflow-hidden relative"
                variants={cardVariants}
                custom={5}
                initial="initial"
                animate="animate"
                whileHover="hover"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white to-[#E23E6B] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl"></div>
                <div className="relative z-10">
                  <h3 className={cn("text-lg font-thin mb-4", poppins.className)}>Take Action</h3>
                  <motion.button
                    className="w-full px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Submit to Bounty
                  </motion.button>
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
      <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-thin mb-2">Invalid Bounty ID</h2>
            <p className="text-gray-400 mb-6">The bounty ID provided is not valid.</p>
            <Link href="/dashboard/bounty">
              <motion.button
                className="px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl font-medium hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Back to Bounties
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    )
  }
     
  return <SingleBounty bountyId={bountyId} />
}