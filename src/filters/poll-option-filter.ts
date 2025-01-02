import { EventFilter } from "@crowbartools/firebot-custom-scripts-types/types/modules/event-filter-manager";
import {
    TILTIFY_EVENT_SOURCE_ID,
    TILTIFY_DONATION_EVENT_ID
} from "../constants";
import { TiltifyPollOption } from "../types/poll";

export const PollOptionFilter: EventFilter = {
    id: "tcu:poll-option-id",
    name: "Tiltify Poll Option",
    description: "Filter by the Tiltify poll option.",
    events: [
        {
            eventSourceId: TILTIFY_EVENT_SOURCE_ID,
            eventId: TILTIFY_DONATION_EVENT_ID
        }
    ],
    comparisonTypes: ["is", "is not"],
    valueType: "preset",
    predicate: (filterSettings, eventData) => {
        const pollOptionId = eventData.eventMeta.pollOptionId;

        switch (filterSettings.comparisonType) {
            case "is": {
                return Promise.resolve(pollOptionId === filterSettings.value);
            }
            case "is not": {
                return Promise.resolve(pollOptionId !== filterSettings.value);
            }
            default: {
                return Promise.resolve(false);
            }
        }
    },
    presetValues: async (backendCommunicator) => {
        return (
            await backendCommunicator.fireEventAsync("get-tiltify-poll-options")
        ).map((r: TiltifyPollOption) => ({
            value: r.id,
            display: r.name
        }));
    }
};
