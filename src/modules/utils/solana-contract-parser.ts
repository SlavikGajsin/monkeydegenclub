export class SolanaUtils {
    public static parseContractAddressFromString(message: string) {
        const solanaAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/gm;

        // Ищем все совпадения в тексте
        const matches = message.match(solanaAddressRegex);

        // Если нет совпадений - возвращаем null
        if (!matches) return null;

        // Проверяем каждый найденный адрес на валидность длины
        for (const match of matches) {
            // Стандартные Solana token addresses имеют длину 44 символа
            if (match.length === 44) {
                return match;
            }
        }

        // Если не нашли адрес длиной 44 символа, возвращаем первое совпадение
        // (может быть не token address, а обычный wallet address)
        return matches[0];
    }
}