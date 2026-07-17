export type PersonData = {
  성명: string;
  교회: string;
  "나이/학년/직책": string;
  "학생 여부": string;
};

export type ManualPersonRow = {
  id: string;
  name: string;
  church: string;
  role: string;
  isStudent: boolean;
};

export type GenerationOptions = {
  arrangedLayout: boolean;
  studentWidthMm: number;
  nonStudentWidthMm: number;
  studentSpareCount: number;
  nonStudentSpareCount: number;
};

export type TimetableData = {
  timeHeader: string;
  dayHeaders: string[];
  rows: {
    time: string;
    entries: string[];
  }[];
};

export type GenerationInput = {
  people: PersonData[];
  bigTemplates: File[];
  smallTemplates: File[];
  timetable?: TimetableData | null;
  options: GenerationOptions;
  onProgress?: (value: number, message: string) => void;
};
