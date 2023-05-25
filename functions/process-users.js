const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const sqs = new AWS.SQS();

const chunkSize = 25;
const MAX_RETRY_ATTEMPTS = 3;
const BACKOFF_TIME_MS = 2000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


const handleUsers = async (users, statement) => {
    let usersToUpdate = [];
    let failedUsers = []


    for (let chunk of chunkArray(users, chunkSize)) {
        const params = {
            Statements: chunk.map(user => {
                return {
                    Statement: statement(user)
                }
            }),
        };

        try {
            console.log("params.Statements--->", params.Statements)
            const response = await dynamoDB.batchExecuteStatement(params).promise();

            response.Responses.forEach((res, idx) => {
                console.log("response.Responses.res", res)
                if (res.Error && res.Error.Code === 'DuplicateItem') {

                    usersToUpdate.push(chunk[idx]);
                }
                if (res.Error && res.Error.Code !== 'DuplicateItem') {
                    failedUsers.push(chunk[idx]);

                }
            });
        } catch (err) {
            console.error("err", err);
            // Произошла ошибка, увеличиваем счетчик повторной попытки и повторяем
            console.log("retryCount++", retryCount)
        }
    }


    return {usersToUpdate, failedUsers};
};


const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};


module.exports.handler = async (event) => {

    console.log("event--->", event)
    const users = event.Records.map((record) => JSON.parse(record.body));
    console.log("users---->", users)

    const insertStatement = (user) => {

        console.log("userstatement: ", user);

        return `INSERT INTO UsersBulkScriptVitaliyJadex VALUE {'UserAccountId': '${user.userId}', 'LastUpdated': '${new Date().toISOString()}'}`

    };
    console.log("insertStatement--->", insertStatement)


    let usersToUpdate = []
    let failedUsers = []


    for (const user of users) {
        console.log("usersToUpdate.push(await handleUsers(user, insertStatement))", user)
        const result = await handleUsers(user, insertStatement)
        usersToUpdate.push(result.usersToUpdate)
        failedUsers.push(result.failedUsers)


    }

    console.log("usersToUpdate", usersToUpdate)
    if (usersToUpdate.length > 0) {
        const updateStatement = (user) => `UPDATE UsersBulkScriptVitaliyJadex SET LastUpdated = '111111' WHERE UserAccountId = '${user.userId}'`;


        for (const user of usersToUpdate) {
            console.log("usersToUpdate.push(await handleUsers(user, updateStatement))", user)
            await handleUsers(user, updateStatement)

        }
    }


    console.log("failedUsers", failedUsers)
    if (failedUsers.length > 0) {
        let retryCount = 0
        let failed = []
        const updateStatement = (user) => `UPDATE UsersBulkScriptVitaliyJadex SET LastUpdated = '111111' WHERE UserAccountId = '${user.userId}'`;

        while (retryCount < MAX_RETRY_ATTEMPTS) {
            let nextFailedUsers = [];

            for (const user of failedUsers) {
                try {
                    console.log("Retry update/insert operation for user: ", user)
                    await handleUsers(user, updateStatement)
                } catch (err) {
                    console.error("Retry error: ", err);
                    nextFailedUsers.push(user);
                }

                await wait(retryCount * BACKOFF_TIME_MS);
            }

            failedUsers = nextFailedUsers;
            if (failedUsers.length === 0) {
                break;
            }

            retryCount++;
        }

        if (failedUsers.length > 0) {
            failed.push(...failedUsers);
        }


        const dlqParams = {
            MessageBody: JSON.stringify(failed.map((item) => {
                return {userId: item.userId}
            })),
            QueueUrl: process.env.QUEUE_URL
        };
        await sqs.sendMessage(dlqParams).promise();
        console.log("Failed users after all retries: ", failed);

    }


};












