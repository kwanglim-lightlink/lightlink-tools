"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  Info,
  LockKeyhole,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FileDropzone } from "./file-dropzone";
import { parsePeopleFile } from "../lib/excel";
import { downloadArchive, generateNametagArchive } from "../lib/generator";

const IMAGE_ACCEPT = {
  "image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp"],
};

const EXCEL_ACCEPT = {
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "application/vnd.ms-excel": [".xls"],
};

export function NametagGenerator() {
  const [bigTemplates, setBigTemplates] = useState<File[]>([]);
  const [smallTemplates, setSmallTemplates] = useState<File[]>([]);
  const [excelFiles, setExcelFiles] = useState<File[]>([]);
  const [arrangedLayout, setArrangedLayout] = useState(false);
  const [studentWidthMm, setStudentWidthMm] = useState(83);
  const [nonStudentWidthMm, setNonStudentWidthMm] = useState(95);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    const excelFile = excelFiles[0];
    if (!excelFile) {
      setError("엑셀 파일을 선택해 주세요.");
      return;
    }
    if (bigTemplates.length === 0 && smallTemplates.length === 0) {
      setError("큰 이름표 또는 작은 이름표 이미지를 선택해 주세요.");
      return;
    }
    if (
      arrangedLayout &&
      (studentWidthMm < 50 ||
        studentWidthMm > 150 ||
        nonStudentWidthMm < 50 ||
        nonStudentWidthMm > 150)
    ) {
      setError("이름표 너비는 50mm에서 150mm 사이여야 합니다.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(2);
    setProgressMessage("엑셀 파일을 확인하는 중...");

    try {
      const people = await parsePeopleFile(excelFile);
      const archive = await generateNametagArchive({
        people,
        bigTemplates,
        smallTemplates,
        options: {
          arrangedLayout,
          studentWidthMm,
          nonStudentWidthMm,
        },
        onProgress: (value, message) => {
          setProgress(value);
          setProgressMessage(message);
        },
      });
      downloadArchive(archive);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "이름표 생성 중 오류가 발생했습니다.",
      );
      setProgress(0);
      setProgressMessage("");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f6f3]">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-7">
          <Link href="/">
            <ArrowLeft className="size-4" />
            도구 모음
          </Link>
        </Button>

        <div className="mb-8">
          <p className="mb-2 text-xs font-bold tracking-[0.14em] text-primary">
            LIGHTLINK TOOLS
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            국내선교 이름표 생성기
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            이름표 배경과 엑셀 명단을 넣으면 인쇄용 파일을 한 번에 만들어요.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
            <LockKeyhole className="size-3.5" />
            모든 파일은 이 브라우저 안에서만 처리됩니다
          </div>
        </div>

        <details className="group mb-6 rounded-2xl border border-black/[0.06] bg-card shadow-[0_1px_2px_rgba(32,32,42,0.025)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold">
            <span className="flex items-center gap-2">
              <Info className="size-4 text-primary" />
              사용법과 엑셀 파일 형식
            </span>
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="rounded-b-2xl bg-[#fafaf8] px-5 py-5 text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-5">
              <li>학생용 작은 이름표와 일반용 큰 이름표 배경을 선택합니다.</li>
              <li>
                첫 행이 <strong>성명, 교회, 나이/학년/직책, 학생 여부</strong>인
                엑셀 파일을 선택합니다.
              </li>
              <li>
                학생 여부가 <strong>T</strong>이면 작은 이름표, 그 외에는 큰
                이름표를 사용합니다. 교회만 비워둘 수 있습니다.
              </li>
              <li>필요하면 A4 배치 옵션을 켠 뒤 이름표를 생성합니다.</li>
            </ol>

            <div className="mt-6">
              <h2 className="mb-3 font-semibold text-foreground">
                엑셀 파일 예시
              </h2>
              <div className="overflow-x-auto rounded-xl border border-black/[0.05] bg-white">
                <table className="w-full min-w-140 border-collapse text-left text-xs">
                  <thead className="bg-[#efeee9] text-foreground">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">성명</th>
                      <th className="px-3 py-2.5 font-semibold">교회</th>
                      <th className="px-3 py-2.5 font-semibold">
                        나이/학년/직책
                      </th>
                      <th className="px-3 py-2.5 font-semibold">학생 여부</th>
                    </tr>
                  </thead>
                  <tbody className="bg-background">
                    <tr>
                      <td className="px-3 py-2.5">김철수</td>
                      <td className="px-3 py-2.5">사랑의 교회</td>
                      <td className="px-3 py-2.5">중2</td>
                      <td className="px-3 py-2.5">T</td>
                    </tr>
                    <tr className="bg-[#f8f7f4]">
                      <td className="px-3 py-2.5">박영희</td>
                      <td className="px-3 py-2.5">광림교회</td>
                      <td className="px-3 py-2.5">선생님</td>
                      <td className="px-3 py-2.5">F</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-7 pt-1">
              <h2 className="mb-4 font-semibold text-foreground">결과 예시</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <figure className="rounded-2xl bg-white p-3 shadow-[0_1px_8px_rgba(32,32,42,0.035)]">
                  <div className="relative aspect-3/4 overflow-hidden rounded-lg bg-secondary">
                    <Image
                      src="/examples/sample_big.png"
                      alt="일반용 큰 이름표 생성 결과"
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-contain"
                    />
                  </div>
                  <figcaption className="mt-2 text-center text-xs">
                    큰 이름표
                  </figcaption>
                </figure>
                <figure className="rounded-2xl bg-white p-3 shadow-[0_1px_8px_rgba(32,32,42,0.035)]">
                  <div className="relative aspect-10/7 overflow-hidden rounded-lg bg-secondary">
                    <Image
                      src="/examples/sample_small.png"
                      alt="학생용 작은 이름표 생성 결과"
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-contain"
                    />
                  </div>
                  <figcaption className="mt-2 text-center text-xs">
                    작은 이름표
                  </figcaption>
                </figure>
                <figure className="rounded-2xl bg-white p-3 shadow-[0_1px_8px_rgba(32,32,42,0.035)]">
                  <div className="relative aspect-3/4 overflow-hidden rounded-lg bg-secondary">
                    <Image
                      src="/examples/sample_a4_big.png"
                      alt="A4 용지에 배치한 큰 이름표 결과"
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-contain"
                    />
                  </div>
                  <figcaption className="mt-2 text-center text-xs">
                    A4 큰 이름표 배치
                  </figcaption>
                </figure>
                <figure className="rounded-2xl bg-white p-3 shadow-[0_1px_8px_rgba(32,32,42,0.035)]">
                  <div className="relative aspect-3/4 overflow-hidden rounded-lg bg-secondary">
                    <Image
                      src="/examples/sample_a4_small.png"
                      alt="A4 용지에 배치한 작은 이름표 결과"
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-contain"
                    />
                  </div>
                  <figcaption className="mt-2 text-center text-xs">
                    A4 작은 이름표 배치
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </details>

        <div className="grid gap-5 md:grid-cols-2">
          <Card className="border-black/[0.06] shadow-[0_1px_2px_rgba(32,32,42,0.025)]">
            <CardHeader>
              <CardTitle>큰 이름표</CardTitle>
              <CardDescription>일반 참여자용 배경 이미지</CardDescription>
            </CardHeader>
            <CardContent>
              <FileDropzone
                files={bigTemplates}
                onFilesChange={setBigTemplates}
                accept={IMAGE_ACCEPT}
                kind="image"
                prompt="큰 이름표 이미지 선택"
              />
            </CardContent>
          </Card>

          <Card className="border-black/[0.06] shadow-[0_1px_2px_rgba(32,32,42,0.025)]">
            <CardHeader>
              <CardTitle>작은 이름표</CardTitle>
              <CardDescription>학생 참여자용 배경 이미지</CardDescription>
            </CardHeader>
            <CardContent>
              <FileDropzone
                files={smallTemplates}
                onFilesChange={setSmallTemplates}
                accept={IMAGE_ACCEPT}
                kind="image"
                prompt="작은 이름표 이미지 선택"
              />
            </CardContent>
          </Card>
        </div>

        <Card className="mt-5 border-black/[0.06] shadow-[0_1px_2px_rgba(32,32,42,0.025)]">
          <CardHeader>
            <CardTitle>엑셀 명단</CardTitle>
            <CardDescription>
              XLSX 또는 XLS 파일 한 개를 선택해 주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileDropzone
              files={excelFiles}
              onFilesChange={setExcelFiles}
              accept={EXCEL_ACCEPT}
              multiple={false}
              kind="excel"
              prompt="엑셀 파일 선택"
            />
          </CardContent>
        </Card>

        <Card className="mt-5 border-black/[0.06] shadow-[0_1px_2px_rgba(32,32,42,0.025)]">
          <CardHeader>
            <CardTitle>출력 방식</CardTitle>
            <CardDescription>
              개별 PNG 파일 또는 A4 배치 파일로 만들 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-3">
              <Checkbox
                id="arranged-layout"
                checked={arrangedLayout}
                onCheckedChange={(checked) => setArrangedLayout(checked === true)}
              />
              <Label htmlFor="arranged-layout" className="cursor-pointer">
                A4 용지에 배치하기
              </Label>
            </div>

            {arrangedLayout && (
              <div className="grid gap-4 rounded-xl bg-secondary/60 p-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="student-width">학생 이름표 너비 (mm)</Label>
                  <Input
                    id="student-width"
                    type="number"
                    min={50}
                    max={150}
                    value={studentWidthMm}
                    className="border-black/[0.08] bg-white shadow-none"
                    onChange={(event) =>
                      setStudentWidthMm(Number(event.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="non-student-width">
                    일반 이름표 너비 (mm)
                  </Label>
                  <Input
                    id="non-student-width"
                    type="number"
                    min={50}
                    max={150}
                    value={nonStudentWidthMm}
                    className="border-black/[0.08] bg-white shadow-none"
                    onChange={(event) =>
                      setNonStudentWidthMm(Number(event.target.value))
                    }
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div
            className="mt-5 flex gap-3 rounded-xl border border-destructive/10 bg-destructive/5 p-4 text-sm text-destructive"
            role="alert"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <div className="whitespace-pre-line">{error}</div>
          </div>
        )}

        {isGenerating && (
          <div className="mt-5 rounded-xl border border-black/[0.06] bg-card p-5">
            <div className="mb-3 flex items-center justify-between gap-4 text-sm">
              <span>{progressMessage}</span>
              <span className="font-bold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        <Button
          size="lg"
          className="mt-6 w-full"
          disabled={isGenerating}
          onClick={generate}
        >
          <Download className="size-4" />
          {isGenerating ? "이름표 생성 중..." : "이름표 생성하기"}
        </Button>
      </div>
    </main>
  );
}
