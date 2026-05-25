import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Badge, Button, Card, Hairline, Icons, SectionHeader, StatusDot } from "../components/ui";
import { ChatInput } from "../features/chat/ChatInput";
import { MessageList } from "../features/chat/MessageList";
import { useChatStore } from "../features/chat/chatStore";
import { pdfjsLib } from "../lib/pdfjs";
import {
    type MemoryFile,
    type MasterFixSkill,
    type MasterFixTool,
    type MasterFixWorkOrder,
    type MasterFixEquipment,
    type MemorySource,
    masterfixApi,
} from "../services/masterfix";

type SectionId = "overview" | "work-orders" | "skills" | "tools" | "memory" | "equipment";

const workOrders: MasterFixWorkOrder[] = [
    {
        id: "WO-2407",
        title: "灌装机驱动电机异响",
        equipment: "Bottle Filler / M-204",
        owner: "张工",
        status: "待复核",
        priority: "高",
        skill: "电机异响 + 温升初诊",
    },
    {
        id: "WO-2408",
        title: "源泵出口压力波动",
        equipment: "Source Pump / P-101",
        owner: "李工",
        status: "诊断中",
        priority: "中",
        skill: "离心泵压力波动排查",
    },
    {
        id: "WO-2409",
        title: "旋盖机扭矩间歇升高",
        equipment: "Bottle Capper / C-303",
        owner: "未分配",
        status: "待派工",
        priority: "中",
        skill: "传动扭矩异常排查",
    },
];

const skills: MasterFixSkill[] = [
    {
        name: "电机异响 + 温升初诊",
        version: "v1.4",
        status: "启用",
        hits: 42,
        trigger: "电机 / 异响 / 温升 / 振动",
        tools: "音频去噪 -> 频谱分析 -> 图片巡检 -> 手册检索 -> 历史工单",
    },
    {
        name: "离心泵压力波动排查",
        version: "v0.9",
        status: "待审核",
        hits: 18,
        trigger: "泵 / 压力波动 / 流量下降",
        tools: "趋势核验 -> 手册检索 -> 相似案例 -> 阀门状态检查",
    },
    {
        name: "传动扭矩异常排查",
        version: "v1.1",
        status: "启用",
        hits: 27,
        trigger: "旋盖 / 扭矩升高 / 卡滞",
        tools: "信号趋势 -> 图片巡检 -> 备件查询 -> 安全规程",
    },
];

const tools: MasterFixTool[] = [
    {
        name: "audio_spectrum_analyzer",
        type: "音频工具",
        status: "启用",
        success: "96%",
        latency: "1.8s",
        owner: "Tool Runtime",
    },
    {
        name: "manual_rag_search",
        type: "手册检索",
        status: "启用",
        success: "99%",
        latency: "0.4s",
        owner: "Knowledge",
    },
    {
        name: "failure_case_search",
        type: "历史工单检索",
        status: "启用",
        success: "98%",
        latency: "0.6s",
        owner: "Memory",
    },
    {
        name: "visual_inspection_mock",
        type: "视觉巡检",
        status: "演示",
        success: "100%",
        latency: "0.2s",
        owner: "Demo",
    },
];

const memorySources: MemorySource[] = [
    { name: "设备手册", count: "18 份", status: "已索引", detail: "PDF、IOM、点检规范" },
    { name: "历史工单", count: "1,284 条", status: "已同步", detail: "维修结果、备件、停机时长" },
    { name: "老师傅经验", count: "76 条", status: "待审核 5 条", detail: "排查备注、现场判断规则" },
    { name: "设备档案", count: "46 台", status: "已接入", detail: "型号、安装日期、关键部件" },
];

const equipmentItems: MasterFixEquipment[] = [
    {
        id: "EQ-204",
        name: "Bottle Filler / M-204",
        equipment_type: "灌装机驱动电机",
        location: "一号产线 / 灌装段",
        owner: "张工",
        criticality: "高",
        status: "运行中",
        linked_skills: 3,
    },
    {
        id: "EQ-101",
        name: "Source Pump / P-101",
        equipment_type: "离心泵",
        location: "一号产线 / 供液段",
        owner: "李工",
        criticality: "中",
        status: "观察中",
        linked_skills: 2,
    },
    {
        id: "EQ-303",
        name: "Bottle Capper / C-303",
        equipment_type: "旋盖机",
        location: "一号产线 / 封装段",
        owner: "王工",
        criticality: "中",
        status: "运行中",
        linked_skills: 2,
    },
];

export default function MasterFixPage() {
    const active = useMasterFixSection();

    return (
        <section className="flex h-full flex-col overflow-hidden">
            <div className="flex flex-none flex-col gap-5 p-6 pb-4">
                <SectionHeader
                    label="MasterFix 管理端"
                    size="lg"
                    meta="工单、Skill、Tool 与维修知识的统一治理后台"
                />
                <Hairline />
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">
                <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
                    {active === "overview" && <OverviewSection />}
                    {active === "work-orders" && <WorkOrdersSection />}
                    {active === "skills" && <SkillsSection />}
                    {active === "tools" && <ToolsSection />}
                    {active === "memory" && <MemorySection />}
                    {active === "equipment" && <EquipmentSection />}
                </div>
            </div>
        </section>
    );
}

function useMasterFixSection(): SectionId {
    const { pathname } = useLocation();
    if (pathname.startsWith("/masterfix/work-orders")) return "work-orders";
    if (pathname.startsWith("/masterfix/skills")) return "skills";
    if (pathname.startsWith("/masterfix/tools")) return "tools";
    if (pathname.startsWith("/masterfix/memory")) return "memory";
    if (pathname.startsWith("/masterfix/equipment")) return "equipment";
    return "overview";
}

function OverviewSection() {
    return <AgentTaskChatCard />;
}

function AgentTaskChatCard() {
    const messages = useChatStore((s) => s.messages);
    const status = useChatStore((s) => s.status);
    const connect = useChatStore((s) => s.connect);
    const sendMessage = useChatStore((s) => s.sendMessage);
    const newSession = useChatStore((s) => s.newSession);
    const [equipmentId, setEquipmentId] = useState(equipmentItems[0].id);
    const [files, setFiles] = useState<File[]>([]);

    const selectedEquipment = equipmentItems.find((e) => e.id === equipmentId) ?? equipmentItems[0];

    useEffect(() => {
        connect();
    }, [connect]);

    function submitToAgent(content: string) {
        const fileContext = files.length
            ? files
                  .map((file) => `- ${file.name} (${file.type || "unknown"}, ${formatFileSize(file.size)})`)
                  .join("\n")
            : "- 无附件";
        sendMessage(
            [
                "MasterFix 多模态诊断任务",
                `设备：${selectedEquipment.name} (${selectedEquipment.id})`,
                `类型：${selectedEquipment.equipment_type}`,
                `位置：${selectedEquipment.location}`,
                "现场输入：",
                content,
                "附件清单：",
                fileContext,
                "请作为维修 Agent 自主判断下一步：需要时调用可用工具、检索知识库、推进诊断并给出任务执行结果。",
            ].join("\n"),
        );
        setFiles([]);
    }

    return (
        <Card padding="lg" className="min-h-[640px] overflow-hidden">
            <div className="grid h-full min-h-[600px] gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
                <div className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4">
                    <PanelTitle label="Agent 对话" title="多模态任务执行" />
                    <p className="text-sm leading-6 text-muted-foreground">
                        在这里输入现场描述、图片、音频、视频或传感器文件信息，实际通过现有 Agent Chat 通道交给 ARIA 执行诊断、工具调用和任务推进。
                    </p>

                    {/* 设备选择下拉 */}
                    <div className="grid gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">关联设备</span>
                        <select
                            value={equipmentId}
                            onChange={(e) => setEquipmentId(e.target.value)}
                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {equipmentItems.map((eq) => (
                                <option key={eq.id} value={eq.id}>
                                    {eq.name}
                                </option>
                            ))}
                        </select>
                        {/* 选中设备信息预览 */}
                        <div className="rounded-md border border-border bg-muted px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-[11px] text-text-tertiary">{selectedEquipment.id}</span>
                                <Badge variant={selectedEquipment.criticality === "高" ? "warning" : "default"}>
                                    {selectedEquipment.criticality}关键度
                                </Badge>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                                {selectedEquipment.equipment_type} · {selectedEquipment.location}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <StatusDot status={selectedEquipment.status === "运行中" ? "nominal" : "warning"} />
                                {selectedEquipment.status} · 负责人：{selectedEquipment.owner}
                            </div>
                        </div>
                    </div>

                    <FilePicker
                        label="多模态附件"
                        accept="image/*,audio/*,video/*,application/pdf,.csv,.xlsx,.xls,.json,.txt,.md"
                        value={files}
                        onChange={setFiles}
                        multiple
                        hint="支持图片、声音、视频、PDF、表格、JSON、日志文本。浏览器端仅提交文件元信息，真实内容接入后端文件上传后可直接传给 Agent。"
                    />
                    <div className="mt-auto rounded-lg border border-border bg-muted p-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                            <StatusDot status={status === "open" ? "nominal" : status === "error" ? "critical" : "warning"} />
                            {status === "open" ? "Agent 已连接" : status === "error" ? "Agent 连接异常" : "正在连接 Agent"}
                        </div>
                        <div className="mt-2 text-xs leading-5 text-muted-foreground">
                            对话会触发后端 `/api/v1/agent/chat`，由 Agent 自己决定是否交给 Investigator、KB、工单等子流程。
                        </div>
                        <Button type="button" size="sm" variant="ghost" className="mt-3" onClick={newSession}>
                            <Icons.RefreshCw className="size-4" aria-hidden />
                            新任务会话
                        </Button>
                    </div>
                </div>
                <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
                    <div className="flex flex-none items-center justify-between gap-3 border-b border-border px-4 py-3">
                        <div>
                            <div className="text-sm font-medium text-foreground">任务对话流</div>
                            <div className="mt-1 text-xs text-muted-foreground">输入后 Agent 会返回执行过程、工具调用和结果</div>
                        </div>
                        <Badge variant="accent">Live Agent</Badge>
                    </div>
                    <MessageList messages={messages} />
                    <div className="flex-none border-t border-border p-4">
                        <ChatInput
                            onSubmit={submitToAgent}
                            disabled={status === "error"}
                            placeholder="描述故障现象，或要求 Agent 读取附件并执行诊断任务..."
                        />
                    </div>
                </div>
            </div>
        </Card>
    );
}

function WorkOrdersSection() {
    const [items, setItems] = useState(workOrders);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<MasterFixWorkOrder | null>(null);
    const [title, setTitle] = useState("");
    const [equipment, setEquipment] = useState("");
    const [owner, setOwner] = useState("");
    const [priority, setPriority] = useState("中");
    const [skill, setSkill] = useState("电机异响 + 温升初诊");

    useEffect(() => {
        masterfixApi
            .listWorkOrders()
            .then(setItems)
            .catch(() => undefined);
    }, []);

    async function submit(e: FormEvent) {
        e.preventDefault();
        const body = {
            title: title || "未命名工单",
            equipment: equipment || "未选择设备",
            owner: owner || "未分配",
            priority,
            skill,
        };
        try {
            const created = await masterfixApi.createWorkOrder(body);
            setItems([created, ...items]);
        } catch {
            setItems([{ id: `WO-local-${items.length + 1}`, status: "待派工", ...body }, ...items]);
        }
        setOpen(false);
        setTitle("");
        setEquipment("");
        setOwner("");
    }

    async function removeOrder(id: string) {
        setItems((current) => current.filter((item) => item.id !== id));
        setSelected((current) => (current?.id === id ? null : current));
        try {
            await masterfixApi.deleteWorkOrder(id);
        } catch {
            // Optimistic delete keeps the demo responsive.
        }
    }

    return (
        <div className="grid gap-5">
            <Card padding="lg">
                <PanelTitle
                    label="工单管理"
                    title="诊断、派工、复核统一追踪"
                    action="新建工单"
                    onAction={() => setOpen(true)}
                />
                <div className="mt-4 grid gap-3">
                    {items.map((order) => (
                        <WorkOrderManagementCard
                            key={order.id}
                            order={order}
                            onOpen={() => setSelected(order)}
                            onDelete={() => removeOrder(order.id)}
                        />
                    ))}
                </div>
            </Card>

            {open && (
                <Modal title="新建工单" onClose={() => setOpen(false)}>
                    <form onSubmit={submit} className="grid gap-4">
                        <FormField label="问题标题" value={title} onChange={setTitle} />
                        <FormField
                            label="设备"
                            value={equipment}
                            onChange={setEquipment}
                            placeholder="例如 Source Pump / P-101"
                        />
                        <FormField label="负责人" value={owner} onChange={setOwner} />
                        <SelectField
                            label="优先级"
                            value={priority}
                            onChange={setPriority}
                            options={["高", "中", "低"]}
                        />
                        <FormField label="关联 Skill" value={skill} onChange={setSkill} />
                        <ModalActions onCancel={() => setOpen(false)} submitLabel="创建工单" />
                    </form>
                </Modal>
            )}
            {selected && (
                <Modal title="工单详情" onClose={() => setSelected(null)} wide>
                    <div className="grid gap-4">
                        {/* 标题区 */}
                        <div className="rounded-lg border border-border bg-muted p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="code">{selected.id}</Badge>
                                        <Badge variant={selected.priority === "高" ? "warning" : "default"}>
                                            {selected.priority}优先级
                                        </Badge>
                                    </div>
                                    <div className="mt-3 break-words text-lg font-medium text-foreground">
                                        {selected.title}
                                    </div>
                                    <div className="mt-1 text-xs leading-5 text-muted-foreground">
                                        {selected.equipment}
                                    </div>
                                </div>
                                <Badge variant={selected.status === "待复核" ? "warning" : "accent"}>
                                    {selected.status}
                                </Badge>
                            </div>
                        </div>

                        {/* 基本信息 */}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <InfoBlock label="关联设备" value={selected.equipment} />
                            <InfoBlock label="负责人" value={selected.owner || "未分配"} />
                            <InfoBlock label="关联 Skill" value={selected.skill} />
                            <InfoBlock label="当前状态" value={selected.status} />
                        </div>

                        {/* 诊断进展 */}
                        <div className="rounded-lg border border-border bg-background p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">诊断进展</div>
                            <div className="mt-3 grid gap-2">
                                {workOrderDiagnosisSteps(selected).map((step) => (
                                    <div key={step.label} className="flex items-start gap-3 rounded-md bg-muted p-2">
                                        <StatusDot status={step.done ? "nominal" : step.active ? "warning" : "unknown"} />
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-medium text-foreground">{step.label}</div>
                                            <div className="mt-0.5 text-xs leading-5 text-muted-foreground">{step.detail}</div>
                                        </div>
                                        <Badge variant={step.done ? "nominal" : step.active ? "warning" : "default"}>
                                            {step.done ? "完成" : step.active ? "进行中" : "待执行"}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 证据摘要 */}
                        <div className="rounded-lg border border-border bg-background p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">证据摘要</div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {workOrderEvidenceItems(selected).map((ev) => (
                                    <div key={ev.source} className="rounded-md border border-border bg-muted p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-medium text-foreground">{ev.source}</span>
                                            <Badge variant="code">{ev.confidence}</Badge>
                                        </div>
                                        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{ev.finding}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 根因分析 */}
                        <div className="rounded-lg border border-border bg-background p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">根因分析 Top 3</div>
                            <div className="mt-3 grid gap-2">
                                {workOrderRootCauses(selected).map((rc, i) => (
                                    <div key={rc.cause} className="flex items-center gap-3 rounded-md bg-muted px-3 py-2">
                                        <span className="flex size-6 flex-none items-center justify-center rounded bg-background font-mono text-[11px] text-muted-foreground">{i + 1}</span>
                                        <div className="min-w-0 flex-1 text-xs leading-5 text-foreground">{rc.cause}</div>
                                        <span className="font-mono text-xs text-muted-foreground">{rc.prob}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 建议动作 */}
                        <div className="rounded-lg border border-border bg-background p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">建议动作</div>
                            <div className="mt-3 grid gap-2">
                                {workOrderActions(selected).map((act, i) => (
                                    <div key={act} className="flex items-start gap-2 text-xs leading-6 text-muted-foreground">
                                        <span className="mt-0.5 flex size-4 flex-none items-center justify-center rounded-full bg-muted font-mono text-[10px] text-foreground">{i + 1}</span>
                                        {act}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-border pt-4">
                            <Button type="button" variant="ghost" onClick={() => setSelected(null)}>
                                关闭
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

function workOrderDiagnosisSteps(order: MasterFixWorkOrder) {
    const base = [
        { label: "多模态输入收集", detail: "录入设备编号、现场描述、声音文件和图片附件。", done: true, active: false },
        { label: "Skill 匹配", detail: `命中「${order.skill}」，按老师傅排查顺序规划工具链。`, done: true, active: false },
        { label: "Agent 工具调用", detail: "依次执行音频去噪、频谱分析、手册检索、历史案例匹配。", done: order.status !== "待派工", active: order.status === "诊断中" },
        { label: "证据融合与根因分析", detail: "汇总多源证据，输出根因 Top 3 及置信度排序。", done: order.status === "待复核" || order.status === "已完成", active: false },
        { label: "复核与派工", detail: "管理员或老师傅确认后生成正式工单并分配维修资源。", done: order.status === "已完成", active: order.status === "待复核" },
    ];
    return base;
}

function workOrderEvidenceItems(order: MasterFixWorkOrder) {
    if (order.id === "WO-2407") return [
        { source: "声音证据", finding: "去噪后出现稳定高频冲击峰（800–1200 Hz），符合润滑不足或轴承早期磨损特征。", confidence: "0.84" },
        { source: "视觉证据", finding: "轴承侧端盖附近有轻微油迹，热点集中在同一区域，红外温升约 +12°C。", confidence: "0.71" },
        { source: "手册证据", finding: "手册 §7.2：异响伴随温升时优先检查润滑状态、轴承游隙和联轴器同心度。", confidence: "0.89" },
        { source: "历史证据", finding: "近三个月同型驱动电机有 3 起相似案例，其中 2 起确认为润滑不足，1 起为轴承内圈磨损。", confidence: "0.78" },
    ];
    if (order.equipment.includes("Pump")) return [
        { source: "压力趋势", finding: "出口压力 6 小时内波动幅度达额定值 ±18%，超出正常范围 ±5%。", confidence: "0.81" },
        { source: "流量对比", finding: "同工况流量下降约 12%，与入口滤网堵塞或叶轮磨损特征吻合。", confidence: "0.74" },
        { source: "历史证据", finding: "近半年同型离心泵有 2 起压力波动工单，均确认为入口阀调节不当。", confidence: "0.69" },
        { source: "手册证据", finding: "手册建议：压力波动超 ±10% 时先检查入口阀开度、滤网差压和密封泄漏。", confidence: "0.85" },
    ];
    return [
        { source: "扭矩趋势", finding: "扭矩峰值在每班约出现 3–5 次异常升高，持续约 0.8 s，与传动卡滞特征一致。", confidence: "0.77" },
        { source: "视觉证据", finding: "旋盖头导槽处有轻微磨粉积聚，调整螺栓有松动迹象。", confidence: "0.65" },
        { source: "历史证据", finding: "上季度同机型有 1 起扭矩异常工单，确认为导槽磨损需更换。", confidence: "0.72" },
        { source: "手册证据", finding: "手册 §4.3：扭矩间歇升高应优先检查导槽润滑、夹紧力矩和凸轮磨损量。", confidence: "0.83" },
    ];
}

function workOrderRootCauses(order: MasterFixWorkOrder) {
    if (order.id === "WO-2407") return [
        { cause: "轴承润滑不足 — 油脂老化或补脂周期超期", prob: "68%" },
        { cause: "轴承内圈早期磨损 — 与润滑不足互为因果", prob: "21%" },
        { cause: "联轴器对中偏差 — 引起附加径向载荷", prob: "11%" },
    ];
    if (order.equipment.includes("Pump")) return [
        { cause: "入口阀开度不足或调节偏差", prob: "52%" },
        { cause: "入口滤网局部堵塞", prob: "31%" },
        { cause: "叶轮轻微磨损导致效率下降", prob: "17%" },
    ];
    return [
        { cause: "旋盖头导槽润滑不足导致摩擦力增大", prob: "55%" },
        { cause: "导槽磨损超差需更换", prob: "28%" },
        { cause: "夹紧力矩设定偏高", prob: "17%" },
    ];
}

function workOrderActions(order: MasterFixWorkOrder) {
    if (order.priority === "高") return [
        "申请 30 分钟计划停机窗口，完成安全隔离和能量锁定（LOTO）。",
        "先补脂并复测 15 分钟振动频谱，若高频冲击峰消失则确认润滑不足并记录。",
        "若补脂后异响仍存，安排拆检轴承，检查内圈磨损量和游隙是否超差。",
        "同步检查联轴器对中，径向偏差超 0.05 mm 需重新找正。",
        "完成后录入维修结果，触发 Skill 经验更新流程。",
    ];
    if (order.status === "诊断中") return [
        "继续采集压力/流量趋势至少 2 小时，确认波动规律。",
        "检查入口阀开度与设计值的偏差，记录当前开度百分比。",
        "检查入口滤网差压，差压超 0.05 MPa 需清洗或更换。",
        "完成诊断后提交 Agent 复核，进入派工流程。",
    ];
    return [
        "补齐负责人分配，确认停机时间窗口。",
        "检查并润滑旋盖头导槽，按手册力矩规范重新紧固调整螺栓。",
        "测量导槽磨损量，超差（＞0.3 mm）须更换备件。",
        "复测一个完整班次的扭矩曲线，确认恢复正常后关闭工单。",
    ];
}

function SkillsSection() {
    const [items, setItems] = useState(skills);
    const [availableTools, setAvailableTools] = useState(tools);
    const [availableMemory, setAvailableMemory] = useState(memorySources);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<MasterFixSkill | null>(null);
    const [name, setName] = useState("");
    const [trigger, setTrigger] = useState("");
    const [selectedTools, setSelectedTools] = useState<string[]>([
        "audio_spectrum_analyzer",
        "manual_rag_search",
        "failure_case_search",
    ]);
    const [selectedMemory, setSelectedMemory] = useState<string[]>(["设备手册", "历史工单"]);

    useEffect(() => {
        masterfixApi
            .listSkills()
            .then(setItems)
            .catch(() => undefined);
        masterfixApi
            .listTools()
            .then(setAvailableTools)
            .catch(() => undefined);
        masterfixApi
            .listMemory()
            .then(setAvailableMemory)
            .catch(() => undefined);
    }, []);

    async function submit(e: FormEvent) {
        e.preventDefault();
        const toolChain = selectedTools.length > 0 ? selectedTools.join(" -> ") : "未配置工具链";
        const memoryText =
            selectedMemory.length > 0 ? `；可用 Memory：${selectedMemory.join("、")}` : "";
        const body = {
            name: name || "未命名 Skill",
            trigger: trigger || "未配置触发条件",
            tools: `${toolChain}${memoryText}`,
        };
        try {
            const created = await masterfixApi.createSkill(body);
            setItems([created, ...items]);
        } catch {
            setItems([{ version: "v0.1", status: "待审核", hits: 0, ...body }, ...items]);
        }
        setOpen(false);
        setName("");
        setTrigger("");
        setSelectedTools(["audio_spectrum_analyzer", "manual_rag_search", "failure_case_search"]);
        setSelectedMemory(["设备手册", "历史工单"]);
    }

    function toggleTool(name: string) {
        setSelectedTools((current) =>
            current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
        );
    }

    function toggleMemory(name: string) {
        setSelectedMemory((current) =>
            current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
        );
    }

    async function removeSkill(name: string) {
        setItems((current) => current.filter((item) => item.name !== name));
        setSelected((current) => (current?.name === name ? null : current));
        try {
            await masterfixApi.deleteSkill(name);
        } catch {
            // Optimistic delete keeps the demo responsive.
        }
    }

    return (
        <div className="grid gap-5">
            <Card padding="lg">
                <PanelTitle
                    label="Skill 管理"
                    title="老师傅排查流程配置"
                    action="新增 Skill"
                    onAction={() => setOpen(true)}
                />
                <div className="mt-4 grid gap-3">
                    {items.map((skill) => (
                        <Card
                            key={skill.name}
                            padding="md"
                            className="cursor-pointer bg-background transition-colors hover:border-primary/50 hover:bg-accent/40"
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelected(skill)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setSelected(skill);
                                }
                            }}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="break-words text-sm font-medium text-foreground">
                                        {skill.name}
                                    </div>
                                    <div className="mt-1 text-xs leading-5 text-muted-foreground">
                                        触发：{skill.trigger}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="code">{skill.version}</Badge>
                                    <Badge variant={skill.status === "启用" ? "nominal" : "warning"}>
                                        {skill.status}
                                    </Badge>
                                </div>
                            </div>
                            <div className="mt-3 rounded-lg border border-border bg-muted p-3 text-xs leading-5 text-muted-foreground">
                                工具链：{skill.tools}
                            </div>
                            <div className="mt-3 text-xs text-text-tertiary">
                                近 30 天命中 {skill.hits} 次
                            </div>
                            <div className="mt-3 flex justify-end gap-2">
                                <Button type="button" size="sm" variant="secondary">
                                    <Icons.Eye className="size-4" aria-hidden />
                                    查看详情
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeSkill(skill.name);
                                    }}
                                >
                                    <Icons.X className="size-4" aria-hidden />
                                    删除
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </Card>
            {open && (
                <Modal title="新增 Skill" onClose={() => setOpen(false)}>
                    <form onSubmit={submit} className="grid gap-4">
                        <FormField label="Skill 名称" value={name} onChange={setName} />
                        <FormField
                            label="触发条件"
                            value={trigger}
                            onChange={setTrigger}
                            placeholder="例如 电机 / 异响 / 温升 / 振动"
                            multiline
                        />
                        <FlowSelector
                            label="推荐工具流程"
                            items={availableTools.map((tool) => ({
                                id: tool.name,
                                title: tool.name,
                                detail: `${tool.type} · ${tool.status}`,
                            }))}
                            selected={selectedTools}
                            onToggle={toggleTool}
                            emptyText="暂无可用 Tool，请先到 Tool 管理注册。"
                        />
                        <FlowSelector
                            label="可选 Memory 来源"
                            items={availableMemory.map((memory) => ({
                                id: memory.name,
                                title: memory.name,
                                detail: `${memory.count} · ${memory.status}`,
                            }))}
                            selected={selectedMemory}
                            onToggle={toggleMemory}
                            emptyText="暂无可用 Memory，请先到 Memory 管理上传。"
                        />
                        <ModalActions onCancel={() => setOpen(false)} submitLabel="保存 Skill" />
                    </form>
                </Modal>
            )}
            {selected && (
                <Modal title="Skill 详情" onClose={() => setSelected(null)} wide>
                    <div className="grid gap-4">
                        {/* 标题区 */}
                        <div className="rounded-lg border border-border bg-muted p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="break-words text-lg font-medium text-foreground">{selected.name}</div>
                                    <div className="mt-1 text-xs leading-5 text-muted-foreground">近 30 天命中 {selected.hits} 次</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="code">{selected.version}</Badge>
                                    <Badge variant={selected.status === "启用" ? "nominal" : "warning"}>{selected.status}</Badge>
                                </div>
                            </div>
                        </div>

                        {/* 触发条件 */}
                        <InfoBlock label="触发条件" value={selected.trigger} />

                        {/* 推荐工具链 */}
                        <div className="rounded-lg border border-border bg-background p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">推荐工具链</div>
                            <div className="mt-3 grid gap-2">
                                {selected.tools.split(" -> ").map((toolName, i, arr) => (
                                    <div key={toolName} className="flex items-center gap-2">
                                        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-muted px-3 py-2">
                                            <span className="flex size-5 flex-none items-center justify-center rounded bg-background font-mono text-[10px] text-muted-foreground">{i + 1}</span>
                                            <span className="break-words font-mono text-xs text-foreground">{toolName.trim()}</span>
                                        </div>
                                        {i < arr.length - 1 && <Icons.ArrowRight className="size-3 flex-none text-text-tertiary" aria-hidden />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 可引用 Memory */}
                        <div className="rounded-lg border border-border bg-background p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">可引用 Memory</div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {skillMemoryRefs(selected).map((m) => (
                                    <Badge key={m} variant="accent">{m}</Badge>
                                ))}
                            </div>
                        </div>

                        {/* 判断规则 */}
                        <div className="rounded-lg border border-border bg-background p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">判断规则</div>
                            <div className="mt-3 grid gap-2">
                                {skillJudgmentRules(selected).map((rule) => (
                                    <div key={rule} className="rounded-md bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">{rule}</div>
                                ))}
                            </div>
                        </div>

                        {/* 退出条件 & 版本说明 */}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <InfoBlock label="退出条件" value="证据不足时不强行结论；要求补充音频、图片或趋势数据；高风险维修必须升级老师傅复核。" />
                            <InfoBlock label="版本说明" value={skillVersionNote(selected)} />
                        </div>

                        <div className="flex justify-end border-t border-border pt-4">
                            <Button type="button" variant="ghost" onClick={() => setSelected(null)}>关闭</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

function skillMemoryRefs(skill: MasterFixSkill) {
    if (skill.name.includes("电机")) return ["设备手册", "历史工单", "老师傅经验"];
    if (skill.name.includes("泵")) return ["设备手册", "历史工单", "趋势数据"];
    return ["设备手册", "历史工单"];
}

function skillJudgmentRules(skill: MasterFixSkill) {
    if (skill.name.includes("电机")) return [
        "高频冲击（800–1200 Hz）+ 温升 > 10°C：润滑不足权重 +30%",
        "同设备相似案例 ≥ 2 条：历史原因权重 +20%",
        "视觉发现油迹 + 热点同区域：轴承磨损权重 +15%",
        "联轴器对中偏差 > 0.05 mm：联轴器方向置信度 +10%",
    ];
    if (skill.name.includes("泵")) return [
        "压力波动 > ±10% 且流量下降 > 8%：入口侧问题权重 +35%",
        "入口差压趋势持续上升：滤网堵塞权重 +25%",
        "效率曲线偏移 > 5%：叶轮磨损权重 +20%",
    ];
    return [
        "扭矩峰值 > 额定值 120% 且持续 < 1 s：卡滞类问题权重 +40%",
        "目视发现磨粉积聚：导槽磨损权重 +30%",
        "调整螺栓松动：力矩设定问题权重 +20%",
    ];
}

function skillVersionNote(skill: MasterFixSkill) {
    if (skill.status === "待审核") return `${skill.version} 为待审核草稿，由设备工程师确认后发布；上线前不影响现有工单诊断。`;
    return `${skill.version} 为当前生效版本，已通过工程师审核；如需修改请提交草稿并走审核流程。`;
}

function ToolsSection() {
    const [items, setItems] = useState(tools);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<MasterFixTool | null>(null);
    const [name, setName] = useState("");
    const [type, setType] = useState("手册检索");
    const [owner, setOwner] = useState("Tool Runtime");

    useEffect(() => {
        masterfixApi
            .listTools()
            .then(setItems)
            .catch(() => undefined);
    }, []);

    async function submit(e: FormEvent) {
        e.preventDefault();
        const body = { name: name || "new_tool", type, owner };
        try {
            const created = await masterfixApi.createTool(body);
            setItems([created, ...items]);
        } catch {
            setItems([{ status: "演示", success: "100%", latency: "0.1s", ...body }, ...items]);
        }
        setOpen(false);
        setName("");
    }

    async function removeTool(name: string) {
        setItems((current) => current.filter((item) => item.name !== name));
        setSelected((current) => (current?.name === name ? null : current));
        try {
            await masterfixApi.deleteTool(name);
        } catch {
            // Optimistic delete keeps the demo responsive.
        }
    }

    return (
        <div className="grid gap-5">
            <Card padding="lg">
                <PanelTitle
                    label="Tool 管理"
                    title="Agent 可调用工具注册表"
                    action="注册 Tool"
                    onAction={() => setOpen(true)}
                />
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {items.map((tool) => (
                        <Card
                            key={tool.name}
                            padding="md"
                            className="cursor-pointer bg-background transition-colors hover:border-primary/50 hover:bg-accent/40"
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelected(tool)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setSelected(tool);
                                }
                            }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="break-words font-mono text-sm text-foreground">
                                        {tool.name}
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        {tool.type} · {tool.owner}
                                    </div>
                                </div>
                                <Badge variant={tool.status === "启用" ? "nominal" : "accent"}>
                                    {tool.status}
                                </Badge>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <MiniStat label="成功率" value={tool.success} />
                                <MiniStat label="平均耗时" value={tool.latency} />
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Button type="button" size="sm" variant="secondary">
                                    <Icons.Eye className="size-4" aria-hidden />
                                    查看详情
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeTool(tool.name);
                                    }}
                                >
                                    删除
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </Card>
            {open && (
                <Modal title="注册 Tool" onClose={() => setOpen(false)}>
                    <form onSubmit={submit} className="grid gap-4">
                        <FormField
                            label="Tool 名称"
                            value={name}
                            onChange={setName}
                            placeholder="例如 ocr_alarm_reader"
                        />
                        <SelectField
                            label="工具类型"
                            value={type}
                            onChange={setType}
                            options={["音频工具", "视觉巡检", "OCR 工具", "手册检索", "历史工单检索", "传感器分析"]}
                        />
                        <FormField label="Owner" value={owner} onChange={setOwner} />
                        <ModalActions onCancel={() => setOpen(false)} submitLabel="注册 Tool" />
                    </form>
                </Modal>
            )}
            {selected && (
                <Modal title="Tool 详情" onClose={() => setSelected(null)} wide>
                    <div className="grid gap-4">
                        {/* 标题区 */}
                        <div className="rounded-lg border border-border bg-muted p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="break-words font-mono text-lg font-medium text-foreground">{selected.name}</div>
                                    <div className="mt-1 text-xs leading-5 text-muted-foreground">{selected.type} · Owner: {selected.owner}</div>
                                </div>
                                <Badge variant={selected.status === "启用" ? "nominal" : "accent"}>{selected.status}</Badge>
                            </div>
                        </div>

                        {/* 性能指标 */}
                        <div className="grid gap-3 sm:grid-cols-3">
                            <InfoBlock label="成功率（近 30 天）" value={selected.success} />
                            <InfoBlock label="平均耗时" value={selected.latency} />
                            <InfoBlock label="超时策略" value={toolTimeout(selected)} />
                        </div>

                        {/* Schema */}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-lg border border-border bg-background p-3">
                                <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">输入 Schema</div>
                                <div className="mt-2 font-mono text-xs leading-6 text-foreground whitespace-pre-wrap">{toolInputSchemaFull(selected)}</div>
                            </div>
                            <div className="rounded-lg border border-border bg-background p-3">
                                <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">输出 Schema</div>
                                <div className="mt-2 font-mono text-xs leading-6 text-foreground whitespace-pre-wrap">{toolOutputSchemaFull(selected)}</div>
                            </div>
                        </div>

                        {/* 支持格式 */}
                        <div className="rounded-lg border border-border bg-background p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">支持格式 / 约束</div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {toolSupportedFormats(selected).map((f) => (
                                    <Badge key={f} variant="code">{f}</Badge>
                                ))}
                            </div>
                        </div>

                        {/* 权限与降级 */}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <InfoBlock label="权限" value="所有诊断 Agent 可读；Tool Schema 变更需管理员审核后生效。" />
                            <InfoBlock label="降级策略" value={toolFallback(selected)} />
                        </div>

                        {/* 最近调用记录 */}
                        <div className="rounded-lg border border-border bg-background p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">最近调用记录</div>
                            <div className="mt-3 grid gap-2">
                                {toolRecentCalls(selected).map((call) => (
                                    <div key={call.id} className="flex flex-wrap items-center gap-3 rounded-md bg-muted px-3 py-2 text-xs">
                                        <Badge variant="code">{call.id}</Badge>
                                        <span className="min-w-0 flex-1 text-muted-foreground">{call.input}</span>
                                        <Badge variant={call.ok ? "nominal" : "warning"}>{call.ok ? "success" : "error"}</Badge>
                                        <span className="font-mono text-text-tertiary">{call.dur}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-border pt-4">
                            <Button type="button" variant="ghost" onClick={() => setSelected(null)}>关闭</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

function toolInputSchemaFull(tool: MasterFixTool) {
    if (tool.name.includes("audio")) return "audio_file: File (wav/mp3/m4a)\nequipment_id: string\nsample_rate?: number\nsymptom_tags?: string[]";
    if (tool.name.includes("manual")) return "equipment_id: string\nquery: string\ntop_k?: number (default 3)\nsource_scope?: string";
    if (tool.name.includes("failure")) return "equipment_id: string\nsymptoms: string[]\ntime_window?: string\ntop_k?: number (default 5)";
    if (tool.name.includes("visual")) return "image_or_video: File (jpg/png/mp4)\nequipment_id: string\ninspection_target?: string";
    return "task_context: string\nequipment_id: string\nattachments?: File[]";
}

function toolOutputSchemaFull(tool: MasterFixTool) {
    if (tool.name.includes("audio")) return "spectrum_features: object\nanomaly_score: number\nfrequency_peaks: number[]\nconfidence: number\nsummary: string";
    if (tool.name.includes("manual")) return "snippets: string[]\nsource: string\nconfidence: number\npage_ref: string";
    if (tool.name.includes("failure")) return "cases: object[]\nmatched_symptoms: string[]\nroot_causes: string[]\nconfidence: number";
    if (tool.name.includes("visual")) return "findings: string[]\nhotspot_region?: string\nconfidence: number\nannotated_frame?: string";
    return "result: string\nevidence: object[]\nconfidence: number\nnext_actions: string[]";
}

function toolTimeout(tool: MasterFixTool) {
    if (tool.name.includes("audio")) return "超时 5 s，失败重试 1 次，仍失败降级为文本症状描述。";
    if (tool.name.includes("manual")) return "超时 3 s，失败重试 1 次，仍失败降级为历史案例检索。";
    if (tool.name.includes("failure")) return "超时 4 s，失败重试 1 次，仍失败返回空集并标记警告。";
    return "超时 3 s，失败后直接返回空结果并记录错误日志。";
}

function toolFallback(tool: MasterFixTool) {
    if (tool.name.includes("audio")) return "降级为纯文本症状分析，声音证据置信度自动降为 0.3。";
    if (tool.name.includes("manual")) return "降级为历史案例检索，手册引用字段标记为「降级」。";
    if (tool.name.includes("failure")) return "返回空历史案例，Agent 仍可基于手册证据继续诊断。";
    return "工具不可用时 Agent 跳过该步骤并在证据板标注「未采集」。";
}

function toolSupportedFormats(tool: MasterFixTool) {
    if (tool.name.includes("audio")) return ["WAV", "MP3", "M4A", "AAC", "FLAC", "≤50 MB", "≤30 min"];
    if (tool.name.includes("manual")) return ["PDF", "Word", "TXT", "Markdown", "RAG 向量检索"];
    if (tool.name.includes("failure")) return ["结构化工单", "JSONB", "全文检索", "语义向量"];
    if (tool.name.includes("visual")) return ["JPG", "PNG", "WEBP", "MP4", "MOV", "≤100 MB"];
    return ["JSON", "文本", "Base64 图片"];
}

function toolRecentCalls(tool: MasterFixTool) {
    if (tool.name.includes("audio")) return [
        { id: "TC-0041", input: "午班后电机异响.wav / M-204", ok: true, dur: "1.8 s" },
        { id: "TC-0038", input: "泵房噪声录制.wav / P-101", ok: true, dur: "2.1 s" },
        { id: "TC-0031", input: "旋盖机异响.m4a / C-303", ok: false, dur: "5.0 s" },
    ];
    if (tool.name.includes("manual")) return [
        { id: "TC-0040", input: "异响 + 温升 + 驱动电机", ok: true, dur: "0.4 s" },
        { id: "TC-0037", input: "离心泵压力波动 + 密封", ok: true, dur: "0.5 s" },
        { id: "TC-0033", input: "旋盖扭矩 + 导槽磨损", ok: true, dur: "0.4 s" },
    ];
    if (tool.name.includes("failure")) return [
        { id: "TC-0039", input: "M-204 / 润滑不足 / 近 90 天", ok: true, dur: "0.6 s" },
        { id: "TC-0036", input: "P-101 / 压力波动 / 近 180 天", ok: true, dur: "0.7 s" },
        { id: "TC-0030", input: "C-303 / 扭矩异常 / 近 90 天", ok: true, dur: "0.6 s" },
    ];
    return [
        { id: "TC-0042", input: "轴承侧外壳热点.jpg / M-204", ok: true, dur: "0.2 s" },
        { id: "TC-0035", input: "密封处泄漏.png / P-101", ok: true, dur: "0.2 s" },
    ];
}

function MemorySection() {
    const [items, setItems] = useState(memorySources);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<MemorySource | null>(null);
    const [name, setName] = useState("");
    const [detail, setDetail] = useState("");
    const [count, setCount] = useState("1 份");
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        masterfixApi
            .listMemory()
            .then(setItems)
            .catch(() => undefined);
    }, []);

    async function submit(e: FormEvent) {
        e.preventDefault();
        const memoryName = name || "新资料";
        const fileSummary = files.map((file) => file.name).join("、");
        const body = {
            name: memoryName,
            count: files.length > 0 ? `${files.length} 份` : count || "1 份",
            detail: detail || (fileSummary ? `已选择：${fileSummary}` : "等待解析和审核"),
        };
        try {
            const created = await masterfixApi.createMemory(body);
            setItems([created, ...items]);
        } catch {
            setItems([{ status: "待索引", ...body }, ...items]);
        }
        // 真正上传文件到后端
        if (files.length > 0) {
            try {
                await masterfixApi.uploadMemoryFiles(memoryName, files);
                // 更新列表里的状态为已索引
                setItems((current) =>
                    current.map((item) =>
                        item.name === memoryName
                            ? { ...item, count: `${files.length} 份`, status: "已索引" }
                            : item,
                    ),
                );
            } catch {
                // 上传失败不影响条目创建，保持已有状态
            }
        }
        setOpen(false);
        setName("");
        setDetail("");
        setCount("1 份");
        setFiles([]);
    }

    async function removeMemory(name: string) {
        setItems((current) => current.filter((item) => item.name !== name));
        setSelected((current) => (current?.name === name ? null : current));
        try {
            await masterfixApi.deleteMemory(name);
        } catch {
            // Optimistic delete keeps the demo responsive.
        }
    }

    return (
        <div className="grid gap-5">
            <Card padding="lg">
                <PanelTitle
                    label="Memory 管理"
                    title="维修知识与经验来源"
                    action="上传资料"
                    onAction={() => setOpen(true)}
                />
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {items.map((source) => (
                        <Card
                            key={source.name}
                            padding="md"
                            className="cursor-pointer bg-background transition-colors hover:border-primary/50 hover:bg-accent/40"
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelected(source)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setSelected(source);
                                }
                            }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-sm font-medium text-foreground">
                                        {source.name}
                                    </div>
                                    <div className="mt-1 text-xs leading-5 text-muted-foreground">
                                        {source.detail}
                                    </div>
                                </div>
                                <Badge variant="accent">{source.count}</Badge>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                                <StatusDot status={source.status.includes("待审核") ? "warning" : "nominal"} />
                                {source.status}
                            </div>
                            <div className="mt-3 flex justify-end gap-2">
                                <Button type="button" size="sm" variant="secondary">
                                    <Icons.Eye className="size-4" aria-hidden />
                                    查看详情
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeMemory(source.name);
                                    }}
                                >
                                    <Icons.X className="size-4" aria-hidden />
                                    删除
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </Card>
            {open && (
                <Modal title="上传 Memory 资料" onClose={() => setOpen(false)}>
                    <form onSubmit={submit} className="grid gap-4">
                        <FormField label="资料名称" value={name} onChange={setName} />
                        <FilePicker
                            label="资料文件"
                            accept="application/pdf,.pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.json,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                            value={files}
                            onChange={setFiles}
                            multiple
                            hint="支持 PDF、Word、TXT、Markdown、CSV、Excel、JSON、JPG、PNG、WEBP"
                        />
                        {files.length === 0 && (
                            <FormField label="数量" value={count} onChange={setCount} />
                        )}
                        <FormField
                            label="资料说明"
                            value={detail}
                            onChange={setDetail}
                            placeholder="例如 新增设备点检 SOP、老师傅经验表、维修案例 CSV"
                            multiline
                        />
                        <ModalActions onCancel={() => setOpen(false)} submitLabel="保存资料" />
                    </form>
                </Modal>
            )}
            {selected && (
                <Modal title="Memory 详情" onClose={() => setSelected(null)} wide>
                    <div className="grid gap-4">
                        {/* 标题区 */}
                        <div className="rounded-lg border border-border bg-muted p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="break-words text-lg font-medium text-foreground">{selected.name}</div>
                                    <div className="mt-1 text-xs leading-5 text-muted-foreground">{selected.detail}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="accent">{selected.count}</Badge>
                                    <StatusDot status={selected.status.includes("待审核") ? "warning" : "nominal"} />
                                    <span className="text-xs text-muted-foreground">{selected.status}</span>
                                </div>
                            </div>
                        </div>

                        {/* 基本信息 */}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <InfoBlock label="资料数量" value={selected.count} />
                            <InfoBlock label="索引状态" value={selected.status} />
                            <InfoBlock label="来源类型" value={memorySourceType(selected)} />
                            <InfoBlock label="最近更新" value={memoryLastUpdate(selected)} />
                        </div>

                        {/* Agent 引用方式 */}
                        <InfoBlock label="Agent 引用方式" value={memoryUsageSummary(selected)} />

                        {/* 关联设备 */}
                        <div className="rounded-lg border border-border bg-background p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">关联设备</div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {memoryLinkedEquipment(selected).map((eq) => (
                                    <Badge key={eq} variant="default">{eq}</Badge>
                                ))}
                            </div>
                        </div>

                        {/* 引用统计 */}
                        <div className="rounded-lg border border-border bg-background p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">引用统计（近 30 天）</div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                {memoryStats(selected).map((s) => (
                                    <div key={s.label} className="rounded-md bg-muted p-3">
                                        <div className="text-[11px] text-text-tertiary">{s.label}</div>
                                        <div className="mt-1 font-mono text-base font-medium text-foreground">{s.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 待审核说明 */}
                        {selected.status.includes("待审核") && (
                            <div className="flex flex-wrap items-start gap-2 rounded-lg border border-border bg-muted p-3">
                                <StatusDot status="warning" />
                                <div className="min-w-0 text-xs leading-5 text-muted-foreground">
                                    该资料有条目待审核。内容已可被 Agent 检索，但权重低于已审核资料；管理员确认后将提升至标准优先级。
                                </div>
                            </div>
                        )}

                        {/* 文件预览 */}
                        <MemoryFilesPanel memoryName={selected.name} />

                        <div className="flex justify-end border-t border-border pt-4">
                            <Button type="button" variant="ghost" onClick={() => setSelected(null)}>关闭</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

function MemoryFilesPanel({ memoryName }: { memoryName: string }) {
    const [files, setFiles] = useState<MemoryFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        masterfixApi
            .listMemoryFiles(memoryName)
            .then((data) => { setFiles(data); setLoading(false); })
            .catch(() => { setFiles([]); setLoading(false); });
    }, [memoryName]);

    if (loading) {
        return (
            <div className="rounded-lg border border-border bg-background p-3">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">文件预览</div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Icons.Loader2 className="size-3 animate-spin" aria-hidden />
                    正在加载文件…
                </div>
            </div>
        );
    }

    if (files.length === 0) {
        return (
            <div className="rounded-lg border border-border bg-background p-3">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">文件预览</div>
                <div className="mt-3 text-xs text-muted-foreground">暂无上传文件。点击「上传资料」选择文件后将在此处预览内容。</div>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-border bg-background p-3">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                文件预览（{files.length} 个文件）
            </div>
            <div className="mt-3 grid gap-3">
                {files.map((file) => {
                    const isOpen = expanded === file.filename;
                    const isPdf = file.content_type === "application/pdf";
                    const isImage = file.content_type.startsWith("image/");
                    const isText =
                        file.content_type.startsWith("text/") ||
                        ["application/json"].includes(file.content_type) ||
                        /\.(md|csv|txt|json|log)$/i.test(file.filename);

                    return (
                        <div key={file.filename} className="rounded-md border border-border bg-muted">
                            {/* 文件头行 */}
                            <button
                                type="button"
                                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent/40 transition-colors rounded-md"
                                onClick={() => setExpanded(isOpen ? null : file.filename)}
                            >
                                <span className="text-lg" aria-hidden>
                                    {isPdf ? "📄" : isImage ? "🖼️" : isText ? "📝" : "📎"}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-xs font-medium text-foreground">{file.filename}</div>
                                    <div className="text-[11px] text-text-tertiary">
                                        {file.content_type} · {formatFileSize(file.size)}
                                    </div>
                                </div>
                                <Icons.ChevronDown
                                    className={`size-4 flex-none text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                                    aria-hidden
                                />
                            </button>

                            {/* 预览内容 */}
                            {isOpen && (
                                <div className="border-t border-border p-3">
                                    {isImage && (
                                        <img
                                            src={`data:${file.content_type};base64,${file.content_b64}`}
                                            alt={file.filename}
                                            className="max-h-[400px] w-full rounded object-contain"
                                        />
                                    )}
                                    {isPdf && (
                                        <PdfPageViewer b64={file.content_b64} />
                                    )}
                                    {isText && !isPdf && !isImage && (
                                        <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap break-words rounded bg-background p-3 font-mono text-xs leading-5 text-foreground">
                                            {atob(file.content_b64)}
                                        </pre>
                                    )}
                                    {!isImage && !isPdf && !isText && (
                                        <div className="text-xs text-muted-foreground">
                                            该格式暂不支持在线预览，请下载后查看。
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function PdfPageViewer({ b64 }: { b64: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pageCount, setPageCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [rendering, setRendering] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Load the PDF document once
    useEffect(() => {
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        pdfjsLib.getDocument({ data: bytes }).promise.then((pdf) => {
            setPageCount(pdf.numPages);
        }).catch(() => setPageCount(0));
    }, [b64]);

    // Render the current page whenever it changes
    useEffect(() => {
        if (!canvasRef.current || pageCount === 0) return;
        setRendering(true);
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        pdfjsLib.getDocument({ data: bytes }).promise.then((pdf) =>
            pdf.getPage(currentPage)
        ).then((page) => {
            const viewport = page.getViewport({ scale: 1.4 });
            const canvas = canvasRef.current!;
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            return page.render({
                canvasContext: canvas.getContext("2d")!,
                canvas,
                viewport,
            }).promise;
        }).then(() => setRendering(false))
          .catch(() => setRendering(false));
    }, [b64, currentPage, pageCount]);

    if (pageCount === 0) {
        return <div className="text-xs text-muted-foreground">PDF 解析失败，请确认文件完整。</div>;
    }

    return (
        <div ref={containerRef} className="grid gap-2">
            <canvas
                ref={canvasRef}
                className="w-full rounded border border-border"
                aria-label={`PDF 第 ${currentPage} 页`}
            />
            {rendering && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icons.Loader2 className="size-3 animate-spin" aria-hidden />
                    渲染中…
                </div>
            )}
            {pageCount > 1 && (
                <div className="flex items-center gap-2">
                    <Button
                        type="button" size="sm" variant="secondary"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                        <Icons.ChevronLeft className="size-4" aria-hidden />
                        上一页
                    </Button>
                    <span className="flex-1 text-center text-xs text-muted-foreground">
                        {currentPage} / {pageCount}
                    </span>
                    <Button
                        type="button" size="sm" variant="secondary"
                        disabled={currentPage >= pageCount}
                        onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                    >
                        下一页
                        <Icons.ChevronRight className="size-4" aria-hidden />
                    </Button>
                </div>
            )}
        </div>
    );
}

function memoryUsageSummary(source: MemorySource) {
    if (source.name.includes("手册")) return "用于手册检索、SOP 对齐、维修步骤引用和安全注意事项校验。";
    if (source.name.includes("历史")) return "用于相似案例召回、根因先验排序、工单建议和复盘闭环。";
    if (source.name.includes("经验")) return "用于补充老师傅现场判断规则、排查顺序和异常处理经验。";
    if (source.name.includes("设备")) return "用于设备型号、安装位置、关键部件和策略绑定上下文。";
    return "作为 Agent 可检索 Memory，在诊断、复核和工单生成时按需引用。";
}

function memorySourceType(source: MemorySource) {
    if (source.name.includes("手册")) return "PDF / IOM 技术文档、点检规范、安全操作规程";
    if (source.name.includes("历史")) return "结构化工单数据库（JSONB）、维修结果、停机日志";
    if (source.name.includes("经验")) return "非结构化文本、老师傅口述记录、现场备注卡片";
    if (source.name.includes("设备")) return "设备台账（型号、SN、安装日期、关键部件清单）";
    return "混合来源，需确认格式后再索引。";
}

function memoryLastUpdate(source: MemorySource) {
    if (source.name.includes("手册")) return "2025-04-12（新增 2 份 IOM 手册）";
    if (source.name.includes("历史")) return "实时同步（每次工单关闭后自动写入）";
    if (source.name.includes("经验")) return "2025-05-03（张工提交 3 条新备注，待审核）";
    if (source.name.includes("设备")) return "2025-03-28（新增 4 台设备档案）";
    return "未记录，请在资料管理中补充。";
}

function memoryLinkedEquipment(source: MemorySource) {
    if (source.name.includes("手册")) return ["Bottle Filler / M-204", "Source Pump / P-101", "Bottle Capper / C-303", "CIP System / S-001"];
    if (source.name.includes("历史")) return ["Bottle Filler / M-204", "Source Pump / P-101", "Bottle Capper / C-303"];
    if (source.name.includes("经验")) return ["Bottle Filler / M-204", "Source Pump / P-101"];
    if (source.name.includes("设备")) return ["全厂 46 台设备"];
    return ["未绑定具体设备"];
}

function memoryStats(source: MemorySource) {
    if (source.name.includes("手册")) return [
        { label: "Agent 检索次数", value: "284" },
        { label: "命中率", value: "91%" },
        { label: "平均返回片段", value: "3.2" },
    ];
    if (source.name.includes("历史")) return [
        { label: "案例召回次数", value: "517" },
        { label: "命中相似度 > 0.7", value: "78%" },
        { label: "辅助确认根因", value: "63 次" },
    ];
    if (source.name.includes("经验")) return [
        { label: "规则被引用", value: "112" },
        { label: "与结果吻合", value: "83%" },
        { label: "待审核条目", value: "5" },
    ];
    return [
        { label: "档案查询次数", value: "198" },
        { label: "关联 Skill 数", value: "7" },
        { label: "覆盖设备", value: "46 台" },
    ];
}

function EquipmentSection() {
    const [items, setItems] = useState(equipmentItems);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<MasterFixEquipment | null>(null);
    const [name, setName] = useState("");
    const [equipmentType, setEquipmentType] = useState("");
    const [location, setLocation] = useState("");
    const [owner, setOwner] = useState("");
    const [criticality, setCriticality] = useState("中");

    useEffect(() => {
        masterfixApi
            .listEquipment()
            .then(setItems)
            .catch(() => undefined);
    }, []);

    async function submit(e: FormEvent) {
        e.preventDefault();
        const body = {
            name: name || "未命名设备",
            equipment_type: equipmentType || "未分类",
            location: location || "未设置位置",
            owner: owner || "未分配",
            criticality,
        };
        try {
            const created = await masterfixApi.createEquipment(body);
            setItems([created, ...items]);
        } catch {
            setItems([
                {
                    id: `EQ-local-${items.length + 1}`,
                    status: "运行中",
                    linked_skills: 0,
                    ...body,
                },
                ...items,
            ]);
        }
        setOpen(false);
        setName("");
        setEquipmentType("");
        setLocation("");
        setOwner("");
        setCriticality("中");
    }

    async function removeEquipment(id: string) {
        setItems((current) => current.filter((item) => item.id !== id));
        setSelected((current) => (current?.id === id ? null : current));
        try {
            await masterfixApi.deleteEquipment(id);
        } catch {
            // Optimistic delete keeps the demo responsive.
        }
    }

    return (
        <div className="grid gap-5">
            <Card padding="lg">
                <PanelTitle
                    label="设备管理"
                    title="设备档案与诊断策略绑定"
                    action="新增设备"
                    onAction={() => setOpen(true)}
                />
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {items.map((item) => (
                        <Card
                            key={item.id}
                            padding="md"
                            className="cursor-pointer bg-background transition-colors hover:border-primary/50 hover:bg-accent/40"
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelected(item)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setSelected(item);
                                }
                            }}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="break-words text-sm font-medium text-foreground">
                                        {item.name}
                                    </div>
                                    <div className="mt-1 text-xs leading-5 text-muted-foreground">
                                        {item.equipment_type} · {item.location}
                                    </div>
                                </div>
                                <Badge variant={item.criticality === "高" ? "warning" : "default"}>
                                    {item.criticality}关键度
                                </Badge>
                            </div>
                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <MiniStat label="负责人" value={item.owner} />
                                <MiniStat label="状态" value={item.status} />
                                <MiniStat label="绑定 Skill" value={`${item.linked_skills}`} />
                            </div>
                            <div className="mt-3 flex justify-end">
                                <Button type="button" size="sm" variant="secondary">
                                    <Icons.Eye className="size-4" aria-hidden />
                                    查看详情
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeEquipment(item.id);
                                    }}
                                >
                                    <Icons.X className="size-4" aria-hidden />
                                    删除
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </Card>

            {open && (
                <Modal title="新增设备" onClose={() => setOpen(false)}>
                    <form onSubmit={submit} className="grid gap-4">
                        <FormField label="设备名称" value={name} onChange={setName} />
                        <FormField
                            label="设备类型"
                            value={equipmentType}
                            onChange={setEquipmentType}
                            placeholder="例如 离心泵 / 电机 / 压缩机"
                        />
                        <FormField label="安装位置" value={location} onChange={setLocation} />
                        <FormField label="负责人" value={owner} onChange={setOwner} />
                        <SelectField
                            label="关键度"
                            value={criticality}
                            onChange={setCriticality}
                            options={["高", "中", "低"]}
                        />
                        <ModalActions onCancel={() => setOpen(false)} submitLabel="保存设备" />
                    </form>
                </Modal>
            )}
            {selected && (
                <Modal title="设备详情" onClose={() => setSelected(null)} wide>
                    <div className="grid gap-4">
                        {/* 标题区 */}
                        <div className="rounded-lg border border-border bg-muted p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="break-words text-lg font-medium text-foreground">{selected.name}</div>
                                    <div className="mt-1 font-mono text-xs text-text-tertiary">{selected.id}</div>
                                </div>
                                <Badge variant={selected.criticality === "高" ? "warning" : "default"}>{selected.criticality}关键度</Badge>
                            </div>
                        </div>

                        {/* 基本档案 */}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <InfoBlock label="设备类型" value={selected.equipment_type} />
                            <InfoBlock label="安装位置" value={selected.location} />
                            <InfoBlock label="负责人" value={selected.owner} />
                            <InfoBlock label="运行状态" value={selected.status} />
                            <InfoBlock label="安装日期" value={equipmentInstallDate(selected)} />
                            <InfoBlock label="绑定 Skill 数" value={`${selected.linked_skills} 个`} />
                        </div>

                        {/* 运维状态 */}
                        <div className="rounded-lg border border-border bg-background p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">运维状态</div>
                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                {equipmentOpsStats(selected).map((s) => (
                                    <div key={s.label} className="rounded-md bg-muted p-3">
                                        <div className="text-[11px] text-text-tertiary">{s.label}</div>
                                        <div className="mt-1 break-words font-mono text-sm font-medium text-foreground">{s.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 关联 Memory & 推荐 Skill */}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <InfoBlock label="关联 Memory" value={equipmentMemorySummary(selected)} />
                            <InfoBlock label="推荐 Skill" value={equipmentSkillSummary(selected)} />
                        </div>

                        {/* 近期工单 */}
                        <div className="rounded-lg border border-border bg-background p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">近期工单</div>
                            <div className="mt-3 grid gap-2">
                                {equipmentRecentOrders(selected).map((wo) => (
                                    <div key={wo.id} className="flex flex-wrap items-center gap-3 rounded-md bg-muted px-3 py-2 text-xs">
                                        <Badge variant="code">{wo.id}</Badge>
                                        <span className="min-w-0 flex-1 text-foreground">{wo.title}</span>
                                        <Badge variant={wo.status === "已关闭" ? "nominal" : "warning"}>{wo.status}</Badge>
                                        <span className="text-text-tertiary">{wo.date}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 当前告警 */}
                        <div className="rounded-lg border border-border bg-background p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">当前监控告警</div>
                            <div className="mt-3 grid gap-2">
                                {equipmentAlerts(selected).length === 0 ? (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <StatusDot status="nominal" />无活跃告警
                                    </div>
                                ) : equipmentAlerts(selected).map((al) => (
                                    <div key={al.signal} className="flex items-start gap-2 rounded-md bg-muted px-3 py-2">
                                        <StatusDot status={al.level === "高" ? "critical" : "warning"} />
                                        <div className="min-w-0 text-xs leading-5 text-foreground">{al.signal}：{al.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-border pt-4">
                            <Button type="button" variant="ghost" onClick={() => setSelected(null)}>关闭</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

function equipmentMemorySummary(item: MasterFixEquipment) {
    if (item.id === "EQ-204") return "设备手册 2 份、历史工单 34 条、老师傅备注 8 条。";
    if (item.id === "EQ-101") return "设备手册 1 份、历史工单 18 条、趋势样本 6 组。";
    if (item.id === "EQ-303") return "设备手册 1 份、历史工单 22 条、点检记录 12 条。";
    return "等待绑定设备手册、历史工单和现场经验。";
}

function equipmentSkillSummary(item: MasterFixEquipment) {
    if (item.equipment_type.includes("电机")) return "电机异响 + 温升初诊；传动振动趋势排查；润滑维护复核。";
    if (item.equipment_type.includes("泵")) return "离心泵压力波动排查；密封泄漏检查；阀门状态核验。";
    if (item.equipment_type.includes("旋盖")) return "传动扭矩异常排查；卡滞定位；安全停机复核。";
    return "暂无推荐 Skill，可在 Skill 管理中配置触发条件。";
}

function equipmentInstallDate(item: MasterFixEquipment) {
    if (item.id === "EQ-204") return "2021-03-15（已运行约 38 个月）";
    if (item.id === "EQ-101") return "2020-08-22（已运行约 57 个月）";
    if (item.id === "EQ-303") return "2022-11-04（已运行约 18 个月）";
    return "未记录";
}

function equipmentOpsStats(item: MasterFixEquipment) {
    if (item.id === "EQ-204") return [
        { label: "MTBF（近 12 月）", value: "2,340 h" },
        { label: "MTTR（近 12 月）", value: "1.8 h" },
        { label: "上次保养", value: "2025-04-20" },
        { label: "下次计划保养", value: "2025-07-20" },
        { label: "累计停机时长", value: "14.4 h" },
        { label: "OEE 影响", value: "–0.6%" },
    ];
    if (item.id === "EQ-101") return [
        { label: "MTBF（近 12 月）", value: "3,120 h" },
        { label: "MTTR（近 12 月）", value: "2.4 h" },
        { label: "上次保养", value: "2025-03-10" },
        { label: "下次计划保养", value: "2025-09-10" },
        { label: "累计停机时长", value: "7.2 h" },
        { label: "OEE 影响", value: "–0.3%" },
    ];
    return [
        { label: "MTBF（近 12 月）", value: "4,560 h" },
        { label: "MTTR（近 12 月）", value: "1.2 h" },
        { label: "上次保养", value: "2025-05-01" },
        { label: "下次计划保养", value: "2025-08-01" },
        { label: "累计停机时长", value: "3.6 h" },
        { label: "OEE 影响", value: "–0.1%" },
    ];
}

function equipmentRecentOrders(item: MasterFixEquipment) {
    if (item.id === "EQ-204") return [
        { id: "WO-2407", title: "灌装机驱动电机异响", status: "待复核", date: "2025-05-24" },
        { id: "WO-2381", title: "驱动电机温升异常", status: "已关闭", date: "2025-03-12" },
        { id: "WO-2354", title: "联轴器轻微振动排查", status: "已关闭", date: "2025-01-08" },
    ];
    if (item.id === "EQ-101") return [
        { id: "WO-2408", title: "源泵出口压力波动", status: "诊断中", date: "2025-05-24" },
        { id: "WO-2370", title: "入口阀调节偏差", status: "已关闭", date: "2025-02-18" },
    ];
    return [
        { id: "WO-2409", title: "旋盖机扭矩间歇升高", status: "待派工", date: "2025-05-24" },
        { id: "WO-2390", title: "导槽磨损检查", status: "已关闭", date: "2025-04-02" },
    ];
}

function equipmentAlerts(item: MasterFixEquipment) {
    if (item.id === "EQ-204") return [
        { signal: "振动幅值", desc: "近 6 小时上升趋势，预测 12 h 内触及告警阈值。", level: "中" },
        { signal: "轴承侧温度", desc: "当前 68°C，超出正常范围上限 65°C。", level: "高" },
    ];
    if (item.id === "EQ-101") return [
        { signal: "出口压力", desc: "波动幅度 ±18%，超出正常范围 ±5%，持续 3 小时。", level: "中" },
    ];
    return [];
}

function PanelTitle({
    label,
    title,
    action,
    onAction,
}: {
    label: string;
    title: string;
    action?: string;
    onAction?: () => void;
}) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {label}
                </div>
                <h2 className="mt-2 text-xl font-medium tracking-[-0.02em] text-foreground">
                    {title}
                </h2>
            </div>
            {action && (
                <Button size="sm" variant="secondary" type="button" onClick={onAction}>
                    <Icons.Plus className="size-4" aria-hidden />
                    {action}
                </Button>
            )}
        </div>
    );
}

function Modal({
    title,
    onClose,
    children,
    wide = false,
}: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    wide?: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
            <div className={`w-full rounded-xl border border-border bg-card shadow-xl ${wide ? "max-w-3xl" : "max-w-xl"}`}>
                <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
                    <h2 className="text-lg font-medium tracking-[-0.02em] text-foreground">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="关闭"
                    >
                        <Icons.X className="size-4" aria-hidden />
                    </button>
                </div>
                <div className="max-h-[75vh] overflow-auto p-5">{children}</div>
            </div>
        </div>
    );
}

function FormField({
    label,
    value,
    onChange,
    placeholder,
    multiline = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    multiline?: boolean;
}) {
    const cls =
        "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground " +
        "placeholder:text-text-tertiary focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";
    return (
        <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            {multiline ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={3}
                    className={cls}
                />
            ) : (
                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={cls}
                />
            )}
        </label>
    );
}

type FilePickerProps = {
    label: string;
    accept: string;
    hint: string;
} & (
    | {
          multiple?: false;
          value: File | null;
          onChange: (value: File | null) => void;
      }
    | {
          multiple: true;
          value: File[];
          onChange: (value: File[]) => void;
      }
);

function FilePicker(props: FilePickerProps) {
    const { label, accept, value, hint } = props;
    const files = Array.isArray(value) ? value : value ? [value] : [];

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        const selected = Array.from(e.target.files ?? []);
        if (props.multiple) {
            props.onChange(selected);
            return;
        }
        props.onChange(selected[0] ?? null);
    }

    return (
        <label className="grid gap-2">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <input
                type="file"
                accept={accept}
                multiple={props.multiple}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/90 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="text-xs leading-5 text-text-tertiary">{hint}</div>
            {files.length > 0 && (
                <div className="grid gap-2 rounded-lg border border-border bg-muted p-3">
                    {files.map((file) => (
                        <div
                            key={`${file.name}-${file.size}`}
                            className="flex flex-wrap items-center justify-between gap-2 text-xs"
                        >
                            <span className="min-w-0 break-words font-medium text-foreground">
                                {file.name}
                            </span>
                            <span className="font-mono text-text-tertiary">
                                {formatFileSize(file.size)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </label>
    );
}

function formatFileSize(size: number) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function SelectField({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
}) {
    return (
        <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </label>
    );
}

function FlowSelector({
    label,
    items,
    selected,
    onToggle,
    emptyText,
}: {
    label: string;
    items: Array<{ id: string; title: string; detail: string }>;
    selected: string[];
    onToggle: (id: string) => void;
    emptyText: string;
}) {
    return (
        <div className="grid gap-2">
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            {items.length === 0 ? (
                <div className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
                    {emptyText}
                </div>
            ) : (
                <div className="grid gap-2">
                    {items.map((item, index) => {
                        const checked = selected.includes(item.id);
                        const order = checked ? selected.indexOf(item.id) + 1 : null;
                        return (
                            <label
                                key={item.id}
                                className={[
                                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                                    checked
                                        ? "border-primary bg-primary/10"
                                        : "border-border bg-background hover:bg-accent",
                                ].join(" ")}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => onToggle(item.id)}
                                    className="mt-1"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {order ? (
                                            <span className="flex size-5 items-center justify-center rounded bg-background font-mono text-[11px] text-muted-foreground">
                                                {order}
                                            </span>
                                        ) : (
                                            <span className="font-mono text-[11px] text-text-tertiary">
                                                {index + 1}
                                            </span>
                                        )}
                                        <span className="break-words font-mono text-xs text-foreground">
                                            {item.title}
                                        </span>
                                    </div>
                                    <div className="mt-1 text-xs leading-5 text-muted-foreground">
                                        {item.detail}
                                    </div>
                                </div>
                            </label>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function ModalActions({
    onCancel,
    submitLabel,
}: {
    onCancel: () => void;
    submitLabel: string;
}) {
    return (
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>
                取消
            </Button>
            <Button type="submit">{submitLabel}</Button>
        </div>
    );
}

function WorkOrderManagementCard({
    order,
    onOpen,
    onDelete,
}: {
    order: (typeof workOrders)[number];
    onOpen: () => void;
    onDelete: () => void;
}) {
    return (
        <div
            className="cursor-pointer rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary/50 hover:bg-accent/40"
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen();
                }
            }}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-[220px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="code">{order.id}</Badge>
                        <Badge variant={order.priority === "高" ? "warning" : "default"}>
                            {order.priority}优先级
                        </Badge>
                    </div>
                    <div className="mt-2 break-words text-sm font-medium text-foreground">
                        {order.title}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-muted-foreground">
                        {order.equipment}
                    </div>
                </div>
                <Badge variant={order.status === "待复核" ? "warning" : "accent"}>
                    {order.status}
                </Badge>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
                <MiniStat label="负责人" value={order.owner} />
                <MiniStat label="关联 Skill" value={order.skill} />
            </div>
            <div className="mt-3 flex justify-end gap-2">
                <Button type="button" size="sm" variant="secondary">
                    <Icons.Eye className="size-4" aria-hidden />
                    查看详情
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                >
                    <Icons.X className="size-4" aria-hidden />
                    删除
                </Button>
            </div>
        </div>
    );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-border bg-background p-3">
            <div className="text-[11px] text-text-tertiary">{label}</div>
            <div className="mt-1 break-words text-sm leading-6 text-foreground">{value}</div>
        </div>
    );
}

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg bg-muted p-3">
            <div className="text-[11px] text-text-tertiary">{label}</div>
            <div className="mt-1 break-words text-sm leading-5 text-foreground">{value}</div>
        </div>
    );
}
