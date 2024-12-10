import {
    Firebot,
    Integration,
    IntegrationController,
    IntegrationData,
    IntegrationDefinition,
    IntegrationEvents,
    ScriptModules
} from "@crowbartools/firebot-custom-scripts-types";
import { TypedEmitter } from "tiny-typed-emitter";
import { JsonDB } from "node-json-db";
//import { JsonDB, Config as JsonDBConfig } from "node-json-db";
import axios from "axios";

import { TiltifyEventSource } from "./events/tiltify-event-source";
import { TiltifyDonationEventData } from "./events/donation-event-data";
import { TiltifyMilestoneReachedEventData } from "./events/milestone-reached-event-data";
import { 
    TILTIFY_EVENT_SOURCE_ID, 
    TILTIFY_DONATION_EVENT_ID, 
    TILTIFY_MILESTONE_EVENT_ID 
} from "./constants";

import * as Variables  from "./variables";

import { RewardFilter } from "./filters/reward-filter";
import { PollOptionFilter } from "./filters/poll-option-filter";
import { ChallengeFilter } from "./filters/challenge-filter";

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
import { ReplaceVariable } from "@crowbartools/firebot-custom-scripts-types/types/modules/replace-variable-manager";

const packageInfo = require("../package.json");

let logger: ScriptModules["logger"];
let eventManager: ScriptModules["eventManager"];
let integrationManager: ScriptModules["integrationManager"];
let db: JsonDB;

type TiltifySettings = {
    integrationSettings: {
        pollInterval: number;
    }
    campaignSettings: {
        campaignId: string;
    }
}

const integrationDefinition: IntegrationDefinition<TiltifySettings> = {
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
            tokenHost: "https://v5api.tiltify.com",
            authorizePath: "/oauth/authorize",
            tokenPath: "/oauth/token"
        },
        autoRefreshToken: true,
        scopes: "public"
    }
};

class IntegrationEventEmitter extends TypedEmitter<IntegrationEvents> {}

class TiltifyIntegration
    extends IntegrationEventEmitter
    implements IntegrationController<TiltifySettings> {
    timeout: NodeJS.Timeout;
    connected = false;

    constructor() {
        super();
        this.timeout = null;
        this.connected = false;
    }

    init() { }

    link() { }
    unlink() { }

    async connect(integrationData: IntegrationData) {
        // Get the saved access token
        let token = integrationManager.getIntegrationDefinitionById("tiltify")?.auth?.access_token;
        // Check whether the token is still valid, and if needed, refresh it. 
        if (await validateToken(token) !== true) {
            logger.debug("Tiltify : Token invalid. Refreshing token. ");
            token = await this.refreshToken();
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
        logger.debug("Tiltify: Campaign Rewards: ", rewardsInfo.map((re) => `
ID: ${re.id}
Name: ${re.name}
Amount: $${re.amount.value}
Active: ${re.active}`).join("\n"));

        // Populate info about the Milestones. 
        // This is gonna update to reflect the activation and possible new Milestones. 
        let milestonesInfo: TiltifyMilestone[] = await getMilestones(token, campaignId);
        logger.debug("Tiltify: Campaign Milestones: ", milestonesInfo.map((mi) => `
ID: ${mi.id}
Name: ${mi.name}
Amount: $${mi.amount.value}
Active: ${mi.active}
Reached: ${mi.reached}`).join("\n"));
        // Load saved milestones if any
        // They are saved to keep memory of which milestones have previously been reached so we know what events to trigger
        let savedMilestones: TiltifyMilestone[]
        try {
            savedMilestones = await db.getData(`/tiltify/${campaignId}/milestones`);
        } catch {
            savedMilestones = [];
        }

        milestonesInfo.forEach((milestone: TiltifyMilestone) => {
            // Check if loaded milestone has been reached
            milestone.reached = Number(campaignInfo?.amount_raised?.value ?? 0) >= Number(milestone.amount.value);
            // Checked the saved value for the milestone
            let savedMilestone: TiltifyMilestone = savedMilestones.find((mi: TiltifyMilestone) => mi.id == milestone.id);
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
        db.push(`/tiltify/${campaignId}/milestones`, milestonesInfo);

        // This is the loop that updates. We register it now, but it's gonna update asynchronously
        this.timeout = setInterval(async () => {
            let token = integrationManager.getIntegrationDefinitionById("tiltify")?.auth?.access_token;
            // Check whether the token is still valid, and if needed, refresh it. 
            if (await validateToken(token) !== true) {
                logger.debug("Tiltify : Token invalid. Refreshing token. ");
                token = await this.refreshToken();
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
                lastDonationDate = await db.getData(`/tiltify/${campaignId}/lastDonationDate`);
            } catch (e) {
                logger.debug(`Tiltify : Couldn't find the last donation date in campaign ${campaignId}. `);
                lastDonationDate = null;
            }

            // Loading the IDs of known donations for this campaign
            let ids: string[] = [];
            try {
                ids = await db.getData(`/tiltify/${campaignId}/ids`);
            } catch (e) {
                logger.debug(`Tiltify : No donations saved for campaign ${campaignId}. Initializing database. `);
                db.push(`/tiltify/${campaignId}/ids`, []);
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
                let matchingreward: TiltifyCampaignReward = rewardsInfo.find(ri => ri.id == donation.reward_id);
                if(!matchingreward) {
                    rewardsInfo = await fetchRewards(token, campaignId);
                    matchingreward = rewardsInfo.find(ri => ri.id == donation.reward_id);
                }
                // FIXME : Rewards contain info about quantity remaining. We should update that when a donation comes in claiming a reward. 

                // Update the last donation date to the current one. 
                lastDonationDate = donation.completed_at;

                // Extract the info to populate a Firebot donation event. 
                let eventDetails: TiltifyDonationEventData = {
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
            db.push(`/tiltify/${campaignId}/ids`, ids);
            db.push(`/tiltify/${campaignId}/lastDonationDate`, lastDonationDate);

            // Check for milestones reached
            savedMilestones = await db.getData(`/tiltify/${campaignId}/milestones`);
            let milestoneTriggered: boolean = false;
            // FIXME : Technically, foreach isn't supposed to take an async function, but that's necessary to be able to await inside. What to do ? 
            savedMilestones.forEach( (milestone: TiltifyMilestone) =>{
                // Check if milestone has been reached
                if( !milestone.reached && Number(campaignInfo?.amount_raised?.value ?? 0) >= Number(milestone.amount.value) ) {
                    milestone.reached = true;
                    milestoneTriggered = true;
                    // Extract the info to populate a Firebot milestone event. 
                    let eventDetails: TiltifyMilestoneReachedEventData = {
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
            if ( milestoneTriggered ) {
                // if we triggered a milestone, we want to reload the milestones from tiltify. 
                milestonesInfo = await getMilestones(token, campaignId);
                milestonesInfo.forEach((milestone: TiltifyMilestone) => {
                    // Check if loaded milestone has been reached
                    milestone.reached = Number(campaignInfo?.amount_raised?.value ?? 0) >= Number(milestone.amount.value);
                    // Checked the saved value for the milestone
                    let savedMilestone: TiltifyMilestone = savedMilestones.find((mi: TiltifyMilestone) => mi.id == milestone.id);
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
                milestonesInfo = savedMilestones
            }
            // Save the milestones
            db.push(`/tiltify/${campaignId}/milestones`, milestonesInfo);

        }, (integrationData.userSettings.integrationSettings.pollInterval as number) * 1000);

        // We are now connected
        this.emit("connected", integrationDefinition.id);
        this.connected = true;
    }

    // Disconnect the Integration
    disconnect() {
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
    async refreshToken(): Promise<string> {
        try {
            const auth = integrationManager.getIntegrationDefinitionById("tiltify")?.auth;
            // @ts-ignore
            const authProvider = integrationDefinition.authProviderDetails;

            if (auth != null) {
                const url = `${authProvider.auth.tokenHost}${authProvider.auth.tokenPath}?client_id=${authProvider.client.id}&client_secret=${authProvider.client.secret}&grant_type=refresh_token&refresh_token=${auth.refresh_token}&scope=${authProvider.scopes}`;
                const response = await axios.post(url);

                if (response.status === 200) {
                    const int = integrationManager.getIntegrationById("tiltify");
                    // @ts-ignore
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
}

const integrationConfig: Integration<TiltifySettings> = {
    definition: integrationDefinition,
    integration: new TiltifyIntegration()
};

function isIntegrationConfigValid(): boolean {
    const integration = integrationManager.getIntegrationDefinitionById("tiltify");

    return integration?.userSettings?.campaignSettings?.campaignId != null
        && integration?.userSettings?.campaignSettings?.campaignId !== "";
}

const script: Firebot.CustomScript = {
    getScriptManifest: () => {
        return {
            name: "Tiltify Integration",
            description: packageInfo.description,
            author: packageInfo.author,
            version: packageInfo.version,
            firebotVersion: "5",
            startupOnly: true
        };
    },
    getDefaultParameters: () => ({ }),
    run: ({ modules }) => {
        ({ logger, eventManager, integrationManager } = modules);
        const { replaceVariableManager, frontendCommunicator, eventFilterManager } = modules;

        logger.info(`Loading Tiltify integration...`);
        db = new JsonDB(modules.path.join(SCRIPTS_DIR, '..', 'db', 'tiltify.db'), true, false, "/");
        // Returns error "TS2459: Module '"node-json-db"' declares 'Config' locally, but it is not exported." not sure why

        integrationManager.registerIntegration(integrationConfig);

        eventManager.registerEventSource(TiltifyEventSource);

        // Register all variables of the integration module
        let variables: ReplaceVariable[] = Object.values(Variables);
        for (const variable of variables) 
            replaceVariableManager.registerReplaceVariable(variable);

        eventFilterManager.registerFilter(RewardFilter);
        eventFilterManager.registerFilter(PollOptionFilter);
        eventFilterManager.registerFilter(ChallengeFilter);

        frontendCommunicator.onAsync("get-tiltify-rewards", async () => {
            if (!isIntegrationConfigValid()) {
                throw new Error("Tiltify integration not found or not configured");
            }

            const integration = integrationManager.getIntegrationDefinitionById("tiltify");
            const accessToken = integration.auth?.access_token;
            const campaignId = integration.userSettings.campaignSettings.campaignId;

            return await fetchRewards(accessToken, campaignId);
        });

        frontendCommunicator.onAsync("get-tiltify-poll-options", async () => {
            if (!isIntegrationConfigValid()) {
                throw new Error("Tiltify integration not found or not configured");
            }

            const integration = integrationManager.getIntegrationDefinitionById("tiltify");
            const accessToken = integration.auth?.access_token;
            const campaignId = integration.userSettings.campaignSettings.campaignId;

            return await fetchPollOptions(accessToken, campaignId);
        });

        frontendCommunicator.onAsync("get-tiltify-challenges", async () => {
            if (!isIntegrationConfigValid()) {
                throw new Error("Tiltify integration not found or not configured");
            }

            const integration = integrationManager.getIntegrationDefinitionById("tiltify");
            const accessToken = integration.auth?.access_token;
            const campaignId = integration.userSettings.campaignSettings.campaignId;

            return await fetchTargets(accessToken, campaignId);
        });

        logger.info("Tiltify integration loaded");
    },
    stop: () => {
        logger.info("Unloading Tiltify integration...");

        logger.info("Tiltify integration unloaded");
    }
};

export default script;