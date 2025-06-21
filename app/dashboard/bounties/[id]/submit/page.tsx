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
} from "lucide-react"

import { cn } from "@/lib/utils"
import { BOUNTY_CONTRACT_ADDRESS, BOUNTY_ABI } from "@/lib/contracts"
import { useWallet } from "@/contexts/wallet-context"
import { AuroraText } from "@/components/magicui/aurora-text"
import { WalletDisplay } from "@/components/ui/wallet-display"

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
})

// Mock IPFS upload function - replace with your actual implementation
const uploadCodeToIPFS = async (code: string, filename: string): Promise<string> => {
  // Simulate upload delay
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))
  // Return mock IPFS hash
  return `ipfs://Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
}

const uploadMetadataToIPFS = async (metadata: any): Promise<string> => {
  // Simulate upload delay
  await new Promise((resolve) => setTimeout(resolve, 1500))
  // Return mock IPFS hash
  return `ipfs://Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
}

enum SubmissionStep {
  FORM = "form",
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

function SubmitBountyComponent({ bountyId }: { bountyId: string }) {
  const router = useRouter()
  const { address, isConnected } = useWallet()

  // Form state
  const [currentStep, setCurrentStep] = useState<SubmissionStep>(SubmissionStep.FORM)
  const [showPreview, setShowPreview] = useState(false)
  const [markdownInput, setMarkdownInput] = useState("")
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

      // Detect code block start
      if (line.startsWith("```")) {
        if (!inCodeBlock) {
          // Starting a code block
          const language = line.slice(3).trim() || "text"
          currentCodeBlock = { language, code: "" }
          inCodeBlock = true
        } else {
          // Ending a code block
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

      // Parse sections
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

      // Add content to appropriate section
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
    if (!markdownInput.trim()) {
      toast.error("Please provide your solution markdown")
      return
    }

    setCurrentStep(SubmissionStep.PROCESSING)
    setProcessingStatus("Parsing your markdown submission...")

    try {
      // Parse the markdown
      const parsed = parseMarkdown(markdownInput)
      setParsedSubmission(parsed)

      setCurrentStep(SubmissionStep.UPLOADING)
      setUploadProgress(0)
      setProcessingStatus("Uploading submission to IPFS...")

      // Upload code blocks to IPFS if any exist
      const uploadedBlocks: CodeBlock[] = []
      if (parsed.codeBlocks.length > 0) {
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
      } else {
        setUploadProgress(70)
      }

      // Create main metadata
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
        originalMarkdown: markdownInput,
      }

      setUploadProgress(85)
      const mainUri = await uploadMetadataToIPFS(submissionMetadata)
      setMainIpfsUri(mainUri)

      // Set evidence URIs (individual code block hashes)
      const evidenceHashes = uploadedBlocks.map((block) => block.ipfsHash!).filter(Boolean)
      setEvidenceUris(evidenceHashes)

      setUploadProgress(100)
      setProcessingStatus("Upload complete! Ready to submit...")

      // Auto-proceed to submission
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

  // Render markdown preview
  const renderMarkdownPreview = (markdown: string) => {
    if (!markdown) return <p className="text-gray-400 italic">Preview will appear here...</p>

    return (
      <div className="prose prose-invert prose-sm max-w-none">
        {markdown.split("\n").map((line, i) => {
          if (line.startsWith("```")) {
            return null // Code blocks handled separately in preview
          }
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
          if (line.startsWith("- ")) {
            return (
              <li key={i} className="ml-4 my-1 text-gray-300">
                {line.slice(2)}
              </li>
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
    )
  }

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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <motion.h1 className="text-3xl md:text-4xl font-thin mb-2">
            <AuroraText colors={["#cc4368", "#e6295c", "#ffffff", "#E23E6B"]}>
              <span className="text-transparent">Submit Your Solution</span>
            </AuroraText>
          </motion.h1>
          <motion.p className="text-gray-300/80 text-lg font-light">{bounty.name}</motion.p>
        </div>
        <div className="flex items-center gap-4">
          <WalletDisplay />
          <Link href={`/dashboard/bounties/${bountyId}`}>
            <motion.button
              className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Bounty</span>
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.div
        className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-3xl p-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="flex items-start gap-4">
          <div className="bg-blue-500/20 p-3 rounded-2xl">
            <Sparkles className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-blue-400 mb-3">🚀 Submit Your Bounty Solution</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <p>
                📌 Paste your entire solution in <strong>Markdown format</strong> below. We'll extract your code (if any), upload
                it to IPFS, and submit your response.
              </p>

              <p className="font-medium text-white">Please include:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>🧠 A clear explanation of your approach</li>
                <li>
                  💻 Code blocks inside triple backticks (<code>```</code>) - <em>optional</em>
                </li>
                <li>⚙️ Setup or usage instructions (if applicable)</li>
                <li>
                  ❌ <strong>Don't upload files or paste links</strong> — we'll handle the uploads automatically.
                </li>
              </ul>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
                <p className="text-xs text-gray-400 mb-2">✨ Example:</p>
                <pre className="text-xs text-gray-300 font-mono">
                  {`## 🧠 Solution for Bounty ID: ${bountyId}

### 🔧 Approach
We used Chainlink Functions to fetch off-chain weather data and trigger on-chain logic.

### 💻 Code
\`\`\`javascript
import { Functions } from "@chainlink/functions-toolkit";
// ...setup code here
\`\`\`

### ⚙️ Setup Instructions
1. Install dependencies: \`npm install\`
2. Configure environment variables
3. Deploy the contract`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Form */}
      <motion.div
        className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {/* Disabled State */}
        {disabledReason && (
          <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-2xl p-4 mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{disabledReason}</p>
          </div>
        )}

        {/* Markdown Editor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-lg font-medium flex items-center gap-2">
              📝 Your Solution (Markdown)
              <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors duration-200 flex items-center gap-2 ${
                  !showPreview ? "bg-[#E23E6B] text-white" : "text-gray-400 hover:bg-white/5"
                }`}
                disabled={isFormDisabled}
              >
                <FileText className="w-4 h-4" />
                Write
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors duration-200 flex items-center gap-2 ${
                  showPreview ? "bg-[#E23E6B] text-white" : "text-gray-400 hover:bg-white/5"
                }`}
                disabled={isFormDisabled}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            </div>
          </div>

          <div className="border border-white/20 rounded-2xl overflow-hidden">
            {!showPreview ? (
              <textarea
                placeholder={`## 🧠 My Solution for "${bounty.name}"

### 🔧 Approach
I solved this by implementing a React component that...

### 💻 Implementation
\`\`\`javascript
import React, { useState, useEffect } from 'react';

function MyComponent() {
  // Your code here
  return <div>Hello World</div>;
}

export default MyComponent;
\`\`\`

### ⚙️ Setup Instructions
1. Clone the repository
2. Install dependencies: \`npm install\`
3. Run the development server: \`npm start\`

### 📋 Deliverables
- ✅ Fully functional component
- ✅ Responsive design
- ✅ Clean, documented code
- ✅ Live demo link: https://my-demo.vercel.app`}
                value={markdownInput}
                onChange={(e) => setMarkdownInput(e.target.value)}
                rows={20}
                className="w-full p-6 bg-transparent text-white placeholder-gray-400 focus:outline-none resize-none font-mono text-sm leading-relaxed"
                disabled={isFormDisabled}
                required
              />
            ) : (
              <div className="p-6 min-h-[500px] bg-white/5">
                {renderMarkdownPreview(markdownInput)}

                {/* Show detected code blocks */}
                {markdownInput && (
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      Detected Code Blocks ({parseMarkdown(markdownInput).codeBlocks.length})
                    </h4>
                    <div className="space-y-3">
                      {parseMarkdown(markdownInput).codeBlocks.map((block, index) => (
                        <div key={index} className="bg-black/20 border border-white/10 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-blue-400">{block.language}</span>
                            <span className="text-xs text-gray-400">{block.code.split("\n").length} lines</span>
                          </div>
                          <pre className="text-xs text-gray-300 font-mono overflow-x-auto">
                            <code>
                              {block.code.slice(0, 200)}
                              {block.code.length > 200 ? "..." : ""}
                            </code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-white/10 mt-8">
          <motion.button
            onClick={processSubmission}
            disabled={isFormDisabled || !markdownInput.trim()}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={!isFormDisabled && markdownInput.trim() ? { scale: 1.02 } : {}}
            whileTap={!isFormDisabled && markdownInput.trim() ? { scale: 0.98 } : {}}
          >
            <Zap className="w-5 h-5" />
            <span>Submit Solution</span>
          </motion.button>

          {markdownInput.trim() && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">
                {parseMarkdown(markdownInput).codeBlocks.length > 0 
                  ? `We'll automatically extract ${parseMarkdown(markdownInput).codeBlocks.length} code block(s) and upload to IPFS`
                  : "Your solution will be uploaded to IPFS and submitted to the blockchain"
                }
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function SubmitBountyPage() {
  const params = useParams()
  const bountyId = params?.id as string

  if (!bountyId || isNaN(Number(bountyId))) {
    return (
      <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-thin mb-2">Invalid Bounty ID</h2>
            <p className="text-gray-400 mb-6">The bounty ID provided is not valid.</p>
            <Link href="/dashboard/bounty">
              <motion.button
                className="px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl font-medium hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Back to Bounties
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
      <SubmitBountyComponent bountyId={bountyId} />
    </div>
  )
}
