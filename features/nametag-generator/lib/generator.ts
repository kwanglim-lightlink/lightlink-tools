import JSZip from "jszip";
import type { GenerationInput, PersonData } from "../types";

const A4_WIDTH = 2480;
const A4_HEIGHT = 3508;
const DPI = 300;

type Placement = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
};

function mmToPixels(mm: number) {
  return Math.round((mm * DPI) / 25.4);
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("이미지를 PNG 파일로 변환하지 못했습니다."));
    }, "image/png");
  });
}

function loadFileImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`${file.name} 이미지를 읽을 수 없습니다.`));
    };
    image.src = objectUrl;
  });
}

function safeFilename(value: string) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim();
}

function randomItem<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

async function drawNametag(
  person: PersonData,
  background: CanvasImageSource,
  width: number,
  height: number,
  isStudent: boolean,
) {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("이미지 캔버스를 만들 수 없습니다.");

  context.drawImage(background, 0, 0, width, height);
  context.fillStyle = "#000000";
  context.textBaseline = "middle";
  context.imageSmoothingEnabled = true;

  const nameSize = isStudent ? 100 : 180;
  const churchSize = isStudent ? 44 : 64;
  const detailSize = isStudent ? 60 : 120;
  const centerX = width / 2;
  const centerY = height / 2;
  const hasChurch = Boolean(person.교회.trim());

  if (hasChurch) {
    context.font = `500 ${churchSize}px Pretendard, sans-serif`;
    context.textAlign = "left";
    context.fillText(
      person.교회,
      isStudent ? width * 0.1 : width * 0.15,
      isStudent ? centerY - 60 : centerY - 160,
    );

    context.font = `700 ${nameSize}px Pretendard, sans-serif`;
    context.textAlign = "center";
    context.fillText(
      person.성명,
      centerX,
      isStudent ? centerY + 20 : centerY + 40,
    );

    context.font = `500 ${detailSize}px Pretendard, sans-serif`;
    context.fillText(
      person["나이/학년/직책"],
      centerX,
      isStudent ? centerY + 120 : centerY + 200,
    );
  } else {
    context.font = `700 ${nameSize}px Pretendard, sans-serif`;
    context.textAlign = "center";
    context.fillText(
      person.성명,
      centerX,
      isStudent ? centerY - 20 : centerY + 10,
    );

    context.font = `500 ${detailSize}px Pretendard, sans-serif`;
    context.fillText(
      person["나이/학년/직책"],
      centerX,
      isStudent ? centerY + 80 : centerY + 170,
    );
  }

  return canvas;
}

function packNametags(
  nametagWidth: number,
  nametagHeight: number,
  availableWidth: number,
  availableHeight: number,
  count: number,
  spacing: number,
) {
  const placements: Placement[] = [];
  const candidates = [{ x: 0, y: 0 }];

  const overlaps = (candidate: Placement) =>
    placements.some(
      (placed) =>
        !(
          candidate.x >= placed.x + placed.width + spacing ||
          candidate.x + candidate.width + spacing <= placed.x ||
          candidate.y >= placed.y + placed.height + spacing ||
          candidate.y + candidate.height + spacing <= placed.y
        ),
    );

  while (placements.length < count) {
    let best: Placement | null = null;

    for (const point of candidates) {
      for (const orientation of [
        { width: nametagWidth, height: nametagHeight, rotated: false },
        { width: nametagHeight, height: nametagWidth, rotated: true },
      ]) {
        const candidate = { ...point, ...orientation };
        const fits =
          candidate.x + candidate.width <= availableWidth &&
          candidate.y + candidate.height <= availableHeight;

        if (!fits || overlaps(candidate)) continue;
        if (
          !best ||
          candidate.y < best.y ||
          (candidate.y === best.y && candidate.x < best.x)
        ) {
          best = candidate;
        }
      }
    }

    if (!best) break;
    placements.push(best);
    candidates.push(
      { x: best.x + best.width + spacing, y: best.y },
      { x: best.x, y: best.y + best.height + spacing },
    );
    candidates.sort((a, b) => a.y - b.y || a.x - b.x);
  }

  return placements;
}

async function generateA4Pages({
  people,
  templates,
  widthMm,
  isStudent,
  onPage,
}: {
  people: PersonData[];
  templates: File[];
  widthMm: number;
  isStudent: boolean;
  onPage: () => void;
}) {
  if (people.length === 0) return [];

  const loadedTemplates = await Promise.all(templates.map(loadFileImage));
  const aspectRatio = loadedTemplates[0].height / loadedTemplates[0].width;
  const nametagWidth = mmToPixels(widthMm);
  const nametagHeight = Math.round(nametagWidth * aspectRatio);
  const margin = mmToPixels(10);
  const spacing = mmToPixels(2);
  const border = mmToPixels(1);
  const availableWidth = A4_WIDTH - margin * 2;
  const availableHeight = A4_HEIGHT - margin * 2;
  const total = people.length + (isStudent ? 10 : 0);
  const pages: Blob[] = [];
  let processed = 0;

  while (processed < total) {
    const placements = packNametags(
      nametagWidth,
      nametagHeight,
      availableWidth,
      availableHeight,
      total - processed,
      spacing,
    );

    if (placements.length === 0) {
      throw new Error(
        "설정한 이름표 크기가 A4 출력 영역보다 큽니다. 너비를 줄여 주세요.",
      );
    }

    const page = createCanvas(A4_WIDTH, A4_HEIGHT);
    const context = page.getContext("2d");
    if (!context) throw new Error("A4 캔버스를 만들 수 없습니다.");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

    context.strokeStyle = "#e0e0e0";
    context.lineWidth = 0.5;
    const gridColumns = Math.floor(
      availableWidth / (nametagWidth + spacing),
    );
    const gridRows = Math.floor(
      availableHeight / (nametagHeight + spacing),
    );

    for (let row = 0; row <= gridRows; row += 1) {
      const y = margin + row * (nametagHeight + spacing);
      context.beginPath();
      context.moveTo(margin, y);
      context.lineTo(A4_WIDTH - margin, y);
      context.stroke();
    }
    for (let column = 0; column <= gridColumns; column += 1) {
      const x = margin + column * (nametagWidth + spacing);
      context.beginPath();
      context.moveTo(x, margin);
      context.lineTo(x, A4_HEIGHT - margin);
      context.stroke();
    }

    for (let index = 0; index < placements.length; index += 1) {
      const placement = placements[index];
      const itemIndex = processed + index;
      const x = margin + placement.x;
      const y = margin + placement.y;
      const imageX = x + border;
      const imageY = y + border;
      const imageWidth = placement.width - border * 2;
      const imageHeight = placement.height - border * 2;
      const template = randomItem(loadedTemplates);
      let image: CanvasImageSource = template;

      if (itemIndex < people.length) {
        image = await drawNametag(
          people[itemIndex],
          template,
          template.width,
          template.height,
          isStudent,
        );
      }

      context.strokeStyle = "#888888";
      context.lineWidth = 1;
      context.strokeRect(x, y, placement.width, placement.height);
      context.strokeStyle = "#000000";
      context.strokeRect(
        imageX,
        imageY,
        imageWidth,
        imageHeight,
      );

      if (placement.rotated) {
        context.save();
        context.translate(
          imageX + imageWidth / 2,
          imageY + imageHeight / 2,
        );
        context.rotate(Math.PI / 2);
        context.drawImage(
          image,
          -imageHeight / 2,
          -imageWidth / 2,
          imageHeight,
          imageWidth,
        );
        context.restore();
      } else {
        context.drawImage(image, imageX, imageY, imageWidth, imageHeight);
      }
    }

    pages.push(await canvasToBlob(page));
    processed += placements.length;
    onPage();
  }

  return pages;
}

export async function generateNametagArchive({
  people,
  bigTemplates,
  smallTemplates,
  options,
  onProgress,
}: GenerationInput) {
  const students = people.filter((person) => person["학생 여부"] === "T");
  const nonStudents = people.filter((person) => person["학생 여부"] !== "T");

  if (students.length > 0 && smallTemplates.length === 0) {
    throw new Error("학생 데이터가 있어 작은 이름표 이미지가 필요합니다.");
  }
  if (nonStudents.length > 0 && bigTemplates.length === 0) {
    throw new Error("일반 데이터가 있어 큰 이름표 이미지가 필요합니다.");
  }

  await document.fonts.ready;
  await document.fonts.load("700 100px Pretendard", "이름표");

  const zip = new JSZip();
  onProgress?.(10, "이름표 배경을 불러오는 중...");

  if (options.arrangedLayout) {
    let completedPages = 0;
    const advancePage = () => {
      completedPages += 1;
      onProgress?.(
        Math.min(85, 30 + completedPages * 10),
        `A4 페이지 ${completedPages}장을 만들었습니다.`,
      );
    };

    const studentPages = await generateA4Pages({
      people: students,
      templates: smallTemplates,
      widthMm: options.studentWidthMm,
      isStudent: true,
      onPage: advancePage,
    });
    const nonStudentPages = await generateA4Pages({
      people: nonStudents,
      templates: bigTemplates,
      widthMm: options.nonStudentWidthMm,
      isStudent: false,
      onPage: advancePage,
    });

    studentPages.forEach((page, index) => {
      zip.file(`A4_학생_${index + 1}.png`, page);
    });
    nonStudentPages.forEach((page, index) => {
      zip.file(`A4_일반_${index + 1}.png`, page);
    });
  } else {
    const loadedBigTemplates = await Promise.all(
      bigTemplates.map(loadFileImage),
    );
    const loadedSmallTemplates = await Promise.all(
      smallTemplates.map(loadFileImage),
    );
    const filenameCounts = new Map<string, number>();

    for (let index = 0; index < people.length; index += 1) {
      const person = people[index];
      const isStudent = person["학생 여부"] === "T";
      const template = randomItem(
        isStudent ? loadedSmallTemplates : loadedBigTemplates,
      );
      const nametag = await drawNametag(
        person,
        template,
        template.width,
        template.height,
        isStudent,
      );
      const church = person.교회 ? `_${safeFilename(person.교회)}` : "";
      const basename = `${safeFilename(person.성명)}${church}_${isStudent ? "small" : "big"}`;
      const duplicateIndex = filenameCounts.get(basename) ?? 0;
      filenameCounts.set(basename, duplicateIndex + 1);
      const filename =
        duplicateIndex === 0 ? `${basename}.png` : `${basename}_${duplicateIndex + 1}.png`;
      zip.file(
        filename,
        await canvasToBlob(nametag),
      );
      onProgress?.(
        15 + Math.round(((index + 1) / people.length) * 70),
        `이름표를 만드는 중... (${index + 1}/${people.length})`,
      );
    }
  }

  onProgress?.(90, "ZIP 파일을 압축하는 중...");
  const archive = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  onProgress?.(100, "다운로드 준비 완료");
  return archive;
}

export function downloadArchive(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "LFC_교육_선교_이름표.zip";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
