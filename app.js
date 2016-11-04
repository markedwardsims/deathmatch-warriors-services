'use strict';

let restify = require('restify');
let config = require('./config');
let logging = require('./logging');
let database = require('./database');
let warriorsController = new( require('./controllers/warriorsController.js'));

process.on('uncaughtException',  (err) => {
    var logId = logging.processError(err, process, config);

    console.error(`Process exception.  Check log id: ${logId}`);
    console.error(err);

    err = err || {};

    if (!(err.status >= 400 && err.status <= 499)) {
        process.nextTick( process.exit(1) );
    }
});

let server = restify.createServer({
    name: config.server.name,
    version: config.server.version
});

server
	// allows cross domain resource requests
	// .use(restify.CORS()) 
	
	// allows the use of POST requests
    // .use(restify.fullResponse()) 
    
    // parses out the accept header and ensures the server can respond 
    // to the client’s request
    // .use(restify.acceptParser(server.acceptable)) 
    
    // parses non-route values from the query string
    // .use(restify.queryParser())

    // parses the body based on the content-type header 
    // .use(restify.bodyParser()) 

    .use((req, res, next) => {
        req.server = server;
        next();
    });

server.get({path: '/warriors'}, warriorsController.getAll);
server.get({path: '/warriors/:id'}, warriorsController.get);

// enable security middleware if set in the config
// if (config.server.enableSecurity) {
//     server.use(authentication(server))
//         .use(authorization(server));
// }

server.on('uncaughtException', (request, response, route, error) => {
    response.statusCode = 500;
    var logId = logging.webError(request, response, route, error);
    return response.send(500, {code: 'InternalServerError', message: 'An internal server error occurred', supportId: logId});
});

server.listen(config.server.port,  () => {
    console.log(`${server.name} is listening at ${server.url}`);
});