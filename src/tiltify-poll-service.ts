import { TypedEmitter } from "tiny-typed-emitter";
import {
    logger
} from "@shared/firebot-modules";

interface ConnectionEvents {
    connected: VoidFunction;
    disconnected: VoidFunction;
}

class TiltifyPollService extends TypedEmitter<ConnectionEvents> {
    private pollId: NodeJS.Timeout;
    private pollingInterval = 15000;

    setPollingInterval(interval:number) {
        this.pollingInterval = interval;
        // If polling is happening, reset the interval
        if (this.pollId != null) {
            clearInterval(this.pollId);
            this.pollId = setInterval(() => this.poll(), this.pollingInterval);
        }
    }

    private clearPoll() {
        if (this.pollId != null) {
            clearInterval(this.pollId);
        }
    }

    private async poll() {
        // TODO : Poll here the data from Tiltify
    }

    async start() {
        this.clearPoll();

        this.pollId = setInterval(() => this.poll(), this.pollingInterval);

        this.emit("connected");
        logger.debug("Started polling Tiltify.");
    }

    stop() {
        this.clearPoll();
        this.emit("disconnected");
        logger.debug("Stopped polling Tiltify.");
    }
}
export const tiltifyPollService = new TiltifyPollService();