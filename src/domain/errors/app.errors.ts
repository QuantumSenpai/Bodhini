export type AppErrorCode =
  | "PERMISSION_DENIED"
  | "IMAGE_UNREADABLE"
  | "EXTRACTION_FAILED"
  | "FORM_ANALYSIS_FAILED"
  | "DOCUMENT_NOT_FOUND"
  | "STORAGE_FAILED"
  | "MATCHING_FAILED"
  | "EXPORT_FAILED"
  | "UNSUPPORTED_INPUT"
  | "MODEL_UNAVAILABLE";

export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message?: string) {
    super(message ?? code);
    this.name = "AppError";
    this.code = code;
  }
}
