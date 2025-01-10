// lib/verification/logger.ts
type LogLevel = "info" | "warn" | "error" | "debug";

export class VerificationLogger {
  private static instance: VerificationLogger;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  static getInstance(): VerificationLogger {
    if (!VerificationLogger.instance) {
      VerificationLogger.instance = new VerificationLogger();
    }
    return VerificationLogger.instance;
  }

  log(level: LogLevel, context: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = {
      timestamp,
      level,
      context,
      message,
      data,
    };

    if (this.isDevelopment) {
      console.log(JSON.stringify(logMessage, null, 2));
    }

    // In production, you might want to send this to a logging service
    if (level === "error") {
      console.error(logMessage);
    }
  }

  startVerification(userId: string) {
    this.log(
      "info",
      "Verification",
      `Starting verification process for user ${userId}`
    );
  }

  verificationStep(
    userId: string,
    step: string,
    status: string,
    details?: any
  ) {
    this.log("info", "Verification", `${step} - ${status}`, {
      userId,
      details,
    });
  }

  verificationError(userId: string, step: string, error: Error) {
    this.log("error", "Verification", `Error in ${step}`, {
      userId,
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
  }

  verificationComplete(userId: string, status: string, score: number) {
    this.log("info", "Verification", `Verification complete`, {
      userId,
      status,
      score,
    });
  }
}

export const verificationLogger = VerificationLogger.getInstance();
