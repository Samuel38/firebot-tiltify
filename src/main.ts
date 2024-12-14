import {
    Firebot,
    Integration
} from "@crowbartools/firebot-custom-scripts-types";

import { 
    TiltifyIntegration,
    TiltifySettings,
    integrationDefinition
 } from "./tiltify-integration";

import {
    logger,
    integrationManager,
    initModules
  } from "@shared/firebot-modules";

const packageInfo = require("../package.json");

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

        // Setup globals
        initModules(modules);

        // Create and Register the integration
        const integrationConfig: Integration<TiltifySettings> = {
            definition: integrationDefinition,
            integration: new TiltifyIntegration()
        };
        integrationManager.registerIntegration(integrationConfig);
    },
    stop: () => {
        logger.info("Unloading Tiltify integration...");

        logger.info("Tiltify integration unloaded");
    }
};

export default script;