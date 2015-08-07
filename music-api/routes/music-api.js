//music-api


//required modules
var restify = require('restify');
var assert = require('assert');
var url = require('url');
var httpMocks = require('node-mocks-http');
var async = require('async');


//global vars for details for accessing the mipod api
var mipod_api = {};
var mipod_client;

//global vars for the playTimeout
var playTimeoutSec = -1;
var playTimeout;


var init_running = true;

//initialization code which sets up global vars based on it's arguements
//and creates an API client for the mipod API
exports.init_Music = function( url_path, cb ){
    var error = false;
    var parsed_url = url.parse(url_path);
    //add details to the mipod_api object
    mipod_api.host = parsed_url.host;
    mipod_api.api_path = parsed_url.pathname;
    mipod_api.port = parsed_url.port;
    
    //create API client for the mipod API
    mipod_client = restify.createJsonClient({
        url: 'http://' + mipod_api.host
    });
    init_running = false;
    return cb(error);
};

//function that is called inside the callback of an API client request
//and logs the API response to the console for debugging
var client_res_log_cb = function(err, req, res, obj){
    assert.ifError(err);
    console.log('%d -> %j', res.statusCode, res.headers);
    console.log('%j', obj);
};

exports.play = function(req, res, next){
    //plays song
    
    //set single mode on so it only plays one song, then stops
    mipod_client.get(mipod_api.api_path + '/single/1',
            function(e, rq, rs, ob){
            client_res_log_cb(e, rq, rs, ob); 
            }); 
    
    async.series([
        function(callback){ 
            //stop playback before we play
            module.exports.stop({}, httpMocks.createResponse(),function(){
                return callback(null,1);
            }); 
        }, function(callback){
            //check if they provided a secondsToPlay param, if so create
            //a timeout to to stop the song after that time.
            if(req.params.secondsToPlay !== undefined){
                playTimeoutSec = req.params.secondsToPlay;
                playTimeout = setTimeout(function(){
                    console.log('creating playTimout');
                    //call stop with fake req and res
                    module.exports.stop({}, httpMocks.createResponse(), 
                        function(){
                            console.log('executed stop from timeout');
                    });
                }, playTimeoutSec * 1000 ); 
            } else {
                if(playTimeout !== null){ 
                    //if a timeout has been made, clear it 
                    //so the song won't stop prematurely
                    clearTimeout(playTimeout);
                }
                playTimeoutSec = -1; 
            }
            callback(null,2); 
        }, function(callback){ 
            //check if they provided a path, if so call play for that path
            if(req.params.songPath !== undefined){
                mipod_client.post(mipod_api.api_path + '/play',
                        { entry: req.params.songPath },
                        function ( e, rq, rs, ob) {
                            client_res_log_cb(e,rq,rs,ob);
                            //call current for song details     
                            module.exports.current(req, res, next);               
                        });
            } else {
                mipod_client.get(mipod_api.api_path + '/play',
                        function ( e, rq, rs, ob) {
                            client_res_log_cb(e,rq,rs,ob);
                            //call current for song details     
                            module.exports.current(req, res, next);
                        });
            }
            callback(null,3);
        }   
    ]);
    return next(); 
};

//gets the current info for the song
exports.current = function(req, res, next){
    //empty objects to store responses for parsing
    var current_info;
    var status_info;
    async.series([
        function(callback){
            mipod_client.get(mipod_api.api_path + '/current',
                    function(e, rq, rs, ob) {
                        client_res_log_cb(e, rq, rs, ob);
                        current_info = ob;
                        callback(null, 1);
                    });
        }, function(callback){
            mipod_client.get(mipod_api.api_path + '/status',
                    function(e, rq, rs, ob) {
                        client_res_log_cb(e, rq, rs, ob);
                        status_info = ob;
                        callback(null, 2);
                    });
        }, function(callback){
            //if the status of playback is stopped 
            //then there is no current song 
            if(status_info.state == 'stop'){
                res.json(404, {error:"Nothing is playing"}); 
            } else {
                var response_info = {
                    file: current_info.song.file, 
                    title: current_info.song.title,
                    album: current_info.song.album,
                    artist: current_info.song.artist,
                    lengthInSeconds: current_info.song.time,
                    secondsToPlay: playTimeoutSec,
                    secondsElapsed: status_info.elapsed  
                }; 
                res.json(response_info);
            }
            callback(null,3);
        }
    ]);
    return next();
};
exports.stop = function(req, res, next){
    //stops song
    mipod_client.get(mipod_api.api_path + '/stop',
            function(e, rq, rs, ob) {
                client_res_log_cb(e, rq, rs, ob);
                if(!e){
                    res.json({message:"stopped current song"}); 
                } else { res.json(500); }
            });
    return next();
};
//}.bind(this);
exports.pause = function(req, res, next){
    //pauses song 
    mipod_client.get(mipod_api.api_path + '/pause',
            function(e, rq, rs, ob) {
                client_res_log_cb(e, rq, rs, ob);
                if(!e){
                    res.json({message:"paused current song"}); 
                } else { res.json(500); }
            });
    return next();
};

