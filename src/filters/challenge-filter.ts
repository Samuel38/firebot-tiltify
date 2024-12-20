import { EventFilter } from "@crowbartools/firebot-custom-scripts-types/types/modules/event-filter-manager";
import {
    TILTIFY_EVENT_SOURCE_ID,
    TILTIFY_DONATION_EVENT_ID
} from "../constants";
import { TiltifyTarget } from "../types/target";

export const ChallengeFilter: EventFilter = {
    id: "tcu:challenge-id",
    name: "Tiltify Challenge/Target",
    description: "Filter by the Tiltify challenge/target.",
    events: [
        { eventSourceId: TILTIFY_EVENT_SOURCE_ID, eventId: TILTIFY_DONATION_EVENT_ID }
    ],
    comparisonTypes: [
        "is",
        "is not"
    ],
    valueType: "preset",
    predicate: (filterSettings, eventData) => {
        const challengeId = eventData?.eventMeta?.challengeId;

        switch (filterSettings.comparisonType) {
            case "is": {
                return Promise.resolve(challengeId === filterSettings.value);
            }
            case "is not": {
                return Promise.resolve(challengeId !== filterSettings.value);
            }
            default: {
                return Promise.resolve(false);
            }
        }
    },
    presetValues: async (backendCommunicator) => {
        return (await backendCommunicator.fireEventAsync("get-tiltify-challenges"))
            .map((r: TiltifyTarget) => ({value: r.id, display: r.name}));
    }
};