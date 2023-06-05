const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const csvtojson = require('csvtojson');
const Joi = require('joi');
const sqs = new AWS.SQS();

const handler = async (event, ctx, callback) => {
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
        console.log('json', json);


        const validatedItems = validateArray(json)

        console.log(' validateArray(json)', validatedItems);


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
    console.log("Body", Body)
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


const sendItemsToSqs = async (items) => {
    let successCount = 0;
    const messageBatchSize = 50
    const awsBatchSize = 10


    items = items.map((item) => {
        return {

            userId: item.item.UserAccountId,
            field: 'OptedInThirtyDaysCancellation',
            value: false
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


    for (let sqsBatchPayload of chunk(sqsMessagePayloads, awsBatchSize)) {
        const params = {
            QueueUrl: process.env.SQS_QUEUE_URL,
            Entries: sqsBatchPayload,
        }

        console.log("sqs.sendMessageBatch(params).+++++", params.Entries);

        try {
            await sqs.sendMessageBatch(params).promise();

        } catch (e) {
            console.error('Error sending SQS batch', e);

        }
    }

};

const chunk = (array, size) => {
    let results = [];
    while (array.length) {
        results.push(array.splice(0, size));
    }
    return results;
};

module.exports = {
    readCsvFromS3,
    validateArray,
    sendItemsToSqs,
    handler
    // the rest of your functions
}