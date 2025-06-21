import { NextResponse } from 'next/server';
import { createPublicClient, http, getContract } from 'viem';
import { mainnet } from 'viem/chains';
import { FREELANCE_ABI, FREELANCE_CONTRACT_ADDRESS } from '@/lib/contracts';

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const gigId = parseInt(id);
    
    if (isNaN(gigId) || gigId < 0) {
      return NextResponse.json(
        { error: 'Invalid gig ID' },
        { status: 400 }
      );
    }

    const contract = getContract({
      address: FREELANCE_CONTRACT_ADDRESS,
      abi: FREELANCE_ABI,
      client: publicClient,
    });

    //@ts-ignore
    const gig = await contract.read.getGigDetails([BigInt(gigId)]);

    return NextResponse.json({
      id: gigId,
      client: gig.client,
      title: gig.title,
      description: gig.description,
      detailsUri: gig.detailsUri,
      usdtAmount: Number(gig.usdtAmount),
      nativeStakeRequired: Number(gig.nativeStakeRequired),
      selectedFreelancer: gig.selectedFreelancer,
      isApproved: gig.isApproved,
      isFunded: gig.isFunded,
      isStakeDeposited: gig.isStakeDeposited,
      isCompleted: gig.isCompleted,
      deadline: Number(gig.deadline),
      proposalDeadline: Number(gig.proposalDeadline),
      stakingDeadline: Number(gig.stakingDeadline),
      createdAt: Number(gig.createdAt),
    });
  } catch (error) {
    console.error('Error in freelance gig API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gig', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 