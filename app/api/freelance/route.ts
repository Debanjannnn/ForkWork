import { NextResponse } from 'next/server';
import { createPublicClient, http, getContract } from 'viem';
import { mainnet } from 'viem/chains';
import { FREELANCE_ABI, FREELANCE_CONTRACT_ADDRESS } from '@/lib/contracts';
import { getFromPinata } from '@/lib/pinata';

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export async function GET() {
  try {
    const contract = getContract({
      address: FREELANCE_CONTRACT_ADDRESS,
      abi: FREELANCE_ABI,
      //@ts-ignore
      publicClient,
    });

    // Get the gig count to determine how many gigs exist
    //@ts-ignore
    const gigCount = await contract.read.gigCount();
    const totalGigs = Number(gigCount);

    if (totalGigs <= 0) {
      return NextResponse.json([]);
    }

    // Fetch all gigs
    const gigs = [];
    for (let i = 0; i < totalGigs; i++) {
      try {
        //@ts-ignore
        const gig = await contract.read.getGigDetails([BigInt(i)]);
        
        // Only include active gigs (not completed)
        if (!gig.isCompleted) {
          // Try to fetch metadata from IPFS
          let metadata = null;
          try {
            metadata = await getFromPinata(gig.detailsUri);
          } catch (metadataError) {
            console.error(`Error fetching metadata for gig ${i}:`, metadataError);
          }

          gigs.push({
            id: i,
            title: metadata?.title || gig.title,
            description: metadata?.description || gig.description,
            requirements: metadata?.requirements || [],
            deliverables: metadata?.deliverables || [],
            skills: metadata?.skills || [],
            budget: Number(gig.usdtAmount),
            deadline: Number(gig.deadline),
            proposalDeadline: Number(gig.proposalDeadline),
            isCompleted: gig.isCompleted,
            isApproved: gig.isApproved,
            client: gig.client,
            selectedFreelancer: gig.selectedFreelancer,
            createdAt: Number(gig.createdAt),
            metadataUri: gig.detailsUri,
          });
        }
      } catch (error) {
        console.error(`Error fetching gig ${i}:`, error);
        // Continue with other gigs
      }
    }

    return NextResponse.json(gigs);
  } catch (error) {
    console.error('Error in freelance API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch freelance gigs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 