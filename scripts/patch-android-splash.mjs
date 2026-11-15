#!/usr/bin/env node
/**
 * 给生成的 Android 工程补上「启动窗口背景色」，消除启动时的背景闪烁。
 *
 * 为什么需要：
 *   Tauri 的 Android 模板主题继承 `Theme.MaterialComponents.DayNight.NoActionBar`，
 *   它的 `android:windowBackground` 是 Material 灰底（暗色 #303030 / 亮色 #FAFAFA）。
 *   而启动动画的背景是深色品牌色 #071218（见 src/styles/launch.css 的 --launch-bg），
 *   于是点开应用会先闪一下灰/白，再跳进启动动画。
 *
 *   这里把窗口首帧背景固定成品牌色，与 index.html 首帧、launch.css 三层对齐。
 *   启动画面本身固定深色，不随系统 DayNight 切换。
 *
 * 用法：
 *   node scripts/patch-android-splash.mjs
 *   （tauri.conf.json 的 beforeBuildCommand 已自动调用，一般不用手动跑）
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const res = join(root, "src-tauri", "gen", "android", "app", "src", "main", "res");

if (!existsSync(res)) {
  console.log("[splash] Android 跳过：gen/android 还没生成（先跑 tauri android init）");
  process.exit(0);
}

// 与 src/styles/launch.css 的 --launch-bg、index.html 首帧背景一致
const BRAND = "#071218";

// 1) 写 color 资源。values-night 不单独建，窗口背景固定不分主题。
const valuesDir = join(res, "values");
mkdirSync(valuesDir, { recursive: true });
const colorsPath = join(valuesDir, "colors.xml");
let colors = existsSync(colorsPath)
  ? readFileSync(colorsPath, "utf8")
  : "<resources>\n</resources>\n";
if (!colors.includes("launch_background")) {
  colors = colors.replace("</resources>", `  <color name="launch_background">${BRAND}</color>\n</resources>`);
  writeFileSync(colorsPath, colors);
}

// 2) 在主题里设置 windowBackground，覆盖父主题的 Material 灰底。
const themesPath = join(valuesDir, "themes.xml");
const themes = readFileSync(themesPath, "utf8");
if (!themes.includes("windowBackground")) {
  const marker = "<!-- Customize your theme here. -->";
  if (!themes.includes(marker)) {
    throw new Error("Android themes.xml 结构变化，未找到可插入的标记");
  }
  const item = `${marker}\n        <!-- 首帧背景与启动动画一致，避免原生窗口 → WebView 闪烁 -->\n        <item name="android:windowBackground">@color/launch_background</item>`;
  writeFileSync(themesPath, themes.replace(marker, item));
  console.log(`[splash] Android 启动窗口背景已对齐 → ${BRAND}`);
} else {
  console.log("[splash] Android 启动窗口背景已存在，跳过");
}