import { http, createConfig } from "wagmi"
import { injected, metaMask, walletConnect } from "wagmi/connectors"
import { defineChain } from "viem"

// Define Core testnet 2 chain
const coreTestnet2 = defineChain({
  id: 1114,
  name: 'Core Testnet 2',
  network: 'core-testnet-2',
  nativeCurrency: {
    decimals: 18,
    name: 'tCORE',
    symbol: 'tCORE',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.test.btcs.network'],
    },
    public: {
      http: ['https://rpc.test.btcs.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Core Testnet Explorer',
      url: 'https://scan.test.btcs.network',
    },
  },
  testnet: true,
})

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
  chains: [coreTestnet2], // ✅ Set chain to Core testnet 2
  connectors,
  transports: {
    [coreTestnet2.id]: http(), // ✅ Use default RPC for Core testnet 2
  },
})