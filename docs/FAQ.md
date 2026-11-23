# jimeng4-mcp 常见问题 FAQ

## 1. 运行需要什么 Node 版本？

需要 Node.js 18 及以上。`package.json` 的 `engines` 已声明 `>=18.0.0`（package.json:55），与依赖 `@modelcontextprotocol/sdk` 的要求一致。可用 `node -v` 查看当前版本；低于 18 会导致安装或运行失败。

**English — What Node.js version is required?**

Node.js 18 or newer. `package.json` declares `engines.node: ">=18.0.0"` (package.json:55), matching the `@modelcontextprotocol/sdk` dependency requirement. Check with `node -v`; versions below 18 will fail to install or run.

## 2. 提示「未设置环境变量 JIMENG_ACCESS_KEY…」怎么办？

密钥变量名是 `JIMENG_ACCESS_KEY` 和 `JIMENG_SECRET_KEY`（src/index.ts:152-153）。按三步排查：

1. 变量名是否拼写正确（注意是 `JIMENG`，不是 `JIMENG4`）。
2. 进程能否读到：MCP 客户端 `env` 配置、当前目录 `.env`，或 `~/.jimeng-ai-mcp/.env`（历史遗留路径，沿用上游包名以兼容老用户；加载顺序见 examples/mcp-server.ts:18-27）。
3. `.env` 写法：项目已兼容 `export KEY=value` 前缀（src/dotenv-silent.ts:42），但更推荐直接写 `KEY=value`。

未配置时服务启动会打印警告（examples/mcp-server.ts:44-47），调用工具会返回「API密钥未配置」（examples/mcp-server.ts:652-663）。

**English — I see "JIMENG_ACCESS_KEY not set"?**

The key variables are `JIMENG_ACCESS_KEY` and `JIMENG_SECRET_KEY` (src/index.ts:152-153). Troubleshoot in three steps:

1. Check the variable names are spelled correctly (it's `JIMENG`, not `JIMENG4`).
2. Make sure the process can read them: the MCP client `env` block, a `.env` in the current directory, or `~/.jimeng-ai-mcp/.env` (a legacy path kept from the upstream package name for backward compatibility; load order at examples/mcp-server.ts:18-27).
3. In `.env`, the `export KEY=value` prefix is now supported (src/dotenv-silent.ts:42), but plain `KEY=value` is recommended.

When keys are missing, the server logs a warning at startup (examples/mcp-server.ts:44-47) and tool calls return "API密钥未配置" (examples/mcp-server.ts:652-663).

## 3. Windows 上 `npm start` 报「'DOTENV_DEBUG' 不是内部或外部命令」？

`npm start` 脚本用了 `DOTENV_DEBUG=false node ...` 前缀（package.json:11），Windows cmd 不识别这种 `VAR=value` 前缀写法。请改用 `npm run dev`（package.json:14，脚本里没有该前缀）。

**English — On Windows, `npm start` says "'DOTENV_DEBUG' is not recognized"?**

The `npm start` script uses the `DOTENV_DEBUG=false node ...` prefix (package.json:11), which Windows cmd.exe doesn't understand. Use `npm run dev` instead (package.json:14, which has no such prefix).

## 4. `image_urls` 能传本地文件路径吗？

不能。代码把 `image_urls` 数组原样透传给 API（src/index.ts:686-687），API 只接受公网 http/https URL；本地文件需要先上传到可公开访问的地址。数量最多 10 张、支持 JPEG/PNG、单张最大 15MB（examples/mcp-server.ts:641、mcp.json:30）。「只收公网 URL」的限制以官方文档为准。

**English — Can `image_urls` accept local file paths?**

No. The array is passed through to the API as-is (src/index.ts:686-687), and the API only accepts public http/https URLs; upload local files to a publicly reachable URL first. Up to 10 images, JPEG/PNG, 15MB max each (examples/mcp-server.ts:641, mcp.json:30). See the official docs for the "public URL only" rule.

## 5. `size` 参数传边长还是面积？

两种都可以。`size` 可以是边长（1024 / 2048 / 4096 表示正方形，MCP 层会自动平方成面积，examples/mcp-server.ts:671-677），也可以直接传面积（如 4194304 = 2048×2048）。面积有效范围是 [1048576, 16777216]，越界会在底层自动夹取到边界值（src/index.ts:671-679）。

**English — Does `size` take a side length or an area?**

Both work. `size` can be a side length (1024 / 2048 / 4096 mean a square; the MCP layer squares it automatically, examples/mcp-server.ts:671-677), or an area directly (e.g. 4194304 = 2048×2048). The valid area range is [1048576, 16777216]; out-of-range values are clamped at the boundary (src/index.ts:671-679).

## 6. `width` / `height` 需要成对传吗？

需要。两者必须同时传入才生效（mcp.json:32-39、src/index.ts:657）；只传其中一个会被丢弃、回退到默认 2048×2048（src/index.ts:682 的注释）。两者乘积必须在 [1048576, 16777216] 内，否则直接报错（src/index.ts:656-664）。

**English — Do `width` and `height` need to be passed together?**

Yes. Both must be provided together to take effect (mcp.json:32-39, src/index.ts:657); providing only one is dropped and the default 2048×2048 is used (comment at src/index.ts:682). Their product must be within [1048576, 16777216], otherwise an error is returned (src/index.ts:656-664).

## 7. 为什么审核没通过却提示「生成超时」？

图片路径已修复：审核失败错误码 [50411, 50511, 50412, 50512, 50413]（src/index.ts:521-527）现在会被当作终态 FAILED 立即返回，不再误报为几分钟的超时（src/index.ts:598-619）。视频辅助接口（仅库用法，MCP 中已下线）目前只对 50411 做终态处理（src/index.ts:1173），其余审核码仍按普通错误抛出，已记录、待修复。

**English — Why does a moderation rejection show up as a "timeout"?**

The image path is fixed: moderation error codes [50411, 50511, 50412, 50512, 50413] (src/index.ts:521-527) are now treated as terminal FAILED and returned immediately instead of being misreported as a multi-minute timeout (src/index.ts:598-619). The video helpers (library use only, disabled in MCP) still treat only 50411 as terminal (src/index.ts:1173) and throw on the rest; this is recorded and pending a fix.

## 8. `.env` 会覆盖 MCP 客户端传入的密钥吗？

不会。默认情况下 `.env` 不会覆盖进程里已有的环境变量（src/dotenv-silent.ts:53），只有显式传 `override: true` 才会覆盖。加载顺序：先读当前目录 `.env`，密钥仍缺失时再读 `~/.jimeng-ai-mcp/.env`（历史遗留路径，沿用上游包名以兼容老用户；examples/mcp-server.ts:18-27）。

**English — Does `.env` override keys passed by the MCP client?**

No. By default `.env` does not override environment variables already present (src/dotenv-silent.ts:53); only an explicit `override: true` forces it. Load order: current-directory `.env` first, then `~/.jimeng-ai-mcp/.env` if keys are still missing (a legacy path kept from the upstream package name for backward compatibility; examples/mcp-server.ts:18-27).

## 9. debug 模式会打印什么？有安全风险吗？

有。debug 模式会把完整的 AccessKey 打到日志（src/index.ts:172），SecretKey 只打印前 3 位（src/index.ts:173）。因此贴日志或 Issue 前务必删掉 AccessKey。MCP 工具默认是 `debug: false`（examples/mcp-server.ts:667）。

**English — What does debug mode print? Is there a security risk?**

Yes. Debug mode prints the full AccessKey to the log (src/index.ts:172); the SecretKey is masked to its first 3 characters (src/index.ts:173). Always remove the AccessKey before pasting logs into an Issue. The MCP tool runs with `debug: false` by default (examples/mcp-server.ts:667).

## 10. 调用返回 401 / 403 是什么原因？

通常是 AccessKey / SecretKey 填错，或火山引擎账号没有开通即梦图片生成服务。具体错误码语义以官方文档为准：https://www.volcengine.com/docs/6791/1396999

**English — What causes 401 / 403 responses?**

Usually a wrong AccessKey/SecretKey, or the Volcengine account hasn't enabled the Jimeng image-generation service. See the official docs for error-code semantics: https://www.volcengine.com/docs/6791/1396999

## 11. 视频生成工具去哪了？

`generate-video` / `get-video-result` 视频工具已在 MCP 中注释下线（examples/mcp-server.ts 帮助文档注释块 68-92、工具注册注释块 95-631），当前 MCP 只暴露 `jimeng-v40-generate` 一个工具。库层面的视频接口仍保留（submitVideoTask src/index.ts:990、getVideoTaskResult src/index.ts:1119），签名 region 默认 cn-north-1（src/index.ts:203）。

**English — Where did the video-generation tools go?**

The `generate-video` / `get-video-result` tools are commented out in the MCP server (help-doc comment at examples/mcp-server.ts:68-92, tool-registration block at 95-631); only `jimeng-v40-generate` is currently exposed via MCP. The video methods remain in the library (submitVideoTask src/index.ts:990, getVideoTaskResult src/index.ts:1119), and the signing region defaults to cn-north-1 (src/index.ts:203).
