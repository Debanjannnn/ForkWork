"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Poppins } from "next/font/google"
import { cn } from "@/lib/utils"
import { AuroraText } from "@/components/magicui/aurora-text"
import { WalletDisplay } from "@/components/ui/wallet-display"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PostGigForm } from "@/components/freelance/post-gig-form"
import { GigsList } from "@/components/freelance/gigs-list"
import { MyGigs } from "@/components/freelance/my-gigs"
import { MyProposals } from "@/components/freelance/my-proposals"
import { Briefcase, Plus, FileText, Clock, Shield, TrendingUp, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useAccount, useReadContract } from "wagmi"
import { FREELANCE_CONTRACT_ADDRESS, FREELANCE_ABI } from "@/lib/contracts"
import { toast } from "sonner"

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
})

export default function FreelanceDashboard() {
  const { address, isConnected } = useAccount()

  const [activeTab, setActiveTab] = useState("browse")

  // Read contract data for stats
  const { data: gigCount } = useReadContract({
    address: FREELANCE_CONTRACT_ADDRESS,
    abi: FREELANCE_ABI,
    functionName: "gigCount",
  })

  const { data: clientGigs } = useReadContract({
    address: FREELANCE_CONTRACT_ADDRESS,
    abi: FREELANCE_ABI,
    functionName: "getClientGigs",
    args: address ? [address] : undefined,
  })

  const { data: freelancerGigs } = useReadContract({
    address: FREELANCE_CONTRACT_ADDRESS,
    abi: FREELANCE_ABI,
    functionName: "getFreelancerGigs",
    args: address ? [address] : undefined,
  })

  const stats = [
    {
      title: "Total Gigs",
      value: gigCount ? gigCount.toString() : "0",
      change: "+12%",
      icon: Briefcase,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "My Posted Gigs",
      value: clientGigs ? clientGigs.length.toString() : "0",
      change: "+8%",
      icon: Plus,
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "My Applications",
      value: freelancerGigs ? freelancerGigs.length.toString() : "0",
      change: "+22%",
      icon: FileText,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Success Rate",
      value: "94%",
      change: "+2%",
      icon: TrendingUp,
      color: "from-orange-500 to-red-500",
    },
  ]

  if (!isConnected) {
    return (
      <div className={cn("min-h-screen bg-black text-white flex items-center justify-center", poppins.className)}>
        <Card className="bg-white/5 backdrop-blur-md border-white/20 p-8 text-center max-w-md">
          <CardHeader>
            <div className="w-16 h-16 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white mb-4">Connect Your Wallet</CardTitle>
            <CardDescription className="text-gray-300 mb-6">
              Please connect your wallet to access the freelance dashboard on EDU Chain testnet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WalletDisplay />
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Make sure you're connected to EDU Chain Testnet</span>
              </div>
            </div>
          </CardContent>
        </Card>
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
            <motion.h1
              className={cn("text-3xl md:text-4xl lg:text-5xl font-thin mb-2", poppins.className)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <AuroraText colors={["#cc4368", "#e6295c", "#ffffff", "#E23E6B"]}>
                <span className="text-transparent">Freelance Dashboard</span>
              </AuroraText>
            </motion.h1>
            <motion.p
              className="text-gray-300/80 text-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              Web3 freelance marketplace on EDU Chain with IPFS storage
            </motion.p>
            <motion.div
              className="flex items-center gap-2 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                EDU Chain Testnet
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">IPFS Enabled</Badge>
            </motion.div>
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

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <motion.div
                key={stat.title}
                className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-6 group hover:bg-white/10 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-r ${stat.color}`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    {stat.change}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-300/70">{stat.title}</div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-1">
              <TabsTrigger
                value="browse"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#E23E6B] data-[state=active]:to-[#cc4368] data-[state=active]:text-white rounded-xl transition-all duration-300"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Browse Gigs
              </TabsTrigger>
              <TabsTrigger
                value="post"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#E23E6B] data-[state=active]:to-[#cc4368] data-[state=active]:text-white rounded-xl transition-all duration-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Post Gig
              </TabsTrigger>
              <TabsTrigger
                value="my-gigs"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#E23E6B] data-[state=active]:to-[#cc4368] data-[state=active]:text-white rounded-xl transition-all duration-300"
              >
                <Clock className="w-4 h-4 mr-2" />
                My Gigs
              </TabsTrigger>
              <TabsTrigger
                value="proposals"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#E23E6B] data-[state=active]:to-[#cc4368] data-[state=active]:text-white rounded-xl transition-all duration-300"
              >
                <FileText className="w-4 h-4 mr-2" />
                My Proposals
              </TabsTrigger>
            </TabsList>

            <div className="mt-8">
              <TabsContent value="browse" className="space-y-6">
                <GigsList />
              </TabsContent>

              <TabsContent value="post" className="space-y-6">
                <PostGigForm />
              </TabsContent>

              <TabsContent value="my-gigs" className="space-y-6">
                <MyGigs />
              </TabsContent>

              <TabsContent value="proposals" className="space-y-6">
                <MyProposals />
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
