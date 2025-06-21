"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, X, FileText, Send, Plus, CheckCircle, AlertCircle, DollarSign, Clock, Shield } from "lucide-react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { FREELANCE_CONTRACT_ADDRESS, FREELANCE_ABI } from "@/lib/contracts"
import { uploadToPinata } from "@/lib/pinata"
import { formatEther } from "viem"

interface ProposalFormProps {
  gigId: number
  gigData?: any
  onClose: () => void
}

interface ProposalData {
  coverLetter: string
  approach: string
  timeline: string
  experience: string
  portfolio: string[]
  questions: string[]
  estimatedHours: string
  milestones: string[]
}

export function ProposalForm({ gigId, gigData, onClose }: ProposalFormProps) {
  const { address } = useAccount()

  const [isLoading, setIsLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "uploaded" | "error">("idle")
  const [currentPortfolio, setCurrentPortfolio] = useState("")
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [currentMilestone, setCurrentMilestone] = useState("")

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const [proposalData, setProposalData] = useState<ProposalData>({
    coverLetter: "",
    approach: "",
    timeline: "",
    experience: "",
    portfolio: [],
    questions: [],
    estimatedHours: "",
    milestones: [],
  })

  const handleInputChange = (field: keyof ProposalData, value: string) => {
    setProposalData((prev) => ({ ...prev, [field]: value }))
  }

  const addPortfolioItem = () => {
    if (currentPortfolio.trim() && !proposalData.portfolio.includes(currentPortfolio.trim())) {
      setProposalData((prev) => ({
        ...prev,
        portfolio: [...prev.portfolio, currentPortfolio.trim()],
      }))
      setCurrentPortfolio("")
    }
  }

  const removePortfolioItem = (item: string) => {
    setProposalData((prev) => ({
      ...prev,
      portfolio: prev.portfolio.filter((p) => p !== item),
    }))
  }

  const addQuestion = () => {
    if (currentQuestion.trim() && !proposalData.questions.includes(currentQuestion.trim())) {
      setProposalData((prev) => ({
        ...prev,
        questions: [...prev.questions, currentQuestion.trim()],
      }))
      setCurrentQuestion("")
    }
  }

  const removeQuestion = (question: string) => {
    setProposalData((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q !== question),
    }))
  }

  const addMilestone = () => {
    if (currentMilestone.trim() && !proposalData.milestones.includes(currentMilestone.trim())) {
      setProposalData((prev) => ({
        ...prev,
        milestones: [...prev.milestones, currentMilestone.trim()],
      }))
      setCurrentMilestone("")
    }
  }

  const removeMilestone = (milestone: string) => {
    setProposalData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((m) => m !== milestone),
    }))
  }

  const formatProposalToMarkdown = (data: ProposalData): string => {
    return `# Proposal for Gig #${gigId}: ${gigData?.title || "Untitled Gig"}

## Executive Summary
${data.coverLetter}

## Technical Approach
${data.approach}

## Project Timeline
${data.timeline}

${data.estimatedHours ? `## Estimated Hours\n${data.estimatedHours} hours\n` : ""}

${data.milestones.length > 0 ? `## Project Milestones\n${data.milestones.map((milestone, idx) => `${idx + 1}. ${milestone}`).join("\n")}\n` : ""}

## Relevant Experience
${data.experience}

## Portfolio & Previous Work
${data.portfolio.length > 0 ? data.portfolio.map((item) => `- ${item}`).join("\n") : "No portfolio items provided."}

## Questions for the Client
${data.questions.length > 0 ? data.questions.map((question) => `- ${question}`).join("\n") : "No questions at this time."}

## Proposal Details
- **Gig ID**: ${gigId}
- **Submitted by**: ${address}
- **Submission Date**: ${new Date().toISOString()}
- **Budget**: $${gigData ? (Number(gigData.usdtAmount) / 1e6).toFixed(2) : "TBD"} USDT
${gigData?.nativeStakeRequired && Number(gigData.nativeStakeRequired) > 0 ? `- **Stake Required**: ${formatEther(gigData.nativeStakeRequired)} EDU` : ""}

## Why Choose Me
I am committed to delivering high-quality work on time and within budget. My approach combines technical expertise with clear communication to ensure project success.

---
*Submitted via EDU Chain Freelance Marketplace*
*Contract: ${FREELANCE_CONTRACT_ADDRESS}*
*IPFS Storage: Decentralized and immutable*
`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to submit a proposal",
        variant: "destructive",
      })
      return
    }

    if (!proposalData.coverLetter || !proposalData.approach) {
      toast({
        title: "Missing required fields",
        description: "Please fill in the cover letter and approach sections",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setUploadStatus("uploading")

    try {
      // Format proposal to markdown
      const markdownContent = formatProposalToMarkdown(proposalData)

      // Upload to IPFS via Pinata
      const metadata = {
        name: `Proposal for Gig #${gigId}`,
        description: proposalData.coverLetter.substring(0, 200) + "...",
        category: 0, // Proposal category
        deadline: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
        content: markdownContent,
        gigId: gigId,
        freelancer: address,
        coverLetter: proposalData.coverLetter,
        approach: proposalData.approach,
        timeline: proposalData.timeline,
        experience: proposalData.experience,
        portfolio: proposalData.portfolio,
        questions: proposalData.questions,
        estimatedHours: proposalData.estimatedHours,
        milestones: proposalData.milestones,
        createdAt: Math.floor(Date.now() / 1000),
      }

      const ipfsUri = await uploadToPinata(metadata)
      setUploadStatus("uploaded")

      toast({
        title: "Proposal uploaded to IPFS",
        description: `IPFS URI: ${ipfsUri}`,
      })

      // Submit proposal to contract
      writeContract({
        address: FREELANCE_CONTRACT_ADDRESS,
        abi: FREELANCE_ABI,
        functionName: "submitProposal",
        args: [BigInt(gigId), ipfsUri],
      })
    } catch (error) {
      console.error("Error submitting proposal:", error)
      setUploadStatus("error")
      toast({
        title: "Error submitting proposal",
        description: error instanceof Error ? error.message : "Failed to upload to IPFS or submit to contract",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Handle transaction success
  if (isSuccess) {
    toast({
      title: "Proposal submitted successfully!",
      description: "Your proposal has been submitted to EDU Chain and the client will review it",
    })
    onClose()
  }

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case "uploading":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
      case "uploaded":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />
      default:
        return <FileText className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (uploadStatus) {
      case "uploading":
        return "Uploading proposal to IPFS..."
      case "uploaded":
        return "Uploaded to IPFS successfully"
      case "error":
        return "Upload failed"
      default:
        return "Ready to submit"
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-5 h-5" />
            Submit Proposal for Gig #{gigId}
          </DialogTitle>

          {/* Gig Info */}
          {gigData && (
            <div className="bg-white/5 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-white mb-2">{gigData.title}</h4>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span>${(Number(gigData.usdtAmount) / 1e6).toFixed(2)} USDT</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{Math.ceil((Number(gigData.deadline) - Date.now() / 1000) / (24 * 60 * 60))} days</span>
                </div>
                {gigData.nativeStakeRequired > 0 && (
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span>{formatEther(gigData.nativeStakeRequired)} EDU stake</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload Status */}
          <div className="flex items-center gap-2 mt-2">
            {getStatusIcon()}
            <span className="text-sm text-gray-400">{getStatusText()}</span>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Letter */}
          <div className="space-y-2">
            <Label htmlFor="coverLetter" className="text-white">
              Cover Letter *
            </Label>
            <Textarea
              id="coverLetter"
              value={proposalData.coverLetter}
              onChange={(e) => handleInputChange("coverLetter", e.target.value)}
              placeholder="Introduce yourself and explain why you're the best fit for this project..."
              className="bg-white/10 border-white/20 text-white placeholder-gray-400 min-h-[120px]"
              required
            />
          </div>

          {/* Approach */}
          <div className="space-y-2">
            <Label htmlFor="approach" className="text-white">
              Technical Approach *
            </Label>
            <Textarea
              id="approach"
              value={proposalData.approach}
              onChange={(e) => handleInputChange("approach", e.target.value)}
              placeholder="Describe your technical approach and methodology for completing this project..."
              className="bg-white/10 border-white/20 text-white placeholder-gray-400 min-h-[120px]"
              required
            />
          </div>

          {/* Timeline and Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="timeline" className="text-white">
                Proposed Timeline
              </Label>
              <Textarea
                id="timeline"
                value={proposalData.timeline}
                onChange={(e) => handleInputChange("timeline", e.target.value)}
                placeholder="Break down your timeline for this project..."
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedHours" className="text-white">
                Estimated Hours
              </Label>
              <Input
                id="estimatedHours"
                type="number"
                min="1"
                value={proposalData.estimatedHours}
                onChange={(e) => handleInputChange("estimatedHours", e.target.value)}
                placeholder="Total estimated hours"
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <Label htmlFor="experience" className="text-white">
              Relevant Experience
            </Label>
            <Textarea
              id="experience"
              value={proposalData.experience}
              onChange={(e) => handleInputChange("experience", e.target.value)}
              placeholder="Highlight your relevant experience and past projects..."
              className="bg-white/10 border-white/20 text-white placeholder-gray-400 min-h-[100px]"
            />
          </div>

          {/* Milestones */}
          <div className="space-y-2">
            <Label className="text-white">Project Milestones</Label>
            <div className="flex gap-2">
              <Input
                value={currentMilestone}
                onChange={(e) => setCurrentMilestone(e.target.value)}
                placeholder="Add a project milestone"
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addMilestone())}
              />
              <Button type="button" onClick={addMilestone} variant="outline" className="bg-white/10 border-white/20">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-1 mt-2">
              {proposalData.milestones.map((milestone, index) => (
                <div key={index} className="flex items-center justify-between bg-white/5 p-2 rounded">
                  <span className="text-gray-300 text-sm">
                    {index + 1}. {milestone}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMilestone(milestone)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Portfolio */}
          <div className="space-y-2">
            <Label className="text-white">Portfolio & Previous Work</Label>
            <div className="flex gap-2">
              <Input
                value={currentPortfolio}
                onChange={(e) => setCurrentPortfolio(e.target.value)}
                placeholder="Add portfolio link or project description"
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addPortfolioItem())}
              />
              <Button
                type="button"
                onClick={addPortfolioItem}
                variant="outline"
                className="bg-white/10 border-white/20"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-1 mt-2">
              {proposalData.portfolio.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-white/5 p-2 rounded">
                  <span className="text-gray-300 text-sm">{item}</span>
                  <button
                    type="button"
                    onClick={() => removePortfolioItem(item)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-2">
            <Label className="text-white">Questions for the Client</Label>
            <div className="flex gap-2">
              <Input
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                placeholder="Add a question for the client"
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addQuestion())}
              />
              <Button type="button" onClick={addQuestion} variant="outline" className="bg-white/10 border-white/20">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-1 mt-2">
              {proposalData.questions.map((question, index) => (
                <div key={index} className="flex items-center justify-between bg-white/5 p-2 rounded">
                  <span className="text-gray-300 text-sm">{question}</span>
                  <button
                    type="button"
                    onClick={() => removeQuestion(question)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isPending || isConfirming}
              className="bg-gradient-to-r from-[#E23E6B] to-[#cc4368] hover:from-[#cc4368] hover:to-[#E23E6B] text-white px-8"
            >
              {isLoading || isPending || isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isPending ? "Confirming..." : isConfirming ? "Processing..." : "Uploading..."}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit to EDU Chain
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
