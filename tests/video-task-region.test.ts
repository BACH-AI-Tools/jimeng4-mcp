import axios from 'axios';
import { JimengClient } from '../src/index';

jest.mock('axios', () => {
    const fn: any = jest.fn();
    fn.post = jest.fn();
    return { __esModule: true, default: fn };
});

const mockedAxios = axios as unknown as jest.Mock;

function credentialScopeRegion(): string {
    const headers = mockedAxios.mock.calls[0][0].headers;
    const match = /Credential=[^/]+\/\d{8}\/([^/]+)\/cv\/request/.exec(headers.Authorization);
    return match ? match[1] : '';
}

describe('getVideoTaskResult signing region', () => {
    let stderrSpy: jest.SpyInstance;

    beforeEach(() => {
        mockedAxios.mockReset();
        mockedAxios.mockResolvedValue({
            status: 200,
            data: { code: 10000, data: { status: 'done', video_url: 'https://example.com/v.mp4' } }
        });
        stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    });

    afterEach(() => stderrSpy.mockRestore());

    it('signs with the configured default region, not a fragment of req_key', async () => {
        const client = new JimengClient({ accessKey: 'ak', secretKey: 'sk' });

        const result = await client.getVideoTaskResult('task-1', 'jimeng_vgfm_t2v_l20');

        expect(result.success).toBe(true);
        expect(credentialScopeRegion()).toBe('cn-north-1');
    });

    it('signs with the region configured on the client', async () => {
        const client = new JimengClient({ accessKey: 'ak', secretKey: 'sk', region: 'cn-beijing' });

        await client.getVideoTaskResult('task-1', 'jimeng_vgfm_i2v_l20');

        expect(credentialScopeRegion()).toBe('cn-beijing');
    });

    it('signs with an explicitly passed region', async () => {
        const client = new JimengClient({ accessKey: 'ak', secretKey: 'sk' });

        await client.getVideoTaskResult('task-1', 'jimeng_vgfm_t2v_l20', 'cn-shanghai');

        expect(credentialScopeRegion()).toBe('cn-shanghai');
    });
});
