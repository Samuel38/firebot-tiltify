import { ReplaceVariable } from "@crowbartools/firebot-custom-scripts-types/types/modules/replace-variable-manager";
import { OutputDataType } from "@shared/variable-constants";
import {
    TILTIFY_EVENT_SOURCE_ID,
    TILTIFY_DONATION_EVENT_ID,
    TILTIFY_MILESTONE_EVENT_ID
} from "@/constants";
import { TiltifyDonationEventData } from "@/events/donation-event-data";
import { TiltifyMilestoneReachedEventData } from "@/events/milestone-reached-event-data";

export const TiltifyCampaignCauseLegalVariable: ReplaceVariable = {
    definition: {
        handle: "tiltifyCampaignCauseLegal",
        description: "(Deprecated: Tiltify no longer provides this) The legal cause name of the Tiltify campaign related to this event",
        triggers: {
            "event": [
                `${TILTIFY_EVENT_SOURCE_ID}:${TILTIFY_DONATION_EVENT_ID}`,
                `${TILTIFY_EVENT_SOURCE_ID}:${TILTIFY_MILESTONE_EVENT_ID}`
            ],
            "manual": true
        },
        //@ts-expect-error ts2322
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: function (trigger): string {
        let eventData: TiltifyDonationEventData | TiltifyMilestoneReachedEventData;
        if ( trigger.metadata.event.id == TILTIFY_DONATION_EVENT_ID ) 
            eventData = trigger.metadata?.eventData as TiltifyDonationEventData;
        else if ( trigger.metadata.event.id == TILTIFY_MILESTONE_EVENT_ID )
            eventData = trigger.metadata?.eventData as TiltifyMilestoneReachedEventData;
        return eventData?.campaignInfo?.causeLegalName ?? "";
    }
};