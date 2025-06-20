import { http, createConfig } from "wagmi"
import { injected, metaMask, walletConnect } from "wagmi/connectors"

// EDU Chain Testnet configuration
const eduChainTestnet = {
  id: 656476,
  name: "EDU Chain Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "EDU",
    symbol: "EDU",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.open-campus-codex.gelato.digital"],
    },
  },
  blockExplorers: {
    default: {
      name: "EDU Chain Explorer",
      url: "https://opencampus-codex.blockscout.com",
    },
  },
  testnet: true,
} as const

export const config = createConfig({
  chains: [eduChainTestnet],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId: "your-project-id", // Replace with your WalletConnect project ID
    }),
  ],
  transports: {
    [eduChainTestnet.id]: http(),
  },
})
