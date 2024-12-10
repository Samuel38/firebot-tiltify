import { ReplaceVariable } from "@crowbartools/firebot-custom-scripts-types/types/modules/replace-variable-manager";
import { OutputDataType } from "@shared/variable-constants";
import {
    TILTIFY_EVENT_SOURCE_ID,
    TILTIFY_DONATION_EVENT_ID,
    TILTIFY_MILESTONE_EVENT_ID
} from "@/constants";
import { TiltifyCampaignEventData } from "@/events/campaign-event-data";

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
        //@ts-expect-error ts2322
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: function (trigger): string {
        let eventData: TiltifyCampaignEventData = trigger.metadata?.eventData as TiltifyCampaignEventData;
        return eventData?.campaignInfo?.name ?? "Unknown";
    }
};