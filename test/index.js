var _ = require('underscore')
var async = require('async')

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
        async.each(_.range(1, 11), function(num, callbackB){
            userViewedLog.add(userId, num, callbackB)
        })        
    }


], function(err){
    if( err ){
        console.log(err)
    } else {
        console.log('Success testing user_viewed_log')
    }
})