import type { BodhiniServices } from "../domain/document/document.ports";
import { SQLiteDocumentRepository } from "../infrastructure/storage/sqlite-document-repository";
import { FieldMatcher } from "../infrastructure/matching/field-matcher";
import { CopyListBuilder } from "../infrastructure/export/copy-list-builder";
import { LocalDocumentValidator } from "../infrastructure/validation/document-validator";
import { OcrDocumentProcessor } from "../infrastructure/vision/ocr/OcrDocumentProcessor";
import { OcrFormAnalyzer } from "../infrastructure/vision/ocr/OcrFormAnalyzer";
import { ExpoSpeechVoiceService } from "../infrastructure/voice/ExpoSpeechVoiceService";

export const services: BodhiniServices = {
  documentProcessor: new OcrDocumentProcessor(),
  documentRepository: new SQLiteDocumentRepository("bodhini.db"),
  formAnalyzer: new OcrFormAnalyzer(),
  fieldMatcher: new FieldMatcher(),
  documentValidator: new LocalDocumentValidator(),
  formExporter: new CopyListBuilder(),
  voiceService: new ExpoSpeechVoiceService(),
};