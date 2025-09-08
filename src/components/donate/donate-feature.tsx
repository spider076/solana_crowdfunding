'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import {  Donate } from './donate-ui'
import { useExistingAccount } from '../crowdfunding/crowdfunding-data-access'

export default function DonateFeature() {
  const wallet = useWallet()
  const {campaignAccountQuery}=useExistingAccount()

  return wallet && wallet.connected  && wallet.publicKey ? (
    <div className='w-full h-full flex flex-col justify-between p-10 items-center'>
      {!campaignAccountQuery.isPending && campaignAccountQuery.data
      ? <>
      <Donate wallet={wallet} campaign = {campaignAccountQuery.data}/>
      </>
      :<div className='flex h-96 justify-center items-center'>Campaign hasn&apos;t been created , Ask Admin to create !</div>
      }
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  )
}
