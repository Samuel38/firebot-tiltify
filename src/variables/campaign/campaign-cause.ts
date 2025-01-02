import { ReplaceVariable } from "@crowbartools/firebot-custom-scripts-types/types/modules/replace-variable-manager";
import { OutputDataType } from "@shared/variable-constants";
import {
    TILTIFY_EVENT_SOURCE_ID,
    TILTIFY_DONATION_EVENT_ID,
    TILTIFY_MILESTONE_EVENT_ID
} from "@/constants";
import { TiltifyCampaignEventData } from "@/events/campaign-event-data";

export const TiltifyCampaignCauseVariable: ReplaceVariable = {
    definition: {
        handle: "tiltifyCampaignCause",
        description: "The cause of the Tiltify campaign related to the event",
        triggers: {
            event: [
                `${TILTIFY_EVENT_SOURCE_ID}:${TILTIFY_DONATION_EVENT_ID}`,
                `${TILTIFY_EVENT_SOURCE_ID}:${TILTIFY_MILESTONE_EVENT_ID}`
            ],
            manual: true
        },
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: function (trigger): string {
        const eventData: TiltifyCampaignEventData = trigger.metadata
            ?.eventData as TiltifyCampaignEventData;
        return eventData?.campaignInfo?.cause ?? "unknown";
    }
};
