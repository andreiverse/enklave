import { randomUUIDv7 } from "bun";
import { authorizationCodeGrant, buildAuthorizationUrl, calculatePKCECodeChallenge, ClientSecretBasic, ClientSecretPost, Configuration, discovery, randomPKCECodeVerifier, TokenEndpointResponse, TokenEndpointResponseHelpers } from "openid-client";

export async function createOidcService() {
    const clientId = process.env.OIDC_CLIENT_ID!;
    const clientSecret = process.env.OIDC_CLIENT_SECRET!;

    const configuration = await discovery(
        new URL(process.env.OIDC_ISSUER!),
        clientId,
        undefined,
        ClientSecretBasic(clientSecret),
    );

    return new OidcService(configuration);
}

export class OidcService {
    code_verifier: string

    constructor(
        private readonly configuration: Configuration
    ) {
        this.code_verifier = randomPKCECodeVerifier(); // generate per request and store in session
        console.log({
            issuer: this.configuration.serverMetadata().issuer,
            tokenEndpoint: this.configuration.serverMetadata().token_endpoint,
        });
    }

    async authorizeUser(): Promise<{
        redirectUrl: URL,
        state: string
    }> {
        let code_challenge: string =
            await calculatePKCECodeChallenge(this.code_verifier);
        let state = randomUUIDv7();

        let parameters: Record<string, string> = {
            redirect_uri: "http://localhost:3001/api/auth/callback",
            scope: "openid profile email",
            code_challenge,
            state,
            code_challenge_method: 'S256',
        }

        return {
            redirectUrl: buildAuthorizationUrl(this.configuration, parameters),
            state
        };
    }

    async handleCallback(url: string, expectedState: string): Promise<TokenEndpointResponse & TokenEndpointResponseHelpers> {
        return await authorizationCodeGrant(
            this.configuration,
            new URL(url),
            {
                pkceCodeVerifier: this.code_verifier,
                expectedState
            },
            {
                redirect_uri: "http://localhost:3001/api/auth/callback",
            },
        )
    }
}