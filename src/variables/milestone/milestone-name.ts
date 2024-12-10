import { ReplaceVariable } from "@crowbartools/firebot-custom-scripts-types/types/modules/replace-variable-manager";
import { OutputDataType } from "@shared/variable-constants";
import {
    TILTIFY_EVENT_SOURCE_ID,
    TILTIFY_MILESTONE_EVENT_ID
} from "@/constants";
import { TiltifyMilestoneReachedEventData } from "@/events/milestone-reached-event-data";

export const TiltifyMilestoneNameVariable: ReplaceVariable = {
    definition: {
        handle: "tiltifyMilestoneName",
        description: "The name of the Tiltify Milestone reached",
        triggers: {
            "event": [
                `${TILTIFY_EVENT_SOURCE_ID}:${TILTIFY_MILESTONE_EVENT_ID}`
            ],
            "manual": true
        },
        //@ts-expect-error ts2322
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: function (trigger): string {
        let eventData: TiltifyMilestoneReachedEventData = trigger.metadata?.eventData as TiltifyMilestoneReachedEventData;
        return eventData?.name ?? "Unknown";
    }
};