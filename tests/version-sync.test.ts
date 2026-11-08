import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const root = path.join(__dirname, '..');
const read = (dir: string, file: string) => fs.readFileSync(path.join(dir, file), 'utf8');

function versions(dir: string) {
    const serverSource = read(dir, 'examples/mcp-server.ts');
    return {
        packageJson: JSON.parse(read(dir, 'package.json')).version,
        mcpJson: JSON.parse(read(dir, 'mcp.json')).version,
        server: /const SERVER_VERSION = "([^"]+)"/.exec(serverSource)?.[1]
    };
}

describe('version sync', () => {
    it('package.json, mcp.json and the MCP server report the same version', () => {
        const v = versions(root);
        expect(v.mcpJson).toBe(v.packageJson);
        expect(v.server).toBe(v.packageJson);
    });

    it('the MCP server has no other hard-coded version strings', () => {
        const source = read(root, 'examples/mcp-server.ts');
        const literals = source.match(/\bv?\d+\.\d+\.\d+\b/g) || [];
        expect(literals).toEqual([versions(root).packageJson]);
    });

    it('scripts/sync-version.js copies the package.json version into the other files', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jimeng-version-'));
        fs.mkdirSync(path.join(tmp, 'examples'));
        for (const file of ['mcp.json', 'examples/mcp-server.ts']) {
            fs.copyFileSync(path.join(root, file), path.join(tmp, file));
        }
        const pkg = JSON.parse(read(root, 'package.json'));
        fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ ...pkg, version: '9.8.7-beta.1' }, null, 2));

        execFileSync(process.execPath, [path.join(root, 'scripts/sync-version.js')], { cwd: tmp, stdio: 'pipe' });

        expect(versions(tmp)).toEqual({ packageJson: '9.8.7-beta.1', mcpJson: '9.8.7-beta.1', server: '9.8.7-beta.1' });
        fs.rmSync(tmp, { recursive: true, force: true });
    });

    it('publish.sh uses portable commands and the real package name', () => {
        const script = read(root, 'publish.sh');
        expect(script).not.toMatch(/sed -i ''/);
        expect(script).not.toMatch(/jimeng-ai-mcp/);
        execFileSync('bash', ['-n', path.join(root, 'publish.sh')]);
    });
});
