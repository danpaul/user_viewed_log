var _ = require('underscore')
var async = require('async')

var TIMING = true

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

var UserViewedLog = require('../index')

var userViewedLog = new UserViewedLog({knex: knex, tablePrefix: 'test_'})

var userId = 1

var numberOfInserts = 100000

var start

async.waterfall([

    // clear table
    function(callback){
        knex('test_user_viewed')
            .truncate()
            .then( function(){ callback() })
            .catch(function(err){ console.log(err) })
    },

    // add to the log
    function(callback){
        start = Date.now()
        async.eachLimit(_.range(1, numberOfInserts), 1, function(num, callbackB){
            userViewedLog.add(userId, num, callbackB)
        }, callback)        
    },

    // get logged items
    function(callback){
        if( TIMING ){
            console.log('Time to insert ' +
                        numberOfInserts + ' logs: ' +
                        (Date.now() - start) / 1000)            
        }


        userViewedLog.get(userId, function(err, userIds){
            // console.log(userIds)
            callback()
        })
// callback()
    }


], function(err){
    if( err ){
        console.log(err)
    } else {
        console.log('Success testing user_viewed_log')
    }
})