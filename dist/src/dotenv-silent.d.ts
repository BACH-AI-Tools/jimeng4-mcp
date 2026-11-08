/**
 * dotenv-silent.ts
 *
 * 这是一个 dotenv 的包装器，禁止所有输出到标准输出
 */
/**
 * 从文件加载环境变量
 *
 * 与 dotenv 一致：默认不覆盖已存在的环境变量（例如 MCP 客户端通过 env 传入的密钥），
 * 传入 override: true 时才用文件中的值覆盖。
 */
export declare function config(options?: {
    path?: string;
    debug?: boolean;
    override?: boolean;
}): {
    parsed: Record<string, string> | null;
};
