"use client"

import { useState, useEffect } from "react"
import { motion, type Variants } from "framer-motion"
import { Poppins } from "next/font/google"
import { cn } from "@/lib/utils"
import { AuroraText } from "@/components/magicui/aurora-text"
import {
  Plus,
  Search,
  DollarSign,
  User,
  Trophy,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Eye,
  CheckCircle,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { useReadContract } from "wagmi"
import { formatUnits } from "viem"
import { BOUNTY_CONTRACT_ADDRESS, BOUNTY_ABI } from "@/lib/contracts"
import { getFromPinata, type PinataMetadata } from "@/lib/pinata"
import { useWallet } from "@/contexts/wallet-context"
import { WalletDisplay } from "@/components/ui/wallet-display"
import { WalletConnectModal } from "@/components/wallet-connect-module"

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
})

const categories = ["Content", "Development", "Design", "Research", "Marketing", "Other"]
const statusLabels = ["Open", "Closed", "Cancelled"]
const categoryEmojis = ["📝", "🛠️", "🎨", "🔍", "📢", "⚡"]

interface BountyCardProps {
  bountyId: number
  index: number
}

function BountyCard({ bountyId, index }: BountyCardProps) {
  const [metadata, setMetadata] = useState<PinataMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
      y: -12,
      scale: 1.03,
      transition: { duration: 0.4, ease: "easeInOut" },
    },
  }

  const { data: bounty } = useReadContract({
    address: BOUNTY_CONTRACT_ADDRESS,
    abi: BOUNTY_ABI,
    functionName: "getBounty",
    args: [BigInt(bountyId)],
  })

  const fetchIpfsMetadata = async (description: string) => {
    try {
      const metadata = await getFromPinata(description)
      setMetadata(metadata)
    } catch (error) {
      console.error("Failed to fetch IPFS metadata:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (bounty && bounty.description) {
      fetchIpfsMetadata(bounty.description)
    }
  }, [bounty])

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return "text-green-400 bg-green-400/10 border-green-400/20"
      case 1:
        return "text-blue-400 bg-blue-400/10 border-blue-400/20"
      case 2:
        return "text-red-400 bg-red-400/10 border-red-400/20"
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20"
    }
  }

  const getDaysLeft = (timestamp: bigint) => {
    const now = new Date()
    const deadline = new Date(Number(timestamp) * 1000)
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (!bounty || bounty.creator === "0x0000000000000000000000000000000000000000") {
    return null
  }

  const daysLeft = getDaysLeft(bounty.deadline)

  return (
    <motion.div
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 group overflow-hidden relative hover:border-white/20 transition-all duration-500"
      variants={cardVariants}
      custom={index}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-[#E23E6B]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>

      {/* Glow effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#E23E6B]/20 to-[#cc4368]/20 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>

      <div className="relative z-10">
        {/* Header with category and status */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors duration-300">
              <span className="text-2xl">{categoryEmojis[Number(bounty.category)]}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-white/90">{categories[Number(bounty.category)]}</span>
              <div className="text-xs text-gray-400 mt-0.5">#{bountyId}</div>
            </div>
          </div>
          <div
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${getStatusColor(Number(bounty.status))}`}
          >
            {statusLabels[Number(bounty.status)]}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-xl mb-3 line-clamp-2 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#E23E6B] transition-all duration-300">
          {metadata?.name || `Bounty #${bountyId}`}
        </h3>

        {/* Description */}
        <p className="text-gray-300 text-sm mb-6 line-clamp-3 leading-relaxed">
          {metadata?.description || "Loading description..."}
        </p>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 group-hover:border-white/20 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Reward</span>
            </div>
            <div className="text-white font-semibold text-lg">{formatUnits(bounty.totalReward, 6)} USDT</div>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 group-hover:border-white/20 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Deadline</span>
            </div>
            <div className="text-white font-semibold text-sm">{formatDate(bounty.deadline)}</div>
            <div
              className={`text-xs mt-1 ${daysLeft > 7 ? "text-green-400" : daysLeft > 3 ? "text-yellow-400" : "text-red-400"}`}
            >
              {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
            </div>
          </div>
        </div>

        {/* Creator info */}
        <div className="flex items-center gap-2 mb-6 p-3 bg-white/5 rounded-2xl border border-white/10">
          <div className="w-8 h-8 bg-gradient-to-br from-[#E23E6B] to-[#cc4368] rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs text-gray-400">Created by</div>
            <div className="text-sm text-white font-medium">
              {`${bounty.creator.slice(0, 6)}...${bounty.creator.slice(-4)}`}
            </div>
          </div>
        </div>

        {/* Enhanced Action Button */}
        <Link href={`/dashboard/bounties/${bountyId}`}>
          <motion.button
            className="w-full py-4 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-lg hover:shadow-xl group/btn relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center gap-2">
              <Eye className="w-4 h-4" />
              <span>View Details</span>
              <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
            </div>
          </motion.button>
        </Link>
      </div>
    </motion.div>
  )
}

function Bounties() {
  const { address, isConnected } = useWallet()
  const [bountyIds, setBountyIds] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [showWalletModal, setShowWalletModal] = useState(false)

  const { data: nextBountyId } = useReadContract({
    address: BOUNTY_CONTRACT_ADDRESS,
    abi: BOUNTY_ABI,
    functionName: "nextBountyId",
  })

  useEffect(() => {
    if (nextBountyId !== undefined) {
      const ids = Array.from({ length: Number(nextBountyId) - 1 }, (_, i) => i + 1)
      setBountyIds(ids.reverse()) // Show newest first
    }
  }, [nextBountyId])

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
      y: -8,
      scale: 1.02,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  }

  const statsData = [
    {
      label: "Total Bounties",
      value: nextBountyId ? (Number(nextBountyId) - 1).toString() : "0",
      icon: Trophy,
      color: "from-[#E23E6B] to-[#cc4368]",
    },
    { label: "Active Bounties", value: "8", icon: CheckCircle, color: "from-green-500 to-green-700" },
    { label: "Total Rewards", value: "$12.5K", icon: DollarSign, color: "from-yellow-500 to-yellow-700" },
    { label: "Participants", value: "156", icon: User, color: "from-blue-500 to-blue-700" },
  ]

  return (
    <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <motion.h1
              className={cn("text-3xl md:text-4xl lg:text-5xl font-thin mb-3", poppins.className)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <AuroraText colors={["#cc4368", "#e6295c", "#ffffff", "#E23E6B"]}>
                <span className="text-transparent">Bounty Marketplace</span>
              </AuroraText>
            </motion.h1>
            <motion.p
              className="text-gray-300/80 text-xl font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              Discover and participate in Web3 bounties
            </motion.p>
          </div>

          <div className="flex justify-end items-center gap-4 mt-6 lg:mt-0">
            <div className="flex items-center gap-4">
              <WalletDisplay />
              <Link href="/dashboard">
                <motion.button
                  className="flex items-center space-x-3 px-6 py-3 bg-white/10 border border-white/20 text-white font-medium rounded-2xl hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </motion.button>
              </Link>

              <Link href="/dashboard/bounties/post">
                <motion.button
                  className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-3xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Bounty</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {statsData.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <motion.div
                key={index}
                className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-center group overflow-hidden relative"
                variants={cardVariants}
                custom={index}
                whileHover="hover"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white to-[#E23E6B] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl"></div>
                <div className="relative z-10">
                  <div
                    className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}
                  >
                    <IconComponent className="w-6 h-6 text-white" strokeWidth={1.5} />
                  </div>
                  <div
                    className={cn(
                      "text-2xl font-thin mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-t group-hover:from-white group-hover:to-[#E23E6B] transition-colors duration-300",
                      poppins.className,
                    )}
                  >
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-300/80 font-light">{stat.label}</div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Filters */}
        <motion.div
          className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-6 mb-8 group overflow-hidden relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white to-[#E23E6B] opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-3xl"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bounties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
              >
                <option value="all">All Categories</option>
                {categories.map((category, index) => (
                  <option key={index} value={index.toString()}>
                    {categoryEmojis[index]} {category}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
              >
                <option value="all">All Status</option>
                <option value="0">Open</option>
                <option value="1">Closed</option>
                <option value="2">Cancelled</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Bounties Grid */}
        {bountyIds.length > 0 ? (
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {bountyIds.map((bountyId, index) => (
              <BountyCard key={bountyId} bountyId={bountyId} index={index} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className={cn("text-xl font-thin mb-2", poppins.className)}>No Bounties Found</h3>
            <p className="text-gray-400 mb-6">Be the first to create a bounty on the platform!</p>
            <Link href="dashboard/bounties/create">
              <motion.button
                className="px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl font-medium hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Create First Bounty
              </motion.button>
            </Link>
          </motion.div>
        )}

        {/* Connect Wallet CTA */}
        {!isConnected && (
          <motion.div
            className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center mt-12 group overflow-hidden relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white to-[#E23E6B] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl"></div>
            <div className="relative z-10">
              <AlertCircle className="w-12 h-12 text-[#E23E6B] mx-auto mb-4" />
              <h3 className={cn("text-xl font-thin mb-2", poppins.className)}>Connect Your Wallet</h3>
              <p className="text-gray-400 mb-6">
                Connect your wallet to create bounties and participate in the ecosystem.
              </p>
              <motion.button
                onClick={() => setShowWalletModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl font-medium hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Connect Wallet
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      <WalletConnectModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </div>
  )
}

export default Bounties
