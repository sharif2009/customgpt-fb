const state = {
  insights: null,
  comments: [],
  ads: []
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

const number = new Intl.NumberFormat("en-US");

document.getElementById("refreshBtn").addEventListener("click", loadDashboard);

async function loadDashboard() {
  setStatus("commentStatus", "Loading");
  setStatus("adsStatus", "Loading");

  const [reportResult, adsResult] = await Promise.allSettled([
    fetchJson("/api/reports/summary"),
    fetchJson("/api/ads")
  ]);

  if (reportResult.status === "fulfilled") {
    state.insights = reportResult.value.insights;
    state.comments = reportResult.value.comments;
    renderMetrics();
    renderComments();
    setStatus("commentStatus", "Updated");
  } else {
    renderError("commentsList", reportResult.reason.message);
    setStatus("commentStatus", "Needs setup");
  }

  if (adsResult.status === "fulfilled") {
    state.ads = adsResult.value.ads;
    renderAds();
    setStatus("adsStatus", "Updated");
  } else {
    renderError("adsList", adsResult.reason.message);
    setStatus("adsStatus", "Needs setup");
  }
}

function renderMetrics() {
  const insights = state.insights || {};
  document.getElementById("spend").textContent = money.format(Number(insights.spend || 0));
  document.getElementById("impressions").textContent = number.format(Number(insights.impressions || 0));
  document.getElementById("clicks").textContent = number.format(Number(insights.clicks || 0));
  document.getElementById("commentsCount").textContent = number.format(state.comments.length);
}

function renderComments() {
  const target = document.getElementById("commentsList");
  target.innerHTML = "";

  if (!state.comments.length) {
    target.innerHTML = `<div class="row"><p>No recent comments found.</p></div>`;
    return;
  }

  for (const comment of state.comments) {
    const row = document.createElement("article");
    row.className = "row";
    row.innerHTML = `
      <strong>${escapeHtml(comment.from?.name || "Facebook User")}</strong>
      <p>${escapeHtml(comment.message || "No message text")}</p>
      <small>${escapeHtml(comment.created_time || "")}</small>
    `;
    target.appendChild(row);
  }
}

function renderAds() {
  const target = document.getElementById("adsList");
  target.innerHTML = "";

  if (!state.ads.length) {
    target.innerHTML = `<div class="row"><p>No ads found for this ad account.</p></div>`;
    return;
  }

  for (const ad of state.ads) {
    const row = document.createElement("article");
    row.className = "row";
    row.innerHTML = `
      <strong>${escapeHtml(ad.name || ad.id)}</strong>
      <p>Status: ${escapeHtml(ad.status || "UNKNOWN")}</p>
      <small>ID: ${escapeHtml(ad.id)}</small>
      <div class="actions">
        <button class="action-btn active" data-action="ACTIVE" data-id="${escapeHtml(ad.id)}">Resume</button>
        <button class="action-btn pause" data-action="PAUSED" data-id="${escapeHtml(ad.id)}">Pause</button>
      </div>
    `;
    target.appendChild(row);
  }

  target.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => updateAdStatus(button.dataset.id, button.dataset.action));
  });
}

async function updateAdStatus(adId, status) {
  await fetchJson(`/api/ads/${encodeURIComponent(adId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  await loadDashboard();
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

function setStatus(id, value) {
  document.getElementById(id).textContent = value;
}

function renderError(id, message) {
  document.getElementById(id).innerHTML = `<div class="row"><p>${escapeHtml(message)}</p></div>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadDashboard();
