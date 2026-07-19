module.exports = {
  root: true,
  env: {
    browser: true, // window, setTimeout 등
    node: true,
    es2021: true,
  },
  extends: ["expo", "prettier"],
  plugins: ["import"],
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
      "react-native": {}, // ← RN 전용 resolver (Metro 경로 인식)
    },
  },
  rules: {
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "import/namespace": "off",
    // 필요시 임시 완화(권장X): 아래 주석 해제
    // "import/no-unresolved": ["off"],
    // 혹은 특정 패키지만 예외
    // "import/no-unresolved": ["error", { ignore: ["^react-native-vector-icons/"] }],
  },
};
