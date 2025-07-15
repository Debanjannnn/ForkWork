"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Poppins } from "next/font/google"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

interface EpisodeCardProps {
  image: string
  title: string
  delay: number
  isInView: boolean
}

export const EpisodeCard = ({ image, title, delay, isInView }: EpisodeCardProps) => {
  return (
    <motion.div
      className={cn("relative group", poppins.className)}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, scale: 1.02 }}
    >
      <div className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-md border border-white/20 shadow-xl group-hover:border-white/30 transition-all duration-500">
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white to-[#E23E6B] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl"></div>

        {/* Image container */}
        <div className="relative overflow-hidden">
          <Image
            src={image || "/placeholder.svg"}
            alt={title}
            width={400}
            height={400}
            className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <motion.h3
              className="text-xl sm:text-2xl font-thin leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#E23E6B] transition-all duration-300"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: delay + 0.2 }}
            >
              {title}
            </motion.h3>
          </div>

          {/* Decorative element */}
          <div className="absolute bottom-6 right-6 w-2 h-2 bg-[#E23E6B]/50 rounded-full group-hover:bg-[#E23E6B] transition-colors duration-300"></div>
        </div>
      </div>
    </motion.div>
  )
}
