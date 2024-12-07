import { EventSource } from "@crowbartools/firebot-custom-scripts-types/types/modules/event-manager";
import {
    TILTIFY_EVENT_SOURCE_ID,
    TILTIFY_DONATION_EVENT_ID
} from "../constants";

export const TiltifyEventSource: EventSource = {
    id: TILTIFY_EVENT_SOURCE_ID,
    name: "Tiltify",
    events: [
        {
            id: TILTIFY_DONATION_EVENT_ID,
            name: "Donation",
            description: "When someone donates to you via Tiltify.",
            cached: false,
            manualMetadata: {
                from: "Tiltify",
                donationAmount: 4.2,
                rewardId: null,
                rewardName: "",
                comment: "Thanks for the stream!",
                pollOptionId: null,
                challengeId: null,
                campaignInfo: {
                    name: "GOTEL",
                    cause: "Lupus Foundation of America",
                    causeLegalName: "Lupus Foundation of America, Inc.",
                    fundraisingGoal: 1000,
                    originalGoal: 500,
                    supportingRaised: 500,
                    amountRaised: 1000,
                    totalRaised: 1500
                }
            },
            //@ts-ignore
            isIntegration: true,
            queued: true,
            activityFeed: {
                icon: "fad fa-heart",
                getMessage: (eventData: any) => {
                    return `**${eventData.from}** donated **$${eventData.donationAmount}** to Tiltify${eventData.rewardName ? ` with reward *${eventData.rewardName}*` : eventData.rewardId && eventData.rewardId !== -1 ? ` with reward *${eventData.rewardId}*` : ""}`;
                }
            }
        }
    ]
};