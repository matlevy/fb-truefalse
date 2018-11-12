import * as functions from 'firebase-functions';
import { 
    dialogflow, 
    DialogflowConversation
} from "actions-on-google";
import { OpenTriviaResponse } from './openTrivia';

const fetch = require('isomorphic-fetch');
const app = dialogflow();

const welcome = (conv:DialogflowConversation) => {
    conv.add('Hey! Welcome to the True or False Quiz');
    console.log('Quiz opened');
}

const poseQuestion = (conv:DialogflowConversation) => {
    const convData: any = conv.data;
    const q = convData.questions.pop();
    convData.answer = (q.correct_answer === "True");
    conv.ask(`<speak>True or False, ${decodeURI(q.question)}.</speak>`);
}

const askQuestion = (conv:DialogflowConversation, params) => {
    const difficulty = params.questionDifficulty;
    const convData: any = conv.data;
    const quantity = params.questionQuantity ? params.questionQuantity : 1;
    if(convData.questions===undefined) {
        convData.questions = [];
    }
    console.log(params, convData);
    if(convData.questions.length===0) {
        return fetch(`https://opentdb.com/api.php?amount=${quantity}&type=boolean`)
            .then((response) => {
                if (response.status < 200 || response.status >= 300) {
                    throw new Error(response.statusText);
                } else {
                    return response.json();
                }
            })
            .then((response:OpenTriviaResponse) => {
                convData.questions = response.results;
                poseQuestion(conv);
            })
    } else {
        if(convData && convData.lastCorrect!==undefined){
            conv.add(`<speak><p>${convData.lastCorrect?'Correct!':'Incorrect!'}</p></speak>`);
        };
        poseQuestion(conv);
    }
}

const checkAnswer = (conv:DialogflowConversation, params: any) => {
    const convData: any = conv.data;
    console.log(params);
    convData.lastCorrect = (params.answerTrueFalse === convData.answer.toString());
    if(convData.questions.length>0) {
        conv.followup('questionASK');
    } else {
        conv.followup('questionsComplete');
    }
}

const quizComplete = (conv:DialogflowConversation, params: any) => {
    console.log('Quiz complete: ', params);
    const convData: any = conv.data;
    conv.add(`<speak><p>${convData.lastCorrect?'Correct!':'Incorrect!'}</p></speak>`);
    conv.close('Thank you for playing!');
}

app.intent('welcome', welcome);
app.intent('question.ASK', askQuestion);
app.intent('question.ANSWER', checkAnswer);
app.intent('quiz.COMPLETE', quizComplete);

export const trueOrFalse = functions.https.onRequest(app);