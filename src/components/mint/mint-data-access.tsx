import { useConnection, WalletContextState } from "@solana/wallet-adapter-react";
import { useTransactionToast } from "../ui/ui-layout";
import { useMutation } from "@tanstack/react-query";
import {  Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { createAssociatedTokenAccountInstruction, createInitializeMintInstruction, createMintToInstruction, createTransferInstruction, getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount, MINT_SIZE, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import toast from "react-hot-toast";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { useRouter } from "next/navigation";


export const useCreateMintAndTokenAccount = () => {
  const transactionToast = useTransactionToast();
  const {connection}=useConnection();
  const createMintAndTokenAccount = useMutation<
    { signature: string; mint: PublicKey; associatedTokenAccount: PublicKey },
    Error,
    {
      walletAdapter: WalletContextState;
      tokenAmount: number ;
    }
  >({
    mutationKey: ["mintToken", "create"],
    mutationFn: async ({  walletAdapter, tokenAmount}) => {
      if (!walletAdapter || !walletAdapter.connected) {
        throw new Error("Wallet not connected. Please connect your wallet.");
      }

      const walletPublicKey = walletAdapter.publicKey;
      if (!walletPublicKey) {
        throw new Error("Wallet public key not available.");
      }

      const mint = Keypair.generate();
      const associatedTokenAccount = await getAssociatedTokenAddress(
        mint.publicKey,
        walletPublicKey
      );

      const { blockhash } = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: walletPublicKey,
      });

      const mintRent = await connection.getMinimumBalanceForRentExemption(
        MINT_SIZE
      );
      const decimals = 9;
      const mintAmount = BigInt(tokenAmount) * BigInt(10 ** decimals);

      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: walletPublicKey,
          newAccountPubkey: mint.publicKey,
          lamports: mintRent,
          space: MINT_SIZE,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
          mint.publicKey,
          decimals,
          walletPublicKey,
          walletPublicKey
        ),
        createAssociatedTokenAccountInstruction(
          walletPublicKey,
          associatedTokenAccount,
          walletPublicKey,
          mint.publicKey
        ),
        createMintToInstruction(
          mint.publicKey,
          associatedTokenAccount,
          walletPublicKey,
          mintAmount
        )
      );

      transaction.partialSign(mint);

      if (!walletAdapter.signTransaction) {
        toast.error(
          "The wallet adapter does not support signing transactions."
        );
        throw new Error(
          "The wallet adapter does not support signing transactions."
        );
      }
      const signedTransaction = await walletAdapter.signTransaction(
        transaction
      );
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
        }
      );
      return { signature, mint: mint.publicKey, associatedTokenAccount };
    },
    onSuccess: async ({ signature }) => {
      transactionToast(signature);
    },
    onError: (error) => {
      toast.error(`Failed to create mint token: ${error.message}`);
    },
  });
  return { createMintAndTokenAccount };
};

export const useRequestCampaignMintAirdropProgram = ()=>{
  const {connection}=useConnection()
  const transactionToast = useTransactionToast()
  const router = useRouter()
  const ADMIN_WALLET_SECRET_BASE58 = process.env.NEXT_PUBLIC_ADMIN_WALLET_SECRET!;
const ADMIN_WALLET = Keypair.fromSecretKey(bs58.decode(ADMIN_WALLET_SECRET_BASE58));

  const useRequestCampaignMintAirdrop = useMutation<string,Error,{walletAdapter:WalletContextState,mint:PublicKey,tokenAmount:number }>({
    mutationKey:["mintAirdrop"],
    mutationFn:async({walletAdapter,mint,tokenAmount})=>{
      let [sourceAta,recepientAta]= await Promise.all([getAssociatedTokenAddress(mint,ADMIN_WALLET.publicKey),getAssociatedTokenAddress(mint,walletAdapter.publicKey!)])
      const recepientAtaAccInfo = await connection.getAccountInfo(recepientAta);
      
      if(recepientAtaAccInfo==null){
        const {blockhash}=await connection.getLatestBlockhash()
        const transaction = new Transaction({
          recentBlockhash:blockhash,
          feePayer:ADMIN_WALLET.publicKey
        })
        transaction.add(
          createAssociatedTokenAccountInstruction(
            ADMIN_WALLET.publicKey,
            recepientAta,
            walletAdapter.publicKey!,
            mint
          )
        );
       const tx = transaction.sign(ADMIN_WALLET);
       const signature = await connection.sendTransaction(transaction,[ADMIN_WALLET]);
       await connection.confirmTransaction(signature, 'confirmed');
        transactionToast(signature);
        
      }
      const {blockhash}=await connection.getLatestBlockhash()
      const transaction = new Transaction({
        recentBlockhash:blockhash,
        feePayer:ADMIN_WALLET.publicKey
      })

      const tokenTransferTx = createTransferInstruction(
        sourceAta,
        recepientAta,
        ADMIN_WALLET.publicKey,
        tokenAmount
      );
      transaction.add(tokenTransferTx)
      const tx = transaction.sign(ADMIN_WALLET)
      const signature = await connection.sendTransaction(transaction,[ADMIN_WALLET]);
      await connection.confirmTransaction(signature, 'confirmed');
      return signature;
    },
    onSuccess:(signature)=>{
      transactionToast(signature);
      router.push("/donate")

    }
  })

  return {useRequestCampaignMintAirdrop}

}