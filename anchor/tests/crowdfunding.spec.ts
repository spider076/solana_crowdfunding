import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair, PublicKey, SystemProgram} from '@solana/web3.js'
import {Crowdfunding} from '../target/types/crowdfunding'
import { ASSOCIATED_TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import assert from 'assert'
import { BN } from 'bn.js'
import { Buffer } from 'buffer'

describe('crowdfunding', () => {
  
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const connection = provider.connection
  const payer = provider.wallet as anchor.Wallet
  const program = anchor.workspace.Crowdfunding as Program<Crowdfunding>

  let campaignOwner=Keypair.generate()
  let mintOwner=Keypair.generate()
  let donor =Keypair.generate()
  let donorAta:PublicKey
  let title="Protect the Sea"
  let start_time = new anchor.BN(Date.now() / 1000);
  let deadline = new anchor.BN(Date.now() / 1000 + 86400);
  let donateAmount = new anchor.BN(10000000000)

  let mint:PublicKey;
  let vault:PublicKey;
  let campaignPda:PublicKey;
  let donorPda:PublicKey;
  let campaignOwnerAta:PublicKey;

  beforeAll(async()=>{
    await connection.confirmTransaction(
    await connection.requestAirdrop(campaignOwner.publicKey, 1_000_000_000));

    await connection.confirmTransaction(
    await connection.requestAirdrop(mintOwner.publicKey, 1_000_000_000));

    await connection.confirmTransaction(await connection.requestAirdrop(donor.publicKey,1_000_000_000));


    [campaignPda]=PublicKey.findProgramAddressSync([
      Buffer.from("campaign"),
      campaignOwner.publicKey.toBuffer(),
      Buffer.from(title)
    ],
    program.programId
    );
    mint = await createMint(connection,payer.payer,payer.publicKey,null,9);
    vault = anchor.utils.token.associatedAddress({
      mint: mint,
      owner: campaignPda,
      });

    donorAta=(await getOrCreateAssociatedTokenAccount(connection,donor,mint,donor.publicKey)).address;

    await mintTo(connection,payer.payer,mint,donorAta,payer.publicKey,100000000000);

      console.log("vault ",vault.toBase58());
    [donorPda]=PublicKey.findProgramAddressSync([
        Buffer.from('donor'),
        donor.publicKey.toBuffer(),
        campaignPda.toBuffer()
      ],
      program.programId
    );
    campaignOwnerAta = (await getOrCreateAssociatedTokenAccount(connection,campaignOwner,mint,campaignOwner.publicKey)).address
  })
  it('Create Campaign', async () => {

    const creteCampaignTX = await program.methods.createCampaign(title,start_time,deadline)
      .accounts({
        campaign:campaignPda,
        signer:payer.publicKey,
        owner:campaignOwner.publicKey,
        mint,
        vault,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,


      } as any)
      .rpc()

      const campaignAccount = await program.account.campaignState.fetch(campaignPda)
      assert.strictEqual(campaignAccount.title, title);
      assert.strictEqual(campaignAccount.owner.toString(), campaignOwner.publicKey.toString());
  })
  it('Donate to campaign',async()=>{
        const tx = await program.methods.donateToCampaign(new BN(donateAmount))
                              .accounts({
                                donorAcc:donorPda,
                                signer:donor.publicKey,
                                campaign:campaignPda,
                                vault,
                                donorAta,
                                tokenProgram:TOKEN_PROGRAM_ID,
                                systemProgram:SystemProgram.programId,
                                associatedTokenProgram:ASSOCIATED_TOKEN_PROGRAM_ID
                              } as any)
                              .signers([donor])
                              .rpc()
      // console.log("donor Tx ",tx)
      const campaign = await program.account.campaignState.fetch(campaignPda)
      const donor_state = await program.account.donorState.fetch(donorPda)
      const vaultBalance = await connection.getTokenAccountBalance(campaign.vault)
    console.log("amount raised ",Number(campaign.amountRaised))

      assert.ok(Number(vaultBalance.value.amount)>0);
      assert.equal(donor.publicKey.toString(),donor_state.donorPubkey.toString())
      assert.ok(Number(donor_state.amount)>=Number(donateAmount))
      
  })
  it("Campaign Owner Withdraw donation ",async()=>{
    console.log("campaign owner ata ",campaignOwnerAta)
    const withdrawTx = await program.methods.withdraw()
                  .accounts({
                    campaign:campaignPda,
                    vault,
                    owner:campaignOwner.publicKey,
                    campaignOwnerAta,
                    mint,
                    tokenProgram:TOKEN_PROGRAM_ID,
                    systemProgram:SystemProgram.programId,
                    associatedTokenProgram:ASSOCIATED_TOKEN_PROGRAM_ID
                  } as any)
                  .signers([campaignOwner])
                  .rpc()
    const campaign = await program.account.campaignState.fetch(campaignPda)
    assert.ok(Number(campaign.amountRaised)==0," Amount raised doesn't updated ")
  })

})
