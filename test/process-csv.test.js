const handler = require('../functions/process-csv');
const {readCsvFromS3, validateArray, sendItemsToSqs} = require('../functions/process-csv');
const {
    validItems,
    outputReadFromCsv,
    validatedItems,
    invalidOutputReadFromCsv, invalidUserAccountId
} = require("./mock-data/process-ssv.mock");
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

        expect(result).toEqual([]);
    });


});


describe('Testing the lambda functions', () => {

    test('validateArray should validate the array of items', () => {
        const result = validateArray(outputReadFromCsv);

        expect(result).toEqual(validatedItems);
    });

    test('validateArray should validate the array of items', () => {
        const result = validateArray(invalidOutputReadFromCsv);

        expect(result).toEqual(invalidUserAccountId);
    });
});
