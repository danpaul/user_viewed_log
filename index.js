var DEFAULT_TABLE_NAME = 'user_viewed'

// options must include: knex
// options may include: tablePrefix, tableName
module.exports = function(options, callbackIn){

    var self = this

    this.init = function(){

        if( !options.knex ){
            console.log('user viewed log, needs knex')
            return
        }

        var prefix = (options.prefix) ? options.prefix + '_' : ''
        var tableName = (options.tableName) ?
            options.tableName : DEFAULT_TABLE_NAME

        tableName = prefix + tableName

        // init schema
        require('./schema').init({knex: options.knex, tableName: tableName},
                                 function(err){

            if( err ){ throw(err) }            
        })
    }

    this.init()
}