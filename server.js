const express = require('express');
const bodyParser = require('body-parser');
const ffmpeg = require('ffmpeg');
const AWS = require('aws-sdk');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 5000;
const multer  = require('multer');
const db = require('./helpers/dbHelper');
const notification = require('./helpers/notificationHelper');

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        let extArray = file.mimetype.split("/");
        let extension = extArray[extArray.length - 1];
        cb(null, file.fieldname + '-' + Date.now()+ '.' +extension)
    }
});
const upload = multer({ storage: storage });


const s3 = new AWS.S3({
    accessKeyId: 'AKIATVK2YJOZ4OK5BKFC',
    secretAccessKey : '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'
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



app.get('/api/get_messages', (req, res) => {
    db.getMessages().then(function (data) {
        res.send({'Messages':data.Items});
    });
});


app.post('/api/send_text_message', (req, res) =>{
    console.log(req.body.text);
    db.addTextMessage(req.body.text);
    notification.sendNotification();
    res.send(
        `Sent`,
    );
});

app.post('/api/process_audio', upload.any(), (req, res) => {
    console.log(req.files[0].filename);
    let filename = req.files[0].filename;
    let newFileName = "recording_"+Date.now()+".mp3";
    let newFilePath = "./outputs/"+newFileName;
    let process = new ffmpeg('./uploads/'+filename);


    process.then(function (audio) {
        audio.setAudioBitRate(48);
        audio.setAudioChannels(2);
        audio.setAudioFrequency(16000);
        audio.save(newFilePath, function (error,file) {
            if(!error){
                console.log("done");
                this.uploadToBucket(newFileName, newFilePath);
            }else{
                console.log(error);
            }
        })
    }), function (err) {
        console.log("error",err);
    };

    res.send("generic");
});

app.listen(port, () => console.log(`Listening on port ${port}`));

uploadToBucket =function(fileName, filePath) {
    console.log("uploading file"+filePath);
    fs.readFile(filePath, (err, data) => {
        if (err) throw err;
        const params = {
            Bucket: 'nurse-use-case',
            Key: fileName,
            Body: data
        };


        s3.putObject(params, function(err, data) {
            if (err) {
                console.log(err)
            } else {
                console.log(`File uploaded successfully at ${data}`);
                let fileUrl = "https://s3.amazonaws.com/nurse-use-case/"+fileName;
                let userId = "amzn1.ask.account.AHXNPFPCHKKD2KC4YLPLTUXP663AVAXVTPXSO7U42TDTBOOR6ZFKE2LKOP5LXIOSTDZUXZV2HT2B5JOA7F2QB6UQY6UEPHRWOEI4V6CXUR5YFXVKLZT5TIZJVFRUEJI4HX76AI6CFTQTNW5E6IFSAMTQ26IU32FO6ARTZC64R3L2IMAVFZ2NMSZ73GBPMHW34NVANJ2ZF44MYZA";
                let userEmail = "manibhatia777@gmail.com";
                notification.sendNotification();
                db.addMessage(fileUrl,userId,userEmail);
            }

        });
    });
};