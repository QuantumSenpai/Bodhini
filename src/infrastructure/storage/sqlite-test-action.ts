import { DocumentRecord } from "../../domain/document/document.types";
import { SQLiteDocumentRepository } from "./sqlite-document-repository";

export interface SQLiteSmokeTestResult {
  success: boolean;
  logs: string[];
  sampleDocId?: string;
  error?: string;
}

export async function runSQLiteSmokeTest(
  repository?: SQLiteDocumentRepository,
  onLog?: (message: string) => void
): Promise<SQLiteSmokeTestResult> {
  const logs: string[] = [];
  const log = (msg: string) => {
    logs.push(msg);
    if (onLog) {
      onLog(msg);
    }
  };

  const repo = repository || new SQLiteDocumentRepository("bodhini.db");
  const testRunId = Date.now();
  const sampleDocId = `test-doc-${testRunId}`;

  try {
    log("=== Starting SQLiteDocumentRepository Smoke Test ===");

    log("[Step 1/6] Initializing SQLite database and schema...");
    const db = await repo.getDatabase();
    log(`[Step 1/6] Database initialized successfully (Connection active).`);

    log("[Step 2/6] Saving one confirmed sample DocumentRecord (synthetic test data)...");
    const sampleDoc: DocumentRecord = {
      id: sampleDocId,
      type: "AADHAAR",
      imageUri: "file:///sandbox/synthetic-test-aadhaar.jpg",
      createdAt: testRunId,
      confirmedAt: testRunId,
      fields: [
        {
          id: `f-name-${testRunId}`,
          key: "FULL_NAME",
          label: "Name",
          value: "Synthetic Test User",
          confidence: 0.99,
          source: "DEMO",
        },
        {
          id: `f-dob-${testRunId}`,
          key: "DOB",
          label: "Date of Birth",
          value: "1995-05-15",
          confidence: 0.98,
          source: "DEMO",
        },
        {
          id: `f-aadhaar-${testRunId}`,
          key: "AADHAAR_NO",
          label: "Aadhaar Number",
          value: "200000000013", // Synthetic test number (Valid Verhoeff checksum)
          confidence: 0.99,
          source: "DEMO",
        },
        {
          id: `f-address-${testRunId}`,
          key: "ADDRESS",
          label: "Permanent Address",
          value: "Flat 4B, Demo Residency, Kolkata, West Bengal",
          confidence: 0.95,
          source: "DEMO",
        },
      ],
    };

    await repo.save(sampleDoc);
    log(`[Step 2/6] Document saved: ID='${sampleDoc.id}' with ${sampleDoc.fields.length} extracted fields.`);

    log("[Step 3/6] Retrieving all saved documents via getAll()...");
    const allDocs = await repo.getAll();
    const foundDoc = allDocs.find((d) => d.id === sampleDocId);
    if (!foundDoc) {
      throw new Error(`Verification failed: Document ${sampleDocId} not found in getAll() result.`);
    }
    log(`[Step 3/6] Total documents retrieved: ${allDocs.length}. Found target document '${foundDoc.id}'.`);

    log(`[Step 4/6] Retrieving document by ID ('${sampleDocId}')...`);
    const retrievedById = await repo.getById(sampleDocId);
    if (!retrievedById) {
      throw new Error(`Verification failed: Document ${sampleDocId} could not be retrieved by getById().`);
    }
    if (retrievedById.fields.length !== sampleDoc.fields.length) {
      throw new Error(
        `Field count mismatch: Expected ${sampleDoc.fields.length}, got ${retrievedById.fields.length}`
      );
    }
    log(
      `[Step 4/6] Successfully retrieved document: '${retrievedById.id}' (${retrievedById.type}) with ${retrievedById.fields.length} fields fully reconstructed.`
    );

    log(`[Step 5/6] Deleting test document '${sampleDocId}'...`);
    await repo.delete(sampleDocId);
    log(`[Step 5/6] Delete operation completed.`);

    log(`[Step 6/6] Verifying deletion via getById() and getAll()...`);
    const postDeleteGet = await repo.getById(sampleDocId);
    if (postDeleteGet !== null) {
      throw new Error(`Verification failed: Document ${sampleDocId} still exists after deletion.`);
    }

    const postDeleteAll = await repo.getAll();
    const stillPresent = postDeleteAll.some((d) => d.id === sampleDocId);
    if (stillPresent) {
      throw new Error(`Verification failed: Document ${sampleDocId} still present in getAll() list.`);
    }
    log(`[Step 6/6] Deletion confirmed: getById() returned null and document is absent from getAll().`);

    log("=== Smoke Test Passed: All 6 Steps Succeeded ===");
    return {
      success: true,
      logs,
      sampleDocId,
    };
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log(`[ERROR] Test failed: ${errorMsg}`);
    return {
      success: false,
      logs,
      sampleDocId,
      error: errorMsg,
    };
  }
}