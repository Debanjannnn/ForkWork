"use client"

import { Wallet, Trophy, DollarSign, ChevronRight } from "lucide-react"
import { motion, Variants } from "framer-motion"
import { Poppins } from "next/font/google"
import { cn } from "@/lib/utils"
import { AuroraText } from "@/components/magicui/aurora-text"

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

export default function HowItWorks() {
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

  const iconVariants: Variants = {
    initial: {
      scale: 0.8,
      opacity: 0.5,
    },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    hover: {
      scale: 1.1,
      rotate: [0, -5, 5, -5, 0],
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      },
    },
  }

  const steps = [
    {
      icon: Wallet,
      step: "Step 1",
      title: "Connect & Onboard",
      description: "Connect your wallet and link your GitHub, LinkedIn, and other professional profiles",
      features: ["Wallet connection", "GitHub integration", "LinkedIn profile", "XYZ platform (optional)"],
    },
    {
      icon: Trophy,
      step: "Step 2",
      title: "Build Reputation",
      description: "Complete tasks, build your on-chain reputation, and establish trust in the community",
      features: ["Algorithm-based reputation", "On-chain verification", "Community trust", "Skill validation"],
    },
    {
      icon: DollarSign,
      step: "Step 3",
      title: "Start Earning",
      description: "Choose from bounties, freelance gigs, staked commitments, or earn through referrals",
      features: ["Bounty competitions", "Freelance projects", "Staked applications", "Referral rewards"],
    },
  ]

  return (
    <div className={cn("relative text-white py-16 px-4 md:px-6 z-10", poppins.className)}>
      {/* SVG Gradients for icons */}
      <svg width="0" height="0" className="absolute">
        <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="#E23E6B" />
        </linearGradient>
        <linearGradient id="step-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E23E6B" />
          <stop offset="100%" stopColor="white" />
        </linearGradient>
      </svg>

      <div className="max-w-6xl mx-auto relative">
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
              <span className="text-transparent">How It Works</span>
            </AuroraText>
          </motion.h1>
          <motion.p
            className="text-gray-300/80  text-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            Get started in three simple steps and begin your Web3 career journey.
          </motion.p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, index) => {
            const IconComponent = step.icon
            return (
              <motion.div
                key={index}
                className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8 flex flex-col relative group overflow-hidden shadow-lg h-full"
                initial="initial"
                animate="animate"
                whileHover="hover"
                variants={cardVariants}
                custom={index}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white to-[#E23E6B] opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl"></div>

                {/* Step indicator */}
                <div className="flex items-center justify-between mb-6">
                  <motion.div
                    className="w-14 h-14 bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/10 relative overflow-hidden"
                    variants={iconVariants}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-[#E23E6B]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <IconComponent
                      className="w-7 h-7 text-pink-500 group-hover:text-transparent group-hover:fill-[url(#icon-gradient)]"
                      strokeWidth={1.5}
                    />
                  </motion.div>
                  <span className="text-sm bg-gradient-to-r from-[#E23E6B] to-white bg-clip-text text-transparent font-medium">
                    {step.step}
                  </span>
                </div>

                {/* Content */}
                <h3
                  className={cn(
                    "text-2xl font-thin mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-t group-hover:from-white group-hover:to-[#E23E6B] transition-colors duration-300",
                    poppins.className,
                  )}
                >
                  {step.title}
                </h3>
                <p className="text-gray-300/70 leading-relaxed mb-6 font-light">{step.description}</p>

                {/* Features */}
                <ul className="space-y-3 mb-6 flex-grow">
                  {step.features.map((feature, featureIndex) => (
                    <motion.li
                      key={featureIndex}
                      className="flex items-center text-sm text-gray-300/80"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + featureIndex * 0.1, duration: 0.5 }}
                    >
                      <div className="w-1.5 h-1.5 bg-[#E23E6B]/70 rounded-full mr-3"></div>
                      {feature}
                    </motion.li>
                  ))}
                </ul>

                {/* Action button */}
                <div className="mt-auto pt-4">
                  <motion.div
                    className="flex items-center justify-end cursor-pointer group/button"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <span className="text-sm text-gray-300/70 mr-2 group-hover/button:text-white transition-colors duration-300">
                      Learn more
                    </span>
                    <ChevronRight className="w-5 h-5 text-[#E23E6B] group-hover/button:text-white transition-colors duration-300" />
                  </motion.div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Connection lines between steps (visible on md and larger screens) */}
        <div className="hidden md:block absolute top-1/2 left-0 w-full z-0 pointer-events-none">
          <div className="relative h-0.5 bg-gradient-to-r from-transparent via-[#E23E6B]/30 to-transparent w-[30%] mx-auto"></div>
        </div>
      </div>
    </div>
  )
}
