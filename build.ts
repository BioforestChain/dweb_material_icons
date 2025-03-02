import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import darkerJson from "./vsc-material-theme-icons/out/variants/Material-Theme-Icons-Darker.json" with {
  type: "json",
};
import lightJson from "./vsc-material-theme-icons/out/variants/Material-Theme-Icons-Light.json" with {
  type: "json",
};
const buildDir = url.fileURLToPath(
  import.meta.resolve("./build"),
);
const debugDir = url.fileURLToPath(
  import.meta.resolve("./debug"),
);
const outDir = url.fileURLToPath(
  import.meta.resolve("./vsc-material-theme-icons/out"),
);
const iconsDir = path.join(outDir, "icons");
import { compress } from "./zstd.ts";
const textEncoder = new TextEncoder();
const clearDir = (dirname: string) => {
  if (fs.existsSync(dirname)) {
    fs.rmSync(dirname, { recursive: true });
  }
  fs.mkdirSync(dirname, { recursive: true });
};

export function buildIcons() {
  clearDir(debugDir);
  clearDir(buildDir);
  const bundle = {} as any;
  for (
    const { name, json } of [{ name: "darker", json: darkerJson }, {
      name: "light",
      json: lightJson,
    }]
  ) {
    const fileExtnameMap: Record<string, string> = {};
    const fileFullnameMap: Record<string, string> = {};
    const folderFullnameMap: Record<string, string> = {};
    const defaultMap: Record<string, string> = {};
    const iconDefinitions = new Map(
      Object.entries(json.iconDefinitions).map(([key, value]) => [
        key,
        value.iconPath.replace("../icons/", "").replace(".svg", ""),
      ]),
    );
    const iconDefAliasMap = new Map([
      ["file_rollup", "_file_rollup"],
      ["_folder_style", "_folder_css"],
      ["_file_cssmap", "_file_css-map"],
      ["_file_jsmap", "_file_js_map"],
      ["_folder_cssmap", "_folder_css-map"],
      ["_folder_jsmap", "_folder_js-map"],
    ]);
    const getIconDefinitions = (
      def: string,
      scope: string,
      success: (iconPath: string) => void,
    ) => {
      let iconPath = iconDefinitions.get(def);
      if (iconPath === undefined) {
        const defAlias = iconDefAliasMap.get(def);
        if (defAlias !== undefined) {
          iconPath = iconDefinitions.get(defAlias);
        }
      }
      if (iconPath === undefined) {
        console.error(`no found iconPath in ${scope}=${def}`);
      } else {
        success(iconPath);
      }
    };
    /// 1
    Object.entries(json.fileNames).forEach(([key, value]) => {
      getIconDefinitions(
        value,
        `fileNames.${key}`,
        (iconPath) => fileFullnameMap[key] = iconPath,
      );
    });
    /// 2
    getIconDefinitions(
      json.file,
      `file`,
      (iconPath) => defaultMap.file = iconPath,
    );
    getIconDefinitions(
      json.folder,
      `folder`,
      (iconPath) => defaultMap.folder = iconPath,
    );
    /// 3
    Object.entries(json.folderNames).forEach(([key, value]) => {
      getIconDefinitions(
        value,
        `folderNames.${key}`,
        (iconPath) => folderFullnameMap[key] = iconPath,
      );
    });
    /// 4
    Object.entries(json.fileExtensions).forEach(([key, value]) => {
      getIconDefinitions(
        value,
        `fileExtensions.${key}`,
        (iconPath) => fileExtnameMap[key] = iconPath,
      );
    });

    const iconResources: Record<string, string> = {};
    new Set([
      ...Object.values(fileExtnameMap),
      ...Object.values(fileFullnameMap),
      ...Object.values(folderFullnameMap),
      ...Object.values(defaultMap),
    ]).forEach((iconName) => {
      iconResources[iconName] = fs.readFileSync(
        path.join(iconsDir, iconName + ".svg"),
        "utf-8",
      );
    });

    bundle[name] = {
      iconResources,
      fileExtnameMap,
      fileFullnameMap,
      folderFullnameMap,
      defaultMap,
    };
    fs.writeFileSync(
      path.join(debugDir, name + ".json"),
      textEncoder.encode(JSON.stringify(bundle[name], null, 2)),
    );
  }
  const binary = compress(textEncoder.encode(JSON.stringify(bundle)), 10);
  fs.writeFileSync(path.join(buildDir, "bundle.json.zstd"), binary);
  return { binary, bundle };
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  buildIcons();
}
