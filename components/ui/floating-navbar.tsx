"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence, useScroll } from "motion/react"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Poppins } from "next/font/google"
import { Sparkles } from "lucide-react"
import { UserButton, useUser } from "@civic/auth/react"
import { Button } from "@/components/ui/button"

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
})

export const FloatingNav = ({
  navItems,
  className,
}: {
  navItems: {
    name: string
    link: string
    icon?: any
  }[]
  className?: string
}) => {
  const { scrollYProgress } = useScroll()
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()

  React.useEffect(() => {
    setIsVisible(true)
  }, [])

  // Redirect to dashboard if user is authenticated
  React.useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const getScale = (index: number) => {
    if (hoveredIndex === null) return 1

    if (index === hoveredIndex) {
      return 1.2 // Scale up the hovered item
    }

    return 1 // Keep other items at normal size
  }

  // Check if we're on the dashboard
  const isDashboard = pathname === '/dashboard'

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          initial={{
            opacity: 0,
            y: -100,
          }}
          animate={{
            y: 0,
            opacity: 1,
          }}
          transition={{
            duration: 0.8,
            type: "spring",
            stiffness: 50,
            damping: 15,
          }}
          className={cn(
            "flex max-w-4xl mx-auto border border-gray-800 dark:border-white/[0.2] rounded-3xl bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#8c2743] via-black to-black shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] anim z-[5000] px-4 py-2 items-center justify-between space-x-2 relative overflow-hidden",
            className,
          )}
        >
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#8c2743] via-black to-black rounded-3xl"
            animate={{
              scale: [1, 1.03, 0.97, 1.02, 1],
              y: [0, -2, 3, -2, 0],
              rotate: [0, 0.5, -0.5, 0.3, 0],
              opacity: [0.7, 0.8, 0.75, 0.8, 0.7],
            }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              times: [0, 0.25, 0.5, 0.75, 1],
            }}
          />
          
          <div className="flex items-center space-x-2">
            <img src="/logo1.png" alt="Fork Work" width={32} height={32} />
            <span className={cn("text-xl font-semibold text-white", poppins.className)}>Fork Work</span>
          </div>

          <div className="flex items-center space-x-6">
            {navItems.map((navItem: any, idx: number) => (
              <motion.a
                key={`link=${idx}`}
                href={navItem.link}
                className={cn(
                  "relative text-gray-400 items-center flex space-x-1 hover:text-white transition-colors",
                  poppins.className,
                )}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                whileHover={{ scale: getScale(idx) }}
                transition={{ duration: 0.2 }}
              >
                <span className="block sm:hidden">{navItem.icon}</span>
                <span className="hidden sm:block text-sm">{navItem.name}</span>
              </motion.a>
            ))}
          </div>

          <UserButton />

        </motion.div>
      </AnimatePresence>
    </>
  )
}