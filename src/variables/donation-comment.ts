import { ReplaceVariable } from "@crowbartools/firebot-custom-scripts-types/types/modules/replace-variable-manager";
import {
    TILTIFY_EVENT_SOURCE_ID,
    TILTIFY_DONATION_EVENT_ID
} from "../constants";
import { TiltifyDonationEventData } from "../events/donation-event-data";

export const TiltifyDonationCommentVariable: ReplaceVariable = {
    definition: {
        handle: "tiltifyDonationComment",
        description: "The comment of a donation from Tiltify",
        triggers: {
            "event": [
                `${TILTIFY_EVENT_SOURCE_ID}:${TILTIFY_DONATION_EVENT_ID}`
            ],
            "manual": true
        },
        possibleDataOutput: ["text"]
    },
    evaluator: function (trigger): string {
        let eventData: TiltifyDonationEventData = trigger.metadata?.eventData as TiltifyDonationEventData;
        return eventData?.comment ?? "";
    }
};