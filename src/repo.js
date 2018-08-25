 

var DB_NAME           = "exampleDb";
var CONNECTION_STRING = "mongodb://"+(process.env.MONGO_SERVICE_NAME || 'localhost')+":27017/"+DB_NAME; 
var COLLECTION_NAME   = "my-items";

var MongoClient       = require('mongodb').MongoClient; 
var ObjectID          = require('mongodb').ObjectID;

/**
 * holder for the module's connection Promise object.
 */
var _connection       = null;

  //
  // Attempt to connect to MongoDB...
  //
  function connect( callback )
  {
      //
      // if here's not yet a connection Promise, create one...
      //
      if( !_connection )
      {
          _connection = new Promise(function( resolve, reject)
          {  
              //
              // Attempt connection with DB
              //
              MongoClient.connect( CONNECTION_STRING, function(err, db) {

                  if( err )
                  {
                      _connection = null; // so a recall will attempt a reconnect.
                      reject(err);
                      return;
                  }
  
                  console.log("CONECTADOS!");

                  //
                  // return the collection that this example app will use. To save time...
                  //
                  resolve( db .db( DB_NAME )
                              .collection( COLLECTION_NAME ) );
              }); 

          });
      }

      //
      // Listen to it's resolution...
      //
      _connection.then( db => callback( null, db ) , callback );
  }
   

/**
 * Get all the items...
 */
module.exports.getItems = function( callback )
{ 
    connect((err, db)=>{

        if( err ) return callback(err);

        db.find().toArray((err, items)=>{

            //
            // sort by "order"
            //
            if( items )
            {
                items = items.sort((a,b)=>a.order-b.order);
            }

            callback( err, items);
        });

    });
};

module.exports.getItem = function( id, callback )
{ 
    connect((err, db)=>{

        if( err ) return callback(err);
        db.findOne({ _id:new ObjectID(id) } , callback);

    });
};


module.exports.addItem = function( item, callback )
{
    item        = Object.assign({}, item);
    item._id    = new ObjectID();

    connect((err, db)=>{

        if( err ) return callback(err); 
        db.insert( item, err => callback( err, item._id ) );

    });
};


module.exports.deleteItem = function(id, callback )
{
    connect((err, db)=>{

        if( err ) return callback(err); 
        db.deleteOne( { _id:new ObjectID(id) } , callback );

    });
}


module.exports.updateItem = function( id, item, callback )
{

    connect((err, db)=>{ 
        if( err ) return callback(err); 

        item = Object.assign({}, item);
        delete item._id;

        db.update( { _id:new ObjectID(id) }, { $set: item } , callback );

    });
};
 