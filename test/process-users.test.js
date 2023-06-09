const {
    handler,
    insertUsers,
    updateUsers,
    handleUsers,
    retryFailed,
    insertStatement
} = require('../functions/process-users'); // replace with the actual path to your Lambda file
const AWS = require('aws-sdk');
const DynamoDB = new AWS.DynamoDB();
const SQS = new AWS.SQS();

const {
    usersFromEvent,
    insertResult,
    usersToUpdate,
    failedUsersUpdate,
    faileUsersInput, failedUpdatesRes, failedBatchRes, failedCreatesRes, handleUsersInput
} = require("./mock-data/process-users.mock");


jest.mock('aws-sdk', () => {
    const mockBatchExecuteStatement = jest.fn();
    return {
        DynamoDB: jest.fn(() => ({
            batchExecuteStatement: mockBatchExecuteStatement,
        })),


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
let mockBatchExecuteStatement;
beforeEach(() => {
    jest.clearAllMocks();
    mockBatchExecuteStatement = jest.requireMock('aws-sdk').DynamoDB().batchExecuteStatement;
});


const successfulBachResult = (x) => jest.fn().mockResolvedValue({
    Responses: x.Statements.map(() => {
        return {TableName: 'UsersBulkScriptVitaliyJadex'}
    })
})
const unsuccessfulBachResult = (x) => jest.fn().mockResolvedValue({
    Responses: x.Statements.map(() => {
        return {Error: {Code: 'some error'}}
    })
})

describe('insertUsers function', () => {

    describe('insertUsers fail', () => {

        it('should process users and return expected result', async () => {
            mockBatchExecuteStatement.mockImplementation((x) => {
                return {
                    promise: unsuccessfulBachResult(x)
                }
            });

            const mockData = usersFromEvent;
            const failedUsers = insertResult.failedUsers;
            const usersToUpdate = insertResult.usersToUpdate

            const result = await insertUsers(mockData);


            expect(result.failedUsers).toEqual(failedCreatesRes);
            expect(result.usersToUpdate).toEqual([[]]);
        });
    });
    describe('insertUsers success', () => {

        it('should process users and return expected result', async () => {
            mockBatchExecuteStatement.mockImplementation((x) => {
                return {
                    promise: successfulBachResult(x)
                }
            });
            const mockData = usersFromEvent;
            const failedUsers = insertResult.failedUsers;
            const usersToUpdate = insertResult.usersToUpdate

            const result = await insertUsers(mockData);

            expect(result.failedUsers).toEqual(failedUsers);
            expect(result.usersToUpdate).toEqual(usersToUpdate);
        });
    });
});

describe('updateUsers function', () => {

    describe('all users successfully update function', () => {

        it('should process usersToUpdate and return expected result', async () => {

            mockBatchExecuteStatement.mockImplementation((x) => {
                return {
                    promise: successfulBachResult(x)
                }
            });
            const result = await updateUsers(usersToUpdate);
            expect(mockBatchExecuteStatement).toHaveBeenCalledTimes(1);

            expect(result).toEqual({"failedUpdate": [[]]});

        });
    });


    describe('all users return error', () => {

        it('should process usersToUpdate and return error', async () => {

            mockBatchExecuteStatement.mockImplementation((x) => {
                return {
                    promise: unsuccessfulBachResult(x)
                }
            });
            const result = await updateUsers(usersToUpdate);
            expect(mockBatchExecuteStatement).toHaveBeenCalledTimes(1);

            expect(result).toEqual(failedUpdatesRes);
        });
    });

});


describe('retryFailed function tests testing', () => {

    describe('retryFailed function that returns success', () => {
        it('should retry failedUsers', async () => {
            mockBatchExecuteStatement.mockImplementation(() => (
                {
                    promise: jest.fn().mockResolvedValue({
                        Responses: faileUsersInput.map((item) => {
                            return {userId: 'some uuid'};
                        }),
                    }),
                }));
            await retryFailed(faileUsersInput);
            expect(mockBatchExecuteStatement).toHaveBeenCalledTimes(1);

        });
    });


    describe('retryFailed function when each request are failed', () => {

        it('should retry failedUsers', async () => {
            mockBatchExecuteStatement.mockImplementation(() => ({
                promise: jest.fn().mockResolvedValue({
                    Responses: faileUsersInput.map((item) => {
                        return {
                            Error: {
                                Code: 'someError'
                            }

                        }
                    })
                }),
            }));
            await retryFailed(faileUsersInput);
            expect(mockBatchExecuteStatement).toHaveBeenCalledTimes(3);

        });
    });

});


describe('handleUsers function tests testing', () => {

    describe('handleUsers function that returns success', () => {
        it('should retry handleUsers', async () => {
            mockBatchExecuteStatement.mockImplementation(() => (
                {
                    promise: successfulBachResult(faileUsersInput)

                }));
            await handleUsers(handleUsersInput, insertStatement);
            expect(mockBatchExecuteStatement).toHaveBeenCalledTimes(1);

        });
    });


    describe('handleUsers function when each request are failed', () => {

        it('should retry handleUsers', async () => {
            mockBatchExecuteStatement.mockImplementation(() => ({
                promise: unsuccessfulBachResult(faileUsersInput)
            }));
            await handleUsers(handleUsersInput, insertStatement);
            expect(mockBatchExecuteStatement).toHaveBeenCalledTimes(1);

        });
    });

});

