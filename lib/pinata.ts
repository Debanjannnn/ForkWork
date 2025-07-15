const PINATA_API_KEY = "392b85cd0d7f24593d24"
const PINATA_SECRET_API_KEY = "602315db6f4ec0b9bf5a0313fbefc91c66ba365b4d1e60e3e1f7b522f4b3d3dc"
const PINATA_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0Njc2ZWUwMi0xNTIzLTRhMmMtOWQ5Ni0zMTJhYWY5YjlhNTciLCJlbWFpbCI6Im1hbm92bWFuZGFsQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiIzOTJiODVjZDBkN2YyNDU5M2QyNCIsInNjb3BlZEtleVNlY3JldCI6IjYwMjMxNWRiNmY0ZWMwYjliZjVhMDMxM2ZiZWZjOTFjNjZiYTM2NWI0ZDFlNjBlM2UxZjdiNTIyZjRiM2QzZGMiLCJleHAiOjE3ODE5NzUxODh9.rrMc3OcsIuLUVZxDw6CD05JiNkiDG3naa9UpuQzC4Vw"

export interface PinataMetadata {
  name: string
  description: string
  category?: number
  deadline?: number
  createdAt?: number
  title?: string
  requirements?: string[]
  deliverables?: string[]
  skills?: string[]
}

export async function uploadToPinata(metadata: PinataMetadata): Promise<string> {
  try {
    const data = JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: `gig-${metadata.name?.replace(/\s+/g, "-").toLowerCase() || metadata.title?.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`,
        keyvalues: {
          type: metadata.category !== undefined ? "bounty-metadata" : "gig-metadata",
          ...(metadata.category !== undefined && { category: metadata.category.toString() }),
          ...(metadata.deadline && { deadline: metadata.deadline.toString() }),
        },
      },
      pinataOptions: {
        cidVersion: 0,
      },
    })

    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`,
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
      body: data,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Pinata upload failed: ${errorData.error || response.statusText}`)
    }

    const result = await response.json()
    return `ipfs://${result.IpfsHash}`
  } catch (error) {
    console.error("Error uploading to Pinata:", error)
    throw error
  }
}

export async function getFromPinata(ipfsUri: string): Promise<PinataMetadata> {
  try {
    const cleanHash = ipfsUri.replace("ipfs://", "")

    // Try multiple IPFS gateways for better reliability
    const gateways = [
      `https://ipfs.io/ipfs/${cleanHash}`,
      `https://gateway.pinata.cloud/ipfs/${cleanHash}`,
      `https://cloudflare-ipfs.com/ipfs/${cleanHash}`,
    ]

    let lastError: Error | null = null

    for (const gateway of gateways) {
      try {
        const response = await fetch(gateway, {
          headers: {
            Accept: "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        return data
      } catch (error) {
        lastError = error as Error
        console.warn(`Failed to fetch from ${gateway}:`, error)
        continue
      }
    }

    throw lastError || new Error("All IPFS gateways failed")
  } catch (error) {
    console.error("Error fetching from IPFS:", error)
    throw error
  }
}
