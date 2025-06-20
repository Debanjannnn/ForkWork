"use client"

import Footer from "@/components/Footer";
import HowItWorks from "@/components/Howitworks";
import { Features } from "@/components/ui/Features";
import { FloatingNav } from "@/components/ui/floating-navbar";
import Hero from "@/components/ui/Hero";
import Lenis from "lenis";
import { Home as IconHome, User as IconUser, MessageSquare as IconMessage, ChevronDown, Play } from "lucide-react";
import { useEffect, useRef } from "react";

export default function Home() {

  const navItems = [
    {
      name: "Home",
      link: "/",
      icon: <IconHome className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
    {
      name: "About",
      link: "/about",
      icon: <IconUser className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
    {
      name: "Contact",
      link: "/contact",
      icon: (
        <IconMessage className="h-4 w-4 text-neutral-500 dark:text-white" />
      ),
    },
  ];
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


  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen  bg-black text-white overflow-x-hidden">

      <div className="absolute top-0 left-0 right-0 z-10 py-4">
        <FloatingNav navItems={navItems} />
      </div>
      <Hero/>
      <Features/>
      <HowItWorks/>
      <Footer/>

    </div>
  );
}