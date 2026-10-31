import type {
  AppLanguage,
  DocumentAnalysis,
  DocumentConflict,
  DocumentRecord,
  ExtractedField,
  ValidationResult,
} from "./document.types";
import type {
  CopyItem,
  FilledField,
  FormField,
  FormInput,
} from "../form/form.types";

export interface DocumentProcessor {
  analyze(uri: string, language: AppLanguage): Promise<DocumentAnalysis>;
}

export interface DocumentRepository {
  save(document: DocumentRecord): Promise<void>;
  getAll(): Promise<DocumentRecord[]>;
  getById(id: string): Promise<DocumentRecord | null>;
  delete(id: string): Promise<void>;
}

export interface FormAnalyzer {
  analyze(input: FormInput): Promise<FormField[]>;
}

export interface FieldMatcher {
  match(fields: FormField[], docs: DocumentRecord[]): Promise<FilledField[]>;
}

export interface DocumentValidator {
  validate(field: ExtractedField): ValidationResult;
  crossCheck(docs: DocumentRecord[]): DocumentConflict[];
}

export interface FormExporter {
  buildCopyItems(fields: FilledField[]): CopyItem[];
}

export interface VoiceService {
  speak(text: string, language: AppLanguage): Promise<void>;
  playPrompt(id: string, language: AppLanguage): Promise<void>;
  stop(): void;
}

export interface BodhiniServices {
  documentProcessor: DocumentProcessor;
  documentRepository: DocumentRepository;
  formAnalyzer: FormAnalyzer;
  fieldMatcher: FieldMatcher;
  documentValidator: DocumentValidator;
  formExporter: FormExporter;
  voiceService: VoiceService;
}
