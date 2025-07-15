import React from 'react'

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 text-sm text-gray-400 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          <p>All systems operational</p>
        </div>
        <div>
          <p>©2025 FORK WORK. All rights reserved.</p>
        </div>
      </div>
  )
}

export default Footer