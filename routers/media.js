var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var path = require('path');
var urlencodedParser = bodyParser.urlencoded({extended: false})
var jsonParser = bodyParser.json()
var multer = require('multer')
var storage = multer.memoryStorage()
var upload = multer({dest:'upload/',storage:storage})

router.get('/:id',multer().none(),function(req,res){
    req.app.locals.client.execute('SELECT * FROM MEDIAS WHERE id = ?',[req.params.id],{prepare:true},function(err,result){
        if(err){
            console.log(err)
            res.status(400).json({
                'status': 'error',
                'error': err
            })
        }
        else{
            if(result.first() == null) {
                res.status(400).json({
                    'status':'error', 
                    'error':'No such media'
                });
            } else{
                // for(var i = 0; i < types.length; i++) {
                //     if(result.first().type == types[i]) {
                //         res.type('video/'+result.first().type);
                //         res.send(result.first().content);
                //     }
                // }
                // res.type('image/'+result.first().type);
                res.status(200).send(result.first().content);
            }
        }
    })
})

module.exports = router;