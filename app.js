/* QR Studio – tạo mã QR với mẫu, tùy biến và xuất nhiều độ phân giải */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const PREVIEW_SIZE = 600;
const ALL_SIZES = [256, 512, 1024, 2048, 4096];

const DEFAULT_STYLE = {
  dotType: "square",
  fill: "solid",
  color1: "#000000",
  color2: "#000000",
  rotation: 45,
  cornerSquareType: "square",
  cornerSquareColor: "#000000",
  cornerDotType: "square",
  cornerDotColor: "#000000",
  bgColor: "#ffffff",
  bgTransparent: false,
  margin: 4,
  logo: null,
  logoSize: 0.3,
  ecl: "M",
};

const TEMPLATES = [
  { name: "Cổ điển", style: {} },
  {
    name: "Bo tròn",
    style: { dotType: "rounded", cornerSquareType: "extra-rounded", cornerDotType: "dot" },
  },
  {
    name: "Chấm tròn",
    style: {
      dotType: "dots", color1: "#1f2937",
      cornerSquareType: "dot", cornerSquareColor: "#1f2937",
      cornerDotType: "dot", cornerDotColor: "#1f2937",
    },
  },
  {
    name: "Đại dương",
    style: {
      dotType: "rounded", fill: "linear", color1: "#0ea5e9", color2: "#1e3a8a", rotation: 45,
      cornerSquareType: "extra-rounded", cornerSquareColor: "#1e3a8a",
      cornerDotType: "dot", cornerDotColor: "#0ea5e9",
    },
  },
  {
    name: "Hoàng hôn",
    style: {
      dotType: "classy-rounded", fill: "linear", color1: "#f97316", color2: "#db2777", rotation: 135,
      cornerSquareType: "extra-rounded", cornerSquareColor: "#db2777",
      cornerDotType: "dot", cornerDotColor: "#f97316", bgColor: "#fff7ed",
    },
  },
  {
    name: "Rừng xanh",
    style: {
      dotType: "extra-rounded", color1: "#166534",
      cornerSquareType: "extra-rounded", cornerSquareColor: "#15803d",
      cornerDotType: "dot", cornerDotColor: "#22c55e", bgColor: "#f0fdf4",
    },
  },
  {
    name: "Tím mộng mơ",
    style: {
      dotType: "dots", fill: "radial", color1: "#a855f7", color2: "#4c1d95",
      cornerSquareType: "dot", cornerSquareColor: "#6d28d9",
      cornerDotType: "dot", cornerDotColor: "#a855f7", bgColor: "#faf5ff",
    },
  },
  {
    name: "Thanh lịch",
    style: {
      dotType: "classy", color1: "#111827",
      cornerSquareType: "square", cornerSquareColor: "#111827",
      cornerDotType: "square", cornerDotColor: "#b45309",
    },
  },
  {
    name: "Vàng sang trọng",
    style: {
      dotType: "classy-rounded", fill: "linear", color1: "#facc15", color2: "#a16207", rotation: 90,
      cornerSquareType: "extra-rounded", cornerSquareColor: "#ca8a04",
      cornerDotType: "dot", cornerDotColor: "#fde047", bgColor: "#1c1917",
    },
  },
  {
    name: "Neon",
    style: {
      dotType: "rounded", fill: "linear", color1: "#22d3ee", color2: "#e879f9", rotation: 0,
      cornerSquareType: "extra-rounded", cornerSquareColor: "#22d3ee",
      cornerDotType: "dot", cornerDotColor: "#e879f9", bgColor: "#0b1020",
    },
  },
  {
    name: "Kẹo ngọt",
    style: {
      dotType: "extra-rounded", fill: "linear", color1: "#ec4899", color2: "#8b5cf6", rotation: 45,
      cornerSquareType: "dot", cornerSquareColor: "#ec4899",
      cornerDotType: "dot", cornerDotColor: "#8b5cf6", bgColor: "#fdf2f8",
    },
  },
  {
    name: "Cà phê",
    style: {
      dotType: "square", color1: "#4b2e1e",
      cornerSquareType: "extra-rounded", cornerSquareColor: "#7c4a2d",
      cornerDotType: "square", cornerDotColor: "#4b2e1e", bgColor: "#f5ebe0",
    },
  },
];

const state = {
  type: "url",
  style: { ...DEFAULT_STYLE },
  template: 0,
  size: 1024,
  format: "png",
};

/* ---------- Dữ liệu QR ---------- */

const val = (id) => $("#" + id).value.trim();

// Thư viện mã hóa mỗi ký tự thành 1 byte, nên chuyển sang chuỗi byte UTF‑8 để giữ tiếng Việt có dấu.
function toUtf8Binary(str) {
  return Array.from(new TextEncoder().encode(str), (b) => String.fromCharCode(b)).join("");
}

const escWifi = (s) => s.replace(/([\\;,:"])/g, "\\$1");
const escVcard = (s) => s.replace(/([\\;,])/g, "\\$1");

function buildData() {
  switch (state.type) {
    case "url": {
      let v = val("f-url");
      if (v && !/^[a-z][a-z0-9+.-]*:/i.test(v)) v = "https://" + v;
      return v;
    }
    case "text":
      return $("#f-text").value;
    case "wifi": {
      const ssid = val("f-ssid");
      if (!ssid) return "";
      const enc = $("#f-wenc").value;
      const pass = enc === "nopass" ? "" : `P:${escWifi($("#f-wpass").value)};`;
      const hidden = $("#f-whidden").checked ? "H:true;" : "";
      return `WIFI:T:${enc};S:${escWifi(ssid)};${pass}${hidden};`;
    }
    case "email": {
      const to = val("f-email");
      if (!to) return "";
      const params = [];
      if (val("f-esubject")) params.push("subject=" + encodeURIComponent(val("f-esubject")));
      if (val("f-ebody")) params.push("body=" + encodeURIComponent(val("f-ebody")));
      return `mailto:${to}${params.length ? "?" + params.join("&") : ""}`;
    }
    case "phone": {
      const p = val("f-phone").replace(/[\s.-]/g, "");
      return p ? `tel:${p}` : "";
    }
    case "sms": {
      const p = val("f-smsphone").replace(/[\s.-]/g, "");
      return p ? `SMSTO:${p}:${$("#f-smsbody").value}` : "";
    }
    case "vcard": {
      const first = val("f-vfirst"), last = val("f-vlast");
      const fields = [
        ["TEL", val("f-vphone")],
        ["EMAIL", val("f-vemail")],
        ["ORG", val("f-vorg")],
        ["TITLE", val("f-vtitle")],
        ["URL", val("f-vurl")],
      ];
      const addr = val("f-vaddr");
      if (!first && !last && fields.every(([, v]) => !v) && !addr) return "";
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${escVcard(last)};${escVcard(first)};;;`,
        `FN:${escVcard([first, last].filter(Boolean).join(" "))}`,
        ...fields.filter(([, v]) => v).map(([k, v]) => `${k}:${escVcard(v)}`),
      ];
      if (addr) lines.push(`ADR:;;${escVcard(addr)};;;;`);
      lines.push("END:VCARD");
      return lines.join("\n");
    }
  }
  return "";
}

/* ---------- Tùy chọn cho qr-code-styling ---------- */

function buildOptions(style, data, size, type = "canvas") {
  const dotsOptions = { type: style.dotType, color: style.color1 };
  if (style.fill !== "solid") {
    dotsOptions.gradient = {
      type: style.fill,
      rotation: (style.rotation * Math.PI) / 180,
      colorStops: [
        { offset: 0, color: style.color1 },
        { offset: 1, color: style.color2 },
      ],
    };
  }
  const opts = {
    width: size,
    height: size,
    type,
    data: toUtf8Binary(data),
    margin: Math.round((size * style.margin) / 100),
    qrOptions: { errorCorrectionLevel: style.ecl },
    dotsOptions,
    backgroundOptions: { color: style.bgTransparent ? "transparent" : style.bgColor },
    cornersSquareOptions: { type: style.cornerSquareType, color: style.cornerSquareColor },
    cornersDotOptions: { type: style.cornerDotType, color: style.cornerDotColor },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: Math.round(size * 0.008),
      imageSize: style.logoSize,
      hideBackgroundDots: true,
    },
  };
  if (style.logo) opts.image = style.logo;
  return opts;
}

/* ---------- Xem trước ---------- */

let renderTimer = null;
function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, 80);
}

function render() {
  const box = $("#qr");
  const data = buildData();
  box.innerHTML = "";
  const canDownload = Boolean(data);
  $("#downloadBtn").disabled = !canDownload;
  $("#downloadAllBtn").disabled = !canDownload;

  if (!data) {
    box.innerHTML = '<p class="data-hint">Nhập nội dung để tạo mã QR</p>';
    $("#dataHint").textContent = "";
    return;
  }
  try {
    new QRCodeStyling(buildOptions(state.style, data, PREVIEW_SIZE)).append(box);
    $("#dataHint").textContent = data.length > 120 ? data.slice(0, 120) + "…" : data;
  } catch (err) {
    box.innerHTML = '<p class="data-hint">Nội dung quá dài để mã hóa. Hãy rút ngắn hoặc giảm mức sửa lỗi.</p>';
    $("#downloadBtn").disabled = true;
    $("#downloadAllBtn").disabled = true;
  }
}

/* ---------- Mẫu ---------- */

function renderTemplates() {
  const wrap = $("#templates");
  TEMPLATES.forEach((tpl, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tpl" + (i === state.template ? " active" : "");
    btn.innerHTML = `<div class="tpl-thumb"></div><span>${tpl.name}</span>`;
    const style = { ...DEFAULT_STYLE, ...tpl.style, margin: 6 };
    new QRCodeStyling(buildOptions(style, "QR Studio", 176)).append(btn.firstChild);
    btn.addEventListener("click", () => applyTemplate(i));
    wrap.appendChild(btn);
  });
}

function applyTemplate(i) {
  state.template = i;
  // Giữ lại logo, mức sửa lỗi và lề người dùng đã chọn
  const { logo, logoSize, ecl, margin } = state.style;
  state.style = { ...DEFAULT_STYLE, ...TEMPLATES[i].style, logo, logoSize, ecl, margin };
  $$(".tpl").forEach((el, j) => el.classList.toggle("active", j === i));
  syncControls();
  scheduleRender();
}

/* ---------- Điều khiển tùy chỉnh ---------- */

const CONTROLS = {
  dotType: "o-dotType",
  fill: "o-fill",
  color1: "o-color1",
  color2: "o-color2",
  rotation: "o-rotation",
  cornerSquareType: "o-cornerSquareType",
  cornerSquareColor: "o-cornerSquareColor",
  cornerDotType: "o-cornerDotType",
  cornerDotColor: "o-cornerDotColor",
  bgColor: "o-bgColor",
  bgTransparent: "o-bgTransparent",
  margin: "o-margin",
  logoSize: "o-logoSize",
  ecl: "o-ecl",
};

function syncControls() {
  const s = state.style;
  for (const [key, id] of Object.entries(CONTROLS)) {
    const el = $("#" + id);
    if (el.type === "checkbox") el.checked = s[key];
    else el.value = s[key];
  }
  $$(".grad-only").forEach((el) => el.classList.toggle("hidden", s.fill === "solid"));
  $$(".linear-only").forEach((el) => el.classList.toggle("hidden", s.fill !== "linear"));
  $("#o-bgColor").disabled = s.bgTransparent;
  $("#o-marginOut").textContent = s.margin + "%";
  $("#o-logoSizeOut").textContent = Math.round(s.logoSize * 100) + "%";
  $("#o-logoRemove").hidden = !s.logo;
  $(".file span").textContent = s.logo ? "Đổi ảnh logo…" : "Chọn ảnh logo…";
}

function bindControls() {
  for (const [key, id] of Object.entries(CONTROLS)) {
    const el = $("#" + id);
    el.addEventListener("input", () => {
      let v = el.type === "checkbox" ? el.checked : el.value;
      if (el.type === "range") v = Number(v);
      state.style[key] = v;
      syncControls();
      scheduleRender();
    });
  }

  $("#o-logo").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.style.logo = reader.result;
      // Logo che bớt mã nên tăng mức sửa lỗi lên H
      state.style.ecl = "H";
      syncControls();
      scheduleRender();
      toast("Đã thêm logo – mức sửa lỗi được đặt thành H");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  });

  $("#o-logoRemove").addEventListener("click", () => {
    state.style.logo = null;
    syncControls();
    scheduleRender();
  });
}

/* ---------- Loại nội dung ---------- */

function bindContentForms() {
  $$("#typeTabs .tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.type = tab.dataset.type;
      $$("#typeTabs .tab").forEach((t) => t.classList.toggle("active", t === tab));
      $$(".form").forEach((f) => f.classList.toggle("hidden", f.dataset.form !== state.type));
      scheduleRender();
    });
  });
  $$(".form input, .form textarea, .form select").forEach((el) => {
    el.addEventListener("input", scheduleRender);
    el.addEventListener("change", scheduleRender);
  });
}

/* ---------- Độ phân giải, định dạng & tải xuống ---------- */

function currentSize() {
  if (state.size !== "custom") return state.size;
  const n = Math.round(Number($("#customSize").value));
  return Math.min(8192, Math.max(64, n || 1024));
}

function updateOutInfo() {
  const size = currentSize();
  const fmt = state.format === "svg" ? "SVG (vector, co giãn không vỡ)" : state.format.toUpperCase();
  $("#outInfo").textContent = `Xuất: ${size} × ${size} px · ${fmt}`;
}

function bindOutput() {
  $$("#sizes .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const s = chip.dataset.size;
      state.size = s === "custom" ? "custom" : Number(s);
      $$("#sizes .chip").forEach((c) => c.classList.toggle("active", c === chip));
      $("#customSizeWrap").classList.toggle("hidden", s !== "custom");
      updateOutInfo();
    });
  });
  $("#customSize").addEventListener("input", updateOutInfo);

  $$("#formats .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.format = chip.dataset.format;
      $$("#formats .chip").forEach((c) => c.classList.toggle("active", c === chip));
      updateOutInfo();
    });
  });

  $("#downloadBtn").addEventListener("click", downloadOne);
  $("#downloadAllBtn").addEventListener("click", downloadAll);
}

function exportOptions(size, format) {
  const opts = buildOptions(state.style, buildData(), size, format === "svg" ? "svg" : "canvas");
  // JPEG không hỗ trợ nền trong suốt
  if (format === "jpeg" && state.style.bgTransparent) opts.backgroundOptions.color = "#ffffff";
  return opts;
}

async function withBusy(btn, fn) {
  const label = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = "Đang tạo…";
  try {
    await fn();
  } catch (err) {
    console.error(err);
    toast("Không thể tạo ảnh: " + err.message);
  } finally {
    btn.innerHTML = label;
    btn.disabled = false;
  }
}

function downloadOne() {
  const size = currentSize();
  const format = state.format;
  withBusy($("#downloadBtn"), async () => {
    const qr = new QRCodeStyling(exportOptions(size, format));
    await qr.download({ name: `qr-code-${size}px`, extension: format });
    toast(`Đã tải xuống qr-code-${size}px.${format === "jpeg" ? "jpg" : format}`);
  });
}

function downloadAll() {
  withBusy($("#downloadAllBtn"), async () => {
    const zip = new JSZip();
    for (const size of ALL_SIZES) {
      const blob = await new QRCodeStyling(exportOptions(size, "png")).getRawData("png");
      zip.file(`qr-code-${size}px.png`, blob);
    }
    const content = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = "qr-code-all-sizes.zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("Đã tải xuống gói ZIP gồm " + ALL_SIZES.length + " kích thước");
  });
}

/* ---------- Thông báo ---------- */

let toastTimer = null;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

/* ---------- Khởi động ---------- */

renderTemplates();
syncControls();
bindControls();
bindContentForms();
bindOutput();
updateOutInfo();
render();
