import { Badge, Button, Card, Hairline, Icons, SectionHeader, StatusDot } from "../components/ui";

const toolSteps = [
    {
        name: "音频去噪",
        detail: "清理车间背景噪声，保留电机冲击声特征",
    },
    {
        name: "频谱分析",
        detail: "提取高频冲击、倍频峰值和异常振动模式",
    },
    {
        name: "图片巡检",
        detail: "检查外壳热点、油污、皮带偏移和可见松动",
    },
    {
        name: "手册检索",
        detail: "查询设备手册中关于异响、温升和润滑的排查段落",
    },
    {
        name: "历史工单检索",
        detail: "查找同型号设备过去相似症状和真实维修结果",
    },
    {
        name: "趋势核验",
        detail: "对比最近 6 小时温度、振动和负载趋势",
    },
];

const evidenceItems = [
    {
        label: "声音证据",
        value: "去噪后出现稳定的高频冲击峰，符合早期润滑不足或轴承磨损特征。",
        tone: "warning" as const,
    },
    {
        label: "视觉证据",
        value: "电机端盖附近有轻微油迹，外壳热点集中在轴承侧。",
        tone: "warning" as const,
    },
    {
        label: "手册证据",
        value: "设备手册建议：异响伴随温升时，优先检查润滑状态、轴承游隙和联轴器同心度。",
        tone: "nominal" as const,
    },
    {
        label: "历史证据",
        value: "近三个月同类驱动电机出现 3 起相似案例，其中 2 起最终确认为润滑不足。",
        tone: "warning" as const,
    },
];

const diagnosis = [
    {
        cause: "轴承润滑不足",
        confidence: "82%",
        action: "停机窗口内补脂，并复测 15 分钟振动频谱。",
    },
    {
        cause: "轴承早期磨损",
        confidence: "68%",
        action: "检查轴承游隙，准备备用轴承和拉马工具。",
    },
    {
        cause: "联轴器轻微偏心",
        confidence: "41%",
        action: "若补脂后冲击峰仍在，做激光对中复核。",
    },
];

export default function MasterFixPage() {
    return (
        <section className="flex h-full flex-col overflow-hidden">
            <div className="flex flex-none flex-col gap-5 p-6 pb-4">
                <SectionHeader
                    label="机修老师傅 MasterFix"
                    size="lg"
                    meta="会按老师傅经验排查、留证据、沉淀技能的维修 Agent"
                />
                <Hairline />
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">
                <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
                    <FieldInputPanel />
                    <AgentPlanPanel />
                    <DiagnosisPanel />
                </div>
            </div>
        </section>
    );
}

function FieldInputPanel() {
    return (
        <Card padding="lg" className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
            <div className="flex min-w-0 flex-col gap-5">
                <div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        现场输入
                    </div>
                    <h2 className="mt-2 text-2xl font-medium tracking-[-0.02em] text-foreground">
                        灌装机驱动电机异响
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                        维修员上传现场声音、图片和一句描述。Agent 不直接猜答案，而是先判断该按哪条排查经验走。
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <InputAsset icon={Icons.CircleDot} label="设备编号" value="Bottle Filler / M-204" />
                    <InputAsset icon={Icons.Activity} label="声音文件" value="午班后电机异响.wav" />
                    <InputAsset icon={Icons.Eye} label="现场图片" value="轴承侧外壳热点.jpg" />
                    <InputAsset icon={Icons.FileText} label="维修员描述" value="声音变尖，外壳发热，振动略大" />
                </div>
            </div>

            <div className="flex min-w-0 flex-col gap-3">
                <div className="rounded-lg border border-border bg-muted p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <StatusDot status="warning" />
                        当前症状：异响 + 温升 + 轻微振动
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        演示版先使用预置案例播放完整工作流，后续可逐步替换成真实音频、视觉和检索工具。
                    </p>
                </div>

                <div className="grid gap-2 rounded-lg border border-border bg-background p-4">
                    <div className="text-sm font-medium text-foreground">为什么不是普通问答</div>
                    <p className="text-sm leading-6 text-muted-foreground">
                        普通 RAG 等维修员提问；MasterFix 主动决定先听声、再看图、查手册、翻旧案，并把每一步证据留下。
                    </p>
                </div>

                <Button className="mt-auto w-full sm:w-auto sm:self-start">
                    <Icons.Play className="size-4" aria-hidden />
                    开始诊断演示
                </Button>
            </div>
        </Card>
    );
}

function InputAsset({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
            <Icon className="size-4 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
                <div className="text-[11px] text-text-tertiary">{label}</div>
                <div className="break-words text-sm font-medium leading-5 text-foreground">{value}</div>
            </div>
        </div>
    );
}

function AgentPlanPanel() {
    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Card padding="lg" className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Agent 规划摘要
                        </div>
                        <h2 className="mt-2 text-xl font-medium tracking-[-0.02em] text-foreground">
                            匹配技能：电机异响 + 温升初诊
                        </h2>
                    </div>
                    <Badge variant="agent" agent="investigator" size="md">
                        Skill-Guided ReAct
                    </Badge>
                </div>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    ReAct 让 Agent 能边观察边调用工具；Skill
                    让它不是乱调工具，而是按照老师傅沉淀的排查顺序行动。
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <PlanMetric label="触发条件" value="异响 / 温升 / 振动" />
                    <PlanMetric label="排查目标" value="润滑 / 轴承 / 对中" />
                    <PlanMetric label="退出条件" value="证据不足则升级复核" />
                </div>
            </Card>

            <Card padding="lg">
                <div className="mb-4 flex items-center justify-between">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        工具调用轨迹
                    </div>
                    <Badge variant="accent">按 Skill 约束执行</Badge>
                </div>
                <ol className="grid gap-3 md:grid-cols-2">
                    {toolSteps.map((step, index) => (
                        <li
                            key={step.name}
                            className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-3"
                        >
                            <span className="flex size-7 flex-none items-center justify-center rounded-md bg-muted font-mono text-xs text-muted-foreground">
                                {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-foreground">
                                    {step.name}
                                </div>
                                <div className="mt-1 text-xs leading-5 text-muted-foreground">
                                    {step.detail}
                                </div>
                            </div>
                            <Icons.ArrowRight className="mt-1 size-4 text-text-tertiary" aria-hidden />
                        </li>
                    ))}
                </ol>
            </Card>
        </div>
    );
}

function PlanMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-border bg-background p-3">
            <div className="text-[11px] text-text-tertiary">{label}</div>
            <div className="mt-1 break-words text-sm font-medium leading-5 text-foreground">
                {value}
            </div>
        </div>
    );
}

function DiagnosisPanel() {
    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.8fr)]">
            <Card padding="lg">
                <div className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    多模态证据板
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    {evidenceItems.map((item) => (
                        <div
                            key={item.label}
                            className="rounded-lg border border-border bg-background p-3"
                        >
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <span className="text-xs font-medium text-foreground">
                                    {item.label}
                                </span>
                                <Badge variant={item.tone}>
                                    {item.tone === "warning" ? "需关注" : "有依据"}
                                </Badge>
                            </div>
                            <p className="text-sm leading-6 text-muted-foreground">{item.value}</p>
                        </div>
                    ))}
                </div>
            </Card>

            <Card padding="lg" rail="warning" className="flex flex-col gap-4">
                <div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        故障原因 Top 3
                    </div>
                    <div className="mt-3 grid gap-3">
                        {diagnosis.map((item, index) => (
                            <div
                                key={item.cause}
                                className="rounded-lg border border-border bg-background p-3"
                            >
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                    <span className="font-mono text-xs text-text-tertiary">
                                        #{index + 1}
                                    </span>
                                    <span className="min-w-[180px] flex-1 break-words font-medium leading-5 text-foreground">
                                        {item.cause}
                                    </span>
                                    <Badge variant={index === 0 ? "warning" : "default"}>
                                        {item.confidence}
                                    </Badge>
                                </div>
                                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                    {item.action}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-lg border border-border bg-muted p-3">
                    <div className="text-xs font-medium text-foreground">老师傅反馈学习</div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        维修结束后填写真实原因和处理方法，系统生成案例卡，并提出 Skill 更新建议，等待老师傅审核。
                    </p>
                </div>
            </Card>
        </div>
    );
}
