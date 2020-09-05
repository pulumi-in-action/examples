import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import got from "got";

const config = new pulumi.Config();
const checkInterval = config.require("check_interval");
const siteUrl = config.require("site_url");
const slackWebhookURL = config.requireSecret("slack_webhook_url");
const slackChannel = config.require("slack_channel");

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
                got.post(webhookURLFromEnv, {
                    json: {
                        username: "health-check",
                        icon_emoji: ":scream:",
                        channel: slackChannel,
                        text: `${siteUrl} responded with HTTP ${status} (${message}).`,
                    }
                });
            } catch (error) {
                console.error(`Error posting to Slack: ${error}`);
            }
        }
    },
    environment: {
        variables: {
            WEBHOOK_URL: slackWebhookURL,
        },
    },
});

aws.cloudwatch.onSchedule("schedule", checkInterval, callback);
