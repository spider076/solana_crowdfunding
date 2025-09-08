'use client'

import { PublicKey } from '@solana/web3.js'
import { FormEvent,  useMemo, useState } from 'react'
import { useConnection, WalletContextState } from '@solana/wallet-adapter-react'
import {   useRequestCampaignMintAirdropProgram } from './mint-data-access'
import toast from 'react-hot-toast'
import { useGetTokenAccounts } from '../account/account-data-access'
import { ExplorerLink } from '../cluster/cluster-ui'
import PerfectScrollbar from "react-perfect-scrollbar";
import "react-perfect-scrollbar/dist/css/styles.css";
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'

export function MintAirdrop({wallet,mint}:{wallet:WalletContextState,mint:PublicKey}){
  const {useRequestCampaignMintAirdrop}=useRequestCampaignMintAirdropProgram();
  const [recepientAddress,setRecepientAddress]=useState<string>(wallet.publicKey!.toString());
  const [tokenAmount,setTokenAmount]=useState<number>(0);
  const handleCreateMint=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    if(!recepientAddress || tokenAmount<1){
      toast("Fill all the detail !")
    }
  try {
    await useRequestCampaignMintAirdrop.mutateAsync({walletAdapter:wallet,mint,tokenAmount:(tokenAmount*10**9) })
    setRecepientAddress("");
    setTokenAmount(0)
  } catch (error) {
    console.log("Error : ",error)
  }
}
  return(
    <div className="w-full mx-auto bg-gray-900 p-6 rounded-2xl shadow-lg">
  <h2 className="text-xl font-semibold text-white mb-12 text-center">
    Request Token Mint to Donate 
  </h2>
  <form onSubmit={(e)=>handleCreateMint(e)} className="space-y-4">

    <div>
      <label className="block text-sm font-medium text-gray-300">Wallet Address</label>
      <input
      disabled
        type="text"
        value={recepientAddress}
        onChange={(e) => setRecepientAddress(e.target.value)}
        placeholder="Enter recipient wallet address"
        className="w-full px-4 py-2 mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-300">Mint</label>
      <input
        type="text"
        value={`Mint - ${mint.toString()}`}
        disabled
        className="w-full px-4 py-2 mt-1 bg-gray-700 border border-gray-600 text-gray-400 rounded-lg cursor-not-allowed"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-300">Token Amount</label>
      <input
        type="number"
        value={tokenAmount}
        max={10}
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
      {useRequestCampaignMintAirdrop.isPending?<div className='loading loading-spinner'></div>:"Request Mint Airdrop"}
    </button>
  </form>
</div>
  )
}

export function MintList({wallet,mint}:{wallet:WalletContextState,mint:PublicKey}){
  const {useRequestCampaignMintAirdrop}=useRequestCampaignMintAirdropProgram();
  const query=useGetTokenAccounts({address:wallet.publicKey!});
  const {connection} = useConnection()
  const queryClient = useQueryClient()
  const [requestPending,setRequestPending] =useState<boolean>(false)
  const {tokenAccounts,campaignToken} = useMemo(()=>{
   return {tokenAccounts:query.data,campaignToken:query.data?.find(acc=>acc.account.data.parsed.info.mint==mint)}
  },[wallet.publicKey,query.data,mint])
  const availableTokenAmount = useMemo(()=>campaignToken?.account.data.parsed.info.tokenAmount.uiAmount ,[campaignToken])
  const handleAirdrop = async()=>{
    setRequestPending(true);
    await useRequestCampaignMintAirdrop.mutateAsync({walletAdapter:wallet,mint,tokenAmount:(5*10**9)})
    .then(()=>{
      queryClient.invalidateQueries({
        queryKey: ['get-token-accounts', { endpoint: connection.rpcEndpoint, address: wallet.publicKey }],
      });
    })
    .finally(()=>setRequestPending(false))
  }

  return(
    <>
    {tokenAccounts && tokenAccounts.length > 0 ? (
      <div className="overflow-x-auto overflow-y-auto h-72 ">
        <PerfectScrollbar>
          <table className="min-w-full bg-white dark:bg-gray-900 shadow-md rounded-lg border border-gray-200 dark:border-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="text-left px-6 py-3 text-gray-600 dark:text-gray-300 font-medium uppercase">
                  Token Account
                </th>
                <th className="text-left px-6 py-3 text-gray-600 dark:text-gray-300 font-medium uppercase">
                  Mint Address
                </th>
                <th className="text-right px-6 py-3 text-gray-600 dark:text-gray-300 font-medium uppercase">
                  Token Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {
              tokenAccounts
              .sort((a,b)=>
                a.account.data.parsed.info.mint==mint
                ?-1
                :b.account.data.parsed.info.mint==mint
                ?1
                :0)
              .map(({ account, pubkey }) => (
                <tr
                  key={pubkey.toString()}
                  className="border-b last:border-none hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
                >
                  <td className="px-6 py-4 text-gray-800 dark:text-gray-200 break-all">
                    <ExplorerLink
                      label={pubkey.toString()}
                      path={`account/${pubkey.toString()}`}
                    />
                  </td>
                  <td className="px-6 py-4 text-gray-800 dark:text-gray-200 break-all">
                    <ExplorerLink
                      label={account.data.parsed.info.mint.toString()}
                      path={`account/${account.data.parsed.info.mint.toString()}`}
                    />
                  </td>
                  <td className="px-6 py-4 text-right text-gray-800 dark:text-gray-200 flex justify-between items-center gap-4">
                    <span 
                        className='w-14 truncate text-xs md:text-sm text-left'
                        title={account.data.parsed.info.mint === mint 
                          ? availableTokenAmount?.toFixed(2) 
                          : account.data.parsed.info.tokenAmount.uiAmount}
                    >
                      {account.data.parsed.info.mint==mint ?availableTokenAmount?.toFixed(2):account.data.parsed.info.tokenAmount.uiAmount}
                      </span>
                    {
                      account.data.parsed.info.mint==mint 
                      &&
                      <>
                      {
                        campaignToken  && availableTokenAmount== 0 
                        ? <button disabled={useRequestCampaignMintAirdrop.isPending} onClick={handleAirdrop} className='w-24 py-1.5 bg-green-800 rounded-lg text-xs transition-all hover:bg-green-950'>
                            {requestPending?"Requesting...":"Request Airdrop"}
                          </button>
                        : <Link href="/donate" className='px-2 py-1.5 bg-green-800 rounded-lg text-xs transition-all hover:bg-green-950'>Donate</Link>
                          
                      }
                      </>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
         </PerfectScrollbar>
      </div>
    ) : (
      <p className="text-gray-600 text-center">No token accounts found.</p>
    )}
    </>
  )
}