import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { CSSProperties, ReactNode } from "react";

const C = {
  bg: "#050506",
  bg2: "#09090c",
  bg3: "#101016",
  panel: "#14141b",
  panel2: "#181820",
  border: "#27272f",
  borderHot: "#e8111a77",
  red: "#e8111a",
  red2: "#ff2732",
  redDark: "#73070c",
  amber: "#f59e0b",
  green: "#24d06d",
  cyan: "#8ef7ff",
  text: "#f6f6f7",
  muted: "#9a9aa8",
  dim: "#5d5d69",
};

const ASSETS = {
  logoDark: "/logo_dark.png",
  logoWhite: "/logo_dark.png",
  appleMascot: "/mascot_logo_4pple.png",
  androidMascot: "/mascot_logo_android.png",
};

type Build = {
  id: string;
  platform: string;
  channel: string;
  version: string;
  size: string;
  status: string;
  arch: string;
  target: string;
  checksum: string;
  requirements: string[];
  steps: string[];
};

type Feature = {
  id: string;
  code: string;
  title: string;
  signal: string;
  description: string;
  command: string;
  telemetry: string;
};

const builds: Build[] = [
  {
    id: "win-x64",
    platform: "Windows x64",
    channel: "Stable",
    version: "v5.2.1",
    size: "148 MB",
    status: "Production",
    arch: "Win10/11",
    target: "A7-A17 device lab",
    checksum: "A8F2-91D4-CF20-X4W1",
    requirements: ["Windows 10 or 11", "Administrator session", "Apple USB driver", "USB 2.0/3.0 direct port"],
    steps: ["Download the production package", "Run the installer as administrator", "Connect device in DFU or recovery", "Launch X4 and start system check"],
  },
  {
    id: "win-legacy",
    platform: "Windows Legacy",
    channel: "Maintenance",
    version: "v4.9.8",
    size: "132 MB",
    status: "Supported",
    arch: "Win7/8",
    target: "Legacy technician bench",
    checksum: "72B1-X4L0-66EA-884D",
    requirements: ["Windows 7 SP1 or Windows 8", "Legacy USB runtime", ".NET desktop runtime", "Local admin account"],
    steps: ["Install the legacy runtime bundle", "Disable conflicting phone suites", "Attach device with original cable", "Open X4 legacy mode"],
  },
  {
    id: "mac-intel",
    platform: "macOS Intel",
    channel: "Stable",
    version: "v5.2.1",
    size: "164 MB",
    status: "Production",
    arch: "x86_64",
    target: "Ventura / Sonoma",
    checksum: "D21C-INTL-90AB-X4M2",
    requirements: ["Intel Mac", "macOS Ventura or Sonoma", "Finder device access", "Terminal permission approval"],
    steps: ["Download the signed DMG", "Move X4 to Applications", "Approve the helper permission", "Run device detection"],
  },
  {
    id: "mac-silicon",
    platform: "macOS Silicon",
    channel: "Native",
    version: "v5.2.1",
    size: "171 MB",
    status: "Production",
    arch: "ARM64",
    target: "M1/M2/M3/M4",
    checksum: "M4S1-ARM6-7C0D-X4N8",
    requirements: ["Apple Silicon Mac", "macOS Sonoma or newer", "USB-C direct cable", "Security prompt approval"],
    steps: ["Download the ARM64 build", "Open the signed package", "Authorize the helper module", "Start the live compatibility scan"],
  },
];

const features: Feature[] = [
  {
    id: "activation",
    code: "ACT",
    title: "Activation Engine",
    signal: "99.2%",
    description: "Core activation workflow for technician benches that need repeatable, visible, traceable device sessions.",
    command: "x4 activate --profile technician --trace",
    telemetry: "ticket forge, manifest patch, live validation",
  },
  {
    id: "ramdisk",
    code: "RAM",
    title: "Ramdisk Utilities",
    signal: "A7-A17",
    description: "Boot, mount, inspect and recover devices through a controlled ramdisk workflow with clean state feedback.",
    command: "x4 ramdisk boot --chipset auto",
    telemetry: "dfu handshake, mount map, ssh bridge",
  },
  {
    id: "fmi",
    code: "FMI",
    title: "FMI Intelligence",
    signal: "Live",
    description: "Device intelligence panel for Find My status, model identity, serial visibility and technician notes.",
    command: "x4 fmi status --serial detected",
    telemetry: "serial probe, status cache, device profile",
  },
  {
    id: "restore",
    code: "IPSW",
    title: "Restore Control",
    signal: "DFU",
    description: "Guided restore utilities for IPSW selection, recovery exits, diagnostics and repeatable USB handoff.",
    command: "x4 restore prepare --mode recovery",
    telemetry: "ipsw map, recovery exit, nand check",
  },
  {
    id: "support",
    code: "OPS",
    title: "Technician Ops",
    signal: "24/7",
    description: "Operational surface for stores: release notes, stable builds, support handoff and system health cues.",
    command: "x4 ops status --channel stable",
    telemetry: "release sync, support node, build status",
  },
];

const compatibility = [
  { model: "iPhone X - XS Max", chipset: "A11-A12", ios: "iOS 12-16", status: "Full", coverage: 98 },
  { model: "iPhone 11 Series", chipset: "A13", ios: "iOS 13-17", status: "Full", coverage: 97 },
  { model: "iPhone 12 Series", chipset: "A14", ios: "iOS 14-18", status: "Full", coverage: 96 },
  { model: "iPhone 13 Series", chipset: "A15", ios: "iOS 15-18", status: "Full", coverage: 95 },
  { model: "iPhone 14 Series", chipset: "A15-A16", ios: "iOS 16-18", status: "Stable", coverage: 91 },
  { model: "iPhone 15 Series", chipset: "A16-A17", ios: "iOS 17-18", status: "Beta", coverage: 78 },
  { model: "iPhone 16 Series", chipset: "A18", ios: "iOS 18+", status: "Lab", coverage: 42 },
];

const TELEGRAM_REGISTER_URL = "https://t.me/+z-9pYTP2k7M0ZThh";

const botCommands = [
  {
    group: "Register tab",
    code: "/registersn <SN>",
    title: "Register a serial number",
    detail: "Send the device serial number to the registration bot so the support desk can bind the device to your access flow.",
  },
  {
    group: "Register tab",
    code: "/check <SN>",
    title: "Check serial status",
    detail: "Verify whether a serial is pending, approved, already linked, or needs technician review before continuing.",
  },
  {
    group: "General commands",
    code: "/download",
    title: "Get latest version",
    detail: "Ask the bot for the current stable build and release channel without hunting through the website.",
  },
  {
    group: "General commands",
    code: "/usage",
    title: "Show this help",
    detail: "Display command help inside Telegram, including the register tab and general command list.",
  },
];

const registerSignals = [
  "Waiting for serial input",
  "Bot channel online",
  "Registration queue active",
  "Telegram handoff ready",
];

const terminalLines = [
  { text: "usb.bus.scan -> technician mode active", tone: "muted" },
  { text: "device.handshake -> udid acquired", tone: "muted" },
  { text: "chipset.profile -> auto mapped", tone: "hot" },
  { text: "ramdisk.bridge -> secure shell open", tone: "hot" },
  { text: "activation.ticket -> validation queue ready", tone: "ok" },
];

const liveMetrics = [
  { key: "devices", label: "Devices Processed", base: 14820, variance: 12 },
  { key: "uptime", label: "Uptime ‰", base: 9998, variance: 1 },
  { key: "queue", label: "Queue Slots Active", base: 42, variance: 8 },
  { key: "builds", label: "Build Checks / hr", base: 284, variance: 20 },
  { key: "success", label: "Success Rate ‰", base: 991, variance: 4 },
  { key: "latency", label: "Avg Latency ms", base: 48, variance: 16 },
];

const tickerMessages = [
  "SYS.CHECK — device queue cleared", "WIN-X64 v5.2.1 — production verified",
  "RAMDISK — A14 session closed", "FMI — serial cache refreshed",
  "MAC-ARM64 — new slot available", "ACTIVATION — ticket pool replenished",
  "QUEUE — 42 nodes online", "USB.BUS — handshake updated",
  "IPSW — recovery table synced", "OPS — 24/7 support node active",
];

// ── Hooks ─────────────────────────────────────────────────────────────────
function useCountUp(end: number, dur = 1400, on = true) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!on) return;
    let t0: number | null = null;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      setV(Math.floor((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, dur, on]);
  return v;
}

function useInView(threshold = 0.18) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ rx: 0, ry: 0, ox: 50, oy: 50 });
  const onMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const cx = (e.clientX - r.left) / r.width;
    const cy = (e.clientY - r.top) / r.height;
    setT({ rx: (cy - 0.5) * -10, ry: (cx - 0.5) * 10, ox: cx * 100, oy: cy * 100 });
  }, []);
  const onLeave = useCallback(() => setT({ rx: 0, ry: 0, ox: 50, oy: 50 }), []);
  const style: CSSProperties = {
    transform: `perspective(900px) rotateX(${t.rx}deg) rotateY(${t.ry}deg)`,
    transition: t.rx === 0 ? "transform .5s ease" : "none",
    ["--ox" as string]: `${t.ox}%`,
    ["--oy" as string]: `${t.oy}%`,
  };
  return { ref, style, onMove, onLeave };
}

// ── Custom Cursor ─────────────────────────────────────────────────────────
type Particle = { id: number; x: number; y: number; angle: number };

function CustomCursor() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [big, setBig] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const nextId = useRef(0);
  useEffect(() => {
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    const onOver = (e: MouseEvent) =>
      setBig(!!(e.target as HTMLElement).closest("button,a,.build-card,.feature-card"));
    const onClick = (e: MouseEvent) => {
      const burst: Particle[] = Array.from({ length: 8 }, (_, i) => ({
        id: nextId.current++, x: e.clientX, y: e.clientY, angle: i * 45,
      }));
      setParticles(p => [...p, ...burst]);
      setTimeout(() => setParticles(p => p.filter(x => !burst.some(b => b.id === x.id))), 700);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("click", onClick);
    };
  }, []);
  return (
    <>
      <div className="cursor-dot" style={{ left: pos.x, top: pos.y, width: big ? 30 : 12, height: big ? 30 : 12 }} />
      {particles.map(p => (
        <div key={p.id} className="cursor-particle" style={{ left: p.x, top: p.y, ["--a" as string]: `${p.angle}deg` } as CSSProperties} />
      ))}
    </>
  );
}

// ── Extra Styles ──────────────────────────────────────────────────────────
function MoreStyles({ lightMode }: { lightMode: boolean }) {
  return (
    <style>{`
      * { cursor: none !important; }
      .cursor-dot {
        position: fixed; border-radius: 50%; pointer-events: none; z-index: 9999;
        background: rgba(232,17,26,.7); border: 2px solid #ff2732;
        transform: translate(-50%,-50%);
        box-shadow: 0 0 14px #ff2732;
        transition: width .15s, height .15s, background .15s;
      }
      .cursor-particle {
        position: fixed; width: 6px; height: 6px; border-radius: 50%;
        background: #ff2732; pointer-events: none; z-index: 9998;
        animation: particleFly .7s ease-out forwards;
      }
      @keyframes particleFly {
        to { opacity: 0; transform: translate(-50%,-50%) rotate(var(--a,0deg)) translateY(-36px); }
      }
      .hamburger {
        display: none; flex-direction: column; gap: 5px;
        background: none; border: none; padding: 8px; cursor: none !important;
      }
      .hamburger span { display: block; width: 24px; height: 2px; background: #f6f6f7; border-radius: 2px; transition: .3s; }
      @media (max-width: 760px) { .nav-links { display: none !important; } .hamburger { display: flex; } }
      .mobile-nav { position: fixed; inset: 0; z-index: 500; pointer-events: none; }
      .mobile-nav.open { pointer-events: all; }
      .mobile-nav-backdrop {
        position: absolute; inset: 0; background: rgba(0,0,0,.7); backdrop-filter: blur(12px);
        opacity: 0; transition: opacity .3s;
      }
      .mobile-nav.open .mobile-nav-backdrop { opacity: 1; }
      .mobile-nav-panel {
        position: absolute; right: 0; top: 0; bottom: 0; width: min(320px,90%);
        background: #09090c; border-left: 1px solid rgba(232,17,26,.3);
        padding: 28px 20px; display: flex; flex-direction: column;
        transform: translateX(100%); transition: transform .35s cubic-bezier(.4,0,.2,1);
      }
      .mobile-nav.open .mobile-nav-panel { transform: translateX(0); }
      .mobile-nav-close {
        align-self: flex-end; background: none; border: none;
        color: #9a9aa8; font-size: 22px; cursor: none !important; padding: 4px;
      }
      .mobile-nav-links { display: flex; flex-direction: column; gap: 6px; margin-top: 20px; }
      .mobile-nav-links a {
        display: block; padding: 14px 16px; border-radius: 12px;
        border: 1px solid rgba(255,255,255,.08); color: #f6f6f7;
        font-family: "JetBrains Mono", monospace; font-size: 12px;
        font-weight: 900; letter-spacing: .14em;
        transition: background .2s, border-color .2s; animation: fadeUp .3s ease both;
      }
      .mobile-nav-links a:hover { background: rgba(232,17,26,.1); border-color: rgba(232,17,26,.4); }
      .live-board { background: rgba(5,5,6,1); border-top: 1px solid rgba(255,255,255,.07); border-bottom: 1px solid rgba(255,255,255,.07); }
      .ticker-wrap { overflow: hidden; border-bottom: 1px solid rgba(255,255,255,.06); padding: 14px 0; }
      .ticker-inner {
        display: flex; gap: 0; white-space: nowrap;
        animation: ticker 28s linear infinite;
      }
      @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      .ticker-item {
        display: inline-flex; align-items: center; gap: 10px;
        padding: 0 42px; color: #5d5d69;
        font-family: "JetBrains Mono", monospace; font-size: 11px;
        font-weight: 900; letter-spacing: .14em; text-transform: uppercase;
      }
      .ticker-dot { width: 6px; height: 6px; border-radius: 50%; background: #e8111a; box-shadow: 0 0 8px #e8111a; flex: 0 0 auto; }
      .metrics-grid {
        display: grid; grid-template-columns: repeat(6,minmax(0,1fr)); gap: 14px;
      }
      @media (max-width: 1080px) { .metrics-grid { grid-template-columns: repeat(3,minmax(0,1fr)); } }
      @media (max-width: 600px) { .metrics-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } }
      .metric-card {
        border: 1px solid rgba(255,255,255,.08); border-radius: 14px;
        background: rgba(255,255,255,.03); padding: 18px 16px;
        opacity: 0; transform: translateY(18px);
        transition: opacity .5s ease, transform .5s ease;
      }
      .live-board.in-view .metric-card { opacity: 1; transform: translateY(0); }
      .metric-value {
        color: #fff; font-family: "JetBrains Mono", monospace;
        font-size: 26px; font-weight: 900; line-height: 1;
      }
      .metric-label {
        margin-top: 8px; color: #5d5d69;
        font-family: "JetBrains Mono", monospace; font-size: 10px;
        font-weight: 900; letter-spacing: .12em; text-transform: uppercase;
      }
      .metric-bar { height: 3px; border-radius: 99px; background: rgba(255,255,255,.08); margin-top: 12px; overflow: hidden; }
      .metric-bar-fill {
        height: 100%; border-radius: inherit;
        background: linear-gradient(90deg, #73070c, #ff2732);
        transition: width .8s ease;
      }
      .build-card { transform-style: preserve-3d; }
      .build-card::after {
        content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
        background: radial-gradient(circle at var(--ox,50%) var(--oy,50%), rgba(232,17,26,.22), transparent 60%);
        opacity: 0; transition: opacity .3s;
      }
      .build-card:hover::after { opacity: 1; }
      .reveal { opacity: 0; transform: translateY(22px); transition: opacity .5s ease, transform .5s ease; }
      .reveal.visible { opacity: 1; transform: translateY(0); }
      .theme-toggle {
        background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12);
        border-radius: 20px; padding: 7px 14px; color: #f6f6f7;
        font-family: "JetBrains Mono", monospace; font-size: 11px;
        font-weight: 900; white-space: nowrap; cursor: none !important;
        transition: background .2s, border-color .2s;
      }
      .theme-toggle:hover { background: rgba(232,17,26,.12); border-color: rgba(232,17,26,.4); }
      /* ── NAV POLISHED ────────────────────────────────────── */
      .nav-links a {
        position: relative; padding-bottom: 2px;
      }
      .nav-links a::after {
        content: ""; position: absolute; bottom: -2px; left: 0; width: 0; height: 2px;
        background: #ff2732; border-radius: 2px; transition: width .22s ease;
      }
      .nav-links a:hover::after { width: 100%; }
      .nav-light { background: rgba(255,255,255,.92) !important; border-bottom-color: rgba(0,0,0,.08) !important; }
      .nav-light .nav-links a { color: #3a3a4a !important; }
      .nav-light .nav-links a:hover { color: #0a0a12 !important; }
      .nav-light .hamburger span { background: #0a0a12 !important; }
      .nav-light .theme-toggle { background: rgba(0,0,0,.06) !important; border-color: rgba(0,0,0,.14) !important; color: #3a3a4a !important; }
      .nav-light .theme-toggle:hover { background: rgba(232,17,26,.1) !important; border-color: rgba(232,17,26,.35) !important; color: #cc0f16 !important; }
      .nav-light .btn-soft { background: rgba(232,17,26,.1) !important; border-color: rgba(232,17,26,.3) !important; color: #cc0f16 !important; }
      /* ── LIGHT MODE ─────────────────────────────────────────── */
      ${lightMode ? `
        html, body { background: #f5f5f8 !important; }
        .site-shell {
          background:
            radial-gradient(circle at 12% 9%, rgba(232,17,26,.07), transparent 28rem),
            radial-gradient(circle at 78% 18%, rgba(232,17,26,.04), transparent 22rem),
            linear-gradient(180deg, #f5f5f8 0%, #ffffff 48%, #f5f5f8 100%) !important;
        }
        .site-shell:before { display: none !important; }
        .noise-grid { display: none !important; }
        .global-scan { opacity: .4 !important; }
        /* Typography */
        .section-title, .detail-title, .hero-title, h1, h2, h3 { color: #0d0d14 !important; }
        .section-copy, .hero-sub, .build-card p, .feature-card p, .detail-copy { color: #52525e !important; }
        .eyebrow { color: #e8111a !important; }
        /* Nav */
        .nav { background: rgba(255,255,255,.92) !important; border-bottom-color: rgba(0,0,0,.08) !important; }
        .nav-links a { color: #3a3a4a !important; }
        .nav-links a:hover { color: #0a0a12 !important; }
        .hamburger span { background: #0a0a12 !important; }
        /* Cards */
        .build-card, .feature-card, .compat-card {
          background: #ffffff !important;
          border-color: rgba(0,0,0,.1) !important;
          box-shadow: 0 4px 24px rgba(0,0,0,.08), 0 1px 4px rgba(0,0,0,.06) !important;
        }
        .build-card:hover, .feature-card:hover, .compat-card:hover {
          box-shadow: 0 8px 40px rgba(232,17,26,.12), 0 2px 8px rgba(0,0,0,.08) !important;
        }
        .stat-card {
          background: #ffffff !important; border-color: rgba(0,0,0,.1) !important;
          box-shadow: 0 2px 12px rgba(0,0,0,.07) !important;
        }
        .stat-card strong { color: #0d0d14 !important; }
        .stat-card span { color: #8888a0 !important; }
        /* Build card internals */
        .build-code { background: rgba(232,17,26,.08) !important; border-color: rgba(232,17,26,.2) !important; }
        .build-card h3 { color: #0d0d14 !important; }
        .build-meta span { color: #8888a0 !important; }
        .tag { background: rgba(0,0,0,.05) !important; border-color: rgba(0,0,0,.12) !important; color: #52525e !important; }
        /* Feature panel */
        .feature-detail {
          background: linear-gradient(180deg, rgba(232,17,26,.05), rgba(255,255,255,.8)), #ffffff !important;
          border-color: rgba(0,0,0,.1) !important;
        }
        .feature-card.active { background: rgba(232,17,26,.06) !important; border-color: rgba(232,17,26,.3) !important; }
        .feature-code { background: rgba(232,17,26,.1) !important; border-color: rgba(232,17,26,.25) !important; }
        .detail-title { color: #0d0d14 !important; }
        .command-box { background: rgba(0,0,0,.05) !important; border-color: rgba(0,0,0,.1) !important; }
        .command-box code { color: #cc0f16 !important; }
        /* Compat table */
        .compat-wrap { background: #ffffff !important; border-color: rgba(0,0,0,.1) !important; }
        .compat-row.header { background: rgba(0,0,0,.04) !important; color: #8888a0 !important; }
        .compat-row { border-bottom-color: rgba(0,0,0,.07) !important; }
        .compat-row:not(.header):hover { background: rgba(232,17,26,.04) !important; }
        .compat-row strong { color: #0d0d14 !important; }
        .compat-row span { color: #52525e !important; }
        .coverage { background: rgba(0,0,0,.08) !important; }
        /* Live board */
        .live-board { background: #eeeef5 !important; border-color: rgba(0,0,0,.08) !important; }
        .ticker-wrap { border-bottom-color: rgba(0,0,0,.08) !important; }
        .ticker-item { color: #8888a0 !important; }
        .metric-card { background: #ffffff !important; border-color: rgba(0,0,0,.1) !important; box-shadow: 0 2px 12px rgba(0,0,0,.07) !important; }
        .metric-value { color: #0d0d14 !important; }
        .metric-label { color: #8888a0 !important; }
        .metric-bar { background: rgba(0,0,0,.08) !important; }
        /* Android card */
        .android-card { background: linear-gradient(135deg, rgba(255,255,255,.9), rgba(245,245,250,.8)) !important; border-color: rgba(232,17,26,.2) !important; }
        /* Register section */
        .register-shell { background: linear-gradient(135deg, rgba(255,255,255,.95), rgba(245,245,252,.9)) !important; border-color: rgba(232,17,26,.2) !important; }
        .register-shell:before { opacity: .5; }
        .register-copy h2, .register-copy h2 span { color: #0d0d14 !important; }
        .register-terminal { background: rgba(240,240,248,.95) !important; border-color: rgba(0,0,0,.1) !important; }
        .telegram-top { border-bottom-color: rgba(0,0,0,.08) !important; color: #8888a0 !important; }
        .bubble.bot { background: rgba(0,0,0,.05) !important; border-color: rgba(0,0,0,.1) !important; color: #3a3a4a !important; }
        .bubble.user { background: rgba(232,17,26,.08) !important; border-color: rgba(232,17,26,.25) !important; color: #8b0008 !important; }
        .available-panel, .command-explainer { background: #ffffff !important; border-color: rgba(0,0,0,.1) !important; }
        .command-pill { background: rgba(0,0,0,.04) !important; border-color: rgba(0,0,0,.1) !important; color: #3a3a4a !important; }
        .command-pill:hover, .command-pill.active { background: rgba(232,17,26,.07) !important; border-color: rgba(232,17,26,.3) !important; }
        .command-sim { background: rgba(0,0,0,.05) !important; border-color: rgba(232,17,26,.15) !important; }
        .command-sim code { color: #15803d !important; }
        .signal-stack span { background: rgba(0,0,0,.05) !important; border-color: rgba(0,0,0,.1) !important; color: #8888a0 !important; }
        /* Terminal panel */
        .terminal-panel { background: rgba(240,240,248,.88) !important; border-color: rgba(0,0,0,.1) !important; }
        .panel-top { border-bottom-color: rgba(0,0,0,.08) !important; color: #8888a0 !important; }
        .terminal-line { color: #52525e !important; }
        .terminal-line.hot { color: #8b0008 !important; }
        .terminal-line.ok { color: #15803d !important; }
        .terminal-line b { color: #cc0f16 !important; }
        .progress-track { background: rgba(0,0,0,.1) !important; }
        /* Status chips */
        .status-chip { background: rgba(0,0,0,.06) !important; border-color: rgba(0,0,0,.1) !important; }
        .status-chip strong { color: #0d0d14 !important; }
        .status-chip span { color: #8888a0 !important; }
        /* Modal */
        .modal { background: #ffffff !important; border-color: rgba(232,17,26,.25) !important; }
        .modal-head { border-bottom-color: rgba(0,0,0,.08) !important; }
        .modal-head h2 { color: #0d0d14 !important; }
        .release-card { background: rgba(0,0,0,.04) !important; border-color: rgba(0,0,0,.1) !important; }
        .release-card h3, .available-panel h3, .command-explainer h3 { color: #0d0d14 !important; }
        .release-card ul li, .release-card ol li { color: #52525e !important; }
        .ready-box { background: rgba(232,17,26,.05) !important; border-color: rgba(232,17,26,.2) !important; color: #52525e !important; }
        .close { background: rgba(0,0,0,.06) !important; border-color: rgba(0,0,0,.1) !important; color: #3a3a4a !important; }
        /* Final CTA */
        .final-cta { background: radial-gradient(circle at 50% 50%, rgba(232,17,26,.06), transparent 28rem) !important; border-top-color: rgba(0,0,0,.08) !important; }
        /* Footer */
        .footer { background: #eeeef4 !important; border-top-color: rgba(0,0,0,.08) !important; color: #8888a0 !important; }
        /* Scrollbar */
        ::-webkit-scrollbar-track { background: #f0f0f5 !important; }
        /* Mobile nav */
        .mobile-nav-panel { background: #ffffff !important; border-left-color: rgba(0,0,0,.1) !important; }
        .mobile-nav-links a { color: #0a0a12 !important; border-color: rgba(0,0,0,.1) !important; background: rgba(0,0,0,.03) !important; }
        .mobile-nav-links a:hover { background: rgba(232,17,26,.06) !important; border-color: rgba(232,17,26,.25) !important; }
        .mobile-nav-close { color: #52525e !important; }
        /* Input */
        .input { background: rgba(0,0,0,.05) !important; border-color: rgba(0,0,0,.15) !important; color: #0a0a12 !important; }
        .input::placeholder { color: #8888a0 !important; }
        /* Section dividers */
        .section-divider { background: linear-gradient(90deg, transparent, rgba(0,0,0,.12), rgba(232,17,26,.25), rgba(0,0,0,.12), transparent) !important; }
        /* Buttons - hero ghost & soft need dark text in light mode */
        .btn-soft { background: rgba(232,17,26,.1) !important; border-color: rgba(232,17,26,.3) !important; color: #8b0008 !important; }
        .btn-ghost { background: rgba(0,0,0,.07) !important; border-color: rgba(0,0,0,.18) !important; color: #3a3a4a !important; }
        .btn-ghost:hover { background: rgba(232,17,26,.08) !important; border-color: rgba(232,17,26,.3) !important; color: #8b0008 !important; }
      ` : ""}
    `}</style>
  );
}

function StyleSheet() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700;800&display=swap');

      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; background: ${C.bg}; }
      body {
        margin: 0;
        background: ${C.bg};
        color: ${C.text};
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        overflow-x: hidden;
      }
      button, input { font: inherit; }
      a { color: inherit; text-decoration: none; }
      ::selection { background: #e8111a55; color: white; }
      ::-webkit-scrollbar { width: 8px; }
      ::-webkit-scrollbar-track { background: #050506; }
      ::-webkit-scrollbar-thumb { background: #e8111a66; border-radius: 999px; }

      @keyframes scanDown { 0% { transform: translateY(-10vh); } 100% { transform: translateY(110vh); } }
      @keyframes drift { 0%, 100% { transform: translate3d(0, 0, 0); } 50% { transform: translate3d(0, -18px, 0); } }
      @keyframes pulseGlow { 0%, 100% { opacity: .58; filter: blur(0); } 50% { opacity: 1; filter: blur(1px); } }
      @keyframes beamMove { 0% { transform: translateX(-45%) rotate(-11deg); } 100% { transform: translateX(45%) rotate(-11deg); } }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
      @keyframes modalIn { from { opacity: 0; transform: translateY(18px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes ringTurn { to { transform: rotate(360deg); } }
      @keyframes glitchA {
        0%, 100% { clip-path: inset(0 0 96% 0); transform: translate(0); }
        18% { clip-path: inset(30% 0 48% 0); transform: translate(-2px, 1px); }
        36% { clip-path: inset(68% 0 14% 0); transform: translate(2px, -1px); }
        58% { clip-path: inset(18% 0 66% 0); transform: translate(-1px, 0); }
        78% { clip-path: inset(52% 0 28% 0); transform: translate(1px, 1px); }
      }

      .site-shell {
        min-height: 100vh;
        background:
          radial-gradient(circle at 12% 9%, rgba(232,17,26,.24), transparent 31rem),
          radial-gradient(circle at 78% 18%, rgba(232,17,26,.15), transparent 26rem),
          linear-gradient(180deg, #050506 0%, #09090c 48%, #050506 100%);
        position: relative;
      }
      .site-shell:before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 90;
        background:
          repeating-linear-gradient(0deg, transparent 0 4px, rgba(255,255,255,.018) 4px 5px),
          radial-gradient(circle at 50% 0, rgba(232,17,26,.1), transparent 40rem);
        mix-blend-mode: screen;
      }
      .global-scan {
        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        height: 2px;
        z-index: 100;
        pointer-events: none;
        background: linear-gradient(90deg, transparent, rgba(232,17,26,.35), white, rgba(232,17,26,.35), transparent);
        box-shadow: 0 0 28px rgba(232,17,26,.55);
        animation: scanDown 7s linear infinite;
      }
      .noise-grid {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background-image:
          linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
        background-size: 58px 58px;
        mask-image: radial-gradient(ellipse at 50% 10%, black 18%, transparent 72%);
      }
      .nav {
        position: sticky;
        top: 0;
        z-index: 80;
        min-height: 74px;
        padding: 12px 34px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        border-bottom: 1px solid rgba(255,255,255,.08);
        background: rgba(5,5,6,.84);
        backdrop-filter: blur(22px);
      }
      .nav-brand {
        display: flex;
        align-items: center;
        gap: 14px;
        min-width: 0;
      }
      .nav-brand img { width: 188px; max-width: 42vw; height: auto; display: block; }
      .nav-links { display: flex; align-items: center; gap: 26px; }
      .nav-links a {
        color: ${C.muted};
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .14em;
        text-transform: uppercase;
        transition: color .2s ease;
      }
      .nav-links a:hover { color: white; }
      .btn {
        border: 1px solid transparent;
        border-radius: 10px;
        padding: 13px 18px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        min-height: 44px;
        color: white;
        cursor: pointer;
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: .12em;
        text-transform: uppercase;
        transition: transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease;
        white-space: nowrap;
      }
      .btn:focus-visible { outline: 2px solid ${C.red2}; outline-offset: 3px; }
      .btn:hover { transform: translateY(-2px); }
      .btn:disabled {
        cursor: not-allowed;
        opacity: .72;
        transform: none;
      }
      .btn-primary {
        background: linear-gradient(135deg, ${C.red2}, ${C.redDark});
        border-color: rgba(255,255,255,.11);
        box-shadow: 0 0 28px rgba(232,17,26,.36), inset 0 1px 0 rgba(255,255,255,.28);
      }
      .btn-ghost {
        background: rgba(255,255,255,.035);
        border-color: rgba(255,255,255,.11);
        color: ${C.text};
      }
      .btn-ghost:hover { border-color: ${C.borderHot}; background: rgba(232,17,26,.08); }
      .btn-soft {
        background: rgba(232,17,26,.1);
        border-color: rgba(232,17,26,.28);
        color: #ffd9dc;
      }
      .section {
        width: min(1240px, calc(100% - 48px));
        margin: 0 auto;
        padding: 92px 0;
        position: relative;
      }
      .section-divider {
        width: min(1240px, calc(100% - 48px));
        height: 1px;
        margin: 0 auto;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.16), rgba(232,17,26,.45), rgba(255,255,255,.16), transparent);
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: ${C.red2};
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: .18em;
        text-transform: uppercase;
      }
      .eyebrow:before {
        content: "";
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: ${C.red2};
        box-shadow: 0 0 18px ${C.red2};
      }
      .section-title {
        margin: 14px 0 0;
        color: white;
        font-size: clamp(42px, 7vw, 92px);
        line-height: .88;
        letter-spacing: 0;
        text-transform: uppercase;
        font-weight: 950;
      }
      .section-copy {
        max-width: 640px;
        color: ${C.muted};
        font-size: 15px;
        line-height: 1.75;
        margin: 18px 0 0;
      }
      .hero {
        min-height: calc(100vh - 74px);
        width: min(1320px, calc(100% - 48px));
        margin: 0 auto;
        padding: 58px 0 86px;
        position: relative;
        display: grid;
        grid-template-columns: minmax(0, 1.02fr) minmax(360px, .98fr);
        align-items: center;
        gap: 56px;
      }
      .hero-copy { position: relative; z-index: 2; animation: fadeUp .7s ease both; }
      .hero-logo {
        width: min(680px, 100%);
        height: auto;
        margin-bottom: 20px;
        filter: drop-shadow(0 24px 48px rgba(0,0,0,.78)) drop-shadow(0 0 34px rgba(232,17,26,.18));
      }
      .hero-title {
        margin: 0;
        font-size: clamp(52px, 8vw, 112px);
        line-height: .86;
        letter-spacing: 0;
        text-transform: uppercase;
        font-weight: 950;
      }
      .glitch {
        position: relative;
        display: inline-block;
        color: ${C.red2};
        text-shadow: 0 0 52px rgba(232,17,26,.58);
      }
      .glitch:before {
        content: attr(data-text);
        position: absolute;
        inset: 0;
        color: ${C.cyan};
        opacity: .36;
        animation: glitchA 3.1s steps(2) infinite;
      }
      .hero-sub {
        max-width: 620px;
        margin: 24px 0 0;
        color: ${C.muted};
        font-size: 16px;
        line-height: 1.75;
      }
      .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 34px; }
      .status-strip {
        margin-top: 30px;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
      }
      .status-chip {
        border: 1px solid rgba(255,255,255,.1);
        background: rgba(255,255,255,.035);
        border-radius: 10px;
        padding: 12px;
        min-width: 0;
      }
      .status-chip strong {
        display: block;
        color: white;
        font-family: "JetBrains Mono", monospace;
        font-size: 13px;
      }
      .status-chip span {
        display: block;
        margin-top: 4px;
        color: ${C.dim};
        font-family: "JetBrains Mono", monospace;
        font-size: 10px;
        letter-spacing: .1em;
        text-transform: uppercase;
      }
      .device-stage {
        position: relative;
        min-height: 640px;
        display: grid;
        place-items: center;
        animation: fadeUp .8s ease .12s both;
      }
      .device-beam {
        position: absolute;
        width: 118%;
        height: 4px;
        top: 47%;
        left: -8%;
        background: linear-gradient(90deg, transparent, rgba(232,17,26,.4), white, rgba(232,17,26,.4), transparent);
        box-shadow: 0 0 40px rgba(232,17,26,.65);
        animation: beamMove 5.4s ease-in-out infinite alternate;
      }
      .orbital-ring {
        position: absolute;
        width: 500px;
        max-width: 90%;
        aspect-ratio: 1 / .42;
        border: 10px solid rgba(255,255,255,.88);
        border-left-color: ${C.red2};
        border-bottom-color: ${C.red2};
        border-radius: 50%;
        transform: rotate(-18deg);
        filter: drop-shadow(0 0 22px rgba(232,17,26,.7));
      }
      .phone {
        width: 252px;
        height: 512px;
        border-radius: 42px;
        border: 8px solid #202029;
        background:
          linear-gradient(145deg, rgba(255,255,255,.26), transparent 20%),
          radial-gradient(circle at 42% 18%, #ff3c45 0, #a30a12 30%, #1b0608 68%, #030304 100%);
        box-shadow: 0 44px 90px rgba(0,0,0,.72), 0 0 80px rgba(232,17,26,.4);
        position: relative;
        transform: rotate(-8deg);
        animation: drift 5.8s ease-in-out infinite;
        overflow: hidden;
        z-index: 3;
      }
      .phone:before {
        content: "";
        position: absolute;
        top: 14px;
        left: 50%;
        width: 96px;
        height: 24px;
        transform: translateX(-50%);
        border-radius: 999px;
        background: #08080b;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.15);
      }
      .phone:after {
        content: "X4";
        position: absolute;
        left: 22px;
        bottom: 28px;
        color: rgba(255,255,255,.82);
        font-family: "JetBrains Mono", monospace;
        font-size: 42px;
        font-weight: 900;
      }
      .hero-mascot {
        position: absolute;
        width: min(350px, 70%);
        left: 4%;
        bottom: 52px;
        z-index: 4;
        filter: drop-shadow(0 32px 48px rgba(0,0,0,.72));
        animation: drift 6.5s ease-in-out infinite reverse;
      }
      .terminal-panel {
        position: absolute;
        right: 0;
        bottom: 48px;
        width: min(370px, 82%);
        z-index: 5;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 16px;
        background: rgba(8,8,11,.86);
        backdrop-filter: blur(18px);
        box-shadow: 0 24px 80px rgba(0,0,0,.56);
        overflow: hidden;
      }
      .panel-top {
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 14px;
        border-bottom: 1px solid rgba(255,255,255,.08);
        color: ${C.dim};
        font-family: "JetBrains Mono", monospace;
        font-size: 10px;
        letter-spacing: .14em;
        text-transform: uppercase;
      }
      .traffic { display: flex; gap: 6px; }
      .traffic span {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: ${C.red2};
        box-shadow: 0 0 10px ${C.red2};
      }
      .traffic span:nth-child(2) { background: ${C.amber}; box-shadow: 0 0 10px ${C.amber}; }
      .traffic span:nth-child(3) { background: ${C.green}; box-shadow: 0 0 10px ${C.green}; }
      .terminal-body { padding: 16px; font-family: "JetBrains Mono", monospace; }
      .terminal-line {
        display: flex;
        gap: 10px;
        color: ${C.muted};
        font-size: 12px;
        line-height: 1.9;
      }
      .terminal-line b { color: ${C.red2}; font-weight: 800; }
      .terminal-line.hot { color: #ffc2c6; }
      .terminal-line.ok { color: ${C.green}; }
      .cursor {
        display: inline-block;
        width: 8px;
        height: 14px;
        background: ${C.red2};
        vertical-align: -2px;
        animation: blink 1s steps(1) infinite;
      }
      .progress-track {
        height: 7px;
        border-radius: 999px;
        overflow: hidden;
        background: rgba(255,255,255,.08);
        margin-top: 16px;
      }
      .progress-fill {
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, ${C.redDark}, ${C.red2}, white);
        box-shadow: 0 0 22px rgba(232,17,26,.75);
        transition: width .2s linear;
      }
      .download-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
        margin-top: 42px;
      }
      .build-card,
      .feature-card,
      .stat-card,
      .compat-card {
        border: 1px solid rgba(255,255,255,.1);
        background: linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.025));
        border-radius: 16px;
        box-shadow: 0 18px 58px rgba(0,0,0,.24);
        position: relative;
        overflow: hidden;
        transition: transform .22s ease, border-color .22s ease, background .22s ease, box-shadow .22s ease;
      }
      .build-card:before,
      .feature-card:before,
      .compat-card:before {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 20% 0, rgba(232,17,26,.18), transparent 18rem);
        opacity: 0;
        transition: opacity .22s ease;
        pointer-events: none;
      }
      .build-card:hover,
      .feature-card:hover,
      .compat-card:hover {
        transform: translateY(-5px);
        border-color: ${C.borderHot};
        box-shadow: 0 24px 80px rgba(232,17,26,.13);
      }
      .build-card:hover:before,
      .feature-card:hover:before,
      .compat-card:hover:before { opacity: 1; }
      .build-card { padding: 22px; min-height: 330px; display: flex; flex-direction: column; }
      .build-meta {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        color: ${C.dim};
        font-family: "JetBrains Mono", monospace;
        font-size: 10px;
        letter-spacing: .12em;
        text-transform: uppercase;
        position: relative;
      }
      .build-code {
        width: 62px;
        height: 62px;
        margin-top: 30px;
        border: 1px solid rgba(232,17,26,.35);
        border-radius: 16px;
        display: grid;
        place-items: center;
        background: rgba(232,17,26,.09);
        color: white;
        box-shadow: inset 0 0 24px rgba(232,17,26,.1);
        position: relative;
      }
      .build-code svg {
        width: 34px;
        height: 34px;
        display: block;
        filter: drop-shadow(0 0 14px rgba(232,17,26,.42));
      }
      .build-code.windows svg { color: #f8fafc; }
      .build-code.macos svg { color: #f8fafc; }
      .build-card h3 {
        margin: 18px 0 0;
        color: white;
        font-size: 24px;
        letter-spacing: 0;
      }
      .build-card p {
        color: ${C.muted};
        line-height: 1.65;
        margin: 12px 0 22px;
        font-size: 13px;
      }
      .build-tags {
        margin-top: auto;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .tag {
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 999px;
        padding: 7px 10px;
        color: ${C.muted};
        font-family: "JetBrains Mono", monospace;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .build-card .btn { width: 100%; margin-top: 18px; }
      .feature-layout {
        display: grid;
        grid-template-columns: .95fr 1.05fr;
        gap: 20px;
        margin-top: 42px;
        align-items: stretch;
      }
      .feature-list { display: grid; gap: 12px; }
      .feature-card {
        width: 100%;
        text-align: left;
        color: inherit;
        cursor: pointer;
        padding: 20px;
      }
      .feature-card.active { border-color: ${C.borderHot}; background: rgba(232,17,26,.08); }
      .feature-head { display: flex; align-items: center; gap: 14px; position: relative; }
      .feature-code {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        border: 1px solid rgba(232,17,26,.35);
        background: rgba(232,17,26,.1);
        color: white;
        font-family: "JetBrains Mono", monospace;
        font-size: 12px;
        font-weight: 900;
        flex: 0 0 auto;
      }
      .feature-card h3 { margin: 0; color: white; font-size: 18px; }
      .feature-card p { margin: 7px 0 0; color: ${C.dim}; font-size: 12px; line-height: 1.55; }
      .feature-signal {
        margin-left: auto;
        color: ${C.red2};
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        font-weight: 900;
      }
      .feature-detail {
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 18px;
        background:
          linear-gradient(180deg, rgba(232,17,26,.09), rgba(255,255,255,.025)),
          ${C.panel};
        min-height: 100%;
        padding: 26px;
        position: relative;
        overflow: hidden;
      }
      .feature-detail:after {
        content: "";
        position: absolute;
        width: 280px;
        height: 280px;
        right: -90px;
        top: -90px;
        border-radius: 50%;
        border: 1px solid rgba(232,17,26,.28);
        animation: ringTurn 18s linear infinite;
      }
      .detail-title {
        position: relative;
        margin: 18px 0 0;
        font-size: clamp(30px, 4vw, 56px);
        line-height: .94;
        font-weight: 950;
        text-transform: uppercase;
      }
      .detail-copy {
        position: relative;
        color: ${C.muted};
        line-height: 1.75;
        max-width: 560px;
        margin: 18px 0 0;
      }
      .command-box {
        position: relative;
        margin-top: 28px;
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 14px;
        background: rgba(0,0,0,.32);
        padding: 18px;
        font-family: "JetBrains Mono", monospace;
      }
      .command-box small {
        display: block;
        color: ${C.dim};
        text-transform: uppercase;
        letter-spacing: .16em;
        font-weight: 900;
        margin-bottom: 10px;
      }
      .command-box code {
        display: block;
        color: #ffd8dc;
        white-space: normal;
        word-break: break-word;
      }
      .compat-wrap {
        margin-top: 42px;
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 18px;
        overflow: hidden;
        background: rgba(255,255,255,.03);
      }
      .compat-row {
        display: grid;
        grid-template-columns: 1.25fr .8fr .8fr .75fr 1fr;
        gap: 18px;
        align-items: center;
        padding: 18px 22px;
        border-bottom: 1px solid rgba(255,255,255,.08);
      }
      .compat-row:last-child { border-bottom: 0; }
      .compat-row.header {
        background: rgba(255,255,255,.045);
        color: ${C.dim};
        font-family: "JetBrains Mono", monospace;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: .15em;
        text-transform: uppercase;
      }
      .compat-row:not(.header) { transition: background .2s ease; }
      .compat-row:not(.header):hover { background: rgba(232,17,26,.07); }
      .compat-row strong { color: white; font-size: 14px; }
      .compat-row span { color: ${C.muted}; font-size: 13px; }
      .coverage {
        height: 8px;
        border-radius: 999px;
        background: rgba(255,255,255,.08);
        overflow: hidden;
      }
      .coverage div {
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, ${C.redDark}, ${C.red2}, ${C.green});
      }
      .lab-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        margin-top: 22px;
      }
      .stat-card { padding: 20px; }
      .stat-card strong {
        display: block;
        color: white;
        font-size: 34px;
        line-height: 1;
        font-weight: 950;
      }
      .stat-card span {
        display: block;
        margin-top: 8px;
        color: ${C.dim};
        font-family: "JetBrains Mono", monospace;
        font-size: 10px;
        letter-spacing: .14em;
        text-transform: uppercase;
      }
      .android-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(280px, 420px);
        gap: 34px;
        align-items: center;
        border: 1px solid rgba(232,17,26,.22);
        border-radius: 22px;
        background:
          radial-gradient(circle at 85% 15%, rgba(232,17,26,.22), transparent 24rem),
          linear-gradient(135deg, rgba(255,255,255,.055), rgba(255,255,255,.018));
        overflow: hidden;
        padding: 46px;
        position: relative;
      }
      .android-card img {
        width: 100%;
        max-height: 420px;
        object-fit: contain;
        filter: drop-shadow(0 36px 60px rgba(0,0,0,.62));
        animation: drift 5.8s ease-in-out infinite;
      }
      .register-section {
        width: min(1240px, calc(100% - 48px));
        margin: 0 auto;
        padding: 92px 0;
      }
      .register-shell {
        border: 1px solid rgba(232,17,26,.26);
        border-radius: 26px;
        background:
          radial-gradient(circle at 8% 0, rgba(232,17,26,.2), transparent 28rem),
          radial-gradient(circle at 92% 20%, rgba(142,247,255,.08), transparent 25rem),
          linear-gradient(135deg, rgba(255,255,255,.06), rgba(255,255,255,.018));
        overflow: hidden;
        position: relative;
        box-shadow: 0 28px 100px rgba(0,0,0,.34);
      }
      .register-shell:before {
        content: "";
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.026) 1px, transparent 1px);
        background-size: 42px 42px;
        mask-image: radial-gradient(ellipse at 50% 50%, black 0%, transparent 76%);
        pointer-events: none;
      }
      .register-hero {
        position: relative;
        display: grid;
        grid-template-columns: minmax(0, .95fr) minmax(340px, 1.05fr);
        gap: 34px;
        align-items: center;
        padding: 46px;
      }
      .register-copy h2 {
        margin: 18px 0 0;
        color: white;
        font-size: clamp(48px, 7vw, 98px);
        line-height: .86;
        font-weight: 950;
        text-transform: uppercase;
      }
      .register-copy h2 span { color: ${C.red2}; text-shadow: 0 0 42px rgba(232,17,26,.5); }
      .register-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 30px;
      }
      .register-terminal {
        border: 1px solid rgba(255,255,255,.11);
        border-radius: 20px;
        background: rgba(5,5,8,.82);
        box-shadow: 0 24px 88px rgba(0,0,0,.42);
        overflow: hidden;
        backdrop-filter: blur(18px);
      }
      .telegram-top {
        height: 52px;
        border-bottom: 1px solid rgba(255,255,255,.09);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 18px;
        color: ${C.dim};
        font-family: "JetBrains Mono", monospace;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: .14em;
        text-transform: uppercase;
      }
      .telegram-dot {
        width: 11px;
        height: 11px;
        border-radius: 50%;
        background: ${C.green};
        box-shadow: 0 0 18px ${C.green};
        animation: pulseGlow 1.8s ease-in-out infinite;
      }
      .telegram-chat {
        padding: 18px;
        display: grid;
        gap: 12px;
      }
      .bubble {
        max-width: 88%;
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 16px;
        padding: 13px 14px;
        color: ${C.muted};
        font-size: 13px;
        line-height: 1.55;
        animation: fadeUp .38s ease both;
      }
      .bubble.bot {
        background: rgba(255,255,255,.04);
        border-top-left-radius: 4px;
      }
      .bubble.user {
        justify-self: end;
        background: rgba(232,17,26,.12);
        border-color: rgba(232,17,26,.32);
        color: #ffe8ea;
        border-top-right-radius: 4px;
        font-family: "JetBrains Mono", monospace;
      }
      .bubble strong { color: white; }
      .register-input-row {
        display: flex;
        gap: 10px;
        padding: 0 18px 18px;
        flex-wrap: wrap;
      }
      .register-input-row .input { flex: 1 1 220px; }
      .command-board {
        position: relative;
        padding: 0 46px 46px;
        display: grid;
        grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
        gap: 18px;
      }
      .available-panel,
      .command-explainer {
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 18px;
        background: rgba(255,255,255,.035);
        padding: 22px;
      }
      .available-panel h3,
      .command-explainer h3 {
        margin: 0 0 16px;
        color: white;
        font-family: "JetBrains Mono", monospace;
        font-size: 14px;
        letter-spacing: .12em;
        text-transform: uppercase;
      }
      .command-list {
        display: grid;
        gap: 10px;
      }
      .command-pill {
        width: 100%;
        text-align: left;
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 14px;
        background: rgba(0,0,0,.2);
        padding: 14px;
        color: inherit;
        cursor: pointer;
        transition: transform .18s ease, border-color .18s ease, background .18s ease;
      }
      .command-pill:hover,
      .command-pill.active {
        transform: translateY(-2px);
        border-color: rgba(232,17,26,.45);
        background: rgba(232,17,26,.09);
      }
      .command-pill code,
      .command-code {
        color: #ffe3e6;
        font-family: "JetBrains Mono", monospace;
        font-size: 13px;
        font-weight: 900;
      }
      .command-pill span {
        display: block;
        margin-top: 6px;
        color: ${C.dim};
        font-size: 11px;
        font-family: "JetBrains Mono", monospace;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .command-explainer p {
        color: ${C.muted};
        line-height: 1.75;
        margin: 0;
      }
      .command-sim {
        margin-top: 18px;
        border: 1px solid rgba(232,17,26,.22);
        border-radius: 14px;
        background: rgba(0,0,0,.28);
        padding: 18px;
        font-family: "JetBrains Mono", monospace;
      }
      .command-sim small {
        display: block;
        color: ${C.dim};
        letter-spacing: .14em;
        text-transform: uppercase;
        font-weight: 900;
        margin-bottom: 10px;
      }
      .command-sim code {
        color: ${C.green};
        word-break: break-word;
      }
      .signal-stack {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
        margin-top: 24px;
      }
      .signal-stack span {
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 12px;
        background: rgba(255,255,255,.035);
        padding: 12px;
        color: ${C.dim};
        font-family: "JetBrains Mono", monospace;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: .1em;
        text-transform: uppercase;
      }
      .brand-badges { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; }
      .notify-row { display: flex; gap: 10px; margin-top: 28px; flex-wrap: wrap; }
      .input {
        min-height: 48px;
        min-width: min(280px, 100%);
        flex: 1 1 260px;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 10px;
        background: rgba(0,0,0,.32);
        color: white;
        padding: 0 16px;
        outline: none;
        font-family: "JetBrains Mono", monospace;
        font-size: 12px;
      }
      .input:focus { border-color: ${C.borderHot}; box-shadow: 0 0 0 4px rgba(232,17,26,.1); }
      .notify-success {
        margin-top: 28px;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        border: 1px solid rgba(36,208,109,.35);
        border-radius: 10px;
        background: rgba(36,208,109,.1);
        color: ${C.green};
        padding: 14px 18px;
        font-family: "JetBrains Mono", monospace;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .final-cta {
        padding: 108px 24px;
        text-align: center;
        position: relative;
        overflow: hidden;
        border-top: 1px solid rgba(255,255,255,.09);
        background: radial-gradient(circle at 50% 50%, rgba(232,17,26,.18), transparent 32rem);
      }
      .final-cta img {
        width: min(760px, 92vw);
        margin-bottom: 26px;
        filter: drop-shadow(0 24px 54px rgba(0,0,0,.7));
      }
      .footer {
        padding: 28px 34px;
        border-top: 1px solid rgba(255,255,255,.09);
        display: flex;
        justify-content: space-between;
        gap: 18px;
        align-items: center;
        flex-wrap: wrap;
        color: ${C.dim};
        font-family: "JetBrains Mono", monospace;
        font-size: 10px;
        letter-spacing: .12em;
        text-transform: uppercase;
      }
      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 200;
        background: rgba(0,0,0,.72);
        backdrop-filter: blur(16px);
        display: grid;
        place-items: center;
        padding: 22px;
      }
      .modal {
        width: min(920px, 100%);
        max-height: min(780px, calc(100vh - 44px));
        overflow: auto;
        border: 1px solid rgba(232,17,26,.35);
        border-radius: 22px;
        background:
          radial-gradient(circle at 90% 0, rgba(232,17,26,.22), transparent 28rem),
          #09090c;
        box-shadow: 0 32px 120px rgba(0,0,0,.82), 0 0 80px rgba(232,17,26,.22);
        animation: modalIn .24s ease both;
      }
      .modal-head {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        padding: 26px;
        border-bottom: 1px solid rgba(255,255,255,.09);
      }
      .modal-title-row {
        display: flex;
        align-items: center;
        gap: 18px;
      }
      .modal-os-icon {
        width: 70px;
        height: 70px;
        border: 1px solid rgba(232,17,26,.35);
        border-radius: 18px;
        display: grid;
        place-items: center;
        background: rgba(232,17,26,.09);
        color: white;
        box-shadow: inset 0 0 26px rgba(232,17,26,.12), 0 0 28px rgba(232,17,26,.16);
        flex: 0 0 auto;
      }
      .modal-os-icon svg {
        width: 38px;
        height: 38px;
        display: block;
        filter: drop-shadow(0 0 14px rgba(232,17,26,.42));
      }
      .modal-head h2 {
        margin: 8px 0 0;
        color: white;
        font-size: clamp(30px, 5vw, 58px);
        line-height: .9;
        text-transform: uppercase;
      }
      .close {
        width: 46px;
        height: 46px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.04);
        color: white;
        cursor: pointer;
        font-size: 24px;
        line-height: 1;
      }
      .modal-body { padding: 26px; }
      .release-grid {
        display: grid;
        grid-template-columns: .85fr 1.15fr;
        gap: 18px;
      }
      .release-card {
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 16px;
        background: rgba(255,255,255,.035);
        padding: 18px;
      }
      .release-card h3 {
        margin: 0 0 14px;
        color: white;
        font-size: 14px;
        font-family: "JetBrains Mono", monospace;
        letter-spacing: .12em;
        text-transform: uppercase;
      }
      .release-card-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 14px;
      }
      .release-card-title .build-code {
        width: 44px;
        height: 44px;
        margin-top: 0;
        border-radius: 12px;
      }
      .release-card-title .build-code svg {
        width: 24px;
        height: 24px;
      }
      .release-card-title h3 { margin: 0; }
      .release-card ul,
      .release-card ol {
        margin: 0;
        padding-left: 18px;
        color: ${C.muted};
        line-height: 1.75;
        font-size: 13px;
      }
      .checksum {
        color: #ffdadd;
        font-family: "JetBrains Mono", monospace;
        font-size: 13px;
        word-break: break-word;
      }
      .ready-box {
        margin-top: 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        border: 1px solid rgba(232,17,26,.28);
        border-radius: 14px;
        background: rgba(232,17,26,.08);
        padding: 16px;
        color: ${C.muted};
        font-size: 13px;
        line-height: 1.5;
      }
      @media (max-width: 1080px) {
        .hero { grid-template-columns: 1fr; padding-top: 36px; }
        .device-stage { min-height: 560px; }
        .download-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .feature-layout, .android-card, .release-grid, .register-hero, .command-board { grid-template-columns: 1fr; }
        .nav-links { gap: 16px; }
      }
      @media (max-width: 760px) {
        .nav { align-items: flex-start; flex-direction: column; padding: 14px 20px; }
        .nav-brand img { max-width: 78vw; }
        .nav-links { width: 100%; overflow-x: auto; padding-bottom: 4px; }
        .section, .section-divider, .hero, .register-section { width: min(100% - 28px, 1240px); }
        .hero { gap: 18px; }
        .hero-actions .btn, .notify-row .btn, .ready-box .btn, .register-actions .btn, .register-input-row .btn { width: 100%; }
        .status-strip, .download-grid, .lab-grid, .signal-stack { grid-template-columns: 1fr; }
        .device-stage { min-height: 500px; transform: scale(.9); transform-origin: top center; margin-bottom: -60px; }
        .terminal-panel { right: 50%; transform: translateX(50%); bottom: 26px; width: 94%; }
        .hero-mascot { left: -8%; width: 72%; }
        .phone { width: 214px; height: 438px; }
        .compat-row { grid-template-columns: 1fr; gap: 7px; }
        .compat-row.header { display: none; }
        .android-card { padding: 28px; }
        .register-hero, .command-board { padding: 28px; }
        .bubble { max-width: 100%; }
        .ready-box { align-items: stretch; flex-direction: column; }
        .modal-title-row { align-items: flex-start; }
        .modal-os-icon { width: 58px; height: 58px; border-radius: 15px; }
        .modal-os-icon svg { width: 31px; height: 31px; }
      }
    `}</style>
  );
}

function Section({ id, eyebrow, title, copy, children }: { id?: string; eyebrow: string; title: ReactNode; copy?: string; children: ReactNode }) {
  return (
    <section className="section" id={id}>
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="section-title">{title}</h2>
      {copy ? <p className="section-copy">{copy}</p> : null}
      {children}
    </section>
  );
}

function Tag({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "green" | "amber" }) {
  const style: CSSProperties = tone === "green"
    ? { borderColor: "rgba(36,208,109,.32)", color: C.green, background: "rgba(36,208,109,.08)" }
    : tone === "amber"
      ? { borderColor: "rgba(245,158,11,.32)", color: C.amber, background: "rgba(245,158,11,.08)" }
      : {};
  return (
    <span className="tag" style={style}>
      {children}
    </span>
  );
}

function Nav({ onMenu, onTheme, isDark }: { onMenu: () => void; onTheme: () => void; isDark: boolean }) {
  return (
    <nav className={`nav${isDark ? "" : " nav-light"}`}>
      <a className="nav-brand" href="#top" aria-label="Activator.Tools home">
        {/* Logo always unmodified — no filter ever applied */}
        <img src={ASSETS.logoDark} alt="Activator.Tools" />
      </a>
      <div className="nav-links" aria-label="Primary navigation">
        <a href="#downloads">Downloads</a>
        <a href="#features">Features</a>
        <a href="#compat">Coverage</a>
        <a href="#android">Android</a>
        <a href="#register-sn">Register SN</a>
        <button className="theme-toggle" type="button" onClick={onTheme} aria-label="Toggle theme">
          {isDark
            ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg> Light</>
            : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg> Dark</>}
        </button>
        <a className="btn btn-soft" href="#downloads">Open Center</a>
      </div>
      <button className="hamburger" type="button" onClick={onMenu} aria-label="Open menu">
        <span /><span /><span />
      </button>
    </nav>
  );
}

function MobileNav({ open, onClose, onTheme, isDark }: { open: boolean; onClose: () => void; onTheme: () => void; isDark: boolean }) {
  return (
    <div className={`mobile-nav${open ? " open" : ""}`}>
      <div className="mobile-nav-backdrop" onClick={onClose} />
      <div className="mobile-nav-panel">
        <button className="mobile-nav-close" onClick={onClose}>✕</button>
        <nav className="mobile-nav-links">
          {(["#downloads", "#features", "#compat", "#android", "#register-sn"] as const).map((href, i) => (
            <a key={href} href={href} onClick={onClose} style={{ animationDelay: `${i * 60}ms` }}>
              {href.replace("#", "").replace(/-/g, " ").toUpperCase()}
            </a>
          ))}
          <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => { onTheme(); onClose(); }}>
            {isDark ? "☀ Switch to Light" : "⬛ Switch to Dark"}
          </button>
          <a className="btn btn-primary" href="#downloads" onClick={onClose} style={{ marginTop: 8 }}>Open Center</a>
        </nav>
      </div>
    </div>
  );
}

function LiveStatusBoard() {
  const [metrics, setMetrics] = useState(() => liveMetrics.map(m => m.base));
  const { ref, inView } = useInView();
  useEffect(() => {
    const t = setInterval(() => {
      setMetrics(liveMetrics.map(m => m.base + Math.floor((Math.random() - 0.5) * m.variance * 2)));
    }, 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <section className={`live-board${inView ? " in-view" : ""}`} ref={ref} id="live-status">
      <div className="ticker-wrap" aria-label="System status ticker">
        <div className="ticker-inner">
          {[...tickerMessages, ...tickerMessages].map((m, i) => (
            <span key={i} className="ticker-item"><span className="ticker-dot" />{m}</span>
          ))}
        </div>
      </div>
      <div style={{ width: "min(1240px,calc(100% - 48px))", margin: "0 auto", padding: "48px 0" }}>
        <div className="eyebrow" style={{ marginBottom: 24 }}>Live operational status</div>
        <div className="metrics-grid">
          {liveMetrics.map((m, i) => (
            <div key={m.key} className="metric-card" style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="metric-value">{metrics[i].toLocaleString()}</div>
              <div className="metric-label">{m.label}</div>
              <div className="metric-bar"><div className="metric-bar-fill" style={{ width: `${Math.min(100, (metrics[i] / m.base) * 80 + 10)}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Terminal({ progress }: { progress: number }) {
  return (
    <div className="terminal-panel" aria-label="Live system check terminal">
      <div className="panel-top">
        <div className="traffic"><span /><span /><span /></div>
        X4 live console
      </div>
      <div className="terminal-body">
        {terminalLines.map((line, index) => (
          <div className={`terminal-line ${line.tone}`} key={line.text} style={{ animation: `fadeUp .35s ease ${index * 80}ms both` }}>
            <b>{">"}</b>
            <span>{line.text}</span>
          </div>
        ))}
        <div className="terminal-line">
          <b>{">"}</b>
          <span>system.check.progress <span className="cursor" /></span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

function Hero({ progress, onPrimaryDownload }: { progress: number; onPrimaryDownload: () => void }) {
  return (
    <header className="hero" id="top">
      <div className="hero-copy">
        <img className="hero-logo" src={ASSETS.logoDark} alt="Activator.Tools" />
        <h1 className="hero-title">
          BEST RAMDISK TOOL
          <br />
          <span className="glitch" data-text="A7 TO A17">A7 - A17</span>
          <br />
        </h1>
        <p className="hero-sub">
          A high-output download hub for unlock stores, repair desks and device labs. Stable builds, compatibility intelligence and release guidance in one hardened surface.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary" type="button" onClick={onPrimaryDownload}>Launch Downloads</button>
          <a className="btn btn-soft" href="#register-sn">Register SN</a>
          <a className="btn btn-ghost" href="#features">Inspect Matrix</a>
        </div>
        <div className="status-strip" aria-label="Platform status">
          <div className="status-chip"><strong>v5.2.1</strong><span>Stable build</span></div>
          <div className="status-chip"><strong>A7-A17</strong><span>Chipset range</span></div>
          <div className="status-chip"><strong>Win/macOS</strong><span>Native desk</span></div>
          <div className="status-chip"><strong>24/7</strong><span>Ops ready</span></div>
        </div>
      </div>

      <div className="device-stage" aria-hidden="true">
        <div className="device-beam" />
        <div className="orbital-ring" />
        <div className="phone" />
        <img className="hero-mascot" src={ASSETS.appleMascot} alt="" />
        <Terminal progress={progress} />
      </div>
    </header>
  );
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform.includes("Windows")) {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M5 8.9 21 6.7v16.1H5V8.9Zm18.1-2.5L43 3.7v19.1H23.1V6.4ZM5 25.2h16v16.1L5 39.1V25.2Zm18.1 0H43v19.1l-19.9-2.7V25.2Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M32.3 4.1c.2 3.6-2.5 7-5.3 8.5-1.5.8-3.2 1.3-4.8 1.1-.2-3.4 2.3-6.9 5-8.6 1.6-1 3.5-1.5 5.1-1Zm7.8 31.1c-1.1 2.5-1.6 3.6-3 5.8-1.9 2.9-4.5 6.5-7.8 6.5-2.9 0-3.7-1.9-7.7-1.9s-4.9 1.8-7.8 1.9c-3.3.1-5.9-3.1-7.8-6-4.3-6.3-7.6-17.8-3.2-25.6 2.2-3.8 6-6.2 10.2-6.3 3.2-.1 6.2 2.1 7.7 2.1 1.4 0 5.3-2.6 9-2.2 1.5.1 5.8.6 8.6 4.6-7.5 4.1-6.3 14.8 1.8 18.3-.4 1-.8 1.9-1.3 2.8Z" />
    </svg>
  );
}

function TiltCard({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const tilt = useTilt();
  return (
    <div
      ref={tilt.ref}
      className={className}
      style={{ ...style, ...tilt.style }}
      onMouseMove={tilt.onMove as React.MouseEventHandler<HTMLDivElement>}
      onMouseLeave={tilt.onLeave}
    >
      {children}
    </div>
  );
}

function DownloadCenter({ onSelect }: { onSelect: (build: Build) => void }) {
  const { ref, inView } = useInView();
  return (
    <Section
      id="downloads"
      eyebrow="Download center"
      title={<>Release builds</>}
      copy="Choose the correct workstation package. Each release opens a controlled panel with requirements, checksum identity and install sequence before real download URLs are connected."
    >
      <div className="download-grid" ref={ref as React.RefObject<HTMLDivElement>}>
        {builds.map((build, idx) => (
          <TiltCard className={`build-card reveal${inView ? " visible" : ""}`} key={build.id} style={{ transitionDelay: `${idx * 80}ms` }}>
            <div className="build-meta">
              <span>{build.channel}</span>
              <span>{build.size}</span>
            </div>
            <div className={`build-code ${build.platform.includes("Windows") ? "windows" : "macos"}`}>
              <PlatformIcon platform={build.platform} />
            </div>
            <h3>{build.platform}</h3>
            <p>{build.target}. Built for {build.arch} workstations with visible release checks and technician-ready setup flow.</p>
            <div className="build-tags">
              <Tag tone="green">{build.status}</Tag>
              <Tag>{build.version}</Tag>
              <Tag>{build.arch}</Tag>
            </div>
            <button className="btn btn-primary" type="button" onClick={() => onSelect(build)}>
              Open release panel
            </button>
          </TiltCard>
        ))}
      </div>
    </Section>
  );
}

function FeatureMatrix() {
  const [activeId, setActiveId] = useState(features[0].id);
  const active = useMemo(() => features.find((feature) => feature.id === activeId) ?? features[0], [activeId]);

  return (
    <Section
      id="features"
      eyebrow="System modules"
      title={<>Feature matrix</>}
      copy="Hover or select a module to expose its live command surface. The layout is built for scanning fast, then drilling into the exact workflow a technician needs."
    >
      <div className="feature-layout">
        <div className="feature-list">
          {features.map((feature) => (
            <button
              className={`feature-card ${feature.id === active.id ? "active" : ""}`}
              key={feature.id}
              type="button"
              onClick={() => setActiveId(feature.id)}
              onMouseEnter={() => setActiveId(feature.id)}
            >
              <div className="feature-head">
                <span className="feature-code">{feature.code}</span>
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.telemetry}</p>
                </div>
                <span className="feature-signal">{feature.signal}</span>
              </div>
            </button>
          ))}
        </div>

        <aside className="feature-detail" aria-live="polite">
          <div className="eyebrow">{active.code} module selected</div>
          <div className="detail-title">{active.title}</div>
          <p className="detail-copy">{active.description}</p>
          <div className="command-box">
            <small>Operator command</small>
            <code>{active.command}</code>
          </div>
          <div className="command-box">
            <small>Telemetry</small>
            <code>{active.telemetry}</code>
          </div>
        </aside>
      </div>
    </Section>
  );
}

function AnimatedStat({ end, suffix = "", label }: { end: number; suffix?: string; label: string }) {
  const { ref, inView } = useInView();
  const val = useCountUp(end, 1400, inView);
  return (
    <div className="stat-card" ref={ref as React.RefObject<HTMLDivElement>}>
      <strong>{val}{suffix}</strong>
      <span>{label}</span>
    </div>
  );
}

function CompatibilityLab() {
  return (
    <Section
      id="compat"
      eyebrow="Compatibility lab"
      title={<>Device coverage</>}
      copy="A denser lab matrix for supported devices, chipset windows and current release confidence. Rows highlight on inspection so the table behaves like a working bench, not a static list."
    >
      <div className="lab-grid">
        <AnimatedStat end={7} label="Device families" />
        <AnimatedStat end={18} suffix="+" label="iOS windows" />
        <AnimatedStat end={4} label="Native builds" />
      </div>
      <div className="compat-wrap">
        <div className="compat-row header">
          <span>Model</span>
          <span>Chipset</span>
          <span>iOS range</span>
          <span>Status</span>
          <span>Coverage</span>
        </div>
        {compatibility.map((row) => (
          <div className="compat-row" key={row.model}>
            <strong>{row.model}</strong>
            <span>{row.chipset}</span>
            <span>{row.ios}</span>
            <Tag tone={row.status === "Full" || row.status === "Stable" ? "green" : row.status === "Beta" ? "amber" : "default"}>{row.status}</Tag>
            <div className="coverage" aria-label={`${row.coverage}% coverage`}>
              <div style={{ width: `${row.coverage}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function AndroidTeaser() {
  const [notified, setNotified] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const handleNotify = () => {
    const input = emailRef.current;
    if (!input || !input.value.includes("@")) {
      if (input) input.focus();
      if (input) input.style.borderColor = C.red2;
      return;
    }
    setNotified(true);
  };

  return (
    <Section
      id="android"
      eyebrow="Android division"
      title={<>FRP lab queue</>}
      copy="The Android side keeps the same technical energy: device families, release queue and early-access tracking for FRP workflows."
    >
      <div className="android-card">
        <div>
          <div className="eyebrow">X4-FRP under active development</div>
          <h3 className="section-title" style={{ fontSize: "clamp(42px, 6vw, 78px)", marginTop: 18 }}>
            Android release
            <br />
            <span style={{ color: C.red2 }}>pipeline</span>
          </h3>
          <p className="section-copy">
            Samsung, Xiaomi, Huawei, OPPO, Vivo and Realme are mapped as launch targets. The queue is designed to feel operational now, while the final binaries remain intentionally disconnected.
          </p>
          <div className="brand-badges">
            {["Samsung", "Xiaomi", "Huawei", "OPPO", "Vivo", "Realme"].map((brand) => (
              <Tag key={brand}>{brand}</Tag>
            ))}
          </div>
          {notified ? (
            <div className="notify-success">Launch alert armed</div>
          ) : (
            <div className="notify-row">
              <input className="input" ref={emailRef} placeholder="operator@email.com" aria-label="Email address for launch notification" />
              <button className="btn btn-primary" type="button" onClick={handleNotify}>Join release queue</button>
            </div>
          )}
        </div>
        <img src={ASSETS.androidMascot} alt="Activator.Tools Android mascot" />
      </div>
    </Section>
  );
}

function RegisterSnSection() {
  const [serial, setSerial] = useState("F2LTX4SN92Q1");
  const [activeCommand, setActiveCommand] = useState(botCommands[0]);
  const [signalIndex, setSignalIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSignalIndex((current) => (current + 1) % registerSignals.length);
    }, 1800);
    return () => window.clearInterval(timer);
  }, []);

  const cleanSerial = serial.trim() || "<SN>";
  const commandPreview = activeCommand.code.includes("<SN>")
    ? activeCommand.code.replace("<SN>", cleanSerial)
    : activeCommand.code;

  return (
    <section className="register-section" id="register-sn">
      <div className="register-shell">
        <div className="register-hero">
          <div className="register-copy">
            <div className="eyebrow">Telegram registration node</div>
            <h2>
              Register
              <br />
              <span>your SN</span>
            </h2>
            <p className="section-copy">
              Push customers into the fastest support path: open Telegram, register the serial, check the current device status, and pull the latest release commands directly from the bot.
            </p>
            <div className="signal-stack" aria-label="Telegram registration status">
              {registerSignals.map((signal, index) => (
                <span key={signal} style={index === signalIndex ? { color: C.green, borderColor: "rgba(36,208,109,.34)", background: "rgba(36,208,109,.08)" } : undefined}>
                  {signal}
                </span>
              ))}
            </div>
            <div className="register-actions">
              <a className="btn btn-primary" href={TELEGRAM_REGISTER_URL} target="_blank" rel="noopener noreferrer">
                Open Telegram register
              </a>
              <a className="btn btn-ghost" href="#downloads">Get latest build</a>
            </div>
          </div>

          <div className="register-terminal">
            <div className="telegram-top">
              <span>Activator.Tools bot simulation</span>
              <span className="telegram-dot" />
            </div>
            <div className="telegram-chat" aria-live="polite">
              <div className="bubble bot">
                <strong>Bot:</strong> Available Commands loaded. Use /registersn with your serial number to start the registration queue.
              </div>
              <div className="bubble user">{commandPreview}</div>
              <div className="bubble bot">
                <strong>Bot:</strong> Serial received. I will validate format, check registration state, and send the next action for this device.
              </div>
              <div className="bubble bot">
                <strong>Bot:</strong> Use /check {cleanSerial} any time to confirm whether the device is pending, approved, or already linked.
              </div>
            </div>
            <div className="register-input-row">
              <input
                className="input"
                value={serial}
                onChange={(event) => setSerial(event.target.value.toUpperCase())}
                placeholder="ENTER SERIAL NUMBER"
                aria-label="Serial number preview"
              />
              <a className="btn btn-primary" href={TELEGRAM_REGISTER_URL} target="_blank" rel="noopener noreferrer">
                Register in Telegram
              </a>
            </div>
          </div>
        </div>

        <div className="command-board">
          <div className="available-panel">
            <h3>Available commands</h3>
            <div className="command-list">
              {botCommands.map((command) => (
                <button
                  key={command.code}
                  className={`command-pill ${activeCommand.code === command.code ? "active" : ""}`}
                  type="button"
                  onClick={() => setActiveCommand(command)}
                  onMouseEnter={() => setActiveCommand(command)}
                >
                  <code>{command.code}</code>
                  <span>{command.group}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="command-explainer">
            <h3>{activeCommand.group}</h3>
            <div className="detail-title" style={{ fontSize: "clamp(28px, 4vw, 52px)" }}>
              {activeCommand.title}
            </div>
            <p style={{ marginTop: 18 }}>{activeCommand.detail}</p>
            <div className="command-sim">
              <small>Telegram command preview</small>
              <code>{commandPreview}</code>
            </div>
            <div className="command-sim">
              <small>Operator guidance</small>
              <code>
                Open Telegram, paste the command, wait for bot confirmation, then return to the download center if a new build is required.
              </code>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReleaseModal({ build, onClose }: { build: Build; onClose: () => void }) {
  const [progress, setProgress] = useState(0);
  const [verified, setVerified] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKeyDown); document.body.style.overflow = ""; };
  }, [onClose]);

  useEffect(() => {
    let v = 0;
    const t = setInterval(() => {
      v += Math.random() * 6 + 2;
      if (v >= 100) { v = 100; setVerified(true); clearInterval(t); }
      setProgress(Math.min(v, 100));
    }, 80);
    return () => clearInterval(t);
  }, []);

  const copyChecksum = () => {
    navigator.clipboard.writeText(build.checksum);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`${build.platform} release panel`} onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title-row">
            <div className={`modal-os-icon ${build.platform.includes("Windows") ? "windows" : "macos"}`}>
              <PlatformIcon platform={build.platform} />
            </div>
            <div>
              <div className="eyebrow">{build.channel} release panel</div>
              <h2>{build.platform}</h2>
            </div>
          </div>
          <button className="close" type="button" aria-label="Close release panel" onClick={onClose}>x</button>
        </div>
        <div className="modal-body">
          {/* Verify bar */}
          <div style={{ padding: "0 0 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#5d5d69", letterSpacing: ".14em", textTransform: "uppercase" }}>
                {verified ? "✓ Build verified" : "Verifying build integrity..."}
              </span>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: verified ? "#24d06d" : "#ff2732", fontWeight: 900 }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%`, background: verified ? "linear-gradient(90deg,#73070c,#24d06d)" : undefined }} />
            </div>
          </div>
          <div className="release-grid">
            <div className="release-card">
              <div className="release-card-title">
                <div className={`build-code ${build.platform.includes("Windows") ? "windows" : "macos"}`}>
                  <PlatformIcon platform={build.platform} />
                </div>
                <h3>Build identity</h3>
              </div>
              <div className="build-tags">
                <Tag tone="green">{build.status}</Tag>
                <Tag>{build.version}</Tag>
                <Tag>{build.size}</Tag>
                <Tag>{build.arch}</Tag>
              </div>
              <div className="command-box" style={{ position: "relative" }}>
                <small>Checksum</small>
                <code className="checksum">{build.checksum}</code>
                <button
                  type="button"
                  onClick={copyChecksum}
                  style={{ position: "absolute", top: 14, right: 14, background: copied ? "rgba(36,208,109,.15)" : "rgba(255,255,255,.07)", border: `1px solid ${copied ? "rgba(36,208,109,.4)" : "rgba(255,255,255,.12)"}`, borderRadius: 8, color: copied ? "#24d06d" : "#9a9aa8", fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 900, padding: "5px 10px", letterSpacing: ".1em", transition: ".2s" }}
                >
                  {copied ? "COPIED ✓" : "COPY"}
                </button>
              </div>
            </div>
            <div className="release-card">
              <h3>Requirements</h3>
              <ul>{build.requirements.map(r => <li key={r} style={{ marginBottom: 6 }}>{r}</li>)}</ul>
            </div>
          </div>
          <div className="release-card" style={{ marginTop: 18 }}>
            <h3>Install timeline</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 8 }}>
              {build.steps.map((step, i) => (
                <div key={step} style={{ display: "flex", gap: 16, alignItems: "flex-start", paddingBottom: i < build.steps.length - 1 ? 20 : 0, position: "relative" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: verified ? "rgba(36,208,109,.15)" : "rgba(232,17,26,.1)", border: `2px solid ${verified ? "#24d06d" : "#ff2732"}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "JetBrains Mono", fontSize: 12, fontWeight: 900, color: verified ? "#24d06d" : "#ff2732", flexShrink: 0 }}>{i + 1}</div>
                    {i < build.steps.length - 1 && <div style={{ width: 2, flex: 1, background: "rgba(255,255,255,.08)", marginTop: 4 }} />}
                  </div>
                  <div style={{ paddingTop: 6, color: "#9a9aa8", fontSize: 13, lineHeight: 1.6 }}>{step}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="ready-box" style={{ marginTop: 18 }}>
            <span>Ready to connect download URL for {build.platform}.</span>
            <button className="btn btn-soft" type="button" disabled>Connector armed</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function X4Landing() {
  const [selectedBuild, setSelectedBuild] = useState<Build | null>(null);
  const [checkProgress, setCheckProgress] = useState(0);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") !== "light");
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleTheme = useCallback(() => {
    setIsDark(d => {
      const next = !d;
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCheckProgress(c => (c >= 100 ? 0 : Math.min(100, c + 2)));
    }, 90);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="site-shell">
      <StyleSheet />
      <MoreStyles lightMode={!isDark} />
      <CustomCursor />
      <div className="global-scan" />
      <div className="noise-grid" />
      <Nav onMenu={() => setMenuOpen(true)} onTheme={toggleTheme} isDark={isDark} />
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} onTheme={toggleTheme} isDark={isDark} />
      <Hero progress={checkProgress} onPrimaryDownload={() => setSelectedBuild(builds[0])} />
      <div className="section-divider" />
      <DownloadCenter onSelect={setSelectedBuild} />
      <div className="section-divider" />
      <LiveStatusBoard />
      <div className="section-divider" />
      <FeatureMatrix />
      <div className="section-divider" />
      <CompatibilityLab />
      <div className="section-divider" />
      <AndroidTeaser />
      <div className="section-divider" />
      <RegisterSnSection />
      <section className="final-cta">
        <img src={ASSETS.logoDark} alt="Activator.Tools" style={isDark ? {} : { filter: "invert(1) hue-rotate(180deg)" }} />
        <div className="eyebrow" style={{ justifyContent: "center" }}>Final access node</div>
        <h2 className="section-title" style={{ margin: "18px auto 0", maxWidth: 860 }}>Built for high volume device labs</h2>
        <p className="section-copy" style={{ margin: "22px auto 0" }}>
          Keep every release visible, every platform separated and every technician one click away from the correct build panel.
        </p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <button className="btn btn-primary" type="button" onClick={() => setSelectedBuild(builds[0])}>Open Windows release</button>
          <button className="btn btn-ghost" type="button" onClick={() => setSelectedBuild(builds[3])}>Open macOS release</button>
        </div>
      </section>
      <footer className="footer">
        <span>Activator.Tools command center</span>
        <span>2026 release surface</span>
        <span>Windows / macOS / Android lab</span>
      </footer>
      {selectedBuild ? <ReleaseModal build={selectedBuild} onClose={() => setSelectedBuild(null)} /> : null}
    </div>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(<X4Landing />);
