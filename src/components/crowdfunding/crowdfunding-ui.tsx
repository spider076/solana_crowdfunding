'use client'

import {  useCrowdfundingProgram } from './crowdfunding-data-access'
import { WalletContextState } from '@solana/wallet-adapter-react'
import { ICampaign } from './types'
import { formatDate, unixTimeStarmp } from '../common/common-utils'
import { useCreateMintAndTokenAccount } from '../mint/mint-data-access'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FormEvent, useState } from 'react'
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import BN from 'bn.js'


export function CrowdfundingCreate({wallet}:{wallet:WalletContextState}) {
  const { createCampaign } = useCrowdfundingProgram()
  const {createMintAndTokenAccount}=useCreateMintAndTokenAccount()
  const router = useRouter()
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const handleCreateCampaign = async(e:FormEvent<HTMLFormElement>)=>{

    e.preventDefault()
    if(startTime==null || deadline == null){
      toast.error("Fill all details !")
    }
    const {signature,mint,associatedTokenAccount} = await createMintAndTokenAccount.mutateAsync({walletAdapter:wallet,tokenAmount:1000000})
    await createCampaign.mutateAsync({wallet,startTime:unixTimeStarmp(startTime!),deadline:unixTimeStarmp(deadline!),mint })
    .then(()=>router.push('/donate'))
    .catch(()=>toast.error("Campaign Creation failed !"))
  }
  return (
    
    <div className="mt-24 flex flex-col w-full  justify-center items-center gap-4">
        <form onSubmit={(e)=>handleCreateCampaign(e)} className='w-[28rem] rounded-md flex flex-col gap-4 justify-center items-center border border-gray-500 p-20'>
                <h2 className='text-2xl mb-8'>Create Campaign </h2>

                  <input disabled type="text" className='input input-bordered w-full max-w-xs px-2 py-1 ' placeholder='Title - Plant a Billion Trees'/>
                  <Flatpickr
                      data-enable-time
                      value={startTime || ""}
                      onChange={(start) => setStartTime(start[0])}
                      options={{
                        enableTime: true,
                        dateFormat: "Y-m-d H:i",
                        disableMobile: true,
                      }}
                      className=" input input-bordered w-full max-w-xs px-2 py-1 "
                      placeholder="Campaign Start time"
                  />
                  <Flatpickr
                      data-enable-time
                      value={deadline || ""}
                      onChange={(end) => setDeadline(end[0])}
                      options={{
                        enableTime: true,
                        dateFormat: "Y-m-d H:i",
                        disableMobile: true,
                      }}
                      className=" input input-bordered w-full max-w-xs px-2 py-1 "
                      placeholder="Campaign Deadline"
                  />
                  <button
                    className="btn btn-xs lg:btn-md btn-primary w-full"
                    disabled={createCampaign.isPending}
                  >
                    {createCampaign.isPending ? <div className='text-xs loading loading-spinner'></div>:"Create"}
                  </button>
        </form>
    </div>
    
  )
}

export function CrowdfundingCard({existingCampaign}:{existingCampaign:ICampaign}) {

  const startTime =formatDate( new Date(existingCampaign.startTime.toNumber() * 1000));
  const deadline = formatDate(new Date(existingCampaign.deadline.toNumber() * 1000));


  return  existingCampaign ? (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 max-w-md mx-auto mt-20">
      <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200 text-center">
        {existingCampaign.title}
      </h2>
      
      <div className="mb-4">
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1.5">
          <span className="font-semibold">Owner:</span> {existingCampaign.owner.toBase58()}
        </p>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1.5">
          <span className="font-semibold">Mint:</span> {existingCampaign.mint.toBase58()}
        </p>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1.5">
          <span className="font-semibold">Vault:</span> {existingCampaign.vault.toBase58()}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Start Date</p>
          <p className="text-base font-semibold text-gray-700 dark:text-gray-100">{startTime}</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-300">End Date</p>
          <p className="text-base font-semibold text-gray-700 dark:text-gray-100">{deadline}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Amount Raised</p>
        <p className="text-xl font-bold text-green-600">
          {(Number(existingCampaign.amountRaised)/10**9).toFixed(2)}
        </p>
      </div>
      <div className="mb-4 text-center">
        <Link href="/donate"  className="text-lg px-4 py-1 rounded-md bg-green-800 transition-all hover:bg-green-900 active:scale-95 font-medium text-gray-500 dark:text-gray-300">Donate Now</Link>
      </div>
    </div>
  ):(
    <div>Campaign hasn&apos;t Created yet !</div>
  )
}
