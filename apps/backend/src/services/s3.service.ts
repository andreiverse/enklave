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


}