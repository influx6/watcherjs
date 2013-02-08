module.exports = (function Watcher(ts){
  var ts = require('ts').ToolStack,
  util = ts.Utility, 
  path = require('path'), 
  fs = require('fs'),
  helper = ts.Helpers.HashMaps,
  keyGen = function keyGen(size,time){
    return Math.round((size * time)/8000000);
  },
  app = {};
  app.watchables = {};
  app.ms = 500;
  app.clock = null;

  //basic checkers for ops
  app.watching = false;
  app.rebooting = false;
  app.up = false;
  
  app.cycle = function Cycle(ms){
      if((!this.watching && !this.up) || this.rebooting ) return;

      if(ms) this.ms = ms;

      var self = this;
      this.clock =  util.delay(function(){

        util.eachAsync(self.watchables,function(e,i,o,fn){
          if(!fs.existsSync(e.root)) return;
            var localstat = fs.statSync(e.root),
            key = keyGen(localstat.size,localstat.mtime);
            if(e.key !== key){ e.fn.call(e); e.key = key; }
            fn(false);
        },function(err){
           if(err) return false;
           self.cycle(self.ms);
        });

      },this.ms);

      return true;
  };

  app.watch = function Watch(name,pfile,fn){
    var file = path.resolve(pfile);
    if(!fs.existsSync(file)) throw new Error(file+" does not exists!");

    var self = this,
        stat = fs.statSync(file), 
        key = keyGen(stat.size,stat.mtime);

    return helper.add.call(this.watchables,name,{ route:name,key: key, root: path.normalize(file),fn:fn });
  };

  app.bootup = function Bootup(){
    if(this.rebooting) return;

    this.watching = true;
    this.cycle(this.ms);
    this.up = false;
    return true;
  };

  app.stop = function ShutDown(){
    this.watching = false;
    this.up = false;
    return true;
  };

  return app;

})(require('ts').ToolStack);
