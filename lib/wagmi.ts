import { http, createConfig } from "wagmi"
import { injected, metaMask, walletConnect } from "wagmi/connectors"
import { sepolia } from "wagmi/chains" // ✅ Import Sepolia from wagmi

// Get WalletConnect project ID from environment or use a fallback
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""

console.log("Wagmi config: WalletConnect project ID:", walletConnectProjectId ? "Set" : "Not set")

const connectors = [
  injected(),
  metaMask(),
  ...(walletConnectProjectId ? [
    walletConnect({
      projectId: walletConnectProjectId,
      metadata: {
        name: "H4B Platform",
        description: "H4B Freelance and Bounty Platform",
        url: typeof window !== 'undefined' ? window.location.origin : 'https://h4b.com',
        icons: ['https://h4b.com/icon.png']
      }
    })
  ] : []),
]

console.log("Wagmi config: Available connectors:", connectors.map(c => c.name))

export const config = createConfig({
  chains: [sepolia], // ✅ Set chain to Sepolia
  connectors,
  transports: {
    [sepolia.id]: http(), // ✅ Use default RPC for Sepolia from wagmi
  },
})
