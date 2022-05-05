/*
  app.js -- This creates an Express webserver with login/register/logout authentication
*/

// *********************************************************** //
//  Loading packages to support the server
// *********************************************************** //
// First we load in all of the packages we need for the server...
const createError = require("http-errors"); // to handle the server errors
const express = require("express");
const path = require("path");  // to refer to local paths
const cookieParser = require("cookie-parser"); // to handle cookies
const session = require("express-session"); // to handle sessions using cookies
const debug = require("debug")("personalapp:server"); 
const layouts = require("express-ejs-layouts");
const axios = require("axios")

// *********************************************************** //
//  Loading models
// *********************************************************** //
const Poll = require('./models/Poll')

// *********************************************************** //
//  Loading JSON datasets
// *********************************************************** //
const polls = require('./public/data/polls.json')


// *********************************************************** //
//  Connecting to the database
// *********************************************************** //

const mongoose = require( 'mongoose' );
const mongodb_URI = process.env.mongodb_URI;

mongoose.connect( mongodb_URI, { useNewUrlParser: true, useUnifiedTopology: true } );
// fix deprecation warnings
mongoose.set('useFindAndModify', false); 
mongoose.set('useCreateIndex', true);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {console.log("we are connected!!!")});





// *********************************************************** //
// Initializing the Express server 
// This code is run once when the app is started and it creates
// a server that respond to requests by sending responses
// *********************************************************** //
const app = express();

// Here we specify that we will be using EJS as our view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");



// this allows us to use page layout for the views 
// so we don't have to repeat the headers and footers on every page ...
// the layout is in views/layout.ejs
app.use(layouts);

// Here we process the requests so they are easy to handle
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Here we specify that static files will be in the public folder
app.use(express.static(path.join(__dirname, "public")));

// Here we enable session handling using cookies
app.use(
  session({
    secret: process.env.SECRET, 
    resave: false,
    saveUninitialized: false
  })
);

// *********************************************************** //
//  Defining the routes the Express server will respond to
// *********************************************************** //


// here is the code which handles all /login /signin /logout routes
const auth = require('./routes/auth');
const { deflateSync } = require("zlib");
app.use(auth)

// middleware to test is the user is logged in, and if not, send them to the login page
const isLoggedIn = (req,res,next) => {
  if (res.locals.loggedIn) {
    next()
  }
  else res.redirect('/login')
}

// specify that the server should render the views/index.ejs page for the root path
// and the index.ejs code will be wrapped in the views/layouts.ejs code which provides
// the headers and footers for all webpages generated by this app
app.get("/", (req, res, next) => {
  res.render("index");
});

app.get("/about", (req, res, next) => {
  res.render("about");
});


/* ************************
  Other functions
   ************************ */

async function updatePollResponses(poll, responses, username) {
  // takes a set of question index: response pairs and increments the
  // corresponding response count for each question
  for (questionNumber in responses) {
    const response = responses[questionNumber];
    const question = poll.questions[parseInt(questionNumber)];

    for (option of question.options) {
      if (option.name == response) {
        option.responses += 1;
        question.totalResponses += 1;
      }
    }
  }
  poll.totalResponses += 1;
  poll.usersResponded.push(username);
  const {_id}=poll;
  await Poll.findOneAndUpdate({_id},poll,{upsert:true})
}

async function createPollAndUpsert(title, description, questions, username) {
  const currentDate = new Date()
  const poll = new Poll({title, description, totalResponses:0, dateCreated:currentDate, 
    createdBy:username, questions})
  await poll.save()
}

function parsePollData(data) {
  const {title,description}=data
  var questions = []
  var question = null

  for (key in data) {
    if (key.includes("question")) {
      if (question != null) {
        questions.push(question)
      }
      question = {question:data[key],totalResponses:0,options:[]}
    }
    else if (key.includes("option")) {
      question.options.push({name:data[key],responses:0})
    }
  }

  if (question != null) {
    questions.push(question)
  }

  return {title,description,questions}
}



/* ************************
  Loading (or reloading) the data into a collection
   ************************ */
// this route loads in the courses into the Course collection
// or updates the courses if it is not a new collection

app.get('/upsertDelete', 
  async (req,res,next) => {
    await Poll.deleteMany({})
    res.redirect('/upsertDB')
  }
)

app.get('/upsertDB',
  async (req,res,next) => {
    //await Poll.deleteMany({})
    for (poll of polls){
      const {title}=poll;
      await Poll.findOneAndUpdate({title},poll,{upsert:true})
    }
    const num = await Poll.find({}).count();
    res.send("data uploaded: "+num)
  }
)

app.get('/polls',
  isLoggedIn,
  async (req,res,next) => {
    const polls = await Poll.find({});
    res.locals.polls = polls;
    res.locals.selectedSort = "Total Responses (Ascending)"

    res.render('polls');
  }
)

app.post('/polls',
  async (req,res,next) => {
    var sortFunction = (a,b) => a - b
    const sortName = req.body.sort

    if (sortName == "Total Responses (Ascending)") {
      sortFunction = (a,b) => a.totalResponses - b.totalResponses
    }
    else if (sortName == "Total Responses (Descending)") {
      sortFunction = (a,b) => b.totalResponses - a.totalResponses
    }
    else if (sortName == "Date Created (Earliest First)") {
      sortFunction = (a,b) => a.dateCreated - b.dateCreated
    }
    else if (sortName == "Date Created (Latest First)") {
      sortFunction = (a,b) => b.dateCreated - a.dateCreated
    }

    const polls = (await Poll.find({})).sort(sortFunction)
    res.locals.polls = polls;
    res.locals.selectedSort = sortName;

    res.render('polls')
  }
)

app.get('/poll/:pollId',
  isLoggedIn,
  async (req,res,next) => {
    const pollId = req.params.pollId;
    const poll = await Poll.findOne({_id:pollId});
    res.locals.poll = poll;

    if (poll.usersResponded.includes(req.session.username)) {
      res.render('alreadyDone')
    }
    else {
      res.render('poll');
    }
  }
)

app.post('/poll/:pollId',
  async (req,res,next) => {
    const pollId = req.params.pollId;
    var poll = await Poll.findOne({_id:pollId});

    updatePollResponses(poll, req.body, req.session.username);

    res.redirect("/polls");
  }
)

app.get('/stats/:pollId',
  isLoggedIn,
  async (req,res,next) => {
    const pollId = req.params.pollId;
    const poll = await Poll.findOne({_id:pollId});
    res.locals.poll = poll;

    res.render('stats')
  }
)

app.get('/makePoll', 
  isLoggedIn,
  async (req,res,next) => {
    res.render('makePoll')
  }
)

app.post('/makePoll',
  async (req,res,next) => {
    const {title,description,questions} = parsePollData(req.body)
    const username = req.session.username
    createPollAndUpsert(title, description, questions, username)

    res.redirect('/')
  }
)


// here we catch 404 errors and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// this processes any errors generated by the previous routes
// notice that the function has four parameters which is how Express indicates it is an error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render("error");
});


// *********************************************************** //
//  Starting up the server!
// *********************************************************** //
//Here we set the port to use between 1024 and 65535  (2^16-1)
const port = process.env.PORT || "5000";
console.log("connecting on port " + port)
app.set("port", port);

// and now we startup the server listening on that port
const http = require("http");
const { reset } = require("nodemon");
const { ppid, title } = require("process");
const { url } = require("inspector");
const server = http.createServer(app);

server.listen(port);

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

server.on("error", onError);

server.on("listening", onListening);

module.exports = app;
