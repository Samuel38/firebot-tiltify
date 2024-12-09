import { EventSource } from "@crowbartools/firebot-custom-scripts-types/types/modules/event-manager";
import {
    TILTIFY_EVENT_SOURCE_ID,
    TILTIFY_DONATION_EVENT_ID,
    TILTIFY_MILESTONE_EVENT_ID
} from "../constants";
import { TiltifyDonationEventData } from "./donation-event-data";
import { TiltifyMilestoneReachedEventData } from "./milestone-reached-event-data";

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
                getMessage: (eventData: TiltifyDonationEventData) => {
                    return `**${eventData.from}** donated **$${eventData.donationAmount}** to Tiltify${eventData.rewardName ? ` with reward *${eventData.rewardName}*` : eventData.rewardId ? ` with reward *${eventData.rewardId}*` : ""}`;
                }
            }
        }, 
        {
            id: TILTIFY_MILESTONE_EVENT_ID,
            name: "Milestone Reached",
            description: "When a Milestone of your Tiltify campaign has been reached.",
            cached: false,
            manualMetadata: {
                id: "",
                name: "Awesome Milestone",
                amount: 1000,
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
                icon: "fad fa-heartbeat",
                getMessage: (eventData: TiltifyMilestoneReachedEventData) => {
                    return `Milestone **${eventData.name}** reached in campaign ${eventData.campaignInfo.name}. 
Threshold: $${eventData.amount}`;
                }
            }
        }
    ]
};