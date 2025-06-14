import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

interface DocumentFingerprint {
  doc_hash: string;
  scenario_hash: string;
  normalized_text: string;
  metadata: {
    original_length: number;
    normalized_length: number;
    created_at: string;
    source_url?: string;
  };
}

export class DocumentStore {
  private storePath: string;
  private indexPath: string;

  constructor(baseDir: string = process.cwd()) {
    this.storePath = path.join(baseDir, 'data', 'documents');
    this.indexPath = path.join(baseDir, 'data', 'document_index.json');
    this.initializeStore();
  }

  private async initializeStore(): Promise<void> {
    try {
      await fs.mkdir(this.storePath, { recursive: true });
      // Initialize index if it doesn't exist
      try {
        await fs.access(this.indexPath);
      } catch {
        await fs.writeFile(this.indexPath, JSON.stringify({}));
      }
    } catch (error) {
      console.error('Failed to initialize document store:', error);
      throw error;
    }
  }

  async storeDocument(
    text: string,
    scenarioHash: string,
    sourceUrl?: string
  ): Promise<DocumentFingerprint> {
    // 1. Normalize text
    const normalizedText = this.normalizeText(text);
    
    // 2. Generate document hash
    const docHash = this.computeHash(normalizedText);
    
    // 3. Create fingerprint
    const fingerprint: DocumentFingerprint = {
      doc_hash: docHash,
      scenario_hash: scenarioHash,
      normalized_text: normalizedText,
      metadata: {
        original_length: text.length,
        normalized_length: normalizedText.length,
        created_at: new Date().toISOString(),
        source_url: sourceUrl
      }
    };

    // 4. Check uniqueness constraint
    const isUnique = await this.checkUniqueness(docHash, scenarioHash);
    if (!isUnique) {
      console.log('Document already exists:', docHash);
      return fingerprint;
    }

    // 5. Store document with fingerprint
    try {
      const docPath = path.join(this.storePath, `${docHash}.json`);
      await fs.writeFile(docPath, JSON.stringify(fingerprint, null, 2));
      
      // 6. Update index
      await this.updateIndex(fingerprint);
      
      console.log('Document stored successfully:', docHash);
      return fingerprint;
    } catch (error) {
      console.error('Storage failure:', error);
      throw new Error('storage_failure');
    }
  }

  private normalizeText(text: string): string {
    return text
      .replace(/<[^>]*>/g, ' ')           // Strip HTML
      .replace(/\s+/g, ' ')               // Collapse whitespace
      .normalize('NFKC')                   // Unicode normalization
      .toLowerCase()                       // Convert to lowercase
      .trim();                            // Trim edges
  }

  private computeHash(text: string): string {
    return createHash('sha256')
      .update(text)
      .digest('hex');
  }

  private async checkUniqueness(
    docHash: string,
    scenarioHash: string
  ): Promise<boolean> {
    try {
      const index = JSON.parse(await fs.readFile(this.indexPath, 'utf-8'));
      return !(index[docHash] && index[docHash].includes(scenarioHash));
    } catch (error) {
      console.error('Error checking uniqueness:', error);
      return true; // Assume unique on error to allow storage attempt
    }
  }

  private async updateIndex(fingerprint: DocumentFingerprint): Promise<void> {
    try {
      const index = JSON.parse(await fs.readFile(this.indexPath, 'utf-8'));
      
      if (!index[fingerprint.doc_hash]) {
        index[fingerprint.doc_hash] = [];
      }
      
      if (!index[fingerprint.doc_hash].includes(fingerprint.scenario_hash)) {
        index[fingerprint.doc_hash].push(fingerprint.scenario_hash);
      }
      
      await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2));
    } catch (error) {
      console.error('Failed to update document index:', error);
      throw new Error('indexing_failure');
    }
  }

  async getDocument(docHash: string): Promise<DocumentFingerprint | null> {
    try {
      const docPath = path.join(this.storePath, `${docHash}.json`);
      const content = await fs.readFile(docPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Document not found:', docHash);
      return null;
    }
  }

  async getDocumentsByScenario(scenarioHash: string): Promise<DocumentFingerprint[]> {
    try {
      const index = JSON.parse(await fs.readFile(this.indexPath, 'utf-8'));
      const documents: DocumentFingerprint[] = [];
      
      for (const [docHash, scenarios] of Object.entries(index)) {
        if ((scenarios as string[]).includes(scenarioHash)) {
          const doc = await this.getDocument(docHash);
          if (doc) {
            documents.push(doc);
          }
        }
      }
      
      return documents;
    } catch (error) {
      console.error('Error retrieving documents for scenario:', error);
      return [];
    }
  }
}
