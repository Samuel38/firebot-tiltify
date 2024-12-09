export type TiltifyMilestoneReachedEventData = {
    id: string,
    name: string,
    amount: number,
    campaignInfo: {
        name: string,
        cause: string,
        causeLegalName: string,
        fundraisingGoal: number,
        originalGoal: number,
        supportingRaised: number,
        amountRaised: number,
        totalRaised: number,
    }
}