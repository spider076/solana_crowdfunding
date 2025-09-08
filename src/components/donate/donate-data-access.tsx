import { useConnection, WalletContextState } from "@solana/wallet-adapter-react";
import { useTransactionToast } from "../ui/ui-layout";
import { useMutation } from "@tanstack/react-query";
import {  Cluster,  PublicKey, SystemProgram } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID,  TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useCluster } from "../cluster/cluster-data-access";
import { useAnchorProvider } from "../solana/solana-provider";
import { useMemo } from "react";
import { getCrowdfundingProgram, getCrowdfundingProgramId } from "@project/anchor";
import { ICampaign } from "../crowdfunding/types";
import { BN } from "bn.js";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export function useDonation(){
  const {cluster}=useCluster();
  const provider = useAnchorProvider();
  const transactionToast = useTransactionToast();
  const router = useRouter()

  const programId = useMemo(()=>getCrowdfundingProgramId(cluster.network as Cluster),[cluster]);
  const program = useMemo(()=>getCrowdfundingProgram(provider,programId),[provider,programId]);

  const useDonate = useMutation<string,Error,{wallet:WalletContextState,amount:number,campaign:ICampaign,donorAta:PublicKey}>({
    mutationKey:["campaign","donate",{cluster}],
    mutationFn:async({wallet,amount,campaign,donorAta})=>{
      const [campaignPda]=PublicKey.findProgramAddressSync(
        [
          Buffer.from("campaign"),
          campaign.owner.toBuffer(),
          Buffer.from(campaign.title)
        ],
        program.programId
      );
      const [donorPda]=PublicKey.findProgramAddressSync(
        [
          Buffer.from("donor"),
          wallet.publicKey!.toBuffer(),
          campaignPda.toBuffer()
        ],
        program.programId
      );
      const tx = await program.methods.donateToCampaign(new BN(amount))
                                      .accounts({
                                        donorAcc:donorPda,
                                        signer:wallet.publicKey!,
                                        campaign:campaignPda,
                                        vault:campaign.vault,
                                        donorAta,
                                        systemProgram:SystemProgram.programId,
                                        tokenProgram:TOKEN_PROGRAM_ID,
                                        associatedTokenProgram:ASSOCIATED_TOKEN_PROGRAM_ID,
                                      } as any)
                                      .rpc()
      return tx
    },
    onSuccess:(signature)=>{
      transactionToast(signature);
      toast.success("Donation Successfull !");
      router.push('/crowdfunding')
    }
  })
  return{
    useDonate
  }
}
