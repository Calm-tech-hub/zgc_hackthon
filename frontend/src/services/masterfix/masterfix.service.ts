import { apiFetch } from "../../lib/api";

export interface DiagnosisTask {
    id: string;
    equipment: string;
    description: string;
    audio: string;
    image: string;
    status: string;
    symptoms: string[];
}

export interface MasterFixWorkOrder {
    id: string;
    title: string;
    equipment: string;
    owner: string;
    status: string;
    priority: string;
    skill: string;
}

export interface MasterFixSkill {
    name: string;
    version: string;
    status: string;
    hits: number;
    trigger: string;
    tools: string;
}

export interface MasterFixTool {
    name: string;
    type: string;
    status: string;
    success: string;
    latency: string;
    owner: string;
}

export interface MemorySource {
    name: string;
    count: string;
    status: string;
    detail: string;
}

export interface MemoryFile {
    filename: string;
    content_type: string;
    size: number;
    content_b64: string;
}

export interface MasterFixEquipment {
    id: string;
    name: string;
    equipment_type: string;
    location: string;
    owner: string;
    criticality: string;
    status: string;
    linked_skills: number;
}

export interface ToolTestResult {
    result: string;
    snippets: string[];
}

export const masterfixApi = {
    listTasks: () => apiFetch<DiagnosisTask[]>("/masterfix/diagnosis-tasks"),
    createTask: (body: Pick<DiagnosisTask, "equipment" | "description" | "audio" | "image">) =>
        apiFetch<DiagnosisTask>("/masterfix/diagnosis-tasks", { method: "POST", body }),
    deleteTask: (id: string) =>
        apiFetch<null>(`/masterfix/diagnosis-tasks/${encodeURIComponent(id)}`, {
            method: "DELETE",
        }),

    listWorkOrders: () => apiFetch<MasterFixWorkOrder[]>("/masterfix/work-orders"),
    createWorkOrder: (body: Omit<MasterFixWorkOrder, "id" | "status">) =>
        apiFetch<MasterFixWorkOrder>("/masterfix/work-orders", { method: "POST", body }),
    deleteWorkOrder: (id: string) =>
        apiFetch<null>(`/masterfix/work-orders/${encodeURIComponent(id)}`, { method: "DELETE" }),

    listSkills: () => apiFetch<MasterFixSkill[]>("/masterfix/skills"),
    createSkill: (body: Pick<MasterFixSkill, "name" | "trigger" | "tools">) =>
        apiFetch<MasterFixSkill>("/masterfix/skills", { method: "POST", body }),
    deleteSkill: (name: string) =>
        apiFetch<null>(`/masterfix/skills/${encodeURIComponent(name)}`, { method: "DELETE" }),

    listTools: () => apiFetch<MasterFixTool[]>("/masterfix/tools"),
    createTool: (body: Pick<MasterFixTool, "name" | "type" | "owner">) =>
        apiFetch<MasterFixTool>("/masterfix/tools", { method: "POST", body }),
    deleteTool: (name: string) =>
        apiFetch<null>(`/masterfix/tools/${encodeURIComponent(name)}`, { method: "DELETE" }),
    testTool: (body: { query: string; top_k: number; source_scope: string }) =>
        apiFetch<ToolTestResult>("/masterfix/tools/test", { method: "POST", body }),

    listMemory: () => apiFetch<MemorySource[]>("/masterfix/memory"),
    createMemory: (body: Pick<MemorySource, "name" | "count" | "detail">) =>
        apiFetch<MemorySource>("/masterfix/memory", { method: "POST", body }),
    deleteMemory: (name: string) =>
        apiFetch<null>(`/masterfix/memory/${encodeURIComponent(name)}`, { method: "DELETE" }),

    /** Upload actual files for a Memory source. Uses raw fetch (not JSON). */
    uploadMemoryFiles: async (memoryName: string, files: File[]): Promise<void> => {
        if (files.length === 0) return;
        const fd = new FormData();
        for (const f of files) fd.append("files", f);
        const res = await fetch(
            `/api/v1/masterfix/memory/${encodeURIComponent(memoryName)}/upload`,
            { method: "POST", credentials: "include", body: fd },
        );
        if (!res.ok) throw new Error(`File upload failed: ${res.status}`);
    },

    /** List uploaded files (with base64 content) for a Memory source. */
    listMemoryFiles: (name: string) =>
        apiFetch<MemoryFile[]>(`/masterfix/memory/${encodeURIComponent(name)}/files`),

    listEquipment: () => apiFetch<MasterFixEquipment[]>("/masterfix/equipment"),
    createEquipment: (
        body: Pick<
            MasterFixEquipment,
            "name" | "equipment_type" | "location" | "owner" | "criticality"
        >,
    ) => apiFetch<MasterFixEquipment>("/masterfix/equipment", { method: "POST", body }),
    deleteEquipment: (id: string) =>
        apiFetch<null>(`/masterfix/equipment/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
