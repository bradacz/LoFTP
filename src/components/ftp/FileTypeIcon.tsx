import { Icon } from "@iconify/react";
import defaultFile from "@iconify-icons/vscode-icons/default-file";
import defaultFolder from "@iconify-icons/vscode-icons/default-folder";
import folderApi from "@iconify-icons/vscode-icons/folder-type-api";
import folderApp from "@iconify-icons/vscode-icons/folder-type-app";
import folderConfig from "@iconify-icons/vscode-icons/folder-type-config";
import folderDist from "@iconify-icons/vscode-icons/folder-type-dist";
import folderDocs from "@iconify-icons/vscode-icons/folder-type-docs";
import folderGit from "@iconify-icons/vscode-icons/folder-type-git";
import folderImages from "@iconify-icons/vscode-icons/folder-type-images";
import folderNode from "@iconify-icons/vscode-icons/folder-type-node";
import folderPublic from "@iconify-icons/vscode-icons/folder-type-public";
import folderServer from "@iconify-icons/vscode-icons/folder-type-server";
import folderSrc from "@iconify-icons/vscode-icons/folder-type-src";
import folderTest from "@iconify-icons/vscode-icons/folder-type-test";
import audioIcon from "@iconify-icons/vscode-icons/file-type-audio";
import bunIcon from "@iconify-icons/vscode-icons/file-type-bun";
import cIcon from "@iconify-icons/vscode-icons/file-type-c";
import cppIcon from "@iconify-icons/vscode-icons/file-type-cpp";
import cssIcon from "@iconify-icons/vscode-icons/file-type-css";
import dartIcon from "@iconify-icons/vscode-icons/file-type-dartlang";
import dockerIcon from "@iconify-icons/vscode-icons/file-type-docker";
import dotEnvIcon from "@iconify-icons/vscode-icons/file-type-dotenv";
import eslintIcon from "@iconify-icons/vscode-icons/file-type-eslint";
import excelIcon from "@iconify-icons/vscode-icons/file-type-excel";
import fontIcon from "@iconify-icons/vscode-icons/file-type-font";
import gitIcon from "@iconify-icons/vscode-icons/file-type-git";
import goIcon from "@iconify-icons/vscode-icons/file-type-go";
import htmlIcon from "@iconify-icons/vscode-icons/file-type-html";
import imageIcon from "@iconify-icons/vscode-icons/file-type-image";
import iniIcon from "@iconify-icons/vscode-icons/file-type-ini";
import javaIcon from "@iconify-icons/vscode-icons/file-type-java";
import jsIcon from "@iconify-icons/vscode-icons/file-type-js";
import jsonIcon from "@iconify-icons/vscode-icons/file-type-json";
import licenseIcon from "@iconify-icons/vscode-icons/file-type-license";
import logIcon from "@iconify-icons/vscode-icons/file-type-log";
import luaIcon from "@iconify-icons/vscode-icons/file-type-lua";
import markdownIcon from "@iconify-icons/vscode-icons/file-type-markdown";
import mdxIcon from "@iconify-icons/vscode-icons/file-type-mdx";
import npmIcon from "@iconify-icons/vscode-icons/file-type-npm";
import pdfIcon from "@iconify-icons/vscode-icons/file-type-pdf2";
import phpIcon from "@iconify-icons/vscode-icons/file-type-php";
import postcssIcon from "@iconify-icons/vscode-icons/file-type-postcss";
import powershellIcon from "@iconify-icons/vscode-icons/file-type-powershell";
import powerpointIcon from "@iconify-icons/vscode-icons/file-type-powerpoint";
import prettierIcon from "@iconify-icons/vscode-icons/file-type-prettier";
import pythonIcon from "@iconify-icons/vscode-icons/file-type-python";
import reactJsIcon from "@iconify-icons/vscode-icons/file-type-reactjs";
import reactTsIcon from "@iconify-icons/vscode-icons/file-type-reactts";
import rubyIcon from "@iconify-icons/vscode-icons/file-type-ruby";
import rustIcon from "@iconify-icons/vscode-icons/file-type-rust";
import sassIcon from "@iconify-icons/vscode-icons/file-type-sass";
import scssIcon from "@iconify-icons/vscode-icons/file-type-scss";
import shellIcon from "@iconify-icons/vscode-icons/file-type-shell";
import sqlIcon from "@iconify-icons/vscode-icons/file-type-sql";
import svelteIcon from "@iconify-icons/vscode-icons/file-type-svelte";
import svgIcon from "@iconify-icons/vscode-icons/file-type-svg";
import swiftIcon from "@iconify-icons/vscode-icons/file-type-swift";
import tailwindIcon from "@iconify-icons/vscode-icons/file-type-tailwind";
import textIcon from "@iconify-icons/vscode-icons/file-type-text";
import tomlIcon from "@iconify-icons/vscode-icons/file-type-toml";
import tsconfigIcon from "@iconify-icons/vscode-icons/file-type-tsconfig";
import tsIcon from "@iconify-icons/vscode-icons/file-type-typescript";
import videoIcon from "@iconify-icons/vscode-icons/file-type-video";
import viteIcon from "@iconify-icons/vscode-icons/file-type-vite";
import vueIcon from "@iconify-icons/vscode-icons/file-type-vue";
import wordIcon from "@iconify-icons/vscode-icons/file-type-word";
import xmlIcon from "@iconify-icons/vscode-icons/file-type-xml";
import yamlIcon from "@iconify-icons/vscode-icons/file-type-yaml";
import zipIcon from "@iconify-icons/vscode-icons/file-type-zip";
import { cn } from "@/lib/utils";

type IconData = typeof defaultFile;

interface FileTypeIconProps {
  fileName: string;
  isDirectory: boolean;
  className?: string;
}

const DIRECTORY_ICON_BY_NAME: Record<string, IconData> = {
  ".git": folderGit,
  "__tests__": folderTest,
  api: folderApi,
  app: folderApp,
  apps: folderApp,
  asset: folderImages,
  assets: folderImages,
  build: folderDist,
  config: folderConfig,
  configs: folderConfig,
  dist: folderDist,
  doc: folderDocs,
  docs: folderDocs,
  documentation: folderDocs,
  img: folderImages,
  image: folderImages,
  images: folderImages,
  media: folderImages,
  node_modules: folderNode,
  out: folderDist,
  public: folderPublic,
  server: folderServer,
  src: folderSrc,
  source: folderSrc,
  test: folderTest,
  tests: folderTest,
};

const FILE_ICON_BY_NAME: Record<string, IconData> = {
  ".dockerignore": dockerIcon,
  ".editorconfig": iniIcon,
  ".env": dotEnvIcon,
  ".env.example": dotEnvIcon,
  ".env.local": dotEnvIcon,
  ".env.production": dotEnvIcon,
  ".env.staging": dotEnvIcon,
  ".env.test": dotEnvIcon,
  ".eslintignore": eslintIcon,
  ".eslintrc": eslintIcon,
  ".eslintrc.cjs": eslintIcon,
  ".eslintrc.js": eslintIcon,
  ".eslintrc.json": eslintIcon,
  ".gitattributes": gitIcon,
  ".gitignore": gitIcon,
  ".prettierrc": prettierIcon,
  ".prettierrc.json": prettierIcon,
  "bun.lock": bunIcon,
  "bun.lockb": bunIcon,
  "docker-compose.yml": dockerIcon,
  "docker-compose.yaml": dockerIcon,
  "Dockerfile": dockerIcon,
  "eslint.config.js": eslintIcon,
  "eslint.config.mjs": eslintIcon,
  "eslint.config.ts": eslintIcon,
  "LICENSE": licenseIcon,
  "LICENCE": licenseIcon,
  "npm-shrinkwrap.json": npmIcon,
  "package-lock.json": npmIcon,
  "package.json": npmIcon,
  "postcss.config.cjs": postcssIcon,
  "postcss.config.js": postcssIcon,
  "postcss.config.mjs": postcssIcon,
  "prettier.config.cjs": prettierIcon,
  "prettier.config.js": prettierIcon,
  "README": markdownIcon,
  "README.md": markdownIcon,
  "tailwind.config.cjs": tailwindIcon,
  "tailwind.config.js": tailwindIcon,
  "tailwind.config.ts": tailwindIcon,
  "tsconfig.app.json": tsconfigIcon,
  "tsconfig.json": tsconfigIcon,
  "tsconfig.node.json": tsconfigIcon,
  "vite.config.js": viteIcon,
  "vite.config.mjs": viteIcon,
  "vite.config.ts": viteIcon,
};

const FILE_ICON_BY_NORMALIZED_NAME = Object.fromEntries(
  Object.entries(FILE_ICON_BY_NAME).map(([fileName, icon]) => [fileName.toLowerCase(), icon])
) as Record<string, IconData>;

const FILE_ICON_BY_EXTENSION: Record<string, IconData> = {
  "7z": zipIcon,
  avi: videoIcon,
  avif: imageIcon,
  bash: shellIcon,
  bmp: imageIcon,
  c: cIcon,
  cjs: jsIcon,
  cpp: cppIcon,
  css: cssIcon,
  csv: textIcon,
  dart: dartIcon,
  doc: wordIcon,
  docx: wordIcon,
  eot: fontIcon,
  fish: shellIcon,
  gif: imageIcon,
  go: goIcon,
  gz: zipIcon,
  h: cIcon,
  hpp: cppIcon,
  html: htmlIcon,
  ico: imageIcon,
  ini: iniIcon,
  java: javaIcon,
  jpeg: imageIcon,
  jpg: imageIcon,
  js: jsIcon,
  json: jsonIcon,
  jsx: reactJsIcon,
  log: logIcon,
  lua: luaIcon,
  md: markdownIcon,
  mdx: mdxIcon,
  mjs: jsIcon,
  mov: videoIcon,
  mp3: audioIcon,
  mp4: videoIcon,
  ogg: audioIcon,
  otf: fontIcon,
  pdf: pdfIcon,
  php: phpIcon,
  png: imageIcon,
  ppt: powerpointIcon,
  pptx: powerpointIcon,
  ps1: powershellIcon,
  py: pythonIcon,
  rar: zipIcon,
  rb: rubyIcon,
  rs: rustIcon,
  sass: sassIcon,
  scss: scssIcon,
  sh: shellIcon,
  sql: sqlIcon,
  svg: svgIcon,
  swift: swiftIcon,
  tar: zipIcon,
  toml: tomlIcon,
  ts: tsIcon,
  tsx: reactTsIcon,
  ttf: fontIcon,
  txt: textIcon,
  vue: vueIcon,
  wav: audioIcon,
  webm: videoIcon,
  webp: imageIcon,
  woff: fontIcon,
  woff2: fontIcon,
  xls: excelIcon,
  xlsx: excelIcon,
  xml: xmlIcon,
  yaml: yamlIcon,
  yml: yamlIcon,
  zip: zipIcon,
  zsh: shellIcon,
};

function getExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex <= 0 || lastDotIndex === fileName.length - 1) return "";
  return fileName.slice(lastDotIndex + 1).toLowerCase();
}

function getFileIcon(fileName: string, isDirectory: boolean) {
  if (isDirectory) {
    return DIRECTORY_ICON_BY_NAME[fileName.toLowerCase()] ?? defaultFolder;
  }

  return FILE_ICON_BY_NORMALIZED_NAME[fileName.toLowerCase()] ?? FILE_ICON_BY_EXTENSION[getExtension(fileName)] ?? defaultFile;
}

export function FileTypeIcon({ fileName, isDirectory, className }: FileTypeIconProps) {
  return (
    <Icon
      icon={getFileIcon(fileName, isDirectory)}
      className={cn("h-4 w-4 shrink-0", className)}
      aria-hidden="true"
    />
  );
}
