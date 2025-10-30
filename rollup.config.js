import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import terser from "@rollup/plugin-terser";

export default [
  {
    input: "src/index.js",
    output: [
      {
        file: "dist/index.js",
        format: "cjs",
        sourcemap: true,
      },
      {
        file: "dist/index.esm.js",
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      babel({
        babelHelpers: "bundled",
        exclude: "node_modules/**",
        extensions: [".js", ".jsx"],
        presets: [
          ["@babel/preset-env", { modules: false }],
          ["@babel/preset-react", { runtime: "automatic" }],
        ],
      }),
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      terser(),
    ],
    external: ["react", "react-dom", "lucide-react", "react-toastify"],
  },
];
