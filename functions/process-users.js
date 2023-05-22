const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const MAX_RETRY_ATTEMPTS = 3;
const BACKOFF_TIME_MS = 2000;

module.exports.handler = async (event) => {
    const records = event.Records;

    // Extract user data from the SQS records
    const users = records.map((record) => JSON.parse(record.body));
    console.log("users----->", users)

    // Split users into chunks of 25

    for (let i = 0; i < users.length; i += 25) {
        const userChunks = [];
        userChunks.push(users.slice(i, i + 25));

        console.log("userChunks.length--->", userChunks.length)
        userChunks.push(users.slice(i, i + 25));

        console.log("userChunks--->", userChunks)
        for (let userChunk of userChunks) {
            const params = {
                Statements: userChunk.map(user => (
                    {
                        Statement: `INSERT INTO UsersBulkScriptVitaliyJadex VALUE {'UserAccountId': '${user.userId}', 'LastUpdated': '${new Date().toISOString()}'}`,
                    }


                )),
            };

            try {
                console.log("params--->", params)
                const response = await dynamoDB.batchExecuteStatement(params).promise();


                response.Responses.forEach((x) => {
                    console.log(x.Error.Code)//'DuplicateItem'
                })
                console.log("Users created: ", response);
            } catch (err) {
                console.error(err);

            }
        }
    }


};


const updateUsers = async (users) => {
    console.log("updateUsers users--------->", users)
}