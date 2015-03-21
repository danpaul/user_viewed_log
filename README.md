## About

user_viwed_log is a log for logging things that one thing has done. It's designed to work as a small service. It was developed to log posts as user has viewed but could be use to log any other id... id... thing.

user_viewed_log takes an initialized [Knex](http://knexjs.org/) object. I originally planned to make it compatible with any Knex compatible DB but because it was necessary to do an upsert type command, and since the way to do an upsert varies by vendor, I ended up implementing this feature using MySQL.

user_viewed_log supports basic add/get logging, automatic cleanup (it deletes logs that have expired) and batch insert/queueing.

user_viewed_log has been testedish. I made it quickly and did some basic testing but it's not exactly battle hardened yet. Use at your own risk!

## Exampleataurial

```Javascript
var _ = require('underscore')
var async = require('async')
var knex = require('knex')

var dbCreds = {
    client: 'mysql',
    connection: {
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'user_viewed_log',
        port:  8889
    }
}

var knex = require('knex')(dbCreds)

var UserViewedLog = require('./index')

var userViewedLog = new UserViewedLog({knex: knex, tablePrefix: 'test_'})

var userId = 1

async.waterfall([

    // add to the log
    function(callback){
        userViewedLog.add(userId, 234, callback)
    },

    // get items from log
    function(callback){
        userViewedLog.get(userId, function(err, userIds){
            console.log(userIds)
            callback()
        })
    }


], function(err){
    if( err ){
        console.log(err)
    } else {
        console.log('Yay!')
    }
})
```

## Settings

These setting can get passed on initialization (only knex is required), below are defaults:

```Javascript
{
    tablePrefix: '',
    tableName: 'user_viewed',
    
    // run cron every day at 4 AM
    cronSchedule: '00 00 04 * * *',

    // logs for 30 days
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
```