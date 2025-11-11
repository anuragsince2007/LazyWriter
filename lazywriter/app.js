const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// Status tracker state
const steps = ["posted", "in-process", "writing-done", "out-for-delivery", "delivered"];
let currentStepIndex = 0;

function updateStepsUI() {
	const stepEls = $$("#lw-steps .lw-step");
	stepEls.forEach((el, idx) => {
		el.classList.remove("is-active", "is-done");
		if (idx < currentStepIndex) el.classList.add("is-done");
		if (idx === currentStepIndex) el.classList.add("is-active");
	});
}

function nextStep() {
	if (currentStepIndex < steps.length - 1) {
		currentStepIndex += 1;
		updateStepsUI();
	}
}
function prevStep() {
	if (currentStepIndex > 0) {
		currentStepIndex -= 1;
		updateStepsUI();
	}
}

// Handle AI choice toggle
function bindAiModeToggle() {
	const radios = $$('input[name="ai-mode"]');
	const bookUpload = $("#book-upload");
	function refresh() {
		const selected = radios.find(r => r.checked)?.value;
		if (selected === "book") {
			bookUpload.classList.remove("lw-hidden");
		} else {
			bookUpload.classList.add("lw-hidden");
			const bookInput = $("#ai-book");
			if (bookInput) bookInput.value = "";
		}
	}
	radios.forEach(r => r.addEventListener("change", refresh));
	refresh();
}

// Basic "upload" handlers (front-end only stub)
function readFileAsText(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result || ""));
		reader.onerror = reject;
		reader.readAsText(file);
	});
}

function setResult(html) {
	const container = $("#lw-result");
	container.innerHTML = html;
	container.classList.remove("lw-hidden");
	window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

function handleDirectSubmit(e) {
	e.preventDefault();
	const file = /** @type {HTMLInputElement} */ ($("#direct-file")).files?.[0];
	if (!file) return;

	setResult(`
		<div class="lw-title">Direct Assignment Received</div>
		<div class="lw-note">We will write/print your uploaded file by hand and prepare for delivery.</div>
		<ul>
			<li><strong>File</strong>: ${file.name}</li>
			<li><strong>Size</strong>: ${(file.size / 1024).toFixed(1)} KB</li>
			<li><strong>Type</strong>: ${file.type || "unknown"}</li>
		</ul>
		<div class="lw-note">Tip: Use the Next button in the tracker to simulate progress.</div>
	`);
	currentStepIndex = 0;
	updateStepsUI();
}

async function handleAiSubmit(e) {
	e.preventDefault();
	const questionFile = /** @type {HTMLInputElement} */ ($("#ai-questions")).files?.[0];
	if (!questionFile) return;
	const mode = /** @type {HTMLInputElement} */ (document.querySelector('input[name="ai-mode"]:checked')).value;
	const bookFile = /** @type {HTMLInputElement} */ ($("#ai-book")).files?.[0] || null;

	// Front-end only mock: attempt to read text and produce a placeholder "answer"
	let questionsPreview = "";
	try {
		questionsPreview = await readFileAsText(questionFile);
		questionsPreview = questionsPreview.slice(0, 500);
	} catch {
		questionsPreview = "(preview unavailable for this file type)";
	}

	let bookNote = "";
	if (mode === "book" && bookFile) {
		bookNote = `<li><strong>Book</strong>: ${bookFile.name}</li>`;
	}

	setResult(`
		<div class="lw-title">AI Order Posted</div>
		<div class="lw-note">We will generate handwritten, well-structured answers.</div>
		<ul>
			<li><strong>Mode</strong>: ${mode === "global" ? "Global answers" : "Answer only from uploaded book"}</li>
			<li><strong>Questions</strong>: ${questionFile.name}</li>
			${bookNote}
		</ul>
		<div class="lw-title" style="margin-top:10px;">Questions Preview</div>
		<pre style="white-space: pre-wrap; background:#0b1320; border:1px solid #1f2a3a; padding:10px; border-radius:8px; max-height:220px; overflow:auto;">${questionsPreview || "(no text preview)"}</pre>
		<div class="lw-note">Note: This is a local demo. Connect a backend/LLM to generate actual answers.</div>
	`);
	currentStepIndex = 0;
	updateStepsUI();
}

function bindForms() {
	$("#direct-form")?.addEventListener("submit", handleDirectSubmit);
	$("#ai-form")?.addEventListener("submit", handleAiSubmit);

	// CTA buttons trigger hidden inputs
	$("#cta-direct")?.addEventListener("click", () => {
		const input = $("#direct-file");
		if (!input) return;
		input.click();
	});
	$("#direct-file")?.addEventListener("change", () => {
		// Auto-submit direct order on file pick
		handleDirectSubmit(new Event("submit"));
	});

	$("#cta-ai")?.addEventListener("click", () => {
		const input = $("#ai-questions");
		if (!input) return;
		// Ensure AI choice UI is visible after selection
		input.click();
	});
	$("#ai-questions")?.addEventListener("change", async () => {
		// Auto-post with current radio selection; if book is chosen and no file yet, reveal uploader
		const mode = /** @type {HTMLInputElement} */ (document.querySelector('input[name="ai-mode"]:checked'))?.value;
		if (mode === "book" && !$("#ai-book")?.files?.[0]) {
			$("#book-upload")?.classList.remove("lw-hidden");
			return;
		}
		await handleAiSubmit(new Event("submit"));
	});
}

function bindTrackerButtons() {
	$("#next-step")?.addEventListener("click", nextStep);
	$("#prev-step")?.addEventListener("click", prevStep);
}

function main() {
	bindAiModeToggle();
	bindForms();
	bindTrackerButtons();
	updateStepsUI();
}

document.addEventListener("DOMContentLoaded", main);


