import { ReplaceVariable } from "@crowbartools/firebot-custom-scripts-types/types/modules/replace-variable-manager";
import { OutputDataType } from "@shared/variable-constants";
import {
    TILTIFY_EVENT_SOURCE_ID,
    TILTIFY_DONATION_EVENT_ID
} from "@/constants";
import { TiltifyDonationEventData } from "@/events/donation-event-data";

export const TiltifyDonationAmountVariable: ReplaceVariable = {
    definition: {
        handle: "tiltifyDonationAmount",
        description: "The amount of a donation from Tiltify",
        triggers: {
            "event": [
                `${TILTIFY_EVENT_SOURCE_ID}:${TILTIFY_DONATION_EVENT_ID}`
            ],
            "manual": true
        },
        //@ts-expect-error ts2322
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: function (trigger): number {
        let eventData: TiltifyDonationEventData = trigger.metadata?.eventData as TiltifyDonationEventData;
        return eventData?.donationAmount ?? 0;
    }
};