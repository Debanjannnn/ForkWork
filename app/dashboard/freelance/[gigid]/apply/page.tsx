"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Poppins } from "next/font/google"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { FREELANCE_CONTRACT_ADDRESS, FREELANCE_ABI } from "@/lib/contracts"
import { uploadToPinata } from "@/lib/pinata"
import { useWallet } from "@/contexts/wallet-context"

import { AuroraText } from "@/components/magicui/aurora-text"
import { WalletConnectModal } from "@/components/wallet-connect-module"
import { WalletDisplay } from "@/components/ui/wallet-display"
import ProposalForm from "@/components/freelance/proposal-form"
import { ArrowLeft, AlertCircle, Loader, XCircle, Send } from "lucide-react"

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
})

interface ProposalFormData {
  coverLetter: string
  experience: string
  approach: string
  timeline: string
  budget: string
  portfolio: string[]
  availability: string
}

function ApplyForGigPage() {
  const router = useRouter()
  const params = useParams()
  const { address, isConnected } = useWallet()
  const [showWalletModal, setShowWalletModal] = useState(false)

  const gigIdString = params.gigid as string
  const isIdValid = typeof gigIdString === "string" && !isNaN(Number.parseInt(gigIdString))
  const gigId = isIdValid ? BigInt(Number.parseInt(gigIdString)) : BigInt(0)

  const { data: gigDetails, isLoading: isLoadingGigDetails } = useReadContract({
    address: FREELANCE_CONTRACT_ADDRESS,
    abi: FREELANCE_ABI,
    functionName: "getGigDetails",
    args: [gigId],
  })

  const { data: canUserPropose, isLoading: isLoadingEligibility } = useReadContract({
    address: FREELANCE_CONTRACT_ADDRESS,
    abi: FREELANCE_ABI,
    functionName: "canUserPropose",
    args: [gigId, (address || "0x0000000000000000000000000000000000000000") as `0x${string}`],
  })

  const { data: hash, writeContractAsync, isPending: isWritePending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  const handleProposalSubmit = async (formData: ProposalFormData) => {
    const toastId = toast.loading("Preparing your proposal...")

    try {
      // Generate markdown content
      const markup = `
# Proposal for Gig

## Cover Letter
${formData.coverLetter}

## Experience & Background
${formData.experience}

## Project Approach
${formData.approach}

## Timeline
${formData.timeline}

${formData.budget ? `## Budget Breakdown\n${formData.budget}` : ""}

${
  formData.portfolio.filter((item) => item.trim()).length > 0
    ? `## Portfolio\n${formData.portfolio
        .filter((item) => item.trim())
        .map((item) => `- ${item}`)
        .join("\n")}`
    : ""
}

## Availability
${formData.availability}
      `.trim()

      toast.loading("Uploading proposal to IPFS...", { id: toastId })

      const proposalMetadata = {
        name: `Proposal for Gig ${gigId}`,
        title: `Proposal for Gig ${gigId}`,
        description: formData.coverLetter,
        coverLetter: formData.coverLetter,
        experience: formData.experience,
        approach: formData.approach,
        timeline: formData.timeline,
        budget: formData.budget,
        portfolio: formData.portfolio.filter((item) => item.trim()),
        availability: formData.availability,
        markup: markup,
        skills: [],
      }

      const proposalUri = await uploadToPinata(proposalMetadata)

      toast.loading("Submitting proposal to blockchain...", { id: toastId })

      await writeContractAsync({
        address: FREELANCE_CONTRACT_ADDRESS,
        abi: FREELANCE_ABI,
        functionName: "submitProposal",
        args: [gigId, proposalUri],
      })

      toast.loading("Transaction submitted! Waiting for confirmation...", { id: toastId })
    } catch (err: any) {
      console.error("Failed to submit proposal:", err)
      const errorMessage = err.shortMessage || err.message || "An unknown error occurred."
      toast.error(`Error: ${errorMessage}`, { id: toastId })
    }
  }

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Proposal submitted successfully!", { duration: 5000 })
      setTimeout(() => {
        router.push(`/dashboard/freelance/${gigIdString}`)
      }, 2000)
    }
  }, [isConfirmed, router, gigIdString])

  const isLoading = isLoadingGigDetails || isLoadingEligibility || isWritePending || isConfirming

  if (!isConnected) {
    return (
      <div className={cn("min-h-screen bg-black text-white py-8 px-4", poppins.className)}>
        <motion.div className="max-w-xl mx-auto bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center mt-24">
          <AlertCircle className="w-12 h-12 text-[#E23E6B] mx-auto mb-4" />
          <h3 className="text-xl font-thin mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400 mb-6">You need to connect your wallet to apply for a gig.</p>
          <motion.button
            onClick={() => setShowWalletModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl font-medium"
          >
            Connect Wallet
          </motion.button>
        </motion.div>
        <WalletConnectModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
      </div>
    )
  }

  if (isLoadingGigDetails || isLoadingEligibility) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader className="w-12 h-12 text-[#E23E6B] animate-spin" />
      </div>
    )
  }

  if (!canUserPropose) {
    return (
      <div className={cn("min-h-screen bg-black text-white py-8 px-4", poppins.className)}>
        <motion.div className="max-w-xl mx-auto bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center mt-24">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-thin mb-2">Not Eligible to Apply</h3>
          <p className="text-gray-400 mb-6">
            You cannot apply for this gig. This might be because you are the client, have already applied, or the
            proposal period has ended.
          </p>
          <Link href={`/dashboard/freelance/${gigIdString}`}>
            <motion.button className="flex items-center mx-auto gap-2 px-6 py-3 bg-white/10 border border-white/20 rounded-2xl font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back to Gig
            </motion.button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-4xl font-thin mb-2">
              <AuroraText colors={["#cc4368", "#e6295c", "#ffffff", "#E23E6B"]}>
                <span className="text-transparent">Apply for Gig</span>
              </AuroraText>
            </h1>
            <p className="text-gray-300/80 font-light">
              Submitting a proposal for: <span className="text-white font-medium">{gigDetails?.title}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <WalletDisplay />
            <Link href={`/dashboard/freelance/${gigIdString}`}>
              <motion.button
                className="flex items-center space-x-2 px-5 py-3 bg-white/10 border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Gig</span>
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <ProposalForm onSubmit={handleProposalSubmit} isLoading={isLoading} />

          <div className="mt-8">
            <motion.button
              type="submit"
              form="proposal-form"
              onClick={() => {
                const form = document.querySelector("form") as HTMLFormElement
                if (form) {
                  const formData = new FormData(form)
                  // This will trigger the form's onSubmit
                  form.requestSubmit()
                }
              }}
              className="w-full py-4 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader className="animate-spin w-5 h-5" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Proposal</span>
                </>
              )}
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
        </motion.div>
      </div>
      <WalletConnectModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </div>
  )
}

export default ApplyForGigPage
