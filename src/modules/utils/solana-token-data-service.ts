import fetch from 'node-fetch'

export class SolanaTokenDataService {
    constructor() {}

    public async getTokenData(mintAddress: string) {
        try {
            return await this.fetchTokenData(mintAddress)
        } catch (error) {
            console.error(error);
            return null
        }
    }

    private async fetchTokenData(mintAddress: string) {
        const apiUrl = `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${mintAddress}`;
        const response = await fetch(apiUrl);
        const data = await response.json() as any;

        if (!data.data) {
            throw new Error(`No token data found for ${mintAddress}`);
        }

        return {
            mintAddress: String(data.data.attributes.address),
            ticker: String(data.data.attributes.symbol),
            marketCap: String(data.data.attributes.fdv_usd),
        }
    }
}