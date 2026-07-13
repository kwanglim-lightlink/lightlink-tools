export type PersonData = {
  성명: string;
  교회: string;
  "나이/학년/직책": string;
  "학생 여부": string;
};

export type GenerationOptions = {
  arrangedLayout: boolean;
  studentWidthMm: number;
  nonStudentWidthMm: number;
};

export type GenerationInput = {
  people: PersonData[];
  bigTemplates: File[];
  smallTemplates: File[];
  options: GenerationOptions;
  onProgress?: (value: number, message: string) => void;
};
