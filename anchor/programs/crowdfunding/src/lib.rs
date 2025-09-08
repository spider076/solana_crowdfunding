#![allow(clippy::result_large_err)]

use anchor_lang:: prelude::*;
use anchor_spl::{
  associated_token::AssociatedToken,
  token_interface::{self,Mint,TokenAccount,TokenInterface,Transfer}
};

declare_id!("FnBWfHQmw6o7igCF1NbScApEtJNesmqAPThKWT5RmbnS");

#[program]
mod crowdfunding{
  use super::*;

  pub fn create_campaign(ctx:Context<Campaign>,title:String,start_time:i64,deadline:i64)->Result<()>{
            require!(start_time<deadline,ErrorCode::InvalidTimeLine);
            require!(title.len() > 1, ErrorCode::TitleTooShort);
            require!(title.len() <= 50, ErrorCode::TitleTooLong);
            let campaign = &mut ctx.accounts.campaign;
            campaign.owner=ctx.accounts.owner.key();
            campaign.mint=ctx.accounts.mint.key();
            campaign.vault=ctx.accounts.vault.key();
            campaign.title=title;
            campaign.start_time=start_time;
            campaign.deadline=deadline;
            campaign.amount_raised=0;
            
            campaign.bump = ctx.bumps.campaign;

    Ok(())
  }
  pub fn donate_to_campaign(ctx:Context<Donate>,amount:u64)->Result<()>{
    let donor = &mut ctx.accounts.donor_acc;
    let campaign = &mut ctx.accounts.campaign;
    let current_time = Clock::get()?.unix_timestamp;
    require!(amount>0,ErrorCode::InvalidDonationAmount);
    require!(campaign.start_time < current_time,ErrorCode::CampaignHasntStarted);
    require!(campaign.deadline > current_time,ErrorCode::CampaignHasbeenOver);
    donor.donor_pubkey=ctx.accounts.signer.key();
    donor.amount = amount;
    token_interface::transfer(
      CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer{
          from:ctx.accounts.donor_ata.to_account_info(),
          to:ctx.accounts.vault.to_account_info(),
          authority:ctx.accounts.signer.to_account_info(),
        },
      ),
      amount,
    )?;

    campaign.amount_raised+=amount;
    Ok(())
  }
  pub fn withdraw(ctx:Context<Withdraw>)->Result<()>{
    
    let campaign = &ctx.accounts.campaign;
    let current_time = Clock::get()?.unix_timestamp;
    require!(campaign.deadline<current_time,ErrorCode::DeadlineNotReached);
    require!(campaign.owner==*ctx.accounts.owner.key,ErrorCode::OwnerMissmatch);
    require!(campaign.amount_raised>0,ErrorCode::NoAmountInVault);
    
    let seeds = &[
            b"campaign",
            campaign.owner.as_ref(),
            campaign.title.as_bytes(),
            &[campaign.bump],
        ];
    let _=token_interface::transfer(
      CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer{
          from:ctx.accounts.vault.to_account_info(),
          to:ctx.accounts.campaign_owner_ata.to_account_info(),
          authority:ctx.accounts.campaign.to_account_info()
        },
        &[seeds],
      ),
      ctx.accounts.vault.amount);
      ctx.accounts.campaign.amount_raised=0;
    Ok(())
  }

}

#[derive(Accounts)]
#[instruction(title:String)]
pub struct Campaign<'info>{
  #[account(
    init,
    payer=signer,
    space=CampaignState::INIT_SPACE,
    seeds=[b"campaign",owner.key().as_ref(),title.as_bytes()],
    bump
  )]
  pub campaign:Account<'info,CampaignState>,
  #[account(mut)]
  pub signer:Signer<'info>,
  pub owner:SystemAccount<'info>,
  pub mint:InterfaceAccount<'info,Mint>,
  #[account(
    init,
    payer=signer,
    associated_token::mint=mint,
    associated_token::authority=campaign,
  )]
  pub vault:InterfaceAccount<'info,TokenAccount>,
  pub system_program:Program<'info,System>,
  pub token_program:Interface<'info,TokenInterface>,
  pub associated_token_program:Program<'info,AssociatedToken>,
}

#[derive(Accounts)]
pub struct Donate<'info>{
  #[account(
    init_if_needed,
    payer=signer,
    space=8+DonorState::INIT_SPACE,
    seeds=[b"donor",signer.key().as_ref(),campaign.key().as_ref()],
    bump

  )]
  pub donor_acc:Account<'info,DonorState>,
  #[account(mut)]
  pub signer:Signer<'info>,
  #[account(mut)]
  pub campaign:Account<'info,CampaignState>,
  #[account(
    mut,
    associated_token::mint=campaign.mint,
    associated_token::authority=campaign,
  )]
  pub vault:InterfaceAccount<'info,TokenAccount>,
  #[account(
    mut,
    associated_token::mint=campaign.mint,
    associated_token::authority=signer
  )]
  pub donor_ata:InterfaceAccount<'info,TokenAccount>,
  pub token_program:Interface<'info,TokenInterface>,
  pub system_program:Program<'info,System>,
  pub associated_token_program:Program<'info,AssociatedToken>

}
#[derive(Accounts)]
pub struct Withdraw<'info>{
  #[account(
    mut,
    has_one=owner
  )]
  pub campaign:Account<'info,CampaignState>,
  #[account(
    mut,
    associated_token::mint=campaign.mint,
    associated_token::authority=campaign
  )]
  pub vault:InterfaceAccount<'info,TokenAccount>,
  #[account(mut)]
  pub owner:Signer<'info>,
  #[account(
    init_if_needed,
    payer=owner,
    associated_token::mint=mint,
    associated_token::authority=owner
  )]
  pub campaign_owner_ata:InterfaceAccount<'info,TokenAccount>,
  pub mint:InterfaceAccount<'info,Mint>,
  pub token_program:Interface<'info,TokenInterface>,
  pub system_program:Program<'info,System>,
  pub associated_token_program:Program<'info,AssociatedToken>
}
#[account]
#[derive(InitSpace)]
pub struct DonorState{
  pub donor_pubkey:Pubkey,
  pub amount:u64,
}


#[account]
#[derive(InitSpace)]
pub struct CampaignState{
  pub owner:Pubkey,
  #[max_len(50)]
  pub title:String,
  pub start_time:i64,
  pub deadline:i64,
  pub amount_raised:u64,
  pub mint:Pubkey,
  pub vault:Pubkey,
  pub bump:u8,
}

#[error_code]
pub enum ErrorCode{
  #[msg("Campaign hasn't been started yet !")]
  CampaignHasntStarted,
  #[msg("Campaign is over now !")]
  CampaignHasbeenOver,
  #[msg("Current Signer is not campaign owner !")]
  OwnerMissmatch,
  #[msg("Vault has no amount")]
  NoAmountInVault,
  #[msg("Invalid timeline configuration in create campaign, start time is lower than deadline !")]
  InvalidTimeLine,
  #[msg("Title exceeds 50 character length !")]
  TitleTooLong,
  #[msg("Title is too short !")]
  TitleTooShort,
  #[msg("Minimum Donation amount not matched ! ")]
  InvalidDonationAmount,
  #[msg("Deadline hasn't reached yet !")]
  DeadlineNotReached
}