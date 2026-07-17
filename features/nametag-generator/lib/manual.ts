import type { ManualPersonRow, PersonData } from "../types";

export function createManualRow(): ManualPersonRow {
  return {
    id: crypto.randomUUID(),
    name: "",
    church: "",
    role: "",
    isStudent: false,
  };
}

export function parseManualRows(rows: ManualPersonRow[]): PersonData[] {
  const errors: string[] = [];
  const people: PersonData[] = [];

  rows.forEach((row, index) => {
    const name = row.name.trim();
    const church = row.church.trim();
    const role = row.role.trim();

    if (!name && !church && !role) {
      return;
    }

    const rowNumber = index + 1;
    if (!name) errors.push(`${rowNumber}번째 줄: 성명이 비어있습니다.`);
    if (!role) {
      errors.push(`${rowNumber}번째 줄: 나이/학년/직책이 비어있습니다.`);
    }

    people.push({
      성명: name,
      교회: church,
      "나이/학년/직책": role,
      "학생 여부": row.isStudent ? "T" : "F",
    });
  });

  if (errors.length > 0) {
    throw new Error(`입력한 명단에 오류가 있습니다:\n${errors.join("\n")}`);
  }

  if (people.length === 0) {
    throw new Error("명단에 최소 한 명을 입력해 주세요.");
  }

  return people;
}
