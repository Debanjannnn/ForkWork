"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Clock, DollarSign, FileText, Eye, Edit, Trash2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import { useAccount, useReadContract } from "wagmi"
import { FREELANCE_CONTRACT_ADDRESS, FREELANCE_ABI } from "@/lib/contracts"
import { getFromPinata } from "@/lib/pinata"

interface FreelancerProposal {
  gigId: number
  gigTitle: string
  gigDescription: string
  proposalUri: string
  submittedAt: bigint
  lastUpdatedAt: bigint
  isSelected: boolean
  isWithdrawn: boolean
  isAutoExpired: boolean
  gigBudget: bigint
  gigDeadline: bigint
  proposalDeadline: bigint
  ipfsData?: any
}

export function MyProposals() {
  const { address } = useAccount()

  const [proposals, setProposals] = useState<FreelancerProposal[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingIpfs, setLoadingIpfs] = useState<Record<string, boolean>>({})

  // Read freelancer gigs from contract
  const { data: freelancerGigIds } = useReadContract({
    address: FREELANCE_CONTRACT_ADDRESS,
    abi: FREELANCE_ABI,
    functionName: "getFreelancerGigs",
    args: address ? [address] : undefined,
  })

  useEffect(() => {
    const fetchProposals = async () => {
      if (!address) {
        setLoading(false)
        return
      }

      // Mock data for demonstration
      const mockProposals: FreelancerProposal[] = [
        {
          gigId: 1,
          gigTitle: "Smart Contract Development for DeFi Protocol",
          gigDescription:
            "Looking for an experienced Solidity developer to build and audit smart contracts for our new DeFi lending protocol.",
          proposalUri: "ipfs://QmProposal1Example",
          submittedAt: BigInt(Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60),
          lastUpdatedAt: BigInt(Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60),
          isSelected: false,
          isWithdrawn: false,
          isAutoExpired: false,
          gigBudget: BigInt(5000 * 1e6),
          gigDeadline: BigInt(Math.floor(Date.now() / 1000) + 27 * 24 * 60 * 60),
          proposalDeadline: BigInt(Math.floor(Date.now() / 1000) + 4 * 24 * 60 * 60),
        },
        {
          gigId: 3,
          gigTitle: "Token Launch Marketing Campaign",
          gigDescription: "Create and execute a comprehensive marketing strategy for our token launch.",
          proposalUri: "ipfs://QmProposal2Example",
          submittedAt: BigInt(Math.floor(Date.now() / 1000) - 1 * 24 * 60 * 60),
          lastUpdatedAt: BigInt(Math.floor(Date.now() / 1000) - 1 * 24 * 60 * 60),
          isSelected: true,
          isWithdrawn: false,
          isAutoExpired: false,
          gigBudget: BigInt(3000 * 1e6),
          gigDeadline: BigInt(Math.floor(Date.now() / 1000) + 20 * 24 * 60 * 60),
          proposalDeadline: BigInt(Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60),
        },
      ]

      setProposals(mockProposals)
      setLoading(false)
    }

    fetchProposals()
  }, [address])

  // Load IPFS data for a proposal
  const loadIpfsData = async (proposal: FreelancerProposal) => {
    const key = `${proposal.gigId}-${proposal.submittedAt}`
    if (!proposal.proposalUri || proposal.ipfsData || loadingIpfs[key]) return

    setLoadingIpfs((prev) => ({ ...prev, [key]: true }))

    try {
      const ipfsData = await getFromPinata(proposal.proposalUri)
      setProposals((prev) =>
        prev.map((p) =>
          p.gigId === proposal.gigId && p.submittedAt === proposal.submittedAt ? { ...p, ipfsData } : p,
        ),
      )

      toast({
        title: "Proposal data loaded from IPFS",
        description: `Loaded your proposal details for "${proposal.gigTitle}"`,
      })
    } catch (error) {
      console.error("Error loading IPFS data:", error)
      toast({
        title: "Failed to load proposal data",
        description: "Could not retrieve proposal details from IPFS",
        variant: "destructive",
      })
    } finally {
      setLoadingIpfs((prev) => ({ ...prev, [key]: false }))
    }
  }

  const getStatusBadge = (proposal: FreelancerProposal) => {
    if (proposal.isWithdrawn) {
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Withdrawn</Badge>
    }
    if (proposal.isAutoExpired) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Expired</Badge>
    }
    if (proposal.isSelected) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Selected ✨</Badge>
    }
    if (Date.now() / 1000 > Number(proposal.proposalDeadline)) {
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Under Review</Badge>
    }
    return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Submitted</Badge>
  }

  const getActionButtons = (proposal: FreelancerProposal) => {
    const buttons = []
    const key = `${proposal.gigId}-${proposal.submittedAt}`

    // Load IPFS data button
    if (!proposal.ipfsData && proposal.proposalUri) {
      buttons.push(
        <Button
          key="load-ipfs"
          onClick={() => loadIpfsData(proposal)}
          disabled={loadingIpfs[key]}
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20"
        >
          {loadingIpfs[key] ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <Eye className="w-4 h-4 mr-2" />
              </motion.div>
              Loading...
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Load Proposal
            </>
          )}
        </Button>,
      )
    } else {
      buttons.push(
        <Button key="view" variant="outline" size="sm" className="bg-white/10 border-white/20">
          <Eye className="w-4 h-4 mr-2" />
          View Proposal
        </Button>,
      )
    }

    if (!proposal.isSelected && !proposal.isWithdrawn && Date.now() / 1000 < Number(proposal.proposalDeadline)) {
      buttons.push(
        <Button key="edit" variant="outline" size="sm" className="bg-white/10 border-white/20">
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>,
      )
      buttons.push(
        <Button
          key="withdraw"
          variant="outline"
          size="sm"
          className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Withdraw
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

  if (proposals.length === 0) {
    return (
      <Card className="bg-white/5 backdrop-blur-md border-white/20">
        <CardContent className="p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No proposals submitted yet</h3>
          <p className="text-gray-400 mb-6">
            Browse available gigs and submit your first proposal to get started on EDU Chain.
          </p>
          <Button className="bg-gradient-to-r from-[#E23E6B] to-[#cc4368] hover:from-[#cc4368] hover:to-[#E23E6B] text-white">
            Browse Gigs
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">My Proposals</h2>
          <p className="text-gray-400">Track the status of your submitted proposals on EDU Chain</p>
        </div>
        <Badge variant="secondary" className="bg-[#E23E6B]/20 text-[#E23E6B] border-[#E23E6B]/30">
          {proposals.length} Proposals
        </Badge>
      </div>

      <div className="space-y-4">
        {proposals.map((proposal, index) => (
          <motion.div
            key={`${proposal.gigId}-${proposal.submittedAt}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <Card className="bg-white/5 backdrop-blur-md border-white/20 hover:bg-white/10 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{proposal.gigTitle}</h3>
                      {getStatusBadge(proposal)}
                    </div>
                    <p className="text-gray-300 mb-4 line-clamp-2">{proposal.gigDescription}</p>

                    {/* IPFS Data Display */}
                    {proposal.ipfsData && (
                      <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-green-400">Proposal Data Loaded from IPFS</span>
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${proposal.proposalUri.replace("ipfs://", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View on IPFS
                          </a>
                        </div>
                        <div className="text-sm text-gray-300">
                          <p className="line-clamp-2">
                            {proposal.ipfsData.coverLetter || proposal.ipfsData.description}
                          </p>
                          {proposal.ipfsData.estimatedHours && (
                            <p className="mt-1 text-xs text-gray-400">
                              Estimated: {proposal.ipfsData.estimatedHours} hours
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <DollarSign className="w-4 h-4 text-[#E23E6B]" />
                        <span>${(Number(proposal.gigBudget) / 1e6).toFixed(2)} USDT</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="w-4 h-4 text-[#E23E6B]" />
                        <span>
                          Submitted {Math.floor((Date.now() / 1000 - Number(proposal.submittedAt)) / (24 * 60 * 60))}{" "}
                          days ago
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <AlertCircle className="w-4 h-4 text-[#E23E6B]" />
                        <span>Gig ID: #{proposal.gigId}</span>
                      </div>
                    </div>

                    {proposal.isSelected && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span>🎉 Congratulations! Your proposal has been selected for this gig.</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">{getActionButtons(proposal)}</div>
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
