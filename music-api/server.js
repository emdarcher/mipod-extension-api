//server

var restify = require('restify');

var server = restify.createServer({
    name: 'music-api',
    version: '0.1.0'
});

//setup parsers
server.use(restify.bodyParser());
server.use(restify.acceptParser(server.acceptable));

//special handling for request from curl client
server.pre(restify.pre.userAgentConnection());

//use PORT variable passed from the shell or 7474
var port = process.env.PORT || 7474;

//get base path from shell or /music-api
var base_path = process.env.MUSIC_API_PATH || '/music-api';

//get url for mipod api from shell or a default
var mipod_api_url = process.env.MIPOD_URL || 'http://localhost:8484/mipod';

//music-api module
var Music = require('./routes/music-api');
var music = new Music(mipod_api_url);

//welcome/test route
server.get(base_path + '/', function(req,res,next){
    res.json({ message: "welcome to the Music API!" });
    return next();
});

//routes directed to functions in ./routes/music-api.js
server.post(base_path + '/play/', music.play );
server.post(base_path + '/pause/', music.pause );
server.post(base_path + '/stop/', music.stop );
server.get(base_path + '/current/', music.current );


server.listen(port, function() {
    console.log('Listening on port: ' + port + '\nbase path: ' + base_path);
});


