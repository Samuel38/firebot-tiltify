# Tiltify Firebot Plugin

A [Firebot](https://firebot.app) plugin/custom script for interacting with [Tiltify](https://tiltify.com) campaigns. 
Designed as a drop-in replacement for the [original plugin](https://github.com/cozyGalvinism/FirebotTiltify) by [cozyGalvinism](https://github.com/cozyGalvinism). 
Updated to work with v5 of the Tiltify API by [zunderscore](https://github.com/zunderscore/firebot-tiltify). 
Debugged and improved to cover wider needs and provide more functionality. 


Adds the following functionality to Firebot:
- Events
  - Donation
- Variables
  - `$tiltifyDonationFrom`
  - `$tiltifyDonationAmount`
  - `$tiltifyDonationRewardId`
  - `$tiltifyDonationComment`
  - `$tiltifyDonationCampaignName`
  - `$tiltifyDonationCampaignCause`
  - `$tiltifyDonationCampaignFundraisingGoal`
  - `$tiltifyDonationCampaignOriginalGoal`
  - `$tiltifyDonationCampaignSupportingRaised`
  - `$tiltifyDonationCampaignRaised`
  - `$tiltifyDonationCampaignTotalRaised`
  - `$tiltifyDonationCampaignCauseLegal` (deprecated)
- Event Filters
  - Reward
  - Poll Option
  - Challenge/Target