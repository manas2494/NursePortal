const request = require('request-promise');
const https = require('https');


module.exports = {

    async getToken() {

        const client_id = "amzn1.application-oa2-client.e816a786a80b49638e36c3f84d0bba47";
        const client_secret = "392c8444566259e5326b8fa1eea88edd7bd6c1ec882457f4dff2d2feb7524c49"
        const api_endpoint = "https://api.amazon.com/auth/O2/token";
        let token;

        const body = {
            grant_type: 'client_credentials',
            client_id: client_id,
            client_secret: client_secret,
            scope: 'alexa::proactive_events'
        };
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        await request.post({url: api_endpoint, form: body, headers: headers}).then(function (response) {
            let resp = JSON.parse(response);
            token = resp['access_token'];
        });

        return token;


    },

    sendNotification() {
        this.getToken().then(function (token) {

            console.log("here");

            const ProactivePostData = JSON.stringify(getProactivePostData());

            const ProactiveOptions = getProactiveOptions(token, ProactivePostData.length);

            const req = https.request(ProactiveOptions, (res) => {
                res.setEncoding('utf8');

                if ([200, 202].includes(res.statusCode)) {
                    // console.log('successfully sent event');
                    console.log(`requestId: ${res.headers['x-amzn-requestid']}`);

                } else {
                    console.log(`Error https response: ${res.statusCode}`);
                    console.log(`requestId: ${res.headers['x-amzn-requestid']}`);

                    if ([403].includes(res.statusCode)) {
                        console.log(`userId ${userId}\nmay not have subscribed to this event.`)
                    }
                }


                let returnData;
                res.on('data', (chunk) => {
                    returnData += chunk;
                });

                res.on('end', () => {
                    // console.log(`return headers: ${JSON.stringify(res.headers, null, 2)}`);
                    // resolve(`sent event ${eventType}`);
                });
            });
            req.write(ProactivePostData);
            req.end();

        });
    }
};


function getProactiveOptions(token, postLength) {

    const api_endpoint = "https://api.eu.amazonalexa.com/v1/proactiveEvents/stages/development";

    return {
        hostname: 'api.eu.amazonalexa.com',  // api.eu.amazonalexa.com (Europe) api.fe.amazonalexa.com (Far East)
        port: 443,
        path: '/v1/proactiveEvents/stages/development',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postLength,
            'Authorization': 'Bearer ' + token
        }
    };
}

function getProactivePostData() {
    let timestamp = new Date();
    let expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 120);
    let referenceId = "SampleReferenceId" + new Date().getTime();  // cross reference to records in your existing systems


    const body = {
        "timestamp": timestamp.toISOString(),
        "referenceId": referenceId,
        "expiryTime": expiryTime.toISOString(),
        "event": {
            "name": "AMAZON.MessageAlert.Activated",
            "payload": {
                "state": {
                    "status": "UNREAD",
                    "freshness": "NEW"
                },
                "messageGroup": {
                    "creator": {
                        "name": "Nurse "
                    },
                    "count": 1,
                    "urgency": "URGENT"
                }
            }
        },
        "relevantAudience": {
            "type": "Unicast",
            "payload": {
                "user": "amzn1.ask.account.AHXNPFPCHKKD2KC4YLPLTUXP663AVAXVTPXSO7U42TDTBOOR6ZFKE2LKOP5LXIOSTDZUXZV2HT2B5JOA7F2QB6UQY6UEPHRWOEI4V6CXUR5YFXVKLZT5TIZJVFRUEJI4HX76AI6CFTQTNW5E6IFSAMTQ26IU32FO6ARTZC64R3L2IMAVFZ2NMSZ73GBPMHW34NVANJ2ZF44MYZA"
            }
        }
    };
    return body
}