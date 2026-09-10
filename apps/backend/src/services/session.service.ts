import { randomUUIDv7, RedisClient } from "bun";

export type Session = {
    userId: string | null;
    oidcState: string | null;
    createdAt: number;
    lastSeenAt: number;
};

export class SessionService {
    private readonly client = new RedisClient(process.env.REDIS_URL!);
    private readonly prefix = "enklave:session:";
    private readonly ttl = 60 * 60 * 24 * 30;

    constructor() {
    }
    
    private key(id: string) {
        return `${this.prefix}${id}`;
    }

    async create(): Promise<string> {
        const id = randomUUIDv7();

        const session: Session = {
            userId: null, oidcState: null,
            createdAt: Date.now(),
            lastSeenAt: Date.now(),
        };

        await this.client.set(
            this.key(id),
            JSON.stringify(session),
            "EX",
            this.ttl,
        );

        return id;
    }

    async get(id: string): Promise<Session | null> {
        const value = await this.client.get(this.key(id));

        if (!value)
            return null;

        return JSON.parse(value) as Session;
    }

    async update(
        id: string,
        update: Partial<Session>,
    ): Promise<boolean> {
        const session = await this.get(id);

        if (!session)
            return false;

        const updated: Session = {
            ...session,
            ...update,
        };

        await this.client.set(
            this.key(id),
            JSON.stringify(updated),
            "EX",
            this.ttl,
        );

        return true;
    }

    async delete(id: string): Promise<void> {
        await this.client.del(this.key(id));
    }

    async exists(id: string): Promise<boolean> {
        return await this.client.exists(this.key(id));
    }
}