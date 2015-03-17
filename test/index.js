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

var userViewedLog = new require('../index')({knex: knex})