import { Context, Markup, Telegraf } from "telegraf";
import dotenv from "dotenv";
import UserHandler from "./RequestSet";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { stringify } from "querystring";


dotenv.config();
const prisma = new PrismaClient();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN as string | "");    // Let's instantiate a bot using our token.
const admins = new Map<String, Context>();

//code to timeout the request...
setTimeout(async ()=>{
    // do axios request...
    axios.get("https://be.renthub.cloud").then((res)=>{
        console.log("Server pinged!");
    }).catch((e)=>{
        admins.forEach((ctx)=>{
            ctx.reply("Server is down! Please check the server");
        });
        console.log("Server ping failed!");
    });
},1000 * 60 * 10);


console.log("obt token: ", process.env.TELEGRAM_BOT_TOKEN);
// We can get bot nickname from bot informations. This is particularly useful for groups.
bot.telegram.getMe().then((bot_informations) => {
    console.log("Server has initialized bot nickname. Nick: "+bot_informations.username);
});

// Command example, pretty easy. Each callback passes as parameter the context.
// Context data includes message info, timestamp, etc; check the official documentation or print ctx.
bot.command('start', (ctx) => ctx.reply('Welcome to Renthub Bot!\n\nService currently availabe:\n\n Fremium claim✅: /claim <tron_base56_address>\n\nVia Chat Upload⏳: ... will be added soon'));


bot.command('claim', async (ctx: Context) => {
    const message = ctx.message;
    if (message && 'text' in message) {
        const address = message.text.split(' ')[1];
        const username = ctx.message?.from?.username || '';
        if(address === undefined){
            ctx.reply("Please provide a valid address message !!\n Usage: /claim <address>");
            return;
        }
        console.log(username, address);
        try{
            const user = await prisma.user.findUnique({
                where: {
                    address
                }
            }) 
            if(!user){
                ctx.reply("Invalid address provided or user not registered. Please register first");
                return;
            }
        }catch(e){
            ctx.reply("Invalid address provided or user not registered. Please register first");
            return;
        }
        if(UserHandler.Check(username)){
            // first validdate the address
            try{
                // then add the claim
                const updateuser = await prisma.user.update({
                    where: {
                        address
                    },
                    data: {
                        credits: {
                            increment: 30000
                        }
                    }
                })
                if(!updateuser){
                    throw new Error("Failed to update user credits");
                }
                const newCreditUsage = await prisma.creditUsage.create({
                    data: {
                        userAddr: address, // Link the User's address
                        credits: 30000, // The amount of credits to append
                        // You can omit the timestamp field since it defaults to the current time (now())
                    },
                });
                if(!newCreditUsage){
                    throw new Error("Failed to add creditfield for graph.");
                }
                ctx.reply(`3000 credits added to: ${address}\nClaim requested by: @${username}\nReclaim later after 24 hours`);
            }catch(e){
                console.log(e);
                ctx.reply("Denial Of seervice:\n\n1. Invalid address provided or user not registered. Please register first\n2. Unavailable right now. Please try again later");
            }
        }
        else{
            ctx.reply("You have already claimed in last 24 hours");
        }
    } else {
        await ctx.reply('Please provide a valid address message !!\n Usage: /claim <address>');
    }
});

bot.command('clear', async (ctx: Context) => {
    const username = ctx.message?.from?.username || 'unknown';
    if(UserHandler.clear(username)){
        ctx.reply("Data cleared!");
        return;
    }
    ctx.reply("You are not authorized to clear data");
});

bot.command('print', async (ctx: Context) => {
    const username = ctx.message?.from?.username || 'unknown';
    const data = UserHandler.print(username);
    switch(data){
        case typeof undefined:
            ctx.reply("You are not authorized to print data");
            break;
        case typeof String:
            ctx.reply(data);
            break;
        default:
            ctx.reply("internal error");
            break;
    }
});

bot.command('addMe', async (ctx: Context) => {
    const username = ctx.message?.from?.username;
    if(!username){
        ctx.reply("no useer name found.");
        return;
    }
    if(username == "p_soni2022" || username == "Oxarman76"){
        if(!admins.has(username)){
            admins.set(username,ctx);
            ctx.reply("Admin added!");
            return;
        }
        ctx.reply("Admin already existed!");
        return;
    }
    ctx.reply("Not authorised......");
    return;
});


bot.launch();