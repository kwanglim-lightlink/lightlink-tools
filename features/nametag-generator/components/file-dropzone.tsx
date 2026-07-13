"use client";

import { FileSpreadsheet, ImageIcon, UploadCloud, X } from "lucide-react";
import { useDropzone, type Accept } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FileDropzoneProps = {
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept: Accept;
  multiple?: boolean;
  kind: "image" | "excel";
  prompt: string;
};

export function FileDropzone({
  files,
  onFilesChange,
  accept,
  multiple = true,
  kind,
  prompt,
}: FileDropzoneProps) {
  const dropzone = useDropzone({
    accept,
    multiple,
    onDrop: (acceptedFiles) => {
      onFilesChange(multiple ? [...files, ...acceptedFiles] : acceptedFiles.slice(0, 1));
    },
  });
  const Icon = kind === "image" ? ImageIcon : FileSpreadsheet;

  return (
    <div className="space-y-3">
      <div
        {...dropzone.getRootProps()}
        className={cn(
          "group grid min-h-36 cursor-pointer place-items-center rounded-xl border border-dashed border-black/10 bg-[#fafaf8] p-5 text-center transition-colors hover:border-black/15 hover:bg-[#f7f6f2]",
          dropzone.isDragActive && "border-primary/30 bg-primary/[0.035]",
        )}
      >
        <input {...dropzone.getInputProps()} />
        <div>
          <span className="mx-auto mb-3 grid size-10 place-items-center rounded-lg bg-secondary text-muted-foreground transition-colors group-hover:text-primary">
            {dropzone.isDragActive ? (
              <UploadCloud className="size-5" />
            ) : (
              <Icon className="size-5" />
            )}
          </span>
          <p className="text-sm font-semibold">
            {dropzone.isDragActive ? "여기에 놓아주세요" : prompt}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            클릭하거나 파일을 끌어오세요
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <ul className="space-y-2" aria-label="선택한 파일">
          {files.map((file, index) => (
            <li
              className="flex items-center gap-3 rounded-lg bg-[#f7f6f2] px-3 py-2"
              key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
            >
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm">
                {file.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive"
                onClick={(event) => {
                  event.stopPropagation();
                  onFilesChange(files.filter((_, fileIndex) => fileIndex !== index));
                }}
                aria-label={`${file.name} 삭제`}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
