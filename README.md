# FS Exercise

Welcome to my solution for the **FS Exercise** challenge. To build & run just execute:

    docker-composer up

( i assume you have [Docker](https://www.docker.com/) installed ) then visit `http://localhost:8888`, or `http://host-ip:8888`, or `http://virtual-machine-ip:8888` (as appropriate). 

Since i did this on a **Windows 7** machine i had some troubles installing and running docker:

 - Had to [enable Intel VT-x hardware virtualization in BIOS or UEFI firmware](https://www.smarthomebeginner.com/enable-hardware-virtualization-vt-x-amd-v/).
 - Had to install [Docker Toolbox](https://docs.docker.com/toolbox/overview/)
 - Apparently, the ports are not correctly binded to localhost (or [something like that](https://blog.sixeyed.com/published-ports-on-windows-containers-dont-do-loopback/))... so in my case i wasn't able to access the containers using **localhost** and had to use the IP of the virtual machine, which i found out by running this command:
	 -  `docker-machine ip`
 - Also wasn't able to test the mapping of volumes of the official mongo image to other than the default ( i wanted to put the MongoDB data folder in the same place that the "uploads" folder so have all the "persistent" data form this app in one known place), but according to the docs:
	> The default Docker setup on Windows and OS X uses a VirtualBox VM to host the Docker daemon. Unfortunately, the mechanism VirtualBox uses to share folders between the host system and the Docker container is not compatible with the memory mapped files used by MongoDB (see [vbox bug](https://www.virtualbox.org/ticket/819), [docs.mongodb.org](https://docs.mongodb.com/manual/administration/production-notes/#fsync-on-directories) and related [jira.mongodb.org](https://jira.mongodb.org/browse/SERVER-8600) bug). This means that it is not possible to run a MongoDB container with the data directory mapped to the host.

## About my solution...

As you will see i didn't spend any time in design. Went straight to the point since i assumed only the knowledge of the mechanics and tools is what is being evaluated.

### Front-End

 - Used [jQuery](https://jquery.com/) since the requirement didn't
   allowed [React](https://reactjs.org/) (my prefered choice if i had to chose)
 - For the **sorting** i used a jQuery plugin called "[sortable](https://jqueryui.com/sortable/)" which did the job.
 - The body starts with a **.loading** style which just sits a div on top of everything with an RGBA background, just as a quick way to disable all the inputs while the app is busy...
 - A request is made to load *data.json* fro the server, which contains a *$config* object ( that defines some rules of validation ) and *items* (an array of list's items)
 - the app wraps each item in a function which will handle the UI and data of that item. 
 - When the user clicks on *save* the app will ask each item of the list to generate an object informing all the changes that the item. *This item will also have a method resolve() which will be called once the data of that item has been saved, so the UI can act accordingly and update it's internal pointer*
 - **data is only sent when you click save**.

### Back-End

 - Went with [NodeJs](https://nodejs.org) + [ExpressJs](http://expressjs.com)
 - To handle the file uploads used [express-fileupload](https://www.npmjs.com/package/express-fileupload)
 - main entry point is **index.js** which serves **index.html** as the app's UI.
 - **repo.js** is the module responsable for interacting with [MongoDB](https://www.mongodb.com): provides a simple api and uses [error-first callbacks](http://fredkschott.com/post/2014/03/understanding-error-first-callbacks-in-node-js/) instead of Promises becausethey felt quicker for this particular use. Internally the modules connects itself with mongo one time and re-uses that handler.
 - there are only **3 routes**:
	 - GET "/" the entry point. Responds index.html
	 - POST "/" executes the save operation.
	 - GET "/data.json" returns the initial data required by the app to start.
 - Images can be accessed in the browser by ust typing their names, express is instructed to serve the contents of the "uploads" folder as static content.

## Things deliberately missing

Since this is not a real life application i went for the faster routes to solves the basic mechanics, so i didnt solved this aspects:

 - better visual global "loading" state ( just a backdrop )
 - error reporting: used **alert()** instead of a proper visual UI error
 - styles on head: not on separated file
 - javascript in the same page: in real life i would use a tool like [webpack](https://webpack.js.org/) to develop and then pack everything into proper bundles. Here i just coded everything in the index.html.
 - the application uses global variables in some cases, it is not properly isolated.
 - no templates were used, typed HTML and let jQuery create the elements...
 - i put the config defining the rules of validation in the index.js in an attempt to allow some type of customization without too much effort, but in real life i would probably had that data loaded on-deman (right now, once you compile that's it, you cant change it )
 - Mongo's port is hardcoded, same as DB name and main collection name... in real life this data would be configurable in some way.
 - repo.js exports method and in itself, acts like a Singleton... in this situaton this was good enough. If i had the need to connect to other collection or other server this wouldn't work and a class based solution would be needed, or Multiton, etc...
 - More validations, or data integrity checks... im assuming everything send to the server is valid.
