### Solana Web3 Crowdfunding Platform

A decentralized crowdfunding platform built on the Solana blockchain. This project allows users to create campaigns, donate to them, and withdraw funds securely using smart contracts. The frontend is built with Next.js, and the smart contract is deployed on the Solana Devnet.


## Features
Create Campaigns: Users can create crowdfunding campaigns with a title, start time, and deadline.

Donate to Campaigns: Users can donate to active campaigns using Solana tokens.

Withdraw Funds: Campaign owners can withdraw funds after the campaign deadline has passed.

Secure and Transparent: Built on Solana's blockchain for secure and transparent transactions.

## Technologies Used
Blockchain: Solana

Smart Contract Framework: Anchor (Rust)

Frontend: Next.js 

Deployment: Vercel (Frontend), Solana Devnet (Smart Contract)

## Smart Contract Overview
The smart contract is written in Rust using the Anchor framework. It is deployed on the Solana Devnet with 
the program ID: AHoQRd2Qr34ViPMBqi7DRBq3yzd5cZG25PSK1M1WWqPw

### Getting Started
Prerequisites
    Node.js (v16 or higher)
    Solana CLI
    Anchor CLI
    Yarn or npm

## Installation
Clone the repository:
    git clone https://github.com/spider076/solana_crowdfunding
    cd solana_crowdfunding
    Install dependencies:npm install
Build and deploy the smart contract:    
    anchor build
    anchor deploy
Run the frontend:
    create .env file in root folder
        add NEXT_PUBLIC_ADMIN_WALLET_SECRET - wallet who creates campaign 
    npm run dev
    Open the application in your browser:http://localhost:3000


Smart Contract: Deployed on Solana Devnet with program ID:
OLD Contract : FnBWfHQmw6o7igCF1NbScApEtJNesmqAPThKWT5RmbnS.
NEW CONTRACT : AHoQRd2Qr34ViPMBqi7DRBq3yzd5cZG25PSK1M1WWqPw