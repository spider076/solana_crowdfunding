'use client'

import { getCrowdfundingProgram, getCrowdfundingProgramId } from '@project/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Cluster,  PublicKey, SystemProgram } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'
import { BN } from 'bn.js'
import { ICampaign, ICreateCampaign } from './types'
import { ASSOCIATED_TOKEN_PROGRAM_ID,  getAssociatedTokenAddress,  TOKEN_PROGRAM_ID } from '@solana/spl-token'

export function useCrowdfundingProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getCrowdfundingProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getCrowdfundingProgram(provider, programId), [provider, programId])



  const createCampaign = useMutation<ICampaign, Error, ICreateCampaign>({
    mutationKey: ['campaign', 'create', { cluster }],
    mutationFn: async({wallet,startTime,deadline,mint}) =>{
      const [campaignPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("campaign"),
          wallet.publicKey!.toBuffer(),
          Buffer.from("Plant a Billion trees")
        ],
        program.programId
      );
        const vault= await getAssociatedTokenAddress(mint,campaignPda,true)
          const tx = await program.methods.createCampaign("Plant a Billion trees",new BN(startTime),new BN(deadline))
                      .accounts({
                        campaign:campaignPda,
                        signer:wallet.publicKey!,
                        owner:wallet.publicKey!,
                        mint,
                        vault,
                        systemProgram: SystemProgram.programId,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                      } as any)
                      .rpc();
            const latestBlockHash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
              signature: tx,
              blockhash: latestBlockHash.blockhash,
              lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            });
            const createdCampaign = await program.account.campaignState.fetch(campaignPda)
            return createdCampaign
      
        },
    onSuccess: (data) => {
      transactionToast(data.title)
      return data;
    },
    onError: () => {
      toast.error('Failed to create campaign')
      return "Failed to fetch/create Campaign"
    },
})

  return {
    program,
    programId,
    createCampaign
  }
}

export function useExistingAccount() {
  const { cluster } = useCluster();
  const { publicKey } = useWallet();
  const transactionToast = useTransactionToast();
  const { program } = useCrowdfundingProgram();
  const campaignCreator = process.env.NEXT_PUBLIC_CAMPAIGN_CREATOR_WALLET_KEY;

  const toastShownRef = useRef(false);

  useEffect(() => {
    if (!publicKey && !toastShownRef.current) {
      toast("Wallet not connected!");
      toastShownRef.current = true; 
    }
  }, [publicKey]);

  const campaignPda = useMemo(() => {
    if (!publicKey) return null;
    return PublicKey.findProgramAddressSync(
      [Buffer.from("campaign"), new PublicKey(campaignCreator!).toBuffer(), Buffer.from("Plant a Billion trees")],
      program.programId
    )[0];
  }, [publicKey, program.programId]);

  const campaignAccountQuery = useQuery({
    queryKey: ["crowdfunding", "fetch", { cluster, campaignPda }],
    queryFn: async () => {
      if (!campaignPda) throw new Error("No campaign PDA");
      return await program.account.campaignState.fetch(campaignPda);
    },
    enabled: !!campaignPda, 
    refetchOnWindowFocus:false
  });

  return { campaignAccountQuery };
}