"use client"

import React from "react"

import { useState } from "react"
import { motion, type Variants } from "framer-motion"
import { Poppins } from "next/font/google"
import { cn } from "@/lib/utils"
import { AuroraText } from "@/components/magicui/aurora-text"
import {
  ArrowLeft,
  Plus,
  Upload,
  Eye,
  FileText,
  Code,
  Palette,
  Search,
  Megaphone,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Zap,
  Clock,
  Coins,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { parseUnits, formatUnits } from "viem"
import { BOUNTY_CONTRACT_ADDRESS, BOUNTY_ABI, USDT_TOKEN_ADDRESS, ERC20_ABI } from "@/lib/contracts"
import { uploadToPinata, type PinataMetadata } from "@/lib/pinata"
import { useWallet } from "@/contexts/wallet-context"

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
})

const categories = [
  { value: 0, label: "Content", icon: FileText, emoji: "📝", description: "Writing, documentation, tutorials" },
  { value: 1, label: "Development", icon: Code, emoji: "🛠️", description: "Coding, smart contracts, apps" },
  { value: 2, label: "Design", icon: Palette, emoji: "🎨", description: "UI/UX, graphics, branding" },
  { value: 3, label: "Research", icon: Search, emoji: "🔍", description: "Analysis, reports, studies" },
  { value: 4, label: "Marketing", icon: Megaphone, emoji: "📢", description: "Promotion, social media, campaigns" },
  { value: 5, label: "Other", icon: MoreHorizontal, emoji: "⚡", description: "Miscellaneous tasks" },
]

interface FormData {
  name: string
  description: string
  category: string
  deadline: string
  totalReward: string
}

enum CreateStep {
  FORM = "form",
  IPFS = "ipfs",
  APPROVE = "approve",
  CREATE = "create",
  SUCCESS = "success",
}

export default function PostBounty() {
  const { address, isConnected } = useWallet()
  const [currentStep, setCurrentStep] = useState<CreateStep>(CreateStep.FORM)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    category: "",
    deadline: "",
    totalReward: "",
  })
  const [ipfsUri, setIpfsUri] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string>("")

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
      y: -4,
      scale: 1.01,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  }

  const {
    writeContract: approveContract,
    data: approveHash,
    isPending: isApprovePending,
    error: approveError,
  } = useWriteContract()

  const {
    writeContract: createContract,
    data: createHash,
    isPending: isCreatePending,
    error: createError,
  } = useWriteContract()

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  const { isLoading: isCreateConfirming, isSuccess: isCreateSuccess } = useWaitForTransactionReceipt({
    hash: createHash,
  })

  // Check USDT balance and allowance
  const { data: usdtBalance } = useReadContract({
    address: USDT_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address || "0x0"],
    query: { enabled: !!address },
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDT_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [address || "0x0", BOUNTY_CONTRACT_ADDRESS],
    query: { enabled: !!address },
  })

  const uploadToIPFS = async (metadata: PinataMetadata): Promise<string> => {
    setUploadProgress(0)
    setError("")
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 15
        })
      }, 300)

      const uri = await uploadToPinata(metadata)
      clearInterval(progressInterval)
      setUploadProgress(100)
      return uri
    } catch (error) {
      setError(`IPFS upload failed: ${error instanceof Error ? error.message : "Unknown error"}`)
      throw error
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!isConnected) {
      setError("Please connect your wallet first")
      return
    }

    // Validate form
    if (!formData.name || !formData.description || !formData.category || !formData.deadline || !formData.totalReward) {
      setError("Please fill in all fields")
      return
    }

    const deadlineDate = new Date(formData.deadline)
    if (deadlineDate <= new Date()) {
      setError("Deadline must be in the future")
      return
    }

    const rewardAmount = Number.parseFloat(formData.totalReward)
    if (rewardAmount <= 0) {
      setError("Reward must be greater than 0")
      return
    }

    if (usdtBalance && parseUnits(formData.totalReward, 6) > usdtBalance) {
      setError("Insufficient USDT balance")
      return
    }

    setCurrentStep(CreateStep.IPFS)

    try {
      const deadlineTimestamp = Math.floor(deadlineDate.getTime() / 1000)
      const categoryId = Number.parseInt(formData.category)

      const metadata: PinataMetadata = {
        name: formData.name,
        description: formData.description,
        category: categoryId,
        deadline: deadlineTimestamp,
        createdAt: Date.now(),
      }

      const uri = await uploadToIPFS(metadata)
      setIpfsUri(uri)

      const rewardAmount = parseUnits(formData.totalReward, 6)
      const currentAllowance = allowance || 0n

      if (currentAllowance < rewardAmount) {
        setCurrentStep(CreateStep.APPROVE)
        approveContract({
          address: USDT_TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [BOUNTY_CONTRACT_ADDRESS, rewardAmount],
        })
      } else {
        setCurrentStep(CreateStep.CREATE)
        createBounty(uri)
      }
    } catch (error) {
      console.error("Error in bounty creation process:", error)
      setCurrentStep(CreateStep.FORM)
    }
  }

  const createBounty = (uri: string = ipfsUri) => {
    const deadlineTimestamp = Math.floor(new Date(formData.deadline).getTime() / 1000)
    const rewardAmount = parseUnits(formData.totalReward, 6)
    const categoryId = Number.parseInt(formData.category)

    createContract({
      address: BOUNTY_CONTRACT_ADDRESS,
      abi: BOUNTY_ABI,
      functionName: "createBounty",
      args: [formData.name, uri, categoryId, BigInt(deadlineTimestamp), rewardAmount],
    })
  }

  // Handle approval success
  React.useEffect(() => {
    if (isApproveSuccess && currentStep === CreateStep.APPROVE) {
      setCurrentStep(CreateStep.CREATE)
      refetchAllowance()
      createBounty()
    }
  }, [isApproveSuccess, currentStep])

  // Handle create success
  React.useEffect(() => {
    if (isCreateSuccess && currentStep === CreateStep.CREATE) {
      setCurrentStep(CreateStep.SUCCESS)
    }
  }, [isCreateSuccess, currentStep])

  // Handle errors
  React.useEffect(() => {
    if (approveError) {
      setError(`Approval failed: ${approveError.message}`)
      setCurrentStep(CreateStep.FORM)
    }
  }, [approveError])

  React.useEffect(() => {
    if (createError) {
      setError(`Bounty creation failed: ${createError.message}`)
      setCurrentStep(CreateStep.FORM)
    }
  }, [createError])

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      deadline: "",
      totalReward: "",
    })
    setCurrentStep(CreateStep.FORM)
    setIpfsUri("")
    setUploadProgress(0)
    setError("")
  }

  const getStepProgress = () => {
    switch (currentStep) {
      case CreateStep.FORM:
        return 0
      case CreateStep.IPFS:
        return 25
      case CreateStep.APPROVE:
        return 50
      case CreateStep.CREATE:
        return 75
      case CreateStep.SUCCESS:
        return 100
      default:
        return 0
    }
  }

  const selectedCategory = categories.find((cat) => cat.value.toString() === formData.category)

  const renderMarkdownPreview = (markdown: string) => {
    if (!markdown) return <p className="text-gray-400 italic">Preview will appear here...</p>

    return (
      <div className="prose prose-invert prose-sm max-w-none">
        {markdown.split("\n").map((line, i) => {
          if (line.startsWith("## ")) {
            return (
              <h2 key={i} className="text-lg font-bold mt-4 mb-2 text-white">
                {line.slice(3)}
              </h2>
            )
          }
          if (line.startsWith("### ")) {
            return (
              <h3 key={i} className="text-md font-semibold mt-3 mb-1 text-gray-200">
                {line.slice(4)}
              </h3>
            )
          }
          if (line.startsWith("- [ ] ")) {
            return (
              <div key={i} className="flex items-center gap-2 my-1">
                <input type="checkbox" disabled className="rounded bg-white/10 border-white/20" />
                <span className="text-gray-300">{line.slice(6)}</span>
              </div>
            )
          }
          if (line.startsWith("- ")) {
            return (
              <li key={i} className="ml-4 my-1 text-gray-300">
                {line.slice(2)}
              </li>
            )
          }
          return line ? (
            <p key={i} className="mb-2 text-gray-300">
              {line}
            </p>
          ) : (
            <br key={i} />
          )
        })}
      </div>
    )
  }

  if (currentStep === CreateStep.SUCCESS) {
    return (
      <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 group overflow-hidden relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-[#E23E6B]/20 opacity-50 rounded-3xl"></div>
            <div className="relative z-10 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h2 className={cn("text-3xl font-thin mb-4", poppins.className)}>
                <AuroraText colors={["#22c55e", "#16a34a", "#ffffff", "#E23E6B"]}>
                  <span className="text-transparent">Bounty Created Successfully!</span>
                </AuroraText>
              </h2>
              <p className="text-gray-300 mb-8">Your bounty has been created and is now live on the platform.</p>

              <div className="grid gap-6 mb-8">
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
                  <h3 className="font-semibold text-green-400 mb-4">Bounty Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Title:</span>
                      <span className="text-white">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Category:</span>
                      <div className="flex items-center gap-2">
                        <span>{selectedCategory?.emoji}</span>
                        <span className="text-white">{selectedCategory?.label}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reward:</span>
                      <span className="text-white">{formData.totalReward} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Deadline:</span>
                      <span className="text-white">{new Date(formData.deadline).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {ipfsUri && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
                    <h3 className="font-semibold text-blue-400 mb-2">IPFS Metadata</h3>
                    <div className="font-mono text-xs bg-white/5 p-3 rounded border break-all text-blue-300">
                      {ipfsUri}
                    </div>
                  </div>
                )}

                <div className="bg-gray-500/10 border border-gray-500/20 rounded-2xl p-6">
                  <h3 className="font-semibold text-gray-400 mb-2">Transaction Hash</h3>
                  <div className="font-mono text-xs bg-white/5 p-3 rounded border break-all text-gray-300">
                    {createHash}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <motion.button
                  onClick={resetForm}
                  className="px-8 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Create Another Bounty
                </motion.button>
                <Link href="/dashboard/bounty">
                  <motion.button
                    className="px-8 py-3 bg-white/10 text-white font-medium rounded-2xl hover:bg-white/20 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View All Bounties
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <motion.h1
              className={cn("text-3xl md:text-4xl font-thin mb-2", poppins.className)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <AuroraText colors={["#cc4368", "#e6295c", "#ffffff", "#E23E6B"]}>
                <span className="text-transparent">Create New Bounty</span>
              </AuroraText>
            </motion.h1>
            <motion.p
              className="text-gray-300/80 text-lg font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              Fund your project with USDT tokens
            </motion.p>
          </div>

          <Link href="/dashboard/bounty">
            <motion.button
              className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Bounties</span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex justify-between text-sm mb-3">
            <span className="font-medium">Progress</span>
            <span className="text-[#E23E6B]">{getStepProgress()}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 mb-4">
            <motion.div
              className="bg-gradient-to-r from-[#E23E6B] to-[#cc4368] h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${getStepProgress()}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span className={currentStep === CreateStep.FORM ? "text-[#E23E6B] font-medium" : ""}>📝 Form</span>
            <span className={currentStep === CreateStep.IPFS ? "text-[#E23E6B] font-medium" : ""}>📤 IPFS</span>
            <span className={currentStep === CreateStep.APPROVE ? "text-[#E23E6B] font-medium" : ""}>✅ Approve</span>
            <span className={currentStep === CreateStep.CREATE ? "text-[#E23E6B] font-medium" : ""}>🚀 Create</span>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}

        {/* Loading States */}
        {currentStep === CreateStep.IPFS && (
          <motion.div
            className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-12 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="relative mb-6">
              <Upload className="w-16 h-16 mx-auto text-blue-500 animate-pulse" />
              <div className="absolute -top-2 -right-2">
                <div className="bg-blue-500 text-white rounded-full p-1">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
            </div>
            <h3 className="text-xl font-thin mb-2">Uploading to IPFS</h3>
            <p className="text-gray-400 mb-4">Storing bounty metadata on Pinata...</p>
            <div className="w-full bg-white/10 rounded-full h-2 max-w-md mx-auto">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-blue-700 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{uploadProgress}% complete</p>
          </motion.div>
        )}

        {currentStep === CreateStep.APPROVE && (
          <motion.div
            className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-12 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="relative mb-6">
              {isApprovePending || isApproveConfirming ? (
                <Loader2 className="w-16 h-16 text-yellow-500 animate-spin mx-auto" />
              ) : (
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              )}
              <div className="absolute -top-2 -right-2">
                <div className="bg-yellow-500 text-white rounded-full p-1">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
            </div>
            <h3 className="text-xl font-thin mb-2">
              {isApprovePending
                ? "Approving USDT..."
                : isApproveConfirming
                  ? "Confirming Approval..."
                  : "Approval Complete"}
            </h3>
            <p className="text-gray-400">
              {isApprovePending
                ? "Please confirm the transaction in your wallet"
                : isApproveConfirming
                  ? "Waiting for blockchain confirmation"
                  : "USDT approval successful, creating bounty..."}
            </p>
          </motion.div>
        )}

        {currentStep === CreateStep.CREATE && (
          <motion.div
            className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-12 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="relative mb-6">
              {isCreatePending || isCreateConfirming ? (
                <Loader2 className="w-16 h-16 text-[#E23E6B] animate-spin mx-auto" />
              ) : (
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              )}
              <div className="absolute -top-2 -right-2">
                <div className="bg-[#E23E6B] text-white rounded-full p-1">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
            </div>
            <h3 className="text-xl font-thin mb-2">
              {isCreatePending
                ? "Creating Bounty..."
                : isCreateConfirming
                  ? "Confirming Creation..."
                  : "Creation Complete"}
            </h3>
            <p className="text-gray-400">
              {isCreatePending
                ? "Please confirm the transaction in your wallet"
                : isCreateConfirming
                  ? "Waiting for blockchain confirmation"
                  : "Bounty created successfully"}
            </p>
          </motion.div>
        )}

        {/* Form */}
        {currentStep === CreateStep.FORM && (
          <motion.div
            className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 group overflow-hidden relative"
            variants={cardVariants}
            custom={0}
            initial="initial"
            animate="animate"
            whileHover="hover"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white to-[#E23E6B] opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-3xl"></div>
            <div className="relative z-10">
              <form onSubmit={handleFormSubmit} className="space-y-8">
                {/* Bounty Title */}
                <div className="space-y-3">
                  <label className="text-base font-medium flex items-center gap-2">🏷️ Bounty Title</label>
                  <input
                    type="text"
                    placeholder="E.g., Build a frontend dashboard for Coro Tashi"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
                    required
                  />
                  <p className="text-sm text-gray-400">What's the title of your bounty?</p>
                </div>

                {/* Description with Markdown Support */}
                <div className="space-y-3">
                  <label className="text-base font-medium flex items-center gap-2">📝 Description (Markdown)</label>
                  <div className="border border-white/20 rounded-2xl overflow-hidden">
                    <div className="flex border-b border-white/20">
                      <button
                        type="button"
                        className="flex-1 px-4 py-2 bg-white/5 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Write
                      </button>
                      <button
                        type="button"
                        className="flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-colors duration-200"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                    </div>
                    <textarea
                      placeholder="E.g., ## Task Overview&#10;Build a React app to visualize staking data...&#10;&#10;### Requirements&#10;- [ ] Responsive design&#10;- [ ] Real-time data&#10;- [ ] Clean UI/UX"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={10}
                      className="w-full p-4 bg-transparent text-white placeholder-gray-400 focus:outline-none resize-none font-mono text-sm"
                      required
                    />
                  </div>
                  <p className="text-sm text-gray-400">
                    📌 <strong>Note:</strong> This markdown will be saved as JSON metadata to IPFS via Pinata.
                  </p>
                </div>

                {/* Reward Amount */}
                <div className="space-y-3">
                  <label className="text-base font-medium flex items-center gap-2">🧮 Reward in USDT</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      step="0.000001"
                      min="0"
                      placeholder="E.g., 100.00"
                      value={formData.totalReward}
                      onChange={(e) => setFormData({ ...formData, totalReward: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
                      required
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total reward (in USDT)</span>
                    {usdtBalance !== undefined && (
                      <span className="text-gray-400">
                        Available: <span className="text-white font-medium">{formatUnits(usdtBalance, 6)} USDT</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Category Selection */}
                <div className="space-y-3">
                  <label className="text-base font-medium flex items-center gap-2">🗃️ Category</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categories.map((category) => {
                      const isSelected = formData.category === category.value.toString()
                      return (
                        <motion.div
                          key={category.value}
                          className={`border rounded-2xl p-4 cursor-pointer transition-all ${
                            isSelected
                              ? "border-[#E23E6B] bg-[#E23E6B]/10 shadow-lg"
                              : "border-white/20 hover:border-white/40 hover:bg-white/5"
                          }`}
                          onClick={() => setFormData({ ...formData, category: category.value.toString() })}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">{category.emoji}</div>
                            <div className="flex-1">
                              <div className={`font-medium ${isSelected ? "text-white" : "text-gray-200"}`}>
                                {category.label}
                              </div>
                              <div className={`text-xs mt-1 ${isSelected ? "text-gray-300" : "text-gray-400"}`}>
                                {category.description}
                              </div>
                            </div>
                            {isSelected && <CheckCircle className="w-5 h-5 text-[#E23E6B] flex-shrink-0" />}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                {/* Deadline */}
                <div className="space-y-3">
                  <label className="text-base font-medium flex items-center gap-2">📅 Deadline</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
                      required
                    />
                  </div>
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Must be a future date
                  </p>
                </div>

                {/* Transaction Status */}
                {formData.totalReward && allowance !== undefined && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                    <h3 className="font-medium text-blue-400 mb-3">Transaction Status</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">USDT Allowance:</span>
                        <span className="text-white">{formatUnits(allowance, 6)} USDT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Required Amount:</span>
                        <span className="text-white">{formData.totalReward} USDT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Approval Needed:</span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            parseUnits(formData.totalReward || "0", 6) > allowance
                              ? "bg-red-500/20 text-red-400"
                              : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {parseUnits(formData.totalReward || "0", 6) > allowance ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <motion.button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isConnected}
                  whileHover={{ scale: isConnected ? 1.02 : 1 }}
                  whileTap={{ scale: isConnected ? 0.98 : 1 }}
                >
                  {!isConnected ? (
                    "Connect Wallet to Create Bounty"
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5" />
                      <span>
                        {allowance !== undefined &&
                        formData.totalReward &&
                        parseUnits(formData.totalReward || "0", 6) > allowance
                          ? "Approve & Create Bounty"
                          : "Create Bounty"}
                      </span>
                    </div>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
