import { performance } from "perf_hooks";

interface TokenSignalOptions {
    tokenAddress: string;
    chatId: string;
    createdAt: number /** perfomance.now() */
}


class TokenSignal {
    constructor(
        public readonly options: TokenSignalOptions,
    ) {}
}

type TokenAddress = string

interface SignalsComposerOptions {
    chatIdsToTrack: string[];
    signalLifetime: number // ms
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

    private isTokenSignalLate(tokenSignals: TokenSignal[]) {
        const [first, last] = tokenSignals

        return Math.abs(first.options.createdAt - last.options.createdAt) > this.options.signalLifetime;
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
            this.signals.set(tokenAddress, [new TokenSignal({ tokenAddress, chatId, createdAt: performance.now() })])
        } else {
            this.signals.get(tokenAddress)!.push(new TokenSignal({ tokenAddress, chatId, createdAt: performance.now() }))
        }

        const signals = this.signals.get(tokenAddress);

        if (!signals) {
            return
        }

        const isTokenSignalLate = signals.length === 2 && this.isTokenSignalLate(signals)

        if (isTokenSignalLate) {
            this.untrackToken(tokenAddress)
            return
        }

        const isTokenReadyToBeNotified = this.validateTokenSignals(signals)

        if (isTokenReadyToBeNotified) {
            console.log(signals.map(signal => signal.options))
            this.subscriptionHandler(tokenAddress)
            this.untrackToken(tokenAddress)
        }
    }
}