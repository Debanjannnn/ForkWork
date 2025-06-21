"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import { motion } from "framer-motion"
import { FileText, User, Clock, DollarSign, Briefcase, Calendar, LinkIcon, Info, Plus, Minus } from "lucide-react"

interface ProposalFormData {
  coverLetter: string
  experience: string
  approach: string
  timeline: string
  budget: string
  portfolio: string[]
  availability: string
}

interface ProposalFormProps {
  onSubmit: (data: ProposalFormData) => void
  isLoading: boolean
}

const FormField = ({
  label,
  icon,
  children,
  tooltip,
  required = false,
}: {
  label: string
  icon: ReactNode
  children: ReactNode
  tooltip?: string
  required?: boolean
}) => (
  <motion.div
    className="mb-6"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <label className="flex items-center text-gray-300 text-sm mb-2">
      {icon}
      <span className="ml-2 font-medium">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </span>
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

export default function ProposalForm({ onSubmit, isLoading }: ProposalFormProps) {
  const [formData, setFormData] = useState<ProposalFormData>({
    coverLetter: "",
    experience: "",
    approach: "",
    timeline: "",
    budget: "",
    portfolio: [""],
    availability: "",
  })

  const updateField = (field: keyof ProposalFormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addPortfolioItem = () => {
    setFormData((prev) => ({ ...prev, portfolio: [...prev.portfolio, ""] }))
  }

  const removePortfolioItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      portfolio: prev.portfolio.filter((_, i) => i !== index),
    }))
  }

  const updatePortfolioItem = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      portfolio: prev.portfolio.map((item, i) => (i === index ? value : item)),
    }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const generateMarkup = () => {
    return `
# Proposal for Gig

## Cover Letter
${formData.coverLetter}

## Experience & Background
${formData.experience}

## Project Approach
${formData.approach}

## Timeline
${formData.timeline}

## Budget Breakdown
${formData.budget}

## Portfolio
${formData.portfolio
  .filter((item) => item.trim())
  .map((item) => `- ${item}`)
  .join("\n")}

## Availability
${formData.availability}
    `.trim()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset disabled={isLoading}>
        {/* Cover Letter */}
        <FormField
          label="Cover Letter"
          icon={<FileText className="w-4 h-4 text-gray-400" />}
          tooltip="Introduce yourself and explain why you're the best fit for this project"
          required
        >
          <textarea
            placeholder="Dear Client,

I am excited to apply for this project because..."
            value={formData.coverLetter}
            onChange={(e) => updateField("coverLetter", e.target.value)}
            className="w-full pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:border-[#E23E6B] min-h-[150px] resize-y"
            required
          />
        </FormField>

        {/* Experience */}
        <FormField
          label="Relevant Experience"
          icon={<User className="w-4 h-4 text-gray-400" />}
          tooltip="Highlight your relevant skills and past projects"
          required
        >
          <textarea
            placeholder="I have 5+ years of experience in React development, including:
- Built 20+ responsive web applications
- Expertise in TypeScript, Next.js, and modern frameworks
- Experience with blockchain integration..."
            value={formData.experience}
            onChange={(e) => updateField("experience", e.target.value)}
            className="w-full pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:border-[#E23E6B] min-h-[120px] resize-y"
            required
          />
        </FormField>

        {/* Approach */}
        <FormField
          label="Project Approach"
          icon={<Briefcase className="w-4 h-4 text-gray-400" />}
          tooltip="Outline your methodology and how you'll tackle this project"
          required
        >
          <textarea
            placeholder="My approach to this project will be:

1. Requirements Analysis & Planning
2. Design & Architecture
3. Development & Testing
4. Deployment & Documentation

I will ensure regular communication and provide daily updates..."
            value={formData.approach}
            onChange={(e) => updateField("approach", e.target.value)}
            className="w-full pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:border-[#E23E6B] min-h-[120px] resize-y"
            required
          />
        </FormField>

        {/* Timeline */}
        <FormField
          label="Proposed Timeline"
          icon={<Clock className="w-4 h-4 text-gray-400" />}
          tooltip="Break down your timeline with milestones"
          required
        >
          <textarea
            placeholder="Week 1: Requirements gathering and design
Week 2-3: Core development
Week 4: Testing and refinement
Week 5: Deployment and documentation

Total estimated time: 5 weeks"
            value={formData.timeline}
            onChange={(e) => updateField("timeline", e.target.value)}
            className="w-full pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:border-[#E23E6B] min-h-[100px] resize-y"
            required
          />
        </FormField>

        {/* Budget */}
        <FormField
          label="Budget Breakdown"
          icon={<DollarSign className="w-4 h-4 text-gray-400" />}
          tooltip="Explain how you arrived at your pricing"
        >
          <textarea
            placeholder="Development: $400
Testing & QA: $50
Documentation: $50

Total: $500 USDT

This includes unlimited revisions and 30 days of post-launch support."
            value={formData.budget}
            onChange={(e) => updateField("budget", e.target.value)}
            className="w-full pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:border-[#E23E6B] min-h-[100px] resize-y"
          />
        </FormField>

        {/* Portfolio */}
        <FormField
          label="Portfolio Links"
          icon={<LinkIcon className="w-4 h-4 text-gray-400" />}
          tooltip="Share links to relevant work examples"
        >
          <div className="space-y-3">
            {formData.portfolio.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://github.com/username/project or https://live-demo.com"
                  value={item}
                  onChange={(e) => updatePortfolioItem(index, e.target.value)}
                  className="flex-1 pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:border-[#E23E6B]"
                />
                {formData.portfolio.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePortfolioItem(index)}
                    className="px-3 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/30"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addPortfolioItem}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Portfolio Link
            </button>
          </div>
        </FormField>

        {/* Availability */}
        <FormField
          label="Availability"
          icon={<Calendar className="w-4 h-4 text-gray-400" />}
          tooltip="When can you start and how many hours per week can you dedicate?"
          required
        >
          <textarea
            placeholder="I can start immediately and dedicate 40 hours per week to this project.

My timezone is UTC+0 and I'm available for calls between 9 AM - 6 PM.

I typically respond to messages within 2-4 hours during business days."
            value={formData.availability}
            onChange={(e) => updateField("availability", e.target.value)}
            className="w-full pl-3 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:border-[#E23E6B] min-h-[100px] resize-y"
            required
          />
        </FormField>

        {/* Preview */}
        <div className="bg-white/5 border border-white/20 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Proposal Preview (Markdown)</h3>
          <pre className="text-xs text-gray-400 whitespace-pre-wrap max-h-40 overflow-y-auto">{generateMarkup()}</pre>
        </div>
      </fieldset>
    </form>
  )
}
