"""MasterFix management demo endpoints.

This module intentionally uses process-local state for the hackathon demo.
It gives the frontend real authenticated API calls without forcing a schema
migration before the product shape settles.
"""

from __future__ import annotations

import base64
from typing import List

from core.api_response import created, deleted, ok
from core.exceptions import NotFoundError
from core.security import get_current_user
from fastapi import APIRouter, Depends, File, UploadFile
from modules.masterfix.schemas import (
    DiagnosisTaskCreate,
    DiagnosisTaskOut,
    EquipmentCreate,
    EquipmentOut,
    MasterFixWorkOrderCreate,
    MasterFixWorkOrderOut,
    MemoryFileInfo,
    MemorySourceCreate,
    MemorySourceOut,
    SkillCreate,
    SkillOut,
    ToolCreate,
    ToolOut,
    ToolTestRequest,
    ToolTestResponse,
)

router = APIRouter(
    prefix="/api/v1/masterfix",
    tags=["masterfix"],
    dependencies=[Depends(get_current_user)],
)

_tasks: list[DiagnosisTaskOut] = [
    DiagnosisTaskOut(
        id="DT-1001",
        equipment="Bottle Filler / M-204",
        description="声音变尖，外壳发热，振动略大",
        audio="午班后电机异响.wav",
        image="轴承侧外壳热点.jpg",
        symptoms=["异响", "温升", "轻微振动"],
    )
]

_work_orders: list[MasterFixWorkOrderOut] = [
    MasterFixWorkOrderOut(
        id="WO-2407",
        title="灌装机驱动电机异响",
        equipment="Bottle Filler / M-204",
        owner="张工",
        status="待复核",
        priority="高",
        skill="电机异响 + 温升初诊",
    ),
    MasterFixWorkOrderOut(
        id="WO-2408",
        title="源泵出口压力波动",
        equipment="Source Pump / P-101",
        owner="李工",
        status="诊断中",
        priority="中",
        skill="离心泵压力波动排查",
    ),
    MasterFixWorkOrderOut(
        id="WO-2409",
        title="旋盖机扭矩间歇升高",
        equipment="Bottle Capper / C-303",
        owner="未分配",
        status="待派工",
        priority="中",
        skill="传动扭矩异常排查",
    ),
]

_skills: list[SkillOut] = [
    SkillOut(
        name="电机异响 + 温升初诊",
        version="v1.4",
        status="启用",
        hits=42,
        trigger="电机 / 异响 / 温升 / 振动",
        tools="音频去噪 -> 频谱分析 -> 图片巡检 -> 手册检索 -> 历史工单",
    ),
    SkillOut(
        name="离心泵压力波动排查",
        version="v0.9",
        status="待审核",
        hits=18,
        trigger="泵 / 压力波动 / 流量下降",
        tools="趋势核验 -> 手册检索 -> 相似案例 -> 阀门状态检查",
    ),
    SkillOut(
        name="传动扭矩异常排查",
        version="v1.1",
        status="启用",
        hits=27,
        trigger="旋盖 / 扭矩升高 / 卡滞",
        tools="信号趋势 -> 图片巡检 -> 备件查询 -> 安全规程",
    ),
]

_tools: list[ToolOut] = [
    ToolOut(
        name="audio_spectrum_analyzer",
        type="音频工具",
        status="启用",
        success="96%",
        latency="1.8s",
        owner="Tool Runtime",
    ),
    ToolOut(
        name="manual_rag_search",
        type="手册检索",
        status="启用",
        success="99%",
        latency="0.4s",
        owner="Knowledge",
    ),
    ToolOut(
        name="failure_case_search",
        type="历史工单检索",
        status="启用",
        success="98%",
        latency="0.6s",
        owner="Memory",
    ),
    ToolOut(
        name="visual_inspection_mock",
        type="视觉巡检",
        status="演示",
        success="100%",
        latency="0.2s",
        owner="Demo",
    ),
]

_memory: list[MemorySourceOut] = [
    MemorySourceOut(name="设备手册", count="18 份", status="已索引", detail="PDF、IOM、点检规范"),
    MemorySourceOut(name="历史工单", count="1,284 条", status="已同步", detail="维修结果、备件、停机时长"),
    MemorySourceOut(name="老师傅经验", count="76 条", status="待审核 5 条", detail="排查备注、现场判断规则"),
    MemorySourceOut(name="设备档案", count="46 台", status="已接入", detail="型号、安装日期、关键部件"),
]

_equipment: list[EquipmentOut] = [
    EquipmentOut(
        id="EQ-204",
        name="Bottle Filler / M-204",
        equipment_type="灌装机驱动电机",
        location="一号产线 / 灌装段",
        owner="张工",
        criticality="高",
        status="运行中",
        linked_skills=3,
    ),
    EquipmentOut(
        id="EQ-101",
        name="Source Pump / P-101",
        equipment_type="离心泵",
        location="一号产线 / 供液段",
        owner="李工",
        criticality="中",
        status="观察中",
        linked_skills=2,
    ),
    EquipmentOut(
        id="EQ-303",
        name="Bottle Capper / C-303",
        equipment_type="旋盖机",
        location="一号产线 / 封装段",
        owner="王工",
        criticality="中",
        status="运行中",
        linked_skills=2,
    ),
]


def _delete_by_attr(items: list, attr: str, value: str) -> None:
    for index, item in enumerate(items):
        if getattr(item, attr) == value:
            del items[index]
            return
    raise NotFoundError(f"MasterFix item not found: {value}")


@router.get("/diagnosis-tasks")
async def list_diagnosis_tasks():
    return ok([item.model_dump() for item in _tasks])


@router.post("/diagnosis-tasks")
async def create_diagnosis_task(body: DiagnosisTaskCreate):
    item = DiagnosisTaskOut(
        id=f"DT-{1001 + len(_tasks)}",
        symptoms=["异响", "温升"] if body.description else [],
        **body.model_dump(),
    )
    _tasks.insert(0, item)
    return created(item.model_dump())


@router.delete("/diagnosis-tasks/{task_id}")
async def delete_diagnosis_task(task_id: str):
    _delete_by_attr(_tasks, "id", task_id)
    return deleted()


@router.get("/work-orders")
async def list_work_orders():
    return ok([item.model_dump() for item in _work_orders])


@router.post("/work-orders")
async def create_work_order(body: MasterFixWorkOrderCreate):
    item = MasterFixWorkOrderOut(id=f"WO-{2410 + len(_work_orders)}", **body.model_dump())
    _work_orders.insert(0, item)
    return created(item.model_dump())


@router.delete("/work-orders/{work_order_id}")
async def delete_work_order(work_order_id: str):
    _delete_by_attr(_work_orders, "id", work_order_id)
    return deleted()


@router.get("/skills")
async def list_skills():
    return ok([item.model_dump() for item in _skills])


@router.post("/skills")
async def create_skill(body: SkillCreate):
    item = SkillOut(**body.model_dump())
    _skills.insert(0, item)
    return created(item.model_dump())


@router.delete("/skills/{skill_name}")
async def delete_skill(skill_name: str):
    _delete_by_attr(_skills, "name", skill_name)
    return deleted()


@router.get("/tools")
async def list_tools():
    return ok([item.model_dump() for item in _tools])


@router.post("/tools")
async def create_tool(body: ToolCreate):
    item = ToolOut(**body.model_dump())
    _tools.insert(0, item)
    return created(item.model_dump())


@router.delete("/tools/{tool_name}")
async def delete_tool(tool_name: str):
    _delete_by_attr(_tools, "name", tool_name)
    return deleted()


@router.post("/tools/test")
async def test_tool(body: ToolTestRequest):
    top_k = max(1, min(body.top_k, 10))
    snippets = [
        "手册第 7.2 节：异响伴随温升时先检查润滑状态。",
        "点检 SOP：补脂后需复测 15 分钟振动频谱。",
        "历史案例 WO-2318：同型号驱动电机最终确认为润滑不足。",
    ][:top_k]
    return ok(
        ToolTestResponse(
            result=f"返回 {len(snippets)} 条结果。查询词：{body.query}；范围：{body.source_scope}",
            snippets=snippets,
        ).model_dump()
    )


@router.get("/memory")
async def list_memory():
    return ok([item.model_dump() for item in _memory])


@router.post("/memory")
async def create_memory(body: MemorySourceCreate):
    item = MemorySourceOut(**body.model_dump())
    _memory.insert(0, item)
    return created(item.model_dump())


@router.delete("/memory/{memory_name}")
async def delete_memory(memory_name: str):
    _delete_by_attr(_memory, "name", memory_name)
    _memory_files.pop(memory_name, None)
    return deleted()


# Process-local file store: memory_name -> list of file dicts
_memory_files: dict[str, list[dict]] = {}

_MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB per file
_ALLOWED_MIME_PREFIXES = (
    "image/", "text/", "application/pdf",
    "application/json", "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument",
)


@router.post("/memory/{memory_name}/upload")
async def upload_memory_files(
    memory_name: str,
    files: List[UploadFile] = File(...),
):
    """Upload one or more files attached to a Memory source.

    Stores file bytes (base64-encoded) in the process-local ``_memory_files``
    dict so the detail endpoint can serve them back without a database.
    Suitable for the hackathon demo; swap for object storage in production.
    """
    stored = []
    for upload in files:
        content = await upload.read()
        if len(content) > _MAX_FILE_SIZE:
            continue  # silently skip oversized files in the demo
        stored.append(
            {
                "filename": upload.filename or "unknown",
                "content_type": upload.content_type or "application/octet-stream",
                "size": len(content),
                "content_b64": base64.b64encode(content).decode(),
            }
        )
    if stored:
        _memory_files[memory_name] = stored
        # Update count + status on the in-memory record
        for item in _memory:
            if item.name == memory_name:
                item.count = f"{len(stored)} 份"
                item.status = "已索引"
                break
    return ok({"uploaded": len(stored)})


@router.get("/memory/{memory_name}/files")
async def list_memory_files(memory_name: str):
    """Return all files (with base64 content) for a Memory source."""
    files = _memory_files.get(memory_name, [])
    return ok([MemoryFileInfo(**f).model_dump() for f in files])


@router.get("/equipment")
async def list_equipment():
    return ok([item.model_dump() for item in _equipment])


@router.post("/equipment")
async def create_equipment(body: EquipmentCreate):
    item = EquipmentOut(id=f"EQ-{400 + len(_equipment)}", **body.model_dump())
    _equipment.insert(0, item)
    return created(item.model_dump())


@router.delete("/equipment/{equipment_id}")
async def delete_equipment(equipment_id: str):
    _delete_by_attr(_equipment, "id", equipment_id)
    return deleted()
