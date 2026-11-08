/**
 * dotenv-silent.ts
 * 
 * 这是一个 dotenv 的包装器，禁止所有输出到标准输出
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * 从文件加载环境变量
 *
 * 与 dotenv 一致：默认不覆盖已存在的环境变量（例如 MCP 客户端通过 env 传入的密钥），
 * 传入 override: true 时才用文件中的值覆盖。
 */
export function config(options: { path?: string; debug?: boolean; override?: boolean } = {}): { parsed: Record<string, string> | null } {
  try {
    // 获取文件路径
    const filePath = options.path || path.resolve(process.cwd(), '.env');

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return { parsed: null };
    }

    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf8');
    const result: Record<string, string> = {};

    // 解析文件内容
    content.split('\n').forEach(line => {
      // 忽略注释和空行
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return;
      }

      // 解析键值对
      const keyValue = trimmedLine.split('=');
      if (keyValue.length >= 2) {
        // 兼容 shell 风格的 "export KEY=value"
        const key = keyValue[0].trim().replace(/^export\s+/, '');
        let value = keyValue.slice(1).join('=').trim();
        
        // 移除引号
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }

        // 设置环境变量（已存在的变量默认保留）
        if (options.override || !Object.prototype.hasOwnProperty.call(process.env, key)) {
          process.env[key] = value;
        }
        result[key] = value;
      }
    });

    return { parsed: result };
  } catch (error) {
    return { parsed: null };
  }
} 