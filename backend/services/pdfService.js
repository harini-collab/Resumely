const fs = require("fs");

// ─── extractTextFromPDF ────────────────────────────────────────────────────────
// Reads a PDF file from disk and extracts all text from it.
// This is what powers the resume upload feature.
// Returns: { text, pageCount, info }
//
// NOTE: pdf-parse is required lazily (inside the function) to avoid a known
// issue where it tries to read a test PDF on first module load, which can throw
// on certain environments and cause the first upload request to fail silently.

const extractTextFromPDF = async (filePath) => {
  try {
    // Read the file from disk as a Buffer (raw binary data)
    const dataBuffer = fs.readFileSync(filePath);

    // Lazy require to avoid pdf-parse's test-file read at module load time
    const pdfParse = require("pdf-parse");

    // pdf-parse reads the buffer and extracts all text content
    const data = await pdfParse(dataBuffer);

    // Clean up the extracted text a bit
    const cleanText = data.text
      .replace(/\r\n/g, "\n")   // normalize line endings
      .replace(/\t/g, " ")      // replace tabs with spaces
      .trim();

    return {
      text: cleanText,
      pageCount: data.numpages,
      info: data.info,          // metadata like author, title
    };

  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

// ─── cleanupFile ──────────────────────────────────────────────────────────────
// Deletes a temporary file after we're done processing it.
// We don't want uploaded resumes sitting on the server forever!
// This is called after we finish reading a PDF.

const cleanupFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);  // delete the file
    }
  } catch (error) {
    // Don't crash the server just because cleanup failed
    // Just log a warning
    console.warn(`⚠️  Could not delete temp file ${filePath}:`, error.message);
  }
};

module.exports = { extractTextFromPDF, cleanupFile };
