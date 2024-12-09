import { TiltifyMoney } from "./shared";

export type TiltifyMilestone = {
    id: string;
    name: string;
    amount: TiltifyMoney;
    updated_at: string;
    active: boolean;
    reached: boolean;
};