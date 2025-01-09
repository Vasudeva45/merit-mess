import { createWorker } from "tesseract.js";

interface DocumentValidationRules {
  requiredKeywords: string[];
  datePattern: RegExp;
  institutionPattern: RegExp;
  credentialPattern: RegExp;
}

export class DocumentVerification {
  private validationRules: Record<string, DocumentValidationRules> = {
    degree: {
      requiredKeywords: [
        "degree",
        "university",
        "graduate",
        "bachelor",
        "master",
        "phd",
      ],
      datePattern: /\b(19|20)\d{2}\b/,
      institutionPattern: /\b(University|Institute|College)\b/i,
      credentialPattern: /\b(Bachelor|Master|Doctor|Ph\.D\.|MBA)\b/i,
    },
    certificate: {
      requiredKeywords: [
        "certificate",
        "certification",
        "certified",
        "complete",
      ],
      datePattern: /\b(19|20)\d{2}\b/,
      institutionPattern: /\b(Institution|Authority|Board|Organization)\b/i,
      credentialPattern: /\b(Professional|Certified|Licensed|Accredited)\b/i,
    },
    professionallicense: {
      requiredKeywords: ["license", "licensed", "professional", "authorized"],
      datePattern: /\b(19|20)\d{2}\b/,
      institutionPattern: /\b(Board|Authority|Council|Association)\b/i,
      credentialPattern: /\b(License|Registration|Membership|Number)\b/i,
    },
  };

  async verifyDocument(
    documentBuffer: Buffer,
    type: string
  ): Promise<{
    verified: boolean;
    text: string;
    confidence: number;
    metadata: {
      documentType: string;
      issueDate?: string;
      institution?: string;
      credential?: string;
    };
  }> {
    try {
      // Initialize Tesseract worker
      const worker = await createWorker();
      await worker.loadLanguage("eng");
      await worker.initialize("eng");

      // Perform OCR on the document
      const {
        data: { text, confidence },
      } = await worker.recognize(documentBuffer);
      await worker.terminate();

      // Validate the extracted text
      const validationResult = this.validateDocumentText(
        text.toLowerCase(),
        type
      );

      // Extract metadata using regex patterns
      const metadata = this.extractDocumentMetadata(text, type);

      return {
        verified: validationResult.verified,
        text,
        confidence,
        metadata: {
          documentType: type,
          ...metadata,
        },
      };
    } catch (error) {
      console.error("Document verification error:", error);
      return {
        verified: false,
        text: "",
        confidence: 0,
        metadata: {
          documentType: type,
        },
      };
    }
  }

  private validateDocumentText(
    text: string,
    type: string
  ): {
    verified: boolean;
    reasons?: string[];
  } {
    const rules = this.validationRules[type];
    if (!rules) {
      return { verified: false, reasons: ["Invalid document type"] };
    }

    const reasons: string[] = [];

    // Check for required keywords
    const keywordsFound = rules.requiredKeywords.some((keyword) =>
      text.includes(keyword.toLowerCase())
    );
    if (!keywordsFound) {
      reasons.push("Required keywords not found");
    }

    // Check for date pattern
    const hasValidDate = rules.datePattern.test(text);
    if (!hasValidDate) {
      reasons.push("Valid date not found");
    }

    // Check for institution pattern
    const hasInstitution = rules.institutionPattern.test(text);
    if (!hasInstitution) {
      reasons.push("Institution name not found");
    }

    // Check for credential pattern
    const hasCredential = rules.credentialPattern.test(text);
    if (!hasCredential) {
      reasons.push("Credential information not found");
    }

    return {
      verified: reasons.length === 0,
      reasons: reasons.length > 0 ? reasons : undefined,
    };
  }

  private extractDocumentMetadata(
    text: string,
    type: string
  ): {
    issueDate?: string;
    institution?: string;
    credential?: string;
  } {
    const rules = this.validationRules[type];
    if (!rules) return {};

    const metadata: any = {};

    // Extract date
    const dateMatch = text.match(rules.datePattern);
    if (dateMatch) {
      metadata.issueDate = dateMatch[0];
    }

    // Extract institution
    const institutionMatch = text.match(rules.institutionPattern);
    if (institutionMatch) {
      metadata.institution = institutionMatch[0];
    }

    // Extract credential
    const credentialMatch = text.match(rules.credentialPattern);
    if (credentialMatch) {
      metadata.credential = credentialMatch[0];
    }

    return metadata;
  }

  async validateMultipleDocuments(
    documents: Array<{ buffer: Buffer; type: string }>
  ): Promise<{
    verified: boolean;
    results: Array<{
      type: string;
      verified: boolean;
      metadata: any;
    }>;
  }> {
    const results = await Promise.all(
      documents.map(async (doc) => {
        const result = await this.verifyDocument(doc.buffer, doc.type);
        return {
          type: doc.type,
          verified: result.verified,
          metadata: result.metadata,
        };
      })
    );

    // Overall verification requires at least one valid document
    const verified = results.some((result) => result.verified);

    return {
      verified,
      results,
    };
  }
}
