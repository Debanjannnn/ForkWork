"use client"

import { useState } from "react"
import { motion, Variants } from "framer-motion"
import { Poppins } from "next/font/google"
import { cn } from "@/lib/utils"
import { AuroraText } from "@/components/magicui/aurora-text"
import { WalletDisplay } from "@/components/ui/wallet-display"
import {
  ArrowLeft,
  Search,
  Filter,
  Clock,
  Star,
  MapPin,
  Calendar,
  Users,
  Shield,
  ChevronRight,
  Briefcase,
  Code,
  Palette,
  Megaphone,
  BarChart3,
  Zap,
} from "lucide-react"
import Link from "next/link"

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
})

type Gig = {
  id: string
  title: string
  description: string
  client: string
  clientRating: number
  budget: string
  timeline: string
  location: string
  skills: string[]
  category: string
  isUrgent: boolean
  escrowProtected: boolean
  applicants: number
  postedDate: string
}

export default function FreelanceGigs() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  // Animation variants
  const cardVariants: Variants = {
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
    { name: "All", icon: Briefcase, count: 24 },
    { name: "Development", icon: Code, count: 12 },
    { name: "Design", icon: Palette, count: 8 },
    { name: "Marketing", icon: Megaphone, count: 6 },
    { name: "Analytics", icon: BarChart3, count: 4 },
  ]

  const gigs: Gig[] = [
    {
      id: "1",
      title: "Smart Contract Development for DeFi Protocol",
      description:
        "Looking for an experienced Solidity developer to build and audit smart contracts for our new DeFi lending protocol. Must have experience with OpenZeppelin and security best practices.",
      client: "DeFi Innovations",
      clientRating: 4.9,
      budget: "$5,000 - $8,000",
      timeline: "4-6 weeks",
      location: "Remote",
      skills: ["Solidity", "Web3.js", "Smart Contracts", "DeFi"],
      category: "Development",
      isUrgent: true,
      escrowProtected: true,
      applicants: 12,
      postedDate: "2 days ago",
    },
    {
      id: "2",
      title: "NFT Marketplace UI/UX Design",
      description:
        "Design a modern, user-friendly interface for our NFT marketplace. Need someone with experience in Web3 design patterns and crypto user flows.",
      client: "CryptoArt Studio",
      clientRating: 4.7,
      budget: "$3,000 - $5,000",
      timeline: "3-4 weeks",
      location: "Remote",
      skills: ["UI/UX Design", "Figma", "Web3 Design", "NFT"],
      category: "Design",
      isUrgent: false,
      escrowProtected: true,
      applicants: 8,
      postedDate: "1 day ago",
    },
    {
      id: "3",
      title: "Token Launch Marketing Campaign",
      description:
        "Create and execute a comprehensive marketing strategy for our token launch. Experience with crypto marketing and community building required.",
      client: "BlockChain Ventures",
      clientRating: 4.8,
      budget: "$2,500 - $4,000",
      timeline: "2-3 weeks",
      location: "Remote",
      skills: ["Crypto Marketing", "Social Media", "Community Management", "Content Creation"],
      category: "Marketing",
      isUrgent: false,
      escrowProtected: true,
      applicants: 15,
      postedDate: "3 days ago",
    },
    {
      id: "4",
      title: "DApp Frontend Development",
      description:
        "Build a responsive React frontend for our decentralized application. Integration with MetaMask and Web3 wallets required.",
      client: "Web3 Solutions",
      clientRating: 4.6,
      budget: "$4,000 - $6,000",
      timeline: "5-7 weeks",
      location: "Remote",
      skills: ["React", "TypeScript", "Web3.js", "MetaMask"],
      category: "Development",
      isUrgent: false,
      escrowProtected: true,
      applicants: 9,
      postedDate: "1 week ago",
    },
    {
      id: "5",
      title: "Blockchain Analytics Dashboard",
      description:
        "Create an analytics dashboard to track on-chain metrics and visualize blockchain data. Experience with data visualization libraries required.",
      client: "Analytics Pro",
      clientRating: 4.9,
      budget: "$3,500 - $5,500",
      timeline: "4-5 weeks",
      location: "Remote",
      skills: ["Data Visualization", "D3.js", "Python", "Blockchain APIs"],
      category: "Analytics",
      isUrgent: true,
      escrowProtected: true,
      applicants: 6,
      postedDate: "4 days ago",
    },
    {
      id: "6",
      title: "DAO Governance Interface Design",
      description:
        "Design an intuitive interface for DAO governance voting and proposal management. Understanding of DAO mechanics essential.",
      client: "Governance Labs",
      clientRating: 4.8,
      budget: "$2,800 - $4,200",
      timeline: "3-4 weeks",
      location: "Remote",
      skills: ["UI/UX Design", "DAO", "Governance", "Prototyping"],
      category: "Design",
      isUrgent: false,
      escrowProtected: true,
      applicants: 11,
      postedDate: "5 days ago",
    },
  ]

  const filteredGigs = gigs.filter((gig) => {
    const matchesCategory = selectedCategory === "All" || gig.category === selectedCategory
    const matchesSearch =
      gig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gig.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gig.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return (
    <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
      {/* SVG Gradients */}
      <svg width="0" height="0" className="absolute">
        <linearGradient id="text-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E23E6B" />
          <stop offset="100%" stopColor="white" />
        </linearGradient>
        <linearGradient id="urgent-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
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
                <span className="text-transparent">Freelance Gigs</span>
              </AuroraText>
            </motion.h1>
            <motion.p
              className="text-gray-300/80 text-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              Discover high-paying Web3 freelance opportunities with escrow protection
            </motion.p>
          </div>

          <div className="flex items-center gap-4">
            <WalletDisplay />
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
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search gigs by title, skills, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B]/50 transition-colors duration-300"
              />
            </div>

            {/* Filter Button */}
            <motion.button
              className="flex items-center space-x-2 px-6 py-3 bg-white/10 border border-white/20 rounded-2xl text-white hover:bg-white/20 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div
          className="flex flex-wrap gap-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {categories.map((category, index) => {
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
        </motion.div>

        {/* Gigs Grid */}
        <motion.div
          className="grid gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {filteredGigs.map((gig, index) => (
            <motion.div
              key={gig.id}
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
                        {gig.title}
                      </h3>
                      {gig.isUrgent && (
                        <span className="px-2 py-1 bg-gradient-to-r from-red-500 to-[#E23E6B] text-xs rounded-full text-white font-medium">
                          <Zap className="w-3 h-3 inline mr-1" />
                          Urgent
                        </span>
                      )}
                      {gig.escrowProtected && (
                        <span className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-xs rounded-full text-white font-medium">
                          <Shield className="w-3 h-3 inline mr-1" />
                          Escrow
                        </span>
                      )}
                    </div>

                    {/* Client Info */}
                    <div className="flex items-center space-x-4 text-sm text-gray-300/80 mb-3">
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">{gig.client}</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>{gig.clientRating}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-[#E23E6B]" />
                        <span>{gig.postedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-white mb-1">{gig.budget}</div>
                    <div className="text-sm text-gray-300/70">{gig.timeline}</div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-300/80 leading-relaxed mb-6 font-light">{gig.description}</p>

                {/* Details */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-300/80">
                    <MapPin className="w-4 h-4 text-[#E23E6B]" />
                    <span>{gig.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-300/80">
                    <Clock className="w-4 h-4 text-[#E23E6B]" />
                    <span>{gig.timeline}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-300/80">
                    <Users className="w-4 h-4 text-[#E23E6B]" />
                    <span>{gig.applicants} applicants</span>
                  </div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {gig.skills.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="px-3 py-1 bg-gradient-to-r from-[#E23E6B]/20 to-[#cc4368]/20 border border-[#E23E6B]/30 text-xs rounded-full text-gray-200 backdrop-blur-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <motion.button
                    className="px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Apply Now
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
        {filteredGigs.length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-gray-400 text-lg mb-4">No gigs found matching your criteria</div>
            <div className="text-gray-500 text-sm">Try adjusting your search or category filters</div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
