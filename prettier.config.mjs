/** @type {import("@trivago/prettier-plugin-sort-imports").PrettierConfig & import("prettier-plugin-tailwindcss").PluginOptions} */
const prettierConfig = {
  plugins: [
    "@trivago/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss",
  ],
  trailingComma: "all",
  singleQuote: false,
  semi: true,
  importOrder: ["^[A-Za-z]/(.*)$", "^@ui/(.*)$", "^@(.*)$", "^[./]"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  tailwindConfig: "tailwind.config.ts",
  tailwindFunctions: ["tv"], // Read more: https://github.com/tailwindlabs/prettier-plugin-tailwindcss#sorting-classes-in-function-calls
};

export default prettierConfig;
