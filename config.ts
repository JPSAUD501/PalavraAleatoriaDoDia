import dotenv from 'dotenv';
dotenv.config();

export const config: {
  appKey: string;
  appSecret: string;
  token: string;
  ownerTelegramChatId: string;
} = {
  appKey: process.env.APP_KEY as string,
  appSecret: process.env.APP_SECRET as string,
  token: process.env.BOT_TOKEN as string,
  ownerTelegramChatId: "481724580",
}