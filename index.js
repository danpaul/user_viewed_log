var _ = require('underscore')
var CronJob = require('cron').CronJob

var DEFAULTS = {

    tablePrefix: '',
    tableName: 'user_viewed',
    
    // run cron every day at 4 AM
    cronSchedule: '00 00 04 * * *',

    // logs for 30 days
    keepLength: 60 * 60 * 24 * 30 
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

        // set table name
        mergedOptions.tableName = mergedOptions.tablePrefix +
                                  mergedOptions.tableName

        // set purge cron job
        self.cronJob = new CronJob(mergedOptions.cronSchedule,
                                   self.purge,
                                   true,
                                   'America/Los_Angeles')

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

    this.purge = function(){

    }

    this.purgeComplete = function(err){
        if( err ){ console.log(err)
        } else { console.log('User view log purge complete.') }
    }

    this.init()
}

var getCurrentTimestamp = function(){
    return Math.floor(Date.now() / 1000)
}