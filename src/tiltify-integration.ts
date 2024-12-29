import {
    IntegrationEvents,
    IntegrationController,
    IntegrationData,
    IntegrationDefinition,
    LinkData,
    AuthDetails
} from "@crowbartools/firebot-custom-scripts-types";

import { ReplaceVariable } from "@crowbartools/firebot-custom-scripts-types/types/modules/replace-variable-manager";
import { EventFilter } from "@crowbartools/firebot-custom-scripts-types/types/modules/event-filter-manager";

import { JsonDB } from "node-json-db";
import axios from "axios";

import {
    fetchRewards,
    fetchPollOptions,
    fetchTargets,
    getCampaign,
    getCause,
    getCampaignDonations,
    validateToken,
    getMilestones
} from "./tiltify-remote";
import { TiltifyCampaign } from "./types/campaign";
import { TiltifyCampaignReward } from "./types/campaign-reward";
import { TiltifyMilestone } from "./types/milestone";

import { TiltifyDonationEventData } from "./events/donation-event-data";
import { TiltifyMilestoneReachedEventData } from "./events/milestone-reached-event-data";
import { TiltifyEventSource } from "./events/tiltify-event-source";

import * as Variables from "./variables";
import * as EventFilters from "./filters";

import {
    TILTIFY_EVENT_SOURCE_ID,
    TILTIFY_DONATION_EVENT_ID,
    TILTIFY_MILESTONE_EVENT_ID
} from "./constants";

import {
    logger,
    integrationManager,
    variableManager,
    eventManager,
    eventFilterManager,
    frontendCommunicator
} from "@shared/firebot-modules";

const path = require("path");

export type TiltifySettings = {
    integrationSettings: {
        pollInterval: number;
    }
    campaignSettings: {
        campaignId: string;
    }
}

type TiltifyIntegrationEvents = IntegrationEvents

export class TiltifyIntegration extends IntegrationController<TiltifySettings, TiltifyIntegrationEvents> {
    readonly dbPath: string;

    timeout: NodeJS.Timeout;
    connected = false;
    private db: JsonDB;

    constructor() {
        super();
        this.timeout = null;
        this.connected = false;
        this.dbPath = path.join(SCRIPTS_DIR, '..', 'db', 'tiltify.db');
        this.db = new JsonDB(this.dbPath, true, false, "/");
        // Returns error "TS2459: Module '"node-json-db"' declares 'Config' locally, but it is not exported." not sure why
    }

    init(linked: boolean, integrationData: IntegrationData) {
        logger.info(`Initializing Tiltify integration...`);
        // Register all events
        eventManager.registerEventSource(TiltifyEventSource);

        // Register all variables of the integration module
        const variables: ReplaceVariable[] = Object.values(Variables);
        for (const variable of variables) {
            variableManager.registerReplaceVariable(variable);
        }

        // Register all event filters of the integration module
        const filters: EventFilter[] = Object.values(EventFilters);
        for (const filter of filters) {
            eventFilterManager.registerFilter(filter);
        }


        frontendCommunicator.onAsync("get-tiltify-rewards", async () => {
            if (!TiltifyIntegration.isIntegrationConfigValid()) {
                throw new Error("Tiltify integration not found or not configured");
            }

            const integration = integrationManager.getIntegrationDefinitionById<TiltifySettings>("tiltify");
            const authData: LinkData = await integrationManager.getAuth("tiltify");
            if (authData === null || "auth" in authData === false) {
                return;
            }
            const accessToken = authData.auth?.access_token;
            const campaignId = integration.userSettings.campaignSettings.campaignId;

            return await fetchRewards(accessToken, campaignId);
        });

        frontendCommunicator.onAsync("get-tiltify-poll-options", async () => {
            if (!TiltifyIntegration.isIntegrationConfigValid()) {
                throw new Error("Tiltify integration not found or not configured");
            }

            const integration = integrationManager.getIntegrationDefinitionById<TiltifySettings>("tiltify");
            const authData = await integrationManager.getAuth("tiltify");
            if (authData === null || "auth" in authData === false) {
                return;
            }
            const accessToken = authData.auth?.access_token;
            const campaignId = integration.userSettings.campaignSettings.campaignId;

            return await fetchPollOptions(accessToken, campaignId);
        });

        frontendCommunicator.onAsync("get-tiltify-challenges", async () => {
            if (!TiltifyIntegration.isIntegrationConfigValid()) {
                throw new Error("Tiltify integration not found or not configured");
            }

            const integration = integrationManager.getIntegrationDefinitionById<TiltifySettings>("tiltify");
            const authData = await integrationManager.getAuth("tiltify");
            if (authData === null || "auth" in authData === false) {
                return;
            }
            const accessToken = authData.auth?.access_token;
            const campaignId = integration.userSettings.campaignSettings.campaignId;

            return await fetchTargets(accessToken, campaignId);
        });

        integrationManager.on("token-refreshed", (integrationId: string, updatedToken: AuthDetails) => {
            if (integrationId === "tiltify") {
                logger.debug("Tiltify token refreshed");
            }
        });

        logger.info("Tiltify integration loaded");
    }

    link(linkData: LinkData) {
        // Link is when we have received the token for the first time.
        // Once Linked, we're allowed to connect
        logger.info("Tiltify integration linked.");
    }
    unlink() {
        logger.info("Tiltify integration unlinked.");
    }

    async connect(integrationData: IntegrationData) {
        // Get the saved access token
        const integrationDefinition = integrationManager.getIntegrationDefinitionById<TiltifySettings>("tiltify");
        const authData = await integrationManager.getAuth("tiltify");
        if (authData === null || "auth" in authData === false) {
            return;
        }
        let token = authData.auth?.access_token;
        // Check whether the token is still valid, and if needed, refresh it.
        if (await validateToken(token) !== true) {
            logger.debug("Tiltify : Token invalid. Refreshing token. ");
            token = await this.refreshToken("tiltify");
        }
        // If the refreshing fails, disconnect tiltify.
        if (token == null || token === "") {
            logger.debug("Tiltify : Refreshing token failed. Disconnecting Tiltify. ");
            this.emit("disconnected", integrationDefinition.id);
            this.connected = false;
            return;
        }
        // Disconnect if the settings for the integration aren't valid.
        if (integrationData.userSettings == null || integrationData.userSettings.campaignSettings == null) {
            logger.debug("Tiltify : Integration settings invalid. Disconnecting Tiltify. ");
            this.emit("disconnected", integrationDefinition.id);
            this.connected = false;
            return;
        }

        // Checking the campaign Id is present.
        const campaignId = integrationData?.userSettings?.campaignSettings?.campaignId as string;
        if (campaignId == null || campaignId === "") {
            logger.debug("Tiltify : No campaign Id. Disconnecting Tiltify. ");
            this.emit("disconnected", integrationDefinition.id);
            this.connected = false;
            return;
        }

        // Populate information about the campaign. This is mandatory to have. If not, we have a problem.
        // This contains the money raised, so it will update
        let campaignInfo: TiltifyCampaign = await getCampaign(token, campaignId);
        if (campaignInfo?.cause_id == null || campaignInfo.cause_id === "") {
            logger.debug(`Tiltify : information about campaign ${campaignId} couldn't be retrieved or are invalid. Disconnecting Tiltify. `);
            this.emit("disconnected", integrationDefinition.id);
            this.connected = false;
            return;
        }

        // Populate info about the cause the campaign is collecting for. This should not change
        const causeInfo = await getCause(token, campaignInfo.cause_id);

        // Populate info about the rewards offered.
        // This is gonna update to reflect the quantities available and offered and possible new rewards.
        let rewardsInfo: TiltifyCampaignReward[] = await fetchRewards(token, campaignId);
        logger.debug("Tiltify: Campaign Rewards: ", rewardsInfo.map(re => `
ID: ${re.id}
Name: ${re.name}
Amount: $${re.amount.value}
Active: ${re.active}`).join("\n"));

        // Populate info about the Milestones.
        // This is gonna update to reflect the activation and possible new Milestones.
        let milestonesInfo: TiltifyMilestone[] = await getMilestones(token, campaignId);
        logger.debug("Tiltify: Campaign Milestones: ", milestonesInfo.map(mi => `
ID: ${mi.id}
Name: ${mi.name}
Amount: $${mi.amount.value}
Active: ${mi.active}
Reached: ${mi.reached}`).join("\n"));
        // Load saved milestones if any
        // They are saved to keep memory of which milestones have previously been reached so we know what events to trigger
        let savedMilestones: TiltifyMilestone[];
        try {
            savedMilestones = await this.db.getData(`/tiltify/${campaignId}/milestones`);
        } catch {
            savedMilestones = [];
        }

        milestonesInfo.forEach((milestone: TiltifyMilestone) => {
            // Check if loaded milestone has been reached
            milestone.reached = Number(campaignInfo?.amount_raised?.value ?? 0) >= Number(milestone.amount.value);
            // Checked the saved value for the milestone
            const savedMilestone: TiltifyMilestone = savedMilestones.find((mi: TiltifyMilestone) => mi.id === milestone.id);
            // If the milestone was unknown
            if (!savedMilestone) {
                // Set reached as false so the event triggers
                milestone.reached = false;
                logger.debug(`Tiltify: Campaign Milestone ${milestone.name} is new. `);
            } else if (milestone.reached && !savedMilestone.reached) {
                // If the saved milestone was unreached, we want to make sure that if it's currently reached, we trip the event too
                milestone.reached = false;
                logger.debug(`Tiltify: Campaign Milestone ${milestone.name} is has been reached while Tiltify was offline. Ensuring the event triggers. `);
            }
        });
        this.db.push(`/tiltify/${campaignId}/milestones`, milestonesInfo);

        // This is the loop that updates. We register it now, but it's gonna update asynchronously
        this.timeout = setInterval(async () => {
            const integrationDefinition = integrationManager.getIntegrationDefinitionById<TiltifySettings>("tiltify");
            const authData = await integrationManager.getAuth("tiltify");
            if (authData === null || "auth" in authData === false) {
                return;
            }
            let token = authData.auth?.access_token;
            // Check whether the token is still valid, and if needed, refresh it.
            if (await validateToken(token) !== true) {
                logger.debug("Tiltify : Token invalid. Refreshing token. ");
                token = await this.refreshToken("tiltify");
            }
            // If the refreshing fails, disconnect tiltify.
            if (token == null || token === "") {
                logger.debug("Tiltify : Refreshing token failed. Disconnecting Tiltify. ");
                this.emit("disconnected", integrationDefinition.id);
                this.connected = false;
                return;
            }

            // Load the last donation date if available
            let lastDonationDate: string;
            try {
                lastDonationDate = await this.db.getData(`/tiltify/${campaignId}/lastDonationDate`);
            } catch (e) {
                logger.debug(`Tiltify : Couldn't find the last donation date in campaign ${campaignId}. `);
                lastDonationDate = null;
            }

            // Loading the IDs of known donations for this campaign
            let ids: string[] = [];
            try {
                ids = await this.db.getData(`/tiltify/${campaignId}/ids`);
            } catch (e) {
                logger.debug(`Tiltify : No donations saved for campaign ${campaignId}. Initializing database. `);
                this.db.push(`/tiltify/${campaignId}/ids`, []);
            }

            // Acquire the donations since the last saved from Tiltify and sort them by date.
            const donations = await getCampaignDonations(token, campaignId, lastDonationDate);
            const sortedDonations = donations.sort((a, b) => Date.parse(a.completed_at) - Date.parse(b.completed_at));

            // Process each donation
            // FIXME : Technically, foreach isn't supposed to take an async function, but that's necessary to be able to await inside. What to do ?
            sortedDonations.forEach(async (donation) => {
                // Don't process it if we already have registered it.
                if (ids.includes(donation.id)) {
                    return;
                }

                // A donation has happened. Reload campaign info to update collected amounts
                campaignInfo = await getCampaign(token, campaignId);
                // If we don't know the reward, reload rewards and retry.
                let matchingreward: TiltifyCampaignReward = rewardsInfo.find(ri => ri.id === donation.reward_id);
                if (!matchingreward) {
                    rewardsInfo = await fetchRewards(token, campaignId);
                    matchingreward = rewardsInfo.find(ri => ri.id === donation.reward_id);
                }
                // FIXME : Rewards contain info about quantity remaining. We should update that when a donation comes in claiming a reward.

                // Update the last donation date to the current one.
                lastDonationDate = donation.completed_at;

                // Extract the info to populate a Firebot donation event.
                const eventDetails: TiltifyDonationEventData = {
                    from: donation.donor_name,
                    donationAmount: Number(donation.amount.value),
                    rewardId: donation.reward_id,
                    rewardName: matchingreward?.name ?? "",
                    comment: donation.donor_comment,
                    pollOptionId: donation.poll_option_id,
                    challengeId: donation.target_id,
                    campaignInfo: {
                        name: campaignInfo?.name,
                        cause: causeInfo?.name,
                        causeLegalName: causeInfo?.name,
                        fundraisingGoal: Number(campaignInfo?.goal?.value ?? 0),
                        originalGoal: Number(campaignInfo?.original_goal?.value ?? 0),
                        supportingRaised: Number(campaignInfo?.total_amount_raised?.value ?? 0) - Number(campaignInfo?.amount_raised?.value ?? 0),
                        amountRaised: Number(campaignInfo?.amount_raised?.value ?? 0),
                        totalRaised: Number(campaignInfo?.total_amount_raised?.value ?? 0)
                    }
                };
                logger.info(`Tiltify : 
Donation from ${eventDetails.from} for $${eventDetails.donationAmount}. 
Total raised : $${eventDetails.campaignInfo.amountRaised}
Reward: ${eventDetails.rewardName ?? eventDetails.rewardId}
Campaign : ${eventDetails.campaignInfo.name}
Cause : ${eventDetails.campaignInfo.cause}`);
                // Trigger the event
                eventManager.triggerEvent(TILTIFY_EVENT_SOURCE_ID, TILTIFY_DONATION_EVENT_ID, eventDetails, false);
                // Add the Id to the list of events processed
                ids.push(donation.id);
            });
            // Save the Ids of the events processed and the time of the last donation made
            this.db.push(`/tiltify/${campaignId}/ids`, ids);
            this.db.push(`/tiltify/${campaignId}/lastDonationDate`, lastDonationDate);

            // Check for milestones reached
            savedMilestones = await this.db.getData(`/tiltify/${campaignId}/milestones`);
            let milestoneTriggered = false;
            // FIXME : Technically, foreach isn't supposed to take an async function, but that's necessary to be able to await inside. What to do ?
            savedMilestones.forEach((milestone: TiltifyMilestone) => {
                // Check if milestone has been reached
                if (!milestone.reached && Number(campaignInfo?.amount_raised?.value ?? 0) >= Number(milestone.amount.value)) {
                    milestone.reached = true;
                    milestoneTriggered = true;
                    // Extract the info to populate a Firebot milestone event.
                    const eventDetails: TiltifyMilestoneReachedEventData = {
                        id: milestone.id,
                        name: milestone.name,
                        amount: Number(milestone.amount.value),
                        campaignInfo: {
                            name: campaignInfo?.name,
                            cause: causeInfo?.name,
                            causeLegalName: causeInfo?.name,
                            fundraisingGoal: Number(campaignInfo?.goal?.value ?? 0),
                            originalGoal: Number(campaignInfo?.original_goal?.value ?? 0),
                            supportingRaised: Number(campaignInfo?.total_amount_raised?.value ?? 0) - Number(campaignInfo?.amount_raised?.value ?? 0),
                            amountRaised: Number(campaignInfo?.amount_raised?.value ?? 0),
                            totalRaised: Number(campaignInfo?.total_amount_raised?.value ?? 0)
                        }
                    };
                    logger.info(`Tiltify : 
Milestone ${eventDetails.name} reached. 
Target amount : $${eventDetails.amount}
Reached amount: $${eventDetails.campaignInfo.amountRaised}
Campaign: ${eventDetails.campaignInfo.name}
Cause: ${eventDetails.campaignInfo.cause}`);
                    // Trigger the event
                    eventManager.triggerEvent(TILTIFY_EVENT_SOURCE_ID, TILTIFY_MILESTONE_EVENT_ID, eventDetails, false);
                }
            });
            if (milestoneTriggered) {
                // if we triggered a milestone, we want to reload the milestones from tiltify.
                milestonesInfo = await getMilestones(token, campaignId);
                milestonesInfo.forEach((milestone: TiltifyMilestone) => {
                    // Check if loaded milestone has been reached
                    milestone.reached = Number(campaignInfo?.amount_raised?.value ?? 0) >= Number(milestone.amount.value);
                    // Checked the saved value for the milestone
                    const savedMilestone: TiltifyMilestone = savedMilestones.find((mi: TiltifyMilestone) => mi.id === milestone.id);
                    // If the milestone was unknown
                    if (!savedMilestone) {
                        // Set reached as false so the event triggers
                        milestone.reached = false;
                        logger.debug(`Tiltify: Campaign Milestone ${milestone.name} is new. `);
                    } else if (milestone.reached && !savedMilestone.reached) {
                        // If the saved milestone was unreached, we want to make sure that if it's currently reached, we trip the event too
                        milestone.reached = false;
                        logger.debug(`Tiltify: Campaign Milestone ${milestone.name} has updated and isn't reached anymore. Ensuring the event triggers. `);
                    }
                });
            } else {
                milestonesInfo = savedMilestones;
            }
            // Save the milestones
            this.db.push(`/tiltify/${campaignId}/milestones`, milestonesInfo);

        }, (integrationData.userSettings.integrationSettings.pollInterval as number) * 1000);

        // We are now connected
        this.emit("connected", integrationDefinition.id);
        this.connected = true;
    }

    // Disconnect the Integration
    disconnect() {
        const integrationDefinition = integrationManager.getIntegrationDefinitionById<TiltifySettings>("tiltify");
        // Clear the event processing loop
        if (this.timeout) {
            clearInterval(this.timeout);
        }
        // Disconnect
        this.connected = false;
        this.emit("disconnected", integrationDefinition.id);
    }

    // Update the user settings
    onUserSettingsUpdate(integrationData: IntegrationData) {
        // If we're connected, disconnect
        if (this.connected) {
            this.disconnect();
        }
        // Reconnect
        this.connect(integrationData);
    }

    // Doing this here because of a bug in Firebot where it isn't refreshing automatically
    async refreshToken(integrationId: string): Promise<string> {
        // Checks if the IntegrationManager has a refreshToken Method and uses it if true.
        if (typeof integrationManager.refreshToken === 'function') {
            const authData = await integrationManager.refreshToken("tiltify");
            return authData.access_token;
        }
        // If not, we have to implement it ourselves
        try {
            const integrationDefinition = integrationManager.getIntegrationDefinitionById<TiltifySettings>(integrationId);
            if (integrationDefinition.linkType !== "auth") {
                return;
            }
            const auth = integrationDefinition.auth;
            const authProvider = integrationDefinition.authProviderDetails;

            if (auth != null) {
                const url = `${authProvider.auth.tokenHost}${authProvider.auth.tokenPath}?client_id=${authProvider.client.id}&client_secret=${authProvider.client.secret}&grant_type=refresh_token&refresh_token=${auth.refresh_token}&scope=${authProvider.scopes}`;
                const response = await axios.post(url);

                if (response.status === 200) {
                    const int = integrationManager.getIntegrationById<TiltifySettings>(integrationId);
                    integrationManager.saveIntegrationAuth(int, response.data);

                    return response.data.access_token;
                }
            }
        } catch (error) {
            logger.error("Unable to refresh Tiltify token");
            logger.debug(error);
        }

        return;
    }

    static isIntegrationConfigValid(): boolean {
        const integrationDefinition = integrationManager.getIntegrationDefinitionById<TiltifySettings>("tiltify");

        return integrationDefinition?.userSettings?.campaignSettings?.campaignId != null
            && integrationDefinition?.userSettings?.campaignSettings?.campaignId !== "";
    }
}

export const integrationDefinition: IntegrationDefinition<TiltifySettings> = {
    id: "tiltify",
    name: "Tiltify",
    description: "Tiltify donation events",
    connectionToggle: true,
    configurable: true,
    settingCategories: {
        integrationSettings: {
            title: "Integration Settings",
            settings: {
                pollInterval: {
                    title: "Poll Interval",
                    type: "number",
                    default: 5,
                    description: "How often to poll Tiltify for new donations (in seconds)."
                }
            }
        },
        campaignSettings: {
            title: "Campaign Settings",
            settings: {
                campaignId: {
                    title: "Campaign ID",
                    type: "string",
                    description: "ID of the running campaign to fetch donations for.",
                    default: ""
                }
            }
        }
    },
    linkType: "auth",
    authProviderDetails: {
        id: "tiltify",
        name: "Tiltify",
        redirectUriHost: "localhost",
        client: {
            id: "55ee54fe15f8ee41fac947b1123ba4ea134b31de112b947c5f1afcffec471337",
            secret: "b3fa00a003b5b1197d26ccc181d43801dd854906883b7279a386368a44f36293"
        },
        auth: {
            // @ts-ignore
            type: "code",
            tokenHost: "https://v5api.tiltify.com", // Move to authorizeHost ? tokenHost is used as default
            authorizePath: "/oauth/authorize",
            tokenPath: "/oauth/token" // To be removed when removing token flow
        },
        autoRefreshToken: true,
        scopes: "public"
    }
};