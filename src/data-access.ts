import { JsonDB } from "node-json-db";
const path = require("path");

function getFirebotProfilePath(): string {
    // determine os app data folder
    let appDataFolderPath;
    if (process.platform === "win32") {
        appDataFolderPath = process.env.APPDATA;
    } else if (process.platform === "darwin") {
        appDataFolderPath = path.join(
            process.env.HOME,
            "/Library/Application Support"
        );
    } else if (process.platform === "linux") {
        appDataFolderPath = path.join(process.env.HOME, "/.config");
    } else {
        throw new Error("Unsupported OS!");
    }

    const firebotDataFolderPath = path.join(appDataFolderPath, "/Firebot/v5/");
    const firebotGlobalSettingsPath = path.join(firebotDataFolderPath,"global-settings.json");
    const firebotGlobalSettings = new JsonDB(firebotGlobalSettingsPath, true, true);

    const activeProfile = firebotGlobalSettings.getData("./profiles/loggedInProfile");
    if (activeProfile == null) {
        throw new Error("Unable to determine active profile");
    }

    const firebotProfileFolderPath = path.join(firebotDataFolderPath, `/profiles/${activeProfile}/`);
    return firebotProfileFolderPath;
}

export function getPathInData(filepath: string): string {
    try {
        return path.join(getFirebotProfilePath(), filepath);
    } catch {
        console.error("Tiltify Failed to locate Profile Path. Falling back to default path");
        return filepath;
    }

}