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


describe('insertUsers function', () => {
    let mockBatchExecuteStatement;
    beforeEach(() => {
        jest.clearAllMocks();
        mockBatchExecuteStatement = jest.requireMock('aws-sdk').DynamoDB().batchExecuteStatement;
    });
    describe('insertUsers fail', () => {

        it('should process users and return expected result', async () => {
            mockBatchExecuteStatement.mockImplementation((x) => {
                console.log(x, "mockImplem")
                return {
                    promise: jest.fn().mockResolvedValue({
                        Responses: x.Statements.map(() => {
                            return {Error: {Code: 'some error'}}
                        })
                    })
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
                console.log(x, "mockImplem")
                return {
                    promise: jest.fn().mockResolvedValue({
                        Responses: x.Statements.map(() => {
                            return {TableName: 'UsersBulkScriptVitaliyJadex'}
                        })
                    })
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
    let mockBatchExecuteStatement;
    beforeEach(() => {
        jest.clearAllMocks();
        mockBatchExecuteStatement = jest.requireMock('aws-sdk').DynamoDB().batchExecuteStatement;
    });
    describe('all users successfully update function', () => {

        it('should process usersToUpdate and return expected result', async () => {

            mockBatchExecuteStatement.mockImplementation((x) => {
                console.log(x, "mockImplem")
                return {
                    promise: jest.fn().mockResolvedValue({
                        Responses: x.Statements.map(() => {
                            return {TableName: 'UsersBulkScriptVitaliyJadex'}
                        })
                    })
                }
            });
            const result = await updateUsers(usersToUpdate);
            expect(mockBatchExecuteStatement).toHaveBeenCalledTimes(1);

            expect(result).toEqual({"failedUpdate": [[]]});

        });
    });


    describe('all users successfully update function', () => {

        it('should process usersToUpdate and return expected result', async () => {

            mockBatchExecuteStatement.mockImplementation((x) => {
                console.log(x, "mockImplem")
                return {
                    promise: jest.fn().mockResolvedValue({
                        Responses: x.Statements.map(() => {
                            return {Error: {Code: 'some error'}}

                        })
                    })
                }
            });
            const result = await updateUsers(usersToUpdate);
            expect(mockBatchExecuteStatement).toHaveBeenCalledTimes(1);

            expect(result).toEqual(failedUpdatesRes);
        });
    });

});


describe('retryFailed function tests testing', () => {
    let mockBatchExecuteStatement;
    beforeEach(() => {
        jest.clearAllMocks();
        mockBatchExecuteStatement = jest.requireMock('aws-sdk').DynamoDB().batchExecuteStatement;
    });
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
    let mockBatchExecuteStatement;
    beforeEach(() => {
        jest.clearAllMocks();
        mockBatchExecuteStatement = jest.requireMock('aws-sdk').DynamoDB().batchExecuteStatement;
    });
    describe('handleUsers function that returns success', () => {
        it('should retry handleUsers', async () => {
            mockBatchExecuteStatement.mockImplementation(() => (
                {
                    promise: jest.fn().mockResolvedValue({
                        Responses: faileUsersInput.map((item) => {
                            return {userId: 'some uuid'};
                        }),
                    }),
                }));
            await handleUsers(handleUsersInput, insertStatement);
            expect(mockBatchExecuteStatement).toHaveBeenCalledTimes(1);

        });
    });


    describe('handleUsers function when each request are failed', () => {

        it('should retry handleUsers', async () => {
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
            await handleUsers(handleUsersInput, insertStatement);
            expect(mockBatchExecuteStatement).toHaveBeenCalledTimes(1);

        });
    });

});

