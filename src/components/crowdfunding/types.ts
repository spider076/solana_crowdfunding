import { WalletContextState } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { UseQueryResult } from "@tanstack/react-query";
import BN from "bn.js";

export interface IExistingCampaign {
  accountQuery: UseQueryResult<ICampaign, Error>;
  campaignExists: ICampaign;
  campaignExistsPending: boolean;
}

export interface ICreateCampaign {
    wallet:WalletContextState,
    startTime:number,
    deadline:number,
    mint:PublicKey
}

export interface ICampaign{
    owner: PublicKey;
    title: string;
    startTime: BN;
    deadline: BN;
    amountRaised: BN;
    mint: PublicKey;
    vault: PublicKey;
    bump: number;
}
