import * as functions from 'firebase-functions';
import { 
    dialogflow, DialogflowConversation 
} from "actions-on-google";
import { OpenTriviaResponse } from './openTrivia';

const fetch = require('isomorphic-fetch');
const app = dialogflow();

const welcome = (conv:DialogflowConversation) => {
    conv.add('Hey! Welcome to the True or False Quiz');
    conv.followup('questionASK');
}

const askQestion = (conv:DialogflowConversation) => {
    return fetch('https://opentdb.com/api.php?amount=1&type=boolean')
        .then((response) => {
            if (response.status < 200 || response.status >= 300) {
                throw new Error(response.statusText);
            } else {
                return response.json();
            }
        })
        .then((response:OpenTriviaResponse) => {
            const question = response.results[0];
            conv.ask(`True or False, ${question.question}.`);
        })
}

app.intent('welcome', welcome);
app.intent('question.ASK', askQestion);

export const trueOrFalse = functions.https.onRequest(app);