import { TiltifyMoney } from "./shared";

export type TiltifyCampaign = {
    amount_raised: TiltifyMoney;
    cause_id: string;
    goal: TiltifyMoney;
    name: string;
    original_goal: TiltifyMoney;
    total_amount_raised: TiltifyMoney;
};
