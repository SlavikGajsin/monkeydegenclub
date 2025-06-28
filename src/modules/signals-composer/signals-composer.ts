import { performance } from "perf_hooks";
import {DebuggerService} from "../debugger/index.js";

interface TokenSignalOptions {
    tokenAddress: string;
    chatId: string;
    createdAt: number /** perfomance.now() */
}


class TokenSignal {
    readonly options: TokenSignalOptions;
    readonly createdAtTime: string = ''

    constructor(
        options: TokenSignalOptions,
    ) {
        this.options = options
        this.createdAtTime = new Date(options.createdAt).toTimeString()
    }
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
        private readonly subscriptionHandler: SubscriptionHandler,
        private readonly debuggerService: DebuggerService,
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

        const timeBetweenSignals = Math.abs(first.options.createdAt - last.options.createdAt)

        this.debuggerService.log(
            `TIME BETWEEN SIGNALS for <code>${first.options.tokenAddress}</code>:\n${timeBetweenSignals / 1000 / 60} minutes`
        )

        return Math.abs(first.options.createdAt - last.options.createdAt) > this.options.signalLifetime;
    }

    private untrackToken(tokenAddress: TokenAddress) {
        this.signals.delete(tokenAddress);
        this.firedSignalTokenAddresses.add(tokenAddress);
    }

    public addSignal(tokenAddress: TokenAddress, chatId: string) {
        this.debuggerService.log(
            `TOKEN SIGNAL FROM @${chatId}: <code>${tokenAddress}<code>`
        )

        if (!this.options.chatIdsToTrack.includes(chatId)) {
            return
        }

        if (this.firedSignalTokenAddresses.has(tokenAddress)) {
            this.debuggerService.log(
                `TOKEN ADDRESS <code>${tokenAddress}</code> has already been notified.`
            )
            return
        }

        const existingSignals = this.signals.get(tokenAddress);

        if (!existingSignals) {
            this.signals.set(tokenAddress, [new TokenSignal({ tokenAddress, chatId, createdAt: performance.now() })])
        } else {
            this.signals.get(tokenAddress)!.push(new TokenSignal({ tokenAddress, chatId, createdAt: performance.now() }))
        }

        const signals = this.signals.get(tokenAddress);

        this.debuggerService.log(
            `CURRENT SIGNALS STATE FOR <code>${tokenAddress}</code>:\n${this.debuggerService.createJsonString(signals ?? [])}`
        )

        if (!signals) {
            return
        }

        const isTokenSignalLate = signals.length === 2 && this.isTokenSignalLate(signals)

        if (isTokenSignalLate) {
            this.debuggerService.log(
                `NEW TOKEN SIGNAL IS TOO LATE:\n${this.debuggerService.createJsonString(signals)}`
            )
            this.untrackToken(tokenAddress)
            return
        }

        const isTokenReadyToBeNotified = this.validateTokenSignals(signals)

        if (isTokenReadyToBeNotified) {
            this.debuggerService.log(
                `CREATING TOKEN SIGNAL NOTIFICATION FOR <code>${tokenAddress}</code>. SIGNALS: \n ${this.debuggerService.createJsonString(signals)}`
            )
            this.subscriptionHandler(tokenAddress)
            this.untrackToken(tokenAddress)
        }
    }
}