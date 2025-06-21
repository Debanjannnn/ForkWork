"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {toast} from "sonner";
import { Search, Clock, DollarSign, Shield, Calendar, ChevronRight, Briefcase } from "lucide-react"
import { useAccount, useReadContract } from "wagmi"
import { FREELANCE_CONTRACT_ADDRESS, FREELANCE_ABI } from "@/lib/contracts"
import { formatEther } from "viem"
import { ProposalForm } from "./propsal-form"

interface Gig {
  id: number
  client: string
  title: string
  description: string
  detailsUri: string
  usdtAmount: bigint
  nativeStakeRequired: bigint
  selectedFreelancer: string
  isApproved: boolean
  isFunded: boolean
  isStakeDeposited: boolean
  isCompleted: boolean
  deadline: bigint
  proposalDeadline: bigint
  stakingDeadline: bigint
  createdAt: bigint
}

export function GigsList() {
  const { address } = useAccount()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedGig, setSelectedGig] = useState<number | null>(null)
  const [gigDetails, setGigDetails] = useState<Record<number, any>>({})

  // Read gig count from contract
  const { data: gigCount } = useReadContract({
    address: FREELANCE_CONTRACT_ADDRESS,
    abi: FREELANCE_ABI,
    functionName: "gigCount",
  })

  // Read all gigs
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGigs = async () => {
      if (!gigCount) return

      const gigsData: Gig[] = []
      const count = Number(gigCount)

      for (let i = 0; i < count; i++) {
        try {
          // This would need to be implemented with proper contract calls
          // For now, we'll use mock data
          const mockGig: Gig = {
            id: i,
            client: `0x${Math.random().toString(16).substr(2, 8)}...`,
            title: `Gig ${i + 1}`,
            description: "Sample gig description",
            detailsUri: "",
            usdtAmount: BigInt(1000 * 1e6),
            nativeStakeRequired: BigInt(0),
            selectedFreelancer: "0x0000000000000000000000000000000000000000",
            isApproved: false,
            isFunded: false,
            isStakeDeposited: false,
            isCompleted: false,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60),
            proposalDeadline: BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60),
            stakingDeadline: BigInt(0),
            createdAt: BigInt(Math.floor(Date.now() / 1000)),
          }
          gigsData.push(mockGig)
        } catch (error) {
          console.error(`Error fetching gig ${i}:`, error)
        }
      }

      setGigs(gigsData)
      setLoading(false)
    }

    fetchGigs()
  }, [gigCount])

  const categories = ["All", "Development", "Design", "Marketing", "Writing", "Analytics", "Consulting"]

  const filteredGigs = gigs.filter((gig) => {
    const matchesSearch =
      gig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gig.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" // We'd need category data from IPFS
    const isActive = !gig.isCompleted && gig.selectedFreelancer === "0x0000000000000000000000000000000000000000"
    return matchesSearch && matchesCategory && isActive
  })

  const handleApplyToGig = (gigId: number) => {
    setSelectedGig(gigId)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-white/5 backdrop-blur-md border-white/20 animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-white/10 rounded mb-4"></div>
              <div className="h-4 bg-white/10 rounded mb-2"></div>
              <div className="h-4 bg-white/10 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="bg-white/5 backdrop-blur-md border-white/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search gigs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Gigs List */}
      <div className="space-y-4">
        {filteredGigs.map((gig, index) => (
          <motion.div
            key={gig.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <Card className="bg-white/5 backdrop-blur-md border-white/20 hover:bg-white/10 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#E23E6B] transition-colors">
                      {gig.title}
                    </h3>
                    <p className="text-gray-300 mb-3 line-clamp-2">{gig.description}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>${(Number(gig.usdtAmount) / 1e6).toFixed(2)} USDT</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{Math.ceil((Number(gig.deadline) - Date.now() / 1000) / (24 * 60 * 60))} days</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Proposals: {Math.ceil((Number(gig.proposalDeadline) - Date.now() / 1000) / (24 * 60 * 60))}{" "}
                          days
                        </span>
                      </div>
                      {gig.nativeStakeRequired > 0 && (
                        <div className="flex items-center gap-1">
                          <Shield className="w-4 h-4 text-green-400" />
                          <span>{formatEther(gig.nativeStakeRequired)} EDU stake</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>
                          Client: {gig.client.slice(0, 6)}...{gig.client.slice(-4)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => handleApplyToGig(gig.id)}
                          className="bg-gradient-to-r from-[#E23E6B] to-[#cc4368] hover:from-[#cc4368] hover:to-[#E23E6B] text-white"
                        >
                          Apply Now
                        </Button>
                        <div className="flex items-center text-gray-400 hover:text-white cursor-pointer">
                          <span className="text-sm mr-1">View Details</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredGigs.length === 0 && (
        <Card className="bg-white/5 backdrop-blur-md border-white/20">
          <CardContent className="p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No gigs found</h3>
            <p className="text-gray-400">
              Try adjusting your search criteria or check back later for new opportunities.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Proposal Modal */}
      {selectedGig !== null && <ProposalForm gigId={selectedGig} onClose={() => setSelectedGig(null)} />}
    </div>
  )
}
