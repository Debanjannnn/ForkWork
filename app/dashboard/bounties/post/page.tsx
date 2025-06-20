"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
  Info,
  ExternalLink,
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
  {
    value: 0,
    label: "Content",
    icon: FileText,
    emoji: "📝",
    description: "Writing, documentation, tutorials",
    color: "from-blue-500 to-blue-700",
  },
  {
    value: 1,
    label: "Development",
    icon: Code,
    emoji: "🛠️",
    description: "Coding, smart contracts, apps",
    color: "from-green-500 to-green-700",
  },
  {
    value: 2,
    label: "Design",
    icon: Palette,
    emoji: "🎨",
    description: "UI/UX, graphics, branding",
    color: "from-purple-500 to-purple-700",
  },
  {
    value: 3,
    label: "Research",
    icon: Search,
    emoji: "🔍",
    description: "Analysis, reports, studies",
    color: "from-yellow-500 to-yellow-700",
  },
  {
    value: 4,
    label: "Marketing",
    icon: Megaphone,
    emoji: "📢",
    description: "Promotion, social media, campaigns",
    color: "from-pink-500 to-pink-700",
  },
  {
    value: 5,
    label: "Other",
    icon: MoreHorizontal,
    emoji: "⚡",
    description: "Miscellaneous tasks",
    color: "from-gray-500 to-gray-700",
  },
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
  const [showPreview, setShowPreview] = useState(false)
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
    // @ts-ignore
    args: [address || "0x0"],
    query: { enabled: !!address },
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDT_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    // @ts-ignore
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
      // @ts-ignore
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
  useEffect(() => {
    if (isApproveSuccess && currentStep === CreateStep.APPROVE) {
      setCurrentStep(CreateStep.CREATE)
      refetchAllowance()
      createBounty()
    }
  }, [isApproveSuccess, currentStep])

  // Handle create success
  useEffect(() => {
    if (isCreateSuccess && currentStep === CreateStep.CREATE) {
      setCurrentStep(CreateStep.SUCCESS)
    }
  }, [isCreateSuccess, currentStep])

  // Handle errors
  useEffect(() => {
    if (approveError) {
      setError(`Approval failed: ${approveError.message}`)
      setCurrentStep(CreateStep.FORM)
    }
  }, [approveError])

  useEffect(() => {
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
          if (line.startsWith("# ")) {
            return (
              <h1 key={i} className="text-2xl font-bold mt-6 mb-3 text-white">
                {line.slice(2)}
              </h1>
            )
          }
          if (line.startsWith("## ")) {
            return (
              <h2 key={i} className="text-xl font-bold mt-5 mb-3 text-gray-200">
                {line.slice(3)}
              </h2>
            )
          }
          if (line.startsWith("### ")) {
            return (
              <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-gray-300">
                {line.slice(4)}
              </h3>
            )
          }
          if (line.startsWith("- [ ] ")) {
            return (
              <div key={i} className="flex items-center gap-2 my-2">
                <input type="checkbox" disabled className="rounded bg-white/10 border-white/20" />
                <span className="text-gray-300">{line.slice(6)}</span>
              </div>
            )
          }
          if (line.startsWith("- [x] ")) {
            return (
              <div key={i} className="flex items-center gap-2 my-2">
                <input type="checkbox" checked disabled className="rounded bg-green-500 border-green-500" />
                <span className="text-gray-300 line-through">{line.slice(6)}</span>
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
          if (line.trim() === "---") {
            return <hr key={i} className="my-4 border-white/20" />
          }
          return line ? (
            <p key={i} className="mb-3 text-gray-300 leading-relaxed">
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
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              </motion.div>

              <motion.h2
                className={cn("text-3xl md:text-4xl font-thin mb-4", poppins.className)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <AuroraText colors={["#22c55e", "#16a34a", "#ffffff", "#E23E6B"]}>
                  <span className="text-transparent">Bounty Created Successfully!</span>
                </AuroraText>
              </motion.h2>

              <motion.p
                className="text-gray-300 mb-8 text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Your bounty is now live and ready to receive submissions
              </motion.p>

              <motion.div
                className="grid gap-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
                  <h3 className="font-semibold text-green-400 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Bounty Details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Title:</span>
                      <span className="text-white font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Category:</span>
                      <div className="flex items-center gap-2">
                        <span>{selectedCategory?.emoji}</span>
                        <span className="text-white font-medium">{selectedCategory?.label}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Reward:</span>
                      <span className="text-white font-medium">{formData.totalReward} USDT</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Deadline:</span>
                      <span className="text-white font-medium">{new Date(formData.deadline).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {ipfsUri && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
                    <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      IPFS Metadata
                    </h3>
                    <div className="font-mono text-xs bg-white/5 p-3 rounded-xl border break-all text-blue-300">
                      {ipfsUri}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(ipfsUri)}
                      className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Copy IPFS URI
                    </button>
                  </div>
                )}

                <div className="bg-gray-500/10 border border-gray-500/20 rounded-2xl p-6">
                  <h3 className="font-semibold text-gray-400 mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Transaction Hash
                  </h3>
                  <div className="font-mono text-xs bg-white/5 p-3 rounded-xl border break-all text-gray-300">
                    {createHash}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(createHash || "")}
                    className="mt-2 text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Copy Transaction Hash
                  </button>
                </div>
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <motion.button
                  onClick={resetForm}
                  className="px-8 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Create Another Bounty
                </motion.button>
                <Link href="/dashboard/bounty">
                  <motion.button
                    className="px-8 py-3 bg-white/10 text-white font-medium rounded-2xl hover:bg-white/20 transition-all duration-300 border border-white/20"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View All Bounties
                  </motion.button>
                </Link>
              </motion.div>
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
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex-1">
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
              Fund your project with USDT tokens and get quality submissions
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
            <span className="font-medium">Creation Progress</span>
            <span className="text-[#E23E6B] font-medium">{getStepProgress()}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 mb-4 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-[#E23E6B] to-[#cc4368] h-3 rounded-full shadow-lg"
              initial={{ width: 0 }}
              animate={{ width: `${getStepProgress()}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div
              className={`text-center p-2 rounded-xl transition-all ${currentStep === CreateStep.FORM ? "bg-[#E23E6B]/20 text-[#E23E6B] font-medium" : "text-gray-400"}`}
            >
              <div className="mb-1">📝</div>
              <div>Form</div>
            </div>
            <div
              className={`text-center p-2 rounded-xl transition-all ${currentStep === CreateStep.IPFS ? "bg-[#E23E6B]/20 text-[#E23E6B] font-medium" : "text-gray-400"}`}
            >
              <div className="mb-1">📤</div>
              <div>IPFS</div>
            </div>
            <div
              className={`text-center p-2 rounded-xl transition-all ${currentStep === CreateStep.APPROVE ? "bg-[#E23E6B]/20 text-[#E23E6B] font-medium" : "text-gray-400"}`}
            >
              <div className="mb-1">✅</div>
              <div>Approve</div>
            </div>
            <div
              className={`text-center p-2 rounded-xl transition-all ${currentStep === CreateStep.CREATE ? "bg-[#E23E6B]/20 text-[#E23E6B] font-medium" : "text-gray-400"}`}
            >
              <div className="mb-1">🚀</div>
              <div>Create</div>
            </div>
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
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
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
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <Upload className="w-16 h-16 mx-auto text-blue-500" />
              </motion.div>
              <div className="absolute -top-2 -right-2">
                <div className="bg-blue-500 text-white rounded-full p-1">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-thin mb-2">Uploading to IPFS</h3>
            <p className="text-gray-400 mb-6">Storing bounty metadata securely on Pinata...</p>
            <div className="w-full bg-white/10 rounded-full h-3 max-w-md mx-auto mb-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-blue-700 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-sm text-blue-400 font-medium">{uploadProgress}% complete</p>
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
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Loader2 className="w-16 h-16 text-yellow-500 mx-auto" />
                </motion.div>
              ) : (
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              )}
              <div className="absolute -top-2 -right-2">
                <div className="bg-yellow-500 text-white rounded-full p-1">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-thin mb-2">
              {isApprovePending
                ? "Approving USDT..."
                : isApproveConfirming
                  ? "Confirming Approval..."
                  : "Approval Complete"}
            </h3>
            <p className="text-gray-400 mb-4">
              {isApprovePending
                ? "Please confirm the transaction in your wallet"
                : isApproveConfirming
                  ? "Waiting for blockchain confirmation"
                  : "USDT approval successful, creating bounty..."}
            </p>
            {(isApprovePending || isApproveConfirming) && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 max-w-md mx-auto">
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <Info className="w-4 h-4" />
                  <span>This may take a few moments to process</span>
                </div>
              </div>
            )}
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
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Loader2 className="w-16 h-16 text-[#E23E6B] mx-auto" />
                </motion.div>
              ) : (
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              )}
              <div className="absolute -top-2 -right-2">
                <div className="bg-[#E23E6B] text-white rounded-full p-1">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-thin mb-2">
              {isCreatePending
                ? "Creating Bounty..."
                : isCreateConfirming
                  ? "Confirming Creation..."
                  : "Creation Complete"}
            </h3>
            <p className="text-gray-400 mb-4">
              {isCreatePending
                ? "Please confirm the transaction in your wallet"
                : isCreateConfirming
                  ? "Waiting for blockchain confirmation"
                  : "Bounty created successfully"}
            </p>
            {(isCreatePending || isCreateConfirming) && (
              <div className="bg-[#E23E6B]/10 border border-[#E23E6B]/20 rounded-2xl p-4 max-w-md mx-auto">
                <div className="flex items-center gap-2 text-[#E23E6B] text-sm">
                  <Info className="w-4 h-4" />
                  <span>Your bounty is being created on the blockchain</span>
                </div>
              </div>
            )}
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
                  <label className="text-base font-medium flex items-center gap-2">
                    🏷️ Bounty Title
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., Build a frontend dashboard for DeFi analytics"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] focus:ring-2 focus:ring-[#E23E6B]/20 transition-all duration-200"
                    required
                  />
                  <p className="text-sm text-gray-400">Choose a clear, descriptive title for your bounty</p>
                </div>

                {/* Description with Markdown Support */}
                <div className="space-y-3">
                  <label className="text-base font-medium flex items-center gap-2">
                    📝 Description (Markdown Supported)
                    <span className="text-red-400">*</span>
                  </label>
                  <div className="border border-white/20 rounded-2xl overflow-hidden">
                    <div className="flex border-b border-white/20">
                      <button
                        type="button"
                        onClick={() => setShowPreview(false)}
                        className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-200 ${
                          !showPreview ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5"
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        Write
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPreview(true)}
                        className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-200 ${
                          showPreview ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5"
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                    </div>
                    {!showPreview ? (
                      <textarea
                        placeholder="## Task Overview&#10;Build a React application to visualize DeFi staking data...&#10;&#10;### Requirements&#10;- [ ] Responsive design&#10;- [ ] Real-time data integration&#10;- [ ] Clean UI/UX&#10;&#10;### Deliverables&#10;- Source code repository&#10;- Live demo link&#10;- Documentation"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={12}
                        className="w-full p-4 bg-transparent text-white placeholder-gray-400 focus:outline-none resize-none font-mono text-sm"
                        required
                      />
                    ) : (
                      <div className="p-4 min-h-[300px] bg-white/5">{renderMarkdownPreview(formData.description)}</div>
                    )}
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                    <p className="text-sm text-blue-400 flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Pro tip:</strong> This description will be stored as JSON metadata on IPFS via Pinata.
                        Use markdown formatting for better readability.
                      </span>
                    </p>
                  </div>
                </div>

                {/* Category Selection */}
                <div className="space-y-4">
                  <label className="text-base font-medium flex items-center gap-2">
                    🗃️ Category
                    <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => {
                      const isSelected = formData.category === category.value.toString()
                      return (
                        <motion.div
                          key={category.value}
                          className={`border rounded-2xl p-4 cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? "border-[#E23E6B] bg-[#E23E6B]/10 shadow-lg shadow-[#E23E6B]/20"
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

                {/* Reward and Deadline Row */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Reward Amount */}
                  <div className="space-y-3">
                    <label className="text-base font-medium flex items-center gap-2">
                      💰 Reward Amount
                      <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        step="0.000001"
                        min="0"
                        placeholder="100.00"
                        value={formData.totalReward}
                        onChange={(e) => setFormData({ ...formData, totalReward: e.target.value })}
                        className="w-full pl-10 pr-16 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] focus:ring-2 focus:ring-[#E23E6B]/20 transition-all duration-200"
                        required
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                        USDT
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total reward pool</span>
                      {usdtBalance !== undefined && (
                        <span className="text-gray-400">
                          Balance: <span className="text-white font-medium">{formatUnits(usdtBalance, 6)} USDT</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="space-y-3">
                    <label className="text-base font-medium flex items-center gap-2">
                      📅 Deadline
                      <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="datetime-local"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white focus:outline-none focus:border-[#E23E6B] focus:ring-2 focus:ring-[#E23E6B]/20 transition-all duration-200"
                        required
                      />
                    </div>
                    <p className="text-sm text-gray-400 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Must be a future date and time
                    </p>
                  </div>
                </div>

                {/* Transaction Status */}
                {formData.totalReward && allowance !== undefined && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
                    <h3 className="font-medium text-blue-400 mb-4 flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      Transaction Preview
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Current USDT Allowance:</span>
                        <span className="text-white font-medium">{formatUnits(allowance, 6)} USDT</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Required Amount:</span>
                        <span className="text-white font-medium">{formData.totalReward} USDT</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Approval Required:</span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            parseUnits(formData.totalReward || "0", 6) > allowance
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {parseUnits(formData.totalReward || "0", 6) > allowance ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>
                    {parseUnits(formData.totalReward || "0", 6) > allowance && (
                      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                        <p className="text-xs text-yellow-400">
                          You'll need to approve USDT spending before creating the bounty. This requires two
                          transactions.
                        </p>
                      </div>
                    )}
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
                    <div className="flex items-center justify-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      <span>Connect Wallet to Create Bounty</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5" />
                      <span>
                        {allowance !== undefined &&
                        formData.totalReward &&
                        parseUnits(formData.totalReward || "0", 6) > allowance
                          ? "Approve USDT & Create Bounty"
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
