const STORAGE_PREFIX = "interviewQuizNotes:";

const state = {
  originalQuestions: [],
  deck: [],
  currentIndex: 0,
  answerVisible: false,
};

const els = {
  statusPanel: document.querySelector("#statusPanel"),
  quizCard: document.querySelector("#quizCard"),
  progressText: document.querySelector("#progressText"),
  questionId: document.querySelector("#questionId"),
  questionText: document.querySelector("#questionText"),
  answerBlock: document.querySelector("#answerBlock"),
  answerText: document.querySelector("#answerText"),
  showAnswerBtn: document.querySelector("#showAnswerBtn"),
  copyBtn: document.querySelector("#copyBtn"),
  prevBtn: document.querySelector("#prevBtn"),
  nextBtn: document.querySelector("#nextBtn"),
  reshuffleBtn: document.querySelector("#reshuffleBtn"),
  noteInput: document.querySelector("#noteInput"),
  exportJsonBtn: document.querySelector("#exportJsonBtn"),
  exportReportBtn: document.querySelector("#exportReportBtn"),
  toast: document.querySelector("#toast"),
};

function normalizeQuestion(item, index) {
  return {
    id: item.id ?? index + 1,
    question: String(item.question ?? "").trim(),
    answer: String(item.answer ?? "").trim(),
    note: String(item.note ?? ""),
  };
}

function storageKey(id) {
  return `${STORAGE_PREFIX}${id}`;
}

function getSavedNote(question) {
  return localStorage.getItem(storageKey(question.id)) ?? question.note ?? "";
}

function setSavedNote(question, note) {
  localStorage.setItem(storageKey(question.id), note);
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function currentQuestion() {
  return state.deck[state.currentIndex];
}

function render() {
  const question = currentQuestion();
  if (!question) return;

  els.progressText.textContent = `Question ${state.currentIndex + 1} of ${state.deck.length}`;
  els.questionId.textContent = `#${question.id}`;
  els.questionText.textContent = question.question;
  els.answerText.textContent = question.answer;
  els.answerBlock.classList.toggle("hidden", !state.answerVisible);
  els.showAnswerBtn.textContent = state.answerVisible ? "Hide answer" : "Show answer";
  els.prevBtn.disabled = state.currentIndex === 0;
  els.nextBtn.disabled = state.currentIndex === state.deck.length - 1;
  els.noteInput.value = getSavedNote(question);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => els.toast.classList.remove("visible"), 2300);
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch (error) {
    showToast("Clipboard blocked. Select and copy manually from the export/download instead.");
    console.error(error);
  }
}

function questionAnswerText(question) {
  return `Q: ${question.question}\n\nA: ${question.answer}`;
}

function mergedQuestions() {
  return state.originalQuestions.map((question) => ({
    ...question,
    note: getSavedNote(question),
  }));
}

function buildNotesReport() {
  const withNotes = mergedQuestions().filter((question) => question.note.trim().length > 0);

  if (withNotes.length === 0) {
    return "Interview Quiz notes report\n\nNo notes yet.";
  }

  return [
    "Interview Quiz notes report",
    "Send this to Hermes when you want the question deck updated.",
    "",
    ...withNotes.map((question) => [
      `#${question.id}`,
      `Q: ${question.question}`,
      `A: ${question.answer}`,
      `Note: ${question.note}`,
    ].join("\n")),
  ].join("\n\n---\n\n");
}

function downloadJson() {
  const data = JSON.stringify(mergedQuestions(), null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "questions-with-notes.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Downloaded updated JSON with your notes.");
}

function move(delta) {
  const nextIndex = state.currentIndex + delta;
  if (nextIndex < 0 || nextIndex >= state.deck.length) return;
  state.currentIndex = nextIndex;
  state.answerVisible = false;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function reshuffle() {
  state.deck = shuffle(state.originalQuestions);
  state.currentIndex = 0;
  state.answerVisible = false;
  render();
  showToast("Deck shuffled.");
}

async function loadQuestions() {
  try {
    const response = await fetch("questions.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load questions.json (${response.status})`);
    const raw = await response.json();
    if (!Array.isArray(raw)) throw new Error("questions.json must contain an array of questions.");

    state.originalQuestions = raw.map(normalizeQuestion).filter((item) => item.question && item.answer);
    if (state.originalQuestions.length === 0) throw new Error("No valid questions found in questions.json.");

    state.deck = shuffle(state.originalQuestions);
    els.statusPanel.classList.add("hidden");
    els.quizCard.classList.remove("hidden");
    render();
  } catch (error) {
    els.statusPanel.textContent = `Problem loading quiz: ${error.message}`;
    console.error(error);
  }
}

els.showAnswerBtn.addEventListener("click", () => {
  state.answerVisible = !state.answerVisible;
  render();
});

els.copyBtn.addEventListener("click", () => copyText(questionAnswerText(currentQuestion()), "Copied question and answer."));
els.prevBtn.addEventListener("click", () => move(-1));
els.nextBtn.addEventListener("click", () => move(1));
els.reshuffleBtn.addEventListener("click", reshuffle);
els.exportJsonBtn.addEventListener("click", downloadJson);
els.exportReportBtn.addEventListener("click", () => copyText(buildNotesReport(), "Copied notes report."));

els.noteInput.addEventListener("input", () => {
  const question = currentQuestion();
  if (question) setSavedNote(question, els.noteInput.value);
});

loadQuestions();
