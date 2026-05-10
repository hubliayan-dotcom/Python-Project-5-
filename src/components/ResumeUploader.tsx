/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from "react";
import { Upload, FileText, CheckCircle2, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export const ResumeUploader: React.FC<Props> = ({ onUpload, isUploading }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl transition-all duration-200 ${
          dragActive
            ? "border-brand-secondary bg-indigo-50/50"
            : "border-neutral-200 hover:border-neutral-300 bg-white"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        id="drop-zone"
      >
        <input
          id="resume-upload"
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt"
          onChange={handleChange}
        />

        <div className="flex flex-col items-center justify-center py-6">
          {isUploading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              <Loader2 className="w-10 h-10 text-brand-secondary animate-spin mb-3" />
              <p className="text-sm font-medium text-neutral-600">Analyzing Resume with AI...</p>
            </motion.div>
          ) : (
            <>
              <div className="p-3 bg-neutral-100 rounded-full mb-3">
                <Upload className="w-6 h-6 text-neutral-500" />
              </div>
              <p className="text-sm font-medium text-neutral-900">
                Drag and drop your resume
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                PDF, DOCX, or TXT up to 10MB
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 text-sm font-semibold text-brand-secondary bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                id="select-file-btn"
              >
                Select File
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
