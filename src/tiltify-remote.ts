import axios from "axios";

import { TILTIFY_API_PUBLIC_BASE_URL } from "./constants";

import { TiltifyApiResponse } from "./types/shared";
import { TiltifyCampaign } from "./types/campaign";
import { TiltifyCampaignReward } from "./types/campaign-reward";
import { TiltifyCause } from "./types/cause";
import { TiltifyDonation } from "./types/donation";
import { TiltifyPoll, TiltifyPollOption } from "./types/poll";
import { TiltifyMilestone } from "./types/milestone";

import { logger } from "@shared/firebot-modules";

export async function validateToken(token: string): Promise<boolean> {
    try {
        const response = await axios.get(`${TILTIFY_API_PUBLIC_BASE_URL}/current-user`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        return response.status === 200;
    } catch (e) {
        logger.warn("Error validating Tiltify token");

        return false;
    }
}

export async function getCampaign(token: string, campaignId: string): Promise<TiltifyCampaign> {
    try {
        const response = await axios.get<TiltifyApiResponse<TiltifyCampaign>>(`${TILTIFY_API_PUBLIC_BASE_URL}/campaigns/${campaignId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data;
    } catch (e) {
        if (e.response) {
            logger.warn(`Tiltify Error : ${e.response?.data}`);
        } else {
            logger.warn("Tiltify Error : Unknown error");
        }

        return;
    }
}

export async function getCampaignDonations(token: string, campaignId: string, completedAfter: string = null): Promise<TiltifyDonation[]> {
    try {
        const url = completedAfter != null
            ? `${TILTIFY_API_PUBLIC_BASE_URL}/campaigns/${campaignId}/donations?completed_after=${completedAfter}`
            : `${TILTIFY_API_PUBLIC_BASE_URL}/campaigns/${campaignId}/donations`;

        const response = await axios.get<TiltifyApiResponse<TiltifyDonation[]>>(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status !== 200) {
            logger.warn(`Error fetching donations: ${response.status}`);
            return [];
        }

        return response.data.data;
    } catch (e) {
        if (e.response) {
            logger.warn(`Tiltify Error : ${e.response?.data}`);
        } else {
            logger.warn("Tiltify Error : Unknown error");
        }

        return [];
    }
}

export async function getCause(token: string, causeId: string): Promise<TiltifyCause> {
    try {
        const response = await axios.get<TiltifyApiResponse<TiltifyCause>>(`${TILTIFY_API_PUBLIC_BASE_URL}/causes/${causeId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data;
    } catch (e) {
        if (e.response) {
            logger.warn(`Tiltify Error : ${e.response?.data}`);
        } else {
            logger.warn("Tiltify Error : Unknown error");
        }

        return;
    }
}

export async function fetchRewards(token: string, campaignId: string): Promise<TiltifyCampaignReward[]> {
    try {
        const response = await axios.get<TiltifyApiResponse<TiltifyCampaignReward[]>>(`${TILTIFY_API_PUBLIC_BASE_URL}/campaigns/${campaignId}/rewards`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data;
    } catch (e) {
        if (e.response) {
            logger.warn(`Tiltify Error : ${e.response?.data}`);
        } else {
            logger.warn("Tiltify Error : Unknown error");
        }

        return [];
    }
}

export async function fetchPollOptions(token: string, campaignId: string): Promise<TiltifyPollOption[]> {
    try {
        const response = await axios.get<TiltifyApiResponse<TiltifyPoll[]>>(`${TILTIFY_API_PUBLIC_BASE_URL}/campaigns/${campaignId}/polls`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data.reduce<TiltifyPollOption[]>((acc, poll) => acc.concat(...poll.options), []);
    } catch (e) {
        if (e.response) {
            logger.warn(`Tiltify Error : ${e.response?.data}`);
        } else {
            logger.warn("Tiltify Error : Unknown error");
        }

        return [];
    }
}

export async function fetchTargets(token: string, campaignId: string) {
    try {
        const response = await axios.get(`${TILTIFY_API_PUBLIC_BASE_URL}/campaigns/${campaignId}/targets`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data;
    } catch (e) {
        if (e.response) {
            logger.warn(`Tiltify Error : ${e.response?.data}`);
        } else {
            logger.warn("Tiltify Error : Unknown error");
        }

        return [];
    }
}

export async function getMilestones(token: string, campaignId: string) : Promise<TiltifyMilestone[]> {
    try {
        const response = await axios.get<TiltifyApiResponse<TiltifyMilestone[]>>(
            `${TILTIFY_API_PUBLIC_BASE_URL}/campaigns/${campaignId}/milestones`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        return response.data.data;

    } catch (e) {
        if (e.response) {
            logger.warn(`Tiltify Error : ${e.response?.data}`);
        } else {
            logger.warn("Tiltify Error : Unknown error");
        }

        return [];
    }
}