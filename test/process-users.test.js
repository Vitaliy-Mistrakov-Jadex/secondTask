const {handler, insertUsers, updateUsers, handleUsers, retryFailed} = require('../functions/process-users'); // replace with the actual path to your Lambda file
const AWS = require('aws-sdk');
const {usersFromEvent, insertResult} = require("./mock-data/process-users.mock");

const mockBatchExecuteStatement = jest.fn();
const mockSendMessage = jest.fn();
jest.mock('aws-sdk', () => {
    return {
        DynamoDB: jest.fn(() => ({
            batchExecuteStatement: jest.fn().mockImplementation(() => ({
                promise: jest.fn(),
            })),
        })),
        SQS: jest.fn(() => ({
            sendMessage: jest.fn().mockImplementation(() => ({
                promise: jest.fn(),
            })),
        })),
    };
});


describe('insertUsers function', () => {
    it('should process users and return expected result', async () => {
        const mockData = usersFromEvent;
        const failedUsers = insertResult.failedUsers;
        const usersToUpdate = insertResult.usersToUpdate

        const result = await insertUsers(mockData);

        expect(result.failedUsers).toEqual(failedUsers);
        expect(result.usersToUpdate).toEqual(usersToUpdate);
    });
});

describe('updateUsers function', () => {
    it('should process usersToUpdate and return expected result', async () => {
        const mockData = {};
        const expectedResult = {};

        const result = await updateUsers(mockData);

        expect(result).toEqual(expectedResult);
    });
});

describe('handleUsers function', () => {
    it('should process users and return expected result', async () => {
        const mockData = {};
        const expectedResult = {};

        const result = await handleUsers(mockData, jest.fn());

        expect(result).toEqual(expectedResult);
    });
});

describe('retryFailed function', () => {
    it('should retry failedUsers and return expected result', async () => {
        const mockData = {};
        const expectedResult = {};

        const result = await retryFailed(mockData);

        expect(result).toEqual(expectedResult);
    });
});


