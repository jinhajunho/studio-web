import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // ✅ Next.js 기본 설정
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // ✅ 공통 무시 경로
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },

  // ✅ 규칙 오버라이드 (여기에 추가)
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",       // any 허용
      "@typescript-eslint/no-unused-vars": "warn",       // 미사용 변수 경고
      "react-hooks/exhaustive-deps": "off",              // useEffect deps 경고 끄기 (필요 시)
    },
  },
];

export default eslintConfig;
