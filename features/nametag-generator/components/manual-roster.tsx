"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { ManualPersonRow } from "../types";
import { createManualRow } from "../lib/manual";

type ManualRosterProps = {
  rows: ManualPersonRow[];
  onRowsChange: (rows: ManualPersonRow[]) => void;
};

const GRID_COLUMNS =
  "grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)_3rem_2.25rem] items-center gap-2";

export function ManualRoster({ rows, onRowsChange }: ManualRosterProps) {
  const updateRow = (id: string, patch: Partial<ManualPersonRow>) => {
    onRowsChange(
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <div className="min-w-130 space-y-2">
          <div
            className={`${GRID_COLUMNS} px-1 text-xs font-semibold text-muted-foreground`}
          >
            <span>성명</span>
            <span>교회 (선택)</span>
            <span>나이/학년/직책</span>
            <span className="text-center">학생</span>
            <span aria-hidden />
          </div>

          {rows.map((row, index) => (
            <div className={GRID_COLUMNS} key={row.id}>
              <Input
                value={row.name}
                placeholder="김철수"
                aria-label={`${index + 1}번째 성명`}
                className="border-black/[0.08] bg-white shadow-none"
                onChange={(event) =>
                  updateRow(row.id, { name: event.target.value })
                }
              />
              <Input
                value={row.church}
                placeholder="사랑의 교회"
                aria-label={`${index + 1}번째 교회`}
                className="border-black/[0.08] bg-white shadow-none"
                onChange={(event) =>
                  updateRow(row.id, { church: event.target.value })
                }
              />
              <Input
                value={row.role}
                placeholder="중2, 선생님 등"
                aria-label={`${index + 1}번째 나이/학년/직책`}
                className="border-black/[0.08] bg-white shadow-none"
                onChange={(event) =>
                  updateRow(row.id, { role: event.target.value })
                }
              />
              <div className="flex justify-center">
                <Checkbox
                  checked={row.isStudent}
                  aria-label={`${index + 1}번째 학생 여부`}
                  onCheckedChange={(checked) =>
                    updateRow(row.id, { isStudent: checked === true })
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                disabled={rows.length === 1}
                aria-label={`${index + 1}번째 줄 삭제`}
                onClick={() =>
                  onRowsChange(rows.filter((other) => other.id !== row.id))
                }
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onRowsChange([...rows, createManualRow()])}
      >
        <Plus className="size-4" />
        사람 추가
      </Button>

      <p className="text-xs text-muted-foreground">
        학생에 체크하면 작은 이름표, 체크하지 않으면 큰 이름표로 만들어집니다.
      </p>
    </div>
  );
}
