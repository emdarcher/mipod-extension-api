//music-api

var restify = require('restify');
var assert = require('assert');
var url = require('url');

module.exports = function( url_path ){
    var parsed_url = url.parse(url_path);
    this.mipod_api = {
        host: parsed_url.host,
        api_path: parsed_url.pathname
        port: parsed_url.port
    };
    
    this.playTimeout = 0;

    this.mipod_client = restify.createJsonClient({
        url: 'http://' + this.mipod_api.host
    });
    
    this.client_res_log_cb = function(err, req, res, obj){
        assert.ifError(err);
        console.log('%d -> %j', res.statusCode, res.headers);
        console.log('%j', obj);
    });

    this.play = function(req, res, next){
        //plays song
        
        //set single mode on
        
        
        //check if they provided a path, if so call play for that path
        if(req.params.songPath){
            
        } else {
            
        }
          
    };

    this.stop = function(req, res, next){
        //stops song
        this.mipod_client.get(this.mipod_api.api_path + '/stop',
                function(e, rq, rs, ob) {
                    this.client_res_log_cb(e, rq, rs, ob);
                    if(!e){
                        res.json({message:"stopped current song"}); 
                    } else { res.json(500); }
        });
        return next();
    };
    this.pause = function(req, res, next){
        //pauses song 
        this.mipod_client.get(this.mipod_api.api_path + '/pause',
                function(e, rq, rs, ob) {
                    this.client_res_log_cb(e, rq, rs, ob);
                    if(!e){
                        res.json({message:"paused current song"}); 
                    } else { res.json(500); }
        });
        return next();
    };

};
