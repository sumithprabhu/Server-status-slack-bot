import { PushAPI, CONSTANTS } from "@pushprotocol/restapi";
import { ethers } from "ethers";
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();


const signer = new ethers.Wallet(process.env.PVT_KEY)
const slackWebhookUrl = process.env.SLACK_WEBHOOK

const userAlice = await PushAPI.initialize(signer, { env: CONSTANTS.ENV.PROD });

const bobWalletAddress = "0x71Ffa5771E8019787190D098586EFe02026a3c8C";

const questionPool = ['Hi', 'Hello', 'What is Push protocol ?', 'What is Push chat ?', 'What is difference between Push notification and Push chat', 'good night', 'What is push notification ?'];
const fromAdd = "eip155:0x71Ffa5771E8019787190D098586EFe02026a3c8C"; // The DID you want to check messages from

async function sendQuestionAndMonitorResponse() {
    // Select a random question from the pool
    const question = questionPool[Math.floor(Math.random() * questionPool.length)];

    // Send the question
    const sendMessageResponse = await userAlice.chat.send(bobWalletAddress, {
        content: question,
    });
    console.log("Message sent timestamp:", sendMessageResponse);

    // Wait for 30 seconds
    setTimeout(async () => {
        // Retrieve the latest message
        const chatHistory = await userAlice.chat.history(bobWalletAddress);
        const latestMessage = chatHistory[0];
        // Check conditions
        if (latestMessage && latestMessage.timestamp > sendMessageResponse.timestamp
            && latestMessage.messageContent && latestMessage.fromDID === fromAdd) {
            // All conditions met, do not send to Slack
            await axios.post(slackWebhookUrl, {
                text: `Bot is working great , Latest question asked : ${question} || Answer : ${latestMessage.messageContent}`
            });
            console.log(`Bot is working great , Latest question asked : ${question} || Answer : ${latestMessage.messageContent}`);
        } else {
            // Conditions not met, send notification to Slack
            await axios.post(slackWebhookUrl, {
                text: `Alert : Bot has stopped working.`
            });
            console.log("Notification sent to Slack.");
        }
    }, 45000);
}

function callHourly() {
    sendQuestionAndMonitorResponse(); // Call it immediately if needed at start
    setInterval(sendQuestionAndMonitorResponse, 3600000); // 3600000 milliseconds = 1 hour
}

callHourly();

