const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB({apiVersion: '2012-08-10'});

const chunkSize = 25;

const handleUsers = async (users, statement) => {
    let usersToUpdate = [];

    for (let chunk of chunkArray(users, chunkSize)) {
        const params = {
            Statements: chunk.map(user => ({
                Statement: statement(user)
            })),
        };

        try {
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
    const users = event.Records.map((record) => JSON.parse(record.body));

    const insertStatement = (user) => `INSERT INTO UsersBulkScriptVitaliyJadex VALUE {'UserAccountId': '${user.userId}', 'LastUpdated': '${new Date().toISOString()}'}`;
    let usersToUpdate = await handleUsers(users, insertStatement);

    if (usersToUpdate.length > 0) {
        const updateStatement = (user) => `UPDATE UsersBulkScriptVitaliyJadex SET LastUpdated = '111111' WHERE UserAccountId = '${user.userId}'`;
        await handleUsers(usersToUpdate, updateStatement);
    }
};
