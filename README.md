# dsh-pixluna

让 DSH 自己看涩图！

将 [PixLuna](https://github.com/PixLunaLab/pixluna) 的图片获取能力移植为 DeepSeek Harness（DSH）Cordis 插件。插件不再注册聊天命令，而是注册模型可调用的工具；原命令选项均转换为具名工具参数。

## 工具映射

| 原 PixLuna command        | DSH tool            | 参数                             |
| ------------------------- | ------------------- | -------------------------------- |
| `pixluna`                 | `pixluna_get`       | `number`, `source`, `tag`, `r18` |
| `pixluna.get.pixiv <pid>` | `pixluna_get_pixiv` | `pid`, `pages`, `all`            |
| `pixluna.source`          | `pixluna_sources`   | 无                               |

## 开发

```powershell
yarn install
yarn lint
yarn build
```

## 安装到 DSH profile

开发目录可直接作为带 `dsh.bundle` 清单的本地 profile layer 安装（`web` 可替换为目标 profile）：

```powershell
dsh plugin --profile web add dsh-pixluna
```

`dsh plugin` 会把本包加入 profile 的 `dsh.profile.bundles`，并自动应用包内 `cordis.patch.yml`。默认配置使用 `lolicon` 且关闭 R18；如需覆盖配置，可在该 profile 的用户 `cordis.patch.yml` 中按稳定 row id `pixluna` 覆盖整份配置：

```yaml
- id: pixluna
  name: dsh-pixluna
  config:
    defaultSourceProvider:
      - lolicon
    isR18: false
    pixiv:
      phpSESSID: ''
      userId: ''
```

注意 DSH patch 对 `config` 是整项替换而非深度合并。插件声明 `inject = ['tools']`，Cordis 会在 `@deepseek-ai/dsh-tools` 服务可用后激活它。

插件同时将 `Config` 注册为 `pixluna` 用户设置命名空间，并向 DSH 自带的“设置 → 插件 → 插件配置”注册配置卡片。全部配置均可在卡片中设置；常规字段写入 DSH settings，Pixiv Cookie 和各图源 `keyPairs` 则参照模型 API Key 的做法写入 DSH credentials，只向浏览器返回“已配置/未配置”状态。修改会实时作用于后续工具调用。

## 主要配置

- `defaultSourceProvider`: 默认图源数组。
- `isR18` / `r18P`: 是否允许 R18 及随机请求概率。
- `excludeAI`: 向支持该选项的图源请求排除 AI 作品。
- `isProxy` / `proxyHost`: 为 HTTP 请求启用代理。
- `baseUrl`: Pixiv 图片反代域名，默认 `i.pixiv.re`。
- `maxConcurrency`: 单次 `pixluna_get` 的并发上限，1–10。
- `apiDelay`: 各请求批次之间的延迟。
- `pixiv.phpSESSID`: Pixiv Discovery、Following 和按 PID 获取所需凭据。
- 各 booru 的 `keyPairs`: 可选或必需的图源凭据。

## 与原项目的差异

- 移除了 Koishi `Context.http`、消息发送、@ 用户、转发消息、自动撤回和 Koishi `h` 元素依赖。
- 使用 `undici` 发起可取消请求，并转发 DSH `ToolRunContext.signal`。
- 图片处理（翻转、混淆、压缩）未带入 DSH 工具输出；工具返回远程图片 URL，避免把大体积二进制数据写入会话日志。
- R18 请求须同时满足插件级 `isR18=true` 与工具参数/概率选择。

许可证沿用原 PixLuna 的 MPL-2.0。
