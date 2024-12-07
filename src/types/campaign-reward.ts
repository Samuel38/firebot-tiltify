import { TiltifyMoney } from "./shared";

export type TiltifyCampaignReward = {
    id: string;
    name: string;
    amount: TiltifyMoney;
    active: boolean;
    description: string;
    quantity: number;
    quantity_remaining: number;
};