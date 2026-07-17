import * as XLSX from "xlsx";
import type { TimetableData } from "../types";

function text(value: unknown) {
  return value == null ? "" : String(value).trim();
}

export async function parseTimetableFile(file: File): Promise<TimetableData> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("시간표 엑셀 파일에 시트가 없습니다.");
  }

  const grid = XLSX.utils
    .sheet_to_json<unknown[]>(workbook.Sheets[firstSheetName], {
      header: 1,
      defval: "",
      raw: false,
    })
    .map((row) => row.map(text))
    .filter((row) => row.some((cell) => cell));

  if (grid.length < 2) {
    throw new Error(
      "시간표 엑셀 파일에 데이터가 없습니다. 첫 행은 날짜, 첫 열은 시간이어야 합니다.",
    );
  }

  const header = grid[0];
  let columnCount = header.length;
  while (columnCount > 0 && !header[columnCount - 1]) {
    columnCount -= 1;
  }

  if (columnCount < 2) {
    throw new Error(
      "시간표에 날짜 열이 없습니다. 첫 행에 시간 제목과 날짜를 입력해 주세요.",
    );
  }

  const dayHeaders = header.slice(1, columnCount);
  const errors: string[] = [];
  const rows = grid.slice(1).map((row, index) => {
    const time = row[0] ?? "";
    if (!time) {
      errors.push(`${index + 2}번째 줄: 시간이 비어있습니다.`);
    }
    return {
      time,
      entries: dayHeaders.map((_, dayIndex) => row[dayIndex + 1] ?? ""),
    };
  });

  if (errors.length > 0) {
    throw new Error(`시간표 엑셀 파일에 오류가 있습니다:\n${errors.join("\n")}`);
  }

  return {
    timeHeader: header[0] || "시간",
    dayHeaders,
    rows,
  };
}
