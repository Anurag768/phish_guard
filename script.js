// --- 2. DATASET ---
const services = [
    { id: "01", name: "Facebook", domain: "facebook.com" },
    { id: "02", name: "Twitter (X)", domain: "twitter.com" },
    { id: "06", name: "Google", domain: "google.com" },
    { id: "09", name: "PayPal", domain: "paypal.com" },
    { id: "13", name: "Samsung", domain: "samsung.com" },
    { id: "26", name: "Amazon", domain: "amazon.com" },
    { id: "45", name: "bKash", domain: "bkash.com" },
    { id: "46", name: "Nagad", domain: "nagad.com.bd" },
    { id: "50", name: "PhonePe", domain: "phonepe.com" },
    { id: "03", name: "Instagram", domain: "instagram.com" },
    { id: "10", name: "Microsoft", domain: "microsoft.com" },
    { id: "12", name: "Apple ID", domain: "apple.com" },
    { id: "28", name: "Netflix", domain: "netflix.com" },
    { id: "41", name: "WhatsApp", domain: "whatsapp.com" }
];

// Populate Dropdown
const select = document.getElementById("serviceSelect");
services.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.domain;
    opt.textContent = `[${s.id}] ${s.name}`;
    opt.setAttribute("data-name", s.name);
    select.appendChild(opt);
});

// --- 3. TAB LOGIC ---
function switchTab(tab, evt) {
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));

    const panel = document.getElementById(tab + "Panel");
    if (panel) panel.classList.add("active");

    if (evt && evt.currentTarget) evt.currentTarget.classList.add("active");

    const urlResult = document.getElementById("urlResultArea");
    const smsResult = document.getElementById("smsResultArea");
    if (urlResult) urlResult.style.display = "none";
    if (smsResult) smsResult.style.display = "none";

    if (tab === "history") loadHistory();
}

// Theme toggle
function toggleTheme() {
    const body = document.body;
    const current = body.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    body.setAttribute("data-theme", next);
}

// --- 4. UTILITIES ---
async function pasteTo(id) {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById(id).value = text;
    } catch (e) {
        alert("Use Ctrl+V");
    }
}

function clearInput(inputId, resultId) {
    const input = document.getElementById(inputId);
    if (input) input.value = "";
    if (resultId) {
        const result = document.getElementById(resultId);
        if (result) result.style.display = "none";
    }
}

function copyResult(boxId) {
    const el = document.getElementById(boxId);
    if (!el) return;
    const text = el.innerText || el.textContent;
    navigator.clipboard.writeText(text)
        .then(() => alert("Result copied to clipboard"))
        .catch(() => alert("Unable to copy"));
}

// --- 5. SCAN & HISTORY LOGIC ---
function saveHistory(type, content, result) {
    let history = JSON.parse(localStorage.getItem("phishHistory") || "[]");
    history.unshift({
        time: new Date().toLocaleString(),
        type,
        content,
        result
    });
    history = history.slice(0, 100);
    localStorage.setItem("phishHistory", JSON.stringify(history));
}

function loadHistory() {
    const list = document.getElementById("historyList");
    if (!list) return;
    list.innerHTML = "";
    const history = JSON.parse(localStorage.getItem("phishHistory") || "[]");

    if (history.length === 0) {
        list.innerHTML = "<li>No history yet.</li>";
        return;
    }

    history.forEach(h => {
        const item = document.createElement("li");
        item.style.padding = "8px";
        item.style.borderBottom = "1px dashed rgba(255,255,255,0.04)";

        const htmlTop = `<b>${h.type}</b> - <span style="color:#94a3b8">${h.result}</span><br>
                         <small style="color:#94a3b8">${h.time}</small><br>`;
        item.innerHTML = htmlTop;

        const code = document.createElement("code");
        code.style.color = "#cbd5e1";
        code.style.wordBreak = "break-all";
        code.textContent = h.content;

        item.appendChild(code);
        list.appendChild(item);
    });
}

function clearHistory() {
    if (!confirm("Clear all history?")) return;
    localStorage.removeItem("phishHistory");
    loadHistory();
}

function scanURL() {
    const inputValue = (document.getElementById("urlInput").value || "").trim();
    const resultArea = document.getElementById("urlResultArea");
    const statusBox = document.getElementById("urlStatusBox");
    const precautionBox = document.getElementById("urlPrecautions");
    const officialDomain = select.value;
    const officialName = select.options[select.selectedIndex].getAttribute("data-name");

    if (!inputValue) {
        alert("Enter URL");
        return;
    }

    resultArea.style.display = "block";

    try {
        let url = inputValue.startsWith("http") ? inputValue : "http://" + inputValue;
        const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, "");

        if (hostname === officialDomain || hostname.endsWith("." + officialDomain)) {
            statusBox.className = "result-box safe-bg";
            statusBox.innerHTML = `
                <i class="fa-solid fa-shield-check"></i>
                <strong>SAFE LINK</strong>
                <span class="result-desc">
                    Matches official ${officialName} domain.
                </span>
            `;
            precautionBox.style.display = "none";
            saveHistory("URL Scan", inputValue, "Safe");
        } else {
            statusBox.className = "result-box danger-bg";
            statusBox.innerHTML = `
                <i class="fa-solid fa-skull-crossbones"></i>
                <strong>PHISHING DETECTED</strong>
                <span class="result-desc">
                    Link is <b>${hostname}</b><br>
                    Real site is <b>${officialDomain}</b>
                </span>
            `;
            precautionBox.style.display = "block";
            saveHistory("URL Scan", inputValue, "Phishing");
        }
    } catch (e) {
        statusBox.className = "result-box warning-bg";
        statusBox.innerHTML = `
            <i class="fa-solid fa-circle-question"></i>
            <strong>INVALID URL</strong>
        `;
        precautionBox.style.display = "none";
        saveHistory("URL Scan", inputValue, "Invalid");
    }

    loadHistory();
}

function scanSMS() {
    const textRaw = document.getElementById("smsInput").value || "";
    const text = textRaw.toLowerCase();
    const resultArea = document.getElementById("smsResultArea");
    const statusBox = document.getElementById("smsStatusBox");
    const precautionBox = document.getElementById("smsPrecautions");

    if (!text) {
        alert("Enter Text");
        return;
    }

    resultArea.style.display = "block";

    const triggers = [
        "suspended", "blocked", "kyc", "urgent", "verify",
        "winner", "prize", "expire", "debit", "bank"
    ];
    let score = 0;
    let found = [];

    triggers.forEach(w => {
        if (text.includes(w)) {
            score += 20;
            found.push(w);
        }
    });

    if (/http|www|\.com|\.ly/.test(text)) {
        score += 40;
        found.push("link");
    }

    if (score >= 60) {
        statusBox.className = "result-box danger-bg";
        statusBox.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation"></i>
            <strong>HIGH RISK (SMISHING)</strong>
            <span class="result-desc">Triggers: ${found.join(", ")}</span>
        `;
        precautionBox.style.display = "block";
        saveHistory("SMS Scan", textRaw, "High Risk");
    } else if (score >= 20) {
        statusBox.className = "result-box warning-bg";
        statusBox.innerHTML = `
            <i class="fa-solid fa-exclamation"></i>
            <strong>SUSPICIOUS</strong>
            <span class="result-desc">Triggers: ${found.join(", ")}</span>
        `;
        precautionBox.style.display = "block";
        saveHistory("SMS Scan", textRaw, "Suspicious");
    } else {
        statusBox.className = "result-box safe-bg";
        statusBox.innerHTML = `
            <i class="fa-solid fa-check-circle"></i>
            <strong>SEEMS SAFE</strong>
            <span class="result-desc">No patterns found.</span>
        `;
        precautionBox.style.display = "none";
        saveHistory("SMS Scan", textRaw, "Safe");
    }

    loadHistory();
}

// --- 6. EXPORT FUNCTIONS ---
function exportCSV() {
    const history = JSON.parse(localStorage.getItem("phishHistory") || "[]");
    if (!history.length) {
        alert("No history to export");
        return;
    }
    let csv = "Time,Type,Result,Content\n";
    history.forEach(h => {
        const safeContent = (h.content || "").replace(/"/g, '""');
        const line = `"${h.time}","${h.type}","${h.result}","${safeContent}"`;
        csv += line + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "phishguard_history.csv";
    a.click();
    URL.revokeObjectURL(url);
}

function exportTXT() {
    const history = JSON.parse(localStorage.getItem("phishHistory") || "[]");
    if (!history.length) {
        alert("No history to export");
        return;
    }
    let txt = "";
    history.forEach(h => {
        txt += `${h.time} | ${h.type} | ${h.result}\n${h.content}\n\n`;
    });
    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "phishguard_history.txt";
    a.click();
    URL.revokeObjectURL(url);
}

async function exportPDF() {
    const { jsPDF } = window.jspdf;
    const history = JSON.parse(localStorage.getItem("phishHistory") || "[]");
    if (!history.length) {
        alert("No history to export");
        return;
    }
    const doc = new jsPDF();
    doc.setFontSize(12);
    let y = 12;
    doc.text("PhishGuard Scan History", 14, y);
    y += 8;

    history.forEach(h => {
        const block = `${h.time} | ${h.type} | ${h.result}`;
        const lines = doc.splitTextToSize(h.content, 180);

        if (y > 270) {
            doc.addPage();
            y = 12;
        }

        doc.text(block, 14, y);
        y += 6;

        doc.text(lines, 14, y);
        y += lines.length * 6 + 6;
    });

    doc.save("phishguard_history.pdf");
}

// --- 7. QR CODE SCANNING (html5-qrcode) ---
let html5QrCode = null;

function startQR() {
    const region = document.getElementById("qrRegion");
    region.classList.add("show");
    document.getElementById("startQrBtn").style.display = "none";
    document.getElementById("stopQrBtn").style.display = "inline-block";

    if (html5QrCode) return;

    const qrReader = document.getElementById("qr-reader");
    html5QrCode = new Html5Qrcode("qr-reader");

    Html5Qrcode.getCameras()
        .then(cameras => {
            const cameraId = cameras && cameras.length ? cameras[0].id : null;
            const config = { fps: 10, qrbox: { width: 250, height: 250 } };
            if (cameraId) {
                html5QrCode
                    .start(cameraId, config, qrSuccess, qrError)
                    .catch(err => {
                        alert("Camera start failed: " + err);
                    });
            } else {
                alert("No camera found");
            }
        })
        .catch(err => alert("Camera access error: " + err));
}

function stopQR() {
    const region = document.getElementById("qrRegion");
    region.classList.remove("show");
    document.getElementById("startQrBtn").style.display = "inline-block";
    document.getElementById("stopQrBtn").style.display = "none";

    if (html5QrCode) {
        html5QrCode
            .stop()
            .then(() => {
                html5QrCode.clear();
                html5QrCode = null;
            })
            .catch(() => {
                html5QrCode = null;
            });
    }
}

function qrSuccess(decodedText /*, decodedResult*/) {
    document.getElementById("urlInput").value = decodedText;
    stopQR();
    scanURL();
}

function qrError(/*err*/) {
    // silent
}

// --- 8. PASSWORD TOOLS ---
function testPassword() {
    const pw = document.getElementById("pwTest").value || "";
    const resultEl = document.getElementById("pwResult");

    if (!pw) {
        resultEl.textContent = "Enter a password to test.";
        return;
    }

    let score = 0;
    if (pw.length >= 8) score += 25;
    if (pw.length >= 12) score += 25;
    if (/[A-Z]/.test(pw)) score += 15;
    if (/[a-z]/.test(pw)) score += 15;
    if (/[0-9]/.test(pw)) score += 10;
    if (/[^A-Za-z0-9]/.test(pw)) score += 10;

    let label = "Weak";
    let color = "#ff0055";

    if (score >= 80) {
        label = "Very Strong";
        color = "#00ff80";
    } else if (score >= 60) {
        label = "Strong";
        color = "#22c55e";
    } else if (score >= 40) {
        label = "Medium";
        color = "#ffaa00";
    }

    resultEl.innerHTML = `
        <b style="color:${color}">${label}</b> (Score: ${score}/100)
        <br>
        <small>Use 12+ characters, mix of upper/lowercase, numbers and symbols.</small>
    `;
}

function generatePassword() {
    const length = 16;
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}<>?";
    let pw = "";
    for (let i = 0; i < length; i++) {
        pw += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const out = document.getElementById("genPw");
    out.textContent = pw;
}

// --- 9. INIT ---
loadHistory();
