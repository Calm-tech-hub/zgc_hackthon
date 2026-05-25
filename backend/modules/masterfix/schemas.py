"""Schemas for the MasterFix management demo API."""

from __future__ import annotations

from pydantic import BaseModel, Field


class DiagnosisTaskCreate(BaseModel):
    equipment: str
    description: str
    audio: str = ""
    image: str = ""


class DiagnosisTaskOut(DiagnosisTaskCreate):
    id: str
    status: str = "待复核"
    symptoms: list[str] = Field(default_factory=list)


class MasterFixWorkOrderCreate(BaseModel):
    title: str
    equipment: str
    owner: str = "未分配"
    priority: str = "中"
    skill: str = "未关联"


class MasterFixWorkOrderOut(MasterFixWorkOrderCreate):
    id: str
    status: str = "待派工"


class SkillCreate(BaseModel):
    name: str
    trigger: str
    tools: str


class SkillOut(SkillCreate):
    version: str = "v0.1"
    status: str = "待审核"
    hits: int = 0


class ToolCreate(BaseModel):
    name: str
    type: str
    owner: str = "Tool Runtime"


class ToolOut(ToolCreate):
    status: str = "演示"
    success: str = "100%"
    latency: str = "0.1s"


class MemorySourceCreate(BaseModel):
    name: str
    count: str = "1 份"
    detail: str


class MemorySourceOut(MemorySourceCreate):
    status: str = "待索引"


class EquipmentCreate(BaseModel):
    name: str
    equipment_type: str
    location: str
    owner: str = "未分配"
    criticality: str = "中"


class EquipmentOut(EquipmentCreate):
    id: str
    status: str = "运行中"
    linked_skills: int = 0


class ToolTestRequest(BaseModel):
    query: str
    top_k: int = 3
    source_scope: str = "manual+sop"


class ToolTestResponse(BaseModel):
    result: str
    snippets: list[str]


class MemoryFileInfo(BaseModel):
    filename: str
    content_type: str
    size: int
    content_b64: str
