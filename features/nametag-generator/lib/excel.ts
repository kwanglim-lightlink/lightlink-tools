import * as XLSX from "xlsx";
import type { PersonData } from "../types";

const REQUIRED_COLUMNS = ["성명", "나이/학년/직책", "학생 여부"] as const;

function text(value: unknown) {
  return value == null ? "" : String(value).trim();
}

export async function parsePeopleFile(file: File): Promise<PersonData[]> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("엑셀 파일에 시트가 없습니다.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
  });

  if (rows.length === 0) {
    throw new Error("엑셀 파일에 이름표 데이터가 없습니다.");
  }

  const missingColumns = REQUIRED_COLUMNS.filter(
    (column) => !Object.prototype.hasOwnProperty.call(rows[0], column),
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `필수 열이 없습니다: ${missingColumns.join(", ")}. 첫 행의 제목을 확인해 주세요.`,
    );
  }

  const errors: string[] = [];
  const people = rows.map((row, index) => {
    const person: PersonData = {
      성명: text(row.성명),
      교회: text(row.교회),
      "나이/학년/직책": text(row["나이/학년/직책"]),
      "학생 여부": text(row["학생 여부"]).toUpperCase(),
    };

    const rowNumber = index + 2;
    if (!person.성명) errors.push(`${rowNumber}번째 줄: 성명이 비어있습니다.`);
    if (!person["나이/학년/직책"]) {
      errors.push(`${rowNumber}번째 줄: 나이/학년/직책이 비어있습니다.`);
    }
    if (!person["학생 여부"]) {
      errors.push(`${rowNumber}번째 줄: 학생 여부가 비어있습니다.`);
    }

    return person;
  });

  if (errors.length > 0) {
    throw new Error(`엑셀 파일에 오류가 있습니다:\n${errors.join("\n")}`);
  }

  return people;
}
