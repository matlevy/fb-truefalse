export interface OpenTriviaQuestion {
    category: string;
    type: string;
    difficulty: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
}

export interface OpenTriviaResponse {
    response_code: number;
    results: OpenTriviaQuestion[];
}