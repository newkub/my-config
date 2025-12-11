import { type Dirent, promises as fs } from "node:fs";
import path from "node:path";

async function main() {
  console.log("🚀 Starting export process...");
  await exportAllFiles();
  console.log("✅ Export process completed");
}

export async function exportAllFiles() {
  try {
    const srcDir = path.join(process.cwd(), "src");
    console.log("📂 Getting all files from src/...");
    const files = await getAllFiles(srcDir);
    console.log(`📄 Found ${files.length} files`);

    // Create exports object
    const exportsObj: Record<string, string> = {
      ".": "./dist/index.js",
      "./package.json": "./package.json",
    };

    // Add all TypeScript files as exports
    for (const file of files) {
      if (file.endsWith(".ts") && !file.endsWith(".test.ts") && !file.endsWith(".spec.ts")) {
        const relativePath = path.relative(srcDir, file);
        const exportKey = `./${relativePath.replace(/\.ts$/, "").replace(/\\/g, "/")}`;
        const exportPath = `./dist/${relativePath.replace(/\.ts$/, ".js").replace(/\\/g, "/")}`;
        
        // Skip index.ts as it's already added as "."
        if (exportKey !== "./index") {
          exportsObj[exportKey] = exportPath;
        }
      }
    }

    console.log(`📦 Generating ${Object.keys(exportsObj).length} exports`);

    // Update package.json
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJsonContent = await fs.readFile(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(packageJsonContent);
    
    packageJson.exports = exportsObj;
    
    await fs.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + "\n",
      "utf-8",
    );

    console.log("✨ Successfully updated package.json exports");
  } catch (error) {
    console.error("❌ Error exporting files:", error);
    process.exit(1);
  }
}

async function getAllFiles(dir: string): Promise<string[]> {
  try {
    // Skip if directory doesn't exist
    await fs.access(dir);

    const dirents = await fs.readdir(dir, { withFileTypes: true });

    // Ignore these directories and files
    const IGNORE_DIRS = ["node_modules", "dist", ".git", "hooks", "__tests__", "test", "tests"];

    const files = (
      await Promise.all(
        dirents
          .filter((dirent) => !IGNORE_DIRS.includes(dirent.name))
          .map(handleDirent),
      )
    ).flat() as string[];

    return files;
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

async function handleDirent(dirent: Dirent): Promise<string[]> {
  const res = path.resolve(process.cwd(), dirent.name);
  return dirent.isDirectory() ? getAllFiles(res) : [res];
}

// Run main function
main().catch(console.error);
