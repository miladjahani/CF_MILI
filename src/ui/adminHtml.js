// ============================================================================
// miliconfig v3.1 - مرکز کنترل مدیریت (Admin Control Center)
// طراحی ۱۰۰٪ مطابق تصاویر 1000050097.png، 1000050085.jpg و 1000050137.jpg
// ============================================================================

import {
  BRAND_NAME,
  BRAND_UPPER,
  CONFIG_DEFAULTS,
  SUPPORT_CHANNEL_LABEL,
  SUPPORT_CHANNEL_URL,
  VERSION
} from '../config/defaults.js';
import { USER_PRESETS } from '../config/presets.js';
import { SHIELD_LOGO_SVG, FAVICON_DATA_URI, ICON, deEmoji } from './icons.js';
import { escapeHtml, safeJsonForScript } from '../core/utils.js';
import { BASE_UI_CSS, THEME_COLOR_META, VIEWPORT_META } from './baseCss.js';
import { FX_CSS, FX_MARKUP, FX_RUNTIME_JS } from './fx.js';

export function renderAdminDashboardHtml(initialData = {}) {
  const safeInitialJson = safeJsonForScript({
    brand: BRAND_NAME,
    version: VERSION,
    defaults: CONFIG_DEFAULTS,
    presets: USER_PRESETS,
    supportUrl: SUPPORT_CHANNEL_URL,
    config: initialData.config || CONFIG_DEFAULTS,
    users: initialData.users || [],
    diagnostics: initialData.diagnostics || {},
    adminPath: initialData.adminPath || ''
  });

  return deEmoji(`<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="${VIEWPORT_META}">
  <meta name="theme-color" content="${THEME_COLOR_META}">
  <title>داشبورد مدیریت — ${BRAND_UPPER} CONTROL CENTER</title>
  <link rel="icon" href="${FAVICON_DATA_URI}">
  <style>
    :root {
      --bg-0: #060b06;
      --bg-1: #0b140b;
      --card: rgba(14, 24, 14, 0.88);
      --card-2: rgba(10, 18, 10, 0.92);
      --card-hover: rgba(20, 35, 20, 0.94);
      --border: rgba(163, 230, 53, 0.16);
      --border-hi: rgba(181, 255, 77, 0.45);
      --neon: #b5ff4d;
      --neon-2: #84cc16;
      --neon-soft: rgba(181, 255, 77, 0.13);
      --text: #f3f8f0;
      --muted: #8fa686;
      --danger: #f87171;
      --warn: #fbbf24;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      min-height: 100dvh;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Vazirmatn", Tahoma, sans-serif;
      background:
        radial-gradient(circle at 12% 25%, rgba(132, 204, 22, 0.16) 0%, transparent 40%),
        radial-gradient(circle at 88% 10%, rgba(101, 163, 13, 0.12) 0%, transparent 40%),
        var(--bg-0);
      color: var(--text);
      overflow-x: hidden;
      /* clip (در مرورگرهای جدید) اسکرول‌کانتینر نمی‌سازد تا sticky نوار بالا کار کند */
      overflow-x: clip;
      line-height: 1.55;
    }
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(rgba(163, 230, 53, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(163, 230, 53, 0.035) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
      z-index: 0;
    }
    .app-shell {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 270px 1fr;
      gap: 16px;
      max-width: 1600px;
      margin: 0 auto;
      padding: 14px;
      min-height: 100vh;
      min-height: 100dvh;
    }
    @media (max-width: 1024px) {
      /* در موبایل چیدمان تک‌ستونه می‌شود و ناوبری فقط از منوی کشویی است */
      .app-shell { grid-template-columns: 1fr; }
    }

    /* سایدبار راست مطابق تصویر 1000050097.png */
    .sidebar {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 22px;
      padding: 18px 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: calc(100vh - 28px);
      height: calc(100dvh - 28px);
      position: sticky;
      top: 14px;
      backdrop-filter: blur(16px);
    }
    .sb-brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 8px 16px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 12px;
    }
    .sb-brand-text {
      text-align: left;
      direction: ltr;
    }
    .sb-brand-title {
      font-size: 1.15rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      color: var(--text);
    }
    .sb-brand-sub {
      font-size: 0.68rem;
      color: var(--neon);
      letter-spacing: 0.14em;
    }
    .sb-logo {
      width: 44px;
      height: 44px;
      flex-shrink: 0;
    }
    .sb-logo svg { width: 100%; height: 100%; }

    .sb-group-title {
      font-size: 0.75rem;
      color: var(--muted);
      padding: 10px 10px 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .sb-item {
      width: 100%;
      background: transparent;
      border: 1px solid transparent;
      color: var(--text);
      padding: 10px 12px;
      border-radius: 13px;
      font-family: inherit;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
      transition: all 0.18s;
      text-align: right;
    }
    .sb-item:hover {
      background: rgba(163, 230, 53, 0.08);
      border-color: var(--border);
    }
    .sb-item.active {
      background: linear-gradient(90deg, rgba(163, 230, 53, 0.16), rgba(163, 230, 53, 0.28));
      border-color: var(--border-hi);
      color: var(--neon);
      box-shadow: inset -3px 0 0 var(--neon);
    }
    .sb-badge {
      background: rgba(163, 230, 53, 0.16);
      border: 1px solid var(--border-hi);
      color: var(--neon);
      border-radius: 999px;
      padding: 1px 8px;
      font-size: 0.73rem;
      font-weight: 800;
    }

    .sb-footer {
      border-top: 1px solid var(--border);
      padding-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .clock-card {
      background: var(--card-2);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 10px;
      text-align: center;
    }
    .clock-time {
      font-family: "JetBrains Mono", monospace;
      font-size: 1.28rem;
      font-weight: 800;
      color: var(--text);
      letter-spacing: 0.06em;
    }
    .clock-date {
      font-size: 0.72rem;
      color: var(--muted);
      margin-top: 2px;
    }
    .sb-status-pill {
      background: var(--card-2);
      border: 1px solid var(--border);
      border-radius: 11px;
      padding: 8px 12px;
      font-size: 0.78rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      color: var(--text);
    }
    .dot-online {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--neon);
      box-shadow: 0 0 8px var(--neon);
    }
    .sb-btn {
      width: 100%;
      padding: 8px 12px;
      border-radius: 11px;
      background: rgba(163, 230, 53, 0.1);
      border: 1px solid var(--border);
      color: var(--neon);
      font-family: inherit;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      text-align: center;
      transition: all 0.18s;
    }
    .sb-btn:hover { border-color: var(--neon); background: rgba(163, 230, 53, 0.18); }
    .sb-btn-logout {
      background: var(--card-2);
      color: var(--muted);
    }

    /*
      ناوبری موبایل فقط از طریق منوی کشویی (Drawer) انجام می‌شود؛
      تب/نوار پایین حذف شده است.
    */

    /* محتوای اصلی */
    .main-area {
      display: flex;
      flex-direction: column;
      gap: 14px;
      min-width: 0;
    }
    .topbar {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 12px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .topbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .page-title {
      font-size: 1.15rem;
      font-weight: 900;
    }
    .topbar-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .top-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 999px;
      background: var(--card-2);
      border: 1px solid var(--border);
      color: var(--text);
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
    }
    .top-pill.live {
      background: rgba(163, 230, 53, 0.13);
      border-color: var(--border-hi);
      color: var(--neon);
    }

    /* بنر هیرو داشبورد مطابق تصویر 1000050097.png */
    .hero-card {
      background: linear-gradient(135deg, rgba(16, 30, 16, 0.94) 0%, rgba(10, 18, 10, 0.94) 100%);
      border: 1px solid var(--border-hi);
      border-radius: 22px;
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
      position: relative;
      overflow: hidden;
    }
    .hero-content {
      flex: 1;
      min-width: min(260px, 100%);
    }
    .hero-eyebrow {
      font-size: 0.72rem;
      letter-spacing: 0.18em;
      color: var(--muted);
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .hero-heading {
      font-size: 1.45rem;
      font-weight: 900;
      color: #fff;
      margin-bottom: 8px;
    }
    .hero-sub {
      font-size: 0.86rem;
      color: var(--muted);
      max-width: 780px;
      margin-bottom: 16px;
    }
    .hero-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 13px;
      border-radius: 999px;
      background: rgba(8, 15, 8, 0.85);
      border: 1px solid var(--border);
      font-size: 0.78rem;
      color: #d9ecd0;
    }
    .hero-emblem {
      width: 78px;
      height: 78px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #d9ff80 0%, #9ef01a 55%, #4d7c0f 100%);
      box-shadow: 0 0 36px rgba(181, 255, 77, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.9rem;
      font-weight: 900;
      color: #071204;
      flex-shrink: 0;
    }

    /* ۶ کارت متریک بالا */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 12px;
    }
    @media (max-width: 1280px) {
      .metrics-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 640px) {
      .metrics-grid { grid-template-columns: repeat(2, 1fr); }
    }
    .metric-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 118px;
    }
    .metric-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .metric-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text);
    }
    .metric-icon {
      width: 30px;
      height: 30px;
      border-radius: 9px;
      background: rgba(163, 230, 53, 0.12);
      border: 1px solid var(--border);
      color: var(--neon);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.88rem;
    }
    .metric-value {
      font-size: 1.35rem;
      font-weight: 900;
      color: #fff;
      margin: 10px 0 4px;
    }
    .metric-foot {
      font-size: 0.73rem;
      color: var(--muted);
    }

    /* گریدهای میانی و پایینی داشبورد */
    .dash-row-2 {
      display: grid;
      grid-template-columns: 1.8fr 1fr;
      gap: 14px;
    }
    .dash-row-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }
    .dash-row-bottom {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    @media (max-width: 960px) {
      .dash-row-2, .dash-row-3, .dash-row-bottom {
        grid-template-columns: 1fr;
      }
    }
    .panel-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 18px;
    }
    .panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }
    .panel-title {
      font-size: 1rem;
      font-weight: 800;
      color: #fff;
    }
    .panel-sub {
      font-size: 0.76rem;
      color: var(--muted);
      margin-top: 2px;
    }
    .kv-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .kv-row {
      background: var(--card-2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 9px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      font-size: 0.8rem;
    }
    .kv-key { color: var(--muted); }
    .kv-val {
      font-family: "JetBrains Mono", monospace;
      color: var(--text);
      direction: ltr;
      text-align: left;
    }
    /* ================= استخر پروکسی خروجی تفکیک‌شده کشور ================= */
    .pool-picker {
      background: rgba(6, 12, 6, 0.55);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }
    .pool-picker-head {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: flex-end;
    }
    .pool-picker-select {
      flex: 1 1 260px;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .pool-picker-meta {
      font-size: 0.75rem;
      color: var(--muted);
      line-height: 1.7;
    }
    .pool-row {
      align-items: flex-start;
      gap: 12px;
      flex-wrap: wrap;
    }
    .pool-url {
      font-family: "JetBrains Mono", monospace;
      direction: ltr;
      text-align: left;
      font-size: 0.76rem;
      color: var(--text);
      overflow-wrap: anywhere;
      flex: 1 1 200px;
      min-width: 0;
    }
    .pool-row-actions {
      display: flex;
      gap: 6px;
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .ping-badge {
      font-size: 0.72rem;
      padding: 3px 9px;
      border-radius: 999px;
      border: 1px solid var(--border);
      white-space: nowrap;
    }
    .ping-badge.ok {
      color: #b5ff4d;
      border-color: rgba(181, 255, 77, 0.45);
      background: rgba(181, 255, 77, 0.1);
    }
    .ping-badge.bad {
      color: #ff8080;
      border-color: rgba(255, 128, 128, 0.4);
      background: rgba(255, 128, 128, 0.08);
    }
    .ping-badge.wait {
      color: var(--muted);
    }
    .pool-node-settings {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: flex-end;
      border-top: 1px dashed var(--border);
      padding-top: 12px;
    }
    @media (max-width: 640px) {
      .pool-row-actions { width: 100%; justify-content: flex-start; }
    }
    .donut-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 14px 0;
    }
    .donut-ring {
      width: 150px;
      height: 150px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .donut-ring > * { position: relative; z-index: 1; }

    /* بخش کاربران مطابق تصویر 1000050137.jpg */
    .preset-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin: 14px 0;
    }
    @media (max-width: 820px) {
      .preset-grid { grid-template-columns: 1fr; }
    }
    .preset-card {
      background: var(--card-2);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 14px;
      cursor: pointer;
      transition: all 0.18s;
    }
    .preset-card.selected {
      background: rgba(163, 230, 53, 0.12);
      border-color: var(--neon);
      box-shadow: 0 0 22px rgba(181, 255, 77, 0.12);
    }
    .preset-title {
      font-size: 0.92rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 4px;
    }
    .preset-sub {
      font-size: 0.76rem;
      color: var(--muted);
      margin-bottom: 10px;
    }
    .preset-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    .preset-tag {
      font-size: 0.7rem;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      color: #d6e8ce;
    }

    .quick-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .mili-input, .mili-select, .mili-textarea {
      background: var(--card-2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 10px 13px;
      color: var(--text);
      font-family: inherit;
      font-size: 0.86rem;
      outline: none;
      transition: border-color 0.18s;
    }
    .mili-input:focus, .mili-select:focus, .mili-textarea:focus {
      border-color: var(--neon);
    }
    .btn-neon {
      background: linear-gradient(135deg, #c8ff6b 0%, #84cc16 100%);
      color: #071204;
      border: none;
      border-radius: 13px;
      padding: 10px 18px;
      font-family: inherit;
      font-size: 0.88rem;
      font-weight: 800;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      box-shadow: 0 6px 20px rgba(163, 230, 53, 0.28);
      transition: all 0.18s;
    }
    .btn-neon:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 26px rgba(163, 230, 53, 0.42);
    }
    .btn-ghost {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: 12px;
      padding: 8px 13px;
      font-family: inherit;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.18s;
    }
    .btn-ghost:hover {
      border-color: var(--neon);
      color: var(--neon);
    }
    .btn-danger {
      background: rgba(248, 113, 113, 0.1);
      border: 1px solid rgba(248, 113, 113, 0.35);
      color: var(--danger);
    }

    /* کارت‌های کاربران مطابق تصویر 1000050137.jpg */
    .users-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(288px, 100%), 1fr));
      gap: 14px;
      margin-top: 14px;
    }
    .user-card {
      background: var(--card-2);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: border-color 0.2s;
    }
    .user-card:hover { border-color: var(--border-hi); }
    .uc-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .uc-id-box {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .uc-avatar {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: rgba(163, 230, 53, 0.15);
      border: 1px solid var(--border-hi);
      color: var(--neon);
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .uc-name {
      font-size: 0.96rem;
      font-weight: 800;
      color: #fff;
    }
    .uc-uuid {
      font-family: "JetBrains Mono", monospace;
      font-size: 0.7rem;
      color: var(--muted);
      direction: ltr;
    }
    .uc-body {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .uc-stats {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.78rem;
    }
    .uc-stat-line {
      display: flex;
      justify-content: space-between;
      color: var(--muted);
    }
    .uc-stat-line strong { color: var(--text); }
    .uc-gauge {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      border: 5px solid rgba(163, 230, 53, 0.25);
      border-top-color: var(--neon);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 0.72rem;
      color: var(--neon);
      flex-shrink: 0;
    }
    .uc-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-top: 10px;
    }

    /* فرم تنظیمات و مودال کاربر جدید با تمام ۳۱ تنظیم پیش‌فرض کد */
    .form-grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .form-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    @media (max-width: 720px) {
      .form-grid-2, .form-grid-3 { grid-template-columns: 1fr; }
    }
    .field-box {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .field-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #d7e8cf;
    }
    .field-hint {
      font-size: 0.72rem;
      color: var(--muted);
    }
    .check-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      padding: 10px;
      background: var(--card-2);
      border: 1px solid var(--border);
      border-radius: 12px;
    }
    .check-label {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 0.84rem;
      cursor: pointer;
    }
    .check-label input {
      width: 17px;
      height: 17px;
      accent-color: var(--neon);
    }

    /* مودال ساخت/ویرایش کاربر */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(3, 7, 3, 0.82);
      backdrop-filter: blur(8px);
      z-index: 120;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .modal-backdrop.open { display: flex; }
    .modal-box {
      background: #0b140b;
      border: 1px solid var(--border-hi);
      border-radius: 22px;
      width: 100%;
      max-width: 880px;
      max-height: 90vh;
      max-height: 90dvh;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 22px;
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.85);
    }
    .modal-sec-title {
      font-size: 0.9rem;
      font-weight: 800;
      color: var(--neon);
      margin: 18px 0 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--border);
    }

    .view-section { display: none; }
    .view-section.active { display: flex; flex-direction: column; gap: 14px; }

    /* ==================
       انیمیشن‌های اختصاصی پنل مدیریت
       ================== */
    .view-section.active { animation: fxFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .metric-card:hover .metric-value { color: var(--neon); }
    .metric-value { transition: color 0.3s ease; }
    .uc-actions .btn-ghost { flex: 1 1 auto; justify-content: center; }
    .modal-backdrop { opacity: 0; transition: opacity 0.28s ease; }
    .modal-backdrop.open { opacity: 1; }
    .modal-box {
      transform: translate3d(0, 20px, 0) scale(0.98);
      opacity: 0.55;
      transition: transform 0.44s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.44s ease;
    }
    .modal-backdrop.open .modal-box { transform: none; opacity: 1; }
    .sidebar { transition: box-shadow 0.3s ease; }
    @media (max-width: 1024px) {
      .sidebar.drawer-open { animation: fxFadeUp 0.44s cubic-bezier(0.22, 1, 0.36, 1) both; }
    }
    .sync-pill.syncing .dot-online { animation: fxLive 0.65s ease-in-out infinite; }
    .empty-state {
      padding: 22px;
      text-align: center;
      color: var(--muted);
      font-size: 0.86rem;
      border: 1px dashed var(--border);
      border-radius: 16px;
    }
    .quick-bar > .btn-neon { flex: 0 0 auto; }

    /* ==================
       بهینه‌سازی رابط برای گوشی همراه و ویندوز
       ================== */
    .topbar-brand {
      font-size: 0.74rem;
      color: var(--muted);
      letter-spacing: 0.12em;
    }
    .modal-actions {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    /* دکمه کشویی موبایل (باز/بسته کردن منو) */
    .menu-toggle { display: none; }
    .sb-close {
      display: none;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(248, 113, 113, 0.12);
      border: 1px solid rgba(248, 113, 113, 0.35);
      color: var(--danger);
      font-size: 0.95rem;
      font-family: inherit;
      cursor: pointer;
      flex-shrink: 0;
    }
    @media (max-width: 1024px) {
      .app-shell {
        padding: 10px;
        gap: 12px;
        padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
      }
      /* نوار بالا چسبان است تا دکمه «☰ منو» همیشه در دسترس باشد */
      .topbar {
        position: sticky;
        top: 8px;
        z-index: 60;
        background: rgba(11, 20, 11, 0.97);
      }
      .topbar-brand { display: none; }
      /*
        منوی کشویی «درون‌صفحه» است، نه لایه‌ی شناور روی کل صفحه:
        با دکمه «☰ منو» باز می‌شود و محتوا را به پایین هل می‌دهد تا صفحه قابل استفاده بماند.
        بستن آن: دکمه ✕ داخل منو، دکمه «✕ بستن منو» در نوار بالا، یا انتخاب هر آیتم منو.
        نکته: این قاعده باید بعد از قاعده پایه .sidebar بیاید تا واقعاً اعمال شود.
      */
      /*
        منوی کشویی از سمت راست با حس iOS: پنل شیشه‌ای (blur) که از لبه راست
        سُر می‌خورد، گوشه‌های گرد، سایه نرم و پس‌زمینه محو. محتوا را هل نمی‌دهد
        تا روی موبایل صفحه نپرد.
      */
      .sidebar {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: auto;
        width: min(86vw, 348px);
        height: 100dvh;
        max-height: 100dvh;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        gap: 10px;
        border-radius: 26px 0 0 26px;
        padding: calc(14px + env(safe-area-inset-top, 0px)) 14px calc(18px + env(safe-area-inset-bottom, 0px));
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        z-index: 120;
        background: rgba(10, 17, 10, 0.9);
        -webkit-backdrop-filter: blur(24px) saturate(170%);
        backdrop-filter: blur(24px) saturate(170%);
        border-left: 1px solid rgba(163, 230, 53, 0.16);
        box-shadow: -28px 0 64px rgba(0, 0, 0, 0.55);
        transform: translate3d(104%, 0, 0);
        transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
        will-change: transform;
      }
      .sidebar.drawer-open { transform: translate3d(0, 0, 0); }
      /* پرده محو پشت منو */
      .sb-scrim {
        position: fixed;
        inset: 0;
        z-index: 110;
        opacity: 0;
        pointer-events: none;
        background: rgba(3, 7, 3, 0.62);
        -webkit-backdrop-filter: blur(3px);
        backdrop-filter: blur(3px);
        transition: opacity 0.34s ease;
      }
      .sb-scrim.open { opacity: 1; pointer-events: auto; }
      body.drawer-lock { overflow: hidden; }
      .menu-toggle {
        display: inline-flex;
        background: rgba(163, 230, 53, 0.16);
        border-color: var(--border-hi);
        color: var(--neon);
        font-weight: 800;
      }
      .sb-close { display: inline-flex; }
      .hero-card { padding: 18px 16px; }
      .hero-heading { font-size: 1.18rem; }
      .hero-sub { font-size: 0.82rem; }
      .panel-card, .metric-card { padding: 14px; }
      .modal-backdrop { padding: 10px; align-items: flex-start; }
      .modal-box {
        padding: 16px;
        border-radius: 18px;
        max-height: calc(100dvh - 20px);
      }
      .users-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .metric-card { min-height: 0; }
      .metric-value { font-size: 1.2rem; }
      .top-pill { font-size: 0.75rem; padding: 8px 11px; }
      .hero-emblem { width: 56px; height: 56px; font-size: 1.35rem; }
      .donut-ring { width: 118px; height: 118px; border-width: 12px; }
      .kv-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 3px;
      }
      .uc-body { gap: 10px; }
      .check-grid { gap: 6px 14px; }
      .modal-actions { flex-direction: column-reverse; }
      .modal-actions > button { width: 100%; justify-content: center; }
    }
${FX_CSS}
${BASE_UI_CSS}
    /* ================================================================
       miliconfig OS shell v4 — لایه ظاهری «سیستم‌عامل»
       پنجره شیشه‌ای، داک پایین، تایپوگرافی آرام و ترنزیشن‌های سبک
       ================================================================ */
    :root {
      --os-bg: #05080a;
      --os-panel: rgba(12, 18, 14, 0.72);
      --os-panel-2: rgba(16, 24, 18, 0.86);
      --os-line: rgba(181, 255, 77, 0.13);
      --os-line-soft: rgba(255, 255, 255, 0.06);
      --os-ink: #eaf3e4;
      --os-ink-soft: #93a58e;
      --os-accent: #b5ff4d;
      --os-radius: 20px;
      --os-ease: cubic-bezier(.22, .61, .36, 1);
    }
    html, body { height: 100%; }
    body {
      background:
        radial-gradient(900px 520px at 78% -12%, rgba(163, 230, 53, 0.10), transparent 62%),
        radial-gradient(700px 420px at 8% 108%, rgba(56, 189, 248, 0.05), transparent 60%),
        var(--os-bg);
      color: var(--os-ink);
      font-family: "Vazirmatn", system-ui, -apple-system, "Segoe UI", Tahoma, sans-serif;
      line-height: 1.6;
      overflow: hidden;
    }
    body::before {
      background-image:
        linear-gradient(rgba(181, 255, 77, 0.018) 1px, transparent 1px),
        linear-gradient(90deg, rgba(181, 255, 77, 0.018) 1px, transparent 1px);
      background-size: 56px 56px;
      mask-image: radial-gradient(circle at 50% 0%, #000 0%, transparent 78%);
      -webkit-mask-image: radial-gradient(circle at 50% 0%, #000 0%, transparent 78%);
    }
    .ic { width: 18px; height: 18px; flex: 0 0 auto; display: inline-block; vertical-align: -3px; }

    /* ---------- چیدمان اصلی ---------- */
    .app-shell {
      display: block;
      max-width: none;
      margin: 0;
      padding: 0;
      min-height: 100dvh;
      height: 100dvh;
      gap: 0;
    }
    .main-area {
      height: 100dvh;
      overflow-y: auto;
      overflow-x: hidden;
      scroll-behavior: smooth;
      padding: 14px clamp(12px, 3vw, 34px) 132px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-width: 1280px;
      margin: 0 auto;
    }

    /* ---------- نوار بالا ---------- */
    .topbar {
      position: sticky;
      top: 10px;
      z-index: 30;
      margin: 0 0 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      padding: 8px 12px;
      border-radius: 16px;
      border: 1px solid var(--os-line-soft);
      background: rgba(9, 14, 11, 0.72);
      backdrop-filter: blur(22px) saturate(140%);
      -webkit-backdrop-filter: blur(22px) saturate(140%);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.32);
    }
    .topbar-right, .topbar-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .tb-brand { display: flex; align-items: center; gap: 9px; }
    .tb-logo { width: 30px; height: 30px; display: grid; place-items: center; }
    .tb-logo svg { width: 30px; height: 30px; }
    .tb-name { display: flex; flex-direction: column; line-height: 1.05; }
    .tb-name b { font-size: 0.92rem; letter-spacing: 0.06em; }
    .tb-name small { font-size: 0.56rem; letter-spacing: 0.2em; color: var(--os-accent); opacity: 0.85; direction: ltr; }
    .page-title { font-size: 0.95rem; font-weight: 700; color: var(--os-ink); margin-inline-start: 2px; }
    .topbar-brand { display: none; }
    .top-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 11px;
      border-radius: 11px;
      border: 1px solid var(--os-line-soft);
      background: rgba(255, 255, 255, 0.03);
      color: var(--os-ink-soft);
      font: inherit;
      font-size: 0.78rem;
      cursor: pointer;
      text-decoration: none;
      transition: color .18s var(--os-ease), border-color .18s var(--os-ease), background .18s var(--os-ease), transform .18s var(--os-ease);
    }
    .top-pill:hover { color: var(--os-ink); border-color: rgba(181, 255, 77, 0.34); background: rgba(181, 255, 77, 0.07); transform: translateY(-1px); }
    .top-pill.accent { background: linear-gradient(180deg, #c8ff6b, #a3e635); color: #10160b; border-color: transparent; font-weight: 700; }
    .top-pill.accent:hover { color: #10160b; background: linear-gradient(180deg, #d6ff8c, #b5ff4d); }
    .menu-toggle { display: none; }
    .clock-card { display: flex; flex-direction: row; align-items: baseline; gap: 7px; padding: 0 4px; }
    .clock-time { font-size: 0.85rem; font-weight: 700; color: var(--os-ink); font-variant-numeric: tabular-nums; direction: ltr; }
    .clock-date { font-size: 0.68rem; color: var(--os-ink-soft); }
    .dot-online { width: 7px; height: 7px; border-radius: 50%; background: var(--os-accent); box-shadow: 0 0 0 3px rgba(181, 255, 77, 0.16); flex: 0 0 auto; }

    /* ---------- داک پایین (ناوبری) ---------- */
    .sidebar {
      position: fixed;
      z-index: 40;
      inset-inline: 0;
      bottom: 18px;
      margin: 0 auto;
      width: max-content;
      max-width: calc(100vw - 20px);
      height: auto;
      top: auto;
      padding: 7px;
      border-radius: 20px;
      border: 1px solid var(--os-line-soft);
      background: rgba(10, 15, 12, 0.78);
      backdrop-filter: blur(24px) saturate(150%);
      -webkit-backdrop-filter: blur(24px) saturate(150%);
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      gap: 2px;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .sidebar::-webkit-scrollbar { display: none; }
    .sidebar > div:first-child { display: flex; align-items: center; gap: 2px; }
    .sb-brand, .sb-group-title, .sb-close, .sb-footer, .sb-status-pill { display: none; }
    .sb-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      min-width: 68px;
      padding: 8px 10px 7px;
      border: 0;
      border-radius: 14px;
      background: transparent;
      color: var(--os-ink-soft);
      font: inherit;
      font-size: 0.66rem;
      cursor: pointer;
      transition: color .18s var(--os-ease), background .18s var(--os-ease), transform .18s var(--os-ease);
      position: relative;
    }
    .sb-item span { display: inline-flex; align-items: center; gap: 4px; }
    .sb-item .ic { width: 21px; height: 21px; margin-bottom: 1px; }
    .sb-item:hover { color: var(--os-ink); background: rgba(255, 255, 255, 0.05); }
    .sb-item.active { color: #0f150a; background: linear-gradient(180deg, #c9ff74, #a8ea3f); box-shadow: 0 6px 18px rgba(163, 230, 53, 0.25); }
    .sb-badge { position: absolute; top: 4px; inset-inline-end: 6px; font-size: 0.55rem; padding: 0 5px; border-radius: 999px; background: rgba(0, 0, 0, 0.28); color: inherit; }
    .sb-item.active .sb-badge { background: rgba(0, 0, 0, 0.18); }

    /* ---------- پنجره‌ها و کارت‌ها ---------- */
    .view-section { display: none; flex-direction: column; gap: 12px; animation: osFade .26s var(--os-ease); }
    .view-section.active { display: flex; }
    @keyframes osFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
    .panel-card, .fx-card, .hero-card, .preset-card, .pool-picker, .check-grid {
      background: var(--os-panel);
      border: 1px solid var(--os-line-soft);
      border-radius: var(--os-radius);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }
    .panel-card { padding: 16px; }
    .panel-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0 0 12px; border-bottom: 1px solid var(--os-line-soft); margin-bottom: 14px; }
    .panel-title { font-size: 0.94rem; font-weight: 700; display: flex; align-items: center; gap: 7px; }
    .panel-title .ic { width: 17px; height: 17px; color: var(--os-accent); }
    .panel-sub { font-size: 0.72rem; color: var(--os-ink-soft); }

    .hero-card { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 22px; overflow: hidden; position: relative; }
    .hero-card::after { content: ""; position: absolute; inset: auto -8% -60% 34%; height: 220px; background: radial-gradient(circle, rgba(181, 255, 77, 0.14), transparent 62%); pointer-events: none; }
    .hero-eyebrow { font-size: 0.62rem; letter-spacing: 0.22em; color: var(--os-accent); direction: ltr; opacity: 0.8; }
    .hero-heading { font-size: 1.18rem; font-weight: 800; margin: 6px 0 6px; line-height: 1.5; }
    .hero-sub { font-size: 0.8rem; color: var(--os-ink-soft); max-width: 62ch; }
    .hero-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
    .hero-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 0.7rem; padding: 5px 9px; border-radius: 9px; background: rgba(255, 255, 255, 0.04); border: 1px solid var(--os-line-soft); color: var(--os-ink-soft); }
    .hero-badge .ic { width: 14px; height: 14px; }
    .hero-emblem {
      width: 84px; height: 84px; border-radius: 26px; flex: 0 0 auto;
      display: grid; place-items: center; font-weight: 900; font-size: 1.6rem; color: #0d130a;
      background: linear-gradient(155deg, #d8ff90, #86d21c 72%);
      box-shadow: 0 14px 40px rgba(163, 230, 53, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.5);
    }

    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(178px, 1fr)); gap: 10px; }
    .metric-card { position: relative; padding: 13px 14px; border-radius: 16px; background: var(--os-panel); border: 1px solid var(--os-line-soft); transition: transform .2s var(--os-ease), border-color .2s var(--os-ease); }
    .metric-card:hover { transform: translateY(-2px); border-color: rgba(181, 255, 77, 0.28); }
    .metric-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .metric-label { font-size: 0.7rem; color: var(--os-ink-soft); }
    .metric-icon { color: var(--os-accent); display: inline-flex; }
    .metric-value { font-size: 1.24rem; font-weight: 800; margin-top: 5px; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
    .metric-foot { font-size: 0.66rem; color: var(--os-ink-soft); margin-top: 2px; }
    .dash-row-2, .dash-row-3, .dash-row-bottom { display: grid; gap: 10px; }
    .dash-row-2 { grid-template-columns: 1.25fr 1fr; }
    .dash-row-3 { grid-template-columns: repeat(3, 1fr); }
    .dash-row-bottom { grid-template-columns: 1fr 1fr; }

    /* ---------- کنترل‌ها ---------- */
    .btn-neon, .btn-ghost, .btn-danger, .sb-btn, .copy-btn, .dl-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      font: inherit; font-size: 0.8rem; font-weight: 600; cursor: pointer;
      padding: 9px 13px; border-radius: 11px; border: 1px solid transparent;
      transition: transform .16s var(--os-ease), background .16s var(--os-ease), border-color .16s var(--os-ease), color .16s var(--os-ease);
      text-decoration: none;
    }
    .btn-neon { background: linear-gradient(180deg, #c9ff74, #a3e635); color: #10160b; box-shadow: 0 8px 20px rgba(163, 230, 53, 0.2); }
    .btn-neon:hover { transform: translateY(-1px); }
    .btn-ghost { background: rgba(255, 255, 255, 0.04); border-color: var(--os-line-soft); color: var(--os-ink); }
    .btn-ghost:hover { background: rgba(255, 255, 255, 0.07); border-color: rgba(181, 255, 77, 0.3); }
    .btn-danger { background: rgba(248, 113, 113, 0.12); border-color: rgba(248, 113, 113, 0.3); color: #fca5a5; }
    .btn-danger:hover { background: rgba(248, 113, 113, 0.2); }
    .copy-btn, .dl-btn { padding: 6px 9px; font-size: 0.7rem; background: rgba(255, 255, 255, 0.04); border-color: var(--os-line-soft); color: var(--os-ink-soft); }
    .copy-btn:hover, .dl-btn:hover { color: var(--os-ink); border-color: rgba(181, 255, 77, 0.3); }

    .mili-input, .mili-select, .mili-textarea, input[type="text"], input[type="number"], input[type="search"], input[type="password"], select, textarea {
      width: 100%; font: inherit; font-size: 0.82rem; color: var(--os-ink);
      padding: 9px 11px; border-radius: 11px;
      background: rgba(6, 10, 8, 0.86); border: 1px solid var(--os-line-soft);
      transition: border-color .16s var(--os-ease), box-shadow .16s var(--os-ease);
    }
    .mili-input:focus, .mili-select:focus, .mili-textarea:focus, input:focus, select:focus, textarea:focus {
      outline: none; border-color: rgba(181, 255, 77, 0.55); box-shadow: 0 0 0 3px rgba(181, 255, 77, 0.12);
    }
    .mili-select { appearance: none; background-image: linear-gradient(45deg, transparent 50%, var(--os-ink-soft) 50%), linear-gradient(135deg, var(--os-ink-soft) 50%, transparent 50%); background-position: calc(0% + 13px) 52%, calc(0% + 18px) 52%; background-size: 5px 5px, 5px 5px; background-repeat: no-repeat; padding-inline-start: 28px; }
    .field-box { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
    .field-label { font-size: 0.72rem; color: var(--os-ink-soft); display: flex; align-items: center; gap: 5px; }
    .field-hint { font-size: 0.64rem; color: rgba(147, 165, 142, 0.72); }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .form-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .check-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 8px; padding: 10px; }
    .check-label { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 11px; background: rgba(255, 255, 255, 0.03); font-size: 0.78rem; cursor: pointer; transition: background .16s var(--os-ease); }
    .check-label:hover { background: rgba(181, 255, 77, 0.08); }
    .check-label input[type="checkbox"] { appearance: none; width: 38px; height: 21px; border-radius: 999px; background: rgba(255, 255, 255, 0.1); border: 1px solid var(--os-line-soft); position: relative; cursor: pointer; transition: background .18s var(--os-ease); }
    .check-label input[type="checkbox"]::after { content: ""; position: absolute; top: 2px; inset-inline-start: 2px; width: 15px; height: 15px; border-radius: 50%; background: #cbd5c4; transition: transform .18s var(--os-ease), background .18s var(--os-ease); }
    .check-label input[type="checkbox"]:checked { background: rgba(181, 255, 77, 0.3); }
    .check-label input[type="checkbox"]:checked::after { transform: translateX(-16px); background: var(--os-accent); }

    /* ---------- کاربران ---------- */
    .users-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px; }
    .user-card { padding: 14px; border-radius: 16px; background: var(--os-panel); border: 1px solid var(--os-line-soft); transition: transform .2s var(--os-ease), border-color .2s var(--os-ease); }
    .user-card:hover { transform: translateY(-2px); border-color: rgba(181, 255, 77, 0.26); }
    .uc-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .uc-name { font-size: 0.9rem; font-weight: 700; }
    .uc-avatar { width: 34px; height: 34px; border-radius: 11px; display: grid; place-items: center; background: rgba(181, 255, 77, 0.12); color: var(--os-accent); font-weight: 800; }
    .uc-uuid { font-size: 0.62rem; color: var(--os-ink-soft); direction: ltr; text-align: left; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .uc-id-box { display: flex; align-items: center; gap: 6px; margin: 8px 0; padding: 6px 8px; border-radius: 9px; background: rgba(0, 0, 0, 0.28); border: 1px solid var(--os-line-soft); }
    .uc-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 8px 0; }
    .uc-stat-line { display: flex; justify-content: space-between; gap: 6px; font-size: 0.7rem; color: var(--os-ink-soft); }
    .uc-stats b, .uc-stat-line b { color: var(--os-ink); font-weight: 700; }
    .uc-actions { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
    .uc-gauge { height: 5px; border-radius: 999px; background: rgba(255, 255, 255, 0.08); overflow: hidden; }
    .uc-gauge span, .uc-gauge > div { display: block; height: 100%; background: linear-gradient(90deg, #86d21c, #d8ff90); }
    .bad, .ok, .live, .wait, .ping-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 0.66rem; padding: 3px 8px; border-radius: 999px; border: 1px solid transparent; }
    .ok, .live { background: rgba(181, 255, 77, 0.12); color: #cdf98a; border-color: rgba(181, 255, 77, 0.24); }
    .bad { background: rgba(248, 113, 113, 0.12); color: #fca5a5; border-color: rgba(248, 113, 113, 0.26); }
    .wait { background: rgba(251, 191, 36, 0.12); color: #fcd34d; border-color: rgba(251, 191, 36, 0.24); }
    .preset-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 9px; }
    .preset-card { padding: 12px; cursor: pointer; border-radius: 14px; transition: border-color .18s var(--os-ease), transform .18s var(--os-ease); }
    .preset-card:hover { border-color: rgba(181, 255, 77, 0.3); transform: translateY(-1px); }
    .preset-card.active, .preset-card.sel { border-color: rgba(181, 255, 77, 0.6); background: rgba(181, 255, 77, 0.07); }
    .preset-title { font-size: 0.8rem; font-weight: 700; }
    .preset-sub { font-size: 0.68rem; color: var(--os-ink-soft); margin-top: 3px; }
    .preset-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
    .preset-tag { font-size: 0.62rem; padding: 2px 7px; border-radius: 999px; background: rgba(255, 255, 255, 0.05); color: var(--os-ink-soft); }
    .kv-list { display: flex; flex-direction: column; gap: 2px; }
    .kv-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 7px 2px; border-bottom: 1px dashed rgba(255, 255, 255, 0.06); font-size: 0.76rem; }
    .kv-row:last-child { border-bottom: 0; }
    .kv-key { color: var(--os-ink-soft); }
    .kv-val { font-weight: 600; text-align: left; }
    .empty-state { padding: 26px 14px; text-align: center; color: var(--os-ink-soft); font-size: 0.8rem; }
    .quick-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .pool-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; border-radius: 11px; background: rgba(255, 255, 255, 0.03); margin-bottom: 5px; font-size: 0.75rem; }
    .pool-row-actions { display: flex; gap: 5px; }
    .pool-picker { padding: 14px; }
    .pool-picker-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
    .pool-picker-meta { font-size: 0.7rem; color: var(--os-ink-soft); }

    /* ---------- مودال ---------- */
    .modal-backdrop { position: fixed; inset: 0; z-index: 90; display: none; align-items: center; justify-content: center; padding: 16px; background: rgba(3, 6, 4, 0.72); backdrop-filter: blur(10px); }
    .modal-backdrop.open { display: flex; }
    .modal-box { width: min(760px, 100%); max-height: 88dvh; overflow-y: auto; padding: 18px; border-radius: 22px; background: var(--os-panel-2); border: 1px solid var(--os-line); box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55); animation: osPop .22s var(--os-ease); }
    @keyframes osPop { from { opacity: 0; transform: scale(.97) translateY(8px); } to { opacity: 1; transform: none; } }
    .modal-sec-title { font-size: 0.78rem; font-weight: 700; color: var(--os-accent); margin: 14px 0 8px; display: flex; align-items: center; gap: 6px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }

    /* ---------- واکنش‌گرا ---------- */
    @media (max-width: 980px) {
      .dash-row-2, .dash-row-3, .dash-row-bottom { grid-template-columns: 1fr; }
      .hero-emblem { display: none; }
      .form-grid-2, .form-grid-3 { grid-template-columns: 1fr; }
      .topbar { top: 6px; }
      .clock-date { display: none; }
    }
    @media (max-width: 720px) {
      .main-area { padding: 10px 12px 118px; }
      .topbar { padding: 8px; }
      .page-title { font-size: 0.86rem; }
      .tb-name small { display: none; }
      .menu-toggle { display: inline-flex; }
      .sidebar { bottom: 10px; width: calc(100vw - 16px); padding: 6px; justify-content: flex-start; }
      .sb-item { min-width: 60px; flex: 1 0 auto; font-size: 0.6rem; padding: 7px 6px; }
      .sb-item .ic { width: 19px; height: 19px; }
      .metrics-grid { grid-template-columns: 1fr 1fr; }
      .uc-stats { grid-template-columns: 1fr; }
    }
    @media (prefers-reduced-motion: reduce) {
      .view-section, .modal-box { animation: none; }
    }
  </style>
</head>
<body>
  ${FX_MARKUP}

  <div class="app-shell">
    <!-- سایدبار سمت راست دسکتاپ -->
    <!-- پرده محو پشت منوی کشویی راست (فقط موبایل) -->
    <div class="sb-scrim" id="sbScrim" onclick="toggleSidebarDrawer(false)"></div>
    <aside class="sidebar" aria-label="ناوبری اصلی سیستم">
      <div>
        <button type="button" class="sb-item active" data-view="dashboard" onclick="switchView('dashboard')">
          ${ICON('dashboard')}<span>داشبورد</span>
        </button>
        <button type="button" class="sb-item" data-view="users" onclick="switchView('users')">
          ${ICON('users')}<span>کاربران</span>
          <span class="sb-badge" id="sbUserCount">0</span>
        </button>
        <button type="button" class="sb-item" data-view="nodes" onclick="switchView('nodes')">
          ${ICON('nodes')}<span>نودها</span>
          <span class="sb-badge" id="sbNodeCount">0</span>
        </button>
        <button type="button" class="sb-item" data-view="network" onclick="switchView('network')">
          ${ICON('network')}<span>شبکه</span>
        </button>
        <button type="button" class="sb-item" data-view="panel" onclick="switchView('panel')">
          ${ICON('sliders')}<span>اشتراک</span>
        </button>
        <button type="button" class="sb-item" data-view="system" onclick="switchView('system')">
          ${ICON('system')}<span>سیستم</span>
        </button>
      </div>
    </aside>

    <!-- ناحیه اصلی -->
    <main class="main-area">
      <!-- نوار بالا -->
      <header class="topbar">
        <div class="topbar-right">
          <button type="button" class="top-pill menu-toggle" onclick="toggleSidebarDrawer()" aria-expanded="false" aria-label="منو">${ICON('menu')}</button>
          <div class="tb-brand">
            <span class="tb-logo">${SHIELD_LOGO_SVG}</span>
            <span class="tb-name"><b>${BRAND_UPPER}</b><small>CONTROL CENTER</small></span>
          </div>
          <h1 class="page-title" id="topPageTitle">داشبورد</h1>
        </div>
        <div class="topbar-left">
          <div class="clock-card">
            <span class="clock-time" id="liveClock">00:00:00</span>
            <span class="clock-date" id="liveDate">در حال بارگذاری...</span>
          </div>
          <span class="top-pill live"><span class="dot-online"></span>زنده</span>
          <button type="button" class="top-pill accent" onclick="switchView('users'); openUserModal(null);">${ICON('plus')} کاربر جدید</button>
          <button type="button" class="top-pill" onclick="initD1Database()" title="بررسی دیتابیس D1">${ICON('shield')} D1</button>
          <button type="button" class="top-pill" onclick="refreshAllData()" title="بروزرسانی">${ICON('refresh')}</button>
          <a class="top-pill" href="${SUPPORT_CHANNEL_URL}" target="_blank" rel="noopener noreferrer" title="${SUPPORT_CHANNEL_LABEL}">${ICON('link')}</a>
          <a class="top-pill" href="/admin/logout" title="خروج از حساب">${ICON('logout')}</a>
        </div>
      </header>

      <!-- ==================== ۱. نمای داشبورد ==================== -->
      <section id="view-dashboard" class="view-section active">
        <div class="hero-card">
          <div class="hero-content">
            <div class="hero-eyebrow">REAL-TIME NETWORK CONTROL</div>
            <div class="hero-heading">مرکز کنترل زیرساخت پروکسی ${BRAND_NAME} روی Cloudflare</div>
            <p class="hero-sub">
              کاربران دیتابیس D1، نودهای Cloudflare، هسته VLESS / Trojan / xhttp و سابلینک‌ها را با نام‌گذاری اختصاصی <strong>number+${BRAND_NAME}</strong> زنده و از یک‌جا مدیریت کنید.
            </p>
            <div class="hero-badges">
              <span class="hero-badge" id="hbUsers">👥 0 کاربر · 0 فعال</span>
              <span class="hero-badge" id="hbNodes">📦 نودهای خروجی: number+${BRAND_NAME}</span>
              <span class="hero-badge" id="hbReqs">⚡ 0 درخواست ثبت‌شده</span>
              <span class="hero-badge" id="hbD1">🛡️ دیتابیس D1 آماده</span>
              <span class="hero-badge" id="hbUptime">🕒 آپ‌تایم 1 دقیقه</span>
            </div>
          </div>
          <div class="hero-emblem">M</div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-top"><span class="metric-label">کل کاربران</span><span class="metric-icon">👥</span></div>
            <div class="metric-value" id="mTotalUsers">0</div>
            <div class="metric-foot" id="mUsersSub">0 فعال · 0 غیرفعال</div>
          </div>
          <div class="metric-card">
            <div class="metric-top"><span class="metric-label">مصرف کل</span><span class="metric-icon">📈</span></div>
            <div class="metric-value" id="mTotalTraffic">0 B</div>
            <div class="metric-foot" id="mLifetimeTraffic">مجموع عمر: 0 B</div>
          </div>
          <div class="metric-card">
            <div class="metric-top"><span class="metric-label">نودهای فعال</span><span class="metric-icon">📦</span></div>
            <div class="metric-value" id="mActiveNodes">31</div>
            <div class="metric-foot">فرمت خروجی: 1+${BRAND_NAME}</div>
          </div>
          <div class="metric-card">
            <div class="metric-top"><span class="metric-label">IP سالم Cloudflare</span><span class="metric-icon">🌐</span></div>
            <div class="metric-value" id="mHealthyIps">31</div>
            <div class="metric-foot">دامنه ترجیحی + استخر مستقیم CF</div>
          </div>
          <div class="metric-card">
            <div class="metric-top"><span class="metric-label">درخواست‌ها</span><span class="metric-icon">⚡</span></div>
            <div class="metric-value" id="mTotalReqs">0</div>
            <div class="metric-foot">ثبت‌شده در دیتابیس D1</div>
          </div>
          <div class="metric-card">
            <div class="metric-top"><span class="metric-label">آپ‌تایم سرویس</span><span class="metric-icon">🕒</span></div>
            <div class="metric-value" id="mUptime">آنلاین</div>
            <div class="metric-foot">Cloudflare Edge Global</div>
          </div>
        </div>

        <div class="dash-row-2">
          <div class="panel-card">
            <div class="panel-head">
              <div>
                <div class="panel-title">ترافیک شبکه و وضعیت کاربران</div>
                <div class="panel-sub">حجم عبوری و سابلینک‌های فعال روی لبه کلودفلر</div>
              </div>
              <span class="top-pill live">۲۴ ساعت</span>
            </div>
            <div id="dashTrafficSummary" style="padding:26px 12px;text-align:center;color:var(--muted);font-size:0.86rem;">
              آمار زنده کاربران و درخواست‌ها به صورت خودکار از دیتابیس D1 همگام‌سازی می‌شود.
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-head">
              <div>
                <div class="panel-title">ترکیب زیرساخت</div>
                <div class="panel-sub">پروتکل کاربران و نوع نودها</div>
              </div>
            </div>
            <div class="donut-wrap">
              <div class="donut-ring fx-ring fx-ring-pulse" id="donutRing" style="--fx-p:0.35">
                <div style="font-size:1.3rem;font-weight:900;color:#fff;" id="donutCenterCount">31</div>
                <div style="font-size:0.72rem;color:var(--muted);">نود در کاتالوگ</div>
              </div>
              <div style="font-size:0.78rem;color:var(--neon);margin-top:10px;">● نام‌گذاری: number+${BRAND_NAME}</div>
            </div>
          </div>
        </div>

        <div class="dash-row-3">
          <div class="panel-card">
            <div class="panel-head">
              <div><div class="panel-title">هسته پروکسی</div><div class="panel-sub">Cloudflare Worker + D1</div></div>
              <span class="top-pill live">● در حال اجرا</span>
            </div>
            <div class="kv-list">
              <div class="kv-row"><span class="kv-key">وضعیت هسته</span><span class="kv-val">Running (Zero Error 1101)</span></div>
              <div class="kv-row"><span class="kv-key">پروتکل‌ها</span><span class="kv-val" id="coreProtosVal">VLESS / TROJAN / XHTTP</span></div>
              <div class="kv-row"><span class="kv-key">ترنسپورت</span><span class="kv-val">WebSocket + xhttp + ECH</span></div>
              <div class="kv-row"><span class="kv-key">فرمت نودها</span><span class="kv-val">1+${BRAND_NAME}, 2+${BRAND_NAME}...</span></div>
              <div class="kv-row"><span class="kv-key">دیتابیس</span><span class="kv-val" id="coreDbMode">Cloudflare D1</span></div>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-head">
              <div><div class="panel-title">پرمصرف‌ترین کاربران</div><div class="panel-sub">بر اساس حجم مصرفی</div></div>
            </div>
            <div id="topUsersList" class="kv-list"></div>
          </div>

          <div class="panel-card">
            <div class="panel-head">
              <div><div class="panel-title">وضعیت Cloudflare و D1</div><div class="panel-sub">Worker و IPهای سالم</div></div>
            </div>
            <div class="kv-list">
              <div class="kv-row"><span class="kv-key">منطقه لبه (wk)</span><span class="kv-val" id="cfEdgeRegion">CF Direct</span></div>
              <div class="kv-row"><span class="kv-key">آدرس Worker</span><span class="kv-val" id="cfWorkerHost">-</span></div>
              <div class="kv-row"><span class="kv-key">وضعیت D1</span><span class="kv-val" id="cfD1Status">متصل و آماده</span></div>
              <div class="kv-row"><span class="kv-key">پروکسی خروجی (s)</span><span class="kv-val" id="cfOutboundProxy">مستقیم</span></div>
            </div>
          </div>
        </div>

        <div class="dash-row-bottom">
          <div class="panel-card">
            <div class="panel-head">
              <div><div class="panel-title">آخرین رویدادها</div><div class="panel-sub">گزارش مدیریتی D1</div></div>
            </div>
            <div id="auditLogsList" class="kv-list"></div>
          </div>
          <div class="panel-card">
            <div class="panel-head">
              <div><div class="panel-title">دسترسی سریع مدیر</div><div class="panel-sub">مدیریت کاربران و سابلینک اصلی</div></div>
            </div>
            <div class="kv-list">
              <button type="button" class="btn-neon" style="width:100%;justify-content:center;" onclick="switchView('users'); openUserModal(null);">
                + ساخت کاربر جدید (با تمام تنظیمات پیش‌فرض کد + نام کاربر)
              </button>
              <button type="button" class="btn-ghost" style="width:100%;justify-content:center;" onclick="copyMainAdminSub()">
                📋 کپی ساب‌لینک اصلی مدیر (1+${BRAND_NAME} ...)
              </button>
              <a class="btn-ghost" style="width:100%;justify-content:center;" href="${SUPPORT_CHANNEL_URL}" target="_blank" rel="noopener noreferrer">
                🔗 ${SUPPORT_CHANNEL_LABEL}
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== ۲. نمای کاربران (مطابق 1000050137.jpg) ==================== -->
      <section id="view-users" class="view-section">
        <div class="panel-card">
          <div class="panel-head">
            <div>
              <div class="panel-title">کاربران</div>
              <div class="panel-sub">ساخت پیشرفته، مصرف، سهمیه، تعداد نود در ساب و صفحه وضعیت اختصاصی هر کاربر</div>
            </div>
            <button type="button" class="btn-neon" onclick="openUserModal(null)">+ کاربر جدید (پیشرفته)</button>
          </div>

          <!-- ساخت سریع کاربر مطابق تصویر 1000050137.jpg -->
          <div style="border-top:1px solid var(--border);padding-top:14px;margin-top:8px;">
            <div style="font-size:0.92rem;font-weight:800;color:#fff;">ساخت سریع کاربر — حالت را انتخاب کنید</div>
            <div style="font-size:0.76rem;color:var(--muted);margin-bottom:12px;">
              هر کارت یک پریست واقعی + تمام تنظیمات پیش‌فرض کد پایه است؛ صفحه وضعیت و لینک همه کلاینت‌ها با نام‌گذاری <strong>number+${BRAND_NAME}</strong> همان لحظه ساخته می‌شود.
            </div>

            <div class="quick-bar">
              <input type="text" id="quickUsername" class="mili-input" placeholder="نام کاربری (مثلاً ali یا خالی = خودکار)" style="flex:1 1 200px;min-width:0;" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
              <div style="display:flex;align-items:center;gap:6px;">
                <label style="font-size:0.78rem;color:var(--muted);">تعداد نود در ساب:</label>
                <input type="number" id="quickSubNodeCount" class="mili-input" value="50" min="0" max="500" style="width:88px;text-align:center;">
              </div>
              <label class="check-label" style="background:var(--card-2);padding:8px 12px;border-radius:12px;border:1px solid var(--border);">
                <input type="checkbox" id="quickUsePanelDefaults" checked>
                <span>پیش‌فرض پنل</span>
              </label>
              <button type="button" class="btn-neon" onclick="quickCreateUser()">✦ ساخت همین حالت</button>
            </div>

            <div class="preset-grid" id="presetCardsContainer"></div>
          </div>

          <!-- فیلتر و جستجوی کاربران -->
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:14px;padding-top:12px;border-top:1px solid var(--border);">
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button type="button" class="btn-ghost active" onclick="setFilterStatus('all')">همه</button>
              <button type="button" class="btn-ghost" onclick="setFilterStatus('active')">فعال</button>
              <button type="button" class="btn-ghost" onclick="setFilterStatus('disabled')">غیرفعال</button>
            </div>
            <input type="text" id="userSearchInput" class="mili-input" placeholder="🔍 جستجوی نام کاربر یا UUID..." oninput="renderUsersGrid()" style="flex:1 1 220px;min-width:0;" autocomplete="off" autocapitalize="off" spellcheck="false">
          </div>

          <!-- لیست کارت‌های کاربران -->
          <div class="users-grid" id="usersGridContainer"></div>
        </div>
      </section>

      <!-- ==================== ۳. نمای نودها و تست تاخیر ==================== -->
      <section id="view-nodes" class="view-section">
        <div class="panel-card">
          <div class="panel-head">
            <div>
              <div class="panel-title">مدیریت نودهای ترجیحی و تست تاخیر داخلی</div>
              <div class="panel-sub">تمامی نودها در خروجی کلاینت‌ها به صورت خودکار با نام 1+${BRAND_NAME}، 2+${BRAND_NAME} و ... نام‌گذاری می‌شوند</div>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="field-box">
              <label class="field-label">لیست IP / دامنه ترجیحی سفارشی (yx):</label>
              <textarea id="cfg_yx" class="mili-textarea" rows="4" placeholder="104.16.1.1:443#Node1,188.114.98.10:443#Node2" style="direction:ltr;"></textarea>
              <span class="field-hint">فرمت: IP:Port#Name با کاما جدا شوند. آدرس نودها همیشه آی‌پی واقعی است و در خروجی ساب با فرمت number+${BRAND_NAME} شماره‌گذاری می‌شوند.</span>
            </div>
            <div class="field-box">
              <label class="field-label">آدرس URL منبع IP ترجیحی (yxURL):</label>
              <input type="text" id="cfg_yxURL" class="mili-input" placeholder="https://example.com/ips.txt" style="direction:ltr;">
              <label class="field-label" style="margin-top:8px;">تعداد پیش‌فرض نودها در ساب‌لینک (subNodeCount):</label>
              <input type="number" id="cfg_subNodeCount" class="mili-input" value="50" min="0" max="500">
            </div>
          </div>

          <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;">
            <button type="button" class="btn-neon" onclick="savePanelSettings()">▣ ذخیره تنظیمات نودها</button>
          </div>

          <div class="modal-sec-title" style="margin-top:18px;">اسکنر داخلی آی‌پی (معادل cfnew) — تست واقعی TCP بدون دامنه</div>
          <div class="form-grid-3">
            <div class="field-box">
              <label class="field-label">حالت اسکن:</label>
              <select id="scanMode" class="mili-select">
                <option value="v4">IPv4 — لبه کلودفلر</option>
                <option value="v6">IPv6 — همراه اول / ایرانسل</option>
              </select>
            </div>
            <div class="field-box">
              <label class="field-label">تعداد کاندید (حداکثر ۶۰):</label>
              <input type="number" id="scanCount" class="mili-input" value="16" min="1" max="60">
            </div>
            <div class="field-box">
              <label class="field-label">پورت و تایم‌اوت (ms):</label>
              <div style="display:flex;gap:8px;">
                <input type="number" id="scanPort" class="mili-input" value="443" min="1" max="65535">
                <input type="number" id="scanTimeout" class="mili-input" value="2500" min="500" max="10000">
              </div>
            </div>
          </div>
          <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap;">
            <button type="button" class="btn-neon" onclick="runIpScan(false)">🔍 اسکن واقعی آی‌پی‌ها</button>
            <button type="button" class="btn-ghost" onclick="runIpScan(true)">💾 اسکن + ذخیره سالم‌ها در لیست ترجیحی</button>
            <button type="button" class="btn-ghost" onclick="resolveYxDomains()">🌐 تبدیل دامنه‌های yx به آی‌پی ثابت</button>
          </div>

          <span class="field-hint" style="display:block;margin-top:8px;">
            توجه: اسکن از داخل Worker انجام می‌شود و کلودفلر اجازهٔ اتصال به برخی آی‌پی‌های لبهٔ خودش را نمی‌دهد (خطای Stream was cancelled).
            برای اعتبارسنجی کامل از دستور <code>npm run scan</code> روی سیستم خودتان استفاده کنید.
          </span>

          <div id="scanResultsBox" class="kv-list" style="margin-top:14px;"></div>
        </div>
      </section>

      <!-- ==================== ۴. نمای شبکه و لبه ==================== -->
      <section id="view-network" class="view-section">
        <div class="panel-card">
          <div class="panel-head">
            <div>
              <div class="panel-title">پیکربندی پروتکل‌ها، منطقه، پروکسی خروجی و ECH</div>
              <div class="panel-sub">تمامی تنظیمات پیش‌فرض کد اصلی CFnew v3.1 (اعمال فوری بدون نیاز به استقرار مجدد)</div>
            </div>
            <button type="button" class="btn-neon" onclick="savePanelSettings()">▣ ذخیره تنظیمات شبکه</button>
          </div>

          <div class="modal-sec-title">۱. انتخاب پروتکل‌های فعال</div>
          <div class="check-grid">
            <label class="check-label"><input type="checkbox" id="cfg_ev" checked> <span>فعال‌سازی VLESS (ev)</span></label>
            <label class="check-label"><input type="checkbox" id="cfg_et"> <span>فعال‌سازی Trojan (et)</span></label>
            <label class="check-label"><input type="checkbox" id="cfg_ex"> <span>فعال‌سازی xhttp (ex)</span></label>
            <label class="check-label"><input type="checkbox" id="cfg_ss"> <span>فعال‌سازی Shadowsocks (ss)</span></label>
            <label class="check-label"><input type="checkbox" id="cfg_ech"> <span>فعال‌سازی ECH (ech)</span></label>
            <label class="check-label"><input type="checkbox" id="cfg_jk"> <span>زنجیره اینترنت خانگی (jk)</span></label>
          </div>

          <div class="modal-sec-title">۱.۵ رمزنگاری Shadowsocks (AEAD)</div>
          <div class="form-grid-3">
            <div class="field-box">
              <label class="field-label">روش رمزنگاری (ssc):</label>
              <select id="cfg_ssc" class="mili-select">
                <option value="chacha20-ietf-poly1305">chacha20-ietf-poly1305 (پیشنهادی)</option>
                <option value="aes-256-gcm">aes-256-gcm</option>
                <option value="aes-128-gcm">aes-128-gcm</option>
                <option value="all">همه سه روش (سه نود برای هر آدرس)</option>
              </select>
              <span class="field-hint">می‌توانید چند روش را با کاما بنویسید: <code>aes-256-gcm,chacha20-ietf-poly1305</code></span>
            </div>
            <div class="field-box">
              <label class="field-label">رمز عبور Shadowsocks (ssp):</label>
              <input type="text" id="cfg_ssp" class="mili-input" placeholder="خالی = UUID همان کاربر" style="direction:ltr;">
              <span class="field-hint">لینک‌ها با فرمت SIP002 و plugin=v2ray-plugin ساخته می‌شوند.</span>
            </div>
          </div>

          <div class="modal-sec-title">۲. تنظیمات منطقه، ProxyIP و پروکسی خروجی (SOCKS5 / HTTP / HTTPS)</div>
          <div class="form-grid-3">
            <div class="field-box">
              <label class="field-label">تعیین منطقه (wk):</label>
              <select id="cfg_wk" class="mili-select">
                <option value="">🌐 اتصال مستقیم رسمی (پیش‌فرض)</option>
                <option value="HK">🇭🇰 هنگ‌کنگ (HK)</option>
                <option value="SG">🇸🇬 سنگاپور (SG)</option>
                <option value="JP">🇯🇵 ژاپن (JP)</option>
                <option value="US">🇺🇸 آمریکا (US)</option>
                <option value="KR">🇰🇷 کره‌جنوبی (KR)</option>
                <option value="DE">🇩🇪 آلمان (DE)</option>
                <option value="SE">🇸🇪 سوئد (SE)</option>
                <option value="NL">🇳🇱 هلند (NL)</option>
                <option value="FI">🇫🇮 فنلاند (FI)</option>
                <option value="GB">🇬🇧 بریتانیا (GB)</option>
              </select>
            </div>
            <div class="field-box">
              <label class="field-label">ProxyIP سفارشی (p):</label>
              <input type="text" id="cfg_p" class="mili-input" placeholder="ProxyIP.DE.CMLiussss.net:443" style="direction:ltr;">
            </div>
            <div class="field-box">
              <label class="field-label">پروکسی خروجی SOCKS5/HTTP (s):</label>
              <input type="text" id="cfg_s" class="mili-input" placeholder="user:pass@host:port یا http://..." style="direction:ltr;">
            </div>
            <div class="field-box">
              <label class="field-label">روش خروج (qj):</label>
              <select id="cfg_qj" class="mili-select">
                <option value="">اولویت با پروکسی (پیش‌فرض)</option>
                <option value="no">اولویت با اتصال مستقیم، در صورت خطا پروکسی (no)</option>
                <option value="only">فقط پروکسی، بدون بازگشت به مستقیم (only)</option>
              </select>
            </div>
            <div class="field-box">
              <label class="field-label">رمز عبور سفارشی Trojan (tp):</label>
              <input type="text" id="cfg_tp" class="mili-input" placeholder="خالی = استفاده از UUID" style="direction:ltr;">
            </div>
            <div class="field-box">
              <label class="field-label">TLS ALPN (alpn):</label>
              <select id="cfg_alpn" class="mili-select">
                <option value="">پیش‌فرض (خالی)</option>
                <option value="h3">h3</option>
                <option value="h2">h2</option>
                <option value="http/1.1">http/1.1</option>
                <option value="h3,h2">h3,h2</option>
                <option value="h2,http/1.1">h2,http/1.1</option>
                <option value="h3,h2,http/1.1">h3,h2,http/1.1</option>
              </select>
            </div>
            <div class="field-box">
              <label class="field-label">سرور DNS سفارشی (customDNS):</label>
              <input type="text" id="cfg_customDNS" class="mili-input" value="https://223.5.5.5/dns-query" style="direction:ltr;">
            </div>
            <div class="field-box">
              <label class="field-label">دامنه ECH سفارشی (customECHDomain):</label>
              <input type="text" id="cfg_customECHDomain" class="mili-input" value="cloudflare-ech.com" style="direction:ltr;">
            </div>
            <div class="field-box">
              <label class="field-label">کنترل TLS (dkby):</label>
              <select id="cfg_dkby" class="mili-select">
                <option value="no">پیش‌فرض (حفظ همه گره‌ها)</option>
                <option value="yes">فقط گره‌های TLS (yes)</option>
              </select>
            </div>
            <div class="field-box">
              <label class="field-label">تطبیق هوشمند منطقه (rm):</label>
              <select id="cfg_rm" class="mili-select">
                <option value="">فعال (پیش‌فرض)</option>
                <option value="no">غیرفعال (no)</option>
              </select>
            </div>
            <div class="field-box">
              <label class="field-label">کنترل ترجیحی (yxby):</label>
              <select id="cfg_yxby" class="mili-select">
                <option value="">فعال (پیش‌فرض)</option>
                <option value="yes">بستن همه ترجیحات (yes)</option>
              </select>
            </div>
            <div class="field-box">
              <label class="field-label">لوکیشن‌های واقعی (locs):</label>
              <input type="text" id="cfg_locs" class="mili-input" placeholder="all یا DE,NL,GB,FR" style="direction:ltr;">
              <span class="field-hint">all = هر ۱۶ لوکیشن با آی‌پی ثابت · no = بدون نود لوکیشن</span>
            </div>
            <div class="field-box">
              <label class="field-label">خروجی ثابت هر نود (pm):</label>
              <select id="cfg_pm" class="mili-select">
                <option value="">غیرفعال — مسیر مستقیم</option>
                <option value="yes">فعال — ترافیک TLS از خروجی ثابت همان لوکیشن</option>
                <option value="only">فقط خروجی ثابت (بدون بازگشت به مستقیم)</option>
              </select>
              <span class="field-hint">این خروجی برای مقاصد میزبانی‌شده روی کلودفلر (Discord و ...) تضمینی است. برای Gemini/OpenAI که روی کلودفلر نیستند باید پروکسی خروجی (s) مثل WARP را تنظیم و روش خروج را only کنید.</span>
            </div>
          </div>

          <div class="modal-sec-title">۲.۵ استخر پروکسی تفکیک‌شده کشور، پینگ واقعی و مولتی‌لوکیشن رندوم</div>
          <div class="pool-picker">
            <div class="pool-picker-head">
              <div class="pool-picker-select">
                <label class="field-label">کشور پروکسی خروجی (s):</label>
                <select id="proxyCountrySelect" class="mili-select" onchange="onProxyCountryChange()">
                  <option value="">— در حال بارگذاری استخر —</option>
                </select>
              </div>
              <button type="button" class="btn-ghost" onclick="loadCountryProxies(false)">📡 نمایش لیست</button>
              <button type="button" class="btn-neon" onclick="loadCountryProxies(true)">⚡ لیست + پینگ واقعی</button>
              <button type="button" class="btn-ghost" onclick="autoRandomMultiLocation()">🎲 ساخت خودکار مولتی‌لوکیشن رندوم</button>
            </div>
            <div class="pool-picker-meta" id="proxyPoolMeta">استخر سالم پروکسی‌ها در حال بارگذاری است…</div>
            <div class="kv-list" id="sProxyList"></div>
            <div class="pool-node-settings">
              <label class="check-label"><input type="checkbox" id="cfg_cpx"> <span>افزودن نودهای کشوری به ساب (cpx)</span></label>
              <div class="field-box" style="flex:1 1 200px;min-width:0;">
                <label class="field-label">کشورهای نودها (pcc):</label>
                <input type="text" id="cfg_pcc" class="mili-input" placeholder="all یا DE,US,NL" style="direction:ltr;">
              </div>
              <div class="field-box">
                <label class="field-label">تعداد نود کشوری (cpn):</label>
                <input type="number" id="cfg_cpn" class="mili-input" value="24" min="1" max="200" style="width:110px;">
              </div>
            </div>
            <div class="pool-picker-meta">
              هر نود کشوری، آدرس لبه‌ی کلودفلر را با پروکسی خروجی همان کشور در مسیر ساب ترکیب می‌کند
              (<code style="direction:ltr;">?s=socks5://ip:port</code>) تا مقاصدی که روی کلودفلر نیستند هم کار کنند.
            </div>
          </div>

          <div class="modal-sec-title">۳. منابع نود ترجیحی داخلی و فیلتر اپراتور</div>
          <div class="check-grid">
            <label class="check-label"><input type="checkbox" id="cfg_epd" checked> <span>فعال‌سازی دامنه ترجیحی (epd)</span></label>
            <label class="check-label"><input type="checkbox" id="cfg_epi" checked> <span>فعال‌سازی IP ترجیحی (epi)</span></label>
            <label class="check-label"><input type="checkbox" id="cfg_egi" checked> <span>فعال‌سازی ترجیح سفارشی (egi)</span></label>
            <label class="check-label"><input type="checkbox" id="cfg_ena"> <span>فعال‌سازی آدرس اصلی (ena)</span></label>
            <label class="check-label"><input type="checkbox" id="cfg_ipv4" checked> <span>IPv4</span></label>
            <label class="check-label"><input type="checkbox" id="cfg_ipv6" checked> <span>IPv6</span></label>
            <label class="check-label"><input type="checkbox" id="cfg_ispMobile" checked> <span>همراه (ispMobile)</span></label>
            <label class="check-label"><input type="checkbox" id="cfg_ispUnicom" checked> <span>Unicom (ispUnicom)</span></label>
            <label class="check-label"><input type="checkbox" id="cfg_ispTelecom" checked> <span>مخابرات/Telecom (ispTelecom)</span></label>
          </div>
        </div>
      </section>

      <!-- ==================== ۵. نمای پنل و ظاهر ==================== -->
      <section id="view-panel" class="view-section">
        <div class="panel-card">
          <div class="panel-head">
            <div>
              <div class="panel-title">تنظیمات مسیر سفارشی، صفحه اصلی و مبدل اشتراک</div>
              <div class="panel-sub">مدیریت آدرس پنل و ظاهر درگاه</div>
            </div>
            <button type="button" class="btn-neon" onclick="savePanelSettings()">▣ ذخیره تنظیمات پنل</button>
          </div>
          <div class="form-grid-2">
            <div class="field-box">
              <label class="field-label">مسیر سفارشی مدیر (d):</label>
              <input type="text" id="cfg_d" class="mili-input" placeholder="/mypath" style="direction:ltr;">
              <span class="field-hint">در صورت تنظیم، دسترسی به پنل از طریق /{مسیر سفارشی} انجام می‌شود.</span>
            </div>
            <div class="field-box">
              <label class="field-label">آدرس صفحه اصلی سفارشی جهت استتار (homepage):</label>
              <input type="text" id="cfg_homepage" class="mili-input" placeholder="https://example.com" style="direction:ltr;">
            </div>
            <div class="field-box">
              <label class="field-label">آدرس تبدیل اشتراک (scu):</label>
              <input type="text" id="cfg_scu" class="mili-input" value="https://url.v1.mk/sub" style="direction:ltr;">
            </div>
            <div class="field-box">
              <label class="field-label">اجازه مدیریت API خارجی (ae):</label>
              <select id="cfg_ae" class="mili-select">
                <option value="">غیرفعال (پیش‌فرض)</option>
                <option value="yes">فعال (yes)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== ۶. نمای سیستم و دیتابیس D1 ==================== -->
      <section id="view-system" class="view-section">
        <div class="panel-card">
          <div class="panel-head">
            <div>
              <div class="panel-title">وضعیت دیتابیس Cloudflare D1 و مدیریت سیستم</div>
              <div class="panel-sub">مجهز به Auto-Migration خودکار و محافظ ضد خطای 1101 در استقرار دستی و گیت‌هاب</div>
            </div>
          </div>
          <div class="kv-list" style="margin-bottom:16px;">
            <div class="kv-row"><span class="kv-key">وضعیت دیتابیس D1</span><span class="kv-val" id="sysD1State">در حال بررسی...</span></div>
            <div class="kv-row"><span class="kv-key">نام متغیر اتصال D1</span><span class="kv-val" id="sysD1Binding">DB (تشخیص خودکار هر نامی)</span></div>
            <div class="kv-row"><span class="kv-key">وضعیت فضای KV</span><span class="kv-val" id="sysKvState">-</span></div>
            <div class="kv-row"><span class="kv-key">فرمت نام‌گذاری نودهای کلاینت</span><span class="kv-val">number+${BRAND_NAME} (1+${BRAND_NAME}, 2+${BRAND_NAME}...)</span></div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button type="button" class="btn-neon" onclick="initD1Database()">🛠️ ساخت و بررسی خودکار جداول D1</button>
            <button type="button" class="btn-ghost btn-danger" onclick="resetAllPanelSettings()">⌫ بازنشانی همه تنظیمات به پیش‌فرض</button>
          </div>
        </div>
      </section>
    </main>
  </div>

  <!-- ناوبری موبایل فقط با منوی کشویی (بدون تب پایین) -->

  <!-- ==================== مودال ساخت / ویرایش کاربر (شامل نام کاربر + تعداد نود در ساب + تمام ۳۱ تنظیم پیش‌فرض کد) ==================== -->
  <div id="userModalBackdrop" class="modal-backdrop">
    <div class="modal-box">
      <div class="panel-head">
        <div>
          <div class="panel-title" id="userModalTitle">ساخت کاربر جدید (${BRAND_NAME})</div>
          <div class="panel-sub">شامل نام کاربر، تعداد نودها در ساب و تمام ۳۱ تنظیم پیش‌فرض کد پایه</div>
        </div>
        <button type="button" class="btn-ghost" onclick="closeUserModal()">✕ بستن</button>
      </div>

      <input type="hidden" id="um_id" value="">

      <div class="modal-sec-title">۱. مشخصات کاربر، سهمیه و تعداد نودها در ساب</div>
      <div class="form-grid-3">
        <div class="field-box">
          <label class="field-label">نام کاربر (Username):</label>
          <input type="text" id="um_username" class="mili-input" placeholder="مثلاً ali-mili">
        </div>
        <div class="field-box">
          <label class="field-label">تعداد نودها در ساب (Sub Node Count):</label>
          <input type="number" id="um_subNodeCount" class="mili-input" value="50" min="0" max="500">
          <span class="field-hint">خروجی: 1+${BRAND_NAME} تا N+${BRAND_NAME} (0 = همه نودها)</span>
        </div>
        <div class="field-box">
          <label class="field-label">شناسه یکتا (UUID):</label>
          <div style="display:flex;gap:6px;">
            <input type="text" id="um_uuid" class="mili-input" style="flex:1;min-width:0;direction:ltr;" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
            <button type="button" class="btn-ghost" onclick="regenModalUuid()" title="تولید UUID جدید">🎲</button>
          </div>
        </div>
        <div class="field-box">
          <label class="field-label">حجم مجاز به گیگابایت (0 = نامحدود):</label>
          <input type="number" id="um_dataLimitGb" class="mili-input" value="0" min="0" step="0.5">
        </div>
        <div class="field-box">
          <label class="field-label">مدت اعتبار به روز (0 = بدون انقضا):</label>
          <input type="number" id="um_expireDays" class="mili-input" value="0" min="0">
        </div>
        <div class="field-box">
          <label class="field-label">سقف دستگاه / IP همزمان:</label>
          <input type="number" id="um_ipLimit" class="mili-input" value="50" min="1">
        </div>
        <div class="field-box">
          <label class="field-label">پریست پایه:</label>
          <select id="um_preset" class="mili-select">
            <option value="iran-fast">ایران — پرسرعت (پیشنهادی)</option>
            <option value="iran-heavy">ایران — مصرف سنگین (نامحدود)</option>
            <option value="international">بین‌المللی — بدون فرگمنت</option>
            <option value="multi-location">چند لوکیشن — فقط نودهای لبه</option>
            <option value="direct-only">فقط سرور اصلی (بدون CDN)</option>
          </select>
        </div>
        <div class="field-box">
          <label class="field-label">محدوده نودها:</label>
          <select id="um_nodeScope" class="mili-select">
            <option value="all">همه نودها</option>
            <option value="edge">فقط نودهای لبه CDN</option>
            <option value="origin">فقط سرور اصلی</option>
          </select>
        </div>
        <div class="field-box" style="justify-content:center;">
          <label class="check-label"><input type="checkbox" id="um_enabled" checked> <span>حساب کاربری فعال باشد</span></label>
          <label class="check-label"><input type="checkbox" id="um_startOnFirstUse" checked> <span>شروع انقضا با اولین اتصال</span></label>
        </div>
      </div>

      <div class="modal-sec-title">۲. تنظیمات پروتکل و امنیت کاربر (پیش‌فرض‌های کد پایه)</div>
      <div class="check-grid">
        <label class="check-label"><input type="checkbox" id="um_ev" checked> <span>پروتکل VLESS (ev)</span></label>
        <label class="check-label"><input type="checkbox" id="um_et"> <span>پروتکل Trojan (et)</span></label>
        <label class="check-label"><input type="checkbox" id="um_ex"> <span>پروتکل xhttp (ex)</span></label>
        <label class="check-label"><input type="checkbox" id="um_ss"> <span>پروتکل Shadowsocks (ss)</span></label>
        <label class="check-label"><input type="checkbox" id="um_ech"> <span>فعال‌سازی ECH (ech)</span></label>
        <label class="check-label"><input type="checkbox" id="um_jk"> <span>زنجیره اینترنت خانگی (jk)</span></label>
      </div>

      <div class="form-grid-3">
        <div class="field-box">
          <label class="field-label">رمزنگاری Shadowsocks (ssc):</label>
          <select id="um_ssc" class="mili-select">
            <option value="chacha20-ietf-poly1305">chacha20-ietf-poly1305</option>
            <option value="aes-256-gcm">aes-256-gcm</option>
            <option value="aes-128-gcm">aes-128-gcm</option>
            <option value="all">همه سه روش</option>
          </select>
        </div>
        <div class="field-box">
          <label class="field-label">رمز Shadowsocks (ssp):</label>
          <input type="text" id="um_ssp" class="mili-input" placeholder="خالی = UUID همین کاربر" style="direction:ltr;">
        </div>
      </div>

      <div class="modal-sec-title">۳. تنظیمات شبکه، منطقه، پروکسی و ترجیحات کاربر (تمام متغیرهای کد پایه)</div>
      <div class="form-grid-3">
        <div class="field-box">
          <label class="field-label">منطقه Worker (wk):</label>
          <select id="um_wk" class="mili-select">
            <option value="">اتصال مستقیم رسمی (پیش‌فرض)</option>
            <option value="HK">🇭🇰 هنگ‌کنگ (HK)</option>
            <option value="SG">🇸🇬 سنگاپور (SG)</option>
            <option value="JP">🇯🇵 ژاپن (JP)</option>
            <option value="US">🇺🇸 آمریکا (US)</option>
            <option value="KR">🇰🇷 کره‌جنوبی (KR)</option>
            <option value="DE">🇩🇪 آلمان (DE)</option>
            <option value="SE">🇸🇪 سوئد (SE)</option>
            <option value="NL">🇳🇱 هلند (NL)</option>
            <option value="FI">🇫🇮 فنلاند (FI)</option>
            <option value="GB">🇬🇧 بریتانیا (GB)</option>
          </select>
        </div>
        <div class="field-box">
          <label class="field-label">آدرس ProxyIP سفارشی (p):</label>
          <input type="text" id="um_p" class="mili-input" style="direction:ltr;">
        </div>
        <div class="field-box">
          <label class="field-label">پروکسی SOCKS5/HTTP (s):</label>
          <input type="text" id="um_s" class="mili-input" style="direction:ltr;">
        </div>
        <div class="field-box">
          <label class="field-label">انتخاب پروکسی از استخر کشوری:</label>
          <div style="display:flex;gap:6px;align-items:center;">
            <select id="um_scc" class="mili-select" style="flex:1;min-width:0;">
              <option value="">— انتخاب کشور —</option>
            </select>
            <button type="button" class="btn-ghost" onclick="applyUserCountryProxy()">انتخاب</button>
          </div>
        </div>
        <div class="field-box">
          <label class="field-label">روش خروج (qj):</label>
          <select id="um_qj" class="mili-select">
            <option value="">اولویت با پروکسی (پیش‌فرض)</option>
            <option value="no">اولویت با اتصال مستقیم (no)</option>
            <option value="only">فقط پروکسی (only)</option>
          </select>
        </div>
        <div class="field-box">
          <label class="field-label">رمز عبور سفارشی Trojan (tp):</label>
          <input type="text" id="um_tp" class="mili-input" placeholder="خالی = UUID" style="direction:ltr;">
        </div>
        <div class="field-box">
          <label class="field-label">TLS ALPN (alpn):</label>
          <select id="um_alpn" class="mili-select">
            <option value="">پیش‌فرض (خالی)</option>
            <option value="h3">h3</option>
            <option value="h2">h2</option>
            <option value="http/1.1">http/1.1</option>
            <option value="h3,h2">h3,h2</option>
            <option value="h2,http/1.1">h2,http/1.1</option>
            <option value="h3,h2,http/1.1">h3,h2,http/1.1</option>
          </select>
        </div>
        <div class="field-box">
          <label class="field-label">مسیر سفارشی اختصاصی کاربر (d):</label>
          <input type="text" id="um_d" class="mili-input" placeholder="اختیاری" style="direction:ltr;">
        </div>
        <div class="field-box">
          <label class="field-label">سرور DNS سفارشی (customDNS):</label>
          <input type="text" id="um_customDNS" class="mili-input" value="https://223.5.5.5/dns-query" style="direction:ltr;">
        </div>
        <div class="field-box">
          <label class="field-label">دامنه ECH سفارشی (customECHDomain):</label>
          <input type="text" id="um_customECHDomain" class="mili-input" value="cloudflare-ech.com" style="direction:ltr;">
        </div>
        <div class="field-box">
          <label class="field-label">لیست IP/دامنه ترجیحی کاربر (yx):</label>
          <input type="text" id="um_yx" class="mili-input" placeholder="خالی = استفاده از لیست پنل" style="direction:ltr;">
        </div>
        <div class="field-box">
          <label class="field-label">URL منبع IP ترجیحی (yxURL):</label>
          <input type="text" id="um_yxURL" class="mili-input" style="direction:ltr;">
        </div>
        <div class="field-box">
          <label class="field-label">آدرس تبدیل اشتراک (scu):</label>
          <input type="text" id="um_scu" class="mili-input" value="https://url.v1.mk/sub" style="direction:ltr;">
        </div>
        <div class="field-box">
          <label class="field-label">کنترل TLS (dkby):</label>
          <select id="um_dkby" class="mili-select">
            <option value="no">حفظ همه گره‌ها (no)</option>
            <option value="yes">فقط گره‌های TLS (yes)</option>
          </select>
        </div>
        <div class="field-box">
          <label class="field-label">تطبیق منطقه (rm):</label>
          <select id="um_rm" class="mili-select">
            <option value="">فعال (پیش‌فرض)</option>
            <option value="no">غیرفعال (no)</option>
          </select>
        </div>
        <div class="field-box">
          <label class="field-label">کنترل ترجیحی (yxby):</label>
          <select id="um_yxby" class="mili-select">
            <option value="">فعال (پیش‌فرض)</option>
            <option value="yes">بستن ترجیح (yes)</option>
          </select>
        </div>
        <div class="field-box">
          <label class="field-label">صفحه اصلی سفارشی (homepage):</label>
          <input type="text" id="um_homepage" class="mili-input" style="direction:ltr;">
        </div>
        <div class="field-box">
          <label class="field-label">اجازه مدیریت API (ae):</label>
          <select id="um_ae" class="mili-select">
            <option value="">غیرفعال</option>
            <option value="yes">فعال (yes)</option>
          </select>
        </div>
      </div>

      <div class="check-grid" style="margin-top:12px;">
        <label class="check-label"><input type="checkbox" id="um_epd" checked> <span>دامنه ترجیحی (epd)</span></label>
        <label class="check-label"><input type="checkbox" id="um_epi" checked> <span>IP ترجیحی (epi)</span></label>
        <label class="check-label"><input type="checkbox" id="um_egi" checked> <span>ترجیح سفارشی (egi)</span></label>
        <label class="check-label"><input type="checkbox" id="um_ena"> <span>آدرس اصلی (ena)</span></label>
        <label class="check-label"><input type="checkbox" id="um_ipv4" checked> <span>IPv4</span></label>
        <label class="check-label"><input type="checkbox" id="um_ipv6" checked> <span>IPv6</span></label>
        <label class="check-label"><input type="checkbox" id="um_ispMobile" checked> <span>همراه (ispMobile)</span></label>
        <label class="check-label"><input type="checkbox" id="um_ispUnicom" checked> <span>Unicom (ispUnicom)</span></label>
        <label class="check-label"><input type="checkbox" id="um_ispTelecom" checked> <span>مخابرات (ispTelecom)</span></label>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn-ghost" onclick="closeUserModal()">انصراف</button>
        <button type="button" class="btn-neon" onclick="submitUserModal()">✦ ذخیره کاربر در دیتابیس D1</button>
      </div>
    </div>
  </div>

  <script>
${FX_RUNTIME_JS}
  </script>
  <script>
    var STATE = ${safeInitialJson};
    var SELECTED_PRESET = 'iran-fast';
    var USER_FILTER_STATUS = 'all';

    function getApiBase() {
      var p = window.location.pathname.replace(/\\/+$/g, '');
      return p || '';
    }

    function esc(v) {
      return window.MiliFx ? MiliFx.esc(v) : String(v === undefined || v === null ? '' : v);
    }

    function showToast(msg) {
      if (window.MiliFx) MiliFx.toast(msg);
    }

    function setText(id, value) {
      var el = document.getElementById(id);
      if (el) el.textContent = value;
    }

    // فراخوانی امن API با پیام خطای خوانا (به‌جای شکست بی‌صدا)
    async function apiRequest(path, options) {
      var res = await fetch(getApiBase() + path, options);
      var data = null;
      try { data = await res.json(); } catch (_e) { data = null; }
      if (!res.ok) {
        var message = (data && (data.message || data.error)) || ('خطای سرور (' + res.status + ')');
        throw new Error(message);
      }
      if (!data) throw new Error('پاسخ نامعتبر از سرور');
      return data;
    }

    function formatBytesJs(bytes) {
      var b = Number(bytes) || 0;
      if (b <= 0) return '0 B';
      var u = ['B', 'KB', 'MB', 'GB', 'TB'];
      var i = Math.min(u.length - 1, Math.floor(Math.log(b) / Math.log(1024)));
      var v = b / Math.pow(1024, i);
      return (v >= 100 || i === 0 ? Math.round(v) : v.toFixed(2)) + ' ' + u[i];
    }

    function randomUuidV4() {
      if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    function toggleSidebarDrawer(force) {
      var sidebar = document.querySelector('.sidebar');
      var toggle = document.querySelector('.menu-toggle');
      var scrim = document.getElementById('sbScrim');
      if (!sidebar) return;
      var isPhone = window.matchMedia && window.matchMedia('(max-width: 1024px)').matches;
      var willOpen = typeof force === 'boolean' ? force : !sidebar.classList.contains('drawer-open');
      sidebar.classList.toggle('drawer-open', willOpen);
      if (scrim) scrim.classList.toggle('open', willOpen && !!isPhone);
      document.body.classList.toggle('drawer-lock', willOpen && !!isPhone);
      if (toggle) {
        toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        toggle.innerHTML = willOpen ? '${ICON('x')} بستن' : '${ICON('menu')} منو';
      }
      if (willOpen) {
        var first = sidebar.querySelector('.sb-item, .sb-btn');
        if (first && isPhone) { try { first.focus({ preventScroll: true }); } catch (_e) {} }
      }
    }

    function closeSidebarDrawer() {
      toggleSidebarDrawer(false);
    }

    // بستن خودکار منو وقتی صفحه از حالت موبایل بیرون آمد یا اندازه چرخید
    window.addEventListener('resize', function () {
      if (window.matchMedia && !window.matchMedia('(max-width: 1024px)').matches) {
        var sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.classList.contains('drawer-open')) toggleSidebarDrawer(false);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var openModal = document.getElementById('userModalBackdrop');
      if (openModal && openModal.classList.contains('open')) {
        closeUserModal();
        return;
      }
      closeSidebarDrawer();
    });

    function switchView(viewName, fromHash) {
      var titles = {
        dashboard: 'داشبورد',
        users: 'کاربران',
        nodes: 'نودها و تست تاخیر',
        network: 'شبکه و لبه',
        panel: 'پنل و ظاهر',
        system: 'تنظیمات و دیتابیس D1'
      };
      var target = document.getElementById('view-' + viewName);
      if (!target) viewName = 'dashboard';
      // روی موبایل با انتخاب هر آیتم، منوی کشویی راست بسته می‌شود
      if (window.matchMedia && window.matchMedia('(max-width: 1024px)').matches) closeSidebarDrawer();
      setText('topPageTitle', titles[viewName] || 'داشبورد');
      document.querySelectorAll('.view-section').forEach(function(s) {
        var isActive = s.id === 'view-' + viewName;
        s.classList.toggle('active', isActive);
        if (isActive && window.MiliFx && !fromHash) {
          s.style.animation = 'none';
          void s.offsetWidth;
          s.style.animation = '';
          MiliFx.reveal(s);
        }
      });
      document.querySelectorAll('.sb-item').forEach(function(b) {
        b.classList.toggle('active', b.getAttribute('data-view') === viewName);
      });
      try {
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', '#' + viewName);
        }
      } catch (_e) {}
      closeSidebarDrawer();
    }

    function renderPresets() {
      var container = document.getElementById('presetCardsContainer');
      if (!container) return;
      var html = '';
      Object.values(STATE.presets || {}).forEach(function(p) {
        var sel = p.id === SELECTED_PRESET ? 'selected' : '';
        var tags = (p.badges || []).map(function(t) { return '<span class="preset-tag">' + t + '</span>'; }).join('');
        html += '<div class="preset-card ' + sel + '" onclick="selectPreset(\\'' + p.id + '\\')">' +
          '<div class="preset-title">' + p.title + '</div>' +
          '<div class="preset-sub">' + p.subtitle + '</div>' +
          '<div class="preset-tags">' + tags + '</div>' +
          '</div>';
      });
      container.innerHTML = html;
    }

    function selectPreset(id) {
      SELECTED_PRESET = id;
      var p = (STATE.presets || {})[id];
      if (p && p.subNodeCount) {
        document.getElementById('quickSubNodeCount').value = p.subNodeCount;
      }
      renderPresets();
    }

    function setFilterStatus(st) {
      USER_FILTER_STATUS = st;
      renderUsersGrid();
    }

    function renderUsersGrid() {
      var container = document.getElementById('usersGridContainer');
      if (!container) return;
      var searchEl = document.getElementById('userSearchInput');
      var q = (searchEl && searchEl.value ? searchEl.value : '').trim().toLowerCase();
      var list = (STATE.users || []).filter(function(u) {
        if (USER_FILTER_STATUS === 'active' && !u.enabled) return false;
        if (USER_FILTER_STATUS === 'disabled' && u.enabled) return false;
        if (!q) return true;
        var name = String(u.username || '').toLowerCase();
        var ident = String(u.uuid || '').toLowerCase();
        return name.indexOf(q) !== -1 || ident.indexOf(q) !== -1;
      });

      setText('sbUserCount', String((STATE.users || []).length));

      if (list.length === 0) {
        container.innerHTML = '<div class="empty-state">هیچ کاربری با این فیلتر یافت نشد. با دکمهٔ «+ کاربر جدید» اولین کاربر را بسازید.</div>';
        return;
      }

      var baseOrigin = window.location.origin;
      var html = '';
      list.forEach(function(u, cardIdx) {
        var statusUrl = baseOrigin + '/status/' + encodeURIComponent(u.id || '');
        var subToken = (u.config && u.config.d && u.config.d.trim()) ? u.config.d.trim().replace(/^\\/+|\\/+$/g, '') : u.uuid;
        var subUrl = baseOrigin + '/' + subToken + '/sub';
        var nodeCount = u.subNodeCount || (u.config && u.config.subNodeCount) || 50;
        var gaugeText = u.dataLimitGb > 0 ? (u.dataLimitGb + ' GB') : '∞ بی‌نهایت';
        var expText = u.expireDays > 0 ? (u.expireDays + ' روز') : 'بدون انقضا';

        html += '<div class="user-card fx-card fx-reveal" style="--fx-i:' + Math.min(cardIdx, 6) + '">' +
          '<div class="uc-top">' +
            '<span class="top-pill ' + (u.enabled ? 'live' : '') + '">' + (u.enabled ? 'شروع با اولین اتصال' : 'غیرفعال') + '</span>' +
            '<div class="uc-id-box">' +
              '<div style="text-align:left;"><div class="uc-name">' + esc(u.username) + '</div><div class="uc-uuid">' + esc(String(u.uuid || '').slice(0, 18)) + (String(u.uuid || '').length > 18 ? '...' : '') + '</div></div>' +
              '<div class="uc-avatar">M</div>' +
            '</div>' +
          '</div>' +
          '<div class="uc-body">' +
            '<div class="uc-stats">' +
              '<div class="uc-stat-line"><span>مصرف</span><strong>' + formatBytesJs(u.usedBytes) + '</strong></div>' +
              '<div class="uc-stat-line"><span>آپلود ↑</span><strong>' + formatBytesJs(u.uploadBytes || 0) + '</strong></div>' +
              '<div class="uc-stat-line"><span>دانلود ↓</span><strong>' + formatBytesJs((u.downloadBytes || Math.max(0, (u.usedBytes || 0) - (u.uploadBytes || 0)))) + '</strong></div>' +
              '<div class="uc-stat-line"><span>عمر کل</span><strong>' + formatBytesJs(u.lifetimeBytes) + '</strong></div>' +
              '<div class="uc-stat-line"><span>درخواست‌ها</span><strong>' + (u.requestCount || 0) + '</strong></div>' +
              '<div class="uc-stat-line"><span>انقضا</span><strong>' + expText + '</strong></div>' +
              '<div class="uc-stat-line"><span>تعداد نود در ساب</span><strong>' + nodeCount + ' نود (' + esc(STATE.brand) + ')</strong></div>' +
            '</div>' +
            '<div class="uc-gauge"><strong>' + gaugeText + '</strong></div>' +
          '</div>' +
          '<div class="uc-actions">' +
            '<button type="button" class="btn-ghost" onclick="toggleUserEnabled(\\'' + u.id + '\\', ' + (!u.enabled) + ')">' + (u.enabled ? 'فعال' : 'غیرفعال') + '</button>' +
            '<button type="button" class="btn-ghost" style="border-color:var(--border-hi);color:var(--neon);" onclick="window.open(\\'' + statusUrl + '\\', \\'_blank\\')">👁 پنجره وضعیت</button>' +
            '<button type="button" class="btn-ghost" onclick="copyText(\\'' + statusUrl + '\\', \\'لینک صفحه وضعیت کاربر کپی شد\\')">🔗 کپی وضعیت</button>' +
            '<button type="button" class="btn-ghost" onclick="copyText(\\'' + subUrl + '\\', \\'ساب‌لینک کاربر کپی شد\\')">📋 ساب‌لینک</button>' +
            '<button type="button" class="btn-ghost" onclick="openUserModal(\\'' + u.id + '\\')">✎ ویرایش</button>' +
            '<button type="button" class="btn-ghost" onclick="resetUserTraffic(\\'' + u.id + '\\')">↻ صفر کردن</button>' +
            '<button type="button" class="btn-ghost btn-danger" onclick="removeUser(\\'' + u.id + '\\')">🗑</button>' +
          '</div>' +
        '</div>';
      });
      container.innerHTML = html;
      if (window.MiliFx) MiliFx.reveal(container);
    }

    function applyConfigToForm(cfg) {
      if (!cfg) return;
      var textFields = ['yx', 'yxURL', 'subNodeCount', 'wk', 'p', 's', 'qj', 'tp', 'alpn', 'customDNS', 'customECHDomain', 'dkby', 'rm', 'yxby', 'd', 'homepage', 'scu', 'ae', 'pm', 'locs', 'ssc', 'ssp', 'pcc', 'cpn'];
      textFields.forEach(function(k) {
        var el = document.getElementById('cfg_' + k);
        if (el && cfg[k] !== undefined) el.value = cfg[k];
      });
      var boolFields = ['ev', 'et', 'ex', 'ss', 'ech', 'jk', 'epd', 'epi', 'egi', 'ena', 'ipv4', 'ipv6', 'ispMobile', 'ispUnicom', 'ispTelecom', 'cpx'];
      boolFields.forEach(function(k) {
        var el = document.getElementById('cfg_' + k);
        if (el) el.checked = cfg[k] === 'yes' || cfg[k] === true;
      });
    }

    function collectFormConfig() {
      var out = {};
      var textFields = ['yx', 'yxURL', 'subNodeCount', 'wk', 'p', 's', 'qj', 'tp', 'alpn', 'customDNS', 'customECHDomain', 'dkby', 'rm', 'yxby', 'd', 'homepage', 'scu', 'ae', 'pm', 'locs', 'ssc', 'ssp', 'pcc', 'cpn'];
      textFields.forEach(function(k) {
        var el = document.getElementById('cfg_' + k);
        if (el) out[k] = el.value;
      });
      var boolFields = ['ev', 'et', 'ex', 'ss', 'ech', 'jk', 'epd', 'epi', 'egi', 'ena', 'ipv4', 'ipv6', 'ispMobile', 'ispUnicom', 'ispTelecom', 'cpx'];
      boolFields.forEach(function(k) {
        var el = document.getElementById('cfg_' + k);
        if (el) out[k] = el.checked ? 'yes' : 'no';
      });
      return out;
    }

    function updateDashboardWidgets() {
      var users = STATE.users || [];
      var diag = STATE.diagnostics || {};
      var cfg = STATE.config || {};
      var activeCount = users.filter(function(u) { return u.enabled; }).length;
      var disCount = users.length - activeCount;

      var nodeCount = Number(diag.healthyCfIps || 31);
      var totalReqs = Number(diag.totalRequests || 0);
      setText('mTotalUsers', String(users.length));
      setText('mUsersSub', activeCount + ' فعال · ' + disCount + ' غیرفعال');
      setText('mActiveNodes', String(nodeCount));
      setText('mHealthyIps', String(nodeCount));
      setText('donutCenterCount', String(nodeCount));
      setText('sbNodeCount', String(nodeCount));
      if (window.MiliFx) {
        MiliFx.countUp(document.getElementById('mTotalTraffic'), Number(diag.totalUsedBytes || 0), function (v) { return formatBytesJs(v); });
        MiliFx.countUp(document.getElementById('mLifetimeTraffic'), Number(diag.totalLifetimeBytes || 0), function (v) { return 'مجموع عمر: ' + formatBytesJs(v); });
        MiliFx.countUp(document.getElementById('mTotalReqs'), totalReqs, function (v) { return String(Math.round(v)); });
        MiliFx.countUp(document.getElementById('hbReqs'), totalReqs, function (v) { return Math.round(v) + ' درخواست ثبت‌شده'; });
        MiliFx.ring(document.getElementById('donutRing'), nodeCount > 0 ? Math.min(100, Math.round((users.length / nodeCount) * 100)) : 100);
      }

      var upMin = Math.max(1, Math.floor((diag.uptimeMs || 60000) / 60000));
      document.getElementById('hbUsers').textContent = '👥 ' + users.length + ' کاربر · ' + activeCount + ' فعال';
      document.getElementById('hbReqs').textContent = (diag.totalRequests || 0) + ' درخواست ثبت‌شده';
      document.getElementById('hbUptime').textContent = '🕒 آپ‌تایم ' + upMin + ' دقیقه';
      document.getElementById('hbD1').textContent = diag.d1Enabled ? ('🛡️ دیتابیس D1 متصل (' + diag.d1BindingName + ')') : '🛡️ ذخیره‌ساز پشتیبان فعال (بدون خطای D1)';

      document.getElementById('cfEdgeRegion').textContent = cfg.wk || 'CF Direct';
      document.getElementById('cfWorkerHost').textContent = window.location.host;
      document.getElementById('cfD1Status').textContent = diag.d1Enabled ? ('D1 (' + diag.d1BindingName + ') متصل') : 'حالت هوشمند بدون خطا (آماده اتصال D1)';
      document.getElementById('cfOutboundProxy').textContent = cfg.s ? 'فعال' : 'اتصال مستقیم';
      document.getElementById('sysD1State').textContent = diag.d1Enabled ? 'متصل و جداول آماده هستند' : 'آماده اتصال (بدون خطای استقرار دستی)';
      document.getElementById('sysKvState').textContent = diag.kvEnabled ? ('✅ متصل (' + diag.kvBindingName + ')') : 'اختیاری (غیرمتصل)';

      // پرمصرف‌ترین کاربران
      var topBox = document.getElementById('topUsersList');
      if (topBox) {
        var sorted = users.slice().sort(function(a, b) { return (b.usedBytes || 0) - (a.usedBytes || 0); }).slice(0, 4);
        topBox.innerHTML = sorted.map(function(u) {
          return '<div class="kv-row"><span class="kv-key">' + esc(u.username) + ' (' + (u.subNodeCount || 50) + ' نود)</span><span class="kv-val">' + formatBytesJs(u.usedBytes || 0) + '</span></div>';
        }).join('') || '<div style="color:var(--muted);font-size:0.8rem;">هنوز کاربری ثبت نشده است</div>';
      }

      // رویدادها
      var logBox = document.getElementById('auditLogsList');
      if (logBox) {
        var logs = diag.recentLogs || [];
        logBox.innerHTML = logs.slice(0, 5).map(function(l) {
          return '<div class="kv-row"><span class="kv-key">' + esc(l.action) + '</span><span class="kv-val">' + esc(l.detail) + '</span></div>';
        }).join('') || '<div style="color:var(--muted);font-size:0.8rem;">رویدادی ثبت نشده است</div>';
      }
    }

    async function refreshAllData() {
      var pill = document.querySelector('.top-pill.live');
      if (pill) pill.classList.add('syncing');
      try {
        var data = await apiRequest('/api/stats', { method: 'GET' });
        if (data && data.success) {
          STATE.config = data.config || STATE.config;
          STATE.users = data.users || STATE.users;
          STATE.diagnostics = data.diagnostics || STATE.diagnostics;
          applyConfigToForm(STATE.config);
          renderUsersGrid();
          updateDashboardWidgets();
          showToast('اطلاعات پنل به‌روزرسانی شد');
        } else {
          showToast('دریافت اطلاعات پنل ناموفق بود');
        }
      } catch (err) {
        showToast('خطا در دریافت اطلاعات: ' + (err && err.message ? err.message : 'نامشخص'));
      } finally {
        if (pill) pill.classList.remove('syncing');
      }
    }

    async function quickCreateUser() {
      var username = (document.getElementById('quickUsername').value || '').trim();
      var rawCount = parseInt(document.getElementById('quickSubNodeCount').value, 10);
      var subNodeCount = Number.isFinite(rawCount) ? Math.min(500, Math.max(0, rawCount)) : 50;
      var usePanelDefaults = document.getElementById('quickUsePanelDefaults').checked;
      if (username.length > 64) {
        showToast('نام کاربری حداکثر ۶۴ کاراکتر می‌تواند باشد');
        return;
      }
      try {
        var data = await apiRequest('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username,
            preset: SELECTED_PRESET,
            subNodeCount: subNodeCount,
            usePanelDefaults: usePanelDefaults
          })
        });
        if (data.success) {
          document.getElementById('quickUsername').value = '';
          showToast(data.message || 'کاربر جدید ساخته شد');
          await refreshAllData();
        } else {
          showToast(data.message || 'خطا در ساخت کاربر');
        }
      } catch (e) {
        showToast('خطا در ارتباط با سرور');
      }
    }

    function regenModalUuid() {
      document.getElementById('um_uuid').value = randomUuidV4();
    }

    function openUserModal(userId) {
      var modal = document.getElementById('userModalBackdrop');
      var baseCfg = Object.assign({}, STATE.defaults || {}, STATE.config || {});
      var existing = null;
      if (userId) {
        existing = (STATE.users || []).find(function(u) { return u.id === userId; });
      }

      document.getElementById('userModalTitle').textContent = existing
        ? ('ویرایش کاربر «' + existing.username + '»')
        : 'ساخت کاربر جدید (با تمام تنظیمات پیش‌فرض کد پایه + نام کاربر)';

      document.getElementById('um_id').value = existing ? existing.id : '';
      document.getElementById('um_username').value = existing ? existing.username : '';
      document.getElementById('um_subNodeCount').value = existing ? (existing.subNodeCount ?? 50) : (baseCfg.subNodeCount ?? 50);
      document.getElementById('um_uuid').value = existing ? existing.uuid : randomUuidV4();
      document.getElementById('um_dataLimitGb').value = existing ? (existing.dataLimitGb ?? 0) : 0;
      document.getElementById('um_expireDays').value = existing ? (existing.expireDays ?? 0) : 0;
      document.getElementById('um_ipLimit').value = existing ? (existing.ipLimit ?? 50) : 50;
      document.getElementById('um_preset').value = existing ? (existing.preset || 'iran-fast') : SELECTED_PRESET;
      document.getElementById('um_nodeScope').value = existing ? (existing.nodeScope || 'all') : 'all';
      document.getElementById('um_enabled').checked = existing ? Boolean(existing.enabled) : true;
      document.getElementById('um_startOnFirstUse').checked = existing ? Boolean(existing.startOnFirstUse) : true;

      var uCfg = existing && existing.config ? Object.assign({}, baseCfg, existing.config) : baseCfg;
      var textKeys = ['wk', 'p', 's', 'qj', 'tp', 'alpn', 'd', 'customDNS', 'customECHDomain', 'yx', 'yxURL', 'scu', 'dkby', 'rm', 'yxby', 'homepage', 'ae', 'ssc', 'ssp'];
      textKeys.forEach(function(k) {
        var el = document.getElementById('um_' + k);
        if (el) el.value = uCfg[k] !== undefined ? uCfg[k] : '';
      });
      var boolKeys = ['ev', 'et', 'ex', 'ss', 'ech', 'jk', 'epd', 'epi', 'egi', 'ena', 'ipv4', 'ipv6', 'ispMobile', 'ispUnicom', 'ispTelecom'];
      boolKeys.forEach(function(k) {
        var el = document.getElementById('um_' + k);
        if (el) el.checked = uCfg[k] === 'yes' || uCfg[k] === true;
      });

      fillUserCountrySelect();
      if (!PROXY_POOL_STATE.loaded) loadProxyPoolCountries();
      modal.classList.add('open');
      if (window.MiliFx) MiliFx.reveal(modal);
      var firstField = document.getElementById('um_username');
      if (firstField) window.setTimeout(function () { firstField.focus(); }, 240);
    }

    function closeUserModal() {
      document.getElementById('userModalBackdrop').classList.remove('open');
    }

    async function submitUserModal() {
      var id = document.getElementById('um_id').value.trim();
      var payload = {
        id: id || undefined,
        username: document.getElementById('um_username').value.trim(),
        subNodeCount: parseInt(document.getElementById('um_subNodeCount').value, 10) || 50,
        uuid: document.getElementById('um_uuid').value.trim(),
        dataLimitGb: parseFloat(document.getElementById('um_dataLimitGb').value) || 0,
        expireDays: parseInt(document.getElementById('um_expireDays').value, 10) || 0,
        ipLimit: parseInt(document.getElementById('um_ipLimit').value, 10) || 50,
        preset: document.getElementById('um_preset').value,
        nodeScope: document.getElementById('um_nodeScope').value,
        enabled: document.getElementById('um_enabled').checked,
        startOnFirstUse: document.getElementById('um_startOnFirstUse').checked,
        config: {}
      };
      var textKeys = ['wk', 'p', 's', 'qj', 'tp', 'alpn', 'd', 'customDNS', 'customECHDomain', 'yx', 'yxURL', 'scu', 'dkby', 'rm', 'yxby', 'homepage', 'ae', 'ssc', 'ssp'];
      textKeys.forEach(function(k) {
        var el = document.getElementById('um_' + k);
        if (el) payload.config[k] = el.value;
      });
      var boolKeys = ['ev', 'et', 'ex', 'ss', 'ech', 'jk', 'epd', 'epi', 'egi', 'ena', 'ipv4', 'ipv6', 'ispMobile', 'ispUnicom', 'ispTelecom'];
      boolKeys.forEach(function(k) {
        var el = document.getElementById('um_' + k);
        if (el) payload.config[k] = el.checked ? 'yes' : 'no';
      });
      payload.config.subNodeCount = payload.subNodeCount;
      if (!payload.username) {
        showToast('نام کاربری را وارد کنید');
        return;
      }
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.uuid)) {
        showToast('UUID معتبر نیست؛ یک UUID استاندارد بسازید');
        return;
      }

      var method = id ? 'PUT' : 'POST';
      var data = await apiRequest('/api/users', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function (err) {
        showToast('خطا در ذخیره کاربر: ' + (err && err.message ? err.message : 'نامشخص'));
        return { success: false, message: 'ارتباط با سرور ناموفق بود' };
      });
      if (data && data.success) {
        closeUserModal();
        showToast(data.message || 'ذخیره شد');
        await refreshAllData();
      } else {
        showToast(data.message || 'خطا در ذخیره کاربر');
      }
    }

    async function toggleUserEnabled(id, nextState) {
      await fetch(getApiBase() + '/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, enabled: nextState })
      });
      showToast('وضعیت کاربر تغییر کرد');
      await refreshAllData();
    }

    async function resetUserTraffic(id) {
      if (!window.confirm('مصرف این کاربر صفر شود؟')) return;
      await fetch(getApiBase() + '/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, action: 'reset' })
      });
      showToast('مصرف کاربر صفر شد');
      await refreshAllData();
    }

    async function removeUser(id) {
      if (!window.confirm('این کاربر و تمام تنظیماتش حذف شود؟ این کار قابل بازگشت نیست.')) return;
      await fetch(getApiBase() + '/api/users?id=' + encodeURIComponent(id), {
        method: 'DELETE'
      });
      showToast('کاربر حذف شد');
      await refreshAllData();
    }

    async function savePanelSettings() {
      var cfg = collectFormConfig();
      var data = await apiRequest('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
      }).catch(function (err) {
        showToast('خطا در ذخیره تنظیمات: ' + (err && err.message ? err.message : 'نامشخص'));
        return { success: false, message: 'ارتباط با سرور ناموفق بود' };
      });
      if (!data) return;
      if (data.success) {
        showToast(data.message || 'تنظیمات پنل ذخیره شد');
        await refreshAllData();
      } else {
        showToast(data.message || 'خطا در ذخیره تنظیمات');
      }
    }

    async function resetAllPanelSettings() {
      var data = await apiRequest('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _reset: true })
      }).catch(function (err) {
        showToast('بازنشانی تنظیمات ناموفق بود: ' + (err && err.message ? err.message : 'نامشخص'));
        return { success: false, message: 'ارتباط با سرور ناموفق بود' };
      });
      if (!data) return;
      if (data.success) {
        showToast(data.message);
        await refreshAllData();
      }
    }

    async function initD1Database() {
      var data = await apiRequest('/api/d1-init', { method: 'POST' }).catch(function (err) {
        showToast('بررسی D1 ناموفق بود: ' + (err && err.message ? err.message : 'نامشخص'));
        return { success: false, message: 'ارتباط با سرور ناموفق بود' };
      });
      if (!data) return;
      showToast(data.message || 'بررسی D1 انجام شد');
      await refreshAllData();
    }

    function copyText(text, msg) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() { showToast(msg || 'کپی شد'); });
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast(msg || 'کپی شد');
      }
    }

    function copyMainAdminSub() {
      var url = window.location.origin + getApiBase() + '/sub';
      copyText(url, 'ساب‌لینک اصلی کپی شد');
    }

    var LAST_SCAN = { results: [], summary: null };

    async function runIpScan(save) {
      var box = document.getElementById('scanResultsBox');
      if (box) {
        box.innerHTML = '<div class="kv-row"><span class="kv-key">در حال اجرای اسکن واقعی TCP...</span><span class="kv-val">لطفاً صبر کنید</span></div>';
      }
      try {
        var data = await apiRequest('/api/scanner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'scan',
            ipv6: document.getElementById('scanMode').value === 'v6',
            count: parseInt(document.getElementById('scanCount').value, 10) || 16,
            port: parseInt(document.getElementById('scanPort').value, 10) || 443,
            timeoutMs: parseInt(document.getElementById('scanTimeout').value, 10) || 2500,
            save: !!save
          })
        });
        LAST_SCAN.results = data.results || [];
        LAST_SCAN.summary = data.summary || null;
        renderScanResults();
        if (save) {
          showToast('نتایج سالم در لیست ترجیحی ذخیره شد');
          await refreshAllData();
        }
      } catch (err) {
        if (box) {
          box.innerHTML = '<div class="kv-row"><span class="kv-key">خطا در اسکن</span><span class="kv-val">' + esc(err && err.message ? err.message : 'نامشخص') + '</span></div>';
        }
      }
    }

    function renderScanResults() {
      var box = document.getElementById('scanResultsBox');
      if (!box) return;
      var list = (LAST_SCAN.results || []).slice().sort(function(a, b) {
        if (!!a.ok !== !!b.ok) return a.ok ? -1 : 1;
        return (a.latency || 99999) - (b.latency || 99999);
      });
      if (!list.length) {
        box.innerHTML = '<div class="kv-row"><span class="kv-key">نتیجه‌ای برای نمایش نیست</span><span class="kv-val">-</span></div>';
        return;
      }
      var s = LAST_SCAN.summary || {};
      var html = '<div class="kv-row"><span class="kv-key">خلاصه اسکن</span><span class="kv-val">' +
        (s.healthy || 0) + ' سالم از ' + (s.total || list.length) + ' کاندید' +
        (s.bestLatency !== null && s.bestLatency !== undefined ? (' · بهترین تأخیر ' + s.bestLatency + 'ms') : '') +
        '</span></div>';
      list.forEach(function(r) {
        var parts = [];
        if (r.colo) parts.push('colo ' + r.colo);
        if (r.loc) parts.push(r.loc);
        if (r.latency !== undefined) parts.push(r.latency + 'ms');
        if (!r.ok) parts.push(esc(r.error || 'ناموفق'));
        html += '<div class="kv-row"><span class="kv-key" style="direction:ltr;">' + (r.ok ? '${ICON('check')}' : '${ICON('x')}') + ' ' + esc(r.ip) + '</span><span class="kv-val">' + parts.join(' · ') + '</span></div>';
      });
      var healthy = list.filter(function(r) { return r.ok; }).map(function(r) { return r.ip + ':' + (r.port || 443) + '#CF-' + r.ip; });
      if (healthy.length) {
        html += '<div class="kv-row"><span class="kv-key">آی‌پی‌های سالم</span><span class="kv-val"><button type="button" class="btn-ghost" data-add-ips="' + esc(healthy.join(',')) + '">+ افزودن به لیست ترجیحی (yx)</button></span></div>';
      }
      box.innerHTML = html;
    }

    async function resolveYxDomains() {
      var yx = (document.getElementById('cfg_yx') ? document.getElementById('cfg_yx').value : '') || '';
      var hosts = yx.split(',').map(function(item) {
        var hostPart = String(item || '').split('#')[0].trim();
        var lastColon = hostPart.lastIndexOf(':');
        if (lastColon > 0 && !isNaN(parseInt(hostPart.slice(lastColon + 1), 10))) {
          hostPart = hostPart.slice(0, lastColon);
        }
        if (hostPart.charAt(0) === '[' && hostPart.charAt(hostPart.length - 1) === ']') {
          hostPart = hostPart.slice(1, -1);
        }
        return hostPart;
      }).filter(function(h) {
        return h && h.indexOf(':') === -1 && /[a-zA-Z]/.test(h);
      });
      if (!hosts.length) {
        showToast('دامنه‌ای در لیست ترجیحی (yx) برای تبدیل پیدا نشد');
        return;
      }
      try {
        var data = await apiRequest('/api/scanner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'resolve', hosts: hosts, save: true, port: 443 })
        });
        var rows = (data.resolved || []).map(function(r) {
          return '<div class="kv-row"><span class="kv-key" style="direction:ltr;">' + esc(r.host) + '</span><span class="kv-val" style="direction:ltr;">' + (r.fixedIp ? esc(r.fixedIp) : 'حل نشد') + '</span></div>';
        }).join('');
        document.getElementById('scanResultsBox').innerHTML = rows || '<div class="kv-row"><span class="kv-key">نتیجه‌ای یافت نشد</span><span class="kv-val">-</span></div>';
        showToast('دامنه‌ها به آی‌پی ثابت تبدیل و ذخیره شدند');
        await refreshAllData();
      } catch (err) {
        showToast('خطا در تبدیل دامنه‌ها: ' + (err && err.message ? err.message : 'نامشخص'));
      }
    }

    // ================= استخر پروکسی تفکیک‌شده کشور (s) =================
    var PROXY_POOL_STATE = { loaded: false, countries: [], rows: [], meta: null, pinging: false };

    function proxyPoolSetMeta(text) {
      var el = document.getElementById('proxyPoolMeta');
      if (el) el.textContent = text;
    }

    async function loadProxyPoolCountries(force) {
      if (PROXY_POOL_STATE.loaded && !force) return PROXY_POOL_STATE.countries;
      var sel = document.getElementById('proxyCountrySelect');
      try {
        var data = await apiRequest('/api/proxy-pool', { method: 'GET' });
        var list = data.countries || [];
        PROXY_POOL_STATE.countries = list;
        PROXY_POOL_STATE.loaded = true;
        PROXY_POOL_STATE.meta = { total: data.total || 0, generatedAt: data.generatedAt || '', countryCount: data.countryCount || list.length };
        var previous = sel ? sel.value : '';
        if (sel) {
          sel.innerHTML = list.length
            ? list.map(function(c) {
                return '<option value="' + esc(c.code) + '">' + esc(c.flag) + ' ' + esc(c.name) + ' (' + esc(c.code) + ') · ' + c.count + ' پروکسی</option>';
              }).join('')
            : '<option value="">استخری موجود نیست</option>';
          if (previous && list.some(function(c) { return c.code === previous; })) sel.value = previous;
        }
        proxyPoolSetMeta((data.total || 0) + ' پروکسی سالم در ' + (data.countryCount || list.length) + ' کشور · تاریخ سلامت‌سنجی: ' + (data.generatedAt || 'نامشخص'));
        fillUserCountrySelect();
        return list;
      } catch (err) {
        proxyPoolSetMeta('خطا در دریافت استخر پروکسی: ' + (err && err.message ? err.message : 'نامشخص'));
        return [];
      }
    }

    function onProxyCountryChange() {
      PROXY_POOL_STATE.rows = [];
      loadCountryProxies(false);
    }

    function renderProxyRows() {
      var box = document.getElementById('sProxyList');
      if (!box) return;
      var rows = PROXY_POOL_STATE.rows || [];
      if (!rows.length) {
        box.innerHTML = '<div class="kv-row"><span class="kv-key">لیستی برای نمایش نیست — یک کشور انتخاب و «لیست + پینگ واقعی» را بزنید</span><span class="kv-val">—</span></div>';
        return;
      }
      box.innerHTML = rows.map(function(r, idx) {
        var badge = r.ok === true
          ? '<span class="ping-badge ok">✓ ' + (r.ms || 0) + 'ms</span>'
          : r.ok === false
            ? '<span class="ping-badge bad">✗ ' + esc(r.error || 'ناموفق') + '</span>'
            : '<span class="ping-badge wait">تست‌نشده</span>';
        var health = r.pingMs ? '<span class="ping-badge wait">سلامت ' + r.pingMs + 'ms</span>' : '';
        var country = r.country ? '<span class="ping-badge wait">' + esc(r.country) + '</span>' : '';
        return '<div class="kv-row pool-row">' +
          '<span class="pool-url">' + esc(r.s) + '</span>' +
          '<span class="pool-row-actions">' + country + badge + health +
            '<button type="button" class="btn-ghost" data-pick-proxy="' + idx + '">انتخاب</button>' +
            '<button type="button" class="btn-ghost" data-ping-proxy="' + idx + '">تست</button>' +
          '</span>' +
        '</div>';
      }).join('');
    }

    async function loadCountryProxies(withPing) {
      var sel = document.getElementById('proxyCountrySelect');
      var code = sel ? sel.value : '';
      if (!code) { showToast('ابتدا یک کشور را انتخاب کنید'); return; }
      var box = document.getElementById('sProxyList');
      if (box) box.innerHTML = '<div class="kv-row"><span class="kv-key">در حال دریافت لیست پروکسی‌های کشور…</span><span class="kv-val">—</span></div>';
      try {
        var data = await apiRequest('/api/proxy-pool?country=' + encodeURIComponent(code) + '&limit=40', { method: 'GET' });
        var list = data.proxies || [];
        PROXY_POOL_STATE.rows = list.map(function(p) {
          return { s: p.s, host: p.host, port: p.port, kind: p.kind, pingMs: p.pingMs || 0, ok: null, ms: null, error: '' };
        });
        renderProxyRows();
        if (withPing) await pingProxyRows(PROXY_POOL_STATE.rows.slice(0, 8));
      } catch (err) {
        if (box) box.innerHTML = '<div class="kv-row"><span class="kv-key">خطا در دریافت لیست</span><span class="kv-val">' + esc(err && err.message ? err.message : 'نامشخص') + '</span></div>';
      }
    }

    async function pingProxyRows(rows) {
      if (!rows || !rows.length || PROXY_POOL_STATE.pinging) return;
      PROXY_POOL_STATE.pinging = true;
      rows.forEach(function(r) { r.ok = null; r.ms = null; r.error = ''; });
      renderProxyRows();
      try {
        var data = await apiRequest('/api/proxy-pool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ping', proxies: rows.map(function(r) { return r.s; }), timeoutMs: 3000 })
        });
        var results = data.results || [];
        results.forEach(function(res, idx) {
          var target = rows[idx];
          if (!target) return;
          target.ok = !!res.ok;
          target.ms = res.ms || 0;
          target.error = res.error || '';
          PROXY_POOL_STATE.rows.forEach(function(main) {
            if (main.s === target.s) { main.ok = target.ok; main.ms = target.ms; main.error = target.error; }
          });
        });
        renderProxyRows();
        showToast((data.healthy || 0) + ' پروکسی سالم از ' + (data.total || results.length) + ' مورد سنجیده‌شده');
      } catch (err) {
        showToast('خطا در پینگ پروکسی: ' + (err && err.message ? err.message : 'نامشخص'));
      } finally {
        PROXY_POOL_STATE.pinging = false;
      }
    }

    function pickProxyByIndex(idx) {
      var row = (PROXY_POOL_STATE.rows || [])[idx];
      if (!row) return;
      var input = document.getElementById('cfg_s');
      if (input) input.value = row.s;
      showToast('پروکسی خروجی انتخاب شد؛ برای اعمال، «ذخیره تنظیمات شبکه» را بزنید');
    }

    async function autoRandomMultiLocation() {
      try {
        var data = await apiRequest('/api/proxy-pool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'random', countries: 'all', count: 12 })
        });
        var picks = data.proxies || [];
        var countries = data.countries || [];
        var cpx = document.getElementById('cfg_cpx');
        if (cpx) cpx.checked = true;
        var pcc = document.getElementById('cfg_pcc');
        if (pcc) pcc.value = countries.join(',') || 'all';
        var cpn = document.getElementById('cfg_cpn');
        if (cpn) cpn.value = String(Math.max(picks.length, 12));
        PROXY_POOL_STATE.rows = picks.map(function(p) {
          return { s: p.s, country: p.country, pingMs: p.pingMs || 0, ok: null, ms: null, error: '' };
        });
        renderProxyRows();
        showToast('مولتی‌لوکیشن رندوم ساخته شد: ' + countries.length + ' کشور · در حال ذخیره…');
        await savePanelSettings();
      } catch (err) {
        showToast('خطا در ساخت مولتی‌لوکیشن: ' + (err && err.message ? err.message : 'نامشخص'));
      }
    }

    function fillUserCountrySelect() {
      var sel = document.getElementById('um_scc');
      if (!sel || !PROXY_POOL_STATE.countries.length) return;
      var previous = sel.value;
      sel.innerHTML = '<option value="">— انتخاب کشور —</option>' + PROXY_POOL_STATE.countries.map(function(c) {
        return '<option value="' + esc(c.code) + '">' + esc(c.flag) + ' ' + esc(c.name) + ' (' + esc(c.code) + ') · ' + c.count + '</option>';
      }).join('');
      if (previous) sel.value = previous;
    }

    async function applyUserCountryProxy() {
      var sel = document.getElementById('um_scc');
      var code = sel ? sel.value : '';
      if (!code) { showToast('کشور را انتخاب کنید'); return; }
      try {
        var data = await apiRequest('/api/proxy-pool?country=' + encodeURIComponent(code) + '&limit=25', { method: 'GET' });
        var list = data.proxies || [];
        if (!list.length) { showToast('برای این کشور پروکسی‌ای موجود نیست'); return; }
        var chosen = list[Math.floor(Math.random() * Math.min(list.length, 8))];
        var input = document.getElementById('um_s');
        if (input) input.value = chosen.s;
        showToast('پروکسی ' + code + ' انتخاب شد (سلامت ' + (chosen.pingMs || '?') + 'ms)');
      } catch (err) {
        showToast('خطا در انتخاب پروکسی کشور: ' + (err && err.message ? err.message : 'نامشخص'));
      }
    }

    function appendGeneratedIps(str) {
      var el = document.getElementById('cfg_yx');
      if (!el || !str) return;
      el.value = el.value.trim() ? (el.value.trim() + ',' + str) : str;
      savePanelSettings();
    }

    // ساعت زنده سایدبار
    function tickClock() {
      var now = new Date();
      var hh = String(now.getHours()).padStart(2, '0');
      var mm = String(now.getMinutes()).padStart(2, '0');
      var ss = String(now.getSeconds()).padStart(2, '0');
      var clk = document.getElementById('liveClock');
      if (clk) clk.textContent = hh + ':' + mm + ':' + ss;
      var dt = document.getElementById('liveDate');
      if (dt) {
        try {
          dt.textContent = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(now);
        } catch (_e) {
          dt.textContent = now.toISOString().slice(0, 10);
        }
      }
    }
    setInterval(tickClock, 1000);
    tickClock();

    // میانبر Ctrl+S برای ذخیره تنظیمات
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        savePanelSettings();
      }
    });

    // خطاهای پردازش‌نشده شبکه دیگر بی‌صدا نمی‌مانند
    window.addEventListener('unhandledrejection', function (event) {
      var reason = event && event.reason ? event.reason : null;
      showToast('خطا در ارتباط با سرور: ' + (reason && reason.message ? reason.message : 'درخواست ناموفق بود'));
    });

    // افزودن IPهای تولیدشده با واگذاری رویداد (بدون inline onclick)
    document.addEventListener('click', function (event) {
      var target = event.target && event.target.closest ? event.target : null;
      if (!target) return;
      var pickBtn = target.closest('[data-pick-proxy]');
      if (pickBtn) {
        pickProxyByIndex(parseInt(pickBtn.getAttribute('data-pick-proxy'), 10));
        return;
      }
      var pingBtn = target.closest('[data-ping-proxy]');
      if (pingBtn) {
        var idx = parseInt(pingBtn.getAttribute('data-ping-proxy'), 10);
        var row = (PROXY_POOL_STATE.rows || [])[idx];
        if (row) pingProxyRows([row]);
        return;
      }
      var btn = target.closest('[data-add-ips]');
      if (btn) appendGeneratedIps(btn.getAttribute('data-add-ips') || '');
    });

    // بستن مودال با کلیک روی پس‌زمینه و کلید Escape
    var modalBackdrop = document.getElementById('userModalBackdrop');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', function (event) {
        if (event.target === modalBackdrop) closeUserModal();
      });
    }

    // ==========================================================================
    // ناوبری بین بخش‌ها «اولین» کاری است که انجام می‌شود.
    // قبلاً مقداردهی اولیه یک زنجیره خطی بود و اگر یکی از مراحل خطا می‌داد
    // (مثلاً یک کاربر ناقص در D1)، بقیه مراحل — از جمله سیم‌کشی تب‌ها — اجرا
    // نمی‌شد و در نتیجه «هیچ دکمه‌ای کار نمی‌کرد». حالا هر مرحله مستقل و امن است.
    // ==========================================================================
    function applyHashView() {
      var v = String(window.location.hash || '').replace('#', '');
      if (v && document.getElementById('view-' + v)) switchView(v, true);
    }
    window.addEventListener('hashchange', applyHashView);

    function safeInit(label, fn) {
      try {
        fn();
      } catch (err) {
        if (window.console && console.error) console.error('[mili-init] ' + label, err);
        showToast('خطا در ' + label + ': ' + (err && err.message ? err.message : err));
      }
    }

    // نمایش خطاهای اجرایی بی‌صدا نمی‌مانند (به‌جای پنل مرده)
    window.addEventListener('error', function (event) {
      if (!event || !event.message) return;
      if (window.console && console.error) console.error('[mili-runtime]', event.message, event.filename, event.lineno);
    });

    safeInit('پریست‌ها', renderPresets);
    safeInit('فرم تنظیمات', function () { applyConfigToForm(STATE.config); });
    safeInit('کاربران', renderUsersGrid);
    safeInit('داشبورد', updateDashboardWidgets);
    safeInit('ردیف‌های پروکسی', renderProxyRows);
    safeInit('لیست کشورها', function () {
      if (document.getElementById('proxyCountrySelect')) loadProxyPoolCountries();
    });

    // جلوه‌های نرم روی کارت‌های پنل
    safeInit('جلوه‌های بصری', function () {
      document.querySelectorAll('.metric-card, .panel-card, .hero-card, .stat-box, .kv-row').forEach(function (el, idx) {
        el.classList.add('fx-card');
        if (el.classList.contains('panel-card') || el.classList.contains('metric-card')) el.classList.add('fx-reveal');
        if (!el.style.getPropertyValue('--fx-i')) el.style.setProperty('--fx-i', String(Math.min(idx, 8)));
      });
      if (window.MiliFx) MiliFx.reveal(document);
    });

    // بازیابی نمای انتخاب‌شده از آدرس
    safeInit('نمای اولیه', applyHashView);
  </script>
</body>
</html>`);
}
