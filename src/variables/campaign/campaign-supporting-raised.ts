import { ReplaceVariable } from "@crowbartools/firebot-custom-scripts-types/types/modules/replace-variable-manager";
import { OutputDataType } from "@shared/variable-constants";
import {
    TILTIFY_EVENT_SOURCE_ID,
    TILTIFY_DONATION_EVENT_ID,
    TILTIFY_MILESTONE_EVENT_ID
} from "@/constants";
import { TiltifyCampaignEventData } from "@/events/campaign-event-data";

export const TiltifyCampaignSupportingRaisedVariable: ReplaceVariable = {
    definition: {
        handle: "tiltifyCampaignSupportingRaised",
        description: "The amount of money raised by the Tiltify supporting campaigns related to the event",
        triggers: {
            "event": [
                `${TILTIFY_EVENT_SOURCE_ID}:${TILTIFY_DONATION_EVENT_ID}`,
                `${TILTIFY_EVENT_SOURCE_ID}:${TILTIFY_MILESTONE_EVENT_ID}`
            ],
            "manual": true
        },
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: function (trigger): number {
        const eventData: TiltifyCampaignEventData = trigger.metadata?.eventData as TiltifyCampaignEventData;
        return eventData?.campaignInfo?.supportingRaised ?? 0;
    }
};