"use client"

import { useState, useEffect, type FormEvent, type ReactNode } from "react"
import { motion } from "framer-motion"
import { Poppins } from 'next/font/google'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseUnits, parseEther } from "viem"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { FREELANCE_CONTRACT_ADDRESS, FREELANCE_ABI } from "@/lib/contracts"
import { uploadToPinata } from "@/lib/pinata"
import { useWallet } from "@/contexts/wallet-context"

import { AuroraText } from "@/components/magicui/aurora-text"
import { WalletConnectModal } from "@/components/wallet-connect-module"
import { WalletDisplay } from "@/components/ui/wallet-display"
import { ArrowLeft, Briefcase, DollarSign, Clock, FileText, Sparkles, AlertCircle, Info } from 'lucide-react'

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
})

const FormField = ({
  label,
  icon,
  children,
  tooltip,
}: {
  label: string
  icon: ReactNode
  children: ReactNode
  tooltip?: string
}) => (
  <motion.div
    className="mb-6"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <label className="flex items-center text-gray-300 text-sm mb-2">
      {icon}
      <span className="ml-2 font-medium">{label}</span>
      {tooltip && (
        <div className="relative group ml-2">
          <Info className="w-4 h-4 text-gray-400 cursor-pointer" />
          <div className="absolute bottom-full mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 border border-white/20">
            {tooltip}
          </div>
        </div>
      )}
    </label>
    {children}
  </motion.div>
)

interface GigMetadata {
  title: string
  description: string
  requirements: string[]
  deliverables: string[]
  skills: string[]
}

function PostGigPage() {
  const router = useRouter()
  const { address, isConnected } = useWallet()
  const [showWalletModal, setShowWalletModal] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [detailedDescription, setDetailedDescription] = useState("")
  const [requirements, setRequirements] = useState("")
  const [deliverables, setDeliverables] = useState("")
  const [skills, setSkills] = useState("")
  const [usdtAmount, setUsdtAmount] = useState("")
  const [nativeStake, setNativeStake] = useState("")
  const [duration, setDuration] = useState("")
  const [proposalDuration, setProposalDuration] = useState("")

  // Transaction state
  const { data: hash, writeContractAsync, isPending: isWritePending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (
      !title ||
      !shortDescription ||
      !detailedDescription ||
      !usdtAmount ||
      !duration ||
      !proposalDuration
    ) {
      toast.error("Please fill out all required fields.")
      return
    }

    if (Number(proposalDuration) > Number(duration)) {
      toast.error("Proposal duration cannot be longer than the total gig duration.")
      return
    }

    const toastId = toast.loading("Preparing your gig...")

    try {
      toast.loading("Uploading details to IPFS...", { id: toastId })
      
      const metadata: GigMetadata = {
        title,
        description: detailedDescription,
        requirements: requirements.split('\n').filter(Boolean),
        deliverables: deliverables.split('\n').filter(Boolean),
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      }
      
      const detailsUri = await uploadToPinata({
        ...metadata,
        name: title,
      })
      toast.loading("Submitting transaction...", { id: toastId })

      const usdtAmountBigInt = parseUnits(usdtAmount, 6)
      const nativeStakeBigInt = nativeStake ? parseEther(nativeStake) : BigInt(0)
      const durationDaysBigInt = BigInt(duration)
      const proposalDurationDaysBigInt = BigInt(proposalDuration)

      await writeContractAsync({
        address: FREELANCE_CONTRACT_ADDRESS,
        abi: FREELANCE_ABI,
        functionName: "postGig",
        args: [
          title,
          shortDescription,
          detailsUri,
          usdtAmountBigInt,
          nativeStakeBigInt,
          durationDaysBigInt,
          proposalDurationDaysBigInt,
        ],
      })

      toast.loading("Waiting for confirmation...", { id: toastId })
    } catch (err: any) {
      console.error("Failed to post gig:", err)
      const errorMessage = err.shortMessage || err.message || "An unknown error occurred."
      toast.error(`Error: ${errorMessage}`, { id: toastId })
    }
  }

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Gig posted successfully!")
      setTimeout(() => {
        router.push("/dashboard/freelance")
      }, 2000)
    }
  }, [isConfirmed, router])

  if (!isConnected) {
    return (
      <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
        <motion.div
          className="max-w-xl mx-auto bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center mt-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="w-12 h-12 text-[#E23E6B] mx-auto mb-4" />
          <h3 className="text-xl font-thin mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400 mb-6">You need to connect your wallet before you can post a new gig.</p>
          <motion.button
            onClick={() => setShowWalletModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Connect Wallet
          </motion.button>
        </motion.div>
        <WalletConnectModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
      </div>
    )
  }

  const isLoading = isWritePending || isConfirming

  return (
    <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-4xl font-thin mb-2">
              <AuroraText colors={["#cc4368", "#e6295c", "#ffffff", "#E23E6B"]}>
                <span className="text-transparent">Post a New Gig</span>
              </AuroraText>
            </h1>
            <p className="text-gray-300/80 font-light">Define the scope, budget, and timeline for your project.</p>
          </div>
          <div className="flex items-center gap-4">
            <WalletDisplay />
            <Link href="/dashboard/freelance">
              <motion.button
                className="flex items-center space-x-2 px-5 py-3 bg-white/10 border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <fieldset disabled={isLoading}>
            {/* Gig Title */}
            <FormField label="Gig Title" icon={<Briefcase className="w-4 h-4 text-gray-400" />}>
              <input
                type="text"
                placeholder="e.g., Build a DeFi Staking Dashboard"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
                required
              />
            </FormField>

            {/* Short Description */}
            <FormField 
              label="Short Description" 
              icon={<FileText className="w-4 h-4 text-gray-400" />} 
              tooltip="A brief summary that will be stored on-chain. Keep it concise."
            >
              <textarea
                placeholder="A one-sentence summary of the gig."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200 min-h-[60px] resize-none"
                maxLength={280}
                required
              />
              <div className="text-xs text-gray-400 mt-1">{shortDescription.length}/280 characters</div>
            </FormField>
            
            {/* Detailed Description */}
            <FormField 
              label="Detailed Description" 
              icon={<FileText className="w-4 h-4 text-gray-400" />} 
              tooltip="Full gig details. This will be stored on IPFS."
            >
              <textarea
                placeholder="Provide a comprehensive description of the gig requirements, deliverables, and any other relevant information..."
                value={detailedDescription}
                onChange={(e) => setDetailedDescription(e.target.value)}
                className="w-full pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200 min-h-[150px] resize-none"
                required
              />
            </FormField>

            {/* Requirements */}
            <FormField 
              label="Requirements" 
              icon={<FileText className="w-4 h-4 text-blue-400" />}
              tooltip="List each requirement on a new line"
            >
              <textarea
                placeholder="- Experience with React and TypeScript&#10;- Knowledge of Web3 development&#10;- Portfolio of previous DeFi projects"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="w-full pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200 min-h-[100px] resize-none"
              />
            </FormField>

            {/* Deliverables */}
            <FormField 
              label="Deliverables" 
              icon={<FileText className="w-4 h-4 text-green-400" />}
              tooltip="List each deliverable on a new line"
            >
              <textarea
                placeholder="- Fully functional staking dashboard&#10;- Smart contract integration&#10;- Responsive design for mobile and desktop&#10;- Documentation and deployment guide"
                value={deliverables}
                onChange={(e) => setDeliverables(e.target.value)}
                className="w-full pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200 min-h-[100px] resize-none"
              />
            </FormField>
            
            {/* Skills */}
            <FormField 
              label="Required Skills" 
              icon={<Sparkles className="w-4 h-4 text-gray-400" />} 
              tooltip="Enter skills separated by commas"
            >
              <input
                type="text"
                placeholder="React, Solidity, Ethers.js, TypeScript"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
              />
            </FormField>

            <div className="grid md:grid-cols-2 gap-6">
              {/* USDT Amount */}
              <FormField label="Payment (USDT)" icon={<DollarSign className="w-4 h-4 text-green-400" />}>
                <input
                  type="number"
                  placeholder="e.g., 1000"
                  value={usdtAmount}
                  onChange={(e) => setUsdtAmount(e.target.value)}
                  className="w-full pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
                  min="0"
                  step="0.01"
                  required
                />
              </FormField>

              {/* Native Stake */}
              <FormField 
                label="Freelancer Stake (EDU)" 
                icon={<DollarSign className="w-4 h-4 text-yellow-400" />} 
                tooltip="Optional stake that freelancers must deposit. Returned upon completion."
              >
                <input
                  type="number"
                  placeholder="e.g., 50 (Optional)"
                  value={nativeStake}
                  onChange={(e) => setNativeStake(e.target.value)}
                  className="w-full pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
                  min="0"
                  step="0.01"
                />
              </FormField>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Total Duration */}
              <FormField label="Total Duration (Days)" icon={<Clock className="w-4 h-4 text-gray-400" />}>
                <input
                  type="number"
                  placeholder="e.g., 30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
                  min="1"
                  required
                />
              </FormField>

              {/* Proposal Duration */}
              <FormField 
                label="Proposal Duration (Days)" 
                icon={<Clock className="w-4 h-4 text-blue-400" />} 
                tooltip="How long freelancers have to submit proposals"
              >
                <input
                  type="number"
                  placeholder="e.g., 7"
                  value={proposalDuration}
                  onChange={(e) => setProposalDuration(e.target.value)}
                  className="w-full pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
                  min="1"
                  required
                />
              </FormField>
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <motion.button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Post Gig"}
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
        </motion.form>
      </div>

      <WalletConnectModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </div>
  )
}

export default PostGigPage
