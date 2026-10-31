/// <reference types="node" />
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

import {
  DocumentRecord,
  ExtractedField,
} from "../src/domain/document/document.types";
import { FormField, FilledField } from "../src/domain/form/form.types";
import {
  SQLiteDocumentRepository,
  ISQLiteDatabase,
} from "../src/infrastructure/storage/sqlite-document-repository";
import { runSQLiteSmokeTest } from "../src/infrastructure/storage/sqlite-test-action";
import { FieldValidator } from "../src/infrastructure/validation/field-validator";
import { FieldMatcher } from "../src/infrastructure/matching/field-matcher";
import { CopyListBuilder } from "../src/infrastructure/export/copy-list-builder";

/**
 * Adapter implementing ISQLiteDatabase backed by Node 24's native DatabaseSync.
 * This runs against the exact SQLite C-engine to test real SQL queries,
 * foreign keys, transactions, and cascading deletions without native device dependencies.
 */
class NodeSQLiteTestAdapter implements ISQLiteDatabase {
  public db: DatabaseSync;
  public readonly databasePath: string;

  constructor(filePath: string) {
    this.databasePath = filePath;
    this.db = new DatabaseSync(filePath);
  }

  async execAsync(source: string): Promise<void> {
    this.db.exec(source);
  }

  async runAsync(source: string, ...params: any[]): Promise<any> {
    const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const stmt = this.db.prepare(source);
    return stmt.run(...flat);
  }

  async getAllAsync<T>(source: string, ...params: any[]): Promise<T[]> {
    const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const stmt = this.db.prepare(source);
    return stmt.all(...flat) as T[];
  }

  async getFirstAsync<T>(source: string, ...params: any[]): Promise<T | null> {
    const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const stmt = this.db.prepare(source);
    const row = stmt.get(...flat);
    return (row as T) || null;
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    this.db.exec("BEGIN TRANSACTION;");
    try {
      await task();
      this.db.exec("COMMIT;");
    } catch (err) {
      this.db.exec("ROLLBACK;");
      throw err;
    }
  }

  async closeAsync(): Promise<void> {
    this.db.close();
  }
}

describe("Backend B — Data Engine Synthetic Tests", () => {
  // --------------------------------------------------------------------------
  // 1. SQLiteDocumentRepository Tests
  // --------------------------------------------------------------------------
  describe("SQLiteDocumentRepository", () => {
    it("should save and retrieve a document with all reconstructed properties", async () => {
      const adapter = new NodeSQLiteTestAdapter(":memory:");
      const repo = new SQLiteDocumentRepository(adapter);

      const syntheticDoc: DocumentRecord = {
        id: "doc-aadhaar-001",
        type: "AADHAAR",
        imageUri: "file:///sandbox/docs/aadhaar-front.jpg",
        createdAt: 1793418000000,
        confirmedAt: 1793418300000,
        fields: [
          {
            id: "field-name-1",
            key: "FULL_NAME",
            label: "Name",
            value: "Anita Roy",
            confidence: 0.98,
            source: "OCR",
          },
          {
            id: "field-dob-1",
            key: "DOB",
            label: "Date of Birth",
            value: "1992-08-14",
            confidence: 0.95,
            source: "OCR",
          },
        ],
      };

      await repo.save(syntheticDoc);

      const retrieved = await repo.getById("doc-aadhaar-001");
      assert.ok(retrieved, "Document should be retrieved");
      if (!retrieved) throw new Error("Document not found");

      assert.equal(retrieved.id, "doc-aadhaar-001");
      assert.equal(retrieved.type, "AADHAAR");
      assert.equal(retrieved.imageUri, "file:///sandbox/docs/aadhaar-front.jpg");
      assert.equal(retrieved.createdAt, 1793418000000);
      assert.equal(retrieved.confirmedAt, 1793418300000);
      assert.equal(retrieved.fields.length, 2);

      const nameField = retrieved.fields.find((f) => f.key === "FULL_NAME");
      assert.ok(nameField);
      if (!nameField) throw new Error("Name field not found");

      assert.equal(nameField.id, "field-name-1");
      assert.equal(nameField.label, "Name");
      assert.equal(nameField.value, "Anita Roy");
      assert.equal(nameField.confidence, 0.98);
      assert.equal(nameField.source, "OCR");
    });

    it("should save multiple extracted fields and retrieve them via getAll()", async () => {
      const adapter = new NodeSQLiteTestAdapter(":memory:");
      const repo = new SQLiteDocumentRepository(adapter);

      const panDoc: DocumentRecord = {
        id: "doc-pan-002",
        type: "PAN",
        imageUri: "file:///sandbox/docs/pan-card.jpg",
        createdAt: 1793421600000,
        confirmedAt: 1793421720000,
        fields: [
          {
            id: "pan-f1",
            key: "FULL_NAME",
            label: "Name",
            value: "Anita Roy",
            confidence: 0.99,
            source: "OCR",
          },
          {
            id: "pan-f2",
            key: "PAN_NO",
            label: "Permanent Account Number",
            value: "ABCDE1234F",
            confidence: 0.99,
            source: "OCR",
          },
          {
            id: "pan-f3",
            key: "DOB",
            label: "DOB",
            value: "1992-08-14",
            confidence: 0.97,
            source: "OCR",
          },
        ],
      };

      await repo.save(panDoc);

      const allDocs = await repo.getAll();
      assert.equal(allDocs.length, 1);
      assert.equal(allDocs[0].fields.length, 3);
    });

    it("should enforce SQLite foreign key cascading deletion", async () => {
      const adapter = new NodeSQLiteTestAdapter(":memory:");
      const repo = new SQLiteDocumentRepository(adapter);

      const doc: DocumentRecord = {
        id: "doc-del-003",
        type: "VOTER_ID" as any,
        imageUri: "file:///sandbox/docs/voter.jpg",
        createdAt: 1793425200000,
        confirmedAt: 1793425260000,
        fields: [
          {
            id: "f-voter-1",
            key: "FULL_NAME",
            label: "Elector Name",
            value: "Anita Roy",
            confidence: 0.96,
            source: "DEMO",
          },
        ],
      };

      await repo.save(doc);

      const db = await repo.getDatabase();
      const fieldsBefore = await db.getAllAsync(
        "SELECT * FROM document_fields WHERE document_id = ?;",
        ["doc-del-003"]
      );
      assert.equal(fieldsBefore.length, 1);

      await repo.delete("doc-del-003");

      const retrieved = await repo.getById("doc-del-003");
      assert.equal(retrieved, null);

      const fieldsAfter = await db.getAllAsync(
        "SELECT * FROM document_fields WHERE document_id = ?;",
        ["doc-del-003"]
      );
      assert.equal(fieldsAfter.length, 0, "Fields must be deleted via cascade");
    });

    it("should preserve persisted records after database connection closes and reconnects", async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bodhini-db-test-"));
      const dbFilePath = path.join(tempDir, "reconnect-test.db");

      try {
        const adapter1 = new NodeSQLiteTestAdapter(dbFilePath);
        const repo1 = new SQLiteDocumentRepository(adapter1);

        const doc: DocumentRecord = {
          id: "doc-persist-004",
          type: "AADHAAR",
          imageUri: "file:///sandbox/docs/aadhaar.jpg",
          createdAt: 1793428800000,
          confirmedAt: 1793429100000,
          fields: [
            {
              id: "f-aadhaar-num",
              key: "AADHAAR_NO",
              label: "Aadhaar No",
              value: "200000000013",
              confidence: 0.99,
              source: "OCR",
            },
          ],
        };

        await repo1.save(doc);
        await repo1.close();

        const adapter2 = new NodeSQLiteTestAdapter(dbFilePath);
        const repo2 = new SQLiteDocumentRepository(adapter2);

        const restored = await repo2.getById("doc-persist-004");
        assert.ok(restored, "Record should persist across connection lifecycles");
        if (!restored) throw new Error("Restored record not found");

        assert.equal(restored.id, "doc-persist-004");
        assert.equal(restored.fields.length, 1);
        assert.equal(restored.fields[0].value, "200000000013");

        await repo2.close();
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should initialize schema only once per database connection", async () => {
      const baseAdapter = new NodeSQLiteTestAdapter(":memory:");
      let pragmaExecutionCount = 0;

      const countingAdapter: ISQLiteDatabase = {
        databasePath: ":memory:",
        async execAsync(source: string): Promise<void> {
          if (source.includes("PRAGMA foreign_keys = ON;")) {
            pragmaExecutionCount++;
          }
          await baseAdapter.execAsync(source);
        },
        runAsync: baseAdapter.runAsync.bind(baseAdapter),
        getAllAsync: baseAdapter.getAllAsync.bind(baseAdapter),
        getFirstAsync: baseAdapter.getFirstAsync.bind(baseAdapter),
        withTransactionAsync: baseAdapter.withTransactionAsync.bind(baseAdapter),
        closeAsync: baseAdapter.closeAsync.bind(baseAdapter),
      };

      const repo = new SQLiteDocumentRepository(countingAdapter);

      const testDoc: DocumentRecord = {
        id: "doc-init-once",
        type: "AADHAAR",
        imageUri: "file:///sandbox/aadhaar.jpg",
        createdAt: 1793428800000,
        confirmedAt: 1793429100000,
        fields: [],
      };

      // Perform multiple consecutive operations
      await repo.save(testDoc);
      await repo.getById("doc-init-once");
      await repo.getAll();
      await repo.delete("doc-init-once");

      assert.equal(
        pragmaExecutionCount,
        1,
        "Database initialization and foreign key pragma must happen exactly once"
      );
    });

    it("should safely handle concurrent initial calls without double initialization", async () => {
      const baseAdapter = new NodeSQLiteTestAdapter(":memory:");
      let initCount = 0;

      const delayedAdapter: ISQLiteDatabase = {
        databasePath: ":memory:",
        async execAsync(source: string): Promise<void> {
          if (source.includes("PRAGMA foreign_keys = ON;")) {
            initCount++;
            // Simulate slight async I/O latency to stress concurrent callers
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
          await baseAdapter.execAsync(source);
        },
        runAsync: baseAdapter.runAsync.bind(baseAdapter),
        getAllAsync: baseAdapter.getAllAsync.bind(baseAdapter),
        getFirstAsync: baseAdapter.getFirstAsync.bind(baseAdapter),
        withTransactionAsync: baseAdapter.withTransactionAsync.bind(baseAdapter),
        closeAsync: baseAdapter.closeAsync.bind(baseAdapter),
      };

      const repo = new SQLiteDocumentRepository(delayedAdapter);

      // Launch 5 concurrent calls simultaneously
      const results = await Promise.all([
        repo.getAll(),
        repo.getById("non-existent-1"),
        repo.getById("non-existent-2"),
        repo.getAll(),
        repo.getById("non-existent-3"),
      ]);

      assert.equal(initCount, 1, "Concurrent initial calls must only initialize schema once");
      assert.equal(results.length, 5);
      assert.deepEqual(results[0], []);
    });

    it("should allow retrying database initialization if initial attempt fails", async () => {
      const baseAdapter = new NodeSQLiteTestAdapter(":memory:");
      let shouldFail = true;

      const failingAdapter: ISQLiteDatabase = {
        databasePath: ":memory:",
        async execAsync(source: string): Promise<void> {
          if (shouldFail && source.includes("PRAGMA foreign_keys = ON;")) {
            shouldFail = false;
            throw new Error("Simulated transient SQLite disk/connection failure");
          }
          await baseAdapter.execAsync(source);
        },
        runAsync: baseAdapter.runAsync.bind(baseAdapter),
        getAllAsync: baseAdapter.getAllAsync.bind(baseAdapter),
        getFirstAsync: baseAdapter.getFirstAsync.bind(baseAdapter),
        withTransactionAsync: baseAdapter.withTransactionAsync.bind(baseAdapter),
        closeAsync: baseAdapter.closeAsync.bind(baseAdapter),
      };

      const repo = new SQLiteDocumentRepository(failingAdapter);

      // First call fails
      await assert.rejects(
        async () => {
          await repo.getAll();
        },
        /Simulated transient SQLite disk\/connection failure/,
        "First call must reject with the initial failure"
      );

      // Subsequent call retries and succeeds cleanly
      const docs = await repo.getAll();
      assert.deepEqual(docs, [], "Retried call must succeed after transient failure clears");
    });

    it("should execute the full 6-step SQLite test action successfully", async () => {
      const adapter = new NodeSQLiteTestAdapter(":memory:");
      const repo = new SQLiteDocumentRepository(adapter);

      const capturedLogs: string[] = [];
      const result = await runSQLiteSmokeTest(repo, (msg) => capturedLogs.push(msg));

      assert.equal(result.success, true, "Smoke test action should succeed");
      assert.ok(result.sampleDocId);
      assert.equal(capturedLogs.length > 0, true);
      assert.ok(capturedLogs.some((l) => l.includes("[Step 1/6]")));
      assert.ok(capturedLogs.some((l) => l.includes("[Step 2/6]")));
      assert.ok(capturedLogs.some((l) => l.includes("[Step 3/6]")));
      assert.ok(capturedLogs.some((l) => l.includes("[Step 4/6]")));
      assert.ok(capturedLogs.some((l) => l.includes("[Step 5/6]")));
      assert.ok(capturedLogs.some((l) => l.includes("[Step 6/6]")));
      assert.ok(capturedLogs.some((l) => l.includes("All 6 Steps Succeeded")));
    });
  });

  // --------------------------------------------------------------------------
  // 2. FieldValidator Tests
  // --------------------------------------------------------------------------
  describe("FieldValidator", () => {
    it("should validate Aadhaar numbers using Verhoeff checksum algorithm", () => {
      assert.equal(FieldValidator.isValidAadhaar("200000000013"), true);
      assert.equal(FieldValidator.isValidAadhaar("2000 0000 0013"), true);

      // Checksum tampered digit should fail
      assert.equal(FieldValidator.isValidAadhaar("200000000018"), false);
      assert.equal(FieldValidator.isValidAadhaar("200000000019"), false);

      // Invalid length should fail
      assert.equal(FieldValidator.isValidAadhaar("1234"), false);
      assert.equal(FieldValidator.isValidAadhaar("abcdefghijkl"), false);
    });

    it("should mask Aadhaar numbers for review/display", () => {
      assert.equal(FieldValidator.maskAadhaar("200000000013"), "•••• •••• 0013");
      assert.equal(FieldValidator.maskAadhaar("2000 0000 0013"), "•••• •••• 0013");
    });

    it("should validate Indian PAN card format", () => {
      assert.equal(FieldValidator.isValidPan("ABCDE1234F"), true);
      assert.equal(FieldValidator.isValidPan("abcde1234f"), true);
      assert.equal(FieldValidator.isValidPan("12345ABCDE"), false);
      assert.equal(FieldValidator.isValidPan("ABCDE12345"), false);
    });

    it("should normalize multiple date formats to ISO-8601 YYYY-MM-DD", () => {
      assert.equal(FieldValidator.normalizeDob("14/08/1992"), "1992-08-14");
      assert.equal(FieldValidator.normalizeDob("14-08-1992"), "1992-08-14");
      assert.equal(FieldValidator.normalizeDob("1992-08-14"), "1992-08-14");
      assert.equal(FieldValidator.normalizeDob("31/02/1992"), null);
    });

    it("should validate Indian mobile numbers", () => {
      assert.equal(FieldValidator.isValidPhone("9876543210"), true);
      assert.equal(FieldValidator.isValidPhone("+91 98765 43210"), true);
      assert.equal(FieldValidator.isValidPhone("09876543210"), true);
      assert.equal(FieldValidator.isValidPhone("1234567890"), false);
    });

    it("should validate PIN codes", () => {
      assert.equal(FieldValidator.isValidPinCode("700001"), true);
      assert.equal(FieldValidator.isValidPinCode("011001"), false);
      assert.equal(FieldValidator.isValidPinCode("70001"), false);
    });

    it("should normalize trilingual gender inputs", () => {
      assert.equal(FieldValidator.normalizeGender("male"), "Male");
      assert.equal(FieldValidator.normalizeGender("पुरुष"), "Male");
      assert.equal(FieldValidator.normalizeGender("পুরুষ"), "Male");
      assert.equal(FieldValidator.normalizeGender("female"), "Female");
      assert.equal(FieldValidator.normalizeGender("महिला"), "Female");
      assert.equal(FieldValidator.normalizeGender("মহিলা"), "Female");
    });
  });

  // --------------------------------------------------------------------------
  // 3. FieldMatcher & ConfidencePolicy Tests
  // --------------------------------------------------------------------------
  describe("FieldMatcher & ConfidencePolicy", () => {
    const confirmedDocs: DocumentRecord[] = [
      {
        id: "doc-user-001",
        type: "AADHAAR",
        imageUri: "file:///sandbox/aadhaar.jpg",
        createdAt: 1793418000000,
        confirmedAt: 1793418000000,
        fields: [
          {
            id: "f1",
            key: "FULL_NAME",
            label: "Name",
            value: "Anita Roy",
            confidence: 0.99,
            source: "OCR",
          },
          {
            id: "f2",
            key: "DOB",
            label: "DOB",
            value: "1992-08-14",
            confidence: 0.98,
            source: "OCR",
          },
          {
            id: "f3",
            key: "AADHAAR_NO",
            label: "Aadhaar",
            value: "200000000013",
            confidence: 0.99,
            source: "OCR",
          },
          {
            id: "f4",
            key: "ADDRESS",
            label: "Address",
            value: "123 Park Street, Kolkata, West Bengal",
            confidence: 0.95,
            source: "OCR",
          },
        ],
      },
    ];

    it("should match English, Hindi, and Bengali form labels accurately", () => {
      const matcher = new FieldMatcher();

      const formFields: FormField[] = [
        { id: "f-en-name", label: "Full Name", type: "TEXT", required: true },
        { id: "f-hi-dob", label: "जन्म तिथि", type: "DATE", required: true },
        { id: "f-bn-aadhaar", label: "আধার নম্বর", type: "TEXT", required: true },
      ];

      const matches = matcher.matchDetailed(formFields, confirmedDocs);
      assert.equal(matches.length, 3);

      assert.equal(matches[0].status, "FILLED");
      assert.equal(matches[0].value, "Anita Roy");
      assert.equal(matches[0].matchedKey, "FULL_NAME");

      assert.equal(matches[1].status, "FILLED");
      assert.equal(matches[1].value, "1992-08-14");
      assert.equal(matches[1].matchedKey, "DOB");

      assert.equal(matches[2].status, "FILLED");
      assert.equal(matches[2].value, "200000000013");
      assert.equal(matches[2].matchedKey, "AADHAAR_NO");
    });

    it("should never fabricate missing values and mark them as NEEDS_USER", () => {
      const matcher = new FieldMatcher();

      const formFields: FormField[] = [
        { id: "f-email", label: "Email Address", type: "TEXT", required: true },
        { id: "f-pan", label: "पैन नंबर", type: "TEXT", required: true },
      ];

      const matches = matcher.matchDetailed(formFields, confirmedDocs);
      assert.equal(matches[0].status, "NEEDS_USER");
      assert.equal(matches[0].value, null, "Missing values must never be fabricated");

      assert.equal(matches[1].status, "NEEDS_USER");
      assert.equal(matches[1].value, null, "Missing values must never be fabricated");
    });

    it("should always mark signature and declaration fields as SKIPPED", () => {
      const matcher = new FieldMatcher();

      const formFields: FormField[] = [
        { id: "f-sig-1", label: "Signature of Applicant", type: "SIGNATURE", required: true },
        { id: "f-sig-2", label: "আবেদনকারীর স্বাক্ষর", type: "TEXT", required: true },
        { id: "f-decl-1", label: "I hereby declare the above is true", type: "DECLARATION", required: true },
        { id: "f-decl-2", label: "घोषणा", type: "TEXT", required: true },
      ];

      const matches = matcher.matchDetailed(formFields, confirmedDocs);

      for (const m of matches) {
        assert.equal(m.status, "SKIPPED", `Field ${m.field.label} must be SKIPPED`);
        assert.equal(m.confidence, 0);
        assert.equal(m.value, null);
      }
    });

    // ------------------------------------------------------------------------
    // Audit Regression Tests: Field Matching and Safety Invariants
    // ------------------------------------------------------------------------
    it("Regression 1: should match 'Applicant Name' to FULL_NAME", () => {
      const matcher = new FieldMatcher();
      const fields: FormField[] = [
        { id: "r1", label: "Applicant Name", type: "TEXT", required: true },
      ];
      const matches = matcher.matchDetailed(fields, confirmedDocs);
      assert.equal(matches[0].status, "FILLED");
      assert.equal(matches[0].matchedKey, "FULL_NAME");
      assert.equal(matches[0].value, "Anita Roy");
    });

    it("Regression 2: 'Father's Name' must not match FULL_NAME", () => {
      const matcher = new FieldMatcher();
      const fields: FormField[] = [
        { id: "r2", label: "Father's Name", type: "TEXT", required: true },
      ];
      const matches = matcher.matchDetailed(fields, confirmedDocs);
      assert.equal(matches[0].status, "NEEDS_USER");
      assert.equal(matches[0].value, null);
    });

    it("Regression 3: 'Mother's Name' must not match FULL_NAME", () => {
      const matcher = new FieldMatcher();
      const fields: FormField[] = [
        { id: "r3", label: "Mother's Name", type: "TEXT", required: true },
      ];
      const matches = matcher.matchDetailed(fields, confirmedDocs);
      assert.equal(matches[0].status, "NEEDS_USER");
      assert.equal(matches[0].value, null);
    });

    it("Regression 4: 'Application Date' must not match DOB", () => {
      const matcher = new FieldMatcher();
      const fields: FormField[] = [
        { id: "r4", label: "Application Date", type: "DATE", required: true },
      ];
      const matches = matcher.matchDetailed(fields, confirmedDocs);
      assert.equal(matches[0].status, "NEEDS_USER");
      assert.equal(matches[0].value, null);
    });

    it("Regression 5: 'Serial No' must not match AADHAAR_NO", () => {
      const matcher = new FieldMatcher();
      const fields: FormField[] = [
        { id: "r5", label: "Serial No", type: "TEXT", required: true },
      ];
      const matches = matcher.matchDetailed(fields, confirmedDocs);
      assert.equal(matches[0].status, "NEEDS_USER");
      assert.equal(matches[0].value, null);
    });

    it("Regression 6: 'Application No' must not match AADHAAR_NO", () => {
      const matcher = new FieldMatcher();
      const fields: FormField[] = [
        { id: "r6", label: "Application No", type: "TEXT", required: true },
      ];
      const matches = matcher.matchDetailed(fields, confirmedDocs);
      assert.equal(matches[0].status, "NEEDS_USER");
      assert.equal(matches[0].value, null);
    });

    it("Regression 7: 'Permanent Address' should match ADDRESS", () => {
      const matcher = new FieldMatcher();
      const fields: FormField[] = [
        { id: "r7", label: "Permanent Address", type: "TEXT", required: true },
      ];
      const matches = matcher.matchDetailed(fields, confirmedDocs);
      assert.equal(matches[0].status, "FILLED");
      assert.equal(matches[0].matchedKey, "ADDRESS");
      assert.equal(matches[0].value, "123 Park Street, Kolkata, West Bengal");
    });

    it("Regression 8: Signature required in instruction -> SKIPPED", () => {
      const matcher = new FieldMatcher();
      const fields: FormField[] = [
        {
          id: "r8",
          label: "Applicant Authentication",
          type: "TEXT",
          instruction: "Physical signature required on paper form before submission",
          required: true,
        },
      ];
      const matches = matcher.matchDetailed(fields, confirmedDocs);
      assert.equal(matches[0].status, "SKIPPED");
      assert.equal(matches[0].confidence, 0);
      assert.equal(matches[0].value, null);
    });

    it("Regression 9: Declaration instruction -> SKIPPED", () => {
      const matcher = new FieldMatcher();
      const fields: FormField[] = [
        {
          id: "r9",
          label: "Terms & Conditions",
          type: "TEXT",
          instruction: "I hereby declare that all information given above is true and correct",
          required: true,
        },
      ];
      const matches = matcher.matchDetailed(fields, confirmedDocs);
      assert.equal(matches[0].status, "SKIPPED");
      assert.equal(matches[0].confidence, 0);
      assert.equal(matches[0].value, null);
    });

    it("Regression 10: Hindi and Bengali signature/declaration instructions -> SKIPPED", () => {
      const matcher = new FieldMatcher();
      const fields: FormField[] = [
        {
          id: "r10-hi",
          label: "प्रमाणीकरण",
          type: "TEXT",
          instruction: "कृपया यहाँ हस्ताक्षर करें और फॉर्म जमा करें",
          required: true,
        },
        {
          id: "r10-bn",
          label: "যাচাইকরণ",
          type: "TEXT",
          instruction: "আবেদনকারীর স্বাক্ষর ও ঘোষণা বাধ্যতামূলক",
          required: true,
        },
      ];
      const matches = matcher.matchDetailed(fields, confirmedDocs);

      assert.equal(matches[0].status, "SKIPPED");
      assert.equal(matches[0].confidence, 0);
      assert.equal(matches[0].value, null);

      assert.equal(matches[1].status, "SKIPPED");
      assert.equal(matches[1].confidence, 0);
      assert.equal(matches[1].value, null);
    });
  });

  // --------------------------------------------------------------------------
  // 4. CopyListBuilder Tests
  // --------------------------------------------------------------------------
  describe("CopyListBuilder", () => {
    it("should build ordered copy items with Aadhaar masking and formatted plain text", () => {
      const builder = new CopyListBuilder();

      const nameField: FormField = { id: "f1", label: "Full Name", type: "TEXT", required: true, key: "FULL_NAME" };
      const aadhaarField: FormField = { id: "f2", label: "Aadhaar Number", type: "TEXT", required: true, key: "AADHAAR_NO" };
      const sigField: FormField = { id: "f3", label: "Signature", type: "SIGNATURE", required: true };
      const incomeField: FormField = { id: "f4", label: "Annual Income", type: "TEXT", required: true };

      const filledFields: FilledField[] = [
        { field: nameField, value: "Anita Roy", status: "FILLED", confidence: 0.95 },
        { field: aadhaarField, value: "200000000013", status: "FILLED", confidence: 0.95 },
        { field: sigField, value: "", status: "SKIPPED", confidence: 0 },
        { field: incomeField, value: "", status: "NEEDS_USER", confidence: 0 },
      ];

      const items = builder.buildCopyItems(filledFields);
      assert.equal(items.length, 2);

      // Verify ordering (only FILLED items are copied)
      assert.equal(items[0].order, 1);
      assert.equal(items[1].order, 2);

      // Verify Aadhaar masking
      assert.equal(items[1].value, "•••• •••• 0013", "Aadhaar must be masked in CopyItem display");

      // Verify plain text formatting (formatPlainText receives all items passed to it)
      const allItems = [
        { fieldId: "f1", label: "Full Name", value: "Anita Roy", status: "FILLED" as const, order: 1 },
        { fieldId: "f2", label: "Aadhaar Number", value: "•••• •••• 0013", status: "FILLED" as const, order: 2 },
        { fieldId: "f3", label: "Signature", value: "", status: "SKIPPED" as const, order: 3, instruction: "Manual signature or personal declaration required" },
        { fieldId: "f4", label: "Annual Income", value: "", status: "NEEDS_USER" as const, order: 4, instruction: "Value not present in confirmed documents; fill manually" },
      ];
      const plainText = builder.formatPlainText(allItems);
      assert.ok(plainText.includes("1. Full Name: Anita Roy [FILLED]"));
      assert.ok(plainText.includes("2. Aadhaar Number: •••• •••• 0013 [FILLED]"));
      assert.ok(plainText.includes("3. Signature: [SKIPPED"));
      assert.ok(plainText.includes("4. Annual Income: [NEEDS USER INPUT"));
    });
  });
});
