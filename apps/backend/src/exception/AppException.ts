import { HTTPException } from "hono/http-exception";
import { ContentfulStatusCode } from "hono/utils/http-status";

export class AppException extends HTTPException {

    constructor(status: ContentfulStatusCode, message: string);
    constructor(status: ContentfulStatusCode, message: string, cause: Error);
    constructor(
        status: ContentfulStatusCode,
        message: string,
        public readonly cause?: Error
    ) {
        super(status, {
            message,
            cause
        });
    }
}