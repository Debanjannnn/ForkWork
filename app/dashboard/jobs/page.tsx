"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { motion, Variants } from "framer-motion"
import { Poppins } from "next/font/google"
import { cn } from "@/lib/utils"
import { ExternalLink, MapPin, Calendar, Building2, Loader2, ArrowLeft } from "lucide-react"
import { AuroraText } from "@/components/magicui/aurora-text"

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

export default function Web3Jobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchJobs() {
      try {
        const response = await axios.get("https://web3.career/api/v1?token=EBgibcypTuCrRCYAgZCZARKTZoGs9kmx")
        const jobList = response.data[2] // assuming job array is at index 2
        setJobs(jobList)
      } catch (error) {
        console.error("Error fetching Web3 jobs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  const handleBackClick = () => {
    router.back()
  }

  // Animation variants
  const cardVariants: Variants = {
    initial: {
      opacity: 0,
      y: 20,
    },
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
      y: -5,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  }

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  if (loading) {
    return (
      <div className={cn("min-h-screen bg-black text-white py-16 px-4 md:px-6", poppins.className)}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Loader2 className="w-8 h-8 text-[#E23E6B] animate-spin" />
              <span className="text-xl text-gray-300">Loading Web3 opportunities...</span>
            </motion.div>
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
        <linearGradient id="tag-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E23E6B" />
          <stop offset="100%" stopColor="#cc4368" />
        </linearGradient>
      </svg>

      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <motion.div
          className="flex justify-end mb-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.button
            onClick={handleBackClick}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 group backdrop-blur-md border border-white/20 shadow-lg"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>Back to Dashboard</span>
          </motion.button>
        </motion.div>

        {/* Header */}
        <motion.div
          className="text-center mb-16"
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
              <span className="text-transparent">Web3 Career Opportunities</span>
            </AuroraText>
          </motion.h1>
          <motion.p
            className="text-gray-300/80 text-xl max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            Discover the latest opportunities in the decentralized world. Build your Web3 career with top companies and
            innovative projects.
          </motion.p>
        </motion.div>

        {/* Jobs Grid */}
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="initial"
          animate="animate"
        >
          {jobs.map((job, index) => (
            <motion.div
              key={job.id}
              className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-6 flex flex-col relative group overflow-hidden shadow-lg h-full"
              variants={cardVariants}
              custom={index}
              whileHover="hover"
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white to-[#E23E6B] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl"></div>

              {/* Job Header */}
              <div className="relative z-10 mb-4">
                <h2
                  className={cn(
                    "text-xl font-medium mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#E23E6B] transition-all duration-300",
                    poppins.className,
                  )}
                >
                  {job.title}
                </h2>

                {/* Company & Location */}
                <div className="flex items-center text-gray-300/80 text-sm mb-2">
                  <Building2 className="w-4 h-4 mr-2 text-[#E23E6B]" />
                  <span className="font-medium">{job.company}</span>
                </div>

                <div className="flex items-center text-gray-300/70 text-sm mb-2">
                  <MapPin className="w-4 h-4 mr-2 text-[#E23E6B]" />
                  <span>{job.location || `${job.city}, ${job.country}`}</span>
                </div>

                <div className="flex items-center text-gray-300/70 text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-[#E23E6B]" />
                  <span>{new Date(job.date).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Tags */}
              {job.tags && job.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {job.tags.slice(0, 4).map((tag, tagIndex) => (
                    <motion.span
                      key={tagIndex}
                      className="px-3 py-1 bg-gradient-to-r from-[#E23E6B]/20 to-[#cc4368]/20 border border-[#E23E6B]/30 text-xs rounded-full text-gray-200 backdrop-blur-sm"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + tagIndex * 0.1 }}
                    >
                      {tag}
                    </motion.span>
                  ))}
                  {job.tags.length > 4 && (
                    <span className="px-3 py-1 bg-white/10 border border-white/20 text-xs rounded-full text-gray-300">
                      +{job.tags.length - 4} more
                    </span>
                  )}
                </div>
              )}

              {/* Apply Button */}
              <div className="mt-auto pt-4">
                <motion.a
                  href={job.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 group/button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="mr-2"
                   onClick={() => router.push(job.apply_url)}>Apply Now</span>
                  <ExternalLink className="w-4 h-4 group-hover/button:translate-x-1 transition-transform duration-300" />
                </motion.a>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {jobs.length === 0 && !loading && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-gray-400 text-lg mb-4">No jobs found at the moment</div>
            <div className="text-gray-500 text-sm">Check back later for new opportunities</div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
