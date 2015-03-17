var _ = require('underscore')

var DEFAULTS = {
    tablePrefix: '',
    tableName: 'user_viewed'
}

// options must include: knex
// options may include: tablePrefix, tableName, fetch log limit
module.exports = function(options, callbackIn){

    var self = this

    this.init = function(){

        if( !options.knex ){
            console.log('user viewed log, needs knex')
            return
        }

        // set defaults
        var mergedOptions = _.clone(DEFAULTS)
        _.each(options, function(v, k){
            if( _.has(options, k) ){
                mergedOptions[k] = options[k]
            }
        })

        // set table tname
        mergedOptions.tableName = mergedOptions.tablePrefix +
                                  mergedOptions.tableName

        self.tableName = mergedOptions.tableName
        self.knex = mergedOptions.knex
        self.upsertStatement = 'INSERT IGNORE INTO `' + self.tableName +
            '` ' + '(`user`, `item`, `created`) VALUES (?, ?, ?)'

        require('./schema').init(mergedOptions, function(err){
            if( err ){ throw(err) }
        })
    }

    this.add = function(userId, itemId, callbackIn){

        self.knex.raw(self.upsertStatement,
                      [userId, itemId, getCurrentTimestamp()])
            .then(function(){ callbackIn() })
            .catch(callbackIn)
    }

    this.init()
}

var getCurrentTimestamp = function(){
    return Math.floor(Date.now() / 1000)
}