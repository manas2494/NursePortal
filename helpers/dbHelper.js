var AWS = require("aws-sdk");
const moment = require('moment');

AWS.config.loadFromPath('./config.json');
let docClient = new AWS.DynamoDB.DocumentClient();

module.exports = {

    addMessage(messageURL, userID, userEmail) {
        return new Promise((resolve, reject) => {
            const today_time_format = moment().unix().toString();

            const params = {
                TableName: "messages",
                Item: {
                    "messageType": "Audio",
                    'messageId': today_time_format,
                    'messageUrl': messageURL,
                    'userId': userID,
                    'userEmail': userEmail,
                    'messageRead': false
                }
            };

            docClient.put(params, (err, data) => {
                if (err) {
                    console.log("Unable to insert =>", JSON.stringify(err));
                    return reject("Unable to insert");
                }
                console.log("Saved Data, ", JSON.stringify(data));
                resolve(data);
            });
        });

    },

    addTextMessage(message, userID, userEmail) {
        return new Promise((resolve, reject) => {
            const today_time_format = moment().unix().toString();

            const params = {
                TableName: "messages",
                Item: {
                    "messageType": "Text",
                    'messageId': today_time_format,
                    'messageText': message,
                    'userId': userID,
                    'userEmail': userEmail,
                    'messageRead': false
                }
            };

            docClient.put(params, (err, data) => {
                if (err) {
                    console.log("Unable to insert =>", JSON.stringify(err));
                    return reject("Unable to insert");
                }
                console.log("Saved Data, ", JSON.stringify(data));
                resolve(data);
            });
        });

    },

    getMessages() {
        return new Promise((resolve, reject) => {
            var params = {
                TableName:"messages_reply",
                ScanIndexForward: true
            };

            docClient.scan(params).eachPage((err, data, done) => {
                resolve(data);
            })

        });
    }
};