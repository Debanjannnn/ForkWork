"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, X, Send, Bot, User, ChevronUp, ChevronDown, Sparkles, Zap, Star } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Poppins } from "next/font/google"
import { cn } from "@/lib/utils"

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
})

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

// Function to format markdown-like text
function formatMessageContent(content: string) {
  const formatted = content
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-white mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-white mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mb-4">$1</h1>')
    .replace(/━━+/g, '<hr class="border-white/20 my-3">')
    .replace(/\n/g, "<br>")

  return formatted
}

function FormattedMessage({ content }: { content: string }) {
  const formattedContent = formatMessageContent(content)

  return (
    <div
      className="whitespace-pre-wrap text-sm font-light leading-relaxed"
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  )
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "🚀 **Welcome to your Web3 Career Assistant!** 🚀\n\nI have **real-time access** to current opportunities across our platform! Here's what I can help you with:\n\n## 🎯 **Core Features:**\n✨ **Smart Job Matching** - AI-powered job recommendations based on your skills\n✨ **Real-time Opportunities** - Live updates on bounties, gigs, and positions  \n✨ **Career Analytics** - Track your progress and earnings across platforms\n✨ **Web3 Expertise** - Industry insights, trends, and professional guidance\n\n## 💼 **Available Services:**\n• **Current Job Opportunities** - Latest Web3 positions\n• **Active Bounties** - Earn rewards for completing tasks  \n• **Freelance Gigs** - Find project-based work\n• **Career Coaching** - Resume tips and interview preparation\n\n**💡 Pro Tip:** Use the quick action buttons below to instantly access specific opportunities and get personalized recommendations!\n\nWhat would you like to explore today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)
    setIsTyping(true)

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble connecting right now. Please try again later.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleQuickAction = (action: string) => {
    const quickMessages = {
      jobs: "Show me current job opportunities",
      bounties: "What bounties are currently available?",
      freelance: "Show me available freelance gigs",
      all: "Give me an overview of all current opportunities",
    }

    const message = quickMessages[action as keyof typeof quickMessages]

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setIsTyping(true)

    fetch("/api/chatbot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to get response")
        }
        return response.json()
      })
      .then((data) => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      })
      .catch((error) => {
        console.error("Error sending message:", error)
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "Sorry, I'm having trouble connecting right now. Please try again later.",
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      })
      .finally(() => {
        setIsLoading(false)
        setIsTyping(false)
      })
  }

  const toggleChat = () => {
    if (isOpen) {
      setIsMinimized(!isMinimized)
    } else {
      setIsOpen(true)
      setIsMinimized(false)
    }
  }

  const closeChat = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", poppins.className)}>
      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#E23E6B]/40 rounded-full"
            animate={{
              x: [0, Math.random() * 120 - 60],
              y: [0, Math.random() * 120 - 60],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
            style={{
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
            }}
          />
        ))}
      </div>

      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <motion.button
              onClick={toggleChat}
              className="relative h-16 w-16 rounded-3xl bg-gradient-to-r from-[#E23E6B] to-[#cc4368] hover:from-[#cc4368] hover:to-[#E23E6B] shadow-2xl backdrop-blur-md border border-white/20 flex items-center justify-center group transition-all duration-300 overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Enhanced animated background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent"
                animate={{
                  x: [-100, 100],
                  opacity: [0, 0.3, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />

              {/* Multiple pulsing rings */}
              <motion.div
                className="absolute inset-0 rounded-3xl border-2 border-[#E23E6B]/30"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0, 0.3],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-3xl border border-white/20"
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              />

              <MessageCircle className="h-7 w-7 text-white group-hover:scale-110 transition-transform duration-300 relative z-10" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
              height: isMinimized ? 80 : 600,
            }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute bottom-0 right-0"
          >
            <Card className="w-96 h-[600px] flex flex-col bg-black/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden relative">
              {/* Enhanced animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#E23E6B]/8 via-transparent to-purple-500/8 opacity-60" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E23E6B]/5 to-transparent"
                animate={{
                  x: [-200, 200],
                  opacity: [0, 0.3, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />

              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/20 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />

                {/* Enhanced animated sparkles */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white/80 rounded-full"
                    animate={{
                      x: [0, Math.random() * 250],
                      y: [0, Math.random() * 60],
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                    }}
                    transition={{
                      duration: 3.5,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: i * 0.7,
                      ease: "easeInOut",
                    }}
                  />
                ))}

                <div className="flex items-center gap-3 relative z-10">
                  <motion.div
                    className="w-12 h-12 bg-white/25 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/40 relative overflow-hidden"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />
                    <Bot className="h-6 w-6 text-white relative z-10" />
                    <motion.div
                      className="absolute inset-0 bg-white/20 rounded-2xl"
                      animate={{
                        opacity: [0, 0.4, 0],
                        scale: [0.8, 1.1, 0.8],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    />
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-thin text-xl text-white">Web3 Assistant</span>
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      >
                        <Sparkles className="h-4 w-4 text-white/90" />
                      </motion.div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/90 font-light">
                      {isTyping ? "Analyzing opportunities with AI" : "Ready to assist"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 relative z-10">
                  <motion.button
                    onClick={toggleChat}
                    className="h-10 w-10 rounded-xl bg-white/25 backdrop-blur-sm border border-white/40 flex items-center justify-center text-white hover:bg-white/35 transition-all duration-300"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isMinimized ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </motion.button>
                  <motion.button
                    onClick={closeChat}
                    className="h-10 w-10 rounded-xl bg-white/25 backdrop-blur-sm border border-white/40 flex items-center justify-center text-white hover:bg-white/35 transition-all duration-300"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              {/* Messages */}
              {!isMinimized && (
                <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent relative">
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <motion.div
                          className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl flex items-center justify-center border border-white/30 relative overflow-hidden shadow-lg"
                          whileHover={{ scale: 1.1, rotate: 8 }}
                        >
                          <div className="absolute inset-0 bg-white/15 rounded-2xl" />
                          <Bot className="h-5 w-5 text-white relative z-10" />
                        </motion.div>
                      )}
                      <motion.div
                        className={`max-w-[75%] p-4 rounded-3xl backdrop-blur-md border relative overflow-hidden shadow-lg ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-[#E23E6B] to-[#cc4368] text-white border-white/30"
                            : "bg-white/12 text-white border-white/25"
                        }`}
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ duration: 0.2 }}
                      >
                        {message.role === "assistant" && (
                          <div className="absolute inset-0 bg-gradient-to-br from-white/8 to-transparent" />
                        )}

                        <div className="relative z-10">
                          <FormattedMessage content={message.content} />
                          <div
                            className={`text-xs mt-3 flex items-center gap-2 ${message.role === "user" ? "text-white/80" : "text-gray-300"}`}
                          >
                            <Star className="h-3 w-3" />
                            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>

                          {/* Enhanced Quick action buttons */}
                          {message.id === "1" && (
                            <motion.div
                              className="mt-6 space-y-4"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5, duration: 0.4 }}
                            >
                              <div className="flex items-center gap-2 text-xs text-gray-300 mb-4 font-medium">
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                                >
                                  <Zap className="h-4 w-4 text-[#E23E6B]" />
                                </motion.div>
                                Quick Actions
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <motion.button
                                  onClick={() => handleQuickAction("jobs")}
                                  className="group px-4 py-3 bg-gradient-to-r from-blue-500/25 to-blue-600/25 hover:from-blue-500/35 hover:to-blue-600/35 border border-blue-400/40 rounded-2xl text-xs text-white transition-all duration-300 backdrop-blur-sm relative overflow-hidden shadow-lg"
                                  whileHover={{ scale: 1.05, y: -3 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  <div className="relative z-10 flex items-center gap-2">
                                    <span className="text-lg">📋</span>
                                    <span className="font-medium">Jobs</span>
                                  </div>
                                </motion.button>
                                <motion.button
                                  onClick={() => handleQuickAction("bounties")}
                                  className="group px-4 py-3 bg-gradient-to-r from-yellow-500/25 to-orange-500/25 hover:from-yellow-500/35 hover:to-orange-500/35 border border-yellow-400/40 rounded-2xl text-xs text-white transition-all duration-300 backdrop-blur-sm relative overflow-hidden shadow-lg"
                                  whileHover={{ scale: 1.05, y: -3 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  <div className="relative z-10 flex items-center gap-2">
                                    <span className="text-lg">🏆</span>
                                    <span className="font-medium">Bounties</span>
                                  </div>
                                </motion.button>
                                <motion.button
                                  onClick={() => handleQuickAction("freelance")}
                                  className="group px-4 py-3 bg-gradient-to-r from-purple-500/25 to-purple-600/25 hover:from-purple-500/35 hover:to-purple-600/35 border border-purple-400/40 rounded-2xl text-xs text-white transition-all duration-300 backdrop-blur-sm relative overflow-hidden shadow-lg"
                                  whileHover={{ scale: 1.05, y: -3 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  <div className="relative z-10 flex items-center gap-2">
                                    <span className="text-lg">💼</span>
                                    <span className="font-medium">Freelance</span>
                                  </div>
                                </motion.button>
                                <motion.button
                                  onClick={() => handleQuickAction("all")}
                                  className="group px-4 py-3 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] hover:from-[#cc4368] hover:to-[#E23E6B] border border-white/30 rounded-2xl text-xs text-white transition-all duration-300 shadow-lg relative overflow-hidden"
                                  whileHover={{ scale: 1.05, y: -3 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <div className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  <div className="relative z-10 flex items-center gap-2">
                                    <span className="text-lg">🚀</span>
                                    <span className="font-medium">All</span>
                                  </div>
                                </motion.button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                      {message.role === "user" && (
                        <motion.div
                          className="flex-shrink-0 w-10 h-10 bg-white/25 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 relative overflow-hidden shadow-lg"
                          whileHover={{ scale: 1.1, rotate: -8 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />
                          <User className="h-5 w-5 text-white relative z-10" />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4 justify-start"
                    >
                      <motion.div
                        className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-[#E23E6B] to-[#cc4368] rounded-2xl flex items-center justify-center border border-white/30 shadow-lg"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      >
                        <Bot className="h-5 w-5 text-white" />
                      </motion.div>
                      <div className="bg-white/12 backdrop-blur-md p-4 rounded-3xl border border-white/25 relative overflow-hidden shadow-lg">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#E23E6B]/10 to-transparent" />
                        <div className="flex items-center space-x-3 relative z-10">
                          <div className="text-sm text-white/90">Analyzing opportunities with AI</div>
                          <div className="flex space-x-1">
                            <motion.div
                              className="w-2 h-2 bg-[#E23E6B] rounded-full"
                              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0 }}
                            />
                            <motion.div
                              className="w-2 h-2 bg-[#E23E6B] rounded-full"
                              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
                            />
                            <motion.div
                              className="w-2 h-2 bg-[#E23E6B] rounded-full"
                              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Enhanced Input */}
              {!isMinimized && (
                <motion.div
                  className="p-5 border-t border-white/20 relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="flex gap-4 relative z-10">
                    <div className="flex-1 relative">
                      <Textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about jobs, bounties, freelance gigs... ✨"
                        className="min-h-[48px] max-h-24 resize-none bg-white/12 backdrop-blur-md border-white/25 text-white placeholder:text-gray-300 rounded-2xl focus:border-[#E23E6B] focus:ring-2 focus:ring-[#E23E6B]/50 font-light transition-all duration-300 pr-12 shadow-lg"
                        rows={1}
                      />
                      <motion.div
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                      >
                        <Sparkles className="h-4 w-4 text-[#E23E6B]/70" />
                      </motion.div>
                    </div>
                    <motion.button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      className="h-[48px] w-[48px] rounded-2xl bg-gradient-to-r from-[#E23E6B] to-[#cc4368] hover:from-[#cc4368] hover:to-[#E23E6B] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border border-white/30 backdrop-blur-md transition-all duration-300 relative overflow-hidden group shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <Send className="h-6 w-6 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
