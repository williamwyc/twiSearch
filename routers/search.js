var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var path = require('path');
var urlencodedParser = bodyParser.urlencoded({extended: false})
var jsonParser = bodyParser.json()
var MongoClient = require('mongodb').MongoClient;

router.post('/',(req,res)=>{
    console.log(req.body.current_user)
    if(req.body.current_user == null && (req.body.following == null || req.body.following == true)){
        console.log("Login First")
        res.status(400).json({
            status:"error",
            error:"Login First"
        });
    }
    else{
        req.body.key = ''
        //Default values
        req.body.current = Date.now()
        if(req.body.timestamp == null || req.body.timestamp == '' || req.body.timestamp <= 0){
            req.body.timestamp = req.body.current
        }
        else{
            req.body.key+=String(req.body.timestamp)
        }
        if(req.body.limit == null || req.body.limit == '' ||parseInt(req.body.limit) <= 0){
            req.body.limit = 25
        }
        else if(parseInt(req.body.limit) >= 100){
            req.body.limit = 100
            req.body.key += '100'
        }
        else{
            req.body.key += req.body.limit
        }
        if(req.body.rank == null || req.body.rank != 'time'){
            req.body.rank = 'interest'
        }
        else{
            req.body.default = false
            req.body.key += 't'
        }
        if(req.body.parent == null || req.body.parent == 'none'){
            req.body.parent = 'none'
        }
        else{
            req.body.key += 'p'
        }
        if(req.body.replies == null || req.body.replies != false){
            req.body.replies = true
        }
        else{
            req.body.key += 'r'
        }
        if(req.body.hasMedia == null || req.body.hasMedia == false){
            req.body.hasMedia = false
        }
        else{
            req.body.key += 'm'
        }

        //query
        req.body.query = {'timestamp':{$lt:req.body.timestamp*1000}}
        if (req.body.q != null && req.body.q != "") {
            req.body.query.$text = {$search: req.body.q}
            req.body.key += 'q'
        }
        if(req.body.username!=null&&req.body.username!=''){
            req.body.query.username = req.body.username
            req.body.key += req.body.username
        }
        else if(req.body.following == true){
            req.app.locals.db.collection("follow").find({'follower':req.body.current_user}).toArray(function(err, result){
                if(err){
                    console.log(err)
                    return res.status(500).json({
                        status:"error",
                        error:err
                    });
                }
                else{
                    req.body.query.username = {$in:result}
                }
            })
        }
        if(req.body.replies == false){
            req.body.query.parent = {$ne:'reply'}
        }
        else{
            if(req.body.parent!=null && req.body.parent != 'none' && req.body.parent != ''){
                req.body.query.parent = req.body.parent
            }
        }
        if(req.body.hasMedia){
            req.body.query.media = {$ne:[]}
        }
        console.log(req.body.key)
        itemSearch(req,res)
    }
});

function itemSearch(req,res){
    req.app.locals.mem.get(req.body.key,function(err,data){
        if(err){
            console.log(err)
            res.status(500).json({
                status:"error",
                error:err
            });
        }
        else if(data != null){
            res.status(200).json({
                status:"OK",
                items:data
            });
        }
        else{
            req.app.locals.db.collection("items").find(req.body.query).sort({'timestamp':-1}).limit(parseInt(req.body.limit)).toArray(function(err, result){
                if(err){
                    console.log(err)
                    res.status(500).json({
                        status:"error",
                        error:err
                    });
                }
                else{
                    if(req.body.rank == 'interest'){
                        result.sort(function(a,b){
                            return (b.property.likes+b.retweeted)/(req.body.current-b.timestamp) - (a.property.likes+a.retweeted)/(req.body.current-a.timestamp)
                        })
                    }
                    if (req.body.default == true){
                        req.app.locals.mem.set(req.body.key,result,50,function(err){
                            if(err){
                                console.log(err)
                                res.status(500).json({
                                    status:"error",
                                    error:err
                                });
                            }
                            else{
                                res.status(200).json({
                                    status:"OK",
                                    items:result
                                });
                            }
                        })
                    }
                    else{
                        res.status(200).json({
                            status:"OK",
                            items:result
                        });
                    }
                }
            })
        }
    })
}
module.exports = router;