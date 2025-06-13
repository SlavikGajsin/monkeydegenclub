import { TelegramClient } from "telegram";
import {NewMessage} from "telegram/events/index.js";


type SubscriptionHandler = (message: string) => any
type DebuggerHandler = (message: string, event: any) => any;

export class TelegramScrapper {
    private channelSubscriptions = new Map<string, SubscriptionHandler>()

    constructor(private readonly client: TelegramClient) {}


    private extractMessage(message: any): string | null {
        return typeof message === 'string'
            ? message
            : (message && typeof message === 'object')
                ? message.message
                : null
    }

    // private extractChannelId(event: any): string | null {
    //     console.log('EVENT_TO_DEBUG', event)
    //     if (event.channelId) {
    //         return event.channelId
    //     }
    //
    //
    //
    //     try {
    //         console.log('CHANNEL_ID_DEBUG', event.message.peerId.channelId.value)
    //     }  catch (e) {}
    //
    //
    //     if (
    //         event.message
    //         && typeof event.message === 'object'
    //         && typeof event.message.peerId === 'object'
    //         && event.message.peerId
    //         && event.message.peerId.channelId?.value
    //     ) {
    //         return event.message.peerId.channelId.value
    //     }
    //
    //     return null
    // }

    private addSubscriptionHandler(username: string) {
        this.client.addEventHandler(async (event) => {
            const message = this.extractMessage(event.message)

            if (message) {
                const exactHandler = this.channelSubscriptions.get(username);

                if (exactHandler) {
                    exactHandler(message);
                }
            }
        }, new NewMessage({ fromUsers: [username] }));
    }

    public debug(handler: DebuggerHandler) {
        this.client.addEventHandler(async (event) => {
            if (event.message) {
                handler(this.extractMessage(event.message) ?? '', event );
            }
        }, new NewMessage({ incoming: true }));
    }

    public subscribeChannelMessages(username: string, onMessage: SubscriptionHandler) {
        this.channelSubscriptions.set(username, onMessage);

        this.addSubscriptionHandler(username);

    }

    public unsubscribeChannelMessages(username: string) {
        this.channelSubscriptions.delete(username);
    }
}