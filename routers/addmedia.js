var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var path = require('path');
var urlencodedParser = bodyParser.urlencoded({extended: false})
var jsonParser = bodyParser.json()
var multer = require('multer')
var storage = multer.memoryStorage()
var upload = multer({dest:'upload/',storage:storage})
var uniqid = require("uniqid");
var cookieParser = require('cookie-parser');

router.post('/',upload.single('content'),function(req,res){
    if(req.cookies==null || req.cookies.a == null || req.cookies.a.user == null){
        res.status(400).json({
            'status':'error',
            'error':'User not login'
        })
    }
    else if(req.file == null){
        res.status(401).json({
            'status':'error',
            'error':'No file uploaded'
        })
    }
    else{
        req.body.id = uniqid()
        req.app.locals.db.collection("medias").insertOne({'id':req.body.id, 'user':req.cookies.a.user,'used':false}, function(err, result) {
            if (err) {
                console.log(err);
            }
        });
        req.body.query= 'INSERT INTO MEDIAS (id, content, type) VALUES (?, ?, ?)';
        req.app.locals.client.execute(req.body.query, [req.body.id, req.file.buffer, req.file.originalname.split('.')[1]], function(err, result){
            if(err) {
                // delete media id from mongodb
                req.app.locals.db.collection("medias").deleteOne({'id': req.body.id}, function(err1, obj){
                    if(err1) {
                        console.log(err1);
                        res.status(500).json({'status':'error', 'error':err1});
                    }
                    else{
                        console.log(err);
                        res.status(500).json({'status':'error', 'error':err});
                    }
                })
            } else {
                res.status(200).json({'status':'OK', 'id':req.body.id});
            }
        });
    }
})

module.exports = router;