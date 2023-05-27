const handler = require('../functions/process-csv');
const {readCsvFromS3, validateArray, sendItemsToSqs} = require('../functions/process-csv');
const {validItems, outputReadFromCsv, validatedItems} = require("./mock-data/process-ssv.mock");
//const {jest} = require('@jest/globals');

jest.mock('aws-sdk', () => {
    return {
        S3: jest.fn().mockImplementation(() => ({
            getObject: jest.fn().mockReturnValue({
                promise: jest.fn().mockResolvedValue({Body: 'test-csv-data'})
            })
        })),
        SQS: jest.fn().mockImplementation(() => ({
            sendMessageBatch: jest.fn().mockReturnValue({
                promise: jest.fn().mockResolvedValue({})
            })
        }))
    };
});
jest.mock('csvtojson', () => () => ({
    fromString: jest.fn().mockResolvedValue([]),
}));


describe('Testing the lambda functions', () => {

    test('readCsvFromS3 should read CSV data from S3', async () => {
        const params = {Bucket: 'bucket-name', Key: 'key'};
        const result = await readCsvFromS3(params);

        // assert on the result
        expect(result).toEqual([]);
    });

    test('validateArray should validate the array of items', () => {
        const result = validateArray(outputReadFromCsv);

        // assert on the result
        expect(result).toEqual(validatedItems);
    });

    test('sendItemsToSqs should send items to SQS', async () => {

       
    });

});
