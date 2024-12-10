import { ReplaceVariable } from "@crowbartools/firebot-custom-scripts-types/types/modules/replace-variable-manager";
import {
    TILTIFY_EVENT_SOURCE_ID,
    TILTIFY_MILESTONE_EVENT_ID
} from "../../constants";
import { TiltifyMilestoneReachedEventData } from "../../events/milestone-reached-event-data";

export const TiltifyMilestoneAmountVariable: ReplaceVariable = {
    definition: {
        handle: "tiltifyMilestoneAmount",
        description: "The amount connected to reach the Tiltify Milestone",
        triggers: {
            "event": [
                `${TILTIFY_EVENT_SOURCE_ID}:${TILTIFY_MILESTONE_EVENT_ID}`
            ],
            "manual": true
        },
        possibleDataOutput: ["number"]
    },
    evaluator: function (trigger): number {
        let eventData: TiltifyMilestoneReachedEventData = trigger.metadata?.eventData as TiltifyMilestoneReachedEventData;
        return eventData?.amount ?? 0;
    }
};