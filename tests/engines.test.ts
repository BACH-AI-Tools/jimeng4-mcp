import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..');
const readJson = (file: string) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

/** Lowest Node.js major accepted by a simple ">=X[.Y.Z]" range. */
function minMajor(range: string): number {
    const match = />=\s*v?(\d+)/.exec(range);
    return match ? Number(match[1]) : 0;
}

describe('engines.node', () => {
    const pkg = readJson('package.json');
    const lock = readJson('package-lock.json');

    it('is not lower than what any runtime dependency requires', () => {
        const declared = minMajor(pkg.engines.node);
        const offenders = Object.entries<any>(lock.packages)
            .filter(([name, info]) => name !== '' && !info.dev && info.engines?.node)
            .filter(([, info]) => minMajor(info.engines.node) > declared)
            .map(([name, info]) => `${name} requires node ${info.engines.node}`);

        expect(offenders).toEqual([]);
    });

    it('matches the root entry of package-lock.json', () => {
        expect(lock.packages[''].engines).toEqual(pkg.engines);
    });
});
