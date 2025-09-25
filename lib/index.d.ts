import { Context, Schema } from 'koishi';
declare module 'koishi' {
    interface Events {
        'screenshot/validate'(url: string): string;
    }
}
export declare const name = "booth-get";
export declare const inject: string[];
export interface Config {
    loadTimeout?: number;
    idleTimeout?: number;
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
