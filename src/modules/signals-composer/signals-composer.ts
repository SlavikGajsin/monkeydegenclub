interface TokenSignalOptions {
    tokenAddress: string;
    chatId: string;
}

class TokenSignal {
    constructor(public readonly options: TokenSignalOptions) {}
}

type TokenAddress = string

interface SignalsComposerOptions {
    chatIdsToTrack: string[];
}

type SubscriptionHandler = (tokenAddress: string) => void;

export class SignalsComposer {
    constructor(
        private readonly options: SignalsComposerOptions,
        private readonly subscriptionHandler: SubscriptionHandler
    ) {}

    private signals = new Map<TokenAddress, TokenSignal[]>()

    private firedSignalTokenAddresses = new Set<string>();

    private validateTokenSignals(tokenSignals: TokenSignal[]) {
        return this.options.chatIdsToTrack.every((chatId) => {
            return tokenSignals.find((tokenSignal) => tokenSignal.options.chatId === chatId);
        })
    }

    private untrackToken(tokenAddress: TokenAddress) {
        this.signals.delete(tokenAddress);
        this.firedSignalTokenAddresses.add(tokenAddress);
    }

    public addSignal(tokenAddress: TokenAddress, chatId: string) {
        if (!this.options.chatIdsToTrack.includes(chatId)) {
            return
        }

        if (this.firedSignalTokenAddresses.has(tokenAddress)) {
            console.log(tokenAddress, 'has already been notified')
            return
        }

        const existingSignals = this.signals.get(tokenAddress);

        if (!existingSignals) {
            this.signals.set(tokenAddress, [new TokenSignal({ tokenAddress, chatId })])
        } else {
            this.signals.get(tokenAddress)!.push(new TokenSignal({ tokenAddress, chatId }))
        }

        const isTokenReadyToBeNotified = this.validateTokenSignals(this.signals.get(tokenAddress)!)

        if (isTokenReadyToBeNotified) {
            this.subscriptionHandler(tokenAddress)
            this.untrackToken(tokenAddress)
        }
    }
}