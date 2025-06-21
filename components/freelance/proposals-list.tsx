"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { toast } from "sonner"

import { FREELANCE_CONTRACT_ADDRESS, FREELANCE_ABI } from "@/lib/contracts"
import { getFromPinata } from "@/lib/pinata"

import { Users, User, CheckCircle, Clock, FileText, ExternalLink, AlertCircle } from "lucide-react"

interface ProposalMetadata {
  approach: string
  timeline: string
  experience: string
  portfolio: string
  additionalNotes: string
}

interface Proposal {
  freelancer: string
  proposalUri: string
  submittedAt: bigint
  lastUpdatedAt: bigint
  isSelected: boolean
  isWithdrawn: boolean
  isAutoExpired: boolean
}

interface ProposalsListProps {
  gigId: number
  proposals: Proposal[]
  gigDetails: any
}

function ProposalCard({
  proposal,
  gigId,
  gigDetails,
  onSelect,
}: {
  proposal: Proposal
  gigId: number
  gigDetails: any
  onSelect: (freelancer: string) => void
}) {
  const [metadata, setMetadata] = useState<ProposalMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const data = await getFromPinata(proposal.proposalUri)
        // @ts-ignore
        setMetadata(data as ProposalMetadata)
      } catch (error) {
        console.error("Failed to fetch proposal metadata:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetadata()
  }, [proposal.proposalUri])

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }

  const getProposalStatus = () => {
    if (proposal.isSelected) return { label: "Selected", color: "text-green-400 bg-green-400/10 border-green-400/20" }
    if (proposal.isWithdrawn) return { label: "Withdrawn", color: "text-gray-400 bg-gray-400/10 border-gray-400/20" }
    if (proposal.isAutoExpired) return { label: "Expired", color: "text-red-400 bg-red-400/10 border-red-400/20" }
    return { label: "Active", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" }
  }

  const status = getProposalStatus()
  const canSelect =
    !gigDetails.selectedFreelancer || gigDetails.selectedFreelancer === "0x0000000000000000000000000000000000000000"

  return (
    <motion.div
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#E23E6B] to-[#cc4368] rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-medium">{`${proposal.freelancer.slice(0, 6)}...${proposal.freelancer.slice(-4)}`}</div>
            <div className="text-sm text-gray-400">Submitted {formatDate(proposal.submittedAt)}</div>
          </div>
        </div>
        <div className={`text-xs font-medium px-3 py-1 rounded-full border ${status.color}`}>{status.label}</div>
      </div>

      {isLoading ? (
        <div className="text-gray-400 text-sm">Loading proposal details...</div>
      ) : metadata ? (
        <div>
          <div className="mb-4">
            <h4 className="font-medium mb-2">Approach</h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              {isExpanded
                ? metadata.approach
                : `${metadata.approach.slice(0, 200)}${metadata.approach.length > 200 ? "..." : ""}`}
            </p>
          </div>

          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Timeline
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed">{metadata.timeline}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-green-400" />
                  Experience
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed">{metadata.experience}</p>
              </div>

              {metadata.portfolio && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-purple-400" />
                    Portfolio
                  </h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{metadata.portfolio}</p>
                </div>
              )}

              {metadata.additionalNotes && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-yellow-400" />
                    Additional Notes
                  </h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{metadata.additionalNotes}</p>
                </div>
              )}
            </motion.div>
          )}

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-[#E23E6B] hover:text-[#cc4368] transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isExpanded ? "Show Less" : "View Full Proposal"}
            </motion.button>

            {canSelect && status.label === "Active" && (
              <motion.button
                onClick={() => onSelect(proposal.freelancer)}
                className="px-4 py-2 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white text-sm font-medium rounded-xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Select Freelancer
              </motion.button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-red-400 text-sm">Failed to load proposal details</div>
      )}
    </motion.div>
  )
}

function ProposalsList({ gigId, proposals, gigDetails }: ProposalsListProps) {
  const { data: hash, writeContractAsync, isPending: isWritePending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  const handleSelectFreelancer = async (freelancer: string) => {
    const toastId = toast.loading("Selecting freelancer...")

    try {
      await writeContractAsync({
        address: FREELANCE_CONTRACT_ADDRESS,
        abi: FREELANCE_ABI,
        functionName: "selectFreelancer",
        // @ts-ignore
        args: [BigInt(gigId), freelancer],
      })

      toast.loading("Waiting for confirmation...", { id: toastId })
    } catch (err: any) {
      console.error("Failed to select freelancer:", err)
      const errorMessage = err.shortMessage || err.message || "An unknown error occurred."
      toast.error(`Error: ${errorMessage}`, { id: toastId })
    }
  }

  useState(() => {
    if (isConfirmed) {
      toast.success("Freelancer selected successfully!")
    }
  })

  const activeProposals = proposals.filter((p) => !p.isWithdrawn && !p.isAutoExpired)
  const isLoading = isWritePending || isConfirming

  return (
    <motion.div
      className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-thin flex items-center gap-2">
          <Users className="w-6 h-6 text-[#E23E6B]" />
          Proposals ({proposals.length})
        </h2>
        {gigDetails.selectedFreelancer &&
          gigDetails.selectedFreelancer !== "0x0000000000000000000000000000000000000000" && (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Freelancer Selected</span>
            </div>
          )}
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Proposals Yet</h3>
          <p className="text-gray-400">Freelancers haven't submitted any proposals for this gig yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal, index) => (
            <ProposalCard
              key={`${proposal.freelancer}-${index}`}
              proposal={proposal}
              gigId={gigId}
              gigDetails={gigDetails}
              onSelect={handleSelectFreelancer}
            />
          ))}
        </div>
      )}

      {hash && (
        <div className="mt-4 text-center text-sm text-gray-400">
          Transaction Hash:{" "}
          <a
            href={`https://opencampus-codex.blockscout.com/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#E23E6B] hover:underline"
          >
            View on Explorer
          </a>
        </div>
      )}
    </motion.div>
  )
}

export default ProposalsList
