import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";
import path from "path";
import CircuitBreaker from "opossum";
import { registerCircuitBreaker } from "../utils/metrics.js";
import { env } from "../config/environment.js";
import logger from "../logger/winston.log.js";
import { withStorageRetry } from "../utils/retry.js";

dotenv.config();

class GCPService {
  constructor() {
    // Skip GCS initialization if credentials are not provided
    if (!process.env.GCP_KEY_FILE_PATH || !process.env.GCP_PROJECT_ID) {
      logger.warn(
        "GCS credentials not configured. GCS operations will be disabled.",
        {
          utilService: "GCS",
        }
      );
      this.storage = null;
      this.bucketName = null;
    } else {
      this.storage = new Storage({
        projectId: process.env.GCP_PROJECT_ID,
        keyFilename: path.resolve(process.env.GCP_KEY_FILE_PATH),
      });
      this.bucketName = process.env.GCP_BUCKET_NAME;
    }

    const options = {
      name: "gcs-circuit-breaker",
      timeout: env.CIRCUIT_BREAKER_TIMEOUT || 30000,
      errorThresholdPercentage:
        (env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || 0.5) * 100,
      resetTimeout: env.CIRCUIT_BREAKER_TIMEOUT || 30000,
      volumeThreshold: 5,
    };

    this.circuitBreaker = new CircuitBreaker(
      async (operation) => operation(),
      options
    );
    registerCircuitBreaker(this.circuitBreaker);

    this.circuitBreaker.on("open", () =>
      logger.error("GCS Circuit Breaker OPEN", { utilService: "GCS" })
    );
    this.circuitBreaker.on("close", () =>
      logger.info("GCS Circuit Breaker CLOSED", { utilService: "GCS" })
    );
    this.circuitBreaker.on("halfOpen", () =>
      logger.info("GCS Circuit Breaker HALF-OPEN", { utilService: "GCS" })
    );
  }

  /**
   * Generate a V4 Signed URL for uploading a file to GCS.
   * @param {string} filename - The name of the file to be uploaded.
   * @param {string} contentType - The MIME type of the file.
   * @returns {Promise<string>} - The signed URL.
   */
  async generateUploadUrl(filename, contentType) {
    if (!this.storage) {
      throw new Error(
        "GCS is not configured. Please set GCP_KEY_FILE_PATH and GCP_PROJECT_ID in .env"
      );
    }

    return this.circuitBreaker.fire(async () => {
      return withStorageRetry(async () => {
        const options = {
          version: "v4",
          action: "write",
          expires: Date.now() + 15 * 60 * 1000, // 15 minutes
          contentType: contentType,
        };

        const [url] = await this.storage
          .bucket(this.bucketName)
          .file(filename)
          .getSignedUrl(options);

        return url;
      }, `GCS generateUploadUrl (${filename})`);
    });
  }

  /**
   * Upload a file buffer to GCS.
   * @param {string} filename - The name of the file.
   * @param {Buffer} buffer - The file buffer.
   * @param {string} contentType - The MIME type.
   * @returns {Promise<string>} - The public URL.
   */
  async uploadFile(filename, buffer, contentType) {
    if (!this.storage) {
      throw new Error(
        "GCS is not configured. Please set GCP_KEY_FILE_PATH and GCP_PROJECT_ID in .env"
      );
    }

    return this.circuitBreaker.fire(async () => {
      return withStorageRetry(async () => {
        const file = this.storage.bucket(this.bucketName).file(filename);

        await file.save(buffer, {
          metadata: { contentType },
          resumable: false, // Simple upload for benchmark
        });

        return `https://storage.googleapis.com/${this.bucketName}/${filename}`;
      }, `GCS uploadFile (${filename})`);
    });
  }

  /**
   * Get circuit breaker status
   */
  getCircuitStatus() {
    return this.circuitBreaker.stats;
  }
}

export { GCPService };
