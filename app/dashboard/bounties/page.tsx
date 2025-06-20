"use client"

import { useState, useEffect } from "react"
import { motion, type Variants } from "framer-motion"
import { Poppins } from "next/font/google"
import { cn } from "@/lib/utils"
import { AuroraText } from "@/components/magicui/aurora-text"
import {
  Plus,
  Search,
  Calendar,
  DollarSign,
  User,
  Target,
  Trophy,
  AlertCircle,
  Loader2,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { useReadContract } from "wagmi"
import { formatUnits } from "viem"
import { BOUNTY_CONTRACT_ADDRESS, BOUNTY_ABI } from "@/lib/contracts"
import { getFromPinata, type PinataMetadata } from "@/lib/pinata"
import { useWallet } from "@/contexts/wallet-context"

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
  const [ipfsMetadata, setIpfsMetadata] = useState<PinataMetadata | null>(null)
  const [isLoadingIpfs, setIsLoadingIpfs] = useState(false)

  const cardVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1 * index,
        duration: 0.5,
        ease: "easeOut",
      },
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  }

  const { data: bounty, isLoading } = useReadContract({
    address: BOUNTY_CONTRACT_ADDRESS,
    abi: BOUNTY_ABI,
    functionName: "getBounty",
    args: [BigInt(bountyId)],
  })

  const fetchIpfsMetadata = async (description: string) => {
    if (!description.startsWith("ipfs://")) return

    setIsLoadingIpfs(true)
    try {
      const metadata = await getFromPinata(description)
      setIpfsMetadata(metadata)
    } catch (error) {
      console.error("IPFS fetch error:", error)
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
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
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

  const isDeadlinePassed = bounty && Date.now() > Number(bounty.deadline) * 1000

  if (isLoading) {
    return (
      <motion.div
        className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-6 group overflow-hidden relative"
        variants={cardVariants}
        initial="initial"
        animate="animate"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#E23E6B]" />
        </div>
      </motion.div>
    )
  }

  if (!bounty || bounty.creator === "0x0000000000000000000000000000000000000000") {
    return null
  }

  return (
    <motion.div
      className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-6 group overflow-hidden relative cursor-pointer"
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white to-[#E23E6B] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{categoryEmojis[bounty.category]}</div>
            <div>
              <h3 className={cn("text-lg font-medium line-clamp-1", poppins.className)}>
                {ipfsMetadata?.name || bounty.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>#{bounty.id.toString()}</span>
                <span>•</span>
                <span>{categories[bounty.category]}</span>
              </div>
            </div>
          </div>
          <div
            className={`px-3 py-1 bg-gradient-to-r ${getStatusColor(bounty.status)} rounded-full text-white text-xs font-medium`}
          >
            {statusLabels[bounty.status]}
          </div>
        </div>

        {/* Description Preview */}
        <div className="mb-4">
          {isLoadingIpfs ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading description...</span>
            </div>
          ) : (
            <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">
              {ipfsMetadata?.description.split("\n")[0] || bounty.description}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white/5 rounded-2xl p-3 text-center">
            <DollarSign className="w-4 h-4 text-[#E23E6B] mx-auto mb-1" />
            <div className="text-sm font-medium">{formatUnits(bounty.totalReward, 6)}</div>
            <div className="text-xs text-gray-400">USDT</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 text-center">
            <Target className="w-4 h-4 text-[#E23E6B] mx-auto mb-1" />
            <div className="text-sm font-medium">{bounty.submissionCount.toString()}</div>
            <div className="text-xs text-gray-400">Submissions</div>
          </div>
        </div>

        {/* Deadline */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(bounty.deadline)}</span>
          </div>
          {isDeadlinePassed && bounty.status === 0 && (
            <div className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">Expired</div>
          )}
        </div>

        {/* Creator */}
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
          <User className="w-4 h-4" />
          <span className="font-mono">
            {bounty.creator.slice(0, 6)}...{bounty.creator.slice(-4)}
          </span>
        </div>

        {/* Action Button */}
        <Link href={`/dashboard/bounties/${bounty.id}`}>
          <motion.div
            className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10 hover:border-[#E23E6B]/50 transition-all duration-300 group/button"
            whileHover={{ x: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <span className="text-gray-300 group-hover/button:text-white transition-colors duration-300 font-medium text-sm">
              View Details
            </span>
            <ChevronRight className="w-4 h-4 text-[#E23E6B] group-hover/button:text-white transition-colors duration-300" />
          </motion.div>
        </Link>
      </div>
    </motion.div>
  )
}

function Bounties() {
  const { address, isConnected } = useWallet()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [bountyIds, setBountyIds] = useState<number[]>([])

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

  // Get next bounty ID to determine how many bounties exist
  const { data: nextBountyId } = useReadContract({
    address: BOUNTY_CONTRACT_ADDRESS,
    abi: BOUNTY_ABI,
    functionName: "nextBountyId",
  })

  useEffect(() => {
    if (nextBountyId) {
      const ids = []
      const totalBounties = Number(nextBountyId) - 1
      // Show latest bounties first
      for (let i = totalBounties; i >= 1; i--) {
        ids.push(i)
      }
      setBountyIds(ids)
    }
  }, [nextBountyId])

  const statsData = [
    {
      label: "Total Bounties",
      value: nextBountyId ? (Number(nextBountyId) - 1).toString() : "0",
      icon: Trophy,
      color: "from-[#E23E6B] to-[#cc4368]",
    },
    {
      label: "Active Bounties",
      value: "12",
      icon: Target,
      color: "from-green-500 to-green-700",
    },
    {
      label: "Total Rewards",
      value: "$2.4K",
      icon: DollarSign,
      color: "from-blue-500 to-blue-700",
    },
    {
      label: "Participants",
      value: "156",
      icon: User,
      color: "from-purple-500 to-purple-700",
    },
  ]

  return (
    <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex flex-col lg:flex-row lg:items-center justify-between mb-12"
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

          <Link href="/dashboard/bounties/post">
            <motion.button
              className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-3xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-lg hover:shadow-xl mt-6 lg:mt-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" />
              <span>Create Bounty</span>
            </motion.button>
          </Link>
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
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
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
    </div>
  )
}

export default Bounties;