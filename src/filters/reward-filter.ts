import { EventFilter } from "@crowbartools/firebot-custom-scripts-types/types/modules/event-filter-manager";
import {
    TILTIFY_EVENT_SOURCE_ID,
    TILTIFY_DONATION_EVENT_ID
} from "../constants";
import { TiltifyCampaignReward } from "../types/campaign-reward";

export const RewardFilter: EventFilter = {
    id: "tcu:reward-id",
    name: "Tiltify Reward",
    description: "Filter by the Tiltify reward.",
    events: [
        {
            eventSourceId: TILTIFY_EVENT_SOURCE_ID,
            eventId: TILTIFY_DONATION_EVENT_ID
        }
    ],
    comparisonTypes: ["is", "is not"],
    valueType: "preset",
    predicate: (filterSettings, eventData) => {
        const rewardId = eventData.eventMeta.rewardId;

        switch (filterSettings.comparisonType) {
            case "is": {
                return Promise.resolve(rewardId === filterSettings.value);
            }
            case "is not": {
                return Promise.resolve(rewardId !== filterSettings.value);
            }
            default: {
                return Promise.resolve(false);
            }
        }
    },
    presetValues: async (backendCommunicator) => {
        return (
            await backendCommunicator.fireEventAsync("get-tiltify-rewards")
        ).map((r: TiltifyCampaignReward) => ({
            value: r.id,
            display: r.name
        }));
    }
};
