"use client"

import { motion } from "framer-motion"
import { ExternalLink, FileText, Clock, DollarSign, User, Target, Calendar } from "lucide-react"

interface ProposalContent {
  title?: string
  description?: string
  coverLetter?: string
  experience?: string
  approach?: string
  timeline?: string
  budget?: string
  portfolioLinks?: string[]
  availability?: string
  skills?: string[]
  markup?: string
}

interface ProposalRendererProps {
  content: ProposalContent
}

export function ProposalRenderer({ content }: ProposalRendererProps) {
  // If markup is available, render it
  if (content.markup) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content.markup }}
      />
    )
  }

  // Otherwise, render structured content
  return (
    <div className="space-y-8">
      {/* Cover Letter */}
      {content.coverLetter && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-[#E23E6B]" />
            <h3 className="text-lg font-medium text-gray-300">Cover Letter</h3>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-gray-200/90 font-light leading-relaxed whitespace-pre-wrap">{content.coverLetter}</p>
          </div>
        </motion.div>
      )}

      {/* Experience */}
      {content.experience && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-[#E23E6B]" />
            <h3 className="text-lg font-medium text-gray-300">Experience</h3>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-gray-200/90 font-light leading-relaxed whitespace-pre-wrap">{content.experience}</p>
          </div>
        </motion.div>
      )}

      {/* Approach */}
      {content.approach && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-[#E23E6B]" />
            <h3 className="text-lg font-medium text-gray-300">Approach</h3>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-gray-200/90 font-light leading-relaxed whitespace-pre-wrap">{content.approach}</p>
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      {content.timeline && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-[#E23E6B]" />
            <h3 className="text-lg font-medium text-gray-300">Timeline</h3>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-gray-200/90 font-light leading-relaxed whitespace-pre-wrap">{content.timeline}</p>
          </div>
        </motion.div>
      )}

      {/* Budget */}
      {content.budget && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-[#E23E6B]" />
            <h3 className="text-lg font-medium text-gray-300">Budget Breakdown</h3>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-gray-200/90 font-light leading-relaxed whitespace-pre-wrap">{content.budget}</p>
          </div>
        </motion.div>
      )}

      {/* Availability */}
      {content.availability && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-[#E23E6B]" />
            <h3 className="text-lg font-medium text-gray-300">Availability</h3>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-gray-200/90 font-light leading-relaxed whitespace-pre-wrap">{content.availability}</p>
          </div>
        </motion.div>
      )}

      {/* Skills */}
      {content.skills && content.skills.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <h3 className="text-lg font-medium text-gray-300 mb-3">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {content.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-[#E23E6B]/20 text-[#E23E6B] rounded-full text-sm border border-[#E23E6B]/30"
              >
                {skill}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Portfolio Links */}
      {content.portfolioLinks && content.portfolioLinks.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <h3 className="text-lg font-medium text-gray-300 mb-3">Portfolio Links</h3>
          <div className="space-y-2">
            {content.portfolioLinks.map((link, index) => (
              <a
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#E23E6B] hover:text-[#cc4368] transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="break-all">{link}</span>
              </a>
            ))}
          </div>
        </motion.div>
      )}

      {/* Fallback for basic description */}
      {content.description && !content.coverLetter && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-[#E23E6B]" />
            <h3 className="text-lg font-medium text-gray-300">Proposal</h3>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-gray-200/90 font-light leading-relaxed whitespace-pre-wrap">{content.description}</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
