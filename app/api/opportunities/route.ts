import { NextResponse } from 'next/server';
import { createPublicClient, http, getContract } from 'viem';
import { mainnet } from 'viem/chains';
import { BOUNTY_ABI, BOUNTY_CONTRACT_ADDRESS, FREELANCE_ABI, FREELANCE_CONTRACT_ADDRESS } from '@/lib/contracts';
import { getFromPinata } from '@/lib/pinata';

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export async function GET() {
  try {
    console.log('Fetching opportunities data...');
    
    const [jobs, bounties, freelanceGigs] = await Promise.allSettled([
      fetchJobs(),
      fetchBounties(),
      fetchFreelanceGigs(),
    ]);

    const opportunities = {
      jobs: jobs.status === 'fulfilled' ? jobs.value : [],
      bounties: bounties.status === 'fulfilled' ? bounties.value : [],
      freelanceGigs: freelanceGigs.status === 'fulfilled' ? freelanceGigs.value : [],
    };

    console.log(`Opportunities fetched: ${opportunities.jobs.length} jobs, ${opportunities.bounties.length} bounties, ${opportunities.freelanceGigs.length} freelance gigs`);

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('Error in opportunities API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function fetchJobs() {
  try {
    const token = process.env.token;
    
    if (!token) {
      console.error('API token not configured');
      return [];
    }

    const response = await fetch(
      `https://web3.career/api/v1?token=${token}`,
      { 
        next: { revalidate: 3600 }, // Cache for 1 hour
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      console.error(`Jobs API request failed with status: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? (data[2] || []) : [];
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
}

async function fetchBounties() {
  try {
    const contract = getContract({
      address: BOUNTY_CONTRACT_ADDRESS,
      abi: BOUNTY_ABI,
      client: publicClient,
    });

    const nextBountyId = await contract.read.nextBountyId();
    const bountyCount = Number(nextBountyId) - 1;

    if (bountyCount <= 0) {
      return [];
    }

    const bounties = [];
    for (let i = 1; i <= bountyCount; i++) {
      try {
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
            type: 'bounty',
          });
        }
      } catch (error) {
        console.error(`Error fetching bounty ${i}:`, error);
      }
    }

    return bounties;
  } catch (error) {
    console.error('Error fetching bounties:', error);
    return [];
  }
}

async function fetchFreelanceGigs() {
  try {
    const contract = getContract({
      address: FREELANCE_CONTRACT_ADDRESS,
      abi: FREELANCE_ABI,
      client: publicClient,
    });

    const gigCount = await contract.read.gigCount();
    const totalGigs = Number(gigCount);

    if (totalGigs <= 0) {
      return [];
    }

    const gigs = [];
    for (let i = 0; i < totalGigs; i++) {
      try {
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
            type: 'freelance',
          });
        }
      } catch (error) {
        console.error(`Error fetching gig ${i}:`, error);
      }
    }

    return gigs;
  } catch (error) {
    console.error('Error fetching freelance gigs:', error);
    return [];
  }
} 