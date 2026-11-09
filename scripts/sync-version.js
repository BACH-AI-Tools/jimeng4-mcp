#!/usr/bin/env node
/**
 * 将 package.json 的版本号同步到 mcp.json 和 examples/mcp-server.ts。
 * 用 Node 读写文件，避免 `sed -i` 在 macOS / Linux 上参数不兼容的问题。
 * 任意文件没有找到版本字段时以非 0 退出，让 publish.sh 在发布前中止。
 */
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const version = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8')).version;

const targets = [
    { file: 'mcp.json', pattern: /^(\s*"version":\s*")[^"]*(")/m },
    { file: 'examples/mcp-server.ts', pattern: /^(const SERVER_VERSION = ")[^"]*(")/m }
];

for (const { file, pattern } of targets) {
    const filePath = path.join(cwd, file);
    const content = fs.readFileSync(filePath, 'utf8');
    if (!pattern.test(content)) {
        console.error(`[ERROR] 未在 ${file} 中找到版本字段，无法同步版本号`);
        process.exit(1);
    }
    fs.writeFileSync(filePath, content.replace(pattern, `$1${version}$2`));
    console.log(`${file} -> ${version}`);
}
