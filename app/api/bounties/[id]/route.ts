import { NextResponse } from 'next/server';
import { createPublicClient, http, getContract } from 'viem';
import { mainnet } from 'viem/chains';
import { BOUNTY_ABI, BOUNTY_CONTRACT_ADDRESS } from '@/lib/contracts';

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
    const bountyId = parseInt(id);
    
    if (isNaN(bountyId) || bountyId <= 0) {
      return NextResponse.json(
        { error: 'Invalid bounty ID' },
        { status: 400 }
      );
    }

    const contract = getContract({
      address: BOUNTY_CONTRACT_ADDRESS,
      abi: BOUNTY_ABI,
      //@ts-ignore
      publicClient,
    });

    //@ts-ignore
    const bounty = await contract.read.getBounty([BigInt(bountyId)]);
    
    //@ts-ignore
    const winners = await contract.read.getBountyWinners([BigInt(bountyId)]);

    return NextResponse.json({
      id: bountyId,
      name: bounty.name,
      description: bounty.description,
      category: bounty.category,
      deadline: Number(bounty.deadline),
      totalReward: Number(bounty.totalReward),
      status: bounty.status,
      submissionCount: Number(bounty.submissionCount),
      createdAt: Number(bounty.createdAt),
      creator: bounty.creator,
      winners: winners.map((winner: any) => ({
        recipient: winner.recipient,
        prize: Number(winner.prize),
      })),
    });
  } catch (error) {
    console.error('Error in bounty API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bounty', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 