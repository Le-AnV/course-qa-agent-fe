import { AUTH_TOKEN_KEY } from "@/components/ui/nav-config";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type SkillLevel = "NOVICE" | "BEGINNER" | "COMPETENT" | "PROFICIENT" | "MASTER";

export type SkillLevelRubric = {
  id: string;
  skill_id: string;
  level: SkillLevel;
  description: string;
  threshold_pct: number;
  created_at: string;
  updated_at: string;
};

export type Skill = {
  id: string;
  class_id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  rubrics: SkillLevelRubric[];
};

export type SkillCreatePayload = {
  code: string;
  name: string;
  category?: string;
  description?: string;
  rubrics?: {
    level: SkillLevel;
    description: string;
    threshold_pct?: number;
  }[];
};

export type RubricUpdatePayload = {
  description: string;
  threshold_pct?: number;
};

function token(): string | null {
  return typeof window === "undefined" ? null : window.localStorage.getItem(AUTH_TOKEN_KEY);
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body?.detail || `Request failed with status ${res.status}`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return res.json() as Promise<T>;
}

export const skillApi = {
  async listClassSkills(classId: string, category?: string): Promise<Skill[]> {
    const auth = token();
    const url = new URL(`${API_URL}/api/classes/${classId}/skills`);
    if (category) url.searchParams.set("category", category);

    const res = await fetch(url.toString(), {
      headers: auth ? { Authorization: `Bearer ${auth}` } : {},
    });
    return handleResponse<Skill[]>(res);
  },

  async createClassSkill(classId: string, payload: SkillCreatePayload): Promise<Skill> {
    const auth = token();
    const res = await fetch(`${API_URL}/api/classes/${classId}/skills`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<Skill>(res);
  },

  async updateClassRubric(
    classId: string,
    skillId: string,
    level: SkillLevel,
    payload: RubricUpdatePayload
  ): Promise<SkillLevelRubric> {
    const auth = token();
    const res = await fetch(
      `${API_URL}/api/classes/${classId}/skills/${skillId}/rubrics/${level}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        },
        body: JSON.stringify(payload),
      }
    );
    return handleResponse<SkillLevelRubric>(res);
  },

  async autoGenerateSkills(classId: string): Promise<Skill[]> {
    const auth = token();
    const res = await fetch(`${API_URL}/api/classes/${classId}/skills/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      },
    });
    return handleResponse<Skill[]>(res);
  },
};
