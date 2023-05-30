const {handler, insertUsers, updateUsers, handleUsers, retryFailed} = require('../functions/process-users'); // replace with the actual path to your Lambda file
const AWS = require('aws-sdk');
const DynamoDB = new AWS.DynamoDB();
const SQS = new AWS.SQS();

const {
    usersFromEvent,
    insertResult,
    usersToUpdate,
    failedUsersUpdate,
    faileUsersInput
} = require("./mock-data/process-users.mock");


jest.mock('aws-sdk', () => {
    return {
        DynamoDB: jest.fn().mockImplementation(() => {
            return {
                batchExecuteStatement: jest.fn().mockImplementation((x) => {
                    console.log("jest.fn().mockImplementation(", x)
                    return {
                        promise: jest.fn(() => {
                            return Promise.resolve({
                                Responses: x.Statements.map((item) => {
                                    return {
                                        Error: {
                                            Code: 'someError'
                                        }

                                    }
                                })
                            })
                        })

                    };
                }),
            };
        }),


        SQS: jest.fn().mockImplementation(() => {
            return {
                sendMessage: jest.fn().mockImplementation((x) => {
                    return {
                        promise: jest.fn()
                    };
                }),
            };
        }),
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
        const expectedResult = {};

        const result = await updateUsers(usersToUpdate);

        expect(result).toEqual(failedUsersUpdate);
    });
});


describe('retryFailed function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should retry failedUsers', async () => {
        // Redefine the batchExecuteStatement mock implementation
        AWS.DynamoDB.mockImplementation(() => ({
            batchExecuteStatement: jest.fn().mockImplementation(() => {
                return {
                    promise: jest.fn().mockResolvedValue({
                        Responses: faileUsersInput.map((item) => {
                            return {userId: 'sssss'};
                        }),
                    }),
                };
            }),
        }));

        await retryFailed(faileUsersInput);
        // add your expectations here
    });
});