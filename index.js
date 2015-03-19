var _ = require('underscore')
var CronJob = require('cron').CronJob

var DEFAULTS = {

    tablePrefix: '',
    tableName: 'user_viewed',
    
    // run cron every day at 4 AM
    cronSchedule: '00 00 04 * * *',

    // logs for 30 days
    keepLength: 60 * 60 * 24 * 30,

    knex: null
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

        _.each(DEFAULTS, function(v, k){
            if( _.has(options, k) ){
                self[k] = options[k]
            } else {
                self[k] = DEFAULTS[k]
            }
        })

        // set table name
        self.tableName = self.tablePrefix + self.tableName

        // set purge cron job
        self.cronJob = new CronJob(self.cronSchedule,
                                   self.purge,
                                   true,
                                   'America/Los_Angeles')

        self.upsertStatement = 'INSERT IGNORE INTO `' + self.tableName +
            '` ' + '(`user`, `item`, `created`) VALUES (?, ?, ?)'

        require('./schema').init(self, function(err){
            if( err ){ throw(err) }
        })
    }

    this.add = function(userId, itemId, callbackIn){

        self.knex.raw(self.upsertStatement,
                      [userId, itemId, getCurrentTimestamp()])
            .then(function(){ callbackIn() })
            .catch(callbackIn)
    }

    this.purge = function(callbackIn){
        var keepLimit = getCurrentTimestamp - self.keepLength

        self.knex(self.tableName)
            .where('created', '<', keepLimit)
            .delete()
            .then(function(){
                console.log('user_view_log completed DB purge operation')
            })
            .catch(function(err){
                console.log('user_view_log could not complete purge.')
                console.log(err)
            })

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