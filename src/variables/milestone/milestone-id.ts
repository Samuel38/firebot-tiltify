import { ReplaceVariable } from "@crowbartools/firebot-custom-scripts-types/types/modules/replace-variable-manager";
import { OutputDataType } from "@shared/variable-constants";
import {
    TILTIFY_EVENT_SOURCE_ID,
    TILTIFY_MILESTONE_EVENT_ID
} from "@/constants";
import { TiltifyMilestoneReachedEventData } from "@/events/milestone-reached-event-data";

export const TiltifyMilestoneIdVariable: ReplaceVariable = {
    definition: {
        handle: "tiltifyMilestoneId",
        description: "The Id of the Tiltify Milestone reached",
        triggers: {
            "event": [
                `${TILTIFY_EVENT_SOURCE_ID}:${TILTIFY_MILESTONE_EVENT_ID}`
            ],
            "manual": true
        },
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: function (trigger): string {
        const eventData: TiltifyMilestoneReachedEventData = trigger.metadata?.eventData as TiltifyMilestoneReachedEventData;
        return eventData?.id ?? "-1";
    }
};