/* Campus Event Finder: behavior (vanilla JavaScript, no libraries) */

(() => {
  "use strict";

  /* ================= Data ================= */
  const CATEGORIES = ["Academic", "Arts", "Career", "Social", "Sports", "Wellness"];

  const SEED_EVENTS = [
    { id: "e1", name: "Fall Career & Internship Fair", date: "2026-11-10", time: "10:00", category: "Career", location: "Student Union Ballroom", description: "Meet recruiters from more than 60 employers hiring for internships and full-time roles. Bring a few printed résumés.", going: 214 },
    { id: "e2", name: "Intro to Python Workshop", date: "2026-11-12", time: "16:00", category: "Academic", location: "Library, Room 204", description: "A two-hour, hands-on session for total beginners. Laptops are provided if you don’t have one.", going: 38 },
    { id: "e3", name: "Intramural Flag Football Finals", date: "2026-11-14", time: "13:00", category: "Sports", location: "North Recreation Fields", description: "The top four intramural teams play for the fall championship. Free hot cider for everyone in the stands.", going: 96 },
    { id: "e4", name: "Open Mic Night", date: "2026-11-18", time: "19:00", category: "Arts", location: "The Grind Coffeehouse", description: "Poetry, music, and comedy from student performers. The sign-up sheet opens at 6:30 at the counter.", going: 57 },
    { id: "e5", name: "Fall Choir Concert", date: "2026-11-20", time: "19:30", category: "Arts", location: "Whitfield Concert Hall", description: "The University Chorale and Chamber Singers perform American folk songs and choral classics.", going: 131 },
    { id: "e6", name: "Friendsgiving Potluck", date: "2026-11-23", time: "18:00", category: "Social", location: "Global Center Lounge", description: "Bring a dish from home or just bring yourself. Hosted by the International Student Association.", going: 74 },
    { id: "e7", name: "Résumé Review Drop-ins", date: "2026-12-01", time: "11:00", category: "Career", location: "Career Center, Suite 110", description: "Get 15 minutes of one-on-one feedback from a career advisor. No appointment needed.", going: 22 },
    { id: "e8", name: "Finals Week Yoga & Stretch", date: "2026-12-03", time: "17:30", category: "Wellness", location: "Rec Center, Studio B", description: "An easygoing 45-minute class to reset before exams. Mats provided, and all levels are welcome.", going: 41 },
    { id: "e9", name: "Study Abroad Info Session", date: "2026-12-04", time: "15:00", category: "Academic", location: "Hartley Hall, Room 120", description: "Learn about semester and summer programs in 30 countries, plus scholarships that help cover costs.", going: 29 },
    { id: "e10", name: "Winter Basketball Doubleheader", date: "2026-12-05", time: "14:00", category: "Sports", location: "Memorial Fieldhouse", description: "The women’s and men’s varsity teams take on conference rivals. Students get in free with ID.", going: 187 },
    { id: "e11", name: "Midnight Breakfast", date: "2026-12-08", time: "23:00", category: "Social", location: "Dining Commons", description: "Faculty and staff serve pancakes, eggs, and coffee to fuel late-night studying. Free with student ID.", going: 302 },
    { id: "e12", name: "Pet Therapy Hour", date: "2026-12-09", time: "12:00", category: "Wellness", location: "Library Atrium", description: "Take a study break with certified therapy dogs from the county animal shelter.", going: 118 }
  ];

  const STORE_KEY = "campus-event-finder:v1";
  const DEFAULT_FILTERS = { query: "", category: "All", month: "all", savedOnly: false };

  const ICON_PATHS = {
    pin: '<path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.3"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    star: '<path d="M12 3.6l2.55 5.17 5.7.83-4.13 4.02.98 5.68L12 16.62 6.9 19.3l.98-5.68L3.75 9.6l5.7-.83z"/>',
    check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };

  /* ================= Element references ================= */
  const $ = (id) => document.getElementById(id);
  const els = {
    tally: $("tally"),
    search: $("search"),
    month: $("month"),
    sort: $("sort"),
    savedOnly: $("savedOnly"),
    chips: $("chips"),
    reset: $("reset"),
    viewButtons: document.querySelectorAll("[data-view]"),
    openForm: $("openForm"),
    openFormLabel: $("openFormLabel"),
    formPanel: $("formPanel"),
    form: $("eventForm"),
    cancelForm: $("cancelForm"),
    descCount: $("desc-count"),
    summary: $("summary"),
    events: $("events"),
    empty: $("empty"),
    emptyTitle: $("emptyTitle"),
    emptyText: $("emptyText"),
    emptyBtn: $("emptyBtn"),
    toast: $("toast"),
    toastText: $("toastText"),
    toastBtn: $("toastBtn")
  };
  const field = {
    name: $("ev-name"),
    category: $("ev-category"),
    date: $("ev-date"),
    time: $("ev-time"),
    location: $("ev-location"),
    description: $("ev-description")
  };
  const REQUIRED_FIELDS = ["name", "category", "date", "location", "description"];

  /* ================= State ================= */
  const state = {
    events: [],
    saved: new Set(),
    going: new Set(),
    filters: { ...DEFAULT_FILTERS, sort: "date-asc" },
    view: "grid"
  };

  /* ================= Helpers ================= */
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function icon(name) {
    const t = document.createElement("template");
    t.innerHTML = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICON_PATHS[name]}</svg>`;
    return t.content.firstElementChild;
  }

  const catVar = (cat) => `var(--cat-${cat.toLowerCase()})`;
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function parseDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const monthKey = (iso) => iso.slice(0, 7);
  function monthLabel(key) {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  function formatTime(t) {
    if (!t) return "Time to be announced";
    const [h, min] = t.split(":").map(Number);
    return `${h % 12 || 12}:${String(min).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  }
  const sortKey = (e) => `${e.date}T${e.time || "00:00"}`;
  const goingCount = (e) => (e.going || 0) + (state.going.has(e.id) ? 1 : 0);
  const findEvent = (id) => state.events.find((e) => e.id === id);

  function queryTerms() {
    return state.filters.query.trim().toLowerCase().split(/\s+/).filter(Boolean)
      .sort((a, b) => b.length - a.length);
  }

  function isValidEvent(e) {
    return e && typeof e.id === "string" && typeof e.name === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(e.date) && CATEGORIES.includes(e.category) &&
      typeof e.location === "string" && typeof e.description === "string";
  }

  /* Writes text into a node, wrapping search matches in <mark> (no innerHTML, so user text stays safe) */
  function setHighlighted(node, text, terms) {
    node.textContent = "";
    if (!terms.length) { node.textContent = text; return; }
    const pattern = new RegExp(terms.map(escapeRegExp).join("|"), "gi");
    let last = 0;
    for (const m of text.matchAll(pattern)) {
      if (m.index > last) node.append(text.slice(last, m.index));
      node.append(el("mark", null, m[0]));
      last = m.index + m[0].length;
    }
    if (last < text.length) node.append(text.slice(last));
  }

  /* ================= Storage ================= */
  function load() {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch (err) { stored = null; }
    const custom = stored && Array.isArray(stored.custom) ? stored.custom.filter(isValidEvent) : [];
    state.events = SEED_EVENTS.map((e) => ({ ...e, custom: false }))
      .concat(custom.map((e) => ({ ...e, going: 0, custom: true })));
    if (stored) {
      (stored.saved || []).forEach((id) => state.saved.add(id));
      (stored.going || []).forEach((id) => state.going.add(id));
      if (stored.view === "list") state.view = "list";
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        saved: [...state.saved],
        going: [...state.going],
        custom: state.events.filter((e) => e.custom),
        view: state.view
      }));
    } catch (err) { /* Storage unavailable: changes last for this visit only. */ }
  }

  /* ================= Filtering & sorting ================= */
  function matches(e, terms = queryTerms()) {
    const f = state.filters;
    if (f.category !== "All" && e.category !== f.category) return false;
    if (f.month !== "all" && monthKey(e.date) !== f.month) return false;
    if (f.savedOnly && !state.saved.has(e.id)) return false;
    if (terms.length) {
      const haystack = `${e.name} ${e.location} ${e.description} ${e.category}`.toLowerCase();
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    return true;
  }

  const SORTERS = {
    "date-asc": (a, b) => sortKey(a).localeCompare(sortKey(b)),
    "date-desc": (a, b) => sortKey(b).localeCompare(sortKey(a)),
    "name": (a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
    "popular": (a, b) => goingCount(b) - goingCount(a) || sortKey(a).localeCompare(sortKey(b))
  };

  function filtersActive() {
    const f = state.filters;
    return Boolean(f.query.trim()) || f.category !== "All" || f.month !== "all" || f.savedOnly;
  }

  function resetFilters() {
    state.filters = { ...DEFAULT_FILTERS, sort: state.filters.sort };
    els.search.value = "";
    els.month.value = "all";
    els.savedOnly.checked = false;
  }

  /* ================= Building the DOM ================= */
  function buildChips() {
    els.chips.replaceChildren();
    ["All", ...CATEGORIES].forEach((cat) => {
      const b = el("button", "chip");
      b.type = "button";
      b.dataset.category = cat;
      if (cat !== "All") {
        b.style.setProperty("--c", catVar(cat));
        const dot = el("span", "chip-dot");
        dot.setAttribute("aria-hidden", "true");
        b.append(dot);
      }
      b.append(el("span", null, cat), el("span", "chip-count"));
      els.chips.append(b);
    });
  }

  function updateChips() {
    els.chips.querySelectorAll(".chip").forEach((b) => {
      const cat = b.dataset.category;
      const n = cat === "All" ? state.events.length : state.events.filter((e) => e.category === cat).length;
      b.querySelector(".chip-count").textContent = n;
      b.setAttribute("aria-pressed", String(state.filters.category === cat));
    });
  }

  function rebuildMonthOptions() {
    const counts = new Map();
    state.events.forEach((e) => {
      const k = monthKey(e.date);
      counts.set(k, (counts.get(k) || 0) + 1);
    });
    els.month.replaceChildren(new Option(`All months (${state.events.length})`, "all"));
    [...counts.keys()].sort().forEach((k) => {
      els.month.append(new Option(`${monthLabel(k)} (${counts.get(k)})`, k));
    });
    if (state.filters.month !== "all" && !counts.has(state.filters.month)) state.filters.month = "all";
    els.month.value = state.filters.month;
  }

  function actionButton(action, label, pressed, iconName, extraClass) {
    const b = el("button", `act ${extraClass}`);
    b.type = "button";
    b.dataset.action = action;
    b.setAttribute("aria-pressed", String(pressed));
    b.append(icon(iconName), el("span", null, label));
    return b;
  }

  function buildCard(e, terms) {
    const d = parseDate(e.date);
    const card = el("article", "ticket");
    card.dataset.id = e.id;
    card.tabIndex = -1;
    card.style.setProperty("--c", catVar(e.category));
    card.setAttribute("aria-labelledby", `title-${e.id}`);

    // Date stub (visual only; the full date is read out in the meta list)
    const stub = el("div", "stub");
    stub.setAttribute("aria-hidden", "true");
    stub.append(
      el("span", "stub-month", d.toLocaleDateString("en-US", { month: "short" })),
      el("span", "stub-day", String(d.getDate())),
      el("span", "stub-weekday", d.toLocaleDateString("en-US", { weekday: "short" }))
    );

    const body = el("div", "ticket-body");

    const head = el("div", "ticket-head");
    const tag = el("span", "tag");
    setHighlighted(tag, e.category, terms);
    head.append(tag);
    if (e.custom) head.append(el("span", "posted", "Posted by you"));

    const title = el("h3", "ticket-name");
    title.id = `title-${e.id}`;
    setHighlighted(title, e.name, terms);

    const meta = el("ul", "meta");
    const where = el("li");
    const place = el("span");
    setHighlighted(place, e.location, terms);
    where.append(icon("pin"), place);

    const when = el("li");
    const time = el("time");
    time.dateTime = e.time ? `${e.date}T${e.time}` : e.date;
    time.append(
      el("span", "sr-only", d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) + ", "),
      formatTime(e.time)
    );
    when.append(icon("clock"), time);
    meta.append(where, when);

    const desc = el("p", "desc");
    setHighlighted(desc, e.description, terms);

    const actions = el("div", "ticket-actions");
    const isSaved = state.saved.has(e.id);
    const isGoing = state.going.has(e.id);
    actions.append(
      actionButton("save", isSaved ? "Saved" : "Save", isSaved, "star", "act-save"),
      actionButton("rsvp", isGoing ? "Going" : "RSVP", isGoing, isGoing ? "check" : "plus", "act-go"),
      el("span", "going-count", `${goingCount(e)} going`)
    );
    if (e.custom) {
      const rm = el("button", "act-remove", "Remove");
      rm.type = "button";
      rm.dataset.action = "remove";
      actions.append(rm);
    }

    body.append(head, title, meta, desc, actions);
    card.append(stub, body);
    return card;
  }

  /* ================= Rendering ================= */
  function render() {
    const terms = queryTerms();
    const visible = state.events
      .filter((e) => matches(e, terms))
      .sort(SORTERS[state.filters.sort] || SORTERS["date-asc"]);

    const frag = document.createDocumentFragment();
    visible.forEach((e) => frag.append(buildCard(e, terms)));
    els.events.replaceChildren(frag);
    els.events.classList.toggle("is-list", state.view === "list");

    updateChips();
    updateSummary(visible.length);
    updateEmpty(visible.length);
    updateTally();
    els.reset.disabled = !filtersActive();
  }

  function updateSummary(shown) {
    const f = state.filters;
    const total = state.events.length;
    let tail = ` of ${total} ${total === 1 ? "event" : "events"}`;
    if (f.category !== "All") tail += ` in ${f.category}`;
    if (f.month !== "all") tail += ` during ${monthLabel(f.month)}`;
    if (f.query.trim()) tail += ` matching “${f.query.trim()}”`;
    if (f.savedOnly) tail += ", saved only";
    els.summary.replaceChildren("Showing ", el("strong", null, String(shown)), tail + ".");
  }

  function countExisting(set) {
    return state.events.filter((e) => set.has(e.id)).length;
  }

  function updateTally() {
    els.tally.textContent =
      `${state.events.length} events on the calendar. You’ve saved ${countExisting(state.saved)} and RSVP’d to ${countExisting(state.going)}.`;
  }

  function updateEmpty(shown) {
    els.empty.hidden = shown > 0;
    if (shown > 0) return;
    if (state.filters.savedOnly && countExisting(state.saved) === 0) {
      els.emptyTitle.textContent = "You haven’t saved any events yet.";
      els.emptyText.textContent = "Select Save on any event and it will show up here.";
      els.emptyBtn.textContent = "Show all events";
    } else {
      els.emptyTitle.textContent = "No events match these filters.";
      els.emptyText.textContent = "Try a shorter keyword, another category, or a different month.";
      els.emptyBtn.textContent = "Clear filters";
    }
  }

  function setView(view) {
    state.view = view;
    els.viewButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
    els.events.classList.toggle("is-list", view === "list");
    persist();
  }

  /* ================= Toast ================= */
  let toastTimer = null;
  function toast(message, action) {
    clearTimeout(toastTimer);
    els.toastText.textContent = message;
    if (action) {
      els.toastBtn.textContent = action.label;
      els.toastBtn.hidden = false;
      els.toastBtn.onclick = () => { hideToast(); action.onAction(); };
    } else {
      els.toastBtn.hidden = true;
      els.toastBtn.onclick = null;
    }
    els.toast.classList.add("show");
    toastTimer = setTimeout(hideToast, action ? 6000 : 3200);
  }
  function hideToast() {
    els.toast.classList.remove("show");
    els.toastBtn.hidden = true;
  }

  /* ================= Card actions ================= */
  function toggleIn(set, id) {
    if (set.has(id)) { set.delete(id); return false; }
    set.add(id);
    return true;
  }

  function refocus(id, action) {
    const btn = els.events.querySelector(`[data-id="${id}"] [data-action="${action}"]`);
    if (btn) btn.focus({ preventScroll: true });
    else els.summary.focus({ preventScroll: true });
  }

  function removeEvent(id) {
    const index = state.events.findIndex((e) => e.id === id);
    if (index < 0) return;
    const [removed] = state.events.splice(index, 1);
    const wasSaved = state.saved.delete(id);
    const wasGoing = state.going.delete(id);
    persist();
    rebuildMonthOptions();
    render();
    els.summary.focus({ preventScroll: true });
    toast(`Removed “${removed.name}”.`, {
      label: "Undo",
      onAction: () => {
        state.events.splice(Math.min(index, state.events.length), 0, removed);
        if (wasSaved) state.saved.add(id);
        if (wasGoing) state.going.add(id);
        persist();
        rebuildMonthOptions();
        render();
        toast(`Restored “${removed.name}”.`);
      }
    });
  }

  els.events.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.closest(".ticket").dataset.id;
    const action = btn.dataset.action;
    const event = findEvent(id);
    if (!event) return;

    if (action === "remove") { removeEvent(id); return; }
    if (action === "save") {
      const nowSaved = toggleIn(state.saved, id);
      toast(nowSaved ? `Saved “${event.name}”.` : `“${event.name}” is no longer saved.`);
    }
    if (action === "rsvp") {
      const nowGoing = toggleIn(state.going, id);
      toast(nowGoing ? `You’re going to “${event.name}”.` : `RSVP canceled for “${event.name}”.`);
    }
    persist();
    render();
    refocus(id, action);
  });

  /* ================= Filters ================= */
  els.search.addEventListener("input", () => {
    state.filters.query = els.search.value;
    render();
  });
  els.month.addEventListener("change", () => {
    state.filters.month = els.month.value;
    render();
  });
  els.sort.addEventListener("change", () => {
    state.filters.sort = els.sort.value;
    render();
  });
  els.savedOnly.addEventListener("change", () => {
    state.filters.savedOnly = els.savedOnly.checked;
    render();
  });
  els.chips.addEventListener("click", (ev) => {
    const chip = ev.target.closest(".chip");
    if (!chip) return;
    const cat = chip.dataset.category;
    // Clicking the active category again goes back to All
    state.filters.category = (cat !== "All" && state.filters.category === cat) ? "All" : cat;
    render();
  });
  els.reset.addEventListener("click", () => {
    resetFilters();
    render();
    els.search.focus();
  });
  els.emptyBtn.addEventListener("click", () => {
    resetFilters();
    render();
    els.summary.focus({ preventScroll: true });
  });
  els.viewButtons.forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));

  /* ================= Add-event form ================= */
  CATEGORIES.forEach((c) => field.category.append(new Option(c, c)));

  function openForm() {
    els.formPanel.hidden = false;
    els.openForm.setAttribute("aria-expanded", "true");
    els.openFormLabel.textContent = "Close form";
    field.name.focus();
  }
  function closeForm(returnFocus) {
    els.formPanel.hidden = true;
    els.openForm.setAttribute("aria-expanded", "false");
    els.openFormLabel.textContent = "Add an event";
    els.form.reset();
    showErrors({});
    updateCounter();
    if (returnFocus) els.openForm.focus();
  }
  els.openForm.addEventListener("click", () => {
    if (els.formPanel.hidden) openForm(); else closeForm(true);
  });
  els.cancelForm.addEventListener("click", () => closeForm(true));

  function updateCounter() {
    els.descCount.textContent = `${field.description.value.length} of 160 characters`;
  }
  field.description.addEventListener("input", updateCounter);

  function validate() {
    const v = (k) => field[k].value.trim();
    const errors = {};
    if (!v("name")) errors.name = "Enter an event name.";
    if (!CATEGORIES.includes(v("category"))) errors.category = "Choose a category.";
    if (!v("date")) errors.date = "Choose a date.";
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(v("date"))) errors.date = "Enter the date as month, day, and year.";
    if (!v("location")) errors.location = "Enter where it’s happening.";
    if (!v("description")) errors.description = "Add a short description.";
    return errors;
  }

  function showErrors(errors) {
    REQUIRED_FIELDS.forEach((k) => {
      const msg = $(`ev-${k}-error`);
      if (errors[k]) {
        field[k].setAttribute("aria-invalid", "true");
        msg.textContent = errors[k];
      } else {
        field[k].removeAttribute("aria-invalid");
        msg.textContent = "";
      }
    });
  }

  // Clear a field's error as soon as it's fixed
  els.form.addEventListener("input", (ev) => {
    const key = REQUIRED_FIELDS.find((k) => field[k] === ev.target);
    if (key && field[key].getAttribute("aria-invalid") === "true" && !validate()[key]) {
      field[key].removeAttribute("aria-invalid");
      $(`ev-${key}-error`).textContent = "";
    }
  });

  function revealCard(id) {
    const card = els.events.querySelector(`[data-id="${id}"]`);
    if (!card) return;
    card.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
    card.focus({ preventScroll: true });
    card.classList.add("is-new");
    setTimeout(() => card.classList.remove("is-new"), 2200);
  }

  els.form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const errors = validate();
    showErrors(errors);
    const firstInvalid = REQUIRED_FIELDS.find((k) => errors[k]);
    if (firstInvalid) { field[firstInvalid].focus(); return; }

    const newEvent = {
      id: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: field.name.value.trim(),
      date: field.date.value,
      time: field.time.value,
      category: field.category.value,
      location: field.location.value.trim(),
      description: field.description.value.trim(),
      going: 0,
      custom: true
    };

    state.events.push(newEvent);
    persist();
    rebuildMonthOptions();

    let note = "";
    if (!matches(newEvent)) {
      resetFilters();
      note = " Filters were cleared so you can see it.";
    }
    render();
    closeForm(false);
    revealCard(newEvent.id);
    toast(`Posted “${newEvent.name}”.${note}`);
  });

  /* ================= Keyboard shortcuts ================= */
  document.addEventListener("keydown", (ev) => {
    const t = ev.target;
    const typing = t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));
    if (ev.key === "/" && !typing && !ev.metaKey && !ev.ctrlKey && !ev.altKey) {
      ev.preventDefault();
      els.search.focus();
      els.search.select();
    } else if (ev.key === "Escape" && !els.formPanel.hidden && els.formPanel.contains(document.activeElement)) {
      closeForm(true);
    }
  });

  /* ================= Start ================= */
  load();
  buildChips();
  rebuildMonthOptions();
  els.sort.value = state.filters.sort;
  setView(state.view);
  render();
})();
