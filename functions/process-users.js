const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const MAX_RETRY_ATTEMPTS = 3;
const BACKOFF_TIME_MS = 2000;

module.exports.handler = async (event) => {
    const records = event.Records;
    console.log("records----->", records)

    // Extract user data from the SQS records
    const users = records.map((record) => JSON.parse(record.body));

    // Split users into chunks of 25
    const userChunks = [];
    for (let i = 0; i < users.length; i += 25) {
        userChunks.push(users.slice(i, i + 25));
    }

    for (let userChunk of userChunks) {
        const params = {
            Statements: userChunk.map(user => ({
                Statement: `INSERT INTO UsersBulkScriptVitaliyJadex VALUE {'UserAccountId': '${user.userId}', 'LastUpdated': '${new Date().toISOString()}'}`,
            })),
        };

        try {
            console.log("params--->", params)
            const response = await dynamoDB.batchExecuteStatement(params).promise();
            console.log("Users created: ", response);
        } catch (err) {
            console.error(err);
        }
    }
};
