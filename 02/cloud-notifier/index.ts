import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const scheduleExpression = config.require("schedule_expression");
const phoneNumber = config.requireSecret("phone_number");
const kidNames: string[] = config.requireObject("kid_names");

const topic = new aws.sns.Topic("topic");

const subscription = new aws.sns.TopicSubscription("subscription", {
    topic: topic,
    protocol: "sms",
    endpoint: phoneNumber,
});

aws.cloudwatch.onSchedule("schedule", scheduleExpression, async () => {
    const shuffledKids = kidNames.sort(() => Math.random() > 0.5 ? -1 : 1).join(", ");
    const message = `This week's game-playing order: ${shuffledKids}. 🎉 🕹 👾`;

    const sns = new aws.sdk.SNS();
    await sns.publish(
        { Message: message, TopicArn: topic.arn.get() },
        (err, data) => console.log(err || data)
    ).promise();
});
