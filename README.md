# jimeng4-mcp

一个精简版的即梦 MCP 服务，只保留 `jimeng-v40-generate` 这一个能力。

## 当前能力

### `jimeng-v40-generate`

即梦 4.0 图片生成工具，支持：

- 文生图
- 单图编辑
- 多图组合生成
- 4K 超高清输出

主要参数：

- `prompt`: 必填，生成提示词
- `image_urls`: 可选，输入图片 URL 列表，最多 10 张
- `width` / `height`: 可选，需同时传入
- `size`: 可选，生成面积；若传入 `1024` / `2048` / `4096` 这类值，服务端会自动按边长转换为面积
- `scale`: 可选，文本影响强度，范围 `[0,1]`
- `force_single`: 可选，是否强制单图输出
- `seed`: 可选，随机种子
- `min_ratio`: 可选，最小宽高比
- `max_ratio`: 可选，最大宽高比

## 轮询优化

`jimeng-v40-generate` 仍然是同步返回结果，但内部等待逻辑已优化为低占用轮询：

- 提交任务后不会立刻查询，先等待首个冷启动窗口
- 后续查询使用退避策略，逐步拉长间隔
- 相比固定 5 秒轮询，可显著减少空查询请求和服务端压力

## 环境变量

使用前需要配置：

```bash
export JIMENG_ACCESS_KEY=your_access_key
export JIMENG_SECRET_KEY=your_secret_key
```

## MCP 配置示例

```json
{
  "mcpServers": {
    "jimeng": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "jimeng4-mcp"],
      "env": {
        "JIMENG_ACCESS_KEY": "your_access_key",
        "JIMENG_SECRET_KEY": "your_secret_key"
      }
    }
  }
}
```

## 开发

```bash
npm install
npm run build
npm run dev
```
