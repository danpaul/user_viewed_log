var _ = require('underscore')
var Promise = require('bluebird')
var CronJob = require('cron').CronJob

var DEFAULTS = {

    tablePrefix: '',
    tableName: 'user_viewed',
    
    // run cron every day at 4 AM
    cronSchedule: '00 00 04 * * *',

    // keep logs for 30 days
    keepLength: 60 * 60 * 24 * 30,

    // The maximum number of logs to return
    // If -1, there is no limit
    getLimit: 10000,

    // it true, inserts will be queued and inserted in batch
    // Tested locally:
    // non queued: Time to insert 100000 logs: 68.584 (aprox 1500/sec)
    // queued 1000 inserts: Time to insert 100000 logs: 43.342 (aprox 2300/sec)
    queInserts: true,

    // max items to hold in que
    queSizeLimit: 1000,

    // max time in milliseconds to hold items in que
    queExpiration: 10000,

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

        if( self.queInserts ){
            self.insertQue = []
            self.queLastCleared = Date.now()
        }

        // set table name
        self.tableName = self.tablePrefix + self.tableName

        // set purge cron job
        self.cronJob = new CronJob(self.cronSchedule,
                                   self.purge,
                                   true,
                                   'America/Los_Angeles')

        if( self.queInserts ){
            setInterval(self.intervalQueCheck, self.queExpiration)
        }

        self.upsertStatement = 'INSERT IGNORE INTO `' + self.tableName +
            '` ' + '(`user`, `item`, `created`) VALUES (?, ?, ?)'

        require('./schema').init(self, function(err){
            if( err ){ throw(err) }
        })
    }

    this.add = function(userId, itemId, callbackIn){

        if( self.queInserts ){
            self.insertQue.push([userId, itemId, getCurrentTimestamp()])
            self.checkQue(callbackIn)
        } else {

            self.knex.raw(self.upsertStatement,
                          [userId, itemId, getCurrentTimestamp()])
                .then(function(){ callbackIn() })
                .catch(callbackIn)

        }
    }

    // checks if the timer has expired or if the size limit of the que has been
    //  exceided. flushes que if so
    this.checkQue = function(callbackIn){

        if( self.insertQue.length > self.queSizeLimit ||
            Date.now() > self.queLastCleared + self.queExpiration ){
            self.flushQue(callbackIn)
        } else {
            // setTimeout(callbackIn, 0);
            callbackIn()
        }
    }

    // function called to check if que need to get cleared
    this.intervalQueCheck = function(){
        self.checkQue(function(err){
            if( err ){ console.log(err) }
            else{ console.log('user_viewed_log que check success...') }
        })
    }

    // clears the queue and resets timer
    this.flushQue = function(callbackIn){

        var insertQueCopy = []

        _.each(self.insertQue, function(e){
            insertQueCopy.push(e.slice());
        })

        self.insertQue = []

        self.queLastCleared = Date.now()

        self.knex.transaction(function(trx) {
              return Promise.map(insertQueCopy, function(log) {
                return trx
                    .insert({
                        user: log[0],
                        item: log[1],
                        created: log[2]
                    })
                    .into(self.tableName)
              });
        })
        .then(function(){ callbackIn(); })
        .catch( callbackIn )

    }

    // gets all items in users log within `keepLength` time limit
    // passes back an array of ids
    this.get = function(userId, callbackIn){
        var cutoff = getCurrentTimestamp() - self.keepLength
        var getQuery = self.knex(self.tableName)
                           .select(['item'])
                           .where('user', userId)
                           .andWhere('created', '>', cutoff)

        if( self.getLimit >= 0 ){
            getQuery.limit(self.getLimit)
        }

        getQuery.catch = callbackIn

        // var start = Date.now() 
        getQuery.then(function(rows){
            var finish = Date.now()
            // console.log(rows.length)
            // console.log(((finish - start) / 1000))
            callbackIn(_.map(rows, function(r){ return r.item; }))
        })
    }

    // purges expired logs from the DB
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

    // runs after the cron is complete
    this.purgeComplete = function(err){
        if( err ){ console.log(err)
        } else { console.log('User view log purge complete.') }
    }

    this.init()
}

var getCurrentTimestamp = function(){
    return Math.floor(Date.now() / 1000)
}