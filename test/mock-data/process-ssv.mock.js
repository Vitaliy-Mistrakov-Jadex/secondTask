const {ValidationError} = require("joi");
const validItems = [
    {
        item: {
            UserAccountId: '7081a863-ea3c-4e15-89b9-a078e3aafd0d',
            LastUpdated: '2023-01-24T10:54:54.395Z',
            MarketingFlags: [Object],
            Preferences: [Object]
        },
        error: undefined
    },
    {
        item: {
            UserAccountId: '7081a863-ea3c-4e15-89b9-a078e3aafd0f',
            LastUpdated: '2023-01-24T10:54:54.395Z',
            MarketingFlags: [Object],
            Preferences: [Object]
        },
        error: undefined
    },

]

const invalidOutputReadFromCsv = [
    {
        UserAountId: '7081a863-ea3c-4e15-89b9-a078e3aafd0f',
        LastUpdated: '2023-01-24T10:54:54.395Z',
        MarketingFlags: null,
        Preferences: {
            CaptionsPresets: '[]',
            KeyMomentsDisabled: 'false',
            MultiTrackAudioLanguage: 'null',
            OptedInThirtyDaysCancellation: 'true',
            OptedOutFromPersonalisation: ''
        }
    },
    {
        UserAccountId: '7081a863-ea3c-4e15-89b9-a078e3aafd10',
        LastUpdated: '2023-01-24T10:54:54.395Z',
        MarketingFlags: null,
        Preferences: {
            CaptionsPresets: '[]',
            KeyMomentsDisabled: 'false',
            MultiTrackAudioLanguage: 'null',
            OptedInThirtyDaysCancellation: 'true',
            OptedOutFromPersonalisation: ''
        }
    }
]

const outputReadFromCsv = [
    {
        UserAccountId: '7081a863-ea3c-4e15-89b9-a078e3aafd0f',
        LastUpdated: '2023-01-24T10:54:54.395Z',
        MarketingFlags: null,
        Preferences: {
            CaptionsPresets: '[]',
            KeyMomentsDisabled: 'false',
            MultiTrackAudioLanguage: 'null',
            OptedInThirtyDaysCancellation: 'true',
            OptedOutFromPersonalisation: ''
        }
    },
    {
        UserAccountId: '7081a863-ea3c-4e15-89b9-a078e3aafd10',
        LastUpdated: '2023-01-24T10:54:54.395Z',
        MarketingFlags: null,
        Preferences: {
            CaptionsPresets: '[]',
            KeyMomentsDisabled: 'false',
            MultiTrackAudioLanguage: 'null',
            OptedInThirtyDaysCancellation: 'true',
            OptedOutFromPersonalisation: ''
        }
    }
]
const validatedItems = [

    {
        item: {
            UserAccountId: '7081a863-ea3c-4e15-89b9-a078e3aafd0f',
            LastUpdated: '2023-01-24T10:54:54.395Z',
            MarketingFlags: null,
            Preferences: {
                CaptionsPresets: '[]',
                KeyMomentsDisabled: false,
                MultiTrackAudioLanguage: 'null',
                OptedInThirtyDaysCancellation: true,
                OptedOutFromPersonalisation: ''
            }
        },
        error: undefined
    },
    {
        item: {
            UserAccountId: '7081a863-ea3c-4e15-89b9-a078e3aafd10',
            LastUpdated: '2023-01-24T10:54:54.395Z',
            MarketingFlags: null,
            Preferences: {
                CaptionsPresets: '[]',
                KeyMomentsDisabled: false,
                MultiTrackAudioLanguage: 'null',
                OptedInThirtyDaysCancellation: true,
                OptedOutFromPersonalisation: ''
            }
        },
        error: undefined
    }
]

const invalidUserAccountId = [
    {
        "error": new ValidationError('"UserAccountId" is required'),
        "item": {
            "LastUpdated": "2023-01-24T10:54:54.395Z",
            "MarketingFlags": null,
            "Preferences": {
                "CaptionsPresets": "[]",
                "KeyMomentsDisabled": "false",
                "MultiTrackAudioLanguage": "null",
                "OptedInThirtyDaysCancellation": "true",
                "OptedOutFromPersonalisation": "",
            },
            "UserAountId": "7081a863-ea3c-4e15-89b9-a078e3aafd0f",
        }
    },
    {
        "error": undefined,
        "item": {
            "LastUpdated": "2023-01-24T10:54:54.395Z",
            "MarketingFlags": null,
            "Preferences": {
                "CaptionsPresets": "[]",
                "KeyMomentsDisabled": false,
                "MultiTrackAudioLanguage": "null",
                "OptedInThirtyDaysCancellation": true,
                "OptedOutFromPersonalisation": "",
            },
            "UserAccountId": "7081a863-ea3c-4e15-89b9-a078e3aafd10",
        }
    },
]

module.exports = {
    invalidOutputReadFromCsv,
    invalidUserAccountId,
    validItems,
    outputReadFromCsv,
    validatedItems
}