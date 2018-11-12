import * as functions from 'firebase-functions';
import { 
    dialogflow, 
    DialogflowConversation,
    RichResponse
} from "actions-on-google";
import { OpenTriviaResponse } from './openTrivia';

const fetch = require('isomorphic-fetch');
const app = dialogflow();

const welcome = (conv:DialogflowConversation) => {
    conv.add('Hey! Welcome to the True or False Quiz');
}

const askQestion = (conv:DialogflowConversation, params) => {
    const difficulty = params.questionDifficulty;
    const convData: any = conv.data;
    if(convData && convData.lastCorrect!==undefined){
        conv.add(`<speak><p>${convData.lastCorrect?'Correct!':'Incorrect!'}</p></speak>`);
    };
    return fetch('https://opentdb.com/api.php?amount=1&type=boolean')
        .then((response) => {
            if (response.status < 200 || response.status >= 300) {
                throw new Error(response.statusText);
            } else {
                return response.json();
            }
        })
        .then((response:OpenTriviaResponse) => {
            const q = response.results[0];
            convData.answer = (q.correct_answer === "True");
            conv.ask(`<speak>True or False, ${decodeURI(q.question)}.</speak>`);
        })
}

const checkAnswer = (conv:DialogflowConversation, params: any) => {
    const convData: any = conv.data;
    convData.lastCorrect = (params.answerTrueFalse === convData.answer.toString());
    conv.followup('questionASK');
}

app.intent('welcome', welcome);
app.intent('question.ASK', askQestion);
app.intent('question.ANSWER', checkAnswer);

export const trueOrFalse = functions.https.onRequest(app);