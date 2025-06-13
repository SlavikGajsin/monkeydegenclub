import {TelegramClient, Api} from "telegram";
import input from 'input'
import {TelegramScrapper} from "./modules/tg-scrapper/tg-scrapper.js";
import {StoreSession} from "telegram/sessions/index.js";
import {SignalsComposer} from "./modules/signals-composer/signals-composer.js";
import {SolanaUtils} from "./modules/utils/solana-contract-parser.js";
import {SolanaTokenDataService} from "./modules/utils/solana-token-data-service.js";


async function main() {
    const stringSession = new StoreSession('session_')
    await stringSession.load()
    const apiId = 20275345
    const apiHash = 'b049f562d3f21d020e679548d6ef03ac'

    // const chatIdsToTrack = [
    //     '-1002380293749', // Pump fun alerts
    //     '-1001998961899', // Gem tools
    // ]
    // PROD
    const chatIdsToTrack = [
        'gem_tools_calls',
        'pfultimate',
        // 'ai_agent_solana_0xbot'
    ]

    // DEV
    // const chatIdsToTrack = [
    //     '-1002503039300', // Test 1
    //     '-1002570818680' // Test 2
    // ]
    // const chatIdsToTrack = [
    //     'vyacheslav_sol_tests_1',
    //     'vyacheslav_sol_tests_2'
    // ]

    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });

    await client.start({
        phoneNumber: async () => await input.text("Please enter your number: "),
        password: async () => await input.text("Please enter your password: "),
        phoneCode: async () => await input.text("Please enter the code you received: "),
        onError: (err) => console.log(err),
    });

    const result = await Promise.all(chatIdsToTrack.map(id => client.invoke(
        new Api.channels.GetFullChannel({ channel: id })
    )));

    console.log(result)

    // const mappedIds = result.chats.map(chat => chat.id)

    // console.log(result.chats.map(chat => chat.id))
    // return

    console.log('USER_AUTH_STATUS: ', await client.isUserAuthorized())

    const telegramScrapper = new TelegramScrapper(client);

    telegramScrapper.debug((_, event) => {
        console.log(_, event)
        client.sendMessage('RTD_makes', { message: String(_ || 'suka') })
    })

    const solanaTokenDataService = new SolanaTokenDataService();

    const signalHandler = async (tokenAddress: string) => {
        // entity: id of closed group chat
        // replyTo: the topic id
        // @ts-ignore

        let message = '';

        if (tokenAddress) {
            message += `\`${tokenAddress}\``;

            const tokenData = await solanaTokenDataService.getTokenData(tokenAddress);

            if (tokenData) {
                // message += `/n ${JSON.stringify(tokenData)}`;

                if (tokenData.ticker) {
                    message += `\n(${tokenData.ticker})`
                }

                if (tokenData.marketCap) {
                    message += `\n$ ${Math.floor(Number(tokenData.marketCap) / 1000)}k MC`
                }
            }
        }

        if (!tokenAddress) {
            message = 'LOL HACKER HAS A REST AND U SHOULD TOO'
        }

        await Promise.allSettled([
            // client.sendMessage(-1002510658856, { message, replyTo: 2 }), // приватка где тестится бот
            client.sendMessage('RTD_makes', { message }),
            client.sendMessage('-1002630922980', { message })
        ])


    }

    const signalsComposer = new SignalsComposer({ chatIdsToTrack }, signalHandler);

    chatIdsToTrack.forEach(chatId => {
        telegramScrapper.subscribeChannelMessages(chatId, (message) => {
            const stringMessage = String(message)

            const contractAddress = SolanaUtils.parseContractAddressFromString(stringMessage)

            if (contractAddress) {
                signalsComposer.addSignal(contractAddress, chatId)
            }
        })
    })
}

main()