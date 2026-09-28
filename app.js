import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, push, set, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const MEMBERS = [
  { id: "member_1", name: "Đức" }, { id: "member_2", name: "Nam" },
  { id: "member_3", name: "Hùng" }, { id: "member_4", name: "Minh" },
  { id: "member_5", name: "Tuấn" }, { id: "member_6", name: "An" },
  { id: "member_7", name: "Sơn" }
];
const FINE_AMOUNT = 2000;
const HISTORY_LIMIT = 20;
const state = { events: [], connected: false, pending: false, showAll: false, selectedMember: null };
let database;
const money = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const $ = (id) => document.getElementById(id);

function formatMoney(amount) { return `${money.format(amount)} ₫`; }
function initials(name) { return name.trim().split(/\s+/).slice(-1)[0].slice(0, 1).toLocaleUpperCase("vi"); }
function eventDate(event) { return Number(event.timestamp) || 0; }
function isSameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function startOfWeek(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}
function memberFor(id) { return MEMBERS.find((member) => member.id === id); }
function setSyncStatus() {
  const status = $("syncStatus");
  const text = $("syncText");
  status.classList.toggle("is-online", state.connected);
  status.classList.toggle("is-offline", !state.connected);
  text.textContent = state.connected ? "Đã đồng bộ" : "Mất kết nối";
}

function renderMembers() {
  const totals = Object.fromEntries(MEMBERS.map((member) => [member.id, 0]));
  state.events.forEach((event) => { if (totals[event.memberId] !== undefined) totals[event.memberId] += Number(event.amount) || FINE_AMOUNT; });
  $("memberList").innerHTML = MEMBERS.map((member, index) => `
    <button class="member-row" type="button" data-member-id="${member.id}" aria-label="Phạt ${member.name} ${formatMoney(FINE_AMOUNT)}">
      <span class="avatar avatar-${index + 1}">${initials(member.name)}</span>
      <span class="member-info"><strong>${member.name}</strong><small>${money.format(totals[member.id] / FINE_AMOUNT)} lần vi phạm</small></span>
      <span class="member-total">${formatMoney(totals[member.id])}</span>
      <span class="fine-button" aria-hidden="true"><span>+</span></span>
    </button>`).join("");
  $("memberList").querySelectorAll("[data-member-id]").forEach((button) => button.addEventListener("click", () => openConfirm(button.dataset.memberId)));
}

function renderStats() {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const ranges = {
    today: (date) => isSameDay(date, now),
    week: (date) => date >= weekStart && date <= now,
    month: (date) => date >= monthStart && date <= now
  };
  for (const [key, includes] of Object.entries(ranges)) {
    const events = state.events.filter((event) => { const timestamp = eventDate(event); return timestamp > 0 && includes(new Date(timestamp)); });
    $(`${key}Total`).textContent = formatMoney(events.reduce((sum, event) => sum + (Number(event.amount) || FINE_AMOUNT), 0));
    $(`${key}Count`).textContent = `${events.length} ${events.length === 1 ? "lần phạt" : "lần phạt"}`;
  }
  const total = state.events.reduce((sum, event) => sum + (Number(event.amount) || FINE_AMOUNT), 0);
  $("grandTotal").textContent = formatMoney(total);
  $("totalEvents").textContent = `${state.events.length} ${state.events.length === 1 ? "lần phạt" : "lần phạt"} đã ghi nhận`;
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "Đang đồng bộ thời gian…";
  const date = new Date(timestamp);
  const now = new Date();
  const time = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(date);
  if (isSameDay(date, now)) return `Hôm nay, ${time}`;
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (isSameDay(date, yesterday)) return `Hôm qua, ${time}`;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function renderHistory() {
  const sorted = [...state.events].sort((a, b) => eventDate(b) - eventDate(a));
  const visible = state.showAll ? sorted : sorted.slice(0, HISTORY_LIMIT);
  const history = $("historyList");
  if (!visible.length) {
    history.innerHTML = `<div class="empty-state"><span class="empty-icon">✳</span><strong>Chưa có lần phạt nào</strong><span>Khi có vi phạm, hoạt động sẽ xuất hiện ở đây.</span></div>`;
  } else {
    history.innerHTML = visible.map((event, index) => {
      const member = memberFor(event.memberId);
      if (!member) return "";
      return `<article class="history-row"><span class="history-avatar avatar-${(MEMBERS.findIndex((item) => item.id === member.id) % 7) + 1}">${initials(member.name)}</span><span class="history-info"><strong>${member.name}</strong><small>${formatTimestamp(eventDate(event))}</small></span><span class="history-amount">− ${formatMoney(Number(event.amount) || FINE_AMOUNT)}</span><span class="history-index">${String(visible.length - index).padStart(2, "0")}</span></article>`;
    }).join("");
  }
  $("showAllButton").hidden = sorted.length <= HISTORY_LIMIT || state.showAll;
  $("historySummary").textContent = sorted.length ? `${visible.length} / ${sorted.length} lần phạt gần nhất` : "Tối đa 20 lần phạt gần nhất";
}

function renderMemberStats() {
  const totals = MEMBERS.map((member) => {
    const events = state.events.filter((event) => event.memberId === member.id);
    return { member, count: events.length, total: events.reduce((sum, event) => sum + (Number(event.amount) || FINE_AMOUNT), 0) };
  }).sort((a, b) => b.total - a.total || MEMBERS.indexOf(a.member) - MEMBERS.indexOf(b.member));
  const highest = Math.max(...totals.map((item) => item.total), 1);
  $("memberStats").innerHTML = totals.map(({ member, count, total }, index) => {
    const memberIndex = MEMBERS.findIndex((item) => item.id === member.id) + 1;
    return `<div class="stat-member"><span class="rank rank-${index + 1}">${String(index + 1).padStart(2, "0")}</span><span class="stat-avatar avatar-${memberIndex}">${initials(member.name)}</span><span class="stat-member-name">${member.name}<small>${count} lần phạt</small></span><span class="member-progress"><span style="width:${Math.max(total ? 6 : 0, total / highest * 100)}%"></span></span><strong>${formatMoney(total)}</strong></div>`;
  }).join("");
}

function render() { renderMembers(); renderStats(); renderHistory(); renderMemberStats(); }

function openConfirm(memberId) {
  if (!state.connected || state.pending) return showToast(state.pending ? "Đang ghi lần phạt trước đó…" : "Cần kết nối mạng để ghi phạt.", "warning");
  const member = memberFor(memberId);
  if (!member) return;
  state.selectedMember = member;
  $("confirmMessage").innerHTML = `Ghi nhận <strong>${formatMoney(FINE_AMOUNT)}</strong> cho <strong>${member.name}</strong>?`;
  $("confirmDialog").showModal();
}

async function confirmPenalty() {
  const member = state.selectedMember;
  if (!member || state.pending) return;
  state.pending = true;
  $("confirmPenalty").disabled = true;
  $("confirmPenalty").textContent = "Đang lưu…";
  try {
    const eventRef = push(ref(database, "penalties"));
    await set(eventRef, { memberId: member.id, memberName: member.name, amount: FINE_AMOUNT, timestamp: serverTimestamp() });
    $("confirmDialog").close();
    showToast(`Đã ghi phạt ${member.name} · ${formatMoney(FINE_AMOUNT)}`, "success");
  } catch (error) {
    console.error("Không thể lưu lần phạt:", error);
    showToast("Chưa lưu được. Kiểm tra cấu hình Firebase và kết nối mạng.", "error");
  } finally {
    state.pending = false;
    state.selectedMember = null;
    $("confirmPenalty").disabled = false;
    $("confirmPenalty").textContent = "Xác nhận phạt";
  }
}

function showToast(message, kind = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${kind}`;
  toast.innerHTML = `<span class="toast-check">${kind === "success" ? "✓" : "!"}</span><span>${message}</span>`;
  $("toastRegion").append(toast);
  window.setTimeout(() => { toast.classList.add("toast-out"); window.setTimeout(() => toast.remove(), 250); }, 3400);
}

$("todayLabel").textContent = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
$("showAllButton").addEventListener("click", () => { state.showAll = true; renderHistory(); });
$("cancelPenalty").addEventListener("click", () => $("confirmDialog").close());
$("confirmPenalty").addEventListener("click", confirmPenalty);
$("confirmDialog").addEventListener("click", (event) => { if (event.target === $("confirmDialog")) $("confirmDialog").close(); });

const hasConfig = firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.databaseURL.startsWith("https://") && !firebaseConfig.databaseURL.includes("YOUR_");
if (!hasConfig) {
  $("syncText").textContent = "Chưa cấu hình Firebase";
  $("syncStatus").classList.add("is-offline");
  state.events = [];
  render();
  showToast("Thay thông tin mẫu trong firebase-config.js để bắt đầu đồng bộ.", "warning");
} else {
  try {
    const app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    const connectedRef = ref(database, ".info/connected");
    onValue(connectedRef, (snapshot) => { state.connected = snapshot.val() === true; setSyncStatus(); });
    onValue(ref(database, "penalties"), (snapshot) => {
      const value = snapshot.val() || {};
      state.events = Object.entries(value).map(([id, event]) => ({ id, ...event })).filter((event) => memberFor(event.memberId));
      render();
    }, (error) => {
      console.error("Không thể đọc dữ liệu Firebase:", error);
      state.connected = false;
      setSyncStatus();
      showToast("Không đọc được dữ liệu. Hãy kiểm tra Database Rules.", "error");
    });
  } catch (error) {
    console.error("Firebase chưa khởi tạo được:", error);
    $("syncText").textContent = "Lỗi cấu hình Firebase";
    $("syncStatus").classList.add("is-offline");
    render();
  }
}

