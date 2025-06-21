"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {toast} from "sonner"
import {
  Clock,
  DollarSign,
  Users,
  Shield,
  CheckCircle,
  Eye,
  UserCheck,
  Briefcase,
  ExternalLink,
  FileText,
} from "lucide-react"
import { useAccount, useReadContract, useWriteContract } from "wagmi"
import { FREELANCE_CONTRACT_ADDRESS, FREELANCE_ABI, USDT_TOKEN_ADDRESS, ERC20_ABI } from "@/lib/contracts"
import { formatEther } from "viem"
import { getFromPinata } from "@/lib/pinata"

interface ClientGig {
  id: number
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
  createdAt: bigint
  applicantCount: number
  ipfsData?: any
}

export function MyGigs() {
  const { address } = useAccount()

  const [gigs, setGigs] = useState<ClientGig[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingIpfs, setLoadingIpfs] = useState<Record<number, boolean>>({})

  const { writeContract: writeUSDT } = useWriteContract()
  const { writeContract: writeFunding } = useWriteContract()

  // Read client gigs from contract
  const { data: clientGigIds } = useReadContract({
    address: FREELANCE_CONTRACT_ADDRESS,
    abi: FREELANCE_ABI,
    functionName: "getClientGigs",
    args: address ? [address] : undefined,
  })

  // Read USDT balance and allowance
  const { data: usdtBalance } = useReadContract({
    address: USDT_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  })

  const { data: usdtAllowance } = useReadContract({
    address: USDT_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, FREELANCE_CONTRACT_ADDRESS] : undefined,
  })

  useEffect(() => {
    const fetchClientGigs = async () => {
      if (!clientGigIds || !address) {
        setLoading(false)
        return
      }

      const gigsData: ClientGig[] = []

      for (const gigId of clientGigIds) {
        try {
          // In a real implementation, you would read from the contract
          // For now, we'll create mock data based on the gig IDs
          const mockGig: ClientGig = {
            id: Number(gigId),
            title: `My Gig #${gigId}`,
            description: "Sample gig description",
            detailsUri: `ipfs://QmExample${gigId}`,
            usdtAmount: BigInt(1000 * 1e6),
            nativeStakeRequired: BigInt(0),
            selectedFreelancer: "0x0000000000000000000000000000000000000000",
            isApproved: false,
            isFunded: false,
            isStakeDeposited: false,
            isCompleted: false,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60),
            proposalDeadline: BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60),
            createdAt: BigInt(Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60),
            applicantCount: Math.floor(Math.random() * 15) + 1,
          }
          gigsData.push(mockGig)
        } catch (error) {
          console.error(`Error fetching gig ${gigId}:`, error)
        }
      }

      setGigs(gigsData)
      setLoading(false)
    }

    fetchClientGigs()
  }, [clientGigIds, address])

  // Load IPFS data for a gig
  const loadIpfsData = async (gig: ClientGig) => {
    if (!gig.detailsUri || gig.ipfsData || loadingIpfs[gig.id]) return

    setLoadingIpfs((prev) => ({ ...prev, [gig.id]: true }))

    try {
      const ipfsData = await getFromPinata(gig.detailsUri)
      setGigs((prev) => prev.map((g) => (g.id === gig.id ? { ...g, ipfsData } : g)))

      toast({
        title: "IPFS data loaded",
        description: `Loaded additional details for "${gig.title}"`,
      })
    } catch (error) {
      console.error("Error loading IPFS data:", error)
      toast({
        title: "Failed to load IPFS data",
        description: "Could not retrieve additional details from IPFS",
        variant: "destructive",
      })
    } finally {
      setLoadingIpfs((prev) => ({ ...prev, [gig.id]: false }))
    }
  }

  const handleApproveUSDT = async (amount: bigint) => {
    try {
      writeUSDT({
        address: USDT_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [FREELANCE_CONTRACT_ADDRESS, amount],
      })

      toast({
        title: "USDT approval initiated",
        description: "Please confirm the transaction to approve USDT spending",
      })
    } catch (error) {
      console.error("Error approving USDT:", error)
      toast({
        title: "Error approving USDT",
        description: "Failed to approve USDT spending",
        variant: "destructive",
      })
    }
  }

  const handleFundGig = async (gigId: number) => {
    try {
      writeFunding({
        address: FREELANCE_CONTRACT_ADDRESS,
        abi: FREELANCE_ABI,
        functionName: "fundGig",
        args: [BigInt(gigId)],
      })

      toast({
        title: "Funding initiated",
        description: "Please confirm the transaction to fund the gig",
      })
    } catch (error) {
      console.error("Error funding gig:", error)
      toast({
        title: "Error funding gig",
        description: "Failed to fund the gig",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (gig: ClientGig) => {
    if (gig.isCompleted) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>
    }
    if (gig.isApproved) {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Work Approved</Badge>
    }
    if (gig.selectedFreelancer !== "0x0000000000000000000000000000000000000000") {
      if (gig.isFunded) {
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">In Progress</Badge>
      }
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Freelancer Selected</Badge>
    }
    if (Date.now() / 1000 > Number(gig.proposalDeadline)) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Proposal Deadline Passed</Badge>
    }
    return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Accepting Proposals</Badge>
  }

  const getActionButtons = (gig: ClientGig) => {
    const buttons = []

    if (gig.selectedFreelancer === "0x0000000000000000000000000000000000000000") {
      buttons.push(
        <Button key="view-proposals" variant="outline" size="sm" className="bg-white/10 border-white/20">
          <Eye className="w-4 h-4 mr-2" />
          View Proposals ({gig.applicantCount})
        </Button>,
      )
    } else {
      if (!gig.isFunded) {
        const needsApproval = !usdtAllowance || usdtAllowance < gig.usdtAmount

        if (needsApproval) {
          buttons.push(
            <Button
              key="approve"
              size="sm"
              onClick={() => handleApproveUSDT(gig.usdtAmount)}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-red-600 hover:to-orange-500 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve USDT
            </Button>,
          )
        } else {
          buttons.push(
            <Button
              key="fund"
              size="sm"
              onClick={() => handleFundGig(gig.id)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-emerald-600 hover:to-green-500 text-white"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Fund Gig
            </Button>,
          )
        }
      }

      if (gig.isFunded && !gig.isApproved) {
        buttons.push(
          <Button
            key="approve-work"
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-cyan-600 hover:to-blue-500 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve Work
          </Button>,
        )
      }

      buttons.push(
        <Button key="view-freelancer" variant="outline" size="sm" className="bg-white/10 border-white/20">
          <UserCheck className="w-4 h-4 mr-2" />
          View Freelancer
        </Button>,
      )
    }

    return buttons
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
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

  if (gigs.length === 0) {
    return (
      <Card className="bg-white/5 backdrop-blur-md border-white/20">
        <CardContent className="p-12 text-center">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No gigs posted yet</h3>
          <p className="text-gray-400 mb-6">
            Start by posting your first gig to find talented freelancers on EDU Chain.
          </p>
          <Button className="bg-gradient-to-r from-[#E23E6B] to-[#cc4368] hover:from-[#cc4368] hover:to-[#E23E6B] text-white">
            Post Your First Gig
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">My Posted Gigs</h2>
          <p className="text-gray-400">Manage your posted gigs and track their progress on EDU Chain</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-[#E23E6B]/20 text-[#E23E6B] border-[#E23E6B]/30">
            {gigs.length} Active Gigs
          </Badge>
          {usdtBalance && (
            <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400">
              ${(Number(usdtBalance) / 1e6).toFixed(2)} USDT
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {gigs.map((gig, index) => (
          <motion.div
            key={gig.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <Card className="bg-white/5 backdrop-blur-md border-white/20 hover:bg-white/10 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{gig.title}</h3>
                      {getStatusBadge(gig)}
                    </div>
                    <p className="text-gray-300 mb-4 line-clamp-2">{gig.description}</p>

                    {/* IPFS Data Display */}
                    {gig.ipfsData && (
                      <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-green-400">IPFS Data Loaded</span>
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${gig.detailsUri.replace("ipfs://", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View on IPFS
                          </a>
                        </div>
                        {gig.ipfsData.skills && (
                          <div className="flex flex-wrap gap-1">
                            {gig.ipfsData.skills.slice(0, 5).map((skill: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs bg-[#E23E6B]/10 border-[#E23E6B]/30"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <DollarSign className="w-4 h-4 text-[#E23E6B]" />
                        <span>${(Number(gig.usdtAmount) / 1e6).toFixed(2)} USDT</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="w-4 h-4 text-[#E23E6B]" />
                        <span>{Math.ceil((Number(gig.deadline) - Date.now() / 1000) / (24 * 60 * 60))} days left</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Users className="w-4 h-4 text-[#E23E6B]" />
                        <span>{gig.applicantCount} applicants</span>
                      </div>
                      {gig.nativeStakeRequired > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Shield className="w-4 h-4 text-green-400" />
                          <span>{formatEther(gig.nativeStakeRequired)} EDU</span>
                        </div>
                      )}
                    </div>

                    {gig.selectedFreelancer !== "0x0000000000000000000000000000000000000000" && (
                      <div className="bg-white/5 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <UserCheck className="w-4 h-4 text-green-400" />
                          <span className="text-gray-300">Selected Freelancer:</span>
                          <span className="text-white font-mono">
                            {gig.selectedFreelancer.slice(0, 6)}...{gig.selectedFreelancer.slice(-4)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      {!gig.ipfsData && gig.detailsUri && (
                        <Button
                          onClick={() => loadIpfsData(gig)}
                          disabled={loadingIpfs[gig.id]}
                          variant="outline"
                          size="sm"
                          className="bg-white/10 border-white/20"
                        >
                          {loadingIpfs[gig.id] ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                              </motion.div>
                              Loading IPFS...
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              Load IPFS Data
                            </>
                          )}
                        </Button>
                      )}
                      {getActionButtons(gig)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
