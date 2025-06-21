"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Poppins } from "next/font/google"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { toast } from "sonner"
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  FileText,
  Code,
  Upload,
  Zap,
  Sparkles,
  Terminal,
  Plus,
  Trash2,
  Users,
  LinkIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { BOUNTY_CONTRACT_ADDRESS, BOUNTY_ABI } from "@/lib/contracts"
import { useWallet } from "@/contexts/wallet-context"
import { AuroraText } from "@/components/magicui/aurora-text"

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
})

// Types for form data
interface TeamMember {
  name: string
  role: string
  github?: string
  wallet?: string
}

interface ProjectLink {
  type: "demo" | "repository" | "documentation" | "video" | "other"
  url: string
  description: string
}

interface CodeFile {
  filename: string
  language: string
  code: string
  description?: string
}

interface SubmissionFormData {
  // Project Information
  title: string
  description: string
  approach: string

  // Team Information
  teamMembers: TeamMember[]

  // Code Files
  codeFiles: CodeFile[]

  // Links
  projectLinks: ProjectLink[]

  // Setup & Usage
  installationSteps: string[]
  usageInstructions: string

  // Additional Information
  challenges: string
  futurePlans: string
  additionalNotes: string
}

// Mock IPFS upload functions
const uploadCodeToIPFS = async (code: string, filename: string): Promise<string> => {
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))
  return `ipfs://Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
}

const uploadMetadataToIPFS = async (metadata: any): Promise<string> => {
  await new Promise((resolve) => setTimeout(resolve, 1500))
  return `ipfs://Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
}

enum SubmissionStep {
  FORM = "form",
  PREVIEW = "preview",
  PROCESSING = "processing",
  UPLOADING = "uploading",
  SUBMITTING = "submitting",
  SUCCESS = "success",
}

interface CodeBlock {
  language: string
  code: string
  filename?: string
  ipfsHash?: string
}

interface ParsedSubmission {
  explanation: string
  codeBlocks: CodeBlock[]
  metadata: {
    approach: string
    setup: string
    deliverables: string[]
  }
}

export default function SubmitBounty() {
  const router = useRouter()
  const { address, isConnected } = useWallet()

  const params = useParams()
  const bountyId = params?.id as string

  // Form state
  const [currentStep, setCurrentStep] = useState<SubmissionStep>(SubmissionStep.FORM)
  const [formData, setFormData] = useState<SubmissionFormData>({
    title: "",
    description: "",
    approach: "",
    teamMembers: [{ name: "", role: "", github: "", wallet: address || "" }],
    codeFiles: [{ filename: "", language: "javascript", code: "", description: "" }],
    projectLinks: [],
    installationSteps: [""],
    usageInstructions: "",
    challenges: "",
    futurePlans: "",
    additionalNotes: "",
  })

  const [generatedMarkdown, setGeneratedMarkdown] = useState("")
  const [parsedSubmission, setParsedSubmission] = useState<ParsedSubmission | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingStatus, setProcessingStatus] = useState("")
  const [mainIpfsUri, setMainIpfsUri] = useState("")
  const [evidenceUris, setEvidenceUris] = useState<string[]>([])

  // Wagmi hooks
  const {
    data: bounty,
    isLoading: isLoadingBounty,
    error: bountyError,
  } = useReadContract({
    address: BOUNTY_CONTRACT_ADDRESS,
    abi: BOUNTY_ABI,
    functionName: "getBounty",
    args: [BigInt(bountyId)],
  })

  const { data: hasSubmitted, isLoading: isLoadingHasSubmitted } = useReadContract({
    address: BOUNTY_CONTRACT_ADDRESS,
    abi: BOUNTY_ABI,
    functionName: "hasUserSubmitted",
    args: [BigInt(bountyId), address as `0x${string}`],
    query: {
      enabled: isConnected && !!address,
    },
  })

  const { data: hash, error: writeError, isPending, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  // Generate markdown from form data
  const generateMarkdown = (data: SubmissionFormData): string => {
    let markdown = `# ${data.title || `Solution for Bounty #${bountyId}`}\n\n`

    // Description
    if (data.description) {
      markdown += `## 📋 Project Description\n\n${data.description}\n\n`
    }

    // Approach
    if (data.approach) {
      markdown += `## 🔧 Technical Approach\n\n${data.approach}\n\n`
    }

    // Team Members
    if (data.teamMembers.some((member) => member.name)) {
      markdown += `## 👥 Team Members\n\n`
      data.teamMembers.forEach((member) => {
        if (member.name) {
          markdown += `- **${member.name}**`
          if (member.role) markdown += ` - ${member.role}`
          if (member.github) markdown += ` ([GitHub](https://github.com/${member.github}))`
          if (member.wallet) markdown += ` - \`${member.wallet}\``
          markdown += "\n"
        }
      })
      markdown += "\n"
    }

    // Code Implementation
    if (data.codeFiles.some((file) => file.code)) {
      markdown += `## 💻 Implementation\n\n`
      data.codeFiles.forEach((file) => {
        if (file.code) {
          if (file.description) {
            markdown += `### ${file.filename || "Code Block"}\n${file.description}\n\n`
          }
          markdown += `\`\`\`${file.language}\n${file.code}\n\`\`\`\n\n`
        }
      })
    }

    // Project Links
    if (data.projectLinks.length > 0) {
      markdown += `## 🔗 Project Links\n\n`
      data.projectLinks.forEach((link) => {
        const emoji = {
          demo: "🚀",
          repository: "📂",
          documentation: "📚",
          video: "🎥",
          other: "🔗",
        }[link.type]
        markdown += `- ${emoji} **${link.type.charAt(0).toUpperCase() + link.type.slice(1)}**: [${link.description || link.url}](${link.url})\n`
      })
      markdown += "\n"
    }

    // Installation & Setup
    if (data.installationSteps.some((step) => step.trim())) {
      markdown += `## ⚙️ Installation & Setup\n\n`
      data.installationSteps.forEach((step, index) => {
        if (step.trim()) {
          markdown += `${index + 1}. ${step}\n`
        }
      })
      markdown += "\n"
    }

    // Usage Instructions
    if (data.usageInstructions) {
      markdown += `## 🚀 Usage Instructions\n\n${data.usageInstructions}\n\n`
    }

    // Challenges
    if (data.challenges) {
      markdown += `## 🎯 Challenges & Solutions\n\n${data.challenges}\n\n`
    }

    // Future Plans
    if (data.futurePlans) {
      markdown += `## 🔮 Future Enhancements\n\n${data.futurePlans}\n\n`
    }

    // Additional Notes
    if (data.additionalNotes) {
      markdown += `## 📝 Additional Notes\n\n${data.additionalNotes}\n\n`
    }

    return markdown
  }

  // Parse markdown and extract code blocks
  const parseMarkdown = (markdown: string): ParsedSubmission => {
    const lines = markdown.split("\n")
    const codeBlocks: CodeBlock[] = []
    let currentCodeBlock: { language: string; code: string; filename?: string } | null = null
    let explanation = ""
    let approach = ""
    let setup = ""
    const deliverables: string[] = []

    let inCodeBlock = false
    let currentSection = "explanation"

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.startsWith("```")) {
        if (!inCodeBlock) {
          const language = line.slice(3).trim() || "text"
          currentCodeBlock = { language, code: "" }
          inCodeBlock = true
        } else {
          if (currentCodeBlock) {
            codeBlocks.push(currentCodeBlock)
            currentCodeBlock = null
          }
          inCodeBlock = false
        }
        continue
      }

      if (inCodeBlock && currentCodeBlock) {
        currentCodeBlock.code += line + "\n"
        continue
      }

      if (line.toLowerCase().includes("approach") && line.startsWith("#")) {
        currentSection = "approach"
        continue
      } else if (line.toLowerCase().includes("setup") && line.startsWith("#")) {
        currentSection = "setup"
        continue
      } else if (line.toLowerCase().includes("deliverable") && line.startsWith("#")) {
        currentSection = "deliverables"
        continue
      }

      if (line.trim()) {
        switch (currentSection) {
          case "approach":
            approach += line + "\n"
            break
          case "setup":
            setup += line + "\n"
            break
          case "deliverables":
            if (line.startsWith("- ")) {
              deliverables.push(line.slice(2))
            }
            break
          default:
            explanation += line + "\n"
        }
      }
    }

    return {
      explanation: explanation.trim(),
      codeBlocks: codeBlocks.map((block) => ({
        ...block,
        code: block.code.trim(),
      })),
      metadata: {
        approach: approach.trim(),
        setup: setup.trim(),
        deliverables,
      },
    }
  }

  // Process submission and upload to IPFS
  const processSubmission = async () => {
    const markdown = generateMarkdown(formData)
    setGeneratedMarkdown(markdown)

    setCurrentStep(SubmissionStep.PROCESSING)
    setProcessingStatus("Processing your submission...")

    try {
      const parsed = parseMarkdown(markdown)
      setParsedSubmission(parsed)

      if (parsed.codeBlocks.length === 0) {
        toast.error("No code blocks found in your submission. Please add at least one code file.")
        setCurrentStep(SubmissionStep.FORM)
        return
      }

      setCurrentStep(SubmissionStep.UPLOADING)
      setUploadProgress(0)
      setProcessingStatus("Uploading code blocks to IPFS...")

      const uploadedBlocks: CodeBlock[] = []
      for (let i = 0; i < parsed.codeBlocks.length; i++) {
        const block = parsed.codeBlocks[i]
        setProcessingStatus(`Uploading ${block.language} code block ${i + 1}/${parsed.codeBlocks.length}...`)

        const filename = `code-${i + 1}.${block.language}`
        const ipfsHash = await uploadCodeToIPFS(block.code, filename)

        uploadedBlocks.push({
          ...block,
          filename,
          ipfsHash,
        })

        setUploadProgress(((i + 1) / parsed.codeBlocks.length) * 70)
      }

      setProcessingStatus("Creating submission metadata...")
      const submissionMetadata = {
        bountyId: bountyId,
        submitter: address,
        timestamp: Date.now(),
        explanation: parsed.explanation,
        approach: parsed.metadata.approach,
        setup: parsed.metadata.setup,
        deliverables: parsed.metadata.deliverables,
        codeBlocks: uploadedBlocks.map((block) => ({
          language: block.language,
          filename: block.filename,
          ipfsHash: block.ipfsHash,
        })),
        originalMarkdown: markdown,
        formData: formData,
      }

      setUploadProgress(85)
      const mainUri = await uploadMetadataToIPFS(submissionMetadata)
      setMainIpfsUri(mainUri)

      const evidenceHashes = uploadedBlocks.map((block) => block.ipfsHash!).filter(Boolean)
      setEvidenceUris(evidenceHashes)

      setUploadProgress(100)
      setProcessingStatus("Upload complete! Ready to submit...")

      setTimeout(() => {
        setCurrentStep(SubmissionStep.SUBMITTING)
        submitToBlockchain(mainUri, evidenceHashes)
      }, 1500)
    } catch (error) {
      console.error("Processing error:", error)
      toast.error(`Processing failed: ${error instanceof Error ? error.message : "Unknown error"}`)
      setCurrentStep(SubmissionStep.FORM)
    }
  }

  const submitToBlockchain = (mainUri: string, evidenceHashes: string[]) => {
    writeContract({
      address: BOUNTY_CONTRACT_ADDRESS,
      abi: BOUNTY_ABI,
      functionName: "submitToBounty",
      args: [BigInt(bountyId), mainUri, evidenceHashes],
    })
  }

  // Form helper functions
  const addTeamMember = () => {
    setFormData((prev) => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { name: "", role: "", github: "", wallet: "" }],
    }))
  }

  const removeTeamMember = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index),
    }))
  }

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    setFormData((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) => (i === index ? { ...member, [field]: value } : member)),
    }))
  }

  const addCodeFile = () => {
    setFormData((prev) => ({
      ...prev,
      codeFiles: [...prev.codeFiles, { filename: "", language: "javascript", code: "", description: "" }],
    }))
  }

  const removeCodeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      codeFiles: prev.codeFiles.filter((_, i) => i !== index),
    }))
  }

  const updateCodeFile = (index: number, field: keyof CodeFile, value: string) => {
    setFormData((prev) => ({
      ...prev,
      codeFiles: prev.codeFiles.map((file, i) => (i === index ? { ...file, [field]: value } : file)),
    }))
  }

  const addProjectLink = () => {
    setFormData((prev) => ({
      ...prev,
      projectLinks: [...prev.projectLinks, { type: "demo", url: "", description: "" }],
    }))
  }

  const removeProjectLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      projectLinks: prev.projectLinks.filter((_, i) => i !== index),
    }))
  }

  const updateProjectLink = (index: number, field: keyof ProjectLink, value: string) => {
    setFormData((prev) => ({
      ...prev,
      projectLinks: prev.projectLinks.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
    }))
  }

  const addInstallationStep = () => {
    setFormData((prev) => ({
      ...prev,
      installationSteps: [...prev.installationSteps, ""],
    }))
  }

  const removeInstallationStep = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      installationSteps: prev.installationSteps.filter((_, i) => i !== index),
    }))
  }

  const updateInstallationStep = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      installationSteps: prev.installationSteps.map((step, i) => (i === index ? value : step)),
    }))
  }

  // Effects for handling transaction states
  useEffect(() => {
    if (isConfirmed) {
      setCurrentStep(SubmissionStep.SUCCESS)
      toast.success("Submission successful! Redirecting...", {
        description: "Your solution has been recorded on the blockchain.",
      })
      setTimeout(() => router.push(`/dashboard/bounty/${bountyId}`), 3000)
    }
  }, [isConfirmed, router, bountyId])

  useEffect(() => {
    if (writeError) {
      toast.error("Submission Failed", {
        description: writeError.message.includes("User rejected the request")
          ? "You rejected the transaction in your wallet."
          : writeError.message || "An unknown error occurred.",
      })
      setCurrentStep(SubmissionStep.FORM)
    }
  }, [writeError])

  // Update generated markdown when form data changes
  useEffect(() => {
    setGeneratedMarkdown(generateMarkdown(formData))
  }, [formData])

  // Loading states
  if (isLoadingBounty || isLoadingHasSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-[#E23E6B]" />
      </div>
    )
  }

  if (bountyError || !bounty || bounty.creator === "0x0000000000000000000000000000000000000000") {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-thin mb-2">Bounty Not Found</h2>
        <p className="text-gray-400 mb-6">The bounty you're trying to submit to doesn't exist.</p>
        <Link href="/dashboard/bounties">
          <motion.button className="px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl font-medium">
            Back to Bounties
          </motion.button>
        </Link>
      </div>
    )
  }

  // Eligibility checks
  const isDeadlinePassed = Date.now() / 1000 >= Number(bounty.deadline)
  const isCreator = address === bounty.creator
  const isBountyOpen = bounty.status === 0

  let disabledReason = ""
  if (!isConnected) disabledReason = "Please connect your wallet to submit."
  else if (!isBountyOpen) disabledReason = "This bounty is no longer open for submissions."
  else if (isDeadlinePassed) disabledReason = "The submission deadline has passed."
  else if (hasSubmitted) disabledReason = "You have already submitted to this bounty."
  else if (isCreator) disabledReason = "Bounty creators cannot submit to their own bounties."

  const isFormDisabled = !!disabledReason

  // Success state
  if (currentStep === SubmissionStep.SUCCESS) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-thin mb-4">
            <AuroraText colors={["#22c55e", "#16a34a", "#ffffff", "#E23E6B"]}>
              <span className="text-transparent">Submission Successful!</span>
            </AuroraText>
          </h2>
          <p className="text-gray-300 mb-8">Your solution has been recorded on the blockchain</p>

          {parsedSubmission && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 mb-8">
              <h3 className="font-semibold text-green-400 mb-4">Submission Summary</h3>
              <div className="text-left space-y-3 text-sm">
                <div>
                  <span className="text-gray-400">Code Blocks Uploaded:</span>
                  <span className="text-white font-medium ml-2">{parsedSubmission.codeBlocks.length}</span>
                </div>
                <div>
                  <span className="text-gray-400">Main IPFS URI:</span>
                  <div className="font-mono text-xs text-green-300 mt-1 break-all">{mainIpfsUri}</div>
                </div>
                <div>
                  <span className="text-gray-400">Transaction Hash:</span>
                  <div className="font-mono text-xs text-gray-300 mt-1 break-all">{hash}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <Link href={`/dashboard/bounty/${bountyId}`}>
              <motion.button
                className="px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl font-medium"
                whileHover={{ scale: 1.05 }}
              >
                View Bounty
              </motion.button>
            </Link>
            <Link href="/dashboard/bounty">
              <motion.button
                className="px-6 py-3 bg-white/10 rounded-2xl font-medium border border-white/20"
                whileHover={{ scale: 1.05 }}
              >
                All Bounties
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // Processing states
  if (currentStep === SubmissionStep.PROCESSING) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-12 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Terminal className="w-16 h-16 mx-auto text-blue-500 mb-6" />
          </motion.div>
          <h3 className="text-2xl font-thin mb-2">Processing Your Submission</h3>
          <p className="text-gray-400 mb-6">{processingStatus}</p>
        </motion.div>
      </div>
    )
  }

  if (currentStep === SubmissionStep.UPLOADING) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-12 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Upload className="w-16 h-16 mx-auto text-purple-500 mb-6" />
          </motion.div>
          <h3 className="text-2xl font-thin mb-2">Uploading to IPFS</h3>
          <p className="text-gray-400 mb-6">{processingStatus}</p>
          <div className="w-full bg-white/10 rounded-full h-3 max-w-md mx-auto mb-2">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-purple-700 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-sm text-purple-400 font-medium">{uploadProgress}% complete</p>
        </motion.div>
      </div>
    )
  }

  if (currentStep === SubmissionStep.SUBMITTING) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-12 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Loader2 className="w-16 h-16 mx-auto text-[#E23E6B] mb-6" />
          </motion.div>
          <h3 className="text-2xl font-thin mb-2">
            {isPending ? "Submitting to Blockchain..." : isConfirming ? "Confirming Transaction..." : "Processing..."}
          </h3>
          <p className="text-gray-400 mb-4">
            {isPending
              ? "Please confirm the transaction in your wallet"
              : isConfirming
                ? "Waiting for blockchain confirmation"
                : "Finalizing your submission"}
          </p>
        </motion.div>
      </div>
    )
  }

  // Preview mode
  if (currentStep === SubmissionStep.PREVIEW) {
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
              <h1 className="text-3xl md:text-4xl font-thin mb-2">
                <AuroraText colors={["#cc4368", "#e6295c", "#ffffff", "#E23E6B"]}>
                  <span className="text-transparent">Preview Submission</span>
                </AuroraText>
              </h1>
              <p className="text-gray-300/80 text-lg font-light">{bounty.name}</p>
            </div>
            <div className="flex gap-3">
              <motion.button
                onClick={() => setCurrentStep(SubmissionStep.FORM)}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-xl font-medium border border-white/20"
                whileHover={{ scale: 1.05 }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Edit</span>
              </motion.button>
              <motion.button
                onClick={processSubmission}
                disabled={isFormDisabled}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-xl font-medium disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
              >
                <Zap className="w-4 h-4" />
                <span>Submit Solution</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Preview Content */}
          <div className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8">
            <div className="prose prose-invert prose-lg max-w-none">
              {generatedMarkdown.split("\n").map((line, i) => {
                if (line.startsWith("```")) {
                  // Handle code blocks in preview
                  const isStart = !line.endsWith("```")
                  if (isStart) {
                    return (
                      <div key={i} className="bg-gray-900 rounded-lg p-4 my-4 font-mono text-sm overflow-x-auto">
                        <div className="text-gray-400 text-xs mb-2">{line.slice(3) || "code"}</div>
                      </div>
                    )
                  }
                  return null
                }
                if (line.startsWith("# ")) {
                  return (
                    <h1 key={i} className="text-3xl font-bold mt-8 mb-4 text-white">
                      {line.slice(2)}
                    </h1>
                  )
                }
                if (line.startsWith("## ")) {
                  return (
                    <h2 key={i} className="text-2xl font-bold mt-6 mb-3 text-gray-200">
                      {line.slice(3)}
                    </h2>
                  )
                }
                if (line.startsWith("### ")) {
                  return (
                    <h3 key={i} className="text-xl font-semibold mt-4 mb-2 text-gray-300">
                      {line.slice(4)}
                    </h3>
                  )
                }
                if (line.startsWith("- ")) {
                  return (
                    <li key={i} className="ml-4 my-1 text-gray-300">
                      {line.slice(2)}
                    </li>
                  )
                }
                if (line.match(/^\d+\. /)) {
                  return (
                    <li key={i} className="ml-4 my-1 text-gray-300 list-decimal">
                      {line.replace(/^\d+\. /, "")}
                    </li>
                  )
                }
                if (line.includes("](")) {
                  // Handle links
                  const linkRegex = /\[([^\]]+)\]$$([^)]+)$$/g
                  const parts = line.split(linkRegex)
                  return (
                    <p key={i} className="mb-3 text-gray-300 leading-relaxed">
                      {parts.map((part, j) => {
                        if (j % 3 === 1) {
                          return (
                            <a
                              key={j}
                              href={parts[j + 1]}
                              className="text-blue-400 hover:text-blue-300 underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {part}
                            </a>
                          )
                        } else if (j % 3 === 2) {
                          return null
                        }
                        return part
                      })}
                    </p>
                  )
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
          </div>
        </div>
      </div>
    )
  }

  // Main form
  return (
    <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-thin mb-2">
              <AuroraText colors={["#cc4368", "#e6295c", "#ffffff", "#E23E6B"]}>
                <span className="text-transparent">Submit Solution</span>
              </AuroraText>
            </h1>
            <p className="text-gray-300/80 text-lg font-light">{bounty.name}</p>
          </div>
          <div className="flex gap-3">
            <Link href={`/dashboard/bounty/${bountyId}`}>
              <motion.button
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-xl font-medium border border-white/20"
                whileHover={{ scale: 1.05 }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </motion.button>
            </Link>
            <motion.button
              onClick={() => setCurrentStep(SubmissionStep.PREVIEW)}
              disabled={isFormDisabled || !formData.title || !formData.description}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-xl font-medium disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Disabled state warning */}
        {isFormDisabled && (
          <motion.div
            className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{disabledReason}</span>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <div className="space-y-8">
          {/* Project Information */}
          <motion.div
            className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-2xl font-thin mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#E23E6B]" />
              Project Information
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Project Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter your project title"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
                  disabled={isFormDisabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Project Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what your project does and how it solves the bounty requirements"
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200 resize-none"
                  disabled={isFormDisabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Technical Approach</label>
                <textarea
                  value={formData.approach}
                  onChange={(e) => setFormData((prev) => ({ ...prev, approach: e.target.value }))}
                  placeholder="Explain your technical approach, architecture decisions, and implementation strategy"
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200 resize-none"
                  disabled={isFormDisabled}
                />
              </div>
            </div>
          </motion.div>

          {/* Team Members */}
          <motion.div
            className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-thin flex items-center gap-2">
                <Users className="w-6 h-6 text-[#E23E6B]" />
                Team Members
              </h2>
              <motion.button
                onClick={addTeamMember}
                disabled={isFormDisabled}
                className="flex items-center gap-2 px-4 py-2 bg-[#E23E6B]/20 hover:bg-[#E23E6B]/30 text-[#E23E6B] rounded-xl transition-colors duration-200 disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
              >
                <Plus className="w-4 h-4" />
                Add Member
              </motion.button>
            </div>

            <div className="space-y-4">
              {formData.teamMembers.map((member, index) => (
                <div key={index} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Team Member {index + 1}</h3>
                    {formData.teamMembers.length > 1 && (
                      <motion.button
                        onClick={() => removeTeamMember(index)}
                        disabled={isFormDisabled}
                        className="text-red-400 hover:text-red-300 transition-colors duration-200 disabled:opacity-50"
                        whileHover={{ scale: 1.1 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => updateTeamMember(index, "name", e.target.value)}
                        placeholder="Full name"
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
                        disabled={isFormDisabled}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Role</label>
                      <input
                        type="text"
                        value={member.role}
                        onChange={(e) => updateTeamMember(index, "role", e.target.value)}
                        placeholder="e.g., Frontend Developer, Designer"
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
                        disabled={isFormDisabled}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">GitHub Username</label>
                      <input
                        type="text"
                        value={member.github || ""}
                        onChange={(e) => updateTeamMember(index, "github", e.target.value)}
                        placeholder="github-username"
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
                        disabled={isFormDisabled}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Wallet Address</label>
                      <input
                        type="text"
                        value={member.wallet || ""}
                        onChange={(e) => updateTeamMember(index, "wallet", e.target.value)}
                        placeholder="0x..."
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
                        disabled={isFormDisabled}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Code Implementation */}
          <motion.div
            className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-thin flex items-center gap-2">
                <Code className="w-6 h-6 text-[#E23E6B]" />
                Code Implementation
              </h2>
              <motion.button
                onClick={addCodeFile}
                disabled={isFormDisabled}
                className="flex items-center gap-2 px-4 py-2 bg-[#E23E6B]/20 hover:bg-[#E23E6B]/30 text-[#E23E6B] rounded-xl transition-colors duration-200 disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
              >
                <Plus className="w-4 h-4" />
                Add Code File
              </motion.button>
            </div>

            <div className="space-y-6">
              {formData.codeFiles.map((file, index) => (
                <div key={index} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Code File {index + 1}</h3>
                    {formData.codeFiles.length > 1 && (
                      <motion.button
                        onClick={() => removeCodeFile(index)}
                        disabled={isFormDisabled}
                        className="text-red-400 hover:text-red-300 transition-colors duration-200 disabled:opacity-50"
                        whileHover={{ scale: 1.1 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Filename</label>
                        <input
                          type="text"
                          value={file.filename}
                          onChange={(e) => updateCodeFile(index, "filename", e.target.value)}
                          placeholder="e.g., main.js, App.tsx, contract.sol"
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
                          disabled={isFormDisabled}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Language</label>
                        <select
                          value={file.language}
                          onChange={(e) => updateCodeFile(index, "language", e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
                          disabled={isFormDisabled}
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="typescript">TypeScript</option>
                          <option value="python">Python</option>
                          <option value="solidity">Solidity</option>
                          <option value="rust">Rust</option>
                          <option value="go">Go</option>
                          <option value="java">Java</option>
                          <option value="cpp">C++</option>
                          <option value="html">HTML</option>
                          <option value="css">CSS</option>
                          <option value="json">JSON</option>
                          <option value="yaml">YAML</option>
                          <option value="bash">Bash</option>
                          <option value="sql">SQL</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                      <input
                        type="text"
                        value={file.description || ""}
                        onChange={(e) => updateCodeFile(index, "description", e.target.value)}
                        placeholder="Brief description of what this code does"
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
                        disabled={isFormDisabled}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Code</label>
                      <textarea
                        value={file.code}
                        onChange={(e) => updateCodeFile(index, "code", e.target.value)}
                        placeholder="Paste your code here..."
                        rows={8}
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200 resize-none font-mono text-sm"
                        disabled={isFormDisabled}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Project Links */}
          <motion.div
            className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-thin flex items-center gap-2">
                <LinkIcon className="w-6 h-6 text-[#E23E6B]" />
                Project Links
              </h2>
              <motion.button
                onClick={addProjectLink}
                disabled={isFormDisabled}
                className="flex items-center gap-2 px-4 py-2 bg-[#E23E6B]/20 hover:bg-[#E23E6B]/30 text-[#E23E6B] rounded-xl transition-colors duration-200 disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
              >
                <Plus className="w-4 h-4" />
                Add Link
              </motion.button>
            </div>

            <div className="space-y-4">
              {formData.projectLinks.map((link, index) => (
                <div key={index} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Project Link {index + 1}</h3>
                    <motion.button
                      onClick={() => removeProjectLink(index)}
                      disabled={isFormDisabled}
                      className="text-red-400 hover:text-red-300 transition-colors duration-200 disabled:opacity-50"
                      whileHover={{ scale: 1.1 }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Type</label>
                      <select
                        value={link.type}
                        onChange={(e) => updateProjectLink(index, "type", e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
                        disabled={isFormDisabled}
                      >
                        <option value="demo">Live Demo</option>
                        <option value="repository">Repository</option>
                        <option value="documentation">Documentation</option>
                        <option value="video">Video</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">URL</label>
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateProjectLink(index, "url", e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
                        disabled={isFormDisabled}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <input
                        type="text"
                        value={link.description}
                        onChange={(e) => updateProjectLink(index, "description", e.target.value)}
                        placeholder="Brief description"
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
                        disabled={isFormDisabled}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {formData.projectLinks.length === 0 && (
                <p className="text-gray-400 text-center py-4">
                  No project links added yet. Click "Add Link" to get started.
                </p>
              )}
            </div>
          </motion.div>

          {/* Installation & Usage */}
          <motion.div
            className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-thin mb-6 flex items-center gap-2">
              <Terminal className="w-6 h-6 text-[#E23E6B]" />
              Setup & Usage
            </h2>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium">Installation Steps</label>
                  <motion.button
                    onClick={addInstallationStep}
                    disabled={isFormDisabled}
                    className="flex items-center gap-2 px-3 py-1 bg-[#E23E6B]/20 hover:bg-[#E23E6B]/30 text-[#E23E6B] rounded-lg transition-colors duration-200 disabled:opacity-50 text-sm"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Plus className="w-3 h-3" />
                    Add Step
                  </motion.button>
                </div>

                <div className="space-y-2">
                  {formData.installationSteps.map((step, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-gray-400 text-sm mt-3 min-w-[20px]">{index + 1}.</span>
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => updateInstallationStep(index, e.target.value)}
                        placeholder="e.g., npm install, git clone, etc."
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200"
                        disabled={isFormDisabled}
                      />
                      {formData.installationSteps.length > 1 && (
                        <motion.button
                          onClick={() => removeInstallationStep(index)}
                          disabled={isFormDisabled}
                          className="text-red-400 hover:text-red-300 transition-colors duration-200 disabled:opacity-50 px-2"
                          whileHover={{ scale: 1.1 }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Usage Instructions</label>
                <textarea
                  value={formData.usageInstructions}
                  onChange={(e) => setFormData((prev) => ({ ...prev, usageInstructions: e.target.value }))}
                  placeholder="Explain how to use your project, key features, and any important notes"
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200 resize-none"
                  disabled={isFormDisabled}
                />
              </div>
            </div>
          </motion.div>

          {/* Additional Information */}
          <motion.div
            className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-2xl font-thin mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#E23E6B]" />
              Additional Information
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Challenges & Solutions</label>
                <textarea
                  value={formData.challenges}
                  onChange={(e) => setFormData((prev) => ({ ...prev, challenges: e.target.value }))}
                  placeholder="Describe any challenges you faced and how you solved them"
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200 resize-none"
                  disabled={isFormDisabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Future Enhancements</label>
                <textarea
                  value={formData.futurePlans}
                  onChange={(e) => setFormData((prev) => ({ ...prev, futurePlans: e.target.value }))}
                  placeholder="What would you improve or add if you had more time?"
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200 resize-none"
                  disabled={isFormDisabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Additional Notes</label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, additionalNotes: e.target.value }))}
                  placeholder="Any other information you'd like to share"
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#E23E6B] transition-colors duration-200 resize-none"
                  disabled={isFormDisabled}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
