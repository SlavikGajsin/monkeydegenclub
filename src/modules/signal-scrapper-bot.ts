import {TelegramClient} from "telegram";
import {SolanaTokenDataService} from "./utils/solana-token-data-service.js";
import {SignalsComposer} from "./signals-composer/signals-composer.js";
import {SolanaUtils} from "./utils/solana-contract-parser.js";
import {TelegramScrapper} from "./tg-scrapper/tg-scrapper.js";
import {DebuggerService} from "./debugger/index.js";

type SuperGroupConfig = {
    type: 'supergroup'
    chatId: string
    topicId: string
}

type ChannelConfig = {
    type: 'channel'
    chatId: string
}

type ChatConfig = {
    type: 'chat'
    chatId: string
}

type ConstructorParams = {
    channelsToWatch: string[]
    signalChat: SuperGroupConfig | ChannelConfig | ChatConfig
    signalLifetime?: number /** ms */
    telegramClient: TelegramClient
    solanaTokenDataService: SolanaTokenDataService
    debuggerService: DebuggerService
}

const ONE_HOUR = 60 * 1000 * 60

export class SignalScrapperBot {
    private readonly telegramClient: TelegramClient
    private readonly channelsToWatch: string[]
    private readonly signalChat: SuperGroupConfig | ChannelConfig | ChatConfig
    private readonly signalLifetime: number
    private readonly solanaTokenDataService: SolanaTokenDataService
    private readonly telegramScrapper: TelegramScrapper
    private readonly signalsComposer: SignalsComposer
    private readonly debuggerService: DebuggerService

    constructor({
        channelsToWatch,
        signalChat,
        signalLifetime = ONE_HOUR,
        telegramClient,
        solanaTokenDataService,
        debuggerService
    }: ConstructorParams) {
        this.telegramClient = telegramClient
        this.channelsToWatch = channelsToWatch
        this.signalChat = signalChat
        this.signalLifetime = signalLifetime
        this.solanaTokenDataService = solanaTokenDataService
        this.debuggerService = debuggerService

        this.telegramScrapper = new TelegramScrapper(telegramClient)

        // this.signalHandler.bind(this)

        this.signalsComposer = new SignalsComposer(
            {
                chatIdsToTrack: this.channelsToWatch,
                signalLifetime: this.signalLifetime,
            },
            this.signalHandler,
            this.debuggerService
        );

        this.init()
    }

    private init() {
        this.channelsToWatch.forEach(chatId => {
            this.telegramScrapper.subscribeChannelMessages(chatId, (message) => {
                const stringMessage = String(message)

                const contractAddress = SolanaUtils.parseContractAddressFromString(stringMessage)

                if (contractAddress) {
                    this.signalsComposer.addSignal(contractAddress, chatId)
                }
            })
        })
    }

    private signalHandler = async (tokenAddress: string) => {
        let message = '';

        if (tokenAddress) {
            message += `\`${tokenAddress}\``;

            const tokenData = await this.solanaTokenDataService.getTokenData(
                tokenAddress
            );

            if (tokenData) {
                // message += `/n ${JSON.stringify(tokenData)}`;

                if (tokenData.ticker) {
                    message += `\n(${tokenData.ticker})`
                }

                if (tokenData.marketCap && !Number.isNaN(Number(tokenData.marketCap))) {
                    message += `\n$ ${Math.floor(Number(tokenData.marketCap) / 1000)}k MC`
                }
            }
        }

        if (!tokenAddress) {
            message = 'LOL HACKER HAS A REST AND U SHOULD TOO'
        }

        await Promise.allSettled([
            // client.sendMessage(-1002510658856, { message, replyTo: 2 }), // приватка где тестится бот
            this.telegramClient.sendMessage('RTD_makes', { message: message + ' (signal)' }),

            new Promise(async (resolve) => {
                if (this.signalChat.type === 'supergroup') {
                    await this.telegramClient.sendMessage(this.signalChat.chatId, { message, replyTo: Number(this.signalChat.topicId) })
                } else {
                    await this.telegramClient.sendMessage(this.signalChat.chatId, { message })
                }

                resolve(null)
            })
        ])
    }
}