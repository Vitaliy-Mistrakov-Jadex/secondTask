const {updateStatement, insertStatement} = require("../../functions/process-users");
const usersFromEvent = [
    [
        {
            userId: '7081a863-ea3c-4e15-89b9-a078e3aafd0f',
            field: 'OptedInThirtyDaysCancellation',
            value: false
        },
        {
            userId: '7081a863-ea3c-4e15-89b9-a078e3aafd10',
            field: 'OptedInThirtyDaysCancellation',
            value: false
        }
    ]]


const insertResult = {
    failedUsers: [[]],
    usersToUpdate: [[]]
}
const usersToUpdate = [
    [{
        userId: '7081a863-ea3c-4e15-89b9-a078e3aafd0f',
        field: 'OptedInThirtyDaysCancellation',
        value: false
    },
        {
            userId: '7081a863-ea3c-4e15-89b9-a078e3aafd10',
            field: 'OptedInThirtyDaysCancellation',
            value: false
        }]
]


const faileUsersInput = [
    {
        userData: {
            userId: '6d5c056f-0c2a-44b6-95b1-8a4205da8b02',
            field: 'OptedInThirtyDaysCancellation',
            value: false
        },
        statement: insertStatement
    },
    {
        userData: {
            userId: '3b0b3f8a-7a8b-4fc4-a24c-39b0c913f42d',
            field: 'OptedInThirtyDaysCancellation',
            value: false
        },
        statement: updateStatement
    }
]


const failedUsersUpdate = {"failedUpdate": [[]]}


const failedUpdatesRes = {
    failedUpdate: [
        [
            {
                statement: updateStatement,
                userData: {
                    field: "OptedInThirtyDaysCancellation",
                    userId: "7081a863-ea3c-4e15-89b9-a078e3aafd0f",
                    value: false,
                },
            },
            {
                statement: updateStatement,
                userData: {
                    field: "OptedInThirtyDaysCancellation",
                    userId: "7081a863-ea3c-4e15-89b9-a078e3aafd10",
                    value: false,
                },
            },
        ],
    ],
}


const failedCreatesRes = [
    {
        statement: insertStatement,
        userData: {
            field: "OptedInThirtyDaysCancellation",
            userId: "7081a863-ea3c-4e15-89b9-a078e3aafd0f",
            value: false,
        },
    },
    {
        statement: insertStatement,
        userData: {
            field: "OptedInThirtyDaysCancellation",
            userId: "7081a863-ea3c-4e15-89b9-a078e3aafd10",
            value: false,
        },
    },
]


module.exports = {
    failedCreatesRes,
    failedUpdatesRes,
    insertResult,
    usersFromEvent,
    usersToUpdate,
    failedUsersUpdate,
    faileUsersInput
}



