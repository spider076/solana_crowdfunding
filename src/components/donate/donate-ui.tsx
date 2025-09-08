'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useConnection, WalletContextState } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'
import { useGetTokenAccounts } from '../account/account-data-access'
import "react-perfect-scrollbar/dist/css/styles.css";
import { useQueryClient } from '@tanstack/react-query'
import { ICampaign } from '../crowdfunding/types'
import { useDonation } from './donate-data-access'
import Link from 'next/link'

export function Donate({wallet,campaign}:{wallet:WalletContextState,campaign:ICampaign}){
  const {useDonate}=useDonation()
  const query = useGetTokenAccounts({address:wallet.publicKey!})
  const {connection}=useConnection();
  const queryClient = useQueryClient();
  const [DonorAddress,setDonorAddress]=useState<string>(wallet.publicKey!.toString());
  const [tokenAmount,setTokenAmount]=useState<number>(0);
  const {tokenList,campaignMintAccount}=useMemo(()=>{
    return {
            tokenList:query.data,
            campaignMintAccount:query.data?.find(acc=>acc.account.data.parsed.info.mint==campaign.mint)
    }
  },[wallet,query.data,campaign.mint])
  const availableTokenAmount:number = useMemo(()=>Number(campaignMintAccount?.account.data.parsed.info.tokenAmount.uiAmount),[campaignMintAccount])
  const handleCreateMint=async(e:FormEvent<HTMLFormElement>)=>{

    e.preventDefault();
    if(campaignMintAccount?.pubkey && (!DonorAddress || tokenAmount<1)){
      toast("Fill all the detail !")
    }
  try {
    campaignMintAccount?.pubkey
    ?await useDonate.mutateAsync({wallet,amount:(tokenAmount*10**9),campaign,donorAta:campaignMintAccount.pubkey})
    :toast("Dont have campaign token in your account !, Request Airdrop")
    setTokenAmount(0)
    queryClient.invalidateQueries({
      queryKey: ['get-token-accounts', { endpoint: connection.rpcEndpoint, address: wallet.publicKey }],
    });
  } catch (error) {
    console.log("Error : ",error)
  }
}
  return(
    <div className="md:w-[600px] mx-auto bg-gray-900 p-6 rounded-2xl shadow-lg">
  <h2 className="text-xl font-semibold text-white mb-12 text-center">
    Donatation Request
  </h2>
  <form onSubmit={(e)=>handleCreateMint(e)} className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-300">Donate to campaign</label>
      <input
      disabled
        type="text"
        value={campaign.title}
        placeholder="Enter recipient wallet address"
        className="w-full px-4 py-2 mt-1 bg-gray-700 border border-gray-600 text-gray-400 rounded-lg cursor-not-allowed"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-300">campaign vault</label>
      <input
      disabled
        type="text"
        value={campaign.vault.toString()}
        placeholder="Enter recipient wallet address"
        className="w-full px-4 py-2 mt-1 bg-gray-700 border border-gray-600 text-gray-400 rounded-lg cursor-not-allowed"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-300">Your Wallet</label>
      <input
      disabled
        type="text"
        value={DonorAddress}
        onChange={(e) => setDonorAddress(e.target.value)}
        placeholder="Enter recipient wallet address"
        className="w-full px-4 py-2 mt-1 bg-gray-700 border border-gray-600 text-gray-400 rounded-lg cursor-not-allowed"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-300">Mint</label>
      <input
        type="text"
        value={`Mint - ${campaign.mint.toString()}`}
        disabled
        className="w-full px-4 py-2 mt-1 bg-gray-700 border border-gray-600 text-gray-400 rounded-lg cursor-not-allowed"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-300 flex justify-between">
        <span>Donation Amount</span>
        <span className='flex gap-5'>
          {
            query.isPending
            ?<div className='text-xs loading loading-spinner'></div>
            :<>
              <span className='pe-2 md:pe-10'>Token Balance: <span className='text-green-600 font-bold'>{availableTokenAmount?availableTokenAmount.toFixed(2):0}</span></span>
              {!availableTokenAmount && <Link href="mint" className='px-2 py-0.5 bg-green-800 rounded-lg text-xs transition-all hover:bg-green-950'>Request Airdrop</Link>}
            </>
          }
        </span>
      </label>
      <input
        type="number"
        value={tokenAmount}
        max={availableTokenAmount}
        min={0}
        onChange={(e) => setTokenAmount(parseInt(e.target.value))}
        placeholder="Enter token amount"
        className="w-full px-4 py-2 mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      />
    </div>

    <button
      type="submit"
      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 h-12"
    >
      { 
        useDonate.isPending 
        ?<div className='loading loading-spinner'></div>
        :"Donate"
      }
    </button>
  </form>
</div>
  )
}
