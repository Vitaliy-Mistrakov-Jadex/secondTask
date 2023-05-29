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
    failedUsers: [[], []],
    usersToUpdate: [[], []]
}


module.exports = {
    insertResult,
    usersFromEvent
}