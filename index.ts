import { LoginResult, TwitterApi } from 'twitter-api-v2';
import { Bot } from "grammy";
import { config } from './config';
import cron from 'cron';
import fs from "fs";

const words = fs.readFileSync("words.txt", "utf-8").split("\r");

class TelegramClient {
    private bot: Bot;
    private twitterClient: TwitterClient;

    constructor(token: string, twitterClient: TwitterClient) {
        this.twitterClient = twitterClient;
        this.bot = new Bot(token);
        this.setCommands();
        this.hearCommands();
        this.hearToken();
        this.bot.start();
    }

    private async setCommands() {
        this.bot.api.setMyCommands([ { command: "newlogin", description: "Login to Twitter" } ]);
    }

    private async hearCommands() {
        this.bot.command("newlogin", async (ctx) => {
            await this.twitterClient.newLogin(this);
        });
    }
    
    private async hearToken() {
        this.bot.on("message:text", async (ctx) => {
            ctx.reply("Validando...")
            const token = ctx.msg.text.split("oauth_verifier=")[1];
            await ctx.reply("Token: " + token).catch((err) => console.log(err));
            const loginUser = await this.twitterClient.loginUser(token);
            if (loginUser instanceof Error) return await ctx.reply("Erro ao validar: " + loginUser.message).catch((err) => console.log(err));
            await ctx.reply("Validado com exito!").catch((err) => console.log(err));
            await ctx.reply(JSON.stringify(loginUser.loggedClient, null, 2)).catch((err) => console.log(err));
        });
    }

    public async sendAuthLink(authLink: string) {
        await this.bot.api.sendMessage(config.ownerTelegramChatId, authLink).catch((err) => console.log(err));
    }
}

class TwitterClient {
    private appKey: string;
    private appSecret: string;
    private authLink?: {
      oauth_token: string;
      oauth_token_secret: string;
      oauth_callback_confirmed: "true";
      url: string;
    };
    private loggedClient?: LoginResult;
    public client?: TwitterApi;

    constructor(appKey: string, appSecret: string) {
        this.appKey = appKey;
        this.appSecret = appSecret;
    }

    public async loginUser(oauthVerifier: string): Promise<{loggedClient: LoginResult, client: TwitterApi} | Error> {
        if(!this.authLink) return new Error("No auth link");
        this.loggedClient = await new TwitterApi({ appKey: this.appKey, appSecret: this.appSecret, accessToken: this.authLink.oauth_token, accessSecret: this.authLink.oauth_token_secret }).login(oauthVerifier).catch((err) => { return err; });
        if(!this.loggedClient) return new Error("Error in login");
        console.log(this.loggedClient);
        this.client = new TwitterApi({ appKey: this.appKey, appSecret: this.appSecret, accessToken: this.loggedClient.accessToken, accessSecret: this.loggedClient.accessSecret });
        console.log(this.client);
        return { loggedClient: this.loggedClient, client: this.client };
    }

    public async newLogin(telegramClient: TelegramClient) {
        this.authLink = await new TwitterApi({ appKey: this.appKey, appSecret: this.appSecret }).generateAuthLink("https://localhost:3000").catch((err) => { return err; });
        if(!this.authLink) return new Error("Error in auth link");
        console.log(this.authLink.url);
        await telegramClient.sendAuthLink(this.authLink.url);
    }
}

const start = async () => {
    const twitterClient = new TwitterClient(config.appKey, config.appSecret);
    const telegramClient = new TelegramClient(config.token, twitterClient);

    await twitterClient.newLogin(telegramClient);

    const runEveryDay = new cron.CronJob('0 0 15 * * *', async () => {
        const tweet = await twitterClient.client?.v1.tweet(
            words[Math.floor(Math.random() * words.length)]
        ).catch((err) => { console.log(err); });
        console.log(tweet);
    });

    runEveryDay.start();
}

start();