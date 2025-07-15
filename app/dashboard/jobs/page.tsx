"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Link from "next/link"
import { motion } from "framer-motion"
import { Briefcase, MapPin, ExternalLink, ArrowLeft } from "lucide-react"
import { AuroraText } from "@/components/magicui/aurora-text"
import { Poppins } from "next/font/google"
import { cn } from "@/lib/utils"
import { WalletDisplay } from "@/components/ui/wallet-display"

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
})

interface Job {
  title: string
  company: string
  location: string
  apply_url: string
}

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await axios.get("/api/jobs")

        if (Array.isArray(response.data)) {
          setJobs(response.data[2] || [])
        }
      } catch (error) {
        console.error("Error fetching jobs:", error)
        setError("Failed to load jobs. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  return (
    <div className={cn("min-h-screen bg-black text-white py-8 px-4 md:px-6", poppins.className)}>
      {/* Ambient background with moving particles */}

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <motion.h1
              className={cn("text-3xl md:text-4xl lg:text-5xl font-thin mb-3", poppins.className)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <AuroraText colors={["#cc4368", "#e6295c", "#ffffff", "#E23E6B"]}>
                <span className="text-transparent">Web3 Jobs</span>
              </AuroraText>
            </motion.h1>
            <motion.p
              className="text-gray-300/80 text-xl font-light max-w-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              Discover the latest opportunities in the Web3 space and take your career to the next level.
            </motion.p>
          </div>

          <div className="flex items-center gap-4 mt-6 lg:mt-0">
            <Link href="/dashboard">
              <motion.button
                className="flex items-center space-x-3 px-6 py-3 bg-white/10 border border-white/20 text-white font-medium rounded-2xl hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </motion.button>
            </Link>
            <WalletDisplay />
          </div>
        </motion.div>

        {loading ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="w-16 h-16 border-4 border-white/20 border-t-[#E23E6B] rounded-full mb-6"
            />
            <p className="text-gray-300 text-lg font-light">Loading opportunities...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white to-[#E23E6B] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl"></div>
            <div className="relative z-10">
              <p className="text-red-400 text-lg mb-6">{error}</p>
              <motion.button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl font-medium hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Try Again
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{
                  y: -12,
                  scale: 1.03,
                  transition: { duration: 0.4, ease: "easeInOut" },
                }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 group overflow-hidden relative hover:border-white/20 transition-all duration-500"
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-[#E23E6B]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#E23E6B]/20 to-[#cc4368]/20 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>

                <div className="relative z-10">
                  {/* Header with icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors duration-300">
                      <Briefcase className="h-6 w-6 text-[#E23E6B]" />
                    </div>
                  </div>

                  {/* Job Title */}
                  <h3 className="font-semibold text-xl mb-3 line-clamp-2 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#E23E6B] transition-all duration-300">
                    {job.title}
                  </h3>

                  {/* Company */}
                  <p className="text-gray-300 text-lg font-medium mb-4">{job.company}</p>

                  {/* Location */}
                  <div className="flex items-center gap-2 mb-6 p-3 bg-white/5 rounded-2xl border border-white/10">
                    <MapPin className="h-4 w-4 text-[#E23E6B]" />
                    <span className="text-gray-300 text-sm">{job.location}</span>
                  </div>

                  {/* Apply Button */}
                  <Link href={job.apply_url} target="_blank" rel="noopener noreferrer">
                    <motion.button
                      className="w-full py-4 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white font-medium rounded-2xl hover:from-[#cc4368] hover:to-[#E23E6B] transition-all duration-300 shadow-lg hover:shadow-xl group/btn relative overflow-hidden"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex items-center justify-center gap-2">
                        <span>Apply Now</span>
                        <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                      </div>
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && jobs.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Briefcase className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className={cn("text-xl font-thin mb-2", poppins.className)}>No Jobs Available</h3>
            <p className="text-gray-400 mb-6">Check back later for new opportunities!</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
