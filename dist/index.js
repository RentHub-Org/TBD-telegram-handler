"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const dotenv_1 = __importDefault(require("dotenv"));
const RequestSet_1 = __importDefault(require("./RequestSet"));
const client_1 = require("@prisma/client");
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const bot = new telegraf_1.Telegraf(process.env.TELEGRAM_BOT_TOKEN); // Let's instantiate a bot using our token.
console.log("obt token: ", process.env.TELEGRAM_BOT_TOKEN);
// We can get bot nickname from bot informations. This is particularly useful for groups.
bot.telegram.getMe().then((bot_informations) => {
    console.log("Server has initialized bot nickname. Nick: " + bot_informations.username);
});
// Command example, pretty easy. Each callback passes as parameter the context.
// Context data includes message info, timestamp, etc; check the official documentation or print ctx.
bot.command('start', (ctx) => ctx.reply('Welcome to Renthub Bot!\n\nService currently availabe:\n\n Fremium claim✅: /claim <tron_base56_address>\n\nVia Chat Upload⏳: ... will be added soon'));
bot.command('claim', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const message = ctx.message;
    if (message && 'text' in message) {
        const address = message.text.split(' ')[1];
        const username = ((_b = (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.from) === null || _b === void 0 ? void 0 : _b.username) || '';
        if (address === undefined) {
            ctx.reply("Please provide a valid address message !!\n Usage: /claim <address>");
            return;
        }
        console.log(username, address);
        try {
            const user = yield prisma.user.findUnique({
                where: {
                    address
                }
            });
            if (!user) {
                ctx.reply("Invalid address provided or user not registered. Please register first");
                return;
            }
        }
        catch (e) {
            ctx.reply("Invalid address provided or user not registered. Please register first");
            return;
        }
        if (RequestSet_1.default.Check(username)) {
            // first validdate the address
            try {
                // then add the claim
                const updateuser = yield prisma.user.update({
                    where: {
                        address
                    },
                    data: {
                        credits: {
                            increment: 30000
                        }
                    }
                });
                if (!updateuser) {
                    throw new Error("Failed to update user credits");
                }
                const newCreditUsage = yield prisma.creditUsage.create({
                    data: {
                        userAddr: address, // Link the User's address
                        credits: 30000, // The amount of credits to append
                        // You can omit the timestamp field since it defaults to the current time (now())
                    },
                });
                if (!newCreditUsage) {
                    throw new Error("Failed to add creditfield for graph.");
                }
                ctx.reply(`3000 credits added to: ${address}\nClaim requested by: @${username}\nReclaim later after 24 hours`);
            }
            catch (e) {
                console.log(e);
                ctx.reply("Denial Of seervice:\n\n1. Invalid address provided or user not registered. Please register first\n2. Unavailable right now. Please try again later");
            }
        }
        else {
            ctx.reply("You have already claimed in last 24 hours");
        }
    }
    else {
        yield ctx.reply('Please provide a valid address message !!\n Usage: /claim <address>');
    }
}));
bot.command('clear', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const username = ((_b = (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.from) === null || _b === void 0 ? void 0 : _b.username) || 'unknown';
    if (RequestSet_1.default.clear(username)) {
        ctx.reply("Data cleared!");
        return;
    }
    ctx.reply("You are not authorized to clear data");
}));
bot.command('print', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const username = ((_b = (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.from) === null || _b === void 0 ? void 0 : _b.username) || 'unknown';
    const data = RequestSet_1.default.print(username);
    switch (data) {
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
}));
bot.launch();
