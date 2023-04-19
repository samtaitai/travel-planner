// We'll use the OpenAI JavaScript module to send prompts to ChatGPT, see:
// https://www.npmjs.com/package/openai
// For this to work, we have to "bundle" our JavaScript code together
// with the OpenAI code, and any code it needs.  We'll do that using
// https://parceljs.org/
const { OpenAIApi, Configuration } = require("openai");

// You need an OpenAI account and Secret API Key for this to work, see:
// https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key
// Get the API Key from the .env file via `process.env.OPENAI_API_KEY` variable
// See https://parceljs.org/features/node-emulation/#.env-files
function configureOpenAI() {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Create a client with our account config and return it
  const openai = new OpenAIApi(configuration);
  return openai;
}

// Translate our user's form input into a ChatGPT prompt format
function buildUserPrompt(
  depart,
  arrival,
  duration,
  budget,
  activity,
  requirement
) {
  const prompt = `
  I'm going to take a flight from ${depart} to ${arrival}. 
  I'm going to stay there for ${duration}. I want to focus on activities like 
  ${activity}. 
  I need you to answer how much the round flight ticket would be, 
  how much an average day budget and total budget would be. 
  The total budget should be the total sum of flight tickets, accommodation, plus
  a day budget multiply how many days in ${duration}.
  Because I depart from ${depart}, every cost should be calculated in 
  the dominant currency in ${depart}.  
  Also, Based on the fact that my favorite activity is 
  ${activity}, suggest me a couple of location that I must visit 
  with detailed reasons why you suggest those spots.
  Also, Based on the fact that I take care of ${requirement}, 
  suggest me a couple of ${requirement} friendly tourist spots 
  with detailed reasons why you suggest those spots. 
  Considering for-broken means very tight budget, average means average budget, 
  flex means I don't care how much I spend on my vacation. If my budget is ${budget}, 
  you should take it into consideration. When you suggest above. 

You must format your response using Bootstrap HTML in the following form, 
\adding Bootstrap classes to make the response look nice:

<div class="container">...</div>
`;

  console.log({ prompt });
  return prompt;
}

// NOTE: we use `async` here because we need to do a long-running call over
// the network, and wait (i.e., `await`) the response.  The `async` keyword
// is needed on any function that needs to run asynchronous calls and `await`.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
async function chat(depart, arrival, duration, budget, activity, requirement) {
  // Setup the openai client
  const openai = configureOpenAI();

  // Define our list of messages to send in our "chat", see:
  // https://platform.openai.com/docs/guides/chat
  const messages = [
    // System prompt tells the AI how to function
    {
      role: "system",
      content: "You are a travel agent, helping customers plan their trip.",
    },
    // User prompt is what we want it to do
    {
      role: "user",
      // Build the prompt using our function and the user's data
      content: buildUserPrompt(
        depart,
        arrival,
        duration,
        budget,
        activity,
        requirement
      ),
    },
  ];

  // Any network request could fail, so we use try/catch
  try {
    // Send our messages to OpenAI, and `await` the response (it will take time)
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
    });

    // The response we get back will be a complex object, and we want to drill in
    // to get our data, see https://platform.openai.com/docs/guides/chat/response-format
    const answer = completion.data.choices[0].message.content;
    console.log({ answer });

    displayOutput(answer);
  } catch (error) {
    // If anything goes wrong, show an error in the console (we could improve this...)
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  } finally {
    // Re-enable the submit button so the user can try again
    toggleSubmitButton();
  }
}

// Toggle the Submit button to a Loading... button, or vice versa
function toggleSubmitButton() {
  const submitButton = document.querySelector(
    "#input-form button[type=submit]"
  );

  // Flip the value true->false or false->true
  submitButton.disabled = !submitButton.disabled;

  // Flip the button's text back to "Loading..."" or "Submit"
  const submitButtonText = submitButton.querySelector(".submit-button-text");
  //debugger;
  if (submitButtonText.innerHTML === "Loading...") {
    submitButtonText.innerHTML = "Submit";
  } else {
    submitButtonText.innerHTML = "Loading...";
  }

  // Show or Hide the loading spinner
  const submitButtonSpinner = submitButton.querySelector(
    ".submit-button-spinner"
  );
  submitButtonSpinner.hidden = !submitButtonSpinner.hidden;
}

// Update the output to use new HTML content
function displayOutput(html) {
  // Put the AI generated HTML into our output div.  Use `innerHTML` so it renders as HTML
  const output = document.querySelector("#output");
  output.innerHTML = html;
}

// Set the output to nothing (clear it)
function clearOutput() {
  displayOutput("");
}

// Process the user's form input and send to ChatGPT API
function processFormInput(form) {
  // Get values from the form
  const depart = form.departure.value.trim();
  const arrival = form.arrival.value.trim();
  const duration = form.period.options[period.selectedIndex].text;
  const budget = form.budget.value;
  const activity = form.activity.value;
  const requirement = form.requirements.value;

  // Update the Submit button to indicate we're done loading
  toggleSubmitButton();

  // Clear the output of any existing content
  clearOutput();

  // Send the input values to OpenAI's ChatGPT API
  chat(depart, arrival, duration, budget, activity, requirement);
}

function main() {
  // Wait for the user to submit the form
  document.querySelector("#input-form").onsubmit = function (e) {
    // Stop the form from submitting, we'll handle it in the browser with JS
    e.preventDefault();

    // Process the data in the form, passing the form to the function
    processFormInput(e.target);
  };
}

// Wait for the DOM to be ready before we start
addEventListener("DOMContentLoaded", main);
