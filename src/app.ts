import {TelegramClient, Api} from "telegram";
import input from 'input'
import {TelegramScrapper} from "./modules/tg-scrapper/tg-scrapper.js";
import {StoreSession} from "telegram/sessions";
import {SignalsComposer} from "./modules/signals-composer/signals-composer.js";
import {SolanaUtils} from "./modules/utils/solana-contract-parser";


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

    const signalHandler = (tokenAddress: string) => {
        // entity: id of closed group chat
        // replyTo: the topic id
        // @ts-ignore
        client.sendMessage(-1002510658856, { message: String(tokenAddress || 'blya'), replyTo: 2 }) // приватка где тестится бот
        client.sendMessage('RTD_makes', { message: String(tokenAddress || 'blyat') })
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