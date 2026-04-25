import { useState, useRef } from "react";
import {
  Upload,
  X,
  FileText,
  Image,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import api from "@/config/axios";

// File type configurations
const FILE_CONFIG = {
  logo: {
    label: "Logo",
    accept: "image/jpeg,image/png,image/jpg,image/webp",
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    maxSizeMB: 5,
    multiple: false,
  },
  aadhaar: {
    label: "Aadhaar Card",
    accept: "application/pdf,image/jpeg,image/png,image/jpg,image/webp",
    extensions: [".pdf", ".jpg", ".jpeg", ".png", ".webp"],
    maxSizeMB: 5,
    multiple: false,
  },
  pan: {
    label: "PAN Card",
    accept: "application/pdf,image/jpeg,image/png,image/jpg,image/webp",
    extensions: [".pdf", ".jpg", ".jpeg", ".png", ".webp"],
    maxSizeMB: 5,
    multiple: false,
  },
  certificate: {
    label: "Certificates",
    accept: "application/pdf,image/jpeg,image/png,image/jpg,image/webp",
    extensions: [".pdf", ".jpg", ".jpeg", ".png", ".webp"],
    maxSizeMB: 5,
    multiple: true,
  },
};

const getFileIcon = (fileType) => {
  if (fileType === "logo") return Image;
  return FileText;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const validateFile = (file, config) => {
  const errors = [];

  // Check file size
  if (file.size > config.maxSizeMB * 1024 * 1024) {
    errors.push(`File size exceeds ${config.maxSizeMB}MB limit`);
  }

  // Check file type
  const fileExtension = "." + file.name.split(".").pop().toLowerCase();
  if (!config.extensions.includes(fileExtension)) {
    errors.push(`Invalid file type. Allowed: ${config.extensions.join(", ")}`);
  }

  return errors;
};

export default function FileUploadComponent({
  documentType,
  value,
  onChange,
  disabled = false,
}) {
  const config = FILE_CONFIG[documentType];
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  // Parse value to array for multiple files
  const currentFiles = Array.isArray(value) ? value : value ? [value] : [];

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || uploading) return;

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    await processFiles(files);
    // Reset input to allow selecting same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processFiles = async (files) => {
    setError("");
    setSuccess("");

    if (!config.multiple && files.length > 1) {
      setError(`Only one file is allowed for ${config.label}`);
      return;
    }

    // Validate each file
    for (const file of files) {
      const validationErrors = validateFile(file, config);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(", "));
        return;
      }
    }

    // Upload each file
    const uploadedUrls = [...currentFiles];

    for (const file of files) {
      try {
        await uploadFile(file, (url) => {
          uploadedUrls.push(url);
        });
      } catch (uploadError) {
        setError(uploadError.message || "Failed to upload file");
        return;
      }
    }

    // Update form value
    const newValue = config.multiple ? uploadedUrls : uploadedUrls[0];
    onChange(newValue);
    setSuccess("File uploaded successfully");

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(""), 3000);
  };

  const uploadFile = async (file, onUploadComplete) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get pre-signed upload URL
      const uploadUrlResponse = await api.put("/worker/documents/upload-url", {
        file_type: documentType,
      });

      const { upload_url, file_url } = uploadUrlResponse.data.data;

      if (!upload_url || !file_url) {
        throw new Error("Failed to get upload URL");
      }

      // Step 2: Upload file to S3 using pre-signed URL
      await uploadToS3(upload_url, file, (progress) => {
        setUploadProgress(progress);
      });

      // Step 3: Return the file URL
      onUploadComplete(file_url);
    } catch (error) {
      console.error("Upload error:", error);
      throw new Error(error.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadToS3 = async (url, file, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed - network error"));
      });

      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });
  };

  const handleRemoveFile = (indexToRemove) => {
    if (config.multiple) {
      const newFiles = currentFiles.filter(
        (_, index) => index !== indexToRemove,
      );
      onChange(newFiles);
    } else {
      onChange("");
    }
    setError("");
    setSuccess("");
  };

  const FileIcon = getFileIcon(documentType);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {config.label}
        {!config.multiple && <span className="text-red-600"> *</span>}
      </label>

      {/* Drag and Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 transition-colors ${
          isDragging
            ? "border-purple-500 bg-purple-50"
            : "border-gray-300 hover:border-purple-400"
        } ${disabled || uploading ? "cursor-not-allowed opacity-60" : ""}`}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={config.accept}
          multiple={config.multiple}
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center text-center">
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
              <p className="mt-2 text-sm font-medium text-gray-700">
                Uploading... {uploadProgress}%
              </p>
              <div className="mt-2 h-2 w-full max-w-xs rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-purple-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-semibold text-purple-600">
                  Click to browse
                </span>{" "}
                or drag and drop
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {config.extensions.join(", ").toUpperCase()} up to{" "}
                {config.maxSizeMB}MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Uploaded Files List */}
      {currentFiles.length > 0 && currentFiles.some(Boolean) && (
        <div className="mt-3 space-y-2">
          {currentFiles.map((fileUrl, index) => {
            if (!fileUrl) return null;

            const fileName = fileUrl.split("/").pop() || `File ${index + 1}`;

            return (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileIcon className="h-5 w-5 flex-shrink-0 text-gray-500" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-700">
                      {fileName.length > 30
                        ? `...${fileName.slice(-27)}`
                        : fileName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{fileUrl}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  disabled={disabled || uploading}
                  className="ml-2 flex-shrink-0 rounded-lg p-1 text-gray-500 hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Export file configurations for external use
export { FILE_CONFIG };
