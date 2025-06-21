"use client";

import { motion, Variants } from "framer-motion";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuroraText } from "@/components/magicui/aurora-text";
import { WalletDisplay } from "@/components/ui/wallet-display";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
});

export default function StakedCommitments() {
  // Animation variants
  const containerVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const itemVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.2 * index, duration: 0.5, ease: "easeOut" },
    }),
  };

  const features = [
    "Job seekers and recruiters stake tokens to apply or post",
    "If one party defaults (e.g., ghosting, scam), stake is slashed",
    "Boosts seriousness and trust",
  ];

  return (
    <div
      className={cn(
        "relative bg-black text-white py-8 px-4 md:px-6 min-h-screen",
        poppins.className
      )}
    >
      {/* Navigation Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-end items-center gap-4">
          <div className="flex items-center gap-4">
            <WalletDisplay />
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
          </div>
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="max-w-4xl mx-auto text-center relative z-10 flex items-center justify-center min-h-[calc(100vh-200px)]">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-[#E23E6B]/10 opacity-50 rounded-3xl blur-md"></div>

        <div className="relative z-10">
          {/* Header */}
          <motion.div
            className="mb-12"
            variants={containerVariants}
            initial="initial"
            animate="animate"
          >
            <motion.h1
              className={cn(
                "text-4xl md:text-5xl lg:text-6xl font-thin mb-4",
                poppins.className
              )}
              variants={itemVariants}
              custom={0}
            >
              <AuroraText colors={["#cc4368", "#e6295c", "#ffffff", "#E23E6B"]}>
                <span className="text-transparent">Staked Commitments</span>
              </AuroraText>
            </motion.h1>
            <motion.p
              className="text-2xl text-gray-300/80"
              variants={itemVariants}
              custom={1}
            >
              Coming Soon
            </motion.p>
          </motion.div>

          {/* Features List */}
          <motion.ul
            className="space-y-6 max-w-2xl mx-auto"
            variants={containerVariants}
            initial="initial"
            animate="animate"
          >
            {features.map((feature, index) => (
              <motion.li
                key={index}
                className="flex items-center justify-center text-lg text-gray-300/70"
                variants={itemVariants}
                custom={index + 2}
              >
                <div className="w-2 h-2 bg-[#E23E6B]/70 rounded-full mr-3"></div>
                {feature}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </div>
  );
}