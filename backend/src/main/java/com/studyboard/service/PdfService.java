package com.studyboard.service;

import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.UnitValue;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.util.Base64;
import java.util.UUID;

/**
 * Generates PDFs into the OS temp directory (/tmp on Render) as a purely
 * transient staging step. Callers must upload the returned File to
 * Cloudinary/S3 immediately and never rely on it surviving a restart —
 * Render's filesystem is ephemeral and wiped on every redeploy.
 */
@Service
public class PdfService {

    public File generateNotesPdf(String title, String content) {
    File file = newTempFile("notes");
    try (PdfWriter writer = new PdfWriter(new FileOutputStream(file));
         PdfDocument pdfDoc = new PdfDocument(writer);
         Document document = new Document(pdfDoc, PageSize.A4)) {

        String safeTitle = (title == null || title.isBlank()) ? "Untitled" : title;
        String safeContent = (content == null || content.isBlank()) ? "(No content)" : content;

        document.add(new Paragraph(safeTitle).setBold().setFontSize(18));
        document.add(new Paragraph(safeContent).setFontSize(12));
    } catch (Exception e) {
        throw new RuntimeException("Failed to generate notes PDF: " + e.getMessage(), e);
    }
    return file;
}

    public File generateWhiteboardPdf(String imageBase64) {
        File file = newTempFile("whiteboard");
        try (PdfWriter writer = new PdfWriter(new FileOutputStream(file));
             PdfDocument pdfDoc = new PdfDocument(writer);
             Document document = new Document(pdfDoc, PageSize.A4.rotate())) {

            String base64Data = imageBase64.contains(",")
                    ? imageBase64.substring(imageBase64.indexOf(',') + 1)
                    : imageBase64;
            byte[] imageBytes = Base64.getDecoder().decode(base64Data);

            Image image = new Image(ImageDataFactory.create(imageBytes));
            image.setWidth(UnitValue.createPercentValue(100));
            image.setAutoScale(true);

            document.add(new Paragraph("StudyBoard — Whiteboard Export").setBold().setFontSize(16));
            document.add(image);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate whiteboard PDF: " + e.getMessage(), e);
        }
        return file;
    }

    private File newTempFile(String prefix) {
        try {
            File tmp = File.createTempFile(prefix + "-" + UUID.randomUUID(), ".pdf",
                    new File(System.getProperty("java.io.tmpdir")));
            return tmp;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create temp file: " + e.getMessage(), e);
        }
    }
}
