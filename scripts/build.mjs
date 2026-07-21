import { copyFile, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

for (const file of ["index.html", "style.css", "effects.css", "progression.css", "game.js"]) {
  await copyFile(file, `dist/${file}`);
}

console.log("Static game built successfully in dist/");
