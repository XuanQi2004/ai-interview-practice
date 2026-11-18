# AI 岗位 coding 面试资源调研

本调研面向准备中国和美国 AI 实习及全职岗位面试的读者，按要展示的能力选择材料。算法笔试重视正确性、复杂度和输入输出。LLM 与 Agent 模块手写还要展示接口设计、张量形状、状态管理，以及如何用一个小例子解释实现。下面的资源来自题库维护者、大学课程、框架作者和研究论文，核对日期为 2026 年 11 月 17 日。

Amazon 将 coding test 列为 SDE 在线测评的一环，列出的准备主题包括数据结构和算法。OpenAI 的招聘说明列出 pair coding、带回家完成的项目和技术测试，工程面试关注方案设计、代码质量、性能和测试覆盖。两种练习方式分别对应这些可观察的能力。岗位的具体面试形式以当次招聘说明为准。[Amazon SDE 准备指南](https://amazon.jobs/content/en/how-we-hire/interview-prep/software-development-topics) · [OpenAI 面试指南](https://openai.com/interview-guide/)

## 如何选第一组练习

| 你的场景 | 从哪里开始 | 怎样看出进步 |
| --- | --- | --- |
| 美国英文在线笔试 | 在 LeetCode 75 选一个主题，先用本地题理解方法，再到英文站做一道陌生题。 | 自己写出通过用例的实现，并用英文解释复杂度和一个边界条件。 |
| 中国在线笔试 | 用力扣热题 100 或牛客 TOP101 练算法，同时用本地标准输入输出题练完整程序。 | 能从题面独立写出输入解析，正确处理多组样本并输出规定的结果。 |
| LLM Research Scientist | 手算两个 token 的注意力权重，从单头注意力写到 MHA、GQA，再实现多步 AdamW。 | 能通过数值用例，并解释缩放、掩码、KV 共享和偏置校正如何影响结果。 |
| LLM / Agent Engineer | 在上述实现上加入 KV cache、工具调用与错误处理，用预设响应重放一轮成功、一轮失败。 | 能说明一次续写复用了什么、如何对应工具调用与结果，以及重复事件会怎样处理。 |

## 算法 OJ 与在线笔试

准备美国和中国的岗位，可以共用一套 Python 算法练习。在英语面试中用英文复述题意、说明复杂度；遇到国内笔试的标准输入输出模式，把同一算法写成读取输入、输出结果的完整程序。不同题单包含相同的经典问题，适合选一份作为主线，再按薄弱主题补题。

### 术语

- **在线判题（OJ）**：平台运行提交的程序，将各测试输入对应的输出与预期结果比较。
- **函数题**：网站提供函数或方法签名，提交者返回结果，网站负责解析输入和调用函数。
- **标准输入输出题（ACM 模式）**：提交者编写完整程序，从标准输入读取题目规定的数据并向标准输出写入答案。

### 题库与资料

| 资源 | 适合解决的问题 | 如何使用 |
| --- | --- | --- |
| LeetCode 75、Top Interview 150 | 用英文复习通用算法面试。75 题适合集中复习，150 题覆盖范围更广。 | 用 75 题建立主线；对已经熟练的题型，直接从 150 题里挑陌生变式，练习澄清返回值、写代码和讲复杂度。[LeetCode 75](https://leetcode.com/studyplan/leetcode-75/) · [Top Interview 150](https://leetcode.com/studyplan/top-interview-150/) |
| 力扣热题 100 | 用中文做站内用户喜爱的经典问题。这里的「热」指平台用户偏好。 | 用中文理解新题型，英文口述同一算法。可从滑动窗口、链表、二叉树和动态规划选专题。[力扣热题 100](https://leetcode.cn/studyplan/top-100-liked/) |
| NeetCode 150 | 已懂基本数据结构，希望弄清什么时候用哪种算法。作者把 Blind 75 扩展为 150 题并按专题组织，还提供视频解法。 | 从路线图选择专题，先尝试同类题，再看视频中如何描述循环不变量，最后换一道未见题独立实现。[题单](https://neetcode.io/practice/practice/neetcode150) · [路线图](https://neetcode.io/roadmap) |
| 牛客面试 TOP101、笔试题与输入输出练习 | 中文面试函数题与国内在线笔试的输入格式。TOP101 按链表、二分、递归、动态规划等分组。 | 平时在 TOP101 做函数题；收到国内笔试邀请后，在同一入口选「输入输出练习」和「笔试大厂真题」，练习解析多行、多组数据和按格式打印。[牛客算法笔面试](https://www.nowcoder.com/exam/oj) |
| HackerRank Preparation Kits | 熟悉英文在线题面、平台编辑器与提交反馈。官网列有 1 周、1 个月和 3 个月三个题包。 | 英文笔试前用短题包熟悉平台操作，再从较大题包选针对性练习。[HackerRank 题包](https://www.hackerrank.com/interview/preparation-kits) |
| CodeSignal General Coding Assessment | 收到明确写有 GCA 的邀请，希望熟悉其计时方式。官方给出的 GCA 是 70 分钟 4 题，开始时可以访问所有题。 | 从平台的 Practice 入口进入模拟，练习浏览整套题、切换题目和分配时间。公司自定义测评的格式以邀请说明为准。[GCA 结构](https://support.codesignal.com/hc/en-us/articles/360040370853-What-should-I-expect-when-I-take-the-General-Coding-Assessment-GCA-and-how-is-it-structured) · [练习入口说明](https://support.codesignal.com/hc/en-us/articles/360051960134-General-Coding-Assessment-GCA-Rules-and-Setup) |
| Hello 算法 | 重新理解单调性、堆、遍历或状态转移。作者提供中文图解和可运行代码。 | 错题复盘时查相应章节，手算一个小例子，关闭示例代码后完成一次独立实现。[中文版](https://www.hello-algo.com/) |
| CSES Problem Set | 某个专题需要更多陌生题，例如图最短路、区间查询或动态规划。 | 直接进入对应专题，从一题开始检验算法能否迁移到不同输入规模和约束。[CSES 分类题库](https://cses.fi/problemset/) |

### 练习安排

1. **从哈希表和滑动窗口开始。** 做一次配对查询和一次连续片段计数。分别解释哈希表保存了哪些历史信息、窗口左端在什么条件下移动。用重复值、空输入和所有值相同的例子检查自己的实现。
2. **练习有序性和数据结构。** 做二分边界、单调栈、堆、区间合并和链表题。提交前写出索引区间的开闭、相等元素的处理方式，以及每个元素最多入栈、出栈几次。
3. **练习图和动态规划。** 用 BFS 求无权最短路，用拓扑排序判断依赖关系，再练习最少步数和二维序列动态规划。口述每个状态的含义，手算一个不可达或有重复元素的例子。
4. **切换到目标考试的交互方式。** 函数题提交返回值；完整程序题从原站做一次多组输入；面试练习则边写边向同伴解释边界与复杂度。每次留下导致失败的最小输入，在另一道相同主题的题上独立重写。

在「算法题单」中选择 LeetCode 75、热题 100、面试经典 150 或牛客 TOP101，点题名即可在站内练习。四份题单的 335 道不同题均提供独立编写的中文题面、Python 解答及本地用例。原站链接可用于比较英文表述、在官方平台提交。

资源页面核对日期为 2026 年 11 月 17 日。

## AI 模块手写与 Agent 工程

如果目标是 LLM Research Scientist，可以从缩放点积注意力写到带投影的多头注意力（MHA），再改为分组查询注意力（GQA），最后实现带状态的 AdamW。如果目标是 LLM/Agent Engineer，沿用上述基础，增加 KV cache 增量解码和带工具调用的多轮对话。下面的选择依据是官方题目内容、课程作业和可复现的测试方式。具体公司的出题频率需要面试统计，这些资源提供的是技能覆盖依据。

### 去哪里练

| 资源 | 可以做什么 | 适合怎样使用 |
| --- | --- | --- |
| Deep-ML（英文） | 在线提交 Python，实现线性代数、深度学习和 NLP 小题，浏览器返回测试结果。 | 练习按轴归一化、矩阵乘法和稳定 softmax。一次只改一个操作，从失败样例定位是形状错误还是算式错误。[官方题库](https://www.deep-ml.com/problems) |
| TensorTonic（英文） | 按 PyTorch、NumPy 等工具和 Transformers、Inference、Optimization 等主题筛题；例如 Adam 单步更新与位置编码。 | 从弱项挑短题，把数学表达式写成张量操作。做完 Adam 后追加权重衰减和多步状态管理，练习 AdamW。[官方题库](https://www.tensortonic.com/problems) |
| Stanford CS336 Assignment 1（英文） | 从零实现语言模型、交叉熵、优化器与训练流程。课程公开测试的适配层可以连接自己的实现。 | 单独做一个层，对照课程测试；随后把多个组件组成可训练的模型。适合从函数题过渡到工程实现。[课程](https://cs336.stanford.edu/) · [作业与测试](https://github.com/stanford-cs336/assignment1-basics) |
| 《动手学深度学习》多头注意力（中文） | 结合图、PyTorch 代码和形状示例解释投影、拆头、拼接。 | 先画出单批、两个头和三个 token 的张量形状，再独立写出批量版；用中文讲一遍，再用英文讲给美国面试官听。[中文章节](https://zh.d2l.ai/chapter_attention-mechanisms/multihead-attention.html) |
| PyTorch 注意力和 AdamW（英文） | 查缩放、mask、GQA 的接口语义，以及解耦权重衰减和优化器状态更新。 | 手写版与官方函数接收同一小批输入，比较输出、梯度和多步更新结果。布尔 mask 在 scaled dot-product attention 中用 True 表示允许参与注意力，比较时明确所用接口。[SDPA 文档](https://docs.pytorch.org/docs/2.9/generated/torch.nn.functional.scaled_dot_product_attention.html) · [AdamW 文档](https://docs.pytorch.org/docs/2.9/generated/torch.optim.AdamW.html) |
| GQA 原论文、Hugging Face Transformers 缓存文档（英文） | 阅读 query 头共享 K/V 的分组方式，以及自回归解码时缓存的形状和更新过程。 | 手算一次四个 query 头共享两组 K/V 的映射，接着让已有缓存的解码结果与全序列因果 attention 的末段对齐。[GQA 论文](https://aclanthology.org/2023.emnlp-main.298/) · [缓存说明](https://huggingface.co/docs/transformers/en/cache_explanation) |
| Hugging Face Agents Course（中英文）、Anthropic 工程文章（英文） | 课程用实际工具介绍行动、观察与下一轮推理；工程文章讨论工具接口与工作流设计。 | 用预设的模型输出重放“调用工具 → 返回观察 → 输出最终答案”。逐轮比较调用 ID、工具结果和停止位置。再口头解释真实模型客户端与工具实现应如何替换。[中文课程](https://huggingface.co/learn/agents-course/zh-CN/unit1/introduction) · [英文课程](https://huggingface.co/learn/agents-course/en/unit1/introduction) · [工程文章](https://www.anthropic.com/research/building-effective-agents) |
| Datawhale Happy-LLM 与 Hello-Agents（中文） | Happy-LLM 的第二、五章分别覆盖 Transformer 与小型 LLaMA2 实现；Hello-Agents 的第四章实现 ReAct，社区精选收录了 Agent 面试问题与答案。 | 面向中文面试，可将一段手写代码配上一个口述问题，例如工具返回错误后，如何记录结果并继续对话。框架接入可与 Qwen-Agent 的工具注册和消息迭代示例比较。[Happy-LLM 教程](https://github.com/datawhalechina/happy-llm) · [Hello-Agents 教程](https://github.com/datawhalechina/hello-agents) · [Qwen-Agent 中文示例](https://github.com/QwenLM/Qwen-Agent/blob/main/README_CN.md) |

### 如何模拟人工评阅

找一位同学扮演面试官，或用平台中的 Codex 讨论当前实现。开始时约定张量形状、mask 的含义、函数输出和可用算子。实现后用小输入展示行为，再请对方从下列角度追问。美国岗位可用英文说明实现，中国岗位可用中文回答并保留通行的 API 名称。

| 模块 | 能区分实现的用例 | 值得讲清的设计 |
| --- | --- | --- |
| Full / causal attention | 使用两个不同的 value；改变未来位置，比较前面位置的输出。 | 缩放因子使用单头维度；softmax 沿 key 维计算；因果遮罩应用在 softmax 之前。 |
| MHA / GQA | 使用非单位投影和不同的 K/V 头；让一组内两个 query 产生不同权重。 | 投影、拆头、合头顺序；固定头维时，KV cache 的大小与 K/V 头数成正比。 |
| AdamW | 从非零权重开始，用零梯度检查衰减，再用两步异号梯度检查动量。 | 时间步、矩估计与偏置校正；区分零梯度张量与本步缺省的梯度。 |
| 增量解码 | 给一个已有前缀，一次输入两个新 token；与全序列重算的对应位置比较。 | 因果遮罩中的绝对位置偏移；动态拼接缓存的复制成本。 |
| 工具调用 | 重放正常调用、未知工具、相同 ID 的重复调用与结束事件。 | 调用 ID 如何关联观察，重复调用如何复用结果，如何向下一轮模型呈现错误。 |

本地数值测试可以发现输出与状态更新中的错误。人工复盘着重记录实现中的具体证据，例如“把 head 维和 token 维调换后，重新运行两头三 token 的样例通过”，下次复习可以直接重写对应步骤。

## 从教程转到模块实现

站内「教程库」按实现问题组织材料。选择「原文资料」可按作者、项目或资料类型查找；每篇站内教程注明相关章节、函数或源文件，附对应的 Python 练习。在阅读页勾选「已读」，或选中一段公式、代码并点击「讨论所选片段」，即可保留当时的阅读上下文。

| 想练的任务 | 阅读时带着什么问题 | 怎样验证实现 |
| --- | --- | --- |
| 从零实现模型层 | 读嵌入、残差与输出头的调用顺序，写下一个小批次经过各层的形状。[Raschka 的 GPT 源码](https://github.com/rasbt/LLMs-from-scratch/blob/main/ch04/01_main-chapter-code/gpt.py) | 让两个位置共用同一个词 ID，检查共享权重的梯度有没有累加。 |
| 微调与训练循环 | 两个微批的有效 token 数不同时，总损失应除以什么？[Hugging Face 梯度累积分析](https://huggingface.co/blog/gradient_accumulation) | 把各微批的损失求和后按总有效数归一化，与拼成一个大批的梯度比较。 |
| 推理与解码 | 过滤候选词后如何重新归一化，beam search 又如何比较跨步累积得分？[Hugging Face 解码示例](https://huggingface.co/blog/how-to-generate) | 固定三个词的 logits，分别算贪心、top-k 与 top-p 的候选和概率。 |
| 检索与 Agent 系统 | 检索结果以文档或片段作为单位；工具参数在若干网络分片到达时又如何组装？ | 用同文档的重复片段重算召回，再让交错的两次工具调用分别拼出完整参数，逐项核对记录。 |
