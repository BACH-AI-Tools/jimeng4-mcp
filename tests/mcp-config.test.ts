import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const pkg = JSON.parse(read('package.json'));

/** Package names launched via `npx -y <name>` in an MCP client config. */
function npxPackages(config: any): string[] {
    return Object.values<any>(config.mcpServers)
        .filter(server => server.command === 'npx')
        .map(server => server.args.find((arg: string) => !arg.startsWith('-')));
}

describe('example MCP client configs', () => {
    it('mcp-config.json launches this package', () => {
        expect(npxPackages(JSON.parse(read('mcp-config.json')))).toEqual([pkg.name]);
    });

    it('README MCP config example launches this package', () => {
        const block = /## MCP 配置示例\s+```json\n([\s\S]*?)```/.exec(read('README.md'));
        expect(block).not.toBeNull();
        expect(npxPackages(JSON.parse(block![1]))).toEqual([pkg.name]);
    });
});
