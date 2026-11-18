'use strict';

const track = 'Agent 工程';
const library = {
  tools: ['什么是工具？', 'Hugging Face', '课程', 'https://huggingface.co/learn/agents-course/zh-CN/unit1/tools'],
  schema: ['Understanding JSON Schema · Object', 'JSON Schema', '文档', 'https://json-schema.org/understanding-json-schema/reference/object'],
  output: ['Pydantic AI · Output', 'Pydantic', '文档', 'https://pydantic.dev/docs/ai/core-concepts/output/'],
  events: ['Server-sent events', 'WHATWG', '文档', 'https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation'],
  streaming: ['Streaming messages', 'Anthropic', '文档', 'https://platform.claude.com/docs/en/build-with-claude/streaming'],
  graph: ['LangGraph · Graph API overview', 'LangChain', '文档', 'https://docs.langchain.com/oss/python/langgraph/graph-api'],
  workflows: ['Building effective agents', 'Anthropic', '博客', 'https://www.anthropic.com/research/building-effective-agents'],
  persist: ['LangGraph · Checkpointers', 'LangChain', '文档', 'https://docs.langchain.com/oss/python/langgraph/checkpointers'],
  backoff: ['Timeouts, retries, and backoff with jitter', 'Marc Brooker / Amazon', '博客', 'https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/'],
  http: ['HTTP Semantics · Retry-After', 'IETF', '文档', 'https://datatracker.ietf.org/doc/html/rfc9110#section-10.2.3'],
  context: ['Effective context engineering for AI agents', 'Anthropic', '博客', 'https://www.anthropic.com/research/effective-context-engineering-for-ai-agents'],
  memory: ['Short-term memory', 'LangChain', '文档', 'https://docs.langchain.com/oss/python/langchain/short-term-memory'],
  toolResults: ['Handle tool calls', 'Anthropic', '文档', 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls'],
  evals: ['Demystifying evals for AI agents', 'Anthropic', '博客', 'https://www.anthropic.com/research/demystifying-evals-for-ai-agents'],
  match: ['AgentEvals · Trajectory match', 'LangChain', '开源库', 'https://github.com/langchain-ai/agentevals'],
  traces: ['OpenTelemetry · Traces', 'OpenTelemetry', '文档', 'https://opentelemetry.io/docs/concepts/signals/traces/'],
  react: ['ReAct: Synergizing Reasoning and Acting in Language Models', 'Shunyu Yao 等', '论文', 'https://react-lm.github.io/'],
};

function resource(key, note) {
  const [title, author, kind, url] = library[key];
  return { title, author, kind, url, note };
}

function problem(id, title, topic, difficulty, summary, statement, parameters, body, explanation, reference, rubric, tests) {
  const signature = 'solve(' + parameters + ')';
  return {
    id: 'ai-' + id, category: 'AI 模块', track, topic, difficulty, title, summary,
    statement, signature, starter: 'def ' + signature + ':\n    raise NotImplementedError\n',
    solution: 'def ' + signature + ':\n' + body.trimEnd() + '\n', explanation,
    source: { label: library[reference][0], url: library[reference][3] },
    rubric, requiresTorch: false, cases: tests.map(([args, expected]) => ({ args, expected }))
  };
}

const properties = { doc: 'string', limit: 'integer', detail: 'boolean' };
const problems = [
  problem('tool-argument-schema', '校验工具调用的参数', '工具接口', '基础',
    '根据类型声明、必填字段和未知字段策略，返回所有参数错误。',
    '输入 properties 将键映射到 string、integer 或 boolean，required 是其中必填键列表。args 是已解码的 JSON 对象；allow_extra 控制是否允许额外键。返回字符串列表，每条格式为 键:missing、键:type 或 键:extra，按完整字符串的字典序排列。此题 integer 指 Python int 数据（排除 bool），字符串与布尔值均严格检查。可选字段省略时合法。',
    'properties, required, args, allow_extra', `    types = {"string": str, "integer": int, "boolean": bool}
    errors = [key + ":missing" for key in required if key not in args]
    for key, value in args.items():
        if key in properties:
            if type(value) is not types[properties[key]]:
                errors.append(key + ":type")
        elif not allow_extra:
            errors.append(key + ":extra")
    return sorted(errors)`,
    '分别检查缺少的必填键和实际传入的字段。精确比较 Python 类型可区分 True 与 1。e 个错误最终排序花 O(e log e) 时间。',
    'schema', ['区分缺失、空字符串、null 和 False。','明确额外字段的处理策略。','输出稳定，便于模型和调用方定位错误。'],
    [[[properties,['doc'],{doc:'a',limit:3},false],[]],[[properties,['doc'],{limit:true,x:1},false],['doc:missing','limit:type','x:extra']],[[properties,['detail'],{doc:null,detail:1,x:'x'},true],['detail:type','doc:type']],[[{},[],{},false],[]],[[properties,['detail'],{detail:false,limit:0},false],[]]]),

  problem('grounded-output', '验证结构化引用', '结构化输出', '中等',
    '检查模型输出的 JSON 结构，并把每段引用定位到本地文档。',
    'docs 为 {文档ID: 原文}，text 为字符串。期望 JSON 对象含非空字符串 answer 和列表 citations；每条引用含字符串 doc、quote，quote 非空。多余字段忽略。返回最先遇到的问题：解析失败 {"error":"json"}；顶层或任一引用结构错误 {"error":"shape"}（先检查全部结构）；再按引用顺序检查文档存在且 quote 连续出现在原文中，失败返回 {"error":"evidence","index":下标}。成功返回 {"answer":原回答,"spans":[[doc,起点,终点],…]}，下标按 Python 字符、左闭右开，重复原文取第一次出现。输入 JSON 数字均有限。',
    'text, docs', `    import json
    try:
        result = json.loads(text)
    except ValueError:
        return {"error": "json"}
    if not isinstance(result, dict):
        return {"error": "shape"}
    answer = result.get("answer")
    citations = result.get("citations")
    if not isinstance(answer, str) or not answer or not isinstance(citations, list):
        return {"error": "shape"}
    for item in citations:
        if not isinstance(item, dict) or not isinstance(item.get("doc"), str):
            return {"error": "shape"}
        if not isinstance(item.get("quote"), str) or not item["quote"]:
            return {"error": "shape"}
    spans = []
    for i, item in enumerate(citations):
        doc, quote = item["doc"], item["quote"]
        start = docs.get(doc, "").find(quote)
        if start < 0:
            return {"error": "evidence", "index": i}
        spans.append([doc, start, start + len(quote)])
    return {"answer": answer, "spans": spans}`,
    '先解析并校验字段，再在指定文档中做精确子串查找。位置可用于前端高亮，引用文字是否支持回答语义可交给另一个评测任务。',
    'output', ['说明字段错误和证据匹配失败的优先级。','考虑重复片段及中文字符位置。','区分引用定位与回答的语义正确性。'],
    [[[JSON.stringify({answer:'光谱',citations:[{doc:'entry',quote:'实验'},{doc:'entry',quote:'光'}]}),{entry:'光谱，实验'}],{answer:'光谱',spans:[['entry',3,5],['entry',0,1]]}],
      [['{',{}],{error:'json'}],[['[]',{}],{error:'shape'}],
      [[JSON.stringify({answer:'a',citations:[{doc:'x',quote:'b'},{doc:'x',quote:''}]}),{}],{error:'shape'}],
      [[JSON.stringify({answer:'a',citations:[{doc:'x',quote:'b'}]}),{}],{error:'evidence',index:0}],
      [['{"answer":"ok","citations":[]}',{}],{answer:'ok',spans:[]}]]),

  problem('sse-frames', '从网络分片解码 SSE 事件', '流式协议', '中等',
    '恢复跨分片的行，识别注释、具名事件、多行 data 字段与事件边界。',
    'chunks 是已解码的字符串分片，拼接后是 SSE 文本；换行可为 LF、CRLF 或单独 CR，分片可切在 CRLF 之间。本练习处理 event、data 字段，忽略其他字段和以冒号开头的注释。字段按首个冒号分割，无冒号时字段值为空；移除字段值最前面的一个 ASCII 空格（如果存在）。空行结束事件；至少一行 data 才发出，多个 data 值用 LF 连接。空或缺省 event 名用 message。空行后重置事件名和数据，流尾尚未遇到空行的事件丢弃。返回 [[事件名,数据],…]，输入无 BOM。',
    'chunks', String.raw`    stream = "".join(chunks).replace("\r\n", "\n").replace("\r", "\n")
    name, lines, events = "", [], []
    for line in stream.split("\n")[:-1]:
        if line == "":
            if lines:
                events.append([name or "message", "\n".join(lines)])
            name, lines = "", []
        elif not line.startswith(":"):
            key, _, value = line.partition(":")
            if value.startswith(" "):
                value = value[1:]
            if key == "event":
                name = value
            elif key == "data":
                lines.append(value)
    return events`,
    '合并分片后统一换行，再仅遍历已被终止的行。用列表区分没有 data 行与仅含空字符串的 data 行。时间和空间均随输入字符总数线性增长。若改为逐分片产生事件，另保存半行和可能待配对的 CR。',
    'events', ['区分传输分片、完整行、完整事件。','正确处理多行数据、空 data 和中途断开。','说明逐分片输出所需的状态。'],
    [[[['event: tool\r','\ndata: {"a":','1}\r\n','\r\n']], [['tool','{"a":1}']]],
      [[[': heartbeat\ndata: a:b\ndata:  c\n\n']], [['message','a:b\n c']]],
      [[['event: skip\n\ndata:\n\n','data: incomplete\n']], [['message','']]],
      [[['data\r\revent:\rdata:x\r\r']], [['message',''],['message','x']]],
      [[[],],[]],[[['data: x\n']],[]]]),

  problem('stream-tool-arguments', '组装并行工具调用的参数', '流式工具调用', '中等',
    '分别缓存每个内容块的 JSON 片段，只在块结束时产生完整调用。',
    '输入是简化后的已解码事件列表。["start",index,id,name] 创建块；["delta",index,片段] 依到达顺序追加参数；["stop",index] 拼接并解析 JSON。只接受 JSON 对象，无片段的块使用空对象。解析失败或非对象时追加 {"id":id,"error":"invalid_args"}，成功时追加 {"id":id,"name":name,"args":参数对象}。不同 index 的事件可交错，结果按 stop 顺序排列。协议保证 start 唯一，delta 和 stop 均对应活动块。流尾尚未 stop 的块不会产生结果。',
    'events', `    import json
    active, completed = {}, []
    for kind, index, *payload in events:
        if kind == "start":
            active[index] = (*payload, [])
        elif kind == "delta":
            active[index][2].append(payload[0])
        else:
            call_id, name, parts = active.pop(index)
            try:
                args = json.loads("".join(parts)) if parts else {}
                if not isinstance(args, dict):
                    raise ValueError()
            except ValueError:
                completed.append({"id": call_id, "error": "invalid_args"})
            else:
                completed.append({"id": call_id, "name": name, "args": args})
    return completed`,
    '按 index 保存调用元数据和独立的片段列表。stop 时一次连接、解析并释放该块。对于总长 L 的片段和 E 条事件，时间 O(E+L)。',
    'streaming', ['分别跟踪交错的内容块。','完整 JSON 到齐后再解析，区分空对象与损坏对象。','解释断流时活动调用的状态。'],
    [[[[['start',0,'a','find'],['start',1,'b','count'],['delta',0,'{"q":'],['delta',1,'{"n":2}'],['stop',1],['delta',0,'"图"}'],['stop',0]]],[{id:'b',name:'count',args:{n:2}},{id:'a',name:'find',args:{q:'图'}}]],
      [[[['start',0,'c','now'],['stop',0],['start',1,'d','lost']]],[{id:'c',name:'now',args:{}}]],
      [[[['start',3,'e','x'],['delta',3,'[]'],['stop',3]]],[{id:'e',error:'invalid_args'}]],
      [[[['start',2,'a','x'],['delta',2,'{'],['stop',2]]],[{id:'a',error:'invalid_args'}]],[[[]],[]]]),

  problem('agent-dag-waves', '按依赖调度并行工具', '任务调度', '中等',
    '为有依赖关系的一组工具产生可复现的并行执行轮次。',
    'tasks 将互异的任务名映射到前置任务名列表，列表内互异且都在 tasks 中。workers 是正整数。每轮在轮初选出前置任务全已完成的候选项，按名字升序取至多 workers 个，同时运行并在轮末完成。返回 {"waves":各轮任务名列表,"blocked":最后尚未执行的任务名升序列表}。输入可以有环，环和依赖该环的后继均可能留在 blocked。',
    'tasks, workers', `    import heapq
    remaining = {task: len(deps) for task, deps in tasks.items()}
    children = {task: [] for task in tasks}
    for task, deps in tasks.items():
        for dep in deps:
            children[dep].append(task)
    ready = [task for task in tasks if remaining[task] == 0]
    heapq.heapify(ready)
    waves = []
    while ready:
        current = [heapq.heappop(ready) for _ in range(min(workers, len(ready)))]
        waves.append(current)
        for task in current:
            for child in children[task]:
                remaining[child] -= 1
                if remaining[child] == 0:
                    heapq.heappush(ready, child)
    return {"waves": waves, "blocked": sorted(t for t in tasks if remaining[t] > 0)}`,
    '拓扑排序的就绪集合使用小顶堆。先取出完整一轮再释放后继，所有同轮任务观察相同的已完成集合。V 个任务、E 个依赖的时间 O(E+V log(V+1))。',
    'graph', ['同轮完成的节点在下一轮才释放后继。','体现工作线程数及相同条件下的稳定顺序。','区分环成员与受阻的下游任务。'],
    [[[{a:[],c:[],z:[],b:['a'],y:['b','c']},2],{waves:[['a','c'],['b','z'],['y']],blocked:[]}],
      [[{x:['y'],y:['x'],z:['x'],a:[]},3],{waves:[['a']],blocked:['x','y','z']}],
      [[{},2],{waves:[],blocked:[]}],[[{c:[],a:[],b:['a']},1],{waves:[['a'],['b'],['c']],blocked:[]}]]),

  problem('agent-branch-reducer', '合并并行分支的版本化结果', '状态合并', '中等',
    '让多个分支的完成顺序和重复投递都能得到相同的共享状态。',
    'patches 是 [key, revision, value] 列表，key 和 value 为字符串，revision 为非负整数。每个 key 只保留最大 revision 的所有互异 value。该版本若只有一个值，把它写入 values；若存在多个值，把升序值列表写入 conflicts。返回 {"values":对象,"conflicts":对象}。旧版本的冲突在新版本出现时消失。输入顺序任意，可重复投递。',
    'patches', `    latest = {}
    for key, revision, value in patches:
        if key not in latest or revision > latest[key][0]:
            latest[key] = (revision, {value})
        elif revision == latest[key][0]:
            latest[key][1].add(value)
    values, conflicts = {}, {}
    for key, (_, choices) in latest.items():
        if len(choices) == 1:
            values[key] = next(iter(choices))
        else:
            conflicts[key] = sorted(choices)
    return {"values": values, "conflicts": conflicts}`,
    '每个键的状态为最大版本和该版本的值集合。合并比较版本、同版取并集，因此重复投递、交换顺序、改变分组合并方式均得到相同结果。',
    'graph', ['解释交换律、结合律与幂等性在此处为何成立。','保留同一版本上真正冲突的值。','给出过期结果晚到的例子。'],
    [[[[['a',1,'old'],['a',3,'v'],['a',2,'late'],['b',1,'x'],['b',1,'y']] ],{values:{a:'v'},conflicts:{b:['x','y']}}],
      [[[['a',4,'same'],['a',4,'same']]],{values:{a:'same'},conflicts:{}}],
      [[[['z',1,'x'],['z',1,'y'],['z',2,'ok']]],{values:{z:'ok'},conflicts:{}}],
      [[[]],{values:{},conflicts:{}}]]),

  problem('agent-checkpoint-log', '从检查点恢复连续事件', '故障恢复', '中等',
    '恢复本地有序事件日志，保留序号缺口后的待处理事件。',
    'checkpoint 为 {"seq":已应用的最大连续序号,"counts":各键的整数计数}。records 是 [序号,key,整数增量] 列表，可能乱序或重复；同序号的内容相同。序号从 1 开始。仅应用从 checkpoint.seq+1 开始的连续记录，旧记录忽略，缺号之后先保留。初次出现的 key 初值为 0。返回 {"seq":新序号,"counts":新计数,"pending":尚未应用的互异序号升序列表}。本题只计算恢复后的状态。',
    'checkpoint, records', `    seq = checkpoint["seq"]
    counts = checkpoint["counts"].copy()
    pending = {n: (key, change) for n, key, change in records if n > seq}
    while seq + 1 in pending:
        seq += 1
        key, change = pending.pop(seq)
        counts[key] = counts.get(key, 0) + change
    return {"seq": seq, "counts": counts, "pending": sorted(pending)}`,
    '用已提交的连续序号区分已应用与待处理记录。字典按序号去重，顺次提交直至首个缺口。发送外部请求时还需在接收方按幂等键处理重复请求。',
    'persist', ['明确检查点保存的状态与序号。','区分重复记录、乱序到达及缺失记录。','说明有持久化副作用时如何关联操作与幂等键。'],
    [[[{seq:2,counts:{a:3}},[[4,'a',2],[3,'b',1],[3,'b',1],[1,'a',9],[6,'b',2]]],{seq:4,counts:{a:5,b:1},pending:[6]}],
      [[{seq:0,counts:{}},[[2,'x',3],[4,'y',-2],[2,'x',3]]],{seq:0,counts:{},pending:[2,4]}],
      [[{seq:1,counts:{x:4}},[]],{seq:1,counts:{x:4},pending:[]}],
      [[{seq:0,counts:{}},[[2,'x',-5],[1,'x',5]]],{seq:2,counts:{x:0},pending:[]}]]),

  problem('agent-retry-times', '模拟工具重试时间', '重试策略', '中等',
    '综合 HTTP 响应、服务器建议、指数退避和给定的抖动系数，求各次请求时间。',
    'responses 是非空的 [HTTP状态码, retry_after_ms或None] 列表，按尝试顺序使用。请求初始时刻为 0 毫秒，响应视为立即到达。只对 429、500、502、503、504 重试；其他码或响应列表末尾结束。第 i 次失败从 0 编号，退避上界为 min(cap_ms, base_ms×2^i)，乘以 jitters[i]（0 到 1）后向下取整。下一次等待 max(所得值, retry_after_ms或0)。返回每次实际尝试的绝对毫秒时刻。参数非负；jitters 足以覆盖重试，测试使用可精确表示的二进制小数。',
    'responses, base_ms, cap_ms, jitters', `    times = [0]
    ceiling = min(base_ms, cap_ms)
    for i, (code, hint) in enumerate(responses[:-1]):
        if code not in (429, 500, 502, 503, 504):
            break
        delay = max(int(ceiling * jitters[i]), hint or 0)
        times.append(times[-1] + delay)
        ceiling = min(cap_ms, 2 * ceiling)
    return times`,
    '将抖动作为显式输入可重现每次请求时刻。客户端退避上界逐次翻倍并截断，服务器给出的最早重试时间可以超过该上界。k 次尝试用 O(k) 时间。',
    'backoff', ['区分绝对时刻和等待间隔。','解释服务器提示如何与客户端策略合并。','独立测试永久错误、抖动为零和达到上界。'],
    [[[[[503,null],[429,180],[500,null],[200,null]],100,200,[0.5,0.5,1]],[0,50,230,430]],
      [[[[400,null],[200,null]],20,200,[1]],[0]],[[[[503,250],[200,null]],100,60,[1]],[0,250]],
      [[[[500,null],[500,null],[200,null]],7,9,[0,0.5]],[0,0,4]],[[[[200,null]],10,10,[]],[0]]]),

  problem('agent-context-turns', '保留完整工具对话的上下文裁剪', '上下文管理', '中等',
    '在给定 token 预算内保留系统指令和最近的完整对话轮次。',
    'messages 是按时间排列的 [id,role,tokens]，id 互异，tokens 为正整数；第一条 role 为 system，其余按 user 开始的完整轮次分组。一个轮次可含 assistant 发起的工具请求及若干 tool 回复，输入本身协议合法。始终同时保留 system 和最新一轮；若只有 system 则只需它。在预算 budget 内再保留尽可能多的连续近期轮次，整轮选取。必保内容超预算时返回 None；否则按原顺序返回保留的 id 列表。',
    'messages, budget', `    system = messages[0]
    remaining = budget - system[2]
    if remaining < 0:
        return None
    turns = []
    for message in messages[1:]:
        if message[1] == "user":
            turns.append([])
        turns[-1].append(message)
    start = len(turns)
    for i in range(len(turns)-1, -1, -1):
        cost = sum(message[2] for message in turns[i])
        if cost > remaining:
            if i == len(turns)-1:
                return None
            break
        remaining -= cost
        start = i
    return [system[0]] + [message[0] for turn in turns[start:] for message in turn]`,
    '以 user 消息划分轮次，从最新一轮向前扩展连续后缀。每条记录最多参与一次求和，时间与空间均为 O(n)。生产系统可用实际 tokenizer 或服务端计数补入消息开销。',
    'context', ['保留工具调用与其所有结果的关联。','说明必保部分超额时的返回值。','说明跳过中间轮次会改变对话语义。'],
    [[[[['s','system',2],['a','user',1],['b','assistant',2],['c','tool',2],['d','tool',1],['e','user',1],['f','assistant',2]],8],['s','e','f']],
      [[[['s','system',1],['a','user',2],['b','assistant',2]],5],['s','a','b']],
      [[[['s','system',1],['a','user',3]],3],null],[[[['s','system',4]],4],['s']],
      [[[['s','system',1],['a','user',1],['b','user',8],['c','user',1]],4],['s','c']]]),

  problem('agent-trace-stages', '评测支持并行的工具轨迹', '轨迹评测', '中等',
    '按有序阶段比较工具调用，允许同阶段并行任务交换完成顺序。',
    'stages 是若干列表，各阶段均非空；每个列表给出该阶段必需的工具调用名，可能重复。observed 是实际按时间记录的工具名。把 observed 按每阶段的要求数目切成连续分段，分别比较调用名多重集。返回 {"ok":布尔,"stage":首个失败阶段的零基编号或None,"missing":少的名字,"extra":多的名字}，差异列表保留重复并按字典序排序。所有阶段匹配后仍有观测，失败编号为阶段数，extra 放尾部剩余。stages 可为空。',
    'stages, observed', `    from collections import Counter
    cursor = 0
    for i, required in enumerate(stages):
        end = cursor + len(required)
        expected = Counter(required)
        actual = Counter(observed[cursor:end])
        if actual != expected:
            return {"ok": False, "stage": i, "missing": sorted((expected-actual).elements()),
                    "extra": sorted((actual-expected).elements())}
        cursor = end
    extra = sorted(observed[cursor:])
    return {"ok": not extra, "stage": len(stages) if extra else None,
            "missing": [], "extra": extra}`,
    '用阶段索引保存跨阶段的顺序，用频数表保留阶段内重复调用次数。按时间段定位第一处差异，可区分漏调、重复和阶段顺序错位。',
    'match', ['说明流程中的先后约束与可互换步骤。','重复调用按次数核对。','将轨迹是否符合协议与最终任务效果分别评估。'],
    [[[[['fetchA','fetchB'],['write']],['fetchB','fetchA','write']],{ok:true,stage:null,missing:[],extra:[]}],
      [[[['r','r'],['w']],['r','w','w']],{ok:false,stage:0,missing:['r'],extra:['w']}],
      [[[['a'],['b','c']],['a','c']],{ok:false,stage:1,missing:['b'],extra:[]}],
      [[[],['z','a']],{ok:false,stage:0,missing:[],extra:['a','z']}],[[[],[]],{ok:true,stage:null,missing:[],extra:[]}]]),
];

function lesson(id, title, summary, body, reading, problemIds, prompts) {
  return {
    id: 'learn-' + id, track, title, summary, body, resources: reading.map(([key, note]) => resource(key, note)),
    problemIds: problemIds.map(key => 'ai-' + key), prompts
  };
}

const tutorials = [
  lesson('agent-contracts', '工具调用与结构化输出', '把工具声明写成可测试的接口，再把模型给出的引用定位到原文。',
    `## 工具需要哪些输入

假设检索工具接受文档 ID 和可选的返回条数。写函数前，先列出字段名、类型、必填项和额外字段策略。工具描述供模型选取工具，字段校验供本地程序判断能否执行。若 Python 代码用 isinstance(x, int) 检查条数，True 也会通过；本题用具体类型区分这两种 JSON 输入。

## 从字段走到证据

模型要返回一段答案和若干引用。把处理分为三个步骤：解析 JSON、检查字段、定位引用。调用方拿到偏移量后，就能在原始文档里标出引用。引用定位回答“文本有没有出现”，回答内容与原文是否一致则需另外比较。

## 动手验证

在「校验工具调用的参数」中尝试下面两组输入。第二组的 doc 可以合法省略，limit 需要报告类型错误。

\`\`\`python
properties = {"doc": "string", "limit": "integer"}
assert solve(properties, ["doc"], {"doc": "A", "limit": 4}, False) == []
assert solve(properties, [], {"limit": True}, False) == ["limit:type"]
\`\`\`

切换到「验证结构化引用」。令文档 A 为“下周交付”，引用“交付”应得到字符区间 [2,4)。再把引文改为“今天交付”，文档仍然存在，但结果应指出第 0 条引用的证据错误。`,
    [['tools','从“工具是什么”读到函数签名的描述方式，给自己的检索工具写名称和参数说明。'],
      ['schema','阅读 Properties、Required Properties 和 Additional Properties，将三者分别对应到一个测试。'],
      ['output','阅读 Structured output、Output validators，区分类型解析与应用自己的规则。']],
    ['tool-argument-schema','grounded-output'],
    ['请给我三组看似合法、但会暴露 bool 与 int 混淆的输入，先让我预测结果。','如果 answer 引用了确实存在但语义无关的句子，应该增加怎样的评测？']),

  lesson('agent-stream', '流式工具调用的两层解析', '独立处理 SSE 帧和工具参数片段，复现分片截断及交错调用。',
    `## 一次读取会拿到什么

网络读取的边界由传输决定。一个分片可能停在冒号、换行甚至两个换行符的中间。这里从已经解码为字符串的分片开始。SSE 的一次事件以空行终止，可含一个 event 字段和多行 data；data 行顺序连接，中间插入换行。注释可用于心跳。

## 在哪一层解析 JSON

完成一个 SSE 事件后，事件数据可能说明“这是工具参数的一段文本”。例如两个 delta 分别给出字符串 '{"q":' 和 '"文档检索"}'。要先按工具块的 index 累积片段，等待 stop，再解析连接后的对象。不同调用的状态分别保存。一个损坏的调用可报告错误，其他块仍可独立完成。

## 动手验证

在 SSE 题里运行下面这组分片。第一条事件的分隔符被拆开，第二条到流末还缺少结束空行。

\`\`\`python
chunks = ["event: piece\\r", "\\ndata: hello\\r\\n\\r", "\\ndata: unfinished\\n"]
assert solve(chunks) == [["piece", "hello"]]
\`\`\`

然后在工具参数题中先启动 A，再启动 B，让 B 先结束。输出应先包含 B；即使 A 在此之前已有一半参数，它也要等自己的 stop。比较这两种状态机中“完成”的准确含义。`,
    [['events','阅读 Parsing an event stream 和 Interpreting an event stream，跟踪注释、data 字段和空行。'],
      ['streaming','阅读事件流程及 Input JSON delta 示例，对照 content_block_start、delta、stop 的 index。']],
    ['sse-frames','stream-tool-arguments'],
    ['把一条 SSE 文本在每个位置切开，怎样设计测试说明输出与切分位置无关？','如果中途断流，哪些块已经可以交给下游，哪些块需要保留或重新请求？']),

  lesson('agent-graph', '并行执行、依赖关系与状态合并', '从可并行的检索分支到共享结果，分别实现调度器和 reducer。',
    `## 哪些工具可以同时运行

给两组数据分别检索，再用一个汇总工具合并证据。可以把每次调用记作一个节点，将“汇总依赖两次检索”记作两条边。本专题的模拟器以轮为单位调度。每轮开始时从就绪节点取任务，轮末才减少下游节点的剩余依赖数；这让同轮的任务共享一致的输入状态。

\`\`\`python
tasks = {"web": [], "local": [], "join": ["web", "local"]}
assert solve(tasks, 2)["waves"] == [["local", "web"], ["join"]]
\`\`\`

把 workers 改成 1，前两项分别占用一轮。真实工具运行时间可以不同，面试时需要说清题目要求的是同步轮次，还是一有空闲 worker 就立即补任务。

## 两个分支写同一个键怎么办

设工具分别报告 ["doc",2,"A"]、["doc",2,"B"]，两次写入都处于版本 2。本题的 reducer（合并多个更新的函数）输出冲突值 ["A","B"]。之后版本 3 的值 "C" 到达，就只保留 "C"。当同一条更新被重复投递时，集合会自动去重。

## 验证

先把输入列表倒序，再重复添加其中一条记录，比较合并结果是否相同。调度题则增加互相依赖的两个节点，以及一个依赖它们的第三个节点；三个节点都应留在 blocked，独立任务照常进入执行轮次。`,
    [['workflows','阅读 Parallelization 和 Orchestrator-workers，分析哪个步骤决定分支数量、哪个步骤汇总。'],
      ['graph','阅读 Super-steps、Reducers 和 Nodes，分别找出轮次语义、状态更新和处理函数。']],
    ['agent-dag-waves','agent-branch-reducer'],
    ['给我一个 DAG 例子，让我推演新就绪任务在同一轮还是下一轮运行。','请从交换律、结合律和幂等性三个角度面试我设计的 reducer。']),

  lesson('agent-recovery', '断点恢复和重试', '用检查点及显式时间表复现乱序投递、超时和暂时性错误。',
    `## 崩溃发生之后，从哪个序号继续

检查点保存两样东西：已经连续应用到的最大序号，以及应用这些记录后的状态。假设保存到序号 3，恢复时收到 5、3、4、7。序号 3 已经反映在状态里；应用 4 和 5 后，序号 7 等待 6。把“收到的最大序号”与“已经连续提交的最大序号”分别记录，可以避免跨过日志缺口。

\`\`\`python
before = {"seq": 3, "counts": {"x": 10}}
log = [[5,"x",1], [3,"x",8], [4,"x",-2], [7,"x",5]]
assert solve(before, log) == {"seq":5, "counts":{"x":9}, "pending":[7]}
\`\`\`

如果本地记录的是外部工具执行结果，响应丢失时服务端可能已经完成操作。调用方可把同一次逻辑操作的标识随重试发送，由接收方持久保存该标识及结果。检查点处理本地状态，接收方的幂等处理负责外部副作用。

## 在哪一刻重试

初始请求在 0 毫秒返回 503。若第一次退避上界为 100 毫秒、抖动系数 0.5，则下一次在 50 毫秒。若服务端同时提示等待 200 毫秒，下一次在 200 毫秒。练习把随机数与时钟改成显式输入，所以可以逐项核对时间表。HTTP Retry-After 的实际格式支持日期或秒数，练习直接给出解析后的毫秒。

## 验证

恢复题增加两条内容相同的序号 4，最终状态应与只提交一次相同。重试题把 503 改成 400，观察返回的尝试列表。再把服务端等待时间调高到客户端退避上界之上，核对最终取值。`,
    [['persist','阅读 Threads 和 Checkpoints，比较线程标识、快照与单个步骤的输出。'],
      ['backoff','阅读 Retries、Backoff and jitter，推导固定退避与全抖动产生的请求时间。'],
      ['http','阅读 Retry-After 的两种取值格式，再将服务器的值转换为本地等待时长。']],
    ['agent-checkpoint-log','agent-retry-times'],
    ['如果工具已经写入数据库、但调用方没有收到响应，怎样安排幂等键和检查点？','帮我推演三次重试，包括服务器提示与客户端退避上界一大一小的两种情况。']),

  lesson('agent-context', '按完整轮次裁剪上下文', '在 token 预算内保留当前请求和相互关联的工具消息。',
    `## 哪些消息应当一起保留

一次用户请求可以产生多条消息：助手请求两个工具，两个工具按不同顺序返回，助手综合结果。若从任意一条消息截断，下一次模型调用可能收到缺少来源的工具结果。先按 user 起点划分轮次，能保留同一轮的调用和回复。系统指令独立计数，最新一轮整体保留，再从近到远追加连续旧轮次。

## 手算一个预算

系统指令占 2 个 token，两轮分别占 6 和 3，预算为 8。系统和最新一轮共用 5，剩下的 3 无法保留整段旧轮。若预算改成 11，则两轮都能保留。本练习的 token 数由调用方提供，实际应用还要计入消息封装和工具定义的开销。

\`\`\`python
messages = [["s","system",2],["u","user",2],["a","assistant",2],
            ["r","tool",2],["v","user",3]]
assert solve(messages, 8) == ["s","v"]
assert solve(messages, 11) == ["s","u","a","r","v"]
\`\`\`

## 验证并讨论权衡

把中间的旧轮扩展到 20 个 token，并在它前面增加仅 1 个 token 的旧轮。按连续后缀策略，这两个旧轮都会被移出。讨论替代方案时，可考虑把更早的关键信息整理成摘要，或保留指向原始工具结果的索引；同时说明谁验证摘要与原文一致。`,
    [['context','阅读关于工具、上下文检索及长时任务的部分，比较保留原始内容、摘要与按需检索的成本。'],
      ['memory','阅读 Trim messages 与 Delete messages，检查裁剪后工具消息是否仍满足模型提供方格式。'],
      ['toolResults','查阅 tool_use 与 tool_result 的配对方式，再画出一轮两个并行工具的消息序列。']],
    ['agent-context-turns'],
    ['给我五条包含并行工具调用的消息，让我判断哪些裁剪位置会破坏协议。','如果某次工具返回特别大，比较整轮移除、摘要、保留索引三种策略的测试方法。']),

  lesson('agent-evaluation', '从执行轨迹定位首个偏差', '把工具顺序、并行执行和最终结果转成可以单独检查的量。',
    `## 要评价运行过程中的什么

一次 Agent 运行可以包含模型生成、工具调用、工具结果和最终状态。要检查双源检索后才汇总，可将要求写成两阶段：第一阶段各执行一次 local 和 web，第二阶段执行一次 join。并行检索的相对完成顺序可变化，但把 join 提到第一阶段便改变了流程。

\`\`\`python
stages = [["local","web"],["join"]]
assert solve(stages, ["web","local","join"])["ok"]
result = solve(stages, ["web","join","local"])
assert result == {"ok":False, "stage":0, "missing":["local"], "extra":["join"]}
\`\`\`

## 怎样计算第一处偏差

每阶段按应有的调用个数截取一段观测，比较两份频数表。两份列表里都出现某个工具时，还要检查出现的次数。若所有规定阶段匹配，再检查是否有多余的尾部事件。这个评测对阶段边界已有定义的任务尤其合适。

## 如何解释结果

工具轨迹通过意味着该次运行满足指定的阶段和次数要求。对检索任务，还可以另行检查引文定位及答案内容。例如两个工具都成功调用，返回的证据仍可能不支持答案。反过来，一个系统若允许多种取证流程，可以只检查必要的调用或评估最终状态。对同一份离线轨迹，先尝试严格顺序，再允许阶段内互换，观察哪些样例改变结论。`,
    [['match','阅读 Strict match、Unordered match 与 Tool args match modes，设计一个工具相同而参数有误的反例。'],
      ['evals','阅读 The structure of an evaluation，对照轨迹、判分器与环境最终状态各能说明什么。'],
      ['react','阅读作者的示例轨迹，标出行动与环境观察的边界。'],
      ['traces','阅读 Spans 与 Span Context，思考如何把一次调用 ID、起止时间和父节点加入记录。']],
    ['agent-trace-stages','grounded-output'],
    ['如果两个正确实现使用不同工具顺序，哪些条件适合用偏序检查，哪些适合只看结果？','设计一个最终答案正确但工具轨迹违背流程的反例，再设计相反情况。']),
];

module.exports = { problems, tutorials };
