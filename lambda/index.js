const Alexa = require('ask-sdk-core');
const Util = require('./util.js');
const axios = require('axios');
// Tokens
const TOKEN = require('./tokens.js')
// Launch intent APL
const headline = require('./apl/layouts/headline.json')
const headlines = require('./apl/data/headlines.json')
// Pet Quiz
const quiz = require('./apl/layouts/quiz.json')
const quizQuestions = require('./apl/data/quizQuestions');
const questionResultAPLA = require('./apl/apla/questionResultAPLA');
// Video intent APL
const video = require('./apl/layouts/video.json');
const videoData = require('./apl/data/videos.json');
// Pet sounds intent APL and APLA docs
const petSounds = require('./apl/layouts/pet-sounds.json');
const dogSoundsAPLA = require('./apl/apla/dogSoundsAPLA.json');
const catSoundsAPLA = require('./apl/apla/catSoundsAPLA.json');
// Test 
const testapl = require('./apl/layouts/case-2451.json');
const testapldata = require('./apl/data/case-2451.json');


const LaunchRequestIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = "Welcome to Pet Playground! You can say something like 'tell me a cat fact', 'give me a dog fact', or 'play pet sounds'.  Or you can ask to start a quiz, a video, or pet sounds.  What would you like to do?";
        const reprompt = "You can ask for a cat fact, dog fact, pet sounds, a puppy video, or pet sounds.  What would you like to do?";
        
        const responseBuilder = handlerInput.responseBuilder;
        
        const supportedInterfaces = Alexa.getSupportedInterfaces(handlerInput.requestEnvelope);
        const supportsNavigation = supportedInterfaces.Navigation ? true : false
        // console.log(`supported interfaces: ${supportedInterfaces}`)
        console.log(`supports navigation: ${supportsNavigation}`)

        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // Add the RenderDocument directive to the responseBuilder
            responseBuilder.addDirective({
                type: 'Alexa.Presentation.APL.RenderDocument',
                token: TOKEN,
                // document: headline,
                // datasources: headlines
                document: testapl,
                datasources: testapldata
            })
        }
        
        responseBuilder.addDirective(
        {
     type: "Navigation.SetDestination",
         destination: {
             singleLineDisplayAddress: "ADDRESS",
             multipleLineDisplayAddress: "ADDRESS",
             name: "NAME",
             coordinate: {
                   latitudeInDegrees: 33.78974233786115,
                   longitudeInDegrees: -117.81273767438854
             }
        },
        transportationMode: "DRIVING"
}    
        )

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(reprompt)
            .getResponse();

    }
};

// Start the quiz 
const startQuizIntentHandler = {
    canHandle(handlerInput) {
        console.log(handlerInput.requestEnvelope)
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'QuizIntent';
    },
    handle(handlerInput) {
        // Get an array of random questions
        const quizData = getRandomQuestions(quizQuestions, 3);
        
        // quizData array item example:
        // {
        //     "question": "Which of the following is NOT a function of a cat's tail?",
        //     "choices": [
        //         {
        //             "text": "balance",
        //             "correct": false
        //         },   
        //         {
        //             "text": "communication",
        //             "correct": false
        //         },   
        //         {
        //             "text": "flight",
        //             "correct": true
        //         },   
        //         {
        //             "text": "mood signaling",
        //             "correct": false
        //         },   
        //     ],
        //     "category": "cats",
        //     "source": "https://modkat.com/blogs/modkat-purrr/18-surprising-facts-about-our-feline-friends?gclid=Cj0KCQjwspKUBhCvARIsAB2IYuteE-1xf330tPiwnqimIsE0sErgaW5DV9XDDw53B0UGo7TgyhGH0tQaAgGkEALw_wcB"
        // }
        
        // Set initial quiz values
        const counter = 0;
        const score = 0;
        const question = quizData[counter].question;
        const questionCategory = quizData[counter].category;
        let choices = [];
        // const choices = quizData[counter].choices;
        let answer;
        for(let i = 0; i < quizData[counter].choices.length; i++) {
            // Set answer as 1, 2, 3, or 4.
            if(quizData[counter].choices[i].correct) {
                answer = i + 1;
            }
            // Set choices as an array of just the text values
            choices.push(quizData[counter].choices[i].text)
        }

        // Set dialog string for question and choices.
        const currentQuestion = `${quizData[counter].question} a. ${choices[0]}, b. ${choices[1]}, c. ${choices[2]}, or d. ${choices[3]}`

        // Set session attributes
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        attributes.score = score;
        attributes.counter = counter;
        attributes.quizData = quizData;
        attributes.choices = choices;
        attributes.answer = answer;
        attributes.currentQuestion = currentQuestion;

        // Save session attributes
        handlerInput.attributesManager.setSessionAttributes(attributes);

        // Welcome Message
        const welcomeMessages = ["Time to test your pet knowledge. ", "Okay, let's start a pet quiz. ", "Here we go! Here's your first question. "];
        const randomWelcomeMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]

        let speakOutput = `${randomWelcomeMessage} ${currentQuestion}`;
        
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // Set datasource for multipleChoiceTemplateData
            const multipleChoiceTemplateData = {
                "type": "object",
                "properties": {
                    "backgroundImage": "",
                    "titleText": questionCategory,
                    "primaryText": question,
                    "choices": choices,
                    "choiceListType": "alphabet",
                    "headerAttributionImage": "",
                    "footerHintText": "",
                    "questionNumber": 1
                }
            }
            
            // Add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective({
                "type": "Alexa.Presentation.APL.RenderDocument",
                "token": TOKEN,
                "document": quiz,
                "datasources": {
                    "multipleChoiceTemplateData": multipleChoiceTemplateData
                }
            })
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(question)
            .getResponse();

    }
}

// Handle User Guess (Verbal)
const QuizGuessIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'QuizGuessIntent'
    },
    handle(handlerInput) {
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        let { score, counter, quizData } = attributes; // set local variables from session attributes
        
        // Determine if guess is correct, then update score and counter
        const correct = true
        
        if(correct) score++
        counter++
        
        // Update session attributes
        attributes.score = score;
        attributes.counter = counter;
        let question, questionCategory, choices;
        if (counter !== quizData.length) {
            question = quizData[counter].question;
            questionCategory = quizData[counter].category;
            choices = quizData[counter].choices;
            attributes.currentQuestion = quizData[counter].question; // The currentQuestion attribute represents the question just spoken (and the question on the screen).  This is repeated within QuizRepeatIntentHandler. 
        }
        
        console.log({ score, counter, quizData, choices, questionCategory, correct })
        
        // Save session attributes
        handlerInput.attributesManager.setSessionAttributes(attributes);

        // Build Alexa speech
        let speakOutput = '';
        let reprompt;
        const responseBuilder = handlerInput.responseBuilder;
        if (counter === (quizData.length)) {
            speakOutput += `Your final score is ${score} out of ${quizData.length}. Say "play a pet quiz" to play again!`;
        } else {
            speakOutput = correct ? `Correct!. ` : `Sorry, the correct answer was . `
            speakOutput += `Here's your next question. ${quizData[counter].question}`
            reprompt = question;
        }
        
        if(!(counter >= quizData.length)) {
            if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
                // Set datasource for multipleChoiceTemplateData
                const multipleChoiceTemplateData = {
                    "type": "object",
                    "properties": {
                        "backgroundImage": "",
                        "titleText": questionCategory,
                        "primaryText": question,
                        "choices": choices,
                        "choiceListType": "alphabet",
                        "headerAttributionImage": "",
                        "footerHintText": ""
                    }
                }
            
                // Add the RenderDocument directive to the responseBuilder
                handlerInput.responseBuilder.addDirective({
                    "type": "Alexa.Presentation.APL.RenderDocument",
                    "token": TOKEN,
                    "document": quiz,
                    "datasources": {
                        "multipleChoiceTemplateData": multipleChoiceTemplateData
                    }
                })
            }
        
            return responseBuilder
                .speak(speakOutput)
                .reprompt(question)
                .getResponse();
        } else {
            return responseBuilder
                .speak(speakOutput)
                .getResponse();
        }
    }
}

// Handle User Guess (Touch Event)
const QuizChoiceButtonEventHandler = {
    canHandle(handlerInput) {
        console.log(`inside QuizChoiceButtonEventHandler canHandle(). Handlerinput.requestEnvelope: ${handlerInput.requestEnvelope}`)
        console.log(`handlerInput.requestEnvelope.request.source.id: ${handlerInput.requestEnvelope.request.source.id}`)
        
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'Alexa.Presentation.APL.UserEvent' && (
            handlerInput.requestEnvelope.request.source.id === '1' ||
            handlerInput.requestEnvelope.request.source.id === '2' ||
            handlerInput.requestEnvelope.request.source.id === '3' ||
            handlerInput.requestEnvelope.request.source.id === '4'
        )
    },
    handle(handlerInput) {
        const responseBuilder = handlerInput.responseBuilder;
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        let { score, counter, quizData, answer } = attributes;
        console.log({ score, counter, quizData, answer })
        
        // Determine if guess is correct, then update score and counter
        let guess = handlerInput.requestEnvelope.request.source.id;
        // const guessConverted = (guess === '1' ? 'a' : guess === '2' ? 'b' : guess === '3' ? 'c' : 'd');
        const correct = (answer === guess) ? true : false;
        console.log({ answer, guess, correct })
        if(correct) score++
        counter++

        // Update session attributes
        attributes.score = score;
        attributes.counter = counter;
        let question, questionCategory, choices;
        if (counter !== quizData.length) {
            attributes.currentQuestion = quizData[counter].question; // currentQuestion reflects the question just spoken. TODO: enable repeatIntent to repeat this question
            question = quizData[counter].question;
            questionCategory = quizData[counter].category;
            choices = quizData[counter].choices   
        }
        
        // Save session attributes
        handlerInput.attributesManager.setSessionAttributes(attributes);

        // Build Alexa speech
        let speakOutput = '';
        if (!correct) {
            speakOutput += `Sorry, the correct answer was ${answer}. `
            // `<speak>
            //     <audio src="soundbank://soundlibrary/alarms/buzzers/buzzers_02" />
            //     Sorry, the correct answer was ${answer}. 
            // </speak>`;
        } else {
            speakOutput += `Correct! `
            // `<speak>
            //     <audio src="soundbank://soundlibrary/alarms/beeps_and_bloops/bell_03" />
            //     Correct!
            // </speak>`;
        }
        
        if (counter === (quizData.length)) {
            speakOutput += `Your final score is ${score} out of ${quizData.length}. Say "play a pet quiz" to play again! `
                // `<speak>
                //     <audio src="soundbank://soundlibrary/musical/amzn_sfx_trumpet_bugle_03" />
                //     Your final score is ${score} out of ${quizData.length}. Say "play a pet quiz" to play again!
                // </speak>`;
        } else {
            speakOutput += `Here's your next question. ${quizData[counter].question}`
        }
        
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL'] && !(counter >= quizData.length)) {
            // Set datasource for multipleChoiceTemplateData
            const multipleChoiceTemplateData = {
                "type": "object",
                "properties": {
                    "backgroundImage": "",
                    "titleText": questionCategory,
                    "primaryText": question,
                    "choices": choices,
                    "choiceListType": "alphabet",
                    "headerAttributionImage": "",
                    "footerHintText": ""
                }
            }
            
            // Add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective({
                "type": "Alexa.Presentation.APL.RenderDocument",
                "token": TOKEN,
                "document": quiz,
                "datasources": {
                    "multipleChoiceTemplateData": multipleChoiceTemplateData
                }
            })
        }
        
        return responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
}

const QuizRepeatIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.RepeatIntent'
    },
    handle(handlerInput) {
        let speakOutput = '';
        const responseBuilder = handlerInput.responseBuilder;
        
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        const { currentQuestion } = attributes;
        
        currentQuestion ? speakOutput += `${currentQuestion}` : speakOutput += "Sorry, there is nothing to repeat right now.";
        
        return responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
}

const RandomCatFactIntentHandler = {
    canHandle(handlerInput) {
            handlerInput.requestEnvelope.request.intent.name === 'GetRandomCatFactIntent';
    },
    async handle(handlerInput) {
        let speakOutput;

        try {
            const response = await axios.get('https://cat-fact.herokuapp.com/facts/random');
            const catFact = response.data.text;
            speakOutput += catFact;
        } catch (error) {
            console.log(error);
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
}

const RandomDogFactIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'GetRandomDogFactIntent';
    },
    async handle(handlerInput) {
        let speakOutput = '';

        try {
            const response = await axios.get('https://dog-facts-api.herokuapp.com/api/v1/resources/dogs?number=1');
            const dogFact = response.data[0].fact;
            speakOutput += dogFact;
        } catch (error) {
            console.log(error);
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
}

const kittenVideoIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'VideoIntent';
    },
    handle(handlerInput) {
        const speakOutput = "Enjoy the video!"

        // Add APL and execute commands
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // Add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective({
                type: 'Alexa.Presentation.APL.RenderDocument',
                token: TOKEN,
                document: video,
                // datasources: videoData,
                datasources: 'https://www.learningcontaine.com/wp-content/uploads/2020/05/sample-mp4-file.mp4'
            })
        }

        // send PlayMedia command inside ExecuteCommand directive alongside the RenderDocument directive.    
        // Commands to run on the rendered document identified by the token. The array of commands behaves like an implicit Sequential command. That is, the commands run one after the other rather than in parallel.
        if(Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
          // Add the ExecuteCommands directive to the responseBuilder  
          handlerInput.responseBuilder.addDirective({
                type: 'Alexa.Presentation.APL.ExecuteCommands',
                token: TOKEN,
                commands: [
                    {
                        "type": "PlayMedia",
                        "componentId": "video",
                        "source": "${videoData.videoUrl}",
                        "audioTrack": "foreground"
                    }
                ]
            })
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
}

const PetSoundsIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'PetSoundsIntent';
    },
    handle(handlerInput) {
        const speakOutput = "Please select a sound"

        // Add APL and execute commands
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // Add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective({
                type: 'Alexa.Presentation.APL.RenderDocument',
                token: TOKEN,
                document: petSounds
            })
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
}

const DogSoundsButtonEventHandler = {
    canHandle(handlerInput) {

        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'Alexa.Presentation.APL.UserEvent' &&
            handlerInput.requestEnvelope.request.source.id === 'petADogBtn';
    },
    handle(handlerInput) {

        const dogBark = Util.getS3PreSignedUrl("Media/dog-bark.wav");

        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // Add the ExecuteCommands directive to the responseBuilder  
            handlerInput.responseBuilder.addDirective({
                type: 'Alexa.Presentation.APLA.RenderDocument',
                token: TOKEN,
                document: dogSoundsAPLA,
                datasources: {
                    "dogBark": dogBark,
                }
            })
        }

        return handlerInput.responseBuilder
            .getResponse();
    }
}

const CatSoundsButtonEventHandler = {
    canHandle(handlerInput) {

        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'Alexa.Presentation.APL.UserEvent' &&
            handlerInput.requestEnvelope.request.source.id === 'petACatBtn';
    },
    handle(handlerInput) {
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // Add the ExecuteCommands directive to the responseBuilder  
            handlerInput.responseBuilder.addDirective({
                type: 'Alexa.Presentation.APLA.RenderDocument',
                token: TOKEN,
                document: catSoundsAPLA,
            })
        }

        return handlerInput.responseBuilder
            .getResponse();
    }
}

const HelpHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = "You can say something like 'tell me a  cat fact', 'give me a dog fact', or 'play pet sounds'.  Or you can ask to start a quiz, a video, or pet sounds.  What would you like to do?";

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    },
};

const CancelAndStopHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent' ||
                handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Thanks for visiting Pet Playground. Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    },
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

        return handlerInput.responseBuilder.getResponse(); // send an empty response
    },
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);
        console.log(error.trace);

        return handlerInput.responseBuilder
            .speak('Sorry, I can\'t understand the command. Please say again.')
            .getResponse();
    },
};
// ----------------------------------------------
// Utility Functions
// ----------------------------------------------

// Get three random questions for the quiz
const getRandomQuestions = (arr, num) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
}

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchRequestIntentHandler,
        RandomCatFactIntentHandler,
        RandomDogFactIntentHandler,
        startQuizIntentHandler,
        QuizGuessIntentHandler,
        QuizChoiceButtonEventHandler,
        QuizRepeatIntentHandler,
        kittenVideoIntentHandler,
        PetSoundsIntentHandler,
        DogSoundsButtonEventHandler,
        CatSoundsButtonEventHandler,
        HelpHandler,
        CancelAndStopHandler,
        SessionEndedRequestHandler,
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();