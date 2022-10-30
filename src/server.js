// use the express library
const express = require('express');

// use the cookie-parser library
const cookieParser = require('cookie-parser');

// use html-entities library 
//const {encode} = require('html-entities');

// use the node-fetch library
const fetch = require('node-fetch');

// create a new server application
const app = express();

// Define the port we will listen on
// (it will attempt to read an environment global
// first, that is for when this is used on the real
// world wide web).
const port = process.env.PORT || 3000;

// Tell the application which resources to use
app.use(express.static('public'));
app.use(cookieParser());

// set the view engine to ejs
app.set('view engine', 'ejs');

// Initialize the Visitor ID number variable for cookies
let nextVisitorId = 1;

// The main page of our website
app.get('/', (req, res) => {
  // Initialize local variables
  let dateTimeString = new Date().toLocaleString();
  let dateTimeInMilliseconds = Date.now().toString();
  let hasVisited = false;
  let secondsSinceLastVisit = 0;
  let visitorId = nextVisitorId;

  // If the request contains a visited cookie, then we set variables and perform calculations based on those cookies. 
  // Otherwise, we just update increment nextVisitorId since this new visitor will be assigned its current value.  
  if (req.cookies['visited']) {
    hasVisited = true;
    visitorId = req.cookies['visitorId'];
    secondsSinceLastVisit = Math.round( (dateTimeInMilliseconds - req.cookies['visited'])/1000 );
  } else {
    nextVisitorId++;
  }
  
  // Set the response cookies
  res.cookie('visitorId', visitorId);
  res.cookie('visited', dateTimeInMilliseconds);

  // Print header cookies to the console 
  console.log(req.cookies);

  // Render the page
  res.render('welcome', {
    name: req.query.name || "World",
    accessTime: dateTimeString,
    vId: visitorId,
    visited: hasVisited,
    lastVisit: secondsSinceLastVisit, 
  });
});

/* Pre-ejs (obsolete) code

app.get('/', (req, res) => {
  // reads the url parameter
  // http://domain/?name=text
  const name = req.query.name || "World";

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>An Example Title</title>
        <link rel="stylesheet" href="app.css">
      </head>
      <body>
        <h1>Hello, ${encode(name)}!</h1>
        <p>HTML is so much better than a plain string!</p>
      </body>
    </html>
  `);
});

*/


// Trivia Code
app.get("/trivia", async (req, res) => {
  // fetch the data
  const response = await fetch("https://opentdb.com/api.php?amount=1&type=multiple");

  // fail if bad response
  if (!response.ok) {
    res.status(500);
    res.send(`Open Trivia Database failed with HTTP code ${response.status}`);
    return;
  }

  // interpret the body as json
  const content = await response.json();

  // fail if db failed
  if (content.response_code !== 0) {
    res.status(500);
    res.send(`Open Trivia Database failed with internal response code ${content.response_code}`);
    return;
  }

  // Need the [0] on the end, since results is an Array of Objects (even though it contains only 1 object). 
  const results = content.results[0]; 
  
  console.log(results);

  // Prepare answer variables for decision making and passing into trivia.ejs
  const correctAnswer = results.correct_answer;
  const incorrectAnswers = results.incorrect_answers;
  const answers = incorrectAnswers.concat(correctAnswer);
  
  // Sort the answers so the last item isn't always the answer
  answers.sort();
  
  //console.log(answers);

  // Modified to use onclick, so that correct answer isn't shown (in lower left corner of screen) when hovering over the links.
  // However, this seems to have a side effect of dispalying all links as visited when the first one is clicked, not desired but liveable for now.
  const answerLinks = answers.map(answer => {
    return `<a href="#" onclick="javascript:alert('${
        answer === correctAnswer ? 'Correct!' : 'Incorrect, Please Try Again!'
      }')">${answer}</a>`
  });

  //console.log(answerLinks);

  // respond to the browser
  // Render the page
  res.render('trivia', { 
    question: results.question,
    answers: answerLinks,
    category: results.category,
    difficulty: results.difficulty,
  });
});
// End Trivia Code


// Start listening for network connections
app.listen(port);

// Printout for readability
console.log("Server Started!");
