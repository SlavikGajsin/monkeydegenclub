import {TelegramClient} from "telegram";

type DebuggerServiceOptions = {
    chatId: string; // where to send debug messages
}

export class DebuggerService {
    constructor(
        private readonly telegramClient: TelegramClient,
        private readonly options: DebuggerServiceOptions
    ) {}

    private async logDebug (message: string) {
        try {
            await this.telegramClient.sendMessage(this.options.chatId, { message, parseMode: 'html' })
        } catch (error) {
            console.error(error)
        }
    }

    createJsonString(data: object | any[]) {
        return `<pre language="json">${JSON.stringify(data, null, 2)}</pre>`
    }

    async log(message: string) {
        await this.logDebug(`DEBUG:\n\n${message}`);
    }

    async error(errorMessage: string) {
        await this.logDebug(`ERROR_DEBUG:\n\n${errorMessage}`);
    }
}