# jimeng4-mcp

[![npm version](https://img.shields.io/npm/v/jimeng4-mcp)](https://www.npmjs.com/package/jimeng4-mcp) [![License: MIT](https://img.shields.io/npm/l/jimeng4-mcp)](https://github.com/BACH-AI-Tools/jimeng4-mcp/blob/main/LICENSE)

一个精简版的即梦 MCP 服务，只保留 `jimeng-v40-generate` 这一个能力。

> **来源：** 本项目基于 [freeleepm/jimeng-ai-mcp](https://github.com/freeleepm/jimeng-ai-mcp)（MIT 许可）修改而来，在其基础上做了精简和改名。原版权声明「Copyright (c) 2025 Jimeng AI」保留在 [LICENSE](LICENSE) 中。

## 使用前提

- 需要一个火山引擎账号，并开通即梦图片生成服务，申请 AccessKey / SecretKey。
- 接口细节、参数限制与错误码语义以火山引擎官方文档为准：https://www.volcengine.com/docs/6791/1396999

## 当前能力

### `jimeng-v40-generate`

即梦 4.0 图片生成工具，支持：

- 文生图
- 单图编辑
- 多图组合生成
- 4K 超高清输出

主要参数：

- `prompt`: 必填，生成提示词
- `image_urls`: 可选，输入图片 URL 列表（公网 http/https），最多 10 张
- `width` / `height`: 可选，需同时传入，乘积须在 [1048576, 16777216] 内，否则会报错
- `size`: 可选，生成尺寸。可传边长（`1024` / `2048` / `4096` 表示正方形，MCP 层会自动按边长平方为面积），也可直接传面积（如 `4194304` = 2048×2048）；面积有效范围 [1048576, 16777216]，越界会自动夹取到边界
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

## 环境要求

- Node.js 18 及以上（`@modelcontextprotocol/sdk` 要求 Node.js >= 18，`package.json` 的 `engines` 已同步声明）

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

## 示例代码

`examples/` 目录下有三个文件：

- `examples/mcp-server.ts`：MCP 服务端入口，`npx jimeng4-mcp` 运行的就是它编译后的产物。
- `examples/jimeng-image-generator.ts`：**旧版** 图片生成示例，调用传统 `generateImage` 接口（默认模型 `jimeng_high_aes_general_v21_L`、512×512），**不是即梦 4.0**，仅作历史参考。
- `examples/jimeng-video-generator.ts`：视频生成示例（库用法；视频工具在 MCP 中已下线，仅可通过库函数调用）。

运行图片示例（需先设置好密钥）：

```bash
npx ts-node examples/jimeng-image-generator.ts "一只可爱的熊猫"
```

## 常见问题

安装、密钥配置、参数用法、审核/超时等常见问题见 [docs/FAQ.md](docs/FAQ.md)（中英双语）。

## 开发

```bash
npm install
npm run build
npm run dev
```

## 致谢与许可

- 原始项目：[freeleepm/jimeng-ai-mcp](https://github.com/freeleepm/jimeng-ai-mcp)，MIT License，Copyright (c) 2025 Jimeng AI。
- 本项目同样以 MIT 许可发布，详见 [LICENSE](LICENSE)。
- 本项目由 BACH-AI-Tools 维护，就修改部分另附版权行。
