import { TiltifyCampaignEventData } from "./campaign-event-data";

export type TiltifyMilestoneReachedEventData = TiltifyCampaignEventData & {
    id: string,
    name: string,
    amount: number
}