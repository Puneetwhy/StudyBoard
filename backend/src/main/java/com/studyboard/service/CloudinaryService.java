package com.studyboard.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.Map;

/**
 * Uploads generated files to Cloudinary and returns their public URL.
 * Files are written to /tmp only as a transient staging step (Render's
 * filesystem is ephemeral) — nothing is ever served from local disk;
 * only the returned Cloudinary URL is persisted in MySQL.
 */
@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}") String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret) {

        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        ));
    }

    @SuppressWarnings("unchecked")
    public String uploadPdf(File file, String publicIdPrefix) {
        try {
            Map<String, Object> uploadResult = cloudinary.uploader().upload(file, ObjectUtils.asMap(
                    "resource_type", "raw", // PDFs must be uploaded as "raw" on Cloudinary
                    "folder", "studyboard/pdfs",
                    "public_id", publicIdPrefix + "-" + System.currentTimeMillis(),
                    "overwrite", true
            ));
            return (String) uploadResult.get("secure_url");
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload PDF to Cloudinary: " + e.getMessage(), e);
        } finally {
            // Clean up the transient /tmp file regardless of outcome.
            if (file.exists()) {
                file.delete();
            }
        }
    }
}
