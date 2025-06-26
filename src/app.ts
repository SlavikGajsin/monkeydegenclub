import {TelegramClient, Api} from "telegram";
import input from 'input'
import {TelegramScrapper} from "./modules/tg-scrapper/tg-scrapper.js";
import {StoreSession} from "telegram/sessions/index.js";
import {SignalsComposer} from "./modules/signals-composer/signals-composer.js";
import {SolanaUtils} from "./modules/utils/solana-contract-parser.js";
import {SolanaTokenDataService} from "./modules/utils/solana-token-data-service.js";
import {SignalScrapperBot} from "./modules/signal-scrapper-bot.js";


async function main() {
    const stringSession = new StoreSession('session_')
    await stringSession.load()
    const apiId = 20275345
    const apiHash = 'b049f562d3f21d020e679548d6ef03ac'

    /** Тестовые каналы */
    // const chatIdsToTrack = [
    //     'vyacheslav_sol_tests_1',
    //     'vyacheslav_sol_tests_2'
    // ]

    const TEST_CHANNELS = [
        'vyacheslav_sol_tests_1',
        'vyacheslav_sol_tests_2'
    ]

    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });

    await client.start({
        phoneNumber: async () => await input.text("Please enter your number: "),
        password: async () => await input.text("Please enter your password: "),
        phoneCode: async () => await input.text("Please enter the code you received: "),
        onError: (err) => console.log(err),
    });

    // Все подписки бота
    // const result = await Promise.all(chatIdsToTrack.map(id => client.invoke(
    //     new Api.channels.GetFullChannel({ channel: id })
    // )));
    //
    // console.log(result)
    console.log('USER_AUTH_STATUS: ', await client.isUserAuthorized())

    const solanaTokenDataService = new SolanaTokenDataService();

    new SignalScrapperBot({
        channelsToWatch: [
            'gem_tools_calls',
            'pfultimate',
        ],
        telegramClient: client,
        solanaTokenDataService,
        signalChat: {
            type: 'channel',
            chatId: '-1002630922980' // Project X
        }
    })

    new SignalScrapperBot({
        // channelsToWatch: [
        //     'ai_agent_solana_0xbot',
        //     'pfultimate'
        // ],
        channelsToWatch: TEST_CHANNELS,
        telegramClient: client,
        solanaTokenDataService,
        signalChat: {
            type: 'channel',
            chatId: '-1002550127860' // Канал для тестирования бота
        }
    })
}

main()