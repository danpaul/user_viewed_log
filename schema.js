var schema = {}

var schemaDefinition = function(table){
    table.integer('user')
    table.integer('item')
    table.primary(['user', 'item'])
}

// options must include knex (knex object), tableName
schema.init = function(options,
                       callback){

    if( !options.knex ){
        callback(new Error('user_viewed_log schema must get passed knex'))
    }

    if( !options.tableName ){
        callback(new Error('user_viewed_log schema must get passed tableName'))
    }

    options.knex.schema.hasTable(options.tableName)

            .then(function(exists) {

                if( !exists ){

                    // create the table
                    options.knex.schema.createTable(options.tableName,
                                                    schemaDefinition)

                        .then(function(){ callback(); })
                        .catch(callback)

                } else { callback(); }
            })
            .catch(callback)
}

module.exports = schema