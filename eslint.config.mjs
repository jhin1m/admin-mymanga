import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // 🟢 Cấu hình này là tối ưu: Chỉ tắt những quy tắc gây khó chịu
      // Ví dụ: Tắt cảnh báo về việc không dùng thẻ <Image> của Next.js (nếu bạn biết rõ rủi ro)
      "@next/next/no-img-element": "off", 
      // Tắt cảnh báo về việc import React khi dùng JSX (không cần thiết trong Next.js)
      "react/react-in-jsx-scope": "off", 
      // Chuyển cảnh báo về dependency của hooks thành "warn" thay vì "error"
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;