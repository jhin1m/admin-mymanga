"use client";
import React from "react";

interface ChapterInfoFormProps {
  name: string;
  onChange: (name: string) => void;
}

const ChapterInfoForm: React.FC<ChapterInfoFormProps> = ({ name, onChange }) => {
  return (
    <div className="bg-gray-900 rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-white">Thông tin</h2>
      <div>
        <label htmlFor="chapter-name" className="block text-sm font-medium text-gray-300 mb-2">
          Tên chương <span className="text-red-500">*</span>
        </label>
        <input
          id="chapter-name"
          type="text"
          value={name}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nhập tên chương (vd: Chapter 13)"
          required
          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
        />
      </div>
    </div>
  );
};

export default ChapterInfoForm;
