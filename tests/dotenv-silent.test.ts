import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import * as dotenvSilent from '../src/dotenv-silent';

const root = path.join(__dirname, '..');
const KEYS = ['JIMENG_ACCESS_KEY', 'JIMENG_SECRET_KEY', 'UNRELATED_VAR'];

function tmpDir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'jimeng-env-'));
}

describe('dotenv-silent config()', () => {
    const saved: Record<string, string | undefined> = {};
    let dir: string;

    beforeEach(() => {
        KEYS.forEach(k => { saved[k] = process.env[k]; delete process.env[k]; });
        dir = tmpDir();
    });

    afterEach(() => {
        KEYS.forEach(k => { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; });
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it('does not override variables that are already set (e.g. passed by the MCP client)', () => {
        process.env.JIMENG_ACCESS_KEY = 'from-mcp-client';
        fs.writeFileSync(path.join(dir, '.env'), 'JIMENG_ACCESS_KEY=stale-from-dotenv\nJIMENG_SECRET_KEY=sk-from-dotenv\n');

        dotenvSilent.config({ path: path.join(dir, '.env') });

        expect(process.env.JIMENG_ACCESS_KEY).toBe('from-mcp-client');
        expect(process.env.JIMENG_SECRET_KEY).toBe('sk-from-dotenv');
    });

    it('overrides existing variables only when asked to', () => {
        process.env.JIMENG_ACCESS_KEY = 'from-mcp-client';
        fs.writeFileSync(path.join(dir, '.env'), 'JIMENG_ACCESS_KEY=from-dotenv\n');

        dotenvSilent.config({ path: path.join(dir, '.env'), override: true });

        expect(process.env.JIMENG_ACCESS_KEY).toBe('from-dotenv');
    });

    it('accepts the shell-style "export KEY=value" form', () => {
        fs.writeFileSync(path.join(dir, '.env'), 'export JIMENG_ACCESS_KEY="ak"\r\nexport  JIMENG_SECRET_KEY=sk==\n');

        const { parsed } = dotenvSilent.config({ path: path.join(dir, '.env') });

        expect(parsed).toEqual({ JIMENG_ACCESS_KEY: 'ak', JIMENG_SECRET_KEY: 'sk==' });
        expect(process.env.JIMENG_ACCESS_KEY).toBe('ak');
        expect(process.env['export JIMENG_ACCESS_KEY']).toBeUndefined();
    });
});

describe('MCP server .env fallback', () => {
    it('loads ~/.jimeng-ai-mcp/.env when the working-directory .env lacks the keys', () => {
        const cwd = tmpDir();
        const home = tmpDir();
        fs.writeFileSync(path.join(cwd, '.env'), 'UNRELATED_VAR=1\n');
        fs.mkdirSync(path.join(home, '.jimeng-ai-mcp'));
        fs.writeFileSync(path.join(home, '.jimeng-ai-mcp', '.env'), 'JIMENG_ACCESS_KEY=ak\nJIMENG_SECRET_KEY=sk\n');

        const env: NodeJS.ProcessEnv = { ...process.env, HOME: home, USERPROFILE: home };
        KEYS.forEach(k => delete env[k]);
        const tsNode = path.join(root, 'node_modules', 'ts-node', 'dist', 'bin.js');
        // stdin 立即关闭，服务器打印启动日志后退出；日志全部在 stderr
        const run = spawnSync(process.execPath, [tsNode, '--transpile-only', path.join(root, 'examples', 'mcp-server.ts')], {
            cwd, env, input: '', timeout: 60000, encoding: 'utf8'
        });

        expect(run.stderr).toContain('授权状态: 已配置');
        fs.rmSync(cwd, { recursive: true, force: true });
        fs.rmSync(home, { recursive: true, force: true });
    }, 60000);
});
