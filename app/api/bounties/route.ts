import { NextResponse } from 'next/server';
import { createPublicClient, http, getContract } from 'viem';
import { mainnet } from 'viem/chains';
import { BOUNTY_ABI, BOUNTY_CONTRACT_ADDRESS } from '@/lib/contracts';

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export async function GET() {
  try {
    const contract = getContract({
      address: BOUNTY_CONTRACT_ADDRESS,
      abi: BOUNTY_ABI,
      //@ts-ignore
      publicClient,
    });

    // Get the next bounty ID to determine how many bounties exist
    //@ts-ignore
    const nextBountyId = await contract.read.nextBountyId();
    const bountyCount = Number(nextBountyId) - 1;

    if (bountyCount <= 0) {
      return NextResponse.json([]);
    }

    // Fetch all bounties
    const bounties = [];
    for (let i = 1; i <= bountyCount; i++) {
      try {
        //@ts-ignore
        const bounty = await contract.read.getBounty([BigInt(i)]);
        
        // Only include active/open bounties
        if (bounty.status === 0) { // 0 = Open status
          bounties.push({
            id: i,
            name: bounty.name,
            description: bounty.description,
            category: bounty.category,
            deadline: Number(bounty.deadline),
            totalReward: Number(bounty.totalReward),
            status: bounty.status,
            submissionCount: Number(bounty.submissionCount),
            createdAt: Number(bounty.createdAt),
            creator: bounty.creator,
          });
        }
      } catch (error) {
        console.error(`Error fetching bounty ${i}:`, error);
        // Continue with other bounties
      }
    }

    return NextResponse.json(bounties);
  } catch (error) {
    console.error('Error in bounties API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bounties', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 