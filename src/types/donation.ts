import { TiltifyMoney } from "./shared";

export type TiltifyRewardClaim = {
    id: string;
    quantity: number;
    reward_id: string;
};

export type TiltifyDonation = {
    amount: TiltifyMoney;
    completed_at: string;
    donor_comment: string;
    donor_name: string;
    id: string;
    poll_option_id?: string | undefined;
    reward_claims?: TiltifyRewardClaim[] | undefined;
    reward_id?: string | undefined;
    target_id?: string | undefined;
};
