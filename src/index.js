//
// config
//
var $config   = { 
    descMaxChars    : 300
    , pic: { 
        width       : 300
        , height    : 300
        , types     : ["jpg","gif","png"]
    } 
};


var UPLOAD_DIR  = __dirname+"/uploads/";  
var express     = require("express");
var app         = express();
var repo        = require("./repo");
var path        = require("path");
var bodyParser  = require('body-parser');
var fileUpload  = require('express-fileupload');
var Promise     = require("promise");
var fs          = require('fs');


app.use(bodyParser.json());

//
// file upload handler
//
app.use(fileUpload({ safeFileNames:true, preserveExtension:true }));

//
// allow reference uploaded files by name directly from the URL
//
app.use(express.static(UPLOAD_DIR));



/*********************************************************

  _____   ____  _    _ _______ ______  _____ 
 |  __ \ / __ \| |  | |__   __|  ____|/ ____|
 | |__) | |  | | |  | |  | |  | |__  | (___  
 |  _  /| |  | | |  | |  | |  |  __|  \___ \ 
 | | \ \| |__| | |__| |  | |  | |____ ____) |
 |_|  \_\\____/ \____/   |_|  |______|_____/                                       

*********************************************************/


//
// INDEX
//
app.get("/", (req, res) => {
    res.sendFile(__dirname+ '/index.html') ;
});


//
// Returns the app' config and the items from the db.
//
app.get("/data.json", (req, res) => {

    repo.getItems( (error, items) => {

        res.send( { error, $config, items } ) 

    }) ; 
});



//
// handle "save": will recieve many items, and each item will be processed individually.
//
app.post('/', function(req, res) { 
   
    var items = JSON.parse( req.body.items );

    //
    // map each item to a Promise which will handle all the related operations on this specific item.
    //
    items = items.map( itm => {

        //
        // first we need the item that this "itm" is refering to...
        // if the item is not "new" (meaining, it's ID is not a number)
        //
        return ( isNaN(itm._id) ? Promise.denodeify(repo.getItem)(itm._id) : Promise.resolve() )

                //
                // handle item's file...
                //
                .then( oldItem => {

                    var file        = req.files && !itm.delete && req.files[ itm._id ];
                    var fileTask    = null; 

                    if( file )
                    {
                        if( file.truncated )
                        {
                            throw new Error("File is too big.");
                        } 


                        file.name = (new Date()).getTime()+"--"+file.name;

                        //
                        // move new file to the "uploads" directory
                        //
                        return file.mv( UPLOAD_DIR+file.name).then(()=>
                        {
                            //
                            // set the new "image" for this item.
                            //
                            itm.image = file.name;

                            //console.log("OLD ITEM!!!", oldItem.image );
                            
                            //
                            // si ya existia...
                            //
                            if( oldItem && oldItem.image )
                            {
                                try {
                                    fs.unlinkSync( UPLOAD_DIR+oldItem.image );
                                }
                                catch(e)
                                {
                                    // shh....
                                    console.log("NO SE BORRO!!!", e.toString());
                                } 
                            } 
                        })
                    } 

                })

                //
                // now handle the item...
                // At this point, if an image was uploaded the "itm.image" would had been updated.
                //
                .then( ()=>{

                    if( itm.delete )
                    {
                        return Promise.denodeify( repo.deleteItem )( itm._id );
                    }
                    else if ( itm._id<0 )
                    { 
                        return Promise.denodeify( repo.addItem )( itm ).then( newid => {
                            // this will flag the front that this is the "new" if of the new item...
                            itm.$id = newid;
                        } );
                    }
                    else 
                    {
                        return Promise.denodeify( repo.updateItem )( itm._id, itm );
                    }

                })
                
                //
                // any error is reported in the "error" property of the item.
                //
                .catch( err => {

                    itm.error = err.toString();  

                })
                
                //
                // any error relating the handling of this item will be set on the "error" property
                // we "resolve" this chain.
                //
                .then( ()=>itm ); 

    }); // End foreach item


    //
    // Each promise resolves to the same item from which is was mapped
    // in case of error, each item will have a property "error" with a string describing it.
    //
    Promise.all( items ).then(function( results )
    {
        res.send( results );

    }, function( error )
    {
        res.send({ error });
    })

  });


  //
  // Go !
  //
app.listen( 8888, '0.0.0.0', ()=>console.log("Up and running!") );