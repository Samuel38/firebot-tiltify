import { ReplaceVariable } from "@crowbartools/firebot-custom-scripts-types/types/modules/replace-variable-manager";
import { OutputDataType } from "@shared/variable-constants";
import {
    TILTIFY_EVENT_SOURCE_ID,
    TILTIFY_DONATION_EVENT_ID
} from "@/constants";
import { TiltifyDonationEventData } from "@/events/donation-event-data";

export const TiltifyDonationFromVariable: ReplaceVariable = {
    definition: {
        handle: "tiltifyDonationFrom",
        description: "The name of who sent a Tiltify donation",
        triggers: {
            "event": [
                `${TILTIFY_EVENT_SOURCE_ID}:${TILTIFY_DONATION_EVENT_ID}`
            ],
            "manual": true
        },
        //@ts-expect-error ts2322
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: function (trigger): string {
        let eventData: TiltifyDonationEventData = trigger.metadata?.eventData as TiltifyDonationEventData;
        return eventData?.from ?? "Unknown User";
    }
};