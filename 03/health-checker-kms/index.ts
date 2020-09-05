import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import got from "got";

const config = new pulumi.Config();
const checkInterval = config.require("check_interval");
const siteURL = config.require("site_url");
const webhookURL = config.requireSecret("webhook_url");

// Create a new KMS key for use with this application.
const key = new aws.kms.Key("key");
const cipherText = new aws.kms.Ciphertext("ciphertext", {
    keyId: key.arn,
    plaintext: webhookURL,
});

const callback = new aws.lambda.CallbackFunction("callback", {
    callback: async () => {
        const encryptedURL = process.env.WEBHOOK_URL;

        if (!encryptedURL) {
            console.error("WEBHOOK_URL not set. Skipping.");
            return;
        }

        // Decrypt the webhook URL.
        const kms = new aws.sdk.KMS();
        const blob = Buffer.from(encryptedURL, "base64");
        const decryptedURL = await kms.decrypt({
            CiphertextBlob: blob,
        }).promise();

        if (!decryptedURL || ! decryptedURL.Plaintext) {
            return;
        }

        try {
            await got(siteURL);
        }
        catch (error) {
            const status = error.response.statusCode;
            const message = JSON.parse(error.response.body).message;

            try {
                got.post(decryptedURL.Plaintext.toString(), {
                    json: {
                        username: "health-check",
                        icon_emoji: ":scream:",
                        text: `${siteURL} responded with HTTP ${status} (${message}).`
                    }
                });
            } catch (error) {
                console.error(error);
            }
        }
    },
    environment: {
        variables: {
            WEBHOOK_URL: cipherText.ciphertextBlob,
        },
    },
});


if (callback.roleInstance) {

    // Define an access policy that allows for decrypting KMS values.
    const policy = new aws.iam.Policy("policy", {
        policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: [
                        "kms:Decrypt",
                    ],
                    Resource: "*"
                }
            ],
        }),
    });

    // Associate that policy with the role applied to the Lambda.
    const attachment = new aws.iam.RolePolicyAttachment("attachment", {
        role: callback.roleInstance.name,
        policyArn: policy.arn,
    });
}

aws.cloudwatch.onSchedule("schedule", checkInterval, callback);
