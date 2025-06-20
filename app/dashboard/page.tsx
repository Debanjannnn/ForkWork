"use client"

import { motion, Variants } from "framer-motion"
import GitHubCalendar from "react-github-calendar"
import { Poppins } from "next/font/google"
import { cn } from "@/lib/utils"
import { AuroraText } from "@/components/magicui/aurora-text"
import {
  ArrowLeft,
  Trophy,
  Briefcase,
  Users,
  Shield,
  Star,
  DollarSign,
  Target,
  Award,
  ChevronRight,
  Calendar,
} from "lucide-react"
import Link from "next/link"

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
})

export default function Dashboard() {
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
    { label: "Reputation Score", value: "8.5", icon: Star, color: "from-[#E23E6B] to-[#cc4368]" },
    { label: "Active Bounties", value: "12", icon: Target, color: "from-purple-500 to-purple-700" },
    { label: "Completed Gigs", value: "34", icon: Award, color: "from-blue-500 to-blue-700" },
    { label: "Total Earnings", value: "$2.4K", icon: DollarSign, color: "from-green-500 to-green-700" },
  ]

  const opportunityCards = [
    {
      title: "Bounty First Hiring",
      description: "Compete for jobs with upfront payment guarantee and skill-based selection.",
      icon: Trophy,
      features: ["Upfront payment guarantee", "Skill-based competition", "Direct rewards"],
      status: "5 Active",
      href: "dashboard/bounties",
      gradient: "from-[#E23E6B] to-[#cc4368]",
    },
    {
      title: "Freelance GIG",
      description: "Secure projects with escrow protection and verified work completion.",
      icon: Briefcase,
      features: ["Escrow protection", "Work verification", "Video meetings"],
      status: "8 Available",
      href: "dashboard/freelance",
      gradient: "from-purple-500 to-purple-700",
    },
    {
      title: "Staked Commitments",
      description: "Build trust through token staking with commitment guarantees.",
      icon: Shield,
      features: ["Token staking", "Trust mechanism", "Commitment guarantee"],
      status: "3 Pending",
      href: "/staked-commitments",
      gradient: "from-blue-500 to-blue-700",
    },
    {
      title: "Web3 Jobs",
      description: "Explore premium Web3 opportunities across various domains.",
      icon: Users,
      features: ["Premium positions", "Network growth", "Career advancement"],
      status: "100+ Jobs",
      href: "dashboard/jobs",
      gradient: "from-green-500 to-green-700",
    },
  ]

  const recentActivity = [
    { action: "Completed bounty task", time: "2 hours ago", type: "success", icon: Trophy },
    { action: "New freelance proposal", time: "5 hours ago", type: "info", icon: Briefcase },
    { action: "Payment received", time: "1 day ago", type: "success", icon: DollarSign },
    { action: "Profile viewed", time: "2 days ago", type: "info", icon: Users },
  ]

  return (
    <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-12"
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
                <span className="text-transparent">Web3 Career Hub</span>
              </AuroraText>
            </motion.h1>
            <motion.p
              className="text-gray-300/80 text-xl font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              Your gateway to Web3 opportunities
            </motion.p>
          </div>

          <Link href="/">
            <motion.button
              className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-3xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Enhanced Stats Grid */}
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
                className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center group overflow-hidden relative"
                variants={cardVariants}
                custom={index}
                whileHover="hover"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white to-[#E23E6B] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl"></div>
                <div className="relative z-10">
                  <div
                    className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
                  >
                    <IconComponent className="w-8 h-8 text-white" strokeWidth={1.5} />
                  </div>
                  <div
                    className={cn(
                      "text-3xl font-thin mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-t group-hover:from-white group-hover:to-[#E23E6B] transition-colors duration-300",
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

        {/* GitHub Calendar - Full Width */}
        <motion.div
          className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 group overflow-hidden relative mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white to-[#E23E6B] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl flex items-center justify-center mr-4">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2
                    className={cn(
                      "text-2xl font-thin group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-t group-hover:from-white group-hover:to-[#E23E6B] transition-colors duration-300",
                      poppins.className,
                    )}
                  >
                    Development Activity
                  </h2>
                  <p className="text-gray-400 text-sm font-light">Your coding journey visualized</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-thin text-[#E23E6B] mb-1">365</div>
                <div className="text-xs text-gray-400">Days tracked</div>
              </div>
            </div>

            <div className="w-full">
              <div className="flex justify-center">
                <GitHubCalendar
                  username="debanjannnn"
                  blockSize={12}
                  blockMargin={4}
                  fontSize={12}
                  theme={{
                    light: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
                    dark: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
                  }}
                  style={{
                    color: "#E23E6B",
                  }}
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-gray-400">Less</span>
                <div className="flex space-x-1">
                  <div className="w-3 h-3 bg-gray-800 rounded-sm"></div>
                  <div className="w-3 h-3 bg-green-900 rounded-sm"></div>
                  <div className="w-3 h-3 bg-green-700 rounded-sm"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                </div>
                <span className="text-gray-400">More</span>
              </div>
              <div className="text-gray-400">Learn how we count contributions</div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Opportunity Cards */}
        <motion.div
          className="grid md:grid-cols-2 gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {opportunityCards.map((card, index) => {
            const IconComponent = card.icon
            return (
              <Link key={index} href={card.href}>
                <motion.div
                  className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 flex flex-col relative group overflow-hidden shadow-lg h-full cursor-pointer"
                  variants={cardVariants}
                  custom={index}
                  whileHover="hover"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white to-[#E23E6B] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl"></div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div
                        className={`w-16 h-16 bg-gradient-to-r ${card.gradient} rounded-3xl flex items-center justify-center shadow-lg`}
                      >
                        <IconComponent className="w-8 h-8 text-white" strokeWidth={1.5} />
                      </div>
                      <span className="text-sm bg-gradient-to-r from-[#E23E6B] to-white bg-clip-text text-transparent font-medium px-4 py-2 bg-white/10 rounded-full border border-white/20">
                        {card.status}
                      </span>
                    </div>

                    <h3
                      className={cn(
                        "text-2xl font-thin mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-t group-hover:from-white group-hover:to-[#E23E6B] transition-colors duration-300",
                        poppins.className,
                      )}
                    >
                      {card.title}
                    </h3>
                    <p className="text-gray-300/70 leading-relaxed mb-8 font-light text-lg">{card.description}</p>

                    <ul className="space-y-4 mb-8 flex-grow">
                      {card.features.map((feature, featureIndex) => (
                        <motion.li
                          key={featureIndex}
                          className="flex items-center text-sm text-gray-300/80"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + featureIndex * 0.1, duration: 0.5 }}
                        >
                          <div className="w-2 h-2 bg-[#E23E6B] rounded-full mr-4"></div>
                          {feature}
                        </motion.li>
                      ))}
                    </ul>

                    <div className="mt-auto pt-6">
                      <motion.div
                        className="flex items-center justify-between cursor-pointer group/button p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-[#E23E6B]/50 transition-all duration-300"
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <span className="text-gray-300/70 group-hover/button:text-white transition-colors duration-300 font-light">
                          Explore Opportunities
                        </span>
                        <ChevronRight className="w-5 h-5 text-[#E23E6B] group-hover/button:text-white transition-colors duration-300" />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
