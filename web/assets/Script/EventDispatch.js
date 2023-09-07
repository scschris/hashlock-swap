var eventDispatch = {
    events:{}, //{"hello":{"context":self,"callback":function(){}}}
    init(){

    },

    //如果不是常驻，记得 removeEvent
    addEvent(key,self,func){
        if (!eventDispatch.events[key]) {
            eventDispatch.events[key] = []
        }

        eventDispatch.events[key].push({ctx:self,cb:func})
        // console.log("eventDispatch.events:")
        // console.log(eventDispatch.events)
    },

    removeEvent(key){
        if (eventDispatch.events[key]) {
            // console.log("remove event key:"+key)
            delete eventDispatch.events[key]
        }
    },

    removeAllEvents(){
        // console.log("before delete objcs is :"+eventDispatch.events)
        // console.log(eventDispatch.events)
        for (var key in eventDispatch.events) {
            // console.log("key:"+key)
            delete eventDispatch.events[key]
        }

        // console.log("after delete objcs is :"+eventDispatch.events)
        // console.log(eventDispatch.events)
    },

    dispatch(key,params = null){
        if (eventDispatch.events[key]) {
            // console.log("dispatch event key:"+key)
            var length = eventDispatch.events[key].length
            for (var i = 0; i < length; i++) {
                var event = eventDispatch.events[key][i]
                var ctx = event.ctx
                var cb = event.cb
                if (params != null) {
                    cb(ctx,params)
                }else{
                    cb(ctx)
                }
            }
        }          
    },
};
module.exports = eventDispatch