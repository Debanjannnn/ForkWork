"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast} from "sonner"
import { Loader2, Plus, X, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther } from "viem"
import { FREELANCE_CONTRACT_ADDRESS, FREELANCE_ABI } from "@/lib/contracts"
import { uploadToPinata } from "@/lib/pinata"

interface GigFormData {
  title: string
  description: string
  category: string
  skills: string[]
  usdtAmount: string
  nativeStakeRequired: string
  durationDays: string
  proposalDurationDays: string
  requirements: string[]
  deliverables: string[]
  additionalInfo: string
}

export function PostGigForm() {
  const { address } = useAccount()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "uploaded" | "error">("idle")
  const [currentSkill, setCurrentSkill] = useState("")
  const [currentRequirement, setCurrentRequirement] = useState("")
  const [currentDeliverable, setCurrentDeliverable] = useState("")

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const [formData, setFormData] = useState<GigFormData>({
    title: "",
    description: "",
    category: "",
    skills: [],
    usdtAmount: "",
    nativeStakeRequired: "",
    durationDays: "",
    proposalDurationDays: "",
    requirements: [],
    deliverables: [],
    additionalInfo: "",
  })

  const categories = [
    "Development",
    "Design",
    "Marketing",
    "Writing",
    "Analytics",
    "Consulting",
    "Blockchain",
    "Smart Contracts",
    "DeFi",
    "NFT",
    "Other",
  ]

  const handleInputChange = (field: keyof GigFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addSkill = () => {
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()],
      }))
      setCurrentSkill("")
    }
  }

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }))
  }

  const addRequirement = () => {
    if (currentRequirement.trim() && !formData.requirements.includes(currentRequirement.trim())) {
      setFormData((prev) => ({
        ...prev,
        requirements: [...prev.requirements, currentRequirement.trim()],
      }))
      setCurrentRequirement("")
    }
  }

  const removeRequirement = (requirement: string) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((r) => r !== requirement),
    }))
  }

  const addDeliverable = () => {
    if (currentDeliverable.trim() && !formData.deliverables.includes(currentDeliverable.trim())) {
      setFormData((prev) => ({
        ...prev,
        deliverables: [...prev.deliverables, currentDeliverable.trim()],
      }))
      setCurrentDeliverable("")
    }
  }

  const removeDeliverable = (deliverable: string) => {
    setFormData((prev) => ({
      ...prev,
      deliverables: prev.deliverables.filter((d) => d !== deliverable),
    }))
  }

  const formatToMarkdown = (data: GigFormData): string => {
    return `# ${data.title}

## Project Overview
${data.description}

## Category
**${data.category}**

## Required Skills
${data.skills.map((skill) => `- ${skill}`).join("\n")}

## Project Requirements
${data.requirements.map((req) => `- ${req}`).join("\n")}

## Expected Deliverables
${data.deliverables.map((del) => `- ${del}`).join("\n")}

## Project Details
- **Budget**: $${data.usdtAmount} USDT
- **Stake Required**: ${data.nativeStakeRequired || "0"} EDU
- **Project Duration**: ${data.durationDays} days
- **Proposal Submission Period**: ${data.proposalDurationDays} days

## Additional Information
${data.additionalInfo || "No additional information provided."}

## Timeline
This project should be completed within **${data.durationDays} days** from the start date.

## Payment Terms
- Payment will be held in escrow using smart contracts on EDU Chain
- Funds will be released upon successful completion and approval of all deliverables
- ${data.nativeStakeRequired ? `Freelancer must stake ${data.nativeStakeRequired} EDU as commitment` : "No stake required"}

## How to Apply
Submit your proposal through the platform including:
1. Your approach to the project
2. Relevant experience and portfolio
3. Detailed timeline
4. Any questions you may have

---
*Posted on EDU Chain Testnet - Freelance Marketplace*
*Contract: ${FREELANCE_CONTRACT_ADDRESS}*
*Posted by: ${address}*
*Date: ${new Date().toISOString()}*
`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to post a gig",
        variant: "destructive",
      })
      return
    }

    if (
      !formData.title ||
      !formData.description ||
      !formData.usdtAmount ||
      !formData.durationDays ||
      !formData.proposalDurationDays
    ) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (Number.parseFloat(formData.usdtAmount) <= 0) {
      toast({
        title: "Invalid budget",
        description: "Budget must be greater than 0",
        variant: "destructive",
      })
      return
    }

    if (Number.parseInt(formData.durationDays) <= 0 || Number.parseInt(formData.proposalDurationDays) <= 0) {
      toast({
        title: "Invalid duration",
        description: "Duration must be greater than 0 days",
        variant: "destructive",
      })
      return
    }

    if (Number.parseInt(formData.proposalDurationDays) > Number.parseInt(formData.durationDays)) {
      toast({
        title: "Invalid proposal duration",
        description: "Proposal duration cannot be longer than project duration",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setUploadStatus("uploading")

    try {
      // Format data to markdown
      const markdownContent = formatToMarkdown(formData)

      // Upload to IPFS via Pinata
      const metadata = {
        name: formData.title,
        description: formData.description,
        category: categories.indexOf(formData.category),
        deadline: Math.floor(Date.now() / 1000) + Number.parseInt(formData.durationDays) * 24 * 60 * 60,
        content: markdownContent,
        skills: formData.skills,
        requirements: formData.requirements,
        deliverables: formData.deliverables,
        additionalInfo: formData.additionalInfo,
        budget: formData.usdtAmount,
        stakeRequired: formData.nativeStakeRequired,
        duration: formData.durationDays,
        proposalDuration: formData.proposalDurationDays,
        createdAt: Math.floor(Date.now() / 1000),
        creator: address,
      }

      const ipfsUri = await uploadToPinata(metadata)
      setUploadStatus("uploaded")

      toast({
        title: "Data uploaded to IPFS",
        description: `IPFS URI: ${ipfsUri}`,
      })

      // Post gig to contract
      writeContract({
        address: FREELANCE_CONTRACT_ADDRESS,
        abi: FREELANCE_ABI,
        functionName: "postGig",
        args: [
          formData.title,
          formData.description,
          ipfsUri,
          BigInt(Math.floor(Number.parseFloat(formData.usdtAmount) * 1e6)), // USDT has 6 decimals
          parseEther(formData.nativeStakeRequired || "0"),
          BigInt(formData.durationDays),
          BigInt(formData.proposalDurationDays),
        ],
      })
    } catch (error) {
      console.error("Error posting gig:", error)
      setUploadStatus("error")
      toast({
        title: "Error posting gig",
        description: error instanceof Error ? error.message : "Failed to upload to IPFS or post to contract",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Handle transaction success
  if (isSuccess) {
    toast({
      title: "Gig posted successfully!",
      description: "Your gig has been posted on EDU Chain and is now live",
    })
    // Reset form
    setFormData({
      title: "",
      description: "",
      category: "",
      skills: [],
      usdtAmount: "",
      nativeStakeRequired: "",
      durationDays: "",
      proposalDurationDays: "",
      requirements: [],
      deliverables: [],
      additionalInfo: "",
    })
    setIsLoading(false)
    setUploadStatus("idle")
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
        return <Upload className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (uploadStatus) {
      case "uploading":
        return "Uploading to IPFS..."
      case "uploaded":
        return "Uploaded to IPFS successfully"
      case "error":
        return "Upload failed"
      default:
        return "Ready to upload"
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="bg-white/5 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Post a New Gig
          </CardTitle>
          <CardDescription className="text-gray-300">
            Create a new freelance gig with escrow protection on EDU Chain
          </CardDescription>
          <div className="flex items-center gap-2 mt-2">
            {getStatusIcon()}
            <span className="text-sm text-gray-400">{getStatusText()}</span>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">
                  Gig Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter a clear, descriptive title"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-white">
                  Category *
                </Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">
                Project Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Provide a detailed description of your project, including goals, scope, and expectations"
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 min-h-[120px]"
                required
              />
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <Label className="text-white">Required Skills</Label>
              <div className="flex gap-2">
                <Input
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  placeholder="Add a required skill (e.g., Solidity, React, etc.)"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill} variant="outline" className="bg-white/10 border-white/20">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="bg-[#E23E6B]/20 text-white border-[#E23E6B]/30">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="ml-2 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              <Label className="text-white">Project Requirements</Label>
              <div className="flex gap-2">
                <Input
                  value={currentRequirement}
                  onChange={(e) => setCurrentRequirement(e.target.value)}
                  placeholder="Add a specific requirement"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())}
                />
                <Button
                  type="button"
                  onClick={addRequirement}
                  variant="outline"
                  className="bg-white/10 border-white/20"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1 mt-2">
                {formData.requirements.map((requirement, index) => (
                  <div key={index} className="flex items-center justify-between bg-white/5 p-2 rounded">
                    <span className="text-gray-300 text-sm">{requirement}</span>
                    <button
                      type="button"
                      onClick={() => removeRequirement(requirement)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliverables */}
            <div className="space-y-2">
              <Label className="text-white">Expected Deliverables</Label>
              <div className="flex gap-2">
                <Input
                  value={currentDeliverable}
                  onChange={(e) => setCurrentDeliverable(e.target.value)}
                  placeholder="Add an expected deliverable"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addDeliverable())}
                />
                <Button
                  type="button"
                  onClick={addDeliverable}
                  variant="outline"
                  className="bg-white/10 border-white/20"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1 mt-2">
                {formData.deliverables.map((deliverable, index) => (
                  <div key={index} className="flex items-center justify-between bg-white/5 p-2 rounded">
                    <span className="text-gray-300 text-sm">{deliverable}</span>
                    <button
                      type="button"
                      onClick={() => removeDeliverable(deliverable)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-2">
              <Label htmlFor="additionalInfo" className="text-white">
                Additional Information
              </Label>
              <Textarea
                id="additionalInfo"
                value={formData.additionalInfo}
                onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
                placeholder="Any additional information, special instructions, or preferences"
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 min-h-[80px]"
              />
            </div>

            {/* Payment and Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="usdtAmount" className="text-white">
                  Budget (USDT) *
                </Label>
                <Input
                  id="usdtAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.usdtAmount}
                  onChange={(e) => handleInputChange("usdtAmount", e.target.value)}
                  placeholder="0.00"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nativeStakeRequired" className="text-white">
                  Freelancer Stake Required (EDU)
                </Label>
                <Input
                  id="nativeStakeRequired"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.nativeStakeRequired}
                  onChange={(e) => handleInputChange("nativeStakeRequired", e.target.value)}
                  placeholder="0.00 (optional)"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="durationDays" className="text-white">
                  Project Duration (Days) *
                </Label>
                <Input
                  id="durationDays"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.durationDays}
                  onChange={(e) => handleInputChange("durationDays", e.target.value)}
                  placeholder="30"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proposalDurationDays" className="text-white">
                  Proposal Submission Period (Days) *
                </Label>
                <Input
                  id="proposalDurationDays"
                  type="number"
                  min="1"
                  value={formData.proposalDurationDays}
                  onChange={(e) => handleInputChange("proposalDurationDays", e.target.value)}
                  placeholder="7"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isLoading || isPending || isConfirming}
                className="bg-gradient-to-r from-[#E23E6B] to-[#cc4368] hover:from-[#cc4368] hover:to-[#E23E6B] text-white px-8 py-3"
              >
                {isLoading || isPending || isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isPending ? "Confirming..." : isConfirming ? "Processing..." : "Uploading..."}
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Post Gig to EDU Chain
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
