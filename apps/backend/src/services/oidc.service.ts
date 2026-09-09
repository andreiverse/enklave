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

    async authorizeUser(): Promise<URL> {
        let code_challenge: string =
            await calculatePKCECodeChallenge(this.code_verifier);

        let parameters: Record<string, string> = {
            redirect_uri: "http://localhost:3001/api/auth/callback",
            scope: "openid profile email",
            code_challenge,
            state: "test",
            code_challenge_method: 'S256',
        }

        return buildAuthorizationUrl(this.configuration, parameters);
    }

    async handleCallback(url: string): Promise<TokenEndpointResponse & TokenEndpointResponseHelpers> {
        return await authorizationCodeGrant(
            this.configuration,
            new URL(url),
            {
                pkceCodeVerifier: this.code_verifier,
                expectedState: "test"
            },
            {
                redirect_uri: "http://localhost:3001/api/auth/callback",
            },
        )
    }
}