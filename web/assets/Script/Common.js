var common = {
    log(content){
        if (common.DEBUG) {
            console.log(content)
            // EventDispatch.dispatch("show_all_logs",content)
        }
    },    
    
    init(){
  
    },
}
 
module.exports = common