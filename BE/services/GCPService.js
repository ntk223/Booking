import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

class GCPService {
    constructor() {
        this.storage = new Storage({
            projectId: process.env.GCP_PROJECT_ID,
            keyFilename: path.resolve(process.env.GCP_KEY_FILE_PATH),
        });
        this.bucketName = process.env.GCP_BUCKET_NAME;
    }

    /**
     * Generate a V4 Signed URL for uploading a file to GCS.
     * @param {string} filename - The name of the file to be uploaded.
     * @param {string} contentType - The MIME type of the file.
     * @returns {Promise<string>} - The signed URL.
     */
    async generateUploadUrl(filename, contentType) {
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
    }

    /**
     * Upload a file buffer to GCS.
     * @param {string} filename - The name of the file.
     * @param {Buffer} buffer - The file buffer.
     * @param {string} contentType - The MIME type.
     * @returns {Promise<string>} - The public URL.
     */
    async uploadFile(filename, buffer, contentType) {
        const file = this.storage.bucket(this.bucketName).file(filename);

        await file.save(buffer, {
            metadata: { contentType },
            resumable: false // Simple upload for benchmark
        });

        return `https://storage.googleapis.com/${this.bucketName}/${filename}`;
    }
}

export default new GCPService();
