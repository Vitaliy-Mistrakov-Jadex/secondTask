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
                    failedUsers.push({
                        userData: chunk[idx],
                        statement: statement
                    });

                }
            });
        } catch (err) {
            console.error("err", err);
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

const insertStatement = (user) => {

    console.log("userstatement: ", user);

    return `INSERT INTO UsersBulkScriptVitaliyJadex VALUE {'UserAccountId': '${user.userId}', 'LastUpdated': '${new Date().toISOString()}'}`

};

const updateStatement = (user) => {
    return `UPDATE UsersBulkScriptVitaliyJadex SET LastUpdated = '111111' WHERE UserAccountId = '${user.userId}'`;

}


const insertUsers = async (users) => {

    let usersToUpdate = []
    let failedUsers = []
    for (const user of users) {
        console.log("usersToUpdate.push(await handleUsers(user, insertStatement))", user)
        const result = await handleUsers(user, insertStatement)
        usersToUpdate.push(result.usersToUpdate)
        failedUsers.push(result.failedUsers)

    }
    return {
        usersToUpdate,
        failedUsers
    }
}

const updateUsers = async (usersToUpdate) => {
    let failedUpdate = []

    for (const user of usersToUpdate) {
        console.log("usersToUpdate.push(await handleUsers(user, updateStatement))", user)
        const result = await handleUsers(user, updateStatement)
        failedUpdate.push(result.failedUsers)

    }
    return {
        failedUpdate
    }
}

const retryFailed = async (failedUsers) => {
    console.log("CALLxs")
    let retryCount = 0
    let failed = []


    let iteration = 0

    while (failedUsers.length > 0 && retryCount < MAX_RETRY_ATTEMPTS) {
        iteration++;
        let nextFailedUsers = [];
        for (let user of chunkArray(failedUsers, chunkSize)) {
            const params = {
                Statements: user.map(user => {
                    return {
                        Statement: user.statement(user.userData)
                    }
                }),
            };

            try {
                // console.log("params.Statements--->", params.Statements)
                const response = await dynamoDB.batchExecuteStatement(params).promise();
                console.log("responsebatchExecuteStatement--->", response)


                response.Responses.forEach((res, idx) => {
                    if (res.Error && res.Error.Code !== null) {
                        nextFailedUsers.push(user[idx]);
                    }

                });


                console.log("nextFailedUsers", nextFailedUsers)


                //await wait(retryCount * BACKOFF_TIME_MS);//TODO

            } catch (err) {
                console.error("err=-=-=-=-=-=-=-=-=", err);
            }
        }

        retryCount = retryCount + 1;

        failedUsers = nextFailedUsers;


        console.log("iteration", iteration)
    }
    console.log("finifsj while", process.env.DLQ)
    if (failedUsers.length > 0) {
        failed.push(...failedUsers);
    }


    const dlqParams = {
        MessageBody: JSON.stringify(failed.map((item) => {
            return {userId: item.userData.userId}
        })),
        QueueUrl: process.env.DLQ
    };

    console.log("dlqParams", dlqParams)

    await sqs.sendMessage(dlqParams).promise();
    console.log("Failed users after all retries: ", failed);

}

const handler = async (event) => {

    console.log("event--->", event)
    const users = event.Records.map((record) => JSON.parse(record.body));
    console.log("users---->", users)

    let usersToUpdate = []
    let failedUsers = []

    const insertResult = await insertUsers(users)

    console.log("insertResult.failedUsers", insertResult.failedUsers)
    console.log("insertResult.usersToUpdate", insertResult.failedUsers)


    usersToUpdate.push(...insertResult.usersToUpdate)
    failedUsers.push(...insertResult.failedUsers)

    console.log("usersToUpdate", usersToUpdate)
    if (usersToUpdate.length > 0) {


        const updateRes = await updateUsers(usersToUpdate)
        console.log("updateRes", updateRes.failedUpdate)
        failedUsers.push(...updateRes.failedUpdate)


        console.log("failedUsersarrr", failedUsers.flat(2))

        if (failedUsers.length > 0) {
            console.log("failedUsers.length", failedUsers.flat(2).length)
            await retryFailed(failedUsers.flat(2))

        }

    }


};
module.exports = {
    handleUsers,
    insertStatement,
    updateStatement,
    insertUsers,
    updateUsers,
    handler,
    retryFailed
}











