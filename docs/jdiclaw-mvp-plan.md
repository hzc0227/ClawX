# JdiCLaw MVP 方案

本文档用于规划基于 ClawX 的二次开发方案，目标是尽快落地一个面向公司内部业务场景的桌面 Agent 产品 `JdiCLaw`。

目标产品形态参考 WorkBuddy / Cowork 一类桌面 Agent，重点覆盖以下核心能力：

- 会话
- 技能 / 工具集成
- 自动化与定时任务
- 企业配置与受控发布

## 方案结论

建议以 ClawX 作为产品外壳，以 OpenClaw 作为内嵌运行时，进行二次开发。

这是当前最快的落地路径，原因如下：

- ClawX 已经具备桌面 UI、设置页、初始化向导、Agent 管理、技能页、渠道页、定时任务页
- OpenClaw 已经内嵌到应用中，不需要再单独搭一层运行时
- Electron Main 已经承担了后端边界，适合继续扩展公司内部能力
- 当前 skill / plugin / channel 的模型，天然适合承载内部业务系统集成

## 产品目标

构建一个公司内部使用的桌面 Agent 应用 `JdiCLaw`，帮助员工通过智能体完成高频、重复、结构化的业务工作。

核心能力包括：

- 对话式操作
- 内部业务技能调用
- 定时任务和自动化执行
- 企业级默认配置与可控发布

## MVP 目标范围

第一版不建议一开始就做成“完整协作平台”，而应该聚焦一个可快速落地、可试点、可扩展的最小版本。

推荐 MVP 范围：

- 企业品牌化桌面应用
- 内部登录或身份绑定
- 一个主会话工作区
- 3 到 5 个高价值内部技能
- 定时任务创建与执行
- 按角色提供基础 Agent 模板
- 基础日志、诊断与可支持性能力

推荐优先接入的技能类别：

- 内部知识库问答
- 业务系统查询
- 报表生成与总结
- 巡检 / 监控类任务
- 审批 / 工单 / 流程查询助手

## MVP 暂不纳入范围

以下能力建议放在 MVP 之后：

- 复杂多人协同工作流
- 细粒度组织权限矩阵
- 重型远程执行调度体系
- 完整技能市场生态
- 超出基础使用统计的复杂分析看板
- 没有明确业务刚需时的多 IM 渠道扩展

## ClawX 现有能力映射

ClawX 当前已经具备与目标产品高度匹配的模块：

- 会话页面：[src/pages/Chat/index.tsx](/Users/hanzhichao7/Documents/code/JoyClaw/ClawX/src/pages/Chat/index.tsx)
- 技能管理：[src/pages/Skills/index.tsx](/Users/hanzhichao7/Documents/code/JoyClaw/ClawX/src/pages/Skills/index.tsx)
- 定时任务：[src/pages/Cron/index.tsx](/Users/hanzhichao7/Documents/code/JoyClaw/ClawX/src/pages/Cron/index.tsx)
- Agent 页面：[src/pages/Agents/index.tsx](/Users/hanzhichao7/Documents/code/JoyClaw/ClawX/src/pages/Agents/index.tsx)
- 初始化向导：[src/pages/Setup/index.tsx](/Users/hanzhichao7/Documents/code/JoyClaw/ClawX/src/pages/Setup/index.tsx)
- 设置与开发者工具：[src/pages/Settings/index.tsx](/Users/hanzhichao7/Documents/code/JoyClaw/ClawX/src/pages/Settings/index.tsx)

Electron Main 侧也已经有现成的 API 路由：

- 会话相关：[electron/api/routes/sessions.ts](/Users/hanzhichao7/Documents/code/JoyClaw/ClawX/electron/api/routes/sessions.ts)
- Gateway 相关：[electron/api/routes/gateway.ts](/Users/hanzhichao7/Documents/code/JoyClaw/ClawX/electron/api/routes/gateway.ts)
- 技能相关：[electron/api/routes/skills.ts](/Users/hanzhichao7/Documents/code/JoyClaw/ClawX/electron/api/routes/skills.ts)
- 定时任务相关：[electron/api/routes/cron.ts](/Users/hanzhichao7/Documents/code/JoyClaw/ClawX/electron/api/routes/cron.ts)
- 设置相关：[electron/api/routes/settings.ts](/Users/hanzhichao7/Documents/code/JoyClaw/ClawX/electron/api/routes/settings.ts)
- 模型供应商相关：[electron/api/routes/providers.ts](/Users/hanzhichao7/Documents/code/JoyClaw/ClawX/electron/api/routes/providers.ts)

## 二开总体策略

建议优先沿着稳定扩展点做增强，而不是重写底层。

推荐扩展顺序：

1. 品牌与默认配置
2. 企业身份与企业环境配置
3. 内部技能与 Agent 模板
4. 自动化模板
5. 治理、日志与运维支持

优先使用的扩展点：

- Renderer 页面层定制
- 设置项扩展
- Electron Main 新增 Host API 路由
- OpenClaw skill / plugin 集成
- Setup 向导按企业场景调整

第一阶段不建议深改的部分：

- Gateway 传输模型
- Renderer 与 Main 的通信边界
- OpenClaw 进程生命周期管理
- 通用设置框架

## 数据目录策略

`JdiCLaw` 不应默认复用用户已有的 `~/.openclaw` 数据目录，而应使用独立的数据空间。

当前建议并已落地的默认策略是：

- `JdiCLaw` 继续内嵌 OpenClaw 运行时
- 但运行时状态目录改为应用自己的专用目录
- 默认不直接读取用户个人 OpenClaw 历史会话、技能、渠道和配置

开发环境下的 macOS 示例路径：

- `~/Library/Application Support/jdiclaw/openclaw`

该目录承载：

- `openclaw.json`
- `skills/`
- `extensions/`
- `credentials/`
- `agents/`
- `workspace/`
- `media/`

这样做的目的：

- 避免企业产品与个人 OpenClaw 数据混用
- 保持试点环境、生产环境和个人实验环境相互隔离
- 降低问题排查与支持成本
- 为后续数据迁移、导入和企业治理预留清晰边界

后续如果需要兼容已有用户资产，建议单独提供“导入已有 OpenClaw 数据”的迁移能力，而不是默认共用 `~/.openclaw`

## 建议的架构分层

### 1. 产品层

目标：

- 完成品牌化、导航和企业化入口包装

覆盖内容：

- 应用名、Logo、主题、安装包标识
- 初始化向导的文案与流程调整
- 首页与功能入口裁剪

建议优先改动文件：

- [src/pages/Setup/index.tsx](/Users/hanzhichao7/Documents/code/JoyClaw/ClawX/src/pages/Setup/index.tsx)
- [src/components/layout/Sidebar.tsx](/Users/hanzhichao7/Documents/code/JoyClaw/ClawX/src/components/layout/Sidebar.tsx)
- [src/components/layout/TitleBar.tsx](/Users/hanzhichao7/Documents/code/JoyClaw/ClawX/src/components/layout/TitleBar.tsx)
- [src/pages/Settings/index.tsx](/Users/hanzhichao7/Documents/code/JoyClaw/ClawX/src/pages/Settings/index.tsx)

### 2. 企业集成层

目标：

- 让桌面应用安全地接入公司内部系统

覆盖内容：

- SSO 或身份绑定
- 内部 API 网关接入
- 内部知识库接入
- 业务系统查询接口
- 企业网络、代理、默认端点策略

建议实现方式：

- 在 Electron Main 增加公司专用后端路由
- Renderer 只通过 [src/lib/host-api.ts](/Users/hanzhichao7/Documents/code/JoyClaw/ClawX/src/lib/host-api.ts) 调用
- 不要在页面里直接新增裸 IPC 调用

### 3. 能力层

目标：

- 真正把业务价值交付给用户

覆盖内容：

- 内部技能
- Agent 模板
- Prompt 预设
- 自动化任务模板

推荐封装方式：

- 优先把业务能力做成 skill
- 再在产品层提供模板和默认配置

### 4. 治理层

目标：

- 保证内部试点、支持与发布过程可控

覆盖内容：

- 日志
- Doctor / 诊断
- 配置导出与问题排查
- 遥测策略
- 模型与供应商准入策略

## MVP 模块拆解

### 模块 A：品牌与打包

目标：

- 将 ClawX 改造成 `JdiCLaw` 产品外壳

范围：

- 替换产品名称为 `JdiCLaw`
- 替换 Logo、托盘图标、安装包标识
- 更新 Setup 文案和空状态文案
- 调整默认主题和品牌视觉

优先级：

- 高

### 模块 B：企业访问与环境接入

目标：

- 让应用在公司内部环境中可稳定使用

范围：

- 明确登录模式：轻量身份绑定或完整 SSO
- 注入内部环境默认配置
- 支持公司代理和网络策略
- 按需隐藏或限制不需要的公开 Provider

优先级：

- 高

### 模块 C：内部技能包

目标：

- 让用户安装后第一天就能解决真实业务问题

范围：

- 定义 3 到 5 个高价值技能
- 明确每个技能使用 skill、plugin 或 host-api 工具方式实现
- 预装批准的内部技能
- 做清晰的技能说明与失败态处理

优先级：

- 最高

### 模块 D：自动化模板

目标：

- 把重复业务工作沉淀成可调度任务

范围：

- 保留现有 Cron 能力
- 增加日报、异常巡检、知识摘要等内部模板
- 统一任务命名、输出和归属方式

优先级：

- 高

### 模块 E：Agent 模板

目标：

- 降低用户理解成本与 Prompt 编写成本

范围：

- 定义若干内部角色 Agent
- 例如：数据分析助手、运营助手、商家助手、报表助手
- 为每类 Agent 提供默认提示词和启用技能集合

优先级：

- 中

### 模块 F：治理与支持

目标：

- 支撑试点、运维与问题排查

范围：

- 保持日志与诊断能力可见、可用
- 补充企业场景下的支持信息
- 明确遥测采集边界
- 定义配置重置与修复机制

优先级：

- 中

## 推荐开发顺序

### 阶段 1：产品外壳

目标：

- 让应用先具备 `JdiCLaw` 的产品外观和入口形态

任务：

- 确定统一产品命名为 `JdiCLaw`
- 替换品牌资源
- 调整 Setup 向导
- 确定 MVP 暴露哪些页面
- 决定 Channels 页面是否保留在 MVP 中

### 阶段 2：企业接入

目标：

- 让应用能够接入公司内部系统并识别用户身份

任务：

- 明确登录或绑定方案
- 定义内部 API 接入方式
- 在 Electron Main 新增内部路由
- 保证所有 Renderer 请求都通过 Host API 统一走

### 阶段 3：业务能力交付

目标：

- 用户可以用它完成真实业务任务

任务：

- 实现第一批内部技能
- 建立内部 Agent 模板
- 校验提示词和技能组合效果
- 为每个能力定义成功标准

### 阶段 4：自动化交付

目标：

- 把高频任务沉淀成可复用自动化

任务：

- 基于现有 Cron 增加业务模板
- 定义输出位置与执行结果标准
- 测试失败处理与重试路径

### 阶段 5：内部试点

目标：

- 让有限范围用户稳定试用

任务：

- 选择试点团队
- 收集接入和使用摩擦点
- 重点迭代 Setup、权限、技能能力缺口

## 建议团队分工

如果团队多人协作，建议按以下方式拆分：

- 产品壳负责人：品牌、导航、Setup、Settings 体验
- 企业集成负责人：SSO、内部 API、环境配置策略
- 能力负责人：内部技能、Agent 模板、自动化模板
- 运行时负责人：打包、OpenClaw 兼容性、诊断、发布链路

## 关键技术原则

- Renderer 到后端的调用必须统一走 [src/lib/host-api.ts](/Users/hanzhichao7/Documents/code/JoyClaw/ClawX/src/lib/host-api.ts) 和 [src/lib/api-client.ts](/Users/hanzhichao7/Documents/code/JoyClaw/ClawX/src/lib/api-client.ts)
- 不要让 Renderer 直接请求 Gateway HTTP 接口
- 优先通过新增路由和扩展点实现企业能力，而不是替换底层通信机制
- 优先把业务能力沉淀为 skill 和模板，而不是一开始新造一套平台框架
- OpenClaw 升级应当作为应用版本管理的一部分

## 推荐首批交付物

建议第一批就做下面这几项，足够小，且足够验证方向：

1. `JdiCLaw` 品牌替换
2. 企业化 Setup 流程调整
3. 一个内部知识库技能
4. 一个业务查询技能
5. 一个定时报告模板

## 待确认决策项

正式开始开发前，建议明确以下事项：

1. 产品统一命名：`JdiCLaw`
2. 登录模式：无登录、轻量绑定，还是完整 SSO
3. 首个试点部门
4. 第一批接入的 3 个业务系统
5. Channels 页面是否进入 MVP
6. 面向普通用户是否保留公开 Provider 配置能力

## 下一步建议

在本方案之后，最适合继续推进的动作是再落一份更细的执行清单，至少拆到：

- 页面级改造项
- Electron 路由新增项
- 内部技能清单
- 负责人和阶段里程碑
