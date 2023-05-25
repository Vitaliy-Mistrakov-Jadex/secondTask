const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB({apiVersion: '2012-08-10'});

const chunkSize = 25;

const handleUsers = async (users, statement) => {
    let usersToUpdate = [];

    for (let chunk of chunkArray(users, 25)) {
        console.log("Statementusers------>", users)
        console.log("chunkArray(users, chunkSize)------>", chunkArray(users, 25))
        console.log(" for (let chunk of ------>", chunk)

        const params = {
            Statements: chunk.map(user => {
                console.log("Statementuser------>", user)

                return {
                    Statement: statement(user)
                }
            }),
        };


        try {
            console.log("params.Statements--->", params.Statements)
            const response = await dynamoDB.batchExecuteStatement(params).promise();

            response.Responses.forEach((res, idx) => {
                if (res.Error && res.Error.Code === 'DuplicateItem') {
                    usersToUpdate.push(chunk[idx]);
                }
            });
        } catch (err) {
            console.error(err);
        }
    }

    return usersToUpdate;
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

    for (const user of users) {
        console.log("usersToUpdate.push(await handleUsers(user, insertStatement))", user)
        usersToUpdate.push(await handleUsers(user, insertStatement))

    }

    if (usersToUpdate.length > 0) {
        const updateStatement = (user) => `UPDATE UsersBulkScriptVitaliyJadex SET LastUpdated = '111111' WHERE UserAccountId = '${user.userId}'`;
        await handleUsers(usersToUpdate, updateStatement);

        for (const user of usersToUpdate) {
            console.log("usersToUpdate.push(await handleUsers(user, updateStatement))", user)
            await handleUsers(user, updateStatement)

        }
    }
};












