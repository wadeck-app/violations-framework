const __importMetaUrl = require('node:url').pathToFileURL(__filename).href;
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../node_modules/@wadeck-app/shared-updater/dist/shared/semver.js
function semverLte(a, b) {
  const normalize = (v) => v.replace(/^v/, "").split(/[-.]/).map(Number);
  const pa = normalize(a);
  const pb = normalize(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na < nb)
      return true;
    if (na > nb)
      return false;
  }
  return true;
}
var init_semver = __esm({
  "../../node_modules/@wadeck-app/shared-updater/dist/shared/semver.js"() {
  }
});

// ../../node_modules/@wadeck-app/shared-updater/dist/shared/npm.js
function execNpm(args, opts = {}) {
  if (USE_NPM_CLI) {
    return (0, import_node_child_process.execFileSync)(process.execPath, [NPM_CLI_JS, ...args], {
      encoding: "utf8",
      windowsHide: true,
      ...opts
    });
  }
  return (0, import_node_child_process.execSync)(["npm", ...args].join(" "), {
    encoding: "utf8",
    windowsHide: true,
    ...opts
  });
}
var import_node_child_process, import_node_fs, import_node_path, NPM_CLI_JS, USE_NPM_CLI;
var init_npm = __esm({
  "../../node_modules/@wadeck-app/shared-updater/dist/shared/npm.js"() {
    import_node_child_process = require("node:child_process");
    import_node_fs = require("node:fs");
    import_node_path = require("node:path");
    NPM_CLI_JS = (0, import_node_path.join)((0, import_node_path.dirname)(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
    USE_NPM_CLI = (0, import_node_fs.existsSync)(NPM_CLI_JS);
  }
});

// ../../node_modules/@wadeck-app/shared-updater/dist/shared/lock.js
function tryAcquireLock(lockFile) {
  (0, import_node_fs2.mkdirSync)((0, import_node_path2.dirname)(lockFile), { recursive: true });
  if ((0, import_node_fs2.existsSync)(lockFile)) {
    try {
      const { pid, ts } = JSON.parse((0, import_node_fs2.readFileSync)(lockFile, "utf8"));
      const age = Date.now() - ts;
      if (age < LOCK_STALE_MS) {
        try {
          process.kill(pid, 0);
          return false;
        } catch {
        }
      }
    } catch {
    }
  }
  (0, import_node_fs2.writeFileSync)(lockFile, JSON.stringify({ pid: process.pid, ts: Date.now() }));
  return true;
}
function releaseLock(lockFile) {
  try {
    (0, import_node_fs2.rmSync)(lockFile);
  } catch {
  }
}
var import_node_fs2, import_node_path2, LOCK_STALE_MS;
var init_lock = __esm({
  "../../node_modules/@wadeck-app/shared-updater/dist/shared/lock.js"() {
    import_node_fs2 = require("node:fs");
    import_node_path2 = require("node:path");
    LOCK_STALE_MS = 10 * 60 * 1e3;
  }
});

// ../../node_modules/@wadeck-app/shared-updater/dist/shared/state.js
function writeState(stateFile, state) {
  (0, import_node_fs3.mkdirSync)((0, import_node_path3.dirname)(stateFile), { recursive: true });
  (0, import_node_fs3.writeFileSync)(stateFile, JSON.stringify(state, null, 2));
}
function readCache(cacheFile) {
  try {
    return JSON.parse((0, import_node_fs3.readFileSync)(cacheFile, "utf8"));
  } catch {
    return null;
  }
}
function writeCache(cacheFile, cache) {
  (0, import_node_fs3.mkdirSync)((0, import_node_path3.dirname)(cacheFile), { recursive: true });
  (0, import_node_fs3.writeFileSync)(cacheFile, JSON.stringify(cache, null, 2));
}
function stateFilePath(configDir2) {
  return `${configDir2}/update-state.json`;
}
function cacheFilePath(configDir2) {
  return `${configDir2}/update-cache.json`;
}
function lockFilePath(configDir2) {
  return `${configDir2}/update.lock`;
}
var import_node_fs3, import_node_path3;
var init_state = __esm({
  "../../node_modules/@wadeck-app/shared-updater/dist/shared/state.js"() {
    import_node_fs3 = require("node:fs");
    import_node_path3 = require("node:path");
  }
});

// ../../node_modules/@wadeck-app/shared-updater/dist/shared/config.js
function readUpdateConfig(configDir2) {
  const configFile = (0, import_node_path4.join)(configDir2, "config.yml");
  if (!(0, import_node_fs4.existsSync)(configFile)) {
    return { channel: DEFAULT_CHANNEL, checkIntervalMs: DEFAULT_CHECK_INTERVAL_MS, disabled: false };
  }
  const raw = (0, import_node_fs4.readFileSync)(configFile, "utf8");
  const channel = raw.match(/^channel:\s*(\S+)/m)?.[1] ?? DEFAULT_CHANNEL;
  const intervalRaw = raw.match(/^checkInterval:\s*(\S+)/m)?.[1];
  const disabled = /^autoUpdate:\s*false/m.test(raw);
  return {
    channel,
    checkIntervalMs: intervalRaw ? parseIntervalMs(intervalRaw) : DEFAULT_CHECK_INTERVAL_MS,
    disabled
  };
}
function parseIntervalMs(s) {
  const match = s.match(/^(\d+)(ms|s|m|h|d)?$/);
  if (!match)
    return DEFAULT_CHECK_INTERVAL_MS;
  const n = parseInt(match[1], 10);
  switch (match[2]) {
    case "ms":
      return n;
    case "s":
      return n * 1e3;
    case "m":
      return n * 60 * 1e3;
    case "h":
      return n * 60 * 60 * 1e3;
    case "d":
      return n * 24 * 60 * 60 * 1e3;
    default:
      return n;
  }
}
var import_node_fs4, import_node_path4, DEFAULT_CHANNEL, DEFAULT_CHECK_INTERVAL_MS;
var init_config = __esm({
  "../../node_modules/@wadeck-app/shared-updater/dist/shared/config.js"() {
    import_node_fs4 = require("node:fs");
    import_node_path4 = require("node:path");
    DEFAULT_CHANNEL = "latest";
    DEFAULT_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1e3;
  }
});

// ../../node_modules/@wadeck-app/shared-updater/dist/shared/log.js
function appendLog(configDir2, level, msg) {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const logFile = (0, import_node_path5.join)(configDir2, "logs", `${today}.ndjson`);
  (0, import_node_fs5.mkdirSync)((0, import_node_path5.dirname)(logFile), { recursive: true });
  (0, import_node_fs5.appendFileSync)(logFile, JSON.stringify({ ts: (/* @__PURE__ */ new Date()).toISOString(), level, msg }) + "\n");
}
var import_node_fs5, import_node_path5;
var init_log = __esm({
  "../../node_modules/@wadeck-app/shared-updater/dist/shared/log.js"() {
    import_node_fs5 = require("node:fs");
    import_node_path5 = require("node:path");
  }
});

// ../../node_modules/@wadeck-app/shared-updater/dist/shared/fetch.js
function fetchLatestVersion(pkgName, channel) {
  const tag = channel === "latest" ? "latest" : channel;
  const raw = execNpm(["view", pkgName, `dist-tags.${tag}`], { timeout: 3e4 });
  return raw.trim();
}
var init_fetch = __esm({
  "../../node_modules/@wadeck-app/shared-updater/dist/shared/fetch.js"() {
    init_npm();
  }
});

// ../../node_modules/@wadeck-app/shared-updater/dist/strategies/without-daemon.js
var without_daemon_exports = {};
__export(without_daemon_exports, {
  runWithoutDaemon: () => runWithoutDaemon
});
async function runWithoutDaemon(cfg) {
  const force = process.env["UPDATER_FORCE"] === "1";
  const { pkgName, configDir: configDir2, currentVersion: currentVersion2 } = cfg;
  const lockFile = lockFilePath(configDir2);
  if (!tryAcquireLock(lockFile)) {
    appendLog(configDir2, "info", `${pkgName} updater already running, skipping`);
    return;
  }
  try {
    const updateCfg = readUpdateConfig(configDir2);
    if (updateCfg.disabled)
      return;
    const cache = readCache(cacheFilePath(configDir2));
    const now = Date.now();
    if (!force && cache && now - cache.lastCheckedAt < updateCfg.checkIntervalMs)
      return;
    appendLog(configDir2, "info", `${pkgName} checking for updates (current: ${currentVersion2})`);
    let latestVersion;
    try {
      latestVersion = fetchLatestVersion(pkgName, updateCfg.channel);
    } catch (err) {
      appendLog(configDir2, "warn", `${pkgName} version fetch failed: ${err}`);
      return;
    }
    writeCache(cacheFilePath(configDir2), { lastCheckedAt: now, latestVersion });
    if (semverLte(latestVersion, currentVersion2)) {
      appendLog(configDir2, "info", `${pkgName} is up to date (${currentVersion2})`);
      return;
    }
    appendLog(configDir2, "info", `${pkgName} update available: ${currentVersion2} \u2192 ${latestVersion}`);
    try {
      execNpm(["install", "-g", `${pkgName}@${latestVersion}`], { timeout: 5 * 6e4 });
    } catch (err) {
      appendLog(configDir2, "error", `${pkgName} install failed: ${err}`);
      writeState(stateFilePath(configDir2), {
        status: "failed",
        currentVersion: currentVersion2,
        targetVersion: latestVersion,
        error: String(err),
        timestamp: Date.now()
      });
      return;
    }
    const selfCheckPassed = await selfCheck();
    if (!selfCheckPassed) {
      appendLog(configDir2, "warn", `${pkgName} self-check failed after update, rolling back to ${currentVersion2}`);
      try {
        execNpm(["install", "-g", `${pkgName}@${currentVersion2}`], { timeout: 5 * 6e4 });
        writeState(stateFilePath(configDir2), {
          status: "rolled-back",
          currentVersion: currentVersion2,
          targetVersion: latestVersion,
          previousVersion: currentVersion2,
          timestamp: Date.now()
        });
      } catch (rollbackErr) {
        appendLog(configDir2, "error", `${pkgName} rollback failed: ${rollbackErr}`);
      }
      return;
    }
    writeState(stateFilePath(configDir2), {
      status: "success",
      currentVersion: currentVersion2,
      targetVersion: latestVersion,
      previousVersion: currentVersion2,
      timestamp: Date.now()
    });
    appendLog(configDir2, "info", `${pkgName} updated to ${latestVersion}`);
  } finally {
    releaseLock(lockFile);
  }
}
async function selfCheck() {
  const cmd = process.env["UPDATER_SELF_CHECK_CMD"];
  if (!cmd)
    return true;
  try {
    const { execSync: execSync2 } = await import("node:child_process");
    execSync2(cmd, { timeout: 3e4, windowsHide: true });
    return true;
  } catch {
    return false;
  }
}
var init_without_daemon = __esm({
  "../../node_modules/@wadeck-app/shared-updater/dist/strategies/without-daemon.js"() {
    init_lock();
    init_state();
    init_config();
    init_fetch();
    init_npm();
    init_log();
    init_semver();
  }
});

// ../../node_modules/@wadeck-app/shared-updater/dist/strategies/with-daemon.js
var with_daemon_exports = {};
__export(with_daemon_exports, {
  runWithDaemon: () => runWithDaemon
});
async function runWithDaemon(cfg) {
  const force = process.env["UPDATER_FORCE"] === "1";
  const { pkgName, configDir: configDir2, currentVersion: currentVersion2 } = cfg;
  const lockFile = lockFilePath(configDir2);
  if (!tryAcquireLock(lockFile)) {
    appendLog(configDir2, "info", `${pkgName} updater already running, skipping`);
    return;
  }
  try {
    const updateCfg = readUpdateConfig(configDir2);
    if (updateCfg.disabled)
      return;
    const cache = readCache(cacheFilePath(configDir2));
    const now = Date.now();
    if (!force && cache && now - cache.lastCheckedAt < updateCfg.checkIntervalMs)
      return;
    appendLog(configDir2, "info", `${pkgName} checking for updates (current: ${currentVersion2})`);
    let latestVersion;
    try {
      latestVersion = fetchLatestVersion(pkgName, updateCfg.channel);
    } catch (err) {
      appendLog(configDir2, "warn", `${pkgName} version fetch failed: ${err}`);
      return;
    }
    writeCache(cacheFilePath(configDir2), { lastCheckedAt: now, latestVersion });
    if (semverLte(latestVersion, currentVersion2)) {
      appendLog(configDir2, "info", `${pkgName} is up to date (${currentVersion2})`);
      return;
    }
    appendLog(configDir2, "info", `${pkgName} update available: ${currentVersion2} \u2192 ${latestVersion}`);
    writeState(stateFilePath(configDir2), {
      status: "update-available",
      currentVersion: currentVersion2,
      targetVersion: latestVersion,
      timestamp: Date.now()
    });
    if (force) {
      await triggerImmediateRestart(cfg, latestVersion);
    }
  } finally {
    releaseLock(lockFile);
  }
}
async function triggerImmediateRestart(cfg, targetVersion) {
  const { configDir: configDir2, pkgName } = cfg;
  const portFilePath = `${configDir2}/config.port`;
  const tokenFilePath = `${configDir2}/health_token`;
  if (!(0, import_node_fs6.existsSync)(portFilePath)) {
    appendLog(configDir2, "warn", `${pkgName} --force: daemon not running (no config.port), skipping POST /quit`);
    return;
  }
  let port;
  let token;
  try {
    const data = JSON.parse((0, import_node_fs6.readFileSync)(portFilePath, "utf8"));
    port = data.port;
    token = (0, import_node_fs6.readFileSync)(tokenFilePath, "utf8").trim();
  } catch (err) {
    appendLog(configDir2, "warn", `${pkgName} --force: cannot read port/token: ${err}`);
    return;
  }
  try {
    await fetch(`http://127.0.0.1:${port}/quit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5e3)
    });
    appendLog(configDir2, "info", `${pkgName} --force: POST /quit sent, daemon restarting to apply ${targetVersion}`);
  } catch (err) {
    appendLog(configDir2, "warn", `${pkgName} --force: POST /quit failed: ${err}`);
  }
}
var import_node_fs6;
var init_with_daemon = __esm({
  "../../node_modules/@wadeck-app/shared-updater/dist/strategies/with-daemon.js"() {
    import_node_fs6 = require("node:fs");
    init_lock();
    init_state();
    init_config();
    init_fetch();
    init_log();
    init_semver();
  }
});

// ../../node_modules/@wadeck-app/shared-updater/dist/index.js
init_semver();
init_npm();
init_lock();
init_state();
init_config();
init_log();
init_fetch();
init_without_daemon();
init_with_daemon();
async function runUpdater(cfg) {
  if (cfg.strategy === "without-daemon") {
    const { runWithoutDaemon: run2 } = await Promise.resolve().then(() => (init_without_daemon(), without_daemon_exports));
    return run2(cfg);
  }
  const { runWithDaemon: run } = await Promise.resolve().then(() => (init_with_daemon(), with_daemon_exports));
  return run(cfg);
}

// ../../node_modules/@wadeck-app/shared-cli/dist/ConfigDir.js
var fs = __toESM(require("node:fs"), 1);
var os = __toESM(require("node:os"), 1);
var path = __toESM(require("node:path"), 1);
var ConfigDir = class _ConfigDir {
  // Always uses ~/.config/<appName> (XDG on Linux/macOS, same convention on Windows).
  // XDG_CONFIG_HOME is respected if set.
  static get(appName) {
    const xdg = process.env["XDG_CONFIG_HOME"];
    if (xdg)
      return path.join(xdg, appName);
    return path.join(os.homedir(), ".config", appName);
  }
  // One-time migration from legacy paths to ~/.config/<appName>.
  // Checks %APPDATA%\<appName> (Windows legacy) and ~/.<appName> (old dot-dir pattern).
  static migrateIfNeeded(appName) {
    const newDir = _ConfigDir.get(appName);
    if (fs.existsSync(newDir))
      return;
    const candidates = [];
    const appData = process.env["APPDATA"];
    if (appData)
      candidates.push(path.join(appData, appName));
    candidates.push(path.join(os.homedir(), `.${appName}`));
    for (const oldDir of candidates) {
      if (fs.existsSync(oldDir)) {
        try {
          fs.mkdirSync(path.dirname(newDir), { recursive: true });
          fs.renameSync(oldDir, newDir);
          process.stderr.write(`[${appName}] Config migrated: ${oldDir} \u2192 ${newDir}
`);
        } catch (err) {
          process.stderr.write(`[${appName}] Config migration failed (${err.message}). Your config remains at: ${oldDir}
`);
        }
        return;
      }
    }
  }
};

// dist/updater/entry.js
var import_node_path6 = require("node:path");
var PKG_NAME = "@wadeck-app/violations-cli";
var configDir = process.env["VIOLATIONS_CONFIG_DIR"] ?? ConfigDir.get("violations");
var currentVersion = true ? "2026.08.30-125813-68-8dbb5035" : "0.0.0-dev";
try {
  const npmRoot = execNpm(["root", "-g"], { timeout: 1e4 }).trim();
  const selfCheckCmd = `${process.execPath} ${(0, import_node_path6.join)(npmRoot, PKG_NAME, "violations.cjs")} cli self-check`;
  process.env["UPDATER_SELF_CHECK_CMD"] = selfCheckCmd;
} catch {
}
runUpdater({
  pkgName: PKG_NAME,
  configDir,
  currentVersion,
  strategy: "without-daemon"
}).catch((err) => {
  process.stderr.write(`[violations-updater] fatal: ${err}
`);
  process.exit(1);
});
