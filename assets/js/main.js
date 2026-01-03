const state = {
  query: "",
  tag: "all",
  sort: "updated",
  page: 1,
};

const pageSize = 9;
let allGames = [];

const elements = {
  featured: document.getElementById("featured-card"),
  grid: document.getElementById("games-grid"),
  search: document.getElementById("search"),
  tag: document.getElementById("tag"),
  sort: document.getElementById("sort"),
  prev: document.getElementById("prev"),
  next: document.getElementById("next"),
  pageInfo: document.getElementById("page-info"),
  error: document.getElementById("error-banner"),
  retry: document.getElementById("retry"),
  year: document.getElementById("year"),
  menuToggle: document.querySelector(".menu-toggle"),
  drawer: document.querySelector(".mobile-drawer"),
};

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const toParam = (value) => (value ? value : undefined);

const syncUrl = () => {
  const params = new URLSearchParams();
  params.set("q", state.query);
  if (state.tag !== "all") params.set("tag", state.tag);
  if (state.sort !== "updated") params.set("sort", state.sort);
  if (state.page !== 1) params.set("page", String(state.page));
  const queryString = params.toString();
  const newUrl = queryString ? `?${queryString}` : window.location.pathname;
  window.history.replaceState({}, "", newUrl);
};

const restoreFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  state.query = params.get("q") || "";
  state.tag = params.get("tag") || "all";
  state.sort = params.get("sort") || "updated";
  state.page = Number.parseInt(params.get("page"), 10) || 1;
};

const createTagOptions = (games) => {
  const tags = new Set();
  games.forEach((game) => game.tags.forEach((tag) => tags.add(tag)));
  const options = ["all", ...Array.from(tags).sort()];
  elements.tag.innerHTML = options
    .map((tag) => `<option value="${tag}">${tag === "all" ? "All" : tag}</option>`)
    .join("");
};

const createCover = (game, isFeatured = false) => {
  const wrapper = document.createElement("div");
  wrapper.className = isFeatured ? "featured-media" : "card-media";
  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = `${game.title} cover`;
  img.src = game.cover || "";
  img.onerror = () => {
    img.style.display = "none";
    wrapper.appendChild(createPlaceholder());
  };
  wrapper.appendChild(img);
  if (!game.cover) {
    wrapper.appendChild(createPlaceholder());
  }
  return wrapper;
};

const createPlaceholder = () => {
  const placeholder = document.createElement("div");
  placeholder.className = "cover-placeholder";
  placeholder.innerHTML = `
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="6" y="8" width="36" height="32" rx="6" stroke="currentColor" stroke-width="2"/>
      <circle cx="18" cy="24" r="3" fill="currentColor"/>
      <path d="M28 20h8M28 28h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
    <span>NO COVER</span>
  `;
  return placeholder;
};

const renderFeatured = (games) => {
  const featured = games.find((game) => game.featured) || games[0];
  if (!featured) return;
  elements.featured.innerHTML = "";
  const media = createCover(featured, true);
  const content = document.createElement("div");
  content.className = "featured-content";
  content.innerHTML = `
    <p class="eyebrow">Featured</p>
    <h3>${featured.title}</h3>
    <p class="lead">${featured.description}</p>
    <div class="tag-list">${featured.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
    <p class="meta">Updated ${formatDate(featured.updatedAt)}</p>
    <div class="card-actions">
      <a class="btn" href="${featured.url}" target="_blank" rel="noopener">Main</a>
      ${featured.repo ? `<a class="btn btn-ghost" href="${featured.repo}" target="_blank" rel="noopener">Sumber</a>` : ""}
    </div>
  `;
  elements.featured.append(media, content);
};

const filterGames = () => {
  const query = state.query.toLowerCase();
  let games = allGames.filter((game) => {
    const matchesQuery = !query || game.title.toLowerCase().includes(query) || game.description.toLowerCase().includes(query);
    const matchesTag = state.tag === "all" || game.tags.includes(state.tag);
    return matchesQuery && matchesTag;
  });

  if (state.sort === "updated") {
    games.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } else if (state.sort === "popular") {
    games.sort((a, b) => b.popularity - a.popularity);
  } else {
    games.sort((a, b) => a.title.localeCompare(b.title));
  }

  return games;
};

const renderGames = () => {
  const filtered = filterGames();
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  elements.grid.innerHTML = "";
  paginated.forEach((game) => {
    const card = document.createElement("article");
    card.className = "game-card";
    const media = createCover(game);
    const content = document.createElement("div");
    content.className = "card-content";
    content.innerHTML = `
      <h3>${game.title}</h3>
      <p>${game.description}</p>
      <div class="tag-list">${game.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
      <div class="card-actions">
        <a class="btn" href="${game.url}" target="_blank" rel="noopener">Main</a>
        ${game.repo ? `<a class="btn btn-ghost" href="${game.repo}" target="_blank" rel="noopener">Sumber</a>` : ""}
      </div>
    `;
    card.append(media, content);
    elements.grid.appendChild(card);
  });

  elements.pageInfo.textContent = `Page ${state.page} of ${totalPages}`;
  elements.prev.disabled = state.page === 1;
  elements.next.disabled = state.page === totalPages;

  syncUrl();
};

const handleInput = () => {
  state.query = elements.search.value.trim();
  state.page = 1;
  renderGames();
};

const handleTag = () => {
  state.tag = elements.tag.value;
  state.page = 1;
  renderGames();
};

const handleSort = () => {
  state.sort = elements.sort.value;
  state.page = 1;
  renderGames();
};

const handlePagination = (direction) => {
  state.page = Math.max(1, state.page + direction);
  renderGames();
};

const toggleMenu = () => {
  const isOpen = elements.drawer.classList.toggle("open");
  elements.menuToggle.setAttribute("aria-expanded", String(isOpen));
};

const loadGames = async () => {
  elements.error.hidden = true;
  try {
    const response = await fetch("./data/games.json");
    if (!response.ok) throw new Error("Failed to fetch");
    const data = await response.json();
    allGames = data;
    createTagOptions(allGames);
    restoreFromUrl();
    elements.search.value = state.query;
    elements.tag.value = state.tag;
    elements.sort.value = state.sort;
    renderFeatured(allGames);
    renderGames();
  } catch (error) {
    elements.error.hidden = false;
  }
};

const setupReveal = () => {
  const revealItems = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => observer.observe(item));
};

const init = () => {
  elements.year.textContent = new Date().getFullYear();
  elements.search.addEventListener("input", handleInput);
  elements.tag.addEventListener("change", handleTag);
  elements.sort.addEventListener("change", handleSort);
  elements.prev.addEventListener("click", () => handlePagination(-1));
  elements.next.addEventListener("click", () => handlePagination(1));
  elements.retry.addEventListener("click", loadGames);
  elements.menuToggle.addEventListener("click", toggleMenu);
  document.querySelectorAll(".drawer-nav a").forEach((link) => link.addEventListener("click", () => {
    elements.drawer.classList.remove("open");
    elements.menuToggle.setAttribute("aria-expanded", "false");
  }));
  setupReveal();
  loadGames();
};

init();

window.addEventListener("load", () => {
  const loader = document.getElementById("page-loader");
  if (!loader) return;
  loader.classList.add("is-hidden");
  loader.addEventListener("transitionend", () => loader.remove(), { once: true });
});
