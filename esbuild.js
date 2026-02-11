const esbuild = require("esbuild");

async function run() {
    const ctx = await esbuild.context({
        entryPoints: ["src/extension.ts"],
        bundle: true,
        outfile: "dist/extension.js",
        platform: "node",
        format: "cjs",
        external: ["vscode"],
        sourcemap: true,
        target: "node18",
    });

    if (process.argv.includes("--watch")) {
        await ctx.watch();
        console.log("Watching...");
    } else {
        await ctx.rebuild();
        await ctx.dispose();
        console.log("Build complete");
    }
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
