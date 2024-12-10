import { ReplaceVariable } from "@crowbartools/firebot-custom-scripts-types/types/modules/replace-variable-manager";
import {
    TILTIFY_EVENT_SOURCE_ID,
    TILTIFY_DONATION_EVENT_ID,
    TILTIFY_MILESTONE_EVENT_ID
} from "../../constants";
import { TiltifyDonationEventData } from "../../events/donation-event-data";
import { TiltifyMilestoneReachedEventData } from "../../events/milestone-reached-event-data";

export const TiltifyCampaignNameVariable: ReplaceVariable = {
    definition: {
        handle: "tiltifyCampaignName",
        description: "The legal cause name of the Tiltify campaign related to the event",
        triggers: {
            "event": [
                `${TILTIFY_EVENT_SOURCE_ID}:${TILTIFY_DONATION_EVENT_ID}`,
                `${TILTIFY_EVENT_SOURCE_ID}:${TILTIFY_MILESTONE_EVENT_ID}`
            ],
            "manual": true
        },
        possibleDataOutput: ["text"]
    },
    evaluator: function (trigger): string {
        let eventData: TiltifyDonationEventData | TiltifyMilestoneReachedEventData;
        if ( trigger.metadata.event.id == TILTIFY_DONATION_EVENT_ID ) 
            eventData = trigger.metadata?.eventData as TiltifyDonationEventData;
        else if ( trigger.metadata.event.id == TILTIFY_MILESTONE_EVENT_ID )
            eventData = trigger.metadata?.eventData as TiltifyMilestoneReachedEventData;
        return eventData?.campaignInfo?.name ?? "";
    }
};