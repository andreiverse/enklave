import { S3Client } from "bun";

export class S3Service {
    s3client: S3Client
    
    constructor() {
        this.s3client = new S3Client({
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY,
            bucket: process.env.S3_BUCKET,
            endpoint: process.env.S3_ENDPOINT
        })

        this.s3client.file("test.json").write("hello world").then(console.log);
    }

    async readFile(path: string): Promise<ArrayBuffer> {
        return await this.s3client.file(path).arrayBuffer()
    }

    async writeFile(path: string, buffer: ArrayBuffer) {
        await this.s3client.file(path).write(buffer);
    }

    async deleteFile(path: string) {
        await this.s3client.delete(path);
    }

}