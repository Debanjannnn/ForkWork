"use client"
import React from 'react'
import { FloatingNav } from "@/components/ui/floating-navbar";
import Lenis from "lenis";
import { Home as IconHome, User as IconUser, MessageSquare as IconMessage, ChevronDown, Play } from "lucide-react";
import { motion, useInView, useScroll, useSpring, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { EpisodeCard } from './Episode';

const episodes = [
    {
        image: "https://i.pinimg.com/736x/ea/72/53/ea72530e2a4e62e00b94b46677a384da.jpg",
        title: "Disrupting Traditional Hiring: Web3 Jobs Revolution",
        duration: "32:15",
        tag: "Career Future",
        name: "Arjun Mehta",
        description: "24 years old • DAO Evangelist",
        delay: 0.1,
    },
    {
        image: "https://i.pinimg.com/736x/8c/02/b2/8c02b28b94d274e47326699e1049c77a.jpg",
        title: "From Side Hustle to Smart Gigs",
        duration: "29:48",
        tag: "Freelance Deep Dive",
        name: "Priya Kulkarni",
        description: "26 years old • Fullstack Bounty Hunter",
        delay: 0.2,
    },
    {
        image: "https://i.pinimg.com/736x/c7/17/02/c71702f017efc971dae7cb6e4cb09c5c.jpg",
        title: "Trustless, Not Jobless: Staking for Serious Work",
        duration: "36:05",
        tag: "Web3 Work Ethic",
        name: "Zubair Khan",
        description: "31 years old • Web3 Work Architect",
        delay: 0.3,
    },
];




const Hero = () => {
    const episodesRef = useRef(null)
    const topicsRef = useRef(null)
    const testimonialsRef = useRef(null)
    const newsletterRef = useRef(null)
    const eventsRef = useRef(null)

    // Check if elements are in view
    const isEpisodesInView = useInView(episodesRef, { once: true, amount: 0.2 })
    const isTopicsInView = useInView(topicsRef, { once: true, amount: 0.2 })
    const isTestimonialsInView = useInView(testimonialsRef, { once: true, amount: 0.2 })
    const isNewsletterInView = useInView(newsletterRef, { once: true, amount: 0.3 })
    const isEventsInView = useInView(eventsRef, { once: true, amount: 0.2 })
    const { scrollY } = useScroll()
    const y = useTransform(scrollY, [0, 300], [0, -50])
    const opacity = useTransform(scrollY, [0, 300], [1, 0.2])
    const scale = useTransform(scrollY, [0, 300], [1, 0.9])
    const springY = useSpring(y, { stiffness: 100, damping: 30 })
    const springOpacity = useSpring(opacity, { stiffness: 100, damping: 30 })
    const springScale = useSpring(scale, { stiffness: 100, damping: 30 })

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            // @ts-ignore
            smooth: true,
            smoothTouch: false,
            touchMultiplier: 2,
        })

        function raf(time: number) {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }

        requestAnimationFrame(raf)

        return () => {
            lenis.destroy()
        }
    }, [])
    return (
        <div>
            <main className="flex-1 max-w-7xl mx-auto px-4 pt-20 sm:px-6 lg:px-8 w-full">
                {/* Hero Section - Keeping the same as requested */}
                <motion.section
                    className="mt-8 flex justify-center relative"
                    style={{
                        y: springY,
                        opacity: springOpacity,
                        scale: springScale,
                    }}
                >
                    <h1 className="text-[clamp(3rem,12vw,10rem)] font-black leading-none tracking-tighter text-white whitespace-nowrap">Fork That Job</h1>
                    <motion.div
                        className="absolute -z-10 w-[150%] h-[150%] rounded-full opacity-20 blur-3xl"
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 5, 0],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatType: "reverse",
                        }}
                    />
                </motion.section>

                {/* Scroll indicator */}
                <motion.div
                    className="flex justify-center mt-8 mb-12"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                >
                    <motion.div
                        className="flex flex-col items-center"
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    >
                        <p className="text-neutral-500 text-sm mb-2">Scroll to explore</p>
                        <ChevronDown className="h-6 w-6 text-[#E23E6B]/30" />
                    </motion.div>
                </motion.div>

                {/* Episode Cards */}
                <motion.div
                    ref={episodesRef}
                    initial={{ opacity: 0, y: 50 }}
                    animate={isEpisodesInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8 }}
                    className="mt-8 sm:mt-12"
                >
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {episodes.map((episode, idx) => (
                            <EpisodeCard key={idx} {...episode} isInView={isEpisodesInView} />
                        ))}
                    </div>

                </motion.div>
            </main>

        </div>
    )
}

export default Hero