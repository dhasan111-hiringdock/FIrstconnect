const express = require("express");
const path = require("path");
const fs = require("fs");
const os = require("os");
const multer = require("multer");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

let uploadRoot = __dirname;
try {
  const testDir = path.join(uploadRoot, "uploads-test");
  fs.mkdirSync(testDir, { recursive: true });
  fs.rmdirSync(testDir, { recursive: true });
} catch {
  uploadRoot = os.tmpdir();
}
const uploadDir = path.join(uploadRoot, "uploads");
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.error("Failed to create upload directory:", err);
  }
}

app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${uniqueSuffix}-${safeName}`);
  },
});

const allowedCvExtensions = [".pdf", ".doc", ".docx", ".rtf", ".odt"];
const allowedCvMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/rtf",
  "text/rtf",
  "application/vnd.oasis.opendocument.text",
];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const okExt = allowedCvExtensions.includes(ext);
    const okMime = allowedCvMimeTypes.includes(file.mimetype);
    if (okExt || okMime) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported CV file type"));
    }
  },
});

let jobs = [
  {
    id: 1,
    title: "Senior Product Manager",
    company: "Atlas Metrics",
    location: "Berlin, Germany",
    type: "Full-time",
    rate: "₹35L–₹45L",
    deadline: "2026-03-15",
    description: "Own the product strategy for a B2B SaaS platform used by hundreds of customers.",
    status: "active",
  },
  {
    id: 2,
    title: "Frontend Engineer",
    company: "Northlight",
    location: "Remote (EU)",
    type: "Full-time",
    rate: "₹30L–₹40L",
    deadline: "2026-02-28",
    description: "Build polished React interfaces for a fast-growing product-led startup.",
    status: "active",
  },
  {
    id: 3,
    title: "Head of Growth",
    company: "Finwave",
    location: "London, UK",
    type: "Full-time",
    rate: "₹40L–₹50L + ESOPs",
    deadline: "2026-03-31",
    description: "Lead acquisition and lifecycle teams for a Series B fintech scale-up.",
    status: "active",
  },
  {
    id: 4,
    title: "People Operations Lead",
    company: "Brightline",
    location: "Amsterdam, NL (Hybrid)",
    type: "Full-time",
    rate: "₹25L–₹32L",
    deadline: "",
    description: "Shape people processes, onboarding and culture for a 150+ person organisation.",
    status: "active",
  },
  {
    id: 5,
    title: "Customer Success Manager",
    company: "Relay",
    location: "Remote",
    type: "Contract",
    rate: "₹4,000–₹5,000/hour",
    deadline: "",
    description: "Own strategic accounts and help customers realise value from the platform.",
    status: "active",
  },
];
let nextJobId = jobs.length + 1;

let applications = [];
let nextApplicationId = 1;

const ADMIN_EMAIL = "umar@firstconnect.com";

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  const pairs = header.split(";");
  const cookies = {};
  for (const pair of pairs) {
    const index = pair.indexOf("=");
    if (index === -1) continue;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

function isAdminRequest(req) {
  const cookies = parseCookies(req);
  return cookies.adminAuth === "1";
}

function requireAdmin(req, res, next) {
  if (!isAdminRequest(req)) {
    res.redirect("/admin/login");
    return;
  }
  next();
}

function findApplication(id) {
  return applications.find((app) => app.id === id);
}

function findJob(id) {
  return jobs.find((job) => job.id === id);
}

function renderLayout(title, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<style>
body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background-color: #f5f5f7;
  color: #0f172a;
}
a {
  color: inherit;
  text-decoration: none;
}
header {
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.9);
}
    .nav {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0.85rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
}
.brand {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  font-size: 1.05rem;
}
.brand-icon {
  height: 32px;
  min-width: 32px;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.35);
  padding: 1px 3px;
}
.brand-icon img {
  height: 100%;
  width: auto;
  object-fit: contain;
  display: block;
}
.brand span {
  color: #2563eb;
}
.nav-links {
  display: flex;
  gap: 1.1rem;
  align-items: center;
  font-size: 0.9rem;
}
.nav-link {
  color: #6b7280;
  position: relative;
  padding-bottom: 0.1rem;
}
.nav-link::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -0.15rem;
  width: 0;
  height: 2px;
  background-color: #2563eb;
  border-radius: 999px;
  transition: width 0.14s ease-out;
}
.nav-link:hover {
  color: #1d4ed8;
}
.nav-link:hover::after {
  width: 14px;
}
.nav-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.btn-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.95rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  background-color: transparent;
  transition: transform 0.1s ease, box-shadow 0.1s ease, background-color 0.1s ease, border-color 0.1s ease;
}
.btn-outline {
  background-color: #ffffff;
  border-color: #e5e7eb;
  color: #0f172a;
}
.btn-primary {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.3);
}
.btn-pill:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(148, 163, 184, 0.4);
}
.btn-pill:active {
  transform: translateY(0);
  box-shadow: none;
}
main {
  max-width: 1120px;
  margin: 1.5rem auto 2.5rem;
  padding: 0 1rem;
}
.card {
  background-color: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 18px 35px rgba(15, 23, 42, 0.06);
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}
.toolbar h1,
.toolbar h2 {
  margin: 0;
}
.muted {
  color: #6b7280;
  font-size: 0.86rem;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
}
th,
td {
  padding: 0.7rem 0.45rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}
th {
  background-color: #f9fafb;
  font-weight: 600;
}
tr:last-child td {
  border-bottom: none;
}
.badge {
  display: inline-block;
  padding: 0.12rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
}
.badge-active {
  background-color: #dcfce7;
  color: #166534;
}
.badge-archived {
  background-color: #e5e7eb;
  color: #374151;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}
.actions form {
  margin: 0;
}
button,
.link-button {
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
  padding: 0.25rem 0.6rem;
  font-size: 0.8rem;
  cursor: pointer;
  background-color: #ffffff;
}
.btn-danger {
  background-color: #ef4444;
  border-color: #ef4444;
  color: #ffffff;
}
.btn-outline-small {
  background-color: transparent;
}
form .field-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.field {
  flex: 1 1 220px;
}
label {
  display: block;
  font-size: 0.84rem;
  font-weight: 500;
  margin-bottom: 0.22rem;
}
input[type="text"],
input[type="date"],
textarea,
select {
  width: 100%;
  padding: 0.45rem 0.6rem;
  font-size: 0.9rem;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  box-sizing: border-box;
  background-color: #ffffff;
}
textarea {
  resize: vertical;
  min-height: 80px;
}
.form-actions {
  margin-top: 0.75rem;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  background-color: #eef2ff;
  border: 1px solid #c7d2fe;
}
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.tab {
  padding: 0.25rem 0.8rem;
  border-radius: 999px;
  font-size: 0.8rem;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  color: #4b5563;
}
.tab-active {
  background-color: #2563eb;
  color: #ffffff;
  border-color: #1d4ed8;
}
.subtabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.subtab {
  padding: 0.22rem 0.75rem;
  border-radius: 999px;
  font-size: 0.78rem;
  border: 1px solid transparent;
  background-color: transparent;
  color: #4b5563;
}
.subtab-active {
  border-color: #2563eb;
  background-color: #eff6ff;
  color: #1d4ed8;
}
.status-badge {
  display: inline-block;
  padding: 0.12rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
}
.status-new {
  background-color: #dbeafe;
  color: #1d4ed8;
}
.status-review {
  background-color: #fef9c3;
  color: #854d0e;
}
.status-shortlisted {
  background-color: #dcfce7;
  color: #166534;
}
.status-rejected {
  background-color: #fee2e2;
  color: #b91c1c;
}
.auth-shell {
  min-height: calc(100vh - 80px);
  display: flex;
  justify-content: center;
  align-items: stretch;
  padding: 2.5rem 1.5rem;
}
.auth-shell-inner {
  max-width: 1120px;
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 2.5rem;
  align-items: center;
}
.auth-hero {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.auth-kicker {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #3b82f6;
}
.auth-hero-title {
  font-size: 1.9rem;
  line-height: 1.2;
  margin: 0;
}
.auth-hero-subtitle {
  margin: 0;
  font-size: 0.95rem;
  color: #4b5563;
}
.auth-hero-points {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: #4b5563;
}
.auth-hero-point {
  display: flex;
  gap: 0.4rem;
  align-items: flex-start;
}
.auth-hero-bullet {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background-color: #e0f2fe;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: #1d4ed8;
  flex-shrink: 0;
}
.auth-hero-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.9rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  font-size: 0.78rem;
  color: #6b7280;
}
.auth-layout {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 80px);
}
.auth-card {
  max-width: 430px;
  width: 100%;
  margin: 0 auto;
}
.auth-header-title {
  font-size: 1.3rem;
  margin: 0 0 0.25rem 0;
}
.auth-header-subtitle {
  margin: 0;
  font-size: 0.9rem;
}
.auth-job-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  font-size: 0.8rem;
  margin-bottom: 0.9rem;
}
.auth-google-btn {
  width: 100%;
  justify-content: center;
  gap: 0.4rem;
}
.auth-google-icon {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, #fbbf24, #ef4444 40%, #3b82f6 70%, #10b981 100%);
}
.auth-divider {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.9rem 0;
  font-size: 0.78rem;
  color: #9ca3af;
}
.auth-divider-line {
  flex: 1;
  height: 1px;
  background-color: #e5e7eb;
}
.auth-tabs {
  display: inline-flex;
  padding: 0.18rem;
  border-radius: 999px;
  background-color: #f3f4f6;
  margin-bottom: 1rem;
}
.auth-tab {
  padding: 0.32rem 0.9rem;
  border-radius: 999px;
  font-size: 0.8rem;
  color: #6b7280;
}
.auth-tab-active {
  background-color: #ffffff;
  color: #111827;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}
.auth-subheader {
  margin-top: 0.2rem;
  font-size: 0.85rem;
  color: #6b7280;
}
.auth-metadata {
  margin-top: 0.9rem;
  font-size: 0.78rem;
  color: #9ca3af;
}
.auth-switch {
  margin-top: 0.8rem;
  font-size: 0.82rem;
  color: #4b5563;
}
.auth-switch a {
  color: #2563eb;
  font-weight: 500;
}
.auth-footnote {
  margin-top: 0.6rem;
  font-size: 0.78rem;
  color: #9ca3af;
}
.job-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}
.job-card {
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  padding: 0.95rem 1rem;
  background-color: #ffffff;
  display: grid;
  gap: 0.45rem;
  font-size: 0.86rem;
}
.job-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.6rem;
}
.job-title {
  font-weight: 600;
  margin-bottom: 0.1rem;
}
.job-meta {
  color: #6b7280;
  font-size: 0.8rem;
}
.badge-type {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  background-color: #ecfdf5;
  color: #166534;
  border: 1px solid #bbf7d0;
}
.badge-remote {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  background-color: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}
.job-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 0.2rem;
}
.btn-job {
  padding: 0.28rem 0.75rem;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  font-size: 0.76rem;
  background-color: #ffffff;
  cursor: pointer;
}
.filters-layout {
  display: grid;
  grid-template-columns: minmax(0, 260px) minmax(0, 1fr);
  gap: 1.25rem;
  align-items: flex-start;
}
.filters-panel {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  padding: 0.8rem 0.9rem 0.95rem;
  font-size: 0.86rem;
}
.filters-panel h2 {
  margin: 0 0 0.5rem 0;
  font-size: 0.98rem;
}
.filters-panel .field {
  margin-bottom: 0.55rem;
}
.filters-panel .field:last-of-type {
  margin-bottom: 0.7rem;
}
.filters-actions {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.filters-actions .btn-pill {
  padding-inline: 0.9rem;
}
.filters-actions .link-button {
  background-color: transparent;
}
.contact-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 1.5rem;
  align-items: flex-start;
}
.contact-main {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  font-size: 0.9rem;
}
.contact-actions {
  margin-top: 0.4rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.highlight-card {
  border-radius: 16px;
  border: 1px solid #dbeafe;
  padding: 1rem 1.1rem;
  background: radial-gradient(circle at top left, #eff6ff 0, #ffffff 55%);
  box-shadow: 0 18px 40px rgba(37, 99, 235, 0.18);
  font-size: 0.9rem;
}
.highlight-metric {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1d4ed8;
  margin-bottom: 0.2rem;
}
.highlight-label {
  font-size: 0.82rem;
  color: #6b7280;
  margin-bottom: 0.4rem;
}
.highlight-body {
  font-size: 0.86rem;
  color: #111827;
}
@media (max-width: 768px) {
  .contact-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 900px) {
  .job-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .nav {
    flex-wrap: wrap;
    gap: 0.5rem 0.75rem;
  }
  .nav-links {
    width: 100%;
    order: 3;
    justify-content: flex-start;
    gap: 0.9rem;
  }
  main {
    padding: 0 0.75rem 2rem;
  }
  table {
    font-size: 0.8rem;
  }
  .actions {
    flex-direction: column;
    align-items: flex-start;
  }
  .job-list {
    grid-template-columns: minmax(0, 1fr);
  }
  .auth-shell {
    padding: 1.5rem 1rem;
  }
  .auth-shell-inner {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.75rem;
  }
  .auth-hero-title {
    font-size: 1.5rem;
  }
}
</style>
</head>
<body>
<header>
  <div class="nav">
    <div class="brand">
      <div class="brand-icon">
        <img src="Assets/WhatsApp Image 2026-02-11 at 14.24.04.jpeg" alt="First Connect logo" />
      </div>
      <div>FIRST<span>CONNECT</span></div>
    </div>
    <nav class="nav-links">
      <a href="/" class="nav-link">Home</a>
      <a href="/jobs" class="nav-link">Job board</a>
      <a href="/contact" class="nav-link">Contact</a>
    </nav>
    <div class="nav-actions">
      <a href="/admin/login" class="btn-pill btn-outline">Admin login</a>
    </div>
  </div>
</header>
<main>
${content}
</main>
<script>
(function () {
  if (typeof window === "undefined") return;
  function buildShareMessage(title, url) {
    var prefix = title ? title + " \u2013 " : "";
    return prefix + url;
  }
  function initShare() {
    var href = window.location.href;
    var title = document.title || "";
    var copyButtons = document.querySelectorAll("[data-share-copy]");
    copyButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var shareTitle = btn.getAttribute("data-share-title") || title;
        var text = buildShareMessage(shareTitle, href);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            btn.textContent = "Link copied";
            setTimeout(function () {
              btn.textContent = "Copy link";
            }, 1500);
          }).catch(function () {});
        } else {
          var textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          try {
            document.execCommand("copy");
          } catch (e) {}
          document.body.removeChild(textarea);
        }
      });
    });
    var whatsappLinks = document.querySelectorAll("[data-share-whatsapp]");
    whatsappLinks.forEach(function (link) {
      var shareTitle = link.getAttribute("data-share-title") || title;
      var text = buildShareMessage(shareTitle, href);
      var waUrl = "https://wa.me/?text=" + encodeURIComponent(text);
      link.setAttribute("href", waUrl);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initShare);
  } else {
    initShare();
  }
})();
</script>
</body>
</html>`;
}

function renderAdminJobsPage(options = {}) {
  const activeTab = options.tab === "create" ? "create" : "view";
  const viewStatus = options.status === "archived" ? "archived" : "active";
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((job) => job.status === "active").length;
  const archivedJobs = totalJobs - activeJobs;
  const filteredJobs = jobs.filter((job) => job.status === viewStatus);
  const rows =
    filteredJobs.length
      ? filteredJobs
          .map((job) => {
            const jobApplicationsCount = applications.filter(
              (app) => app.jobId === job.id
            ).length;
            const statusClass =
              job.status === "active" ? "badge badge-active" : "badge badge-archived";
            const statusLabel = job.status === "active" ? "Active" : "Archived";
            const archiveAction = job.status === "active" ? "Archive" : "Activate";
            const archiveEndpoint = job.status === "active" ? "archive" : "activate";
            return `<tr>
  <td>${job.title}</td>
  <td>${job.company || ""}</td>
  <td>${job.location || ""}</td>
  <td>${job.rate || ""}</td>
  <td><a href="/admin/applicants?status=all&jobId=${job.id}">${
    jobApplicationsCount
      ? `${jobApplicationsCount} candidate${
          jobApplicationsCount === 1 ? "" : "s"
        }`
      : "View applicants (0)"
  }</a></td>
  <td><span class="${statusClass}">${statusLabel}</span></td>
  <td>
    <div class="actions">
      <a class="link-button" href="/admin/jobs/${job.id}/edit">Edit</a>
      <a class="link-button" href="/jobs/${job.id}" target="_blank">View on portal</a>
      <form method="post" action="/admin/jobs/${job.id}/${archiveEndpoint}">
        <button class="btn-outline-small" type="submit">${archiveAction}</button>
      </form>
      <form method="post" action="/admin/jobs/${job.id}/delete" onsubmit="return confirm('Delete this job?');">
        <button class="btn-danger" type="submit">Delete</button>
      </form>
    </div>
  </td>
</tr>`;
          })
          .join("")
      : `<tr><td colspan="7" class="muted">No ${
          viewStatus === "active" ? "active" : "archived"
        } jobs yet. Use the Create job tab to post the first role.</td></tr>`;

  const viewSection = `
  <div class="subtabs">
    <a href="/admin/jobs?tab=view&status=active" class="subtab${
      viewStatus === "active" ? " subtab-active" : ""
    }">Active jobs</a>
    <a href="/admin/jobs?tab=view&status=archived" class="subtab${
      viewStatus === "archived" ? " subtab-active" : ""
    }">Archived jobs</a>
  </div>
  <table>
    <thead>
      <tr>
        <th>Title</th>
        <th>Company</th>
        <th>Location</th>
        <th>Rate</th>
        <th>Applicants</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
`;

  const createSection = `
  <h2>Create new role</h2>
  <form method="post" action="/admin/jobs">
    <div class="field-group">
      <div class="field">
        <label for="title">Job title</label>
        <input id="title" name="title" type="text" placeholder="e.g. Senior Product Designer" />
      </div>
      <div class="field">
        <label for="company">Company</label>
        <input id="company" name="company" type="text" placeholder="Client company name" />
      </div>
      <div class="field">
        <label for="location">Location</label>
        <input id="location" name="location" type="text" placeholder="Remote / City" />
      </div>
    </div>
    <div class="field-group" style="margin-top:0.75rem;">
      <div class="field">
        <label for="type">Job type</label>
        <select id="type" name="type">
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Contract">Contract</option>
          <option value="Temporary">Temporary</option>
        </select>
      </div>
      <div class="field">
        <label for="rate">Rate / Salary</label>
        <input id="rate" name="rate" type="text" placeholder="₹ (INR) per year or month" />
      </div>
      <div class="field">
        <label for="deadline">Application deadline</label>
        <input id="deadline" name="deadline" type="date" />
      </div>
    </div>
    <div class="field-group" style="margin-top:0.75rem;">
      <div class="field">
        <label for="description">Description</label>
        <textarea id="description" name="description" placeholder="Short summary of the role, expectations and ideal profile."></textarea>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-primary" type="submit">Post role</button>
    </div>
    <p class="muted" style="margin-top:0.5rem;">All fields are optional. New roles appear immediately on the public job board.</p>
  </form>
`;

  const content = `
<section class="card">
    <a href="/admin/jobs?tab=view" class="tab${
      activeTab === "view" ? " tab-active" : ""
    }">View jobs</a>
    <a href="/admin/jobs?tab=create" class="tab${
      activeTab === "create" ? " tab-active" : ""
    }">Create job</a>
  </div>
  <div class="toolbar">
    <div>
      <h1>Job posts</h1>
      <p class="muted">Admin view for creating, updating and archiving roles.</p>
    </div>
    <div class="pill">
      <span>${totalJobs} total</span>
      <span>• ${activeJobs} active</span>
      <span>• ${archivedJobs} archived</span>
    </div>
    <a href="/admin/applicants" class="btn-pill btn-outline">View applicants</a>
    <form method="post" action="/admin/logout">
      <button class="btn-pill btn-outline" type="submit">Logout</button>
    </form>
  </div>
  ${activeTab === "view" ? viewSection : createSection}
</section>
`;
  return renderLayout("First Connect • Admin jobs", content);
}

function renderEditJobPage(job) {
  const content = `
<section class="card">
  <div class="toolbar">
    <div>
      <h2>Edit role</h2>
      <p class="muted">Update details for this role. Changes are reflected immediately on the job board.</p>
    </div>
    <a class="btn-pill btn-outline" href="/admin/jobs?tab=view">Back to list</a>
  </div>
  <form method="post" action="/admin/jobs/${job.id}/edit">
    <div class="field-group">
      <div class="field">
        <label for="title">Job title</label>
        <input id="title" name="title" type="text" value="${job.title}" />
      </div>
      <div class="field">
        <label for="company">Company</label>
        <input id="company" name="company" type="text" value="${job.company || ""}" />
      </div>
      <div class="field">
        <label for="location">Location</label>
        <input id="location" name="location" type="text" value="${job.location || ""}" />
      </div>
    </div>
    <div class="field-group" style="margin-top:0.75rem;">
      <div class="field">
        <label for="type">Job type</label>
        <input id="type" name="type" type="text" value="${job.type || ""}" />
      </div>
      <div class="field">
        <label for="rate">Rate / Salary</label>
        <input id="rate" name="rate" type="text" value="${job.rate || ""}" />
      </div>
      <div class="field">
        <label for="deadline">Application deadline</label>
        <input id="deadline" name="deadline" type="date" value="${job.deadline || ""}" />
      </div>
    </div>
    <div class="field-group" style="margin-top:0.75rem;">
      <div class="field">
        <label for="description">Description</label>
        <textarea id="description" name="description">${job.description || ""}</textarea>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-primary" type="submit">Save changes</button>
      <a class="btn-pill btn-outline" href="/jobs/${job.id}" target="_blank">View on portal</a>
    </div>
  </form>
</section>
`;
  return renderLayout("First Connect • Edit role", content);
}

function renderAdminApplicantsPage(options = {}) {
  const statusFilter = options.status || "all";
  const jobIdFilterRaw = options.jobId;
  const jobIdFilter = jobIdFilterRaw ? parseInt(jobIdFilterRaw, 10) : null;
  const totalApplications = applications.length;
  const statusCounts = applications.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    },
    { new: 0, review: 0, shortlisted: 0, rejected: 0 }
  );
  let visibleApplications = applications;
  if (statusFilter !== "all") {
    visibleApplications = visibleApplications.filter((app) => app.status === statusFilter);
  }
  if (jobIdFilter && !Number.isNaN(jobIdFilter)) {
    visibleApplications = visibleApplications.filter((app) => app.jobId === jobIdFilter);
  }
  const jobForFilter =
    jobIdFilter && !Number.isNaN(jobIdFilter) ? findJob(jobIdFilter) : null;
  const jobFilterQuery = jobForFilter ? `&jobId=${jobForFilter.id}` : "";
  const rows =
    visibleApplications.length > 0
      ? visibleApplications
          .map((app) => {
            const job = findJob(app.jobId);
            const jobTitle = app.jobTitle || (job ? job.title : "") || "Role";
            const jobLink = job ? `/jobs/${job.id}` : "";
            const statusClass =
              app.status === "new"
                ? "status-badge status-new"
                : app.status === "review"
                ? "status-badge status-review"
                : app.status === "shortlisted"
                ? "status-badge status-shortlisted"
                : "status-badge status-rejected";
            const statusLabel =
              app.status === "new"
                ? "New"
                : app.status === "review"
                ? "In review"
                : app.status === "shortlisted"
                ? "Shortlisted"
                : "Rejected";
            const createdDate = app.createdAt ? app.createdAt.split("T")[0] : "";
            return `<tr>
  <td>${app.name || "Unnamed candidate"}</td>
  <td>${jobLink ? `<a href="${jobLink}" target="_blank">${jobTitle}</a>` : jobTitle}</td>
  <td>${app.email || ""}</td>
  <td>${createdDate}</td>
  <td><span class="${statusClass}">${statusLabel}</span></td>
  <td>
    <div class="actions">
      <a class="link-button" href="/admin/applicants/${app.id}">View</a>
      <form method="post" action="/admin/applicants/${app.id}/status">
        <select name="status">
          <option value="new"${app.status === "new" ? " selected" : ""}>New</option>
          <option value="review"${app.status === "review" ? " selected" : ""}>In review</option>
          <option value="shortlisted"${app.status === "shortlisted" ? " selected" : ""}>Shortlisted</option>
          <option value="rejected"${app.status === "rejected" ? " selected" : ""}>Rejected</option>
        </select>
        <button class="btn-outline-small" type="submit">Update</button>
      </form>
    </div>
  </td>
</tr>`;
          })
          .join("")
      : `<tr><td colspan="6" class="muted">No applications yet for this filter.</td></tr>`;

  const content = `
<section class="card">
  <div class="toolbar">
    <div>
      <h1>Applicants</h1>
      <p class="muted">Overview of candidates who have applied to live roles.</p>
    </div>
    <div class="pill">
      <span>${totalApplications} total</span>
      <span>• ${statusCounts.new || 0} new</span>
      <span>• ${statusCounts.shortlisted || 0} shortlisted</span>
    </div>
    <form method="post" action="/admin/logout">
      <button class="btn-pill btn-outline" type="submit">Logout</button>
    </form>
  </div>
    ${
      jobForFilter
        ? `<div class="muted" style="font-size:0.8rem; margin-top:0.25rem;">
      Filtered by role: <strong>${jobForFilter.title}</strong>
      • <a href="/admin/applicants?status=${statusFilter}">Clear role filter</a>
    </div>`
        : ""
    }
  </div>
  <div class="subtabs">
    <a href="/admin/applicants?status=all${jobFilterQuery}" class="subtab${
      statusFilter === "all" ? " subtab-active" : ""
    }">All</a>
    <a href="/admin/applicants?status=new${jobFilterQuery}" class="subtab${
      statusFilter === "new" ? " subtab-active" : ""
    }">New</a>
    <a href="/admin/applicants?status=review${jobFilterQuery}" class="subtab${
      statusFilter === "review" ? " subtab-active" : ""
    }">In review</a>
    <a href="/admin/applicants?status=shortlisted${jobFilterQuery}" class="subtab${
      statusFilter === "shortlisted" ? " subtab-active" : ""
    }">Shortlisted</a>
    <a href="/admin/applicants?status=rejected${jobFilterQuery}" class="subtab${
      statusFilter === "rejected" ? " subtab-active" : ""
    }">Rejected</a>
  </div>
  <table>
    <thead>
      <tr>
        <th>Candidate</th>
        <th>Role</th>
        <th>Email</th>
        <th>Applied on</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</section>
`;
  return renderLayout("First Connect • Applicants", content);
}

function renderAdminApplicantDetailPage(app) {
  const job = findJob(app.jobId);
  const jobTitle = app.jobTitle || (job ? job.title : "") || "Role";
  const jobLink = job ? `/jobs/${job.id}` : "";
  const createdDateTime = app.createdAt || "";
  const statusClass =
    app.status === "new"
      ? "status-badge status-new"
      : app.status === "review"
      ? "status-badge status-review"
      : app.status === "shortlisted"
      ? "status-badge status-shortlisted"
      : "status-badge status-rejected";
  const statusLabel =
    app.status === "new"
      ? "New"
      : app.status === "review"
      ? "In review"
      : app.status === "shortlisted"
      ? "Shortlisted"
      : "Rejected";

  const content = `
<section class="card">
  <div class="toolbar">
    <div>
      <h2>Applicant</h2>
      <p class="muted">Details for this candidate and the role they applied to.</p>
    </div>
    <div style="display:flex; gap:0.5rem;">
      <a class="btn-pill btn-outline" href="/admin/applicants">Back to applicants</a>
      <form method="post" action="/admin/logout">
        <button class="btn-pill btn-outline" type="submit">Logout</button>
      </form>
    </div>
  </div>
  <div style="display:flex; flex-direction:column; gap:0.6rem; font-size:0.9rem;">
    <div><strong>Name:</strong> ${app.name || "Not provided"}</div>
    <div><strong>Email:</strong> ${app.email || "Not provided"}</div>
    <div><strong>Phone:</strong> ${app.phone || "Not provided"}</div>
    <div><strong>Total experience:</strong> ${app.experience || "Not provided"}</div>
    <div><strong>CV / LinkedIn:</strong> ${
      app.cv
        ? `<a href="${app.cv}" target="_blank">${app.cv}</a>`
        : "Not provided"
    }</div>
    <div><strong>Uploaded CV file:</strong> ${
      app.cvFileUrl
        ? `<a href="${app.cvFileUrl}" target="_blank">${
            app.cvOriginalName || "Download CV"
          }</a>`
        : "No file uploaded"
    }</div>
    <div><strong>Applied for:</strong> ${
      jobLink ? `<a href="${jobLink}" target="_blank">${jobTitle}</a>` : jobTitle
    }</div>
    <div><strong>Submitted at:</strong> ${createdDateTime}</div>
    <div><strong>Status:</strong> <span class="${statusClass}">${statusLabel}</span></div>
    <div>
      <strong>Short note:</strong>
      <div style="margin-top:0.25rem;">${app.note || "Candidate did not add an additional note."}</div>
    </div>
  </div>
  <form method="post" action="/admin/applicants/${app.id}/status" style="margin-top:1rem;">
    <div class="field-group">
      <div class="field">
        <label for="status">Update status</label>
        <select id="status" name="status">
          <option value="new"${app.status === "new" ? " selected" : ""}>New</option>
          <option value="review"${app.status === "review" ? " selected" : ""}>In review</option>
          <option value="shortlisted"${app.status === "shortlisted" ? " selected" : ""}>Shortlisted</option>
          <option value="rejected"${app.status === "rejected" ? " selected" : ""}>Rejected</option>
        </select>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-primary" type="submit">Save status</button>
    </div>
  </form>
</section>
`;
  return renderLayout("First Connect • Applicant", content);
}

function renderContactPage() {
  const content = `
<section class="card">
  <div class="toolbar">
    <div>
      <h1>Contact First Connect</h1>
      <p class="muted">Reach out to us for roles, hiring needs or general enquiries.</p>
    </div>
  </div>
  <div class="contact-layout">
    <div class="contact-main">
      <div>
        <strong>Phone</strong>
        <p class="muted" style="margin:0.2rem 0 0;">+91 80621 77087</p>
      </div>
      <div>
        <strong>WhatsApp community</strong>
        <p class="muted" style="margin:0.2rem 0 0;">
          <a href="https://whatsapp.com/channel/0029VbCBe8EICV6jX1TP942" target="_blank">Join our WhatsApp community</a>
        </p>
      </div>
      <div>
        <strong>Email</strong>
        <p class="muted" style="margin:0.2rem 0 0;">
          <a href="mailto:info@firstconnectgroup.com">info@firstconnectgroup.com</a><br />
          <a href="mailto:careers@firstconnectgroup.com">careers@firstconnectgroup.com</a>
        </p>
      </div>
      <div>
        <strong>Working hours</strong>
        <p class="muted" style="margin:0.2rem 0 0;">Monday to Saturday — 10:00 AM to 7:00 PM (IST)</p>
      </div>
      <p class="muted" style="margin-top:0.4rem;">
        You can also reach out to us by email and we will get back to you as soon as possible.
      </p>
      <div class="contact-actions">
        <a href="https://wa.me/918062177087" target="_blank" class="btn-pill btn-primary">Chat with us on WhatsApp</a>
      </div>
    </div>
  </div>
</section>
`;
  return renderLayout("First Connect • Contact", content);
}
function renderJobBoardPage(filters = {}) {
  const q = (filters.q || "").trim();
  const locationFilter = (filters.location || "").trim();
  const typeFilter = (filters.type || "").trim();

  const allActive = jobs.filter((job) => job.status === "active");
  let visibleJobs = allActive;

  if (q) {
    const qLower = q.toLowerCase();
    visibleJobs = visibleJobs.filter((job) => {
      const text = `${job.title || ""} ${job.company || ""} ${job.location || ""} ${job.description || ""}`.toLowerCase();
      return text.includes(qLower);
    });
  }

  if (locationFilter) {
    const locLower = locationFilter.toLowerCase();
    visibleJobs = visibleJobs.filter((job) => (job.location || "").toLowerCase().includes(locLower));
  }

  if (typeFilter) {
    const typeLower = typeFilter.toLowerCase();
    visibleJobs = visibleJobs.filter((job) => (job.type || "").toLowerCase() === typeLower);
  }

  const resultCount = visibleJobs.length;
  const totalActive = allActive.length;
  const hasFilters = !!(q || locationFilter || typeFilter);

  const cards =
    visibleJobs.length
      ? visibleJobs
          .map((job) => {
            return `<article class="job-card">
  <div class="job-row">
    <div>
      <div class="job-title">${job.title || "Untitled role"}</div>
      <div class="job-meta">${job.company || "Company not specified"}${job.location ? " • " + job.location : ""}</div>
    </div>
    <div class="job-meta">${job.rate || ""}</div>
  </div>
  <div class="job-footer">
    <div>
      <span class="badge-type">${job.type || "Full-time"}</span>
    </div>
    <a class="btn-job" href="/jobs/${job.id}">View details</a>
  </div>
</article>`;
          })
          .join("")
      : `<p class="muted">${
          q || locationFilter || typeFilter
            ? "No roles match these filters. Try adjusting or clearing the filters."
            : "No live roles yet. Once the admin posts jobs, they will appear here for applicants."
        }</p>`;

  const content = `
<section class="card">
  <div class="toolbar">
    <div>
      <h1>Job board</h1>
      <p class="muted">Browse open roles shared by First Connect. Click any card to see details.</p>
      <p class="muted" style="margin-top:0.2rem;">Showing ${resultCount} of ${totalActive} active roles</p>
      <p class="muted" style="margin-top:0.2rem; font-size:0.8rem;">
        Hiring for similar roles? <a href="/contact" style="color:#2563eb; font-weight:500;">Talk to the First Connect team</a>.
      </p>
    </div>
    <form class="filters-row" method="get" action="/jobs">
      <div class="field">
        <label for="q">Search</label>
        <input id="q" name="q" type="text" placeholder="Title, company or keywords" value="${q}" />
      </div>
      <div class="field">
        <label for="location">Location</label>
        <input id="location" name="location" type="text" placeholder="e.g. Remote, Berlin" value="${locationFilter}" />
      </div>
      <div class="field">
        <label for="type">Job type</label>
        <select id="type" name="type">
          <option value="">All types</option>
          <option value="Full-time"${typeFilter === "Full-time" ? " selected" : ""}>Full-time</option>
          <option value="Part-time"${typeFilter === "Part-time" ? " selected" : ""}>Part-time</option>
          <option value="Contract"${typeFilter === "Contract" ? " selected" : ""}>Contract</option>
          <option value="Temporary"${typeFilter === "Temporary" ? " selected" : ""}>Temporary</option>
        </select>
      </div>
      <button class="btn-pill btn-outline" type="submit">Filter</button>
      ${
        hasFilters
          ? `<a href="/jobs" class="link-button" style="background-color:transparent;">Clear</a>`
          : ""
      }
    </form>
  </div>
  <div class="job-list">
    ${cards}
  </div>
</section>
`;
  return renderLayout("First Connect • Job board", content);
}

function renderJobDetailPage(job) {
  const content = `
<section class="card">
  <a href="/jobs" class="muted" style="display:inline-block; margin-bottom:0.5rem;">← Back to job board</a>
  <h1 style="margin:0 0 0.35rem 0; font-size:1.4rem;">${job.title || "Untitled role"}</h1>
  <p class="job-meta" style="margin:0 0 0.6rem 0;">
    ${job.company || "Company not specified"}${job.location ? " • " + job.location : ""}
  </p>
  <div style="display:flex; flex-wrap:wrap; gap:0.6rem; margin-bottom:0.75rem; font-size:0.85rem;">
    ${job.type ? `<span class="badge-type">${job.type}</span>` : ""}
    ${job.deadline ? `<span class="badge-remote">Apply by ${job.deadline}</span>` : ""}
  </div>
  ${job.rate ? `<p style="margin:0 0 0.6rem 0; font-size:0.9rem;"><strong>Rate / Salary:</strong> ${job.rate}</p>` : ""}
  <p style="margin:0 0 1rem 0; font-size:0.9rem;">${job.description || "The recruiter has not added a detailed description for this role yet."}</p>
  <div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center; margin:0.75rem 0 1rem 0; font-size:0.82rem;">
    <span class="muted">Share this role</span>
    <button type="button" class="btn-pill btn-outline" data-share-copy data-share-title="${job.title || "Role"}">Copy link</button>
    <a href="#" class="btn-pill btn-outline" data-share-whatsapp data-share-title="${job.title || "Role"}">Share on WhatsApp</a>
  </div>
  <h2 style="margin:0 0 0.6rem 0; font-size:1.05rem;">Apply for this role</h2>
  <form method="post" action="/jobs/${job.id}/apply" enctype="multipart/form-data">
    <div class="field-group">
      <div class="field">
        <label for="name">Full name</label>
        <input id="name" name="name" type="text" placeholder="Your name" />
      </div>
      <div class="field">
        <label for="email">Email</label>
        <input id="email" name="email" type="text" placeholder="you@example.com" />
      </div>
      <div class="field">
        <label for="phone">Phone</label>
        <input id="phone" name="phone" type="text" placeholder="+91 ..." />
      </div>
    </div>
    <div class="field-group" style="margin-top:0.75rem;">
      <div class="field">
        <label for="experience">Total experience</label>
        <input id="experience" name="experience" type="text" placeholder="e.g. 5 years in product management" />
      </div>
      <div class="field">
        <label for="cv">CV / Resume link (required)</label>
        <input id="cv" name="cv" type="text" placeholder="Link to your CV (Drive, Dropbox, etc.)" required />
      </div>
      <div class="field">
        <label for="cvFile">Or attach CV as file (PDF, DOC, DOCX, RTF, ODT)</label>
        <input id="cvFile" name="cvFile" type="file" accept=".pdf,.doc,.docx,.rtf,.odt" />
      </div>
    </div>
    <div class="field-group" style="margin-top:0.75rem;">
      <div class="field">
        <label for="note">Short note</label>
        <textarea id="note" name="note" placeholder="Anything else you would like the recruiter to know."></textarea>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-primary" type="submit">Submit application</button>
    </div>
  </form>
</section>
`;
  return renderLayout(`First Connect • ${job.title || "Role"}`, content);
}

function renderApplicationThankYouPage(job) {
  const title = job && job.title ? job.title : "the role";
  const content = `
<section class="card">
  <h1 style="margin:0 0 0.5rem 0; font-size:1.4rem;">Thank you for applying</h1>
  <p class="muted" style="margin:0 0 1rem 0; font-size:0.9rem;">
    We have received your application${job ? ` for <strong>${title}</strong>` : ""}. The recruiter will review your details and reach out if there is a fit.
  </p>
  <div style="display:flex; flex-wrap:wrap; gap:0.6rem; margin-top:0.25rem;">
    <a href="/jobs" class="btn-pill btn-primary">Browse more roles</a>
    <a href="/" class="btn-pill btn-outline">Back to homepage</a>
  </div>
</section>
`;
  return renderLayout("First Connect • Thank you", content);
}

function renderAdminLoginPage(error) {
  const errorBlock = error
    ? `<div style="margin-bottom:0.9rem; padding:0.6rem 0.75rem; border-radius:10px; background-color:#fef2f2; border:1px solid #fecaca; font-size:0.85rem; color:#b91c1c;">
    ${error}
  </div>`
    : "";
  const content = `
<section class="auth-shell">
  <div class="auth-shell-inner">
    <div class="auth-hero">
      <div class="auth-kicker">Admin portal</div>
      <h1 class="auth-hero-title">Restricted admin login.</h1>
      <p class="auth-hero-subtitle">Only the authorised First Connect admin can access this dashboard.</p>
      <div class="auth-hero-points">
        <div class="auth-hero-point">
          <div class="auth-hero-bullet">✓</div>
          <div>Manage live roles and review incoming applications.</div>
        </div>
        <div class="auth-hero-point">
          <div class="auth-hero-bullet">✓</div>
          <div>Keep candidate statuses up to date for every search.</div>
        </div>
      </div>
      <div class="auth-hero-meta">
        <span>Restricted access</span>
        <span>•</span>
        <span>Only the shared admin email can log in</span>
      </div>
    </div>
    <div class="card auth-card">
      <div style="margin-bottom:0.9rem;">
        <h2 class="auth-header-title">Admin login</h2>
        <p class="auth-subheader">Use the authorised First Connect admin credentials to continue.</p>
      </div>
      ${errorBlock}
      <form method="post" action="/admin/login">
        <div class="field-group">
          <div class="field">
            <label for="admin-email">Admin email</label>
            <input id="admin-email" name="email" type="text" placeholder="Admin email" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-primary" type="submit">Continue</button>
        </div>
        <p class="auth-footnote">Only the authorised admin account can sign in. Other emails are rejected.</p>
      </form>
    </div>
  </div>
</section>
`;
  return renderLayout("First Connect • Admin login", content);
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/jobs", (req, res) => {
  res.send(renderJobBoardPage(req.query || {}));
});

app.get("/jobs/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const job = findJob(id);
  if (!job) {
    res.status(404).send("Job not found");
    return;
  }
  res.send(renderJobDetailPage(job));
});

app.post("/jobs/:id/apply", upload.single("cvFile"), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const job = findJob(id);
  if (!job) {
    res.status(404).send("Job not found");
    return;
  }
  const { name, email, phone, experience, cv, note } = req.body;
  const file = req.file || null;
  const cvFileUrl = file ? `/uploads/${file.filename}` : "";
  const cvOriginalName = file ? file.originalname : "";
  const application = {
    id: nextApplicationId++,
    jobId: job.id,
    jobTitle: job.title || "",
    userId: null,
    name: name || "",
    email: email || "",
    phone: phone || "",
    experience: experience || "",
    cv: cv || "",
    cvFileUrl,
    cvOriginalName,
    note: note || "",
    createdAt: new Date().toISOString(),
    status: "new",
  };
  applications.push(application);
  res.send(renderApplicationThankYouPage(job));
});

app.get("/admin/login", (req, res) => {
  if (isAdminRequest(req)) {
    res.redirect("/admin/jobs");
    return;
  }
  res.send(renderAdminLoginPage());
});

app.post("/admin/login", (req, res) => {
  const emailRaw = req.body.email || "";
  const email = String(emailRaw).trim().toLowerCase();
  const allowed = ADMIN_EMAIL.toLowerCase();
  if (email !== allowed) {
    res.send(
      renderAdminLoginPage("This login is restricted. Only the authorised admin email can sign in.")
    );
    return;
  }
  res.setHeader("Set-Cookie", "adminAuth=1; Path=/; HttpOnly");
  res.redirect("/admin/jobs");
});

app.post("/admin/logout", (req, res) => {
  res.setHeader("Set-Cookie", "adminAuth=; Path=/; Max-Age=0");
  res.redirect("/");
});

app.get("/contact", (req, res) => {
  res.send(renderContactPage());
});

app.get("/admin/jobs", requireAdmin, (req, res) => {
  res.send(renderAdminJobsPage(req.query || {}));
});

app.post("/admin/jobs", requireAdmin, (req, res) => {
  const { title, company, location, type, rate, deadline, description } = req.body;
  const job = {
    id: nextJobId++,
    title: title || "",
    company: company || "",
    location: location || "",
    type: type || "Full-time",
    rate: rate || "",
    deadline: deadline || "",
    description: description || "",
    status: "active",
  };
  jobs.push(job);
  res.redirect("/admin/jobs");
});

app.get("/admin/jobs/:id/edit", requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const job = findJob(id);
  if (!job) {
    res.status(404).send("Job not found");
    return;
  }
  res.send(renderEditJobPage(job));
});

app.post("/admin/jobs/:id/edit", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const job = findJob(id);
  if (!job) {
    res.status(404).send("Job not found");
    return;
  }
  const { title, company, location, type, rate, deadline, description } = req.body;
  job.title = title || "";
  job.company = company || "";
  job.location = location || "";
  job.type = type || "Full-time";
  job.rate = rate || "";
  job.deadline = deadline || "";
  job.description = description || "";
  res.redirect("/admin/jobs");
});

app.post("/admin/jobs/:id/delete", requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  jobs = jobs.filter((job) => job.id !== id);
  res.redirect("/admin/jobs");
});

app.post("/admin/jobs/:id/archive", requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const job = findJob(id);
  if (!job) {
    res.status(404).send("Job not found");
    return;
  }
  job.status = "archived";
  res.redirect("/admin/jobs");
});

app.post("/admin/jobs/:id/activate", requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const job = findJob(id);
  if (!job) {
    res.status(404).send("Job not found");
    return;
  }
  job.status = "active";
  res.redirect("/admin/jobs");
});

app.get("/admin/applicants", requireAdmin, (req, res) => {
  res.send(renderAdminApplicantsPage(req.query || {}));
});

app.get("/admin/applicants/:id", requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const appItem = findApplication(id);
  if (!appItem) {
    res.status(404).send("Application not found");
    return;
  }
  res.send(renderAdminApplicantDetailPage(appItem));
});

app.post("/admin/applicants/:id/status", requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const appItem = findApplication(id);
  if (!appItem) {
    res.status(404).send("Application not found");
    return;
  }
  const { status } = req.body;
  if (status) {
    appItem.status = status;
  }
  res.redirect("/admin/applicants");
});

if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(port, () => {
    console.log(`First Connect portal running on http://localhost:${port}`);
  });
}
