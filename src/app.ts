import {TelegramClient} from "telegram";
import input from 'input'
import {StoreSession} from "telegram/sessions/index.js";
import {SolanaTokenDataService} from "./modules/utils/solana-token-data-service.js";
import {ChannelConfig, SignalScrapperBot} from "./modules/signal-scrapper-bot.js";
import {DebuggerService} from "./modules/debugger/index.js";


async function main() {
    const stringSession = new StoreSession('session_')
    await stringSession.load()
    const apiId = 20275345
    const apiHash = 'b049f562d3f21d020e679548d6ef03ac'

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

    const debuggerService = new DebuggerService(client, { chatId: '-1002746744236' });

    const CHANNELS = Object.freeze({
        GEM_TOOLS: 'gem_tools_calls',
        PUMPFUN_ULTIMATE: 'pfultimate',
        BONK_ULTIMATE: 'llutilmate',
        NMF_SOL_CALLS_FREE: 'nmf_sol_calls_free'
    } as const satisfies Record<string, string>)

    const TEST_CHANNELS = Object.freeze({
        TEST1: 'vyacheslav_sol_tests_1',
        TEST2: 'vyacheslav_sol_tests_2',
    } as const satisfies Record<string, string>)

    const CHANNELS_TO_POST_SIGNALS_TO = Object.freeze({
        PROJECT_X_PUMP_FUN: {
            type: 'channel',
            chatId: '-1002630922980'
        },
        PROJECT_X_BONK: {
            type: 'channel',
            chatId: '-1002730636796'
        }
    } as const satisfies Record<string, ChannelConfig>)

    const TEST_CHANNELS_TO_POST_SIGNALS_TO = Object.freeze({
        ITRUEMATONE_LFG: {
            type: 'channel',
            chatId: '-1002862194822'
        }
    }) satisfies Record<string, ChannelConfig>

    new SignalScrapperBot({
        channelsToWatch: [
            CHANNELS.GEM_TOOLS,
            CHANNELS.PUMPFUN_ULTIMATE
        ],
        telegramClient: client,
        solanaTokenDataService,
        signalChat: TEST_CHANNELS_TO_POST_SIGNALS_TO.ITRUEMATONE_LFG,
        debuggerService
    })

    new SignalScrapperBot({
        channelsToWatch: [
            CHANNELS.NMF_SOL_CALLS_FREE,
            CHANNELS.PUMPFUN_ULTIMATE,
        ],
        telegramClient: client,
        solanaTokenDataService,
        signalChat: CHANNELS_TO_POST_SIGNALS_TO.PROJECT_X_PUMP_FUN,
        debuggerService
    })

    new SignalScrapperBot({
        channelsToWatch: [
            CHANNELS.GEM_TOOLS,
            CHANNELS.BONK_ULTIMATE,
        ],
        telegramClient: client,
        solanaTokenDataService,
        signalChat: CHANNELS_TO_POST_SIGNALS_TO.PROJECT_X_BONK,
        debuggerService
    })
}

main()