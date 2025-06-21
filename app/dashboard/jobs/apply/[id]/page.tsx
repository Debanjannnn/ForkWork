"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import axios from "axios"
import { motion } from "framer-motion"
import { Poppins } from "next/font/google"
import { cn } from "@/lib/utils"
import { 
  ExternalLink, 
  MapPin, 
  Calendar, 
  Building2, 
  Loader2, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react"
import { AuroraText } from "@/components/magicui/aurora-text"
import { WalletDisplay } from "@/components/ui/wallet-display"

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
})

type Job = {
  id: string
  title: string
  date: string
  date_epoch: number
  country: string
  city: string
  company: string
  location: string
  apply_url: string
  tags: string[]
  description: string
}

export default function JobApply() {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  useEffect(() => {
    async function fetchJobDetails() {
      try {
        setLoading(true)
        const response = await axios.get("/api/jobs")
        const jobList = response.data[2] // assuming job array is at index 2
        const foundJob = jobList.find((j: Job) => j.id === jobId)
        
        if (foundJob) {
          setJob(foundJob)
        } else {
          setError("Job not found")
        }
      } catch (error) {
        console.error("Error fetching job details:", error)
        setError("Failed to load job details")
      } finally {
        setLoading(false)
      }
    }

    if (jobId) {
      fetchJobDetails()
    }
  }, [jobId])

  const handleBackClick = () => {
    router.back()
  }

  const handleExternalApply = () => {
    if (job?.apply_url) {
      window.open(job.apply_url, '_blank', 'noopener,noreferrer')
    }
  }

  if (loading) {
    return (
      <div className={cn("min-h-screen bg-black text-white py-16 px-4 md:px-6", poppins.className)}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Loader2 className="w-8 h-8 text-[#E23E6B] animate-spin" />
              <span className="text-xl text-gray-300">Loading application details...</span>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className={cn("min-h-screen bg-black text-white py-16 px-4 md:px-6", poppins.className)}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="text-red-400 text-xl mb-4">{error || "Job not found"}</div>
            <button
              onClick={handleBackClick}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen bg-black text-white py-16 px-4 md:px-6", poppins.className)}>
      {/* SVG Gradients */}
      <svg width="0" height="0" className="absolute">
        <linearGradient id="text-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E23E6B" />
          <stop offset="100%" stopColor="white" />
        </linearGradient>
      </svg>

      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <motion.div
          className="flex justify-between items-center mb-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <WalletDisplay />
          <motion.button
            onClick={handleBackClick}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 group backdrop-blur-md border border-white/20 shadow-lg"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>Back</span>
          </motion.button>
        </motion.div>

        {/* Application Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <motion.h1
            className={cn("text-3xl md:text-4xl lg:text-5xl font-thin text-center mb-4", poppins.className)}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <AuroraText colors={["#cc4368", "#e6295c", "#ffffff", "#E23E6B"]}>
              <span className="text-transparent">Apply for Position</span>
            </AuroraText>
          </motion.h1>
          <motion.p
            className="text-gray-300/80 text-xl max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            Ready to take the next step in your Web3 career? Apply for this exciting opportunity.
          </motion.p>
        </motion.div>

        {/* Job Summary Card */}
        <motion.div
          className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h2 className={cn("text-2xl font-bold mb-6 text-white", poppins.className)}>{job.title}</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-center text-gray-300/80">
              <Building2 className="w-5 h-5 mr-3 text-[#E23E6B]" />
              <div>
                <div className="font-medium text-white">{job.company}</div>
                <div className="text-sm text-gray-400">Company</div>
              </div>
            </div>

            <div className="flex items-center text-gray-300/80">
              <MapPin className="w-5 h-5 mr-3 text-[#E23E6B]" />
              <div>
                <div className="font-medium text-white">{job.location || `${job.city}, ${job.country}`}</div>
                <div className="text-sm text-gray-400">Location</div>
              </div>
            </div>

            <div className="flex items-center text-gray-300/80">
              <Calendar className="w-5 h-5 mr-3 text-[#E23E6B]" />
              <div>
                <div className="font-medium text-white">{new Date(job.date).toLocaleDateString()}</div>
                <div className="text-sm text-gray-400">Posted Date</div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-white">Required Skills</h3>
              <div className="flex flex-wrap gap-3">
                {job.tags.slice(0, 6).map((tag, index) => (
                  <motion.span
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-[#E23E6B]/20 to-[#cc4368]/20 border border-[#E23E6B]/30 text-sm rounded-full text-gray-200 backdrop-blur-sm"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    {tag}
                  </motion.span>
                ))}
                {job.tags.length > 6 && (
                  <span className="px-4 py-2 bg-white/10 border border-white/20 text-sm rounded-full text-gray-300">
                    +{job.tags.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Application Instructions */}
        <motion.div
          className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          <div className="flex items-start space-x-4 mb-6">
            <Info className="w-6 h-6 text-[#E23E6B] mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Application Process</h3>
              <p className="text-gray-300 leading-relaxed">
                You will be redirected to the company's official application portal. Make sure to have your resume, 
                portfolio, and any other required documents ready before proceeding.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
              <span className="text-gray-300">Prepare your updated resume/CV</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
              <span className="text-gray-300">Review the job requirements and your qualifications</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
              <span className="text-gray-300">Have your portfolio or relevant work samples ready</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
              <span className="text-gray-300">Ensure you have a stable internet connection</span>
            </div>
          </div>
        </motion.div>

        {/* Apply Button */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          <motion.button
            onClick={handleExternalApply}
            className="inline-flex items-center px-12 py-6 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-bold text-xl rounded-3xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 group shadow-2xl"
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="mr-3">Apply Now</span>
            <ExternalLink className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
          </motion.button>
          
          <p className="text-gray-400 text-sm mt-4">
            You will be redirected to the company's application portal
          </p>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          className="mt-12 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.7 }}
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
            <div className="text-sm text-gray-300">
              <p className="font-medium text-yellow-400 mb-1">Important Notice</p>
              <p>
                This application will redirect you to an external website. We are not responsible for the content, 
                privacy practices, or application process on external sites. Please review the company's privacy 
                policy and terms of service before submitting your application.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 