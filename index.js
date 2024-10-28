const { Client, GatewayIntentBits } = require("discord.js");
const { ChatGroq } = require("@langchain/groq");
const { ConversationChain } = require("langchain/chains");
const { BufferMemory } = require("langchain/memory");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Initialize Groq
const groq = new ChatGroq({
  apiKey: process.env.GROK_API_KEY,
  model: "mixtral-8x7b-32768",
  temperature: 0.7,
});

const chain = new ConversationChain({
  llm: groq,
  memory: new BufferMemory(),
});

// Event handler when bot is ready
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Message handler
client.on("messageCreate", async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Check if message starts with !ask
  if (message.content.startsWith("!ask")) {
    try {
      // Get the question from message
      const question = message.content.slice(5).trim();

      if (!question) {
        await message.reply("Please provide a question after !ask");
        return;
      }

      // Show typing indicator
      await message.channel.sendTyping();

      // Get response from LangChain conversation chain
      const response = await chain.call({
        input: question,
      });

      // Send response back to Discord
      await message.reply({
        content: response.response,
        split: true, // Split long messages if needed
      });
    } catch (error) {
      console.error("Error processing question:", error);
      await message.reply(
        "Sorry, I encountered an error processing your question."
      );
    }
  }
});

// Error handler
client.on("error", (error) => {
  console.error("Discord client error:", error);
});

// Start the bot
client.login(process.env.DISCORD_TOKEN);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down...");
  client.destroy();
  process.exit(0);
});
