import { TiltifyCampaignEventData } from "./campaign-event-data";

export type TiltifyDonationEventData = TiltifyCampaignEventData & {
    from: string;
    donationAmount: number;
    rewardId: string;
    rewardName: string;
    comment: string;
    pollOptionId: string;
    challengeId: string;
};
