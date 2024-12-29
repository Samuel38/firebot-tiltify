import { ReplaceVariable } from "@crowbartools/firebot-custom-scripts-types/types/modules/replace-variable-manager";
import { OutputDataType } from "@shared/variable-constants";

export const TiltifyMilestonesGet: ReplaceVariable = {
    definition: {
        handle: "tiltifyMilestones",
        description: "Returns an array of the Tiltify campaign's milestones",
        usage: 'tiltifyMilestones["Campaign ID"]',
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: function (trigger, campaign_id = "") {
        return [];
    }
};