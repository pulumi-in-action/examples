import * as aws from "@pulumi/aws";

const topic = new aws.sns.Topic("topic");

const subscription = new aws.sns.TopicSubscription("subscription", {
    topic: topic,
    protocol: "sms",
    endpoint: "+12065551212"
});

const scheduleExpression = "rate(1 minute)";

aws.cloudwatch.onSchedule("schedule", scheduleExpression, async () => {
    const kids = ["Oliver", "Sam", "Rosemary"];
    const shuffledKids = kids.sort(() => Math.random() > 0.5 ? -1 : 1).join(", ");
    const message = `This week's game-playing order: ${shuffledKids}. 🎉 🕹 👾`;

    const sns = new aws.sdk.SNS();
    await sns.publish(
        {
            Message: message,
            TopicArn: topic.arn.get()
        },
        (err, data) => console.log(err || data)
    ).promise();
});
