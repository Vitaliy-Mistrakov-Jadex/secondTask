const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const csvtojson = require('csvtojson');
const Joi = require('joi');
const sqs = new AWS.SQS();

module.exports.handler = async (event, ctx, callback) => {
    const s3Record = event.Records[0].s3;
    const bucketName = s3Record.bucket.name;
    const objectKey = s3Record.object.key;
    console.log("->>>>>>>applyDiscount", event)

    const s3Params = {
        Bucket: bucketName,
        Key: objectKey
    };

    try {

        const json = await readCsvFromS3(s3Params)

        console.log(' validateArray(json)', validateArray(json));


        const validatedItems = validateArray(json)

        const invalidItems = validatedItems.filter((item) => item.error);
        console.log('Invalid items:', invalidItems);

        // Log valid items and send them to SQS
        const validItems = validatedItems.filter((item) => !item.error);
        console.log('Valid items:', validItems);

        console.log('Valid items type:', typeof validItems);

        await sendItemsToSqs(validItems);
        console.log('Sent items to SQS:', validItems.length);


    } catch (e) {
        console.log(e)
    }


};


const readCsvFromS3 = async (params) => {
    const {Body} = await s3.getObject(params).promise();
    return csvtojson().fromString(Body.toString());
};


const validateArray = (arr) => {

    const itemSchema = Joi.object({
        UserAccountId: Joi.string().guid().required(),
        LastUpdated: Joi.string().isoDate().required(),
        MarketingFlags: Joi.object({
            DaznOffers: Joi.object(),
        }).allow(null),
        Preferences: Joi.object({
            CaptionsPresets: Joi.string().min(0).max(255),
            KeyMomentsDisabled: Joi.boolean().required(),
            MultiTrackAudioLanguage: Joi.string().min(0).max(255).allow(null).required(),
            OptedInThirtyDaysCancellation: Joi.boolean().required(),
            OptedOutFromPersonalisation: Joi.string().min(0).max(255).allow(null),
        }).required(),
    });
    return arr.map((item) => {
        const {error, value} = itemSchema.validate(item);
        return {item: value, error};
    });

}


// const sendItemsToSqs = async (items) => {
//
//
//     for (let i = 0; i < items.length;) {
//         let params = {
//             QueueUrl: process.env.SQS_QUEUE_URL,
//             Entries: [],
//         };
//
//         for (let j = 0; j < 10 && i < items.length; j++, i++) {
//             params.Entries.push({
//                 Id: i.toString(),
//                 MessageBody: JSON.stringify({
//                     userId: items[i].item.UserAccountId,
//                     field: 'OptedInThirtyDaysCancellation',
//                     value: items[i].item.Preferences.OptedInThirtyDaysCancellation,
//                 }),
//             });
//         }
//
//         console.log("sqs.sendMessageBatch(params).+++++", params.Entries);
//
//         await sqs.sendMessageBatch(params).promise();
//     }
//
//
// };


const sendItemsToSqs = async (items) => {
    let successCount = 0;
    const messageBatchSize = 50
    const awsBatchSize = 10

    items = items.map((item) => {
        return {

            userId: item.item.UserAccountId,
            field: 'OptedInThirtyDaysCancellation',
            // LastUpdated: item.item.LastUpdated,
            //Preferences: item.item.Preferences,
            value: false
            // MarketingFlags: item.item.MarketingFlags
        }
    })

    const messageBatches = chunk(items, messageBatchSize); // масиви чанків масивів


    console.log("messageBatches[]----->", messageBatches[0])
    console.log("messageBatches----->", messageBatches)

    const sqsMessagePayloads = messageBatches.map((batch, index) => {
        console.log("batch----->", batch)
        return {
            Id: index.toString(),
            MessageBody: JSON.stringify(batch),
        }

    });
    console.log("sqsMessagePayloads---->>>", sqsMessagePayloads)

    for (let sqsBatchPayload of chunk(sqsMessagePayloads, awsBatchSize)) {//2 чанка  1) 200 2)1

        const params = {
            QueueUrl: process.env.SQS_QUEUE_URL,
            Entries: sqsBatchPayload,
        }

        console.log("sqs.sendMessageBatch(params).+++++", params.Entries);

        await sqs.sendMessageBatch(params).promise();
    }

};

const chunk = (array, size) => {
    let results = [];
    while (array.length) {
        results.push(array.splice(0, size));
    }
    return results;
};


// const sendItemsToSqs = async (items) => {
//     const messageBatchSize = 10;
//     const awsBatchSize = 200;
//
//     let messageBatches = [];
//     for (let i = 0; i < items.length; i += messageBatchSize) {
//         messageBatches.push(items.slice(i, i + messageBatchSize));
//     }
//     while (messageBatches.length > 0) {
//
//         let batchesToSend = messageBatches.splice(0, awsBatchSize);
//
//         for (let i = 0; i < batchesToSend.length; i++) {
//             const params = {
//                 QueueUrl: process.env.SQS_QUEUE_URL,
//                 Entries: batchesToSend[i].map((messageBatch, idx) => ({
//                     Id: String(i * awsBatchSize + idx),
//                     MessageBody: JSON.stringify({
//                         userId: messageBatch.UserAccountId,
//                         field: 'OptedInThirtyDaysCancellation',
//                         value: messageBatch.item.Preferences.OptedInThirtyDaysCancellation,
//                     }),
//                 })),
//             };
//
//             try {
//                 await sqs.sendMessageBatch(params).promise();
//                 console.log(`Batch ${i} sent successfully.`);
//             } catch (error) {
//                 console.error(`Failed to send batch ${i}.`, error);
//             }
//         }
//     }
//
//
// };
