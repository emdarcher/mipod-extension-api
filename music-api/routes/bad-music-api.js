//music-api

var restify = require('restify');
var assert = require('assert');
var url = require('url');
var httpMocks = require('node-mocks-http');

var async = require('async');

module.exports = function Music( url_path ){
    var parsed_url = url.parse(url_path);
    var mipod_api = {
        host: parsed_url.host,
        api_path: parsed_url.pathname,
        port: parsed_url.port
    };
    
    var playTimeoutSec = 0;
    this.playTimeout;

    var mipod_client = restify.createJsonClient({
        url: 'http://' + mipod_api.host
    });
    
    var client_res_log_cb = function(err, req, res, obj){
        assert.ifError(err);
        console.log('%d -> %j', res.statusCode, res.headers);
        console.log('%j', obj);
    };

    var stopNoParams = function(next_cb){
        this.stop({}, new httpMocks.createResponse(),next_cb);
    }.bind(this);

    this.play = function(req, res, next){
        //plays song
        
        
        //set single mode on
        mipod_client.get(mipod_api.api_path + '/single/1',
                function(e, rq, rs, ob){
                client_res_log_cb(e, rq, rs, ob) }); 
        
        //async.series([

        //function(callback){ 

        //stop playback before we play
        this.stop({}, new httpMocks.createResponse(),function(){
            //return callback(null,1);}); 
            }); 
        
        //    callback(null,1);
        //}, function(callback){

        //check if they provided a secondsToPlay param, if so create
        //a timeout to to stop the song after that time.
        if(req.params.secondsToPlay !== undefined){
            playTimeoutSec = req.params.secondsToPlay;
            this.playTimeout = new setTimeout(
                //call stop with fake req and res
                //this.stop({}, httpMocks.createResponse(), function(){} ),
                stopNoParams(function(){}),
                playTimeoutSec * 1000 ); 
        } else { 
            clearTimeout(this.playTimeout);
            playTimeoutSec = -1; 
        }
        
        //check if they provided a path, if so call play for that path
        if(req.params.songPath !== undefined){
            mipod_client.post(mipod_api.api_path + '/play',
                    { entry: req.params.songPath },
                    function ( e, rq, rs, ob) {
                        client_res_log_cb(e,rq,rs,ob);
                        //call current for song details     
                        //this.current(req, res, next);               
                    });
        } else {
            mipod_client.get(mipod_api.api_path + '/play',
                    function ( e, rq, rs, ob) {
                        client_res_log_cb(e,rq,rs,ob);
                        //call current for song details     
                        //this.current(req, res, next);
                    });
        }
        this.current(req,res,next); 
        //callback(null,2);
        //});
        //}]);
        
        return next(); 
    }.bind(this);

    //gets the current info for the song
    this.current = function(req, res, next){
        //empty objects to store responses for parsing
        var current_info;// = {};
        var status_info;// = {};
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
        }]);
        return next();
    }.bind(this);

    this.stop = function(req, res, next){
        //stops song
        mipod_client.get(mipod_api.api_path + '/stop',
                function(e, rq, rs, ob) {
                    client_res_log_cb(e, rq, rs, ob);
                    if(!e){
                        res.json({message:"stopped current song"}); 
                    } else { res.json(500); }
                });
        return next();
    }.bind(this);
    //}.bind(this);
    this.pause = function(req, res, next){
        //pauses song 
        mipod_client.get(mipod_api.api_path + '/pause',
                function(e, rq, rs, ob) {
                    client_res_log_cb(e, rq, rs, ob);
                    if(!e){
                        res.json({message:"paused current song"}); 
                    } else { res.json(500); }
                });
        return next();
    }.bind(this);

};
