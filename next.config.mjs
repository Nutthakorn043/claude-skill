/**
 * Static export served from https://<user>.github.io/claude-skill/
 *
 * basePath is fixed rather than read from the environment so a local build and
 * the deployed build produce byte-identical output. Rename the repo and this
 * value must change with it.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const basePath = "/claude-skill";

/** @type {import('next').NextConfig} */
export default {
  output: "export",
  basePath,
  // Pin the workspace root, otherwise a stray package-lock.json further up the
  // filesystem makes Turbopack guess the wrong one.
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};
