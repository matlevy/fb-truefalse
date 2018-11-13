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
    console.log('Question:', q);
    convData.answer = (q.correct_answer === "True");
    conv.ask(`<speak>True or False, ${decodeURI(q.question)}.</speak>`);
}

const getTopicID = (topic:string) => {
    switch(topic) {
        case 'general':
            return 9;
        case 'books':
            return 12;
        case 'film':
            return 11;
        case 'music':
            return 12;
        case 'theatre':
            return 13;
        case 'television':
            return 14;
        case 'video games':
            return 15;
        case 'science and nature':
            return 17;
        case 'computers':
            return 18;
        case 'mythology':
            return 20;
        case 'sport':
            return 21;
        case 'geography':
            return 22;
        case 'history':
            return 23;
        case 'politics':
            return 24;
        case 'art':
            return 25;
        case 'celebreties':
            return 26;
        case 'animals':
            return 27;
        case 'vehicles':
            return 28;
        case 'comics':
            return 30;
        case 'anime':
            return 31;
        case 'cartoons':
            return 32;
    }
    return 0;
}

const askQuestion = (conv:DialogflowConversation, params) => {
    const convData: any = conv.data;
    const quantity = params.questionQuantity ? params.questionQuantity : 1;
    const topic = params.questionTopic ? params.questionTopic : null;
    const skill = params.questionDifficulty ? params.questionDifficulty : null;
    if(convData.questions===undefined) {
        convData.questions = [];
    }
    console.log(params, convData);
    if(convData.questions.length===0) {
        const skillPart = skill ? ['difficulty=', skill].join('') : '';
        const topicPart = topic ? ['category=', getTopicID(topic)].join('') : '';
        const query = [ `amount=${quantity}`, 'type=boolean', topicPart, skillPart ].join('&');
        const questionURL = `https://opentdb.com/api.php?${query}`;
        console.log(query);
        return fetch(questionURL)
            .then((response) => {
                if (response.status < 200 || response.status >= 300) {
                    conv.add('Oops... There was a problem fetching your questions. Try again.')
                } else {
                    return response.json();
                }
            })
            .then((response:OpenTriviaResponse) => {
                convData.questions = response.results;
                if(convData.questions.length>0){
                    conv.add(`Ok...`)
                    poseQuestion(conv);
                } else {
                    if(topic) {
                        conv.add(`Sorry I couldn't find any questions for that topic. Try asking for fewer questions or a different topic.`)
                    } else {
                        conv.add(`Sorry I couldn't find any questions. Try asking for fewer`)
                    }
                }
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
    convData.correct += convData.lastCorrect ? 1 : 0;
    convData.incorrect += !convData.lastCorrect ? 1 : 0;
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
    if(convData.correct){
        conv.add(`Ok... That finished your question set. Of the questions covered, you have answered 
            ${convData.correct} correct and ${convData.incorrect} wrongly.`);
    }
}

app.intent('welcome', welcome);
app.intent('question.ASK', askQuestion);
app.intent('question.ANSWER', checkAnswer);
app.intent('quiz.COMPLETE', quizComplete);

export const trueOrFalse = functions.https.onRequest(app);