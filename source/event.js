var SkylinkEvent = {

  on: function(event, callback){
    this.listeners.on[event] = this.listeners.on[event] || [];
      this.listeners.on[event].push(callback);
    return this;
  },

  off: function(event, callback){

    //Remove all listeners if event is not provided
    if (typeof event === 'undefined'){
      this.listeners.on = {};
      this.listeners.once = {};
    }

    //Remove all callbacks of the specified events if callback is not provided
    if (typeof callback === 'undefined'){
      this.listeners.on[event]=[];
      this.listeners.once[event]=[];
    }

    else{

      //Remove single on callback
      if (this.listeners.on[event]){
        this._removeListener(this.listeners.on[event], callback);
      }

      //Remove single once callback
      if (this.listeners.once[event]){
        this._removeListener(this.listeners.once[event], callback);
      }
    }
    return this;
  },

  once: function(event, callback){
    this.listeners.once[event] = this.listeners.once[event] || [];
      this.listeners.once[event].push(callback);
    return this;
  },

  _trigger: function(event){
    var args = Array.prototype.slice.call(arguments,1);

    if (this.listeners.on[event]){
      for (var i=0; i<this.listeners.on[event].length; i++) {
          this.listeners.on[event][i].apply(this, args);
        }
    }

    if (this.listeners.once[event]){
      for (var j=0; j<this.listeners.once[event].length; j++){
          this.listeners.once[event][j].apply(this, args);
          this.listeners.once[event].splice(j,1);
          j--;
        }
    }

    return this;
  },

  _removeListener: function(listeners, listener){
    for (var i=0; i<listeners.length; i++){
      if (listeners[i]===listener){
        listeners.splice(i,1);
        return;
      }
    }
  },

  _mixin: function(object){
    var methods = ['on','off','once','_trigger','_removeListener'];
    for (var i=0; i<methods.length; i++){
      if (SkylinkEvent.hasOwnProperty(methods[i]) ){
        if (typeof object === 'function'){
          object.prototype[methods[i]]=SkylinkEvent[methods[i]];
        }
        else{
          object[methods[i]]=SkylinkEvent[methods[i]];
        }
      }
    }

    object.listeners = {
      on: {},
      once: {}
    };

    return object;
  }
};