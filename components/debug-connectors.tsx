"use client"

import { useConnect } from "wagmi"

export function DebugConnectors() {
  const { connectors } = useConnect()

  return (
    <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
      <h3 className="text-white font-bold mb-2">Available Connectors:</h3>
      <div className="space-y-2">
        {connectors.map((connector) => (
          <div key={connector.uid} className="text-sm text-gray-300">
            <div>ID: {connector.id}</div>
            <div>Name: {connector.name}</div>
            <div>Ready: {connector.ready ? "Yes" : "No"}</div>
            <div>UID: {connector.uid}</div>
            <hr className="border-gray-600 my-1" />
          </div>
        ))}
      </div>
    </div>
  )
} 