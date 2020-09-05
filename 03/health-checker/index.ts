import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import got from "got";

const config = new pulumi.Config();
const checkInterval = config.require("check_interval");
const siteUrl = config.require("site_url");
const webhookURL = config.requireSecret("webhook_url");

const callback = new aws.lambda.CallbackFunction("callback", {
    callback: async () => {
        const webhookURLFromEnv = process.env.WEBHOOK_URL;

        if (!webhookURLFromEnv) {
            console.error("WEBHOOK_URL not set. Skipping.");
            return;
        }

        try {
            await got(siteUrl);
        }
        catch (error) {
            const status = error.response.statusCode;
            const message = JSON.parse(error.response.body).message;

            try {
                got.post(webhookURLFromEnv + "poo", {
                    json: {
                        username: "health-check",
                        icon_emoji: ":scream:",
                        text: `${siteUrl} responded with HTTP ${status} (${message}).`
                    }
                });
            } catch (error) {
                console.error(`Failed to post to Slack: ${error}`);
            }
        }
    },
    environment: {
        variables: {
            WEBHOOK_URL: webhookURL,
        },
    },
});

aws.cloudwatch.onSchedule("schedule", checkInterval, callback);
