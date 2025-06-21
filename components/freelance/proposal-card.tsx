"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { getFromPinata } from "@/lib/pinata"
import { User, Eye, Loader } from "lucide-react"

interface Proposal {
  freelancer: string
  proposalUri: string
  submittedAt: bigint
  isWithdrawn: boolean
  isAutoExpired: boolean
}

interface GigDetails {
    selectedFreelancer: string;
}

interface ProposalMetadata {
  coverLetter: string
}

interface ProposalCardProps {
  proposal: Proposal
  gigId: bigint
  gigDetails: GigDetails
}

export default function ProposalCard({ proposal, gigId, gigDetails }: ProposalCardProps) {
  const [metadata, setMetadata] = useState<ProposalMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProposalMeta = async () => {
      if (proposal?.proposalUri) {
        setIsLoading(true)
        try {
          const data = await getFromPinata(proposal.proposalUri)
          setMetadata(data)
        } catch (error) {
          console.error("Failed to fetch proposal metadata:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }
    fetchProposalMeta()
  }, [proposal])

  const getStatus = () => {
    if (proposal.freelancer.toLowerCase() === gigDetails.selectedFreelancer.toLowerCase()) {
        return { text: "Selected", color: "bg-green-500/20 text-green-400" };
    }
    if (proposal.isWithdrawn) return { text: "Withdrawn", color: "bg-red-500/20 text-red-400" };
    if (proposal.isAutoExpired) return { text: "Expired (Stake)", color: "bg-yellow-500/20 text-yellow-400" };
    return null;
  }

  const status = getStatus();

  return (
    <motion.div
      className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, borderColor: "rgba(255,255,255,0.2)" }}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#E23E6B]/80 to-[#cc4368]/80 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-sm">{`${proposal.freelancer.slice(0, 6)}...${proposal.freelancer.slice(-4)}`}</p>
              <p className="text-xs text-gray-400">
                Submitted on {new Date(Number(proposal.submittedAt) * 1000).toLocaleDateString()}
              </p>
            </div>
          </div>
          {status && (<div className={`text-xs px-2.5 py-1 rounded-full ${status.color}`}>{status.text}</div>)}
        </div>
        <div className="mb-6 min-h-[72px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full"><Loader className="w-6 h-6 animate-spin text-gray-400"/></div>
          ) : (
            <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">{metadata?.coverLetter || "Could not load proposal details."}</p>
          )}
        </div>
      </div>
      <Link href={`/dashboard/freelance/${gigId}/proposals/${proposal.freelancer}`}>
        <motion.button className="w-full py-3 bg-white/10 border border-white/20 text-white font-medium rounded-xl flex items-center justify-center gap-2">
          <Eye className="w-5 h-5" /> View Proposal
        </motion.button>
      </Link>
    </motion.div>
  )
}