var express = require('express');

var app = express();
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended: false})
var path = require('path');
var MongoClient = require('mongodb').MongoClient;
var cassandra = require('cassandra-driver');
var client = new cassandra.Client({contactPoints: ['130.245.168.194'], localDataCenter:'datacenter1', keyspace: 'twi'})
var cookieSession = require('cookie-session');
var Memcached = require('memcached');
var memcached = new Memcached('localhost:11211')
app.locals.mem = memcached;

client.connect(function(err, result) {
  if(err)
          console.log('Connection to cassandra error: '+err);
  else{
          console.log('Connection with cassandra established');
          app.locals.client = client;
          var tableQuery = "CREATE TABLE IF NOT EXISTS MEDIAS (id text PRIMARY KEY, content blob,type text);";
          client.execute(tableQuery,[],function(err) {
              if (!err) {
                  console.log("new table created");
              }
              else{
                  console.log("error in table creation: "+ err);
              }
          });
  }
});

app.use(express.static(__dirname));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use(cookieSession({
    name: 'session',
    keys: ['amiya'],
  }))

var adduser = require("./routers/adduser.js")
var login = require("./routers/login.js")
var logout = require("./routers/logout.js")
var verify = require("./routers/verify.js")
var additem = require("./routers/additem.js")
var item = require("./routers/item.js")
var search = require("./routers/search.js")
var user = require("./routers/user.js")
var follow = require("./routers/follow.js")
var addmedia = require("./routers/addmedia.js")
var media = require("./routers/media.js")

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use("/adduser", adduser)
app.use("/login", login)
app.use("/logout", logout)
app.use("/verify", verify)
app.use("/additem", additem)
app.use("/item", item)
app.use("/search", search)
app.use("/user",user)
app.use("/follow",follow)
app.use("/addmedia",addmedia)
app.use("/media",media)
app.use(express.static(__dirname));

app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname));
app.set('view engine', 'html');

app.get('/', function (req, res) {
  //res.sendFile( __dirname + "/html/index.html" );
  var user = req.session.user
  if(user == null){
    res.redirect('/login');
  }else{
    res.render('index.ejs');
  }
  
});

MongoClient.connect('mongodb://130.245.168.51:27017',{ useUnifiedTopology: true, useNewUrlParser: true },function(err,client){
  if (err){
    throw err;
  }
  console.log('Mongodb Connected');
  app.locals.db = client.db('twi');
  app.listen(80, function(){
    console.log("Listening...")
  })
});