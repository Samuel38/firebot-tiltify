export type TiltifyDonationEventData = {
    from: string,
    donationAmount: number,
    rewardId: string,
    rewardName: string,
    comment: string,
    pollOptionId: string,
    challengeId: string,
    campaignInfo: {
        name: string;
        cause: string;
        causeLegalName: string;
        fundraisingGoal: number;
        originalGoal: number;
        supportingRaised: number;
        amountRaised: number;
        totalRaised: number;
    }
}