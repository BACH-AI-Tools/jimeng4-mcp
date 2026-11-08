import axios from 'axios';
import { JimengClient } from '../src/index';

jest.mock('axios', () => {
    const fn: any = jest.fn();
    fn.post = jest.fn();
    return { __esModule: true, default: fn };
});

const mockedPost = (axios as any).post as jest.Mock;
const mockedRequest = axios as unknown as jest.Mock;
const MODERATION = { code: 50411, message: 'Pre Img Risk Not Pass', data: null };

describe('moderation rejection while polling', () => {
    let now: number;
    let client: JimengClient;
    let stderrSpy: jest.SpyInstance;

    beforeEach(() => {
        mockedPost.mockReset();
        mockedRequest.mockReset();
        now = 0;
        jest.spyOn(Date, 'now').mockImplementation(() => now);
        stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
        client = new JimengClient({ accessKey: 'ak', secretKey: 'sk' });
        // 用虚拟时钟代替真实等待，避免测试真的等 6 分钟
        jest.spyOn(client as any, 'sleep').mockImplementation(async (ms: any) => { now += ms; });
        jest.spyOn(global, 'setTimeout').mockImplementation(((fn: () => void, ms: number) => {
            now += ms;
            fn();
            return 0 as any;
        }) as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        stderrSpy.mockRestore();
    });

    function submitThenReject() {
        mockedPost
            .mockResolvedValueOnce({ status: 200, data: { code: 10000, data: { task_id: 'task-1' } } })
            .mockResolvedValue({ status: 200, data: MODERATION });
    }

    it('generateJimengV40Image returns the moderation reason after the first query', async () => {
        submitThenReject();

        const result = await client.generateJimengV40Image({ prompt: 'test' });

        expect(result.success).toBe(false);
        expect(result.error).toContain('Pre Img Risk Not Pass');
        expect(result.task_id).toBe('task-1');
        expect(mockedPost).toHaveBeenCalledTimes(2); // 1 次提交 + 1 次查询，不再空转到超时
    });

    it.each([
        ['generateJimengI2IV30Image', { prompt: 'test', image_urls: ['https://example.com/a.png'] }],
        ['generateJimengT2IV31Image', { prompt: 'test' }],
        ['generateJimengT2IV30Image', { prompt: 'test' }]
    ])('%s returns the moderation reason after the first query', async (method, params) => {
        submitThenReject();

        const result = await (client as any)[method](params);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Pre Img Risk Not Pass');
        expect(mockedPost).toHaveBeenCalledTimes(2);
    });

    it.each([
        ['generateVideo', { prompt: 'test' }],
        ['generateI2VVideo', { image_url: 'https://example.com/a.png', prompt: 'test' }]
    ])('%s returns the moderation reason after the first query', async (method, params) => {
        // 视频接口混用 axios.post 与 axios(config)，按 Action 区分提交与查询
        const queries: string[] = [];
        const respond = async (urlOrConfig: any) => {
            const url: string = typeof urlOrConfig === 'string' ? urlOrConfig : urlOrConfig.url;
            if (url.includes('CVSync2AsyncSubmitTask')) {
                return { status: 200, data: { code: 10000, data: { task_id: 'task-1' } } };
            }
            queries.push(url);
            return { status: 200, data: MODERATION };
        };
        mockedPost.mockImplementation(respond);
        mockedRequest.mockImplementation(respond);

        const result = await (client as any)[method](params);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Pre Img Risk Not Pass');
        expect(queries).toHaveLength(1);
    });

    it('still keeps polling through pending states and transient errors', async () => {
        mockedPost
            .mockResolvedValueOnce({ status: 200, data: { code: 10000, data: { task_id: 'task-1' } } })
            .mockResolvedValueOnce({ status: 200, data: { code: 10000, data: { status: 'in_queue' } } })
            .mockResolvedValueOnce({ status: 500, data: {} })
            .mockResolvedValueOnce({ status: 200, data: { code: 10000, data: { status: 'done', image_urls: ['https://example.com/a.png'] } } });

        const result = await client.generateJimengV40Image({ prompt: 'test' });

        expect(result.success).toBe(true);
        expect(result.image_urls).toEqual(['https://example.com/a.png']);
        expect(mockedPost).toHaveBeenCalledTimes(4);
    });
});
