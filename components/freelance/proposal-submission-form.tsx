"use client"

import { useState, type FormEvent } from "react"
import { motion } from "framer-motion"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { toast } from "sonner"

import { FREELANCE_CONTRACT_ADDRESS, FREELANCE_ABI } from "@/lib/contracts"
import { uploadToPinata } from "@/lib/pinata"
import { useWallet } from "@/contexts/wallet-context"

import { Send, FileText, Clock, User, AlertCircle } from "lucide-react"

interface ProposalMetadata {
  approach: string
  timeline: string
  experience: string
  portfolio: string
  additionalNotes: string
}

interface ProposalSubmissionFormProps {
  gigId: number
}

function ProposalSubmissionForm({ gigId }: ProposalSubmissionFormProps) {
  const { address, isConnected } = useWallet()
  const [isExpanded, setIsExpanded] = useState(false)

  // Form state
  const [approach, setApproach] = useState("")
  const [timeline, setTimeline] = useState("")
  const [experience, setExperience] = useState("")
  const [portfolio, setPortfolio] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")

  // Transaction state
  const { data: hash, writeContractAsync, isPending: isWritePending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!approach || !timeline || !experience) {
      toast.error("Please fill out all required fields.")
      return
    }

    const toastId = toast.loading("Submitting your proposal...")

    try {
      toast.loading("Uploading proposal to IPFS...", { id: toastId })

      const metadata: ProposalMetadata = {
        approach,
        timeline,
        experience,
        portfolio,
        additionalNotes,
      }
 //@ts-ignore
      const proposalUri = await uploadToPinata(metadata)
      toast.loading("Submitting to blockchain...", { id: toastId })

      await writeContractAsync({
        address: FREELANCE_CONTRACT_ADDRESS,
        abi: FREELANCE_ABI,
        functionName: "submitProposal",
        args: [BigInt(gigId), proposalUri],
      })

      toast.loading("Waiting for confirmation...", { id: toastId })
    } catch (err: any) {
      console.error("Failed to submit proposal:", err)
      const errorMessage = err.shortMessage || err.message || "An unknown error occurred."
      toast.error(`Error: ${errorMessage}`, { id: toastId })
    }
  }

  useState(() => {
    if (isConfirmed) {
      toast.success("Proposal submitted successfully!")
      // Reset form
      setApproach("")
      setTimeline("")
      setExperience("")
      setPortfolio("")
      setAdditionalNotes("")
      setIsExpanded(false)
    }
  })

  if (!isConnected) {
    return (
      <motion.div
        className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AlertCircle className="w-12 h-12 text-[#E23E6B] mx-auto mb-4" />
        <h3 className="text-xl font-thin mb-2">Connect Your Wallet</h3>
        <p className="text-gray-400">You need to connect your wallet to submit a proposal.</p>
      </motion.div>
    )
  }

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
          <Send className="w-6 h-6 text-[#E23E6B]" />
          Submit Proposal
        </h2>
        {!isExpanded && (
          <motion.button
            onClick={() => setIsExpanded(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-xl font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Proposal
          </motion.button>
        )}
      </div>

      {!isExpanded ? (
        <p className="text-gray-400">
          Ready to work on this project? Submit your proposal with your approach, timeline, and relevant experience.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <fieldset disabled={isLoading}>
            {/* Approach */}
            <div className="mb-6">
              <label className="flex items-center text-gray-300 text-sm mb-2">
                <FileText className="w-4 h-4 text-gray-400 mr-2" />
                <span className="font-medium">Your Approach *</span>
              </label>
              <textarea
                placeholder="Describe your approach to completing this project. What technologies will you use? What's your development strategy?"
                value={approach}
                onChange={(e) => setApproach(e.target.value)}
                className="w-full pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200 min-h-[120px] resize-none"
                required
              />
            </div>

            {/* Timeline */}
            <div className="mb-6">
              <label className="flex items-center text-gray-300 text-sm mb-2">
                <Clock className="w-4 h-4 text-gray-400 mr-2" />
                <span className="font-medium">Timeline & Milestones *</span>
              </label>
              <textarea
                placeholder="Break down your timeline with key milestones. When will you deliver each phase of the project?"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="w-full pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200 min-h-[100px] resize-none"
                required
              />
            </div>

            {/* Experience */}
            <div className="mb-6">
              <label className="flex items-center text-gray-300 text-sm mb-2">
                <User className="w-4 h-4 text-gray-400 mr-2" />
                <span className="font-medium">Relevant Experience *</span>
              </label>
              <textarea
                placeholder="Highlight your relevant experience for this project. What similar projects have you completed?"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200 min-h-[100px] resize-none"
                required
              />
            </div>

            {/* Portfolio */}
            <div className="mb-6">
              <label className="flex items-center text-gray-300 text-sm mb-2">
                <FileText className="w-4 h-4 text-gray-400 mr-2" />
                <span className="font-medium">Portfolio Links</span>
              </label>
              <textarea
                placeholder="Share links to your portfolio, GitHub, previous work, or any relevant examples (optional)"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                className="w-full pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200 min-h-[80px] resize-none"
              />
            </div>

            {/* Additional Notes */}
            <div className="mb-6">
              <label className="flex items-center text-gray-300 text-sm mb-2">
                <FileText className="w-4 h-4 text-gray-400 mr-2" />
                <span className="font-medium">Additional Notes</span>
              </label>
              <textarea
                placeholder="Any additional information you'd like to share with the client (optional)"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200 min-h-[80px] resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <motion.button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl font-medium hover:bg-white/20 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isLoading}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Submit Proposal"}
              </motion.button>
            </div>

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
          </fieldset>
        </form>
      )}
    </motion.div>
  )
}

export default ProposalSubmissionForm
