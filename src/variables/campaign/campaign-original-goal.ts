import { ReplaceVariable } from "@crowbartools/firebot-custom-scripts-types/types/modules/replace-variable-manager";
import {
    TILTIFY_EVENT_SOURCE_ID,
    TILTIFY_DONATION_EVENT_ID,
    TILTIFY_MILESTONE_EVENT_ID
} from "../../constants";
import { TiltifyDonationEventData } from "../../events/donation-event-data";
import { TiltifyMilestoneReachedEventData } from "../../events/milestone-reached-event-data";

export const TiltifyCampaignOriginalGoalVariable: ReplaceVariable = {
    definition: {
        handle: "tiltifyCampaignOriginalGoal",
        description: "The original goal set by the fundraiser of the Tiltify campaign related to the event",
        triggers: {
            "event": [
                `${TILTIFY_EVENT_SOURCE_ID}:${TILTIFY_DONATION_EVENT_ID}`,
                `${TILTIFY_EVENT_SOURCE_ID}:${TILTIFY_MILESTONE_EVENT_ID}`
            ],
            "manual": true
        },
        possibleDataOutput: ["number"]
    },
    evaluator: function (trigger): number {
        let eventData: TiltifyDonationEventData | TiltifyMilestoneReachedEventData;
        if ( trigger.metadata.event.id == TILTIFY_DONATION_EVENT_ID ) 
            eventData = trigger.metadata?.eventData as TiltifyDonationEventData;
        else if ( trigger.metadata.event.id == TILTIFY_MILESTONE_EVENT_ID )
            eventData = trigger.metadata?.eventData as TiltifyMilestoneReachedEventData;
        return eventData?.campaignInfo?.originalGoal ?? 0;
    }
};