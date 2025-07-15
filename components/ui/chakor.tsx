"use client"
import { motion, useScroll, useSpring, useTransform } from "motion/react";

export default function FeaturesSection() {

    const { scrollY } = useScroll()
    const y = useTransform(scrollY, [0, 300], [0, -50])
    const opacity = useTransform(scrollY, [0, 300], [1, 0.2])
    const scale = useTransform(scrollY, [0, 300], [1, 0.9])
    const springY = useSpring(y, { stiffness: 100, damping: 30 })
    const springOpacity = useSpring(opacity, { stiffness: 100, damping: 30 })
    const springScale = useSpring(scale, { stiffness: 100, damping: 30 })


  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
                <motion.section
                    className="mt-8 flex justify-center relative"
                    style={{
                        y: springY,
                        opacity: springOpacity,
                        scale: springScale,
                    }}
                >
                    <h1 className="text-[clamp(3rem,15vw,12rem)] font-black leading-none tracking-tighter text-white">Features</h1>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Powerful features to simplify your
            web building experience
          </h2>
                    <motion.div
                        className="absolute -z-10 w-[150%] h-[150%] bg-blue-100 rounded-full opacity-20 blur-3xl"
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

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* AI-Powered Design Assistance */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="mb-6">
              <div className="bg-gray-50 rounded-xl p-6 mb-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">Choose one to insert</div>
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="w-full h-8 bg-gray-100 rounded mb-2"></div>
                      <div className="w-3/4 h-2 bg-gray-100 rounded"></div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="w-full h-8 bg-gray-100 rounded mb-2"></div>
                      <div className="w-3/4 h-2 bg-gray-100 rounded"></div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="w-full h-8 bg-gray-100 rounded mb-2"></div>
                      <div className="w-3/4 h-2 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-gray-600">What do you want to create?</div>
                    <div className="bg-blue-500 text-white text-xs px-3 py-1 rounded-md">Generate</div>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered Design Assistance</h3>
            <p className="text-gray-600 leading-relaxed">
              Get personalized design recommendations with AI-powered tools that helping you create a polished,
              professional website effortlessly.
            </p>
          </div>

          {/* Customizable Templates */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="mb-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <div className="text-xs text-gray-500">Templates</div>
                  </div>
                  <div className="space-y-3">
                    <div className="w-full h-3 bg-gray-200 rounded"></div>
                    <div className="w-4/5 h-3 bg-gray-200 rounded"></div>
                    <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
                  </div>
                  <div className="bg-blue-500 w-16 h-6 rounded"></div>
                </div>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Customizable Templates</h3>
            <p className="text-gray-600 leading-relaxed">
              Choose from a wide range of professionally designed templates. Easily customize fonts, colors, and layouts
              to reflect your brand's.
            </p>
          </div>
        </div>

        {/* Bottom Row - 3 Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* SEO Tools Built-In */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="mb-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-600">Performance</div>
                    <div className="text-xs text-green-600">+25%</div>
                  </div>
                  <div className="flex items-end space-x-1 h-16">
                    <div className="bg-blue-300 w-3 h-8 rounded-sm"></div>
                    <div className="bg-blue-400 w-3 h-6 rounded-sm"></div>
                    <div className="bg-blue-500 w-3 h-12 rounded-sm"></div>
                    <div className="bg-blue-400 w-3 h-10 rounded-sm"></div>
                    <div className="bg-blue-300 w-3 h-7 rounded-sm"></div>
                    <div className="bg-blue-500 w-3 h-14 rounded-sm"></div>
                    <div className="bg-blue-400 w-3 h-9 rounded-sm"></div>
                    <div className="bg-blue-300 w-3 h-11 rounded-sm"></div>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">SEO Tools Built-In</h3>
            <p className="text-gray-600 leading-relaxed">Boost your website's visibility with integrated SEO tools.</p>
          </div>

          {/* Seamless Integrations */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="mb-6">
              <div className="bg-gray-50 rounded-xl p-6 relative">
                <div className="flex items-center justify-center h-20">
                  <div className="absolute top-4 left-4 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <div className="absolute top-8 right-6 w-4 h-4 bg-orange-500 rounded"></div>
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-white rounded-full"></div>
                  </div>
                  <div className="absolute bottom-4 left-8 w-4 h-4 bg-blue-300 rounded-full"></div>
                  <div className="absolute bottom-6 right-4 w-5 h-5 bg-pink-300 rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Seamless Integrations</h3>
            <p className="text-gray-600 leading-relaxed">
              easily connect with your favorite apps and services for a website experience.
            </p>
          </div>

          {/* Responsive Design */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="mb-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <div className="space-y-1">
                      <div className="w-8 h-1 bg-gray-200 rounded"></div>
                      <div className="w-6 h-1 bg-gray-200 rounded"></div>
                      <div className="w-7 h-1 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
                    <div className="space-y-2">
                      <div className="w-12 h-1 bg-gray-200 rounded"></div>
                      <div className="w-10 h-1 bg-gray-200 rounded"></div>
                      <div className="bg-blue-500 w-8 h-2 rounded"></div>
                      <div className="w-6 h-1 bg-gray-200 rounded"></div>
                      <div className="bg-blue-500 w-4 h-1 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Responsive Design</h3>
            <p className="text-gray-600 leading-relaxed">Create websites that look stunning on any device.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
