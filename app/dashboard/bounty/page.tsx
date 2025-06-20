"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Poppins } from "next/font/google"
import { cn } from "@/lib/utils"
import { AuroraText } from "@/components/magicui/aurora-text"
import {
  ArrowLeft,
  Search,
  Trophy,
  Star,
  Users,
  Target,
  Zap,
  Shield,
  ChevronRight,
  Code,
  Palette,
  Megaphone,
  BarChart3,
  Calendar,
  Award,
  DollarSign,
  Timer,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
})

type Bounty = {
  id: string
  title: string
  description: string
  company: string
  companyRating: number
  prize: string
  totalPrize: string
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert"
  timeLeft: string
  category: string
  skills: string[]
  participants: number
  maxParticipants: number
  requirements: string[]
  deliverables: string[]
  isHot: boolean
  isGuaranteed: boolean
  postedDate: string
  status: "Active" | "Ending Soon" | "Completed"
}

export default function BountyFirst() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedDifficulty, setSelectedDifficulty] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  // Animation variants
  const cardVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
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
      y: -5,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  }

  const categories = [
    { name: "All", icon: Trophy, count: 18 },
    { name: "Development", icon: Code, count: 8 },
    { name: "Design", icon: Palette, count: 5 },
    { name: "Marketing", icon: Megaphone, count: 3 },
    { name: "Analytics", icon: BarChart3, count: 2 },
  ]

  const difficulties = ["All", "Beginner", "Intermediate", "Advanced", "Expert"]

  const bounties: Bounty[] = [
    {
      id: "1",
      title: "Build a Cross-Chain Bridge Interface",
      description:
        "Create a user-friendly interface for our cross-chain bridge protocol. Must handle multiple blockchain networks and provide real-time transaction status.",
      company: "Bridge Protocol",
      companyRating: 4.9,
      prize: "$3,000",
      totalPrize: "$10,000",
      difficulty: "Advanced",
      timeLeft: "5 days",
      category: "Development",
      skills: ["React", "Web3.js", "Cross-chain", "TypeScript"],
      participants: 23,
      maxParticipants: 50,
      requirements: [
        "Experience with cross-chain protocols",
        "React/Next.js proficiency",
        "Web3 integration experience",
        "Portfolio of previous work",
      ],
      deliverables: [
        "Complete UI/UX implementation",
        "Integration with bridge API",
        "Responsive design",
        "Documentation and testing",
      ],
      isHot: true,
      isGuaranteed: true,
      postedDate: "3 days ago",
      status: "Active",
    },
    {
      id: "2",
      title: "NFT Collection Landing Page Design",
      description:
        "Design a stunning landing page for our upcoming NFT collection launch. Should capture the essence of digital art and Web3 aesthetics.",
      company: "ArtChain Studios",
      companyRating: 4.7,
      prize: "$1,500",
      totalPrize: "$5,000",
      difficulty: "Intermediate",
      timeLeft: "12 hours",
      category: "Design",
      skills: ["UI/UX Design", "Figma", "NFT Design", "Web3 Aesthetics"],
      participants: 31,
      maxParticipants: 40,
      requirements: [
        "Strong portfolio in Web3 design",
        "Experience with NFT projects",
        "Figma proficiency",
        "Understanding of crypto culture",
      ],
      deliverables: [
        "High-fidelity mockups",
        "Interactive prototype",
        "Design system components",
        "Mobile responsive designs",
      ],
      isHot: true,
      isGuaranteed: true,
      postedDate: "1 day ago",
      status: "Ending Soon",
    },
    {
      id: "3",
      title: "DeFi Yield Farming Calculator",
      description:
        "Build a comprehensive calculator for yield farming strategies across multiple DeFi protocols. Include APY calculations and risk assessments.",
      company: "DeFi Analytics",
      companyRating: 4.8,
      prize: "$2,500",
      totalPrize: "$8,000",
      difficulty: "Expert",
      timeLeft: "2 weeks",
      category: "Development",
      skills: ["DeFi", "JavaScript", "APIs", "Financial Calculations"],
      participants: 15,
      maxParticipants: 30,
      requirements: [
        "Deep understanding of DeFi protocols",
        "Experience with financial calculations",
        "API integration skills",
        "Knowledge of yield farming strategies",
      ],
      deliverables: [
        "Functional calculator interface",
        "Multi-protocol integration",
        "Risk assessment algorithms",
        "Real-time data updates",
      ],
      isHot: false,
      isGuaranteed: true,
      postedDate: "5 days ago",
      status: "Active",
    },
    {
      id: "4",
      title: "Crypto Social Media Campaign",
      description:
        "Create and execute a viral marketing campaign for our token launch. Focus on Twitter, Discord, and Telegram community building.",
      company: "TokenLaunch Pro",
      companyRating: 4.6,
      prize: "$1,200",
      totalPrize: "$4,000",
      difficulty: "Intermediate",
      timeLeft: "1 week",
      category: "Marketing",
      skills: ["Social Media", "Community Building", "Content Creation", "Crypto Marketing"],
      participants: 28,
      maxParticipants: 35,
      requirements: [
        "Proven track record in crypto marketing",
        "Large social media following",
        "Content creation skills",
        "Community management experience",
      ],
      deliverables: [
        "Complete campaign strategy",
        "Content calendar and posts",
        "Community engagement metrics",
        "Performance analytics report",
      ],
      isHot: false,
      isGuaranteed: false,
      postedDate: "2 days ago",
      status: "Active",
    },
    {
      id: "5",
      title: "Smart Contract Security Audit",
      description:
        "Perform a comprehensive security audit of our DeFi smart contracts. Identify vulnerabilities and provide detailed recommendations.",
      company: "SecureChain Labs",
      companyRating: 4.9,
      prize: "$4,000",
      totalPrize: "$12,000",
      difficulty: "Expert",
      timeLeft: "3 weeks",
      category: "Development",
      skills: ["Smart Contract Auditing", "Solidity", "Security", "DeFi"],
      participants: 8,
      maxParticipants: 15,
      requirements: [
        "Certified smart contract auditor",
        "Experience with DeFi protocols",
        "Knowledge of common vulnerabilities",
        "Previous audit reports portfolio",
      ],
      deliverables: [
        "Comprehensive audit report",
        "Vulnerability assessment",
        "Remediation recommendations",
        "Code review documentation",
      ],
      isHot: true,
      isGuaranteed: true,
      postedDate: "1 week ago",
      status: "Active",
    },
    {
      id: "6",
      title: "DAO Governance Dashboard",
      description:
        "Create an intuitive dashboard for DAO members to view proposals, vote, and track governance activities across multiple DAOs.",
      company: "Governance Hub",
      companyRating: 4.8,
      prize: "$2,200",
      totalPrize: "$7,500",
      difficulty: "Advanced",
      timeLeft: "10 days",
      category: "Development",
      skills: ["React", "DAO", "Governance", "Web3"],
      participants: 19,
      maxParticipants: 25,
      requirements: [
        "Understanding of DAO mechanics",
        "React/Next.js expertise",
        "Web3 integration experience",
        "UI/UX design skills",
      ],
      deliverables: [
        "Multi-DAO dashboard interface",
        "Voting mechanism integration",
        "Proposal tracking system",
        "Mobile responsive design",
      ],
      isHot: false,
      isGuaranteed: true,
      postedDate: "4 days ago",
      status: "Active",
    },
  ]

  const filteredBounties = bounties.filter((bounty) => {
    const matchesCategory = selectedCategory === "All" || bounty.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === "All" || bounty.difficulty === selectedDifficulty
    const matchesSearch =
      bounty.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bounty.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bounty.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesDifficulty && matchesSearch
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "from-green-400 to-emerald-500"
      case "Intermediate":
        return "from-blue-400 to-cyan-500"
      case "Advanced":
        return "from-yellow-400 to-orange-500"
      case "Expert":
        return "from-red-400 to-pink-500"
      default:
        return "from-gray-400 to-gray-500"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "from-green-400 to-emerald-500"
      case "Ending Soon":
        return "from-red-400 to-pink-500"
      case "Completed":
        return "from-gray-400 to-gray-500"
      default:
        return "from-blue-400 to-cyan-500"
    }
  }

  return (
    <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
      {/* SVG Gradients */}
      <svg width="0" height="0" className="absolute">
        <linearGradient id="text-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E23E6B" />
          <stop offset="100%" stopColor="white" />
        </linearGradient>
        <linearGradient id="hot-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6b6b" />
          <stop offset="100%" stopColor="#E23E6B" />
        </linearGradient>
      </svg>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <motion.h1
              className={cn("text-3xl md:text-4xl lg:text-5xl font-thin mb-2", poppins.className)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <AuroraText colors={["#cc4368", "#e6295c", "#ffffff", "#E23E6B"]}>
                <span className="text-transparent">Bounty First Hiring</span>
              </AuroraText>
            </motion.h1>
            <motion.p
              className="text-gray-300/80 text-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              Compete for guaranteed prizes in skill-based challenges with upfront stakes
            </motion.p>
          </div>

          <Link href="/dashboard">
            <motion.button
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {[
            { label: "Active Bounties", value: "18", icon: Trophy },
            { label: "Total Prize Pool", value: "$56K", icon: DollarSign },
            { label: "Active Participants", value: "124", icon: Users },
            { label: "Avg. Prize", value: "$3.1K", icon: Award },
          ].map((stat, index) => {
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
                  <div className="w-14 h-14 bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <IconComponent
                      className="w-7 h-7 text-[#E23E6B] group-hover:text-white transition-colors duration-300"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div
                    className={cn(
                      "text-2xl font-thin mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-t group-hover:from-white group-hover:to-[#E23E6B] transition-colors duration-300",
                      poppins.className,
                    )}
                  >
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-300/80">{stat.label}</div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search bounties by title, skills, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B]/50 transition-colors duration-300"
              />
            </div>

            {/* Categories and Difficulty */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const IconComponent = category.icon
                  const isSelected = selectedCategory === category.name
                  return (
                    <motion.button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-2xl border transition-all duration-300 ${
                        isSelected
                          ? "bg-gradient-to-r from-[#E23E6B] to-[#cc4368] border-[#E23E6B]/50 text-white"
                          : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:border-[#E23E6B]/30"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="text-sm font-light">{category.name}</span>
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{category.count}</span>
                    </motion.button>
                  )
                })}
              </div>

              <div className="flex flex-wrap gap-2">
                {difficulties.map((difficulty) => {
                  const isSelected = selectedDifficulty === difficulty
                  return (
                    <motion.button
                      key={difficulty}
                      onClick={() => setSelectedDifficulty(difficulty)}
                      className={`px-4 py-2 rounded-2xl border transition-all duration-300 ${
                        isSelected
                          ? "bg-gradient-to-r from-[#E23E6B] to-[#cc4368] border-[#E23E6B]/50 text-white"
                          : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:border-[#E23E6B]/30"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-sm font-light">{difficulty}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bounties Grid */}
        <motion.div
          className="grid gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {filteredBounties.map((bounty, index) => (
            <motion.div
              key={bounty.id}
              className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 group overflow-hidden relative shadow-lg"
              variants={cardVariants}
              custom={index}
              whileHover="hover"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white to-[#E23E6B] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl"></div>

              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3
                        className={cn(
                          "text-xl font-medium group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#E23E6B] transition-colors duration-300",
                          poppins.className,
                        )}
                      >
                        {bounty.title}
                      </h3>
                      {bounty.isHot && (
                        <span className="px-2 py-1 bg-gradient-to-r from-red-500 to-[#E23E6B] text-xs rounded-full text-white font-medium">
                          <Zap className="w-3 h-3 inline mr-1" />
                          Hot
                        </span>
                      )}
                      {bounty.isGuaranteed && (
                        <span className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-xs rounded-full text-white font-medium">
                          <Shield className="w-3 h-3 inline mr-1" />
                          Guaranteed
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 bg-gradient-to-r ${getStatusColor(
                          bounty.status,
                        )} text-xs rounded-full text-white font-medium`}
                      >
                        {bounty.status}
                      </span>
                    </div>

                    {/* Company Info */}
                    <div className="flex items-center space-x-4 text-sm text-gray-300/80 mb-3">
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">{bounty.company}</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>{bounty.companyRating}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-[#E23E6B]" />
                        <span>{bounty.postedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-bold text-white mb-1">{bounty.prize}</div>
                    <div className="text-sm text-gray-300/70">Winner Prize</div>
                    <div className="text-lg font-semibold text-[#E23E6B] mt-1">{bounty.totalPrize}</div>
                    <div className="text-xs text-gray-300/70">Total Pool</div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-300/80 leading-relaxed mb-6 font-light">{bounty.description}</p>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-300/80">
                    <Timer className="w-4 h-4 text-[#E23E6B]" />
                    <span>{bounty.timeLeft} left</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-300/80">
                    <Users className="w-4 h-4 text-[#E23E6B]" />
                    <span>
                      {bounty.participants}/{bounty.maxParticipants} joined
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-300/80">
                    <Target className="w-4 h-4 text-[#E23E6B]" />
                    <span
                      className={`px-2 py-1 bg-gradient-to-r ${getDifficultyColor(
                        bounty.difficulty,
                      )} text-xs rounded-full text-white`}
                    >
                      {bounty.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-300/80">
                    <Trophy className="w-4 h-4 text-[#E23E6B]" />
                    <span>{bounty.category}</span>
                  </div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {bounty.skills.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="px-3 py-1 bg-gradient-to-r from-[#E23E6B]/20 to-[#cc4368]/20 border border-[#E23E6B]/30 text-xs rounded-full text-gray-200 backdrop-blur-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Requirements and Deliverables */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3">Requirements</h4>
                    <ul className="space-y-2">
                      {bounty.requirements.slice(0, 3).map((req, reqIndex) => (
                        <li key={reqIndex} className="flex items-start text-sm text-gray-300/80">
                          <div className="w-1.5 h-1.5 bg-[#E23E6B]/70 rounded-full mr-3 mt-2"></div>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3">Deliverables</h4>
                    <ul className="space-y-2">
                      {bounty.deliverables.slice(0, 3).map((del, delIndex) => (
                        <li key={delIndex} className="flex items-start text-sm text-gray-300/80">
                          <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                          {del}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <motion.button
                    className="px-8 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Join Bounty
                  </motion.button>

                  <motion.div
                    className="flex items-center cursor-pointer group/button"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <span className="text-sm text-gray-300/70 mr-2 group-hover/button:text-white transition-colors duration-300">
                      View Details
                    </span>
                    <ChevronRight className="w-5 h-5 text-[#E23E6B] group-hover/button:text-white transition-colors duration-300" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredBounties.length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-gray-400 text-lg mb-4">No bounties found matching your criteria</div>
            <div className="text-gray-500 text-sm">Try adjusting your search or filter options</div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
