(() => {
  "use strict";

  const STORAGE_KEY = "aperion.frontend.v1";
  const DEFAULT_DATA = {
    appearance: "system",
    recentSearches: [],
    projects: [
      {
        id: "p-university", name: "University", description: "Everything for university.",
        color: "#0071e3", icon: "U", favorite: true, parentId: null, order: 0,
        sections: [
          { id: "s-university-main", name: "General", order: 0 },
          { id: "s-university-work", name: "Coursework", order: 1 }
        ]
      },
      {
        id: "p-aperion", name: "Build Aperion", description: "Design, build and refine Aperion.",
        color: "#5856d6", icon: "A", favorite: true, parentId: null, order: 1,
        sections: [
          { id: "s-aperion-ideas", name: "Ideas", order: 0 },
          { id: "s-aperion-dev", name: "Development", order: 1 },
          { id: "s-aperion-test", name: "Testing", order: 2 }
        ]
      },
      {
        id: "p-personal", name: "Personal", description: "Personal goals and tasks.",
        color: "#34c759", icon: "P", favorite: false, parentId: null, order: 2,
        sections: [{ id: "s-personal-main", name: "General", order: 0 }]
      }
    ],
    tasks: [
      { id:"t1", title:"Finish SQL assignment", notes:"Complete the joins and window functions.", completed:false, priority:"high", favorite:true, projectId:"p-university", sectionId:"s-university-work", parentTaskId:null, order:0, createdAt:Date.now()-500000 },
      { id:"t2", title:"Review data structures", notes:"Focus on trees and graph traversal.", completed:false, priority:"medium", favorite:false, projectId:"p-university", sectionId:"s-university-work", parentTaskId:null, order:1, createdAt:Date.now()-400000 },
      { id:"t3", title:"Refine Aperion sidebar", notes:"Keep it compact and native-looking.", completed:false, priority:"medium", favorite:true, projectId:"p-aperion", sectionId:"s-aperion-dev", parentTaskId:null, order:0, createdAt:Date.now()-300000 },
      { id:"t4", title:"Validate task deletion flow", notes:"Test Recently Deleted and undo.", completed:true, priority:null, favorite:false, projectId:"p-aperion", sectionId:"s-aperion-test", parentTaskId:null, order:0, createdAt:Date.now()-200000 },
      { id:"t5", title:"Read 20 pages", notes:"", completed:false, priority:"low", favorite:false, projectId:null, sectionId:null, parentTaskId:null, order:0, createdAt:Date.now()-100000 }
    ],
    deleted: []
  };

  const state = {
    data: loadData(),
    view: "all",
    selectedProjectId: null,
    searchQuery: "",
    editingTaskId: null,
    lastAction: null
  };

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return clone(DEFAULT_DATA);
      const parsed = JSON.parse(raw);
      return {
        ...clone(DEFAULT_DATA),
        ...parsed,
        projects: parsed.projects || clone(DEFAULT_DATA.projects),
        tasks: parsed.tasks || clone(DEFAULT_DATA.tasks),
        deleted: parsed.deleted || []
      };
    } catch { return clone(DEFAULT_DATA); }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function projectById(id) { return state.data.projects.find(p => p.id === id); }
  function sectionById(project, id) { return project?.sections?.find(s => s.id === id); }
  function activeTasks() { return state.data.tasks.filter(t => !t.deleted); }

  function taskCount() { return activeTasks().filter(t => !t.completed).length; }
  function favoriteCount() { return activeTasks().filter(t => t.favorite).length; }
  function deletedCount() { return state.data.deleted.length; }

  function projectTasks(projectId) {
    return activeTasks().filter(t => t.projectId === projectId);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }

  function priorityHTML(priority) {
    if (!priority) return "";
    const label = priority === "high" ? "P1" : priority === "medium" ? "P2" : "P3";
    return `<span class="priority ${priority}">${label}</span>`;
  }

  function render() {
    renderSidebar();
    renderHeader();
    renderContent();
    bindGlobalInteractions();
  }

  function renderSidebar() {
    $("#allCount").textContent = taskCount() || "";
    $("#favoriteCount").textContent = favoriteCount() || "";
    $("#deletedCount").textContent = deletedCount() || "";

    $$(".nav-item").forEach(btn => {
      btn.classList.toggle("active", state.view === btn.dataset.view && !state.selectedProjectId);
    });

    const container = $("#projectNav");
    const roots = state.data.projects.filter(p => !p.parentId).sort((a,b) => a.order-b.order);
    container.innerHTML = roots.map(project => {
      const active = state.selectedProjectId === project.id;
      const children = state.data.projects.filter(p => p.parentId === project.id).sort((a,b)=>a.order-b.order);
      return `
        <button class="project-row ${active ? "active" : ""}" data-project="${project.id}">
          <span class="project-dot" style="background:${escapeHtml(project.color)}"></span>
          <span>${escapeHtml(project.name)}</span>
          <span class="chevron">${children.length ? "›" : ""}</span>
        </button>
        ${active ? children.map(child => `
          <button class="project-row subproject-row ${state.selectedProjectId===child.id ? "active":""}" data-project="${child.id}">
            <span class="project-dot" style="background:${escapeHtml(child.color)}"></span>
            <span>${escapeHtml(child.name)}</span>
          </button>`).join("") : ""}
      `;
    }).join("");
  }

  function renderHeader() {
    const title = state.selectedProjectId
      ? projectById(state.selectedProjectId)?.name || "Project"
      : ({all:"All Tasks", favorites:"Favorites", search:"Search", deleted:"Recently Deleted", settings:"Settings"}[state.view] || "All Tasks");
    const eyebrow = state.selectedProjectId ? "PROJECT" : "APERION";
    $("#viewEyebrow").textContent = eyebrow;
    $("#viewTitle").textContent = title;
  }

  function renderContent() {
    const root = $("#content");
    if (state.selectedProjectId) {
      root.innerHTML = renderProjectView(projectById(state.selectedProjectId));
      return;
    }

    if (state.view === "settings") {
      root.innerHTML = renderSettings();
      return;
    }
    if (state.view === "search") {
      root.innerHTML = renderSearchPage();
      return;
    }
    if (state.view === "deleted") {
      root.innerHTML = renderDeleted();
      return;
    }
    if (state.view === "favorites") {
      root.innerHTML = renderFavorites();
      return;
    }
    root.innerHTML = renderAllTasks();
  }

  function taskRow(task) {
    const project = projectById(task.projectId);
    const section = sectionById(project, task.sectionId);
    return `
      <div class="task-row ${task.completed ? "completed" : ""}" draggable="true" data-task-id="${task.id}">
        <button class="check ${task.completed ? "done" : ""}" data-complete="${task.id}" aria-label="Toggle completion"></button>
        <div class="task-main" data-open-task="${task.id}">
          <div class="task-title">${escapeHtml(task.title)}</div>
          <div class="task-meta">
            ${priorityHTML(task.priority)}
            ${task.notes ? `<span>${escapeHtml(task.notes.slice(0,70))}</span>` : ""}
            ${project ? `<span>${escapeHtml(project.name)}</span>` : ""}
            ${section ? `<span>· ${escapeHtml(section.name)}</span>` : ""}
          </div>
        </div>
        <div class="task-actions">
          <button class="star ${task.favorite ? "active" : ""}" data-favorite="${task.id}" title="Favorite">${task.favorite ? "★" : "☆"}</button>
        </div>
      </div>`;
  }

  function renderTaskGroups(tasks) {
    const groups = new Map();
    tasks.sort((a,b) => a.order-b.order).forEach(t => {
      const project = projectById(t.projectId);
      const section = sectionById(project, t.sectionId);
      const key = section ? section.id : t.projectId || "unassigned";
      const title = section ? section.name : (project?.name || "Unassigned");
      if (!groups.has(key)) groups.set(key, {title, projectId:t.projectId, tasks:[]});
      groups.get(key).tasks.push(t);
    });

    return [...groups.values()].map(group => `
      <div class="section-block">
        <div class="section-heading"><span>${escapeHtml(group.title)}</span><span class="line"></span><span>${group.tasks.length}</span></div>
        <div class="task-list">${group.tasks.map(taskRow).join("")}</div>
      </div>`).join("");
  }

  function renderAllTasks() {
    const tasks = activeTasks().filter(t => !t.completed);
    const completed = activeTasks().filter(t => t.completed);
    return `<div class="content-inner">
      <div class="view-intro">
        <div><div class="view-description">${taskCount()} active task${taskCount()===1?"":"s"} across your workspace.</div></div>
        <button class="add-inline" data-action="new-task">＋ Add task</button>
      </div>
      ${tasks.length ? renderTaskGroups(tasks) : emptyState("✓", "Nothing left to do", "You’re clear. Add a task whenever something comes up.")}
      ${completed.length ? `<div class="section-block"><div class="section-heading"><span>Completed</span><span class="line"></span><span>${completed.length}</span></div><div class="task-list">${completed.sort((a,b)=>b.createdAt-a.createdAt).map(taskRow).join("")}</div></div>` : ""}
    </div>`;
  }

  function renderFavorites() {
    const tasks = activeTasks().filter(t => t.favorite).sort((a,b)=>a.order-b.order);
    const projects = state.data.projects.filter(p => p.favorite);
    return `<div class="content-inner">
      <div class="view-intro"><div><div class="view-description">Your most important work, without another layer of complexity.</div></div></div>
      ${projects.length ? `<div class="section-block"><div class="section-heading"><span>Projects</span><span class="line"></span></div>${projects.map(p=>`
        <div class="subproject-card" data-project="${p.id}">
          <strong>${escapeHtml(p.name)}</strong><div class="task-meta">${projectTasks(p.id).filter(t=>!t.completed).length} active tasks</div>
        </div>`).join("")}</div>`:""}
      ${tasks.length ? `<div class="section-block"><div class="section-heading"><span>Tasks</span><span class="line"></span><span>${tasks.length}</span></div><div class="task-list">${tasks.map(taskRow).join("")}</div></div>` : emptyState("☆","No favorites yet","Star a task or project and it will appear here.")}
    </div>`;
  }

  function renderProjectView(project) {
    if (!project) return emptyState("?", "Project not found", "The selected project no longer exists.");
    const tasks = projectTasks(project.id);
    const sections = [...project.sections].sort((a,b)=>a.order-b.order);
    const children = state.data.projects.filter(p=>p.parentId===project.id);
    return `<div class="content-inner">
      <div class="project-header">
        <div class="project-icon" style="background:${escapeHtml(project.color)}">${escapeHtml(project.icon)}</div>
        <div><h2>${escapeHtml(project.name)}</h2><p>${escapeHtml(project.description || "No description.")}</p></div>
        <div class="project-actions">
          <button class="icon-button" data-edit-project="${project.id}" title="Edit project">⋯</button>
          <button class="icon-button" data-action="new-task" title="New task">＋</button>
        </div>
      </div>
      ${children.length ? `<div class="section-block"><div class="section-heading"><span>Sub-projects</span><span class="line"></span></div>${children.map(c=>`<div class="subproject-card" data-project="${c.id}"><strong>${escapeHtml(c.name)}</strong><div class="task-meta">${projectTasks(c.id).filter(t=>!t.completed).length} active tasks</div></div>`).join("")}</div>` : ""}
      ${sections.map(section => {
        const sectionTasks = tasks.filter(t=>t.sectionId===section.id).sort((a,b)=>a.order-b.order);
        return `<div class="section-block">
          <div class="section-heading"><span>${escapeHtml(section.name)}</span><span class="line"></span><span>${sectionTasks.length}</span></div>
          ${sectionTasks.length ? `<div class="task-list">${sectionTasks.map(taskRow).join("")}</div>` : `<div class="subproject-card" data-action="new-task">No tasks yet · add one</div>`}
        </div>`;
      }).join("")}
      ${tasks.filter(t=>!t.sectionId).length ? `<div class="section-block"><div class="section-heading"><span>Unsectioned</span><span class="line"></span></div><div class="task-list">${tasks.filter(t=>!t.sectionId).map(taskRow).join("")}</div></div>`:""}
    </div>`;
  }

  function renderSearchPage() {
    return `<div class="content-inner">
      <div class="view-intro"><div><div class="view-description">Search everything instantly — titles, notes, projects and sections.</div></div></div>
      <div class="setting-card" style="margin-bottom:18px">
        <div class="search-line" style="border:0;padding:0">
          <span class="search-symbol">⌕</span>
          <input id="pageSearch" value="${escapeHtml(state.searchQuery)}" placeholder="Search Aperion…" autofocus>
        </div>
      </div>
      <div id="pageSearchResults">${renderSearchResults(state.searchQuery)}</div>
    </div>`;
  }

  function renderSearchResults(query) {
    if (!query.trim()) {
      const recent = state.data.recentSearches || [];
      return recent.length ? `<div class="section-heading"><span>Recent searches</span><span class="line"></span></div>${recent.map(s=>`<button class="search-result" data-recent-search="${escapeHtml(s)}"><span class="result-kind">RECENT</span><div class="result-title">${escapeHtml(s)}</div></button>`).join("")}` : emptyState("⌕","Search Aperion","Start typing to find tasks, projects, sections and notes.");
    }
    const q = query.toLowerCase();
    const results = [];
    activeTasks().forEach(t => {
      if ([t.title,t.notes].some(v=>(v||"").toLowerCase().includes(q))) results.push({kind:"Task",title:t.title,detail:projectById(t.projectId)?.name || "Unassigned",task:t});
      if (t.parentTaskId && (t.title||"").toLowerCase().includes(q)) {}
    });
    state.data.projects.forEach(p => {
      if (p.name.toLowerCase().includes(q) || (p.description||"").toLowerCase().includes(q)) results.push({kind:"Project",title:p.name,detail:p.description||"",project:p});
      p.sections.forEach(s => { if (s.name.toLowerCase().includes(q)) results.push({kind:"Section",title:s.name,detail:p.name,project:p}); });
    });
    if (!results.length) return emptyState("⌕","No matches","Try another word or a task title.");
    return `<div class="section-heading"><span>Results</span><span class="line"></span><span>${results.length}</span></div>
      ${results.map(r=>`<div class="search-result" data-result-kind="${r.kind}" data-result-id="${r.task?.id || r.project?.id || ""}">
        <span class="result-kind">${r.kind}</span><div><div class="result-title">${escapeHtml(r.title)}</div><div class="result-detail">${escapeHtml(r.detail)}</div></div>
      </div>`).join("")}`;
  }

  function renderDeleted() {
    const items = state.data.deleted;
    return `<div class="content-inner">
      <div class="view-intro"><div><div class="view-description">Deleted items stay recoverable for 30 days in the final app.</div></div></div>
      ${items.length ? items.map(item => `<div class="task-row">
        <div class="check"></div><div class="task-main"><div class="task-title">${escapeHtml(item.title || item.name)}</div><div class="task-meta">Deleted ${formatRelative(item.deletedAt)}</div></div>
        <div class="task-actions" style="opacity:1"><button class="star" data-restore="${item.id}" title="Restore">↩</button></div>
      </div>`).join("") : emptyState("⌫","Recently Deleted is empty","Deleted tasks and projects will appear here.")}
    </div>`;
  }

  function renderSettings() {
    return `<div class="content-inner">
      <div class="view-intro"><div><div class="view-description">Aperion stays intentionally quiet. There are very few settings to manage.</div></div></div>
      <div class="settings-grid">
        <div class="setting-card">
          <div class="setting-title">Appearance</div>
          <div class="setting-description">Choose how the prototype follows the system appearance.</div>
          <div class="setting-row"><span>Theme</span><select class="select" id="appearanceSelect"><option value="system" ${state.data.appearance==="system"?"selected":""}>System</option><option value="light" ${state.data.appearance==="light"?"selected":""}>Light</option><option value="dark" ${state.data.appearance==="dark"?"selected":""}>Dark</option></select></div>
        </div>
        <div class="setting-card">
          <div class="setting-title">Local storage</div>
          <div class="setting-description">This prototype stores its state in your browser's local storage. The final app will use SwiftData.</div>
          <div class="setting-row"><span>Prototype data</span><button class="primary-action" id="resetData">Reset demo data</button></div>
        </div>
        <div class="setting-card">
          <div class="setting-title">Privacy</div>
          <div class="setting-description">No account, backend, analytics or cloud service is used by this prototype.</div>
        </div>
      </div>
    </div>`;
  }

  function emptyState(icon, title, description) {
    return `<div class="empty-state"><div><div class="empty-icon">${icon}</div><h2>${title}</h2><p>${description}</p><button class="primary-action" data-action="new-task">Create a task</button></div></div>`;
  }

  function formatRelative(ts) {
    const days = Math.max(0, Math.floor((Date.now()-ts)/86400000));
    return days === 0 ? "today" : `${days} day${days===1?"":"s"} ago`;
  }

  function openTaskModal(taskId = null) {
    state.editingTaskId = taskId;
    const task = taskId ? state.data.tasks.find(t=>t.id===taskId) : {
      id:null,title:"",notes:"",completed:false,priority:null,favorite:false,projectId:state.selectedProjectId,sectionId:null,parentTaskId:null,order:999,createdAt:Date.now(),links:[]
    };
    if (!task) return;
    const project = projectById(task.projectId);
    const subtasks = state.data.tasks.filter(t=>t.parentTaskId===task.id);

    $("#taskModal").innerHTML = `
      <div class="modal-header">
        <input class="modal-title-input" id="modalTitle" value="${escapeHtml(task.title)}" placeholder="Task title" autofocus>
        <button class="close-button" id="closeModal">×</button>
      </div>
      <div class="form-grid">
        <div class="form-field"><label>Notes</label><textarea id="modalNotes" rows="4" placeholder="Add a little context…">${escapeHtml(task.notes||"")}</textarea></div>
        <div class="two-col">
          <div class="form-field"><label>Priority</label><select id="modalPriority"><option value="">None</option><option value="high" ${task.priority==="high"?"selected":""}>P1 — High</option><option value="medium" ${task.priority==="medium"?"selected":""}>P2 — Medium</option><option value="low" ${task.priority==="low"?"selected":""}>P3 — Low</option></select></div>
          <div class="form-field"><label>Project</label><select id="modalProject"><option value="">No Project</option>${state.data.projects.map(p=>`<option value="${p.id}" ${task.projectId===p.id?"selected":""}>${escapeHtml(p.name)}</option>`).join("")}</select></div>
        </div>
        <div class="two-col">
          <div class="form-field"><label>Section</label><select id="modalSection"><option value="">No Section</option>${project?.sections?.map(s=>`<option value="${s.id}" ${task.sectionId===s.id?"selected":""}>${escapeHtml(s.name)}</option>`).join("") || ""}</select></div>
          <div class="form-field"><label>Link</label><input type="url" id="modalLink" placeholder="https://…" value="${escapeHtml((task.links||[])[0]||"")}"></div>
        </div>
        ${taskId ? `<div class="subtasks"><div class="section-heading" style="padding:0 0 5px"><span>Subtasks</span><span class="line"></span></div>${subtasks.map(s=>`<div class="subtask-line"><button class="check ${s.completed?"done":""}" data-complete="${s.id}"></button><input type="text" value="${escapeHtml(s.title)}" data-subtask-input="${s.id}"></div>`).join("")}<div class="subtask-line"><button class="check"></button><input type="text" id="newSubtask" placeholder="Add a subtask…"></div></div>` : ""}
      </div>
      <div class="modal-footer">
        <button class="danger-button" id="deleteTaskModal">${taskId ? "Delete task" : ""}</button>
        <div style="margin-left:auto;display:flex;gap:7px"><button class="icon-button" id="favoriteModal">${task.favorite?"★":"☆"}</button><button class="save-button" id="saveTaskModal">Save Task</button></div>
      </div>`;
    $("#modalBackdrop").classList.remove("hidden");

    $("#closeModal").onclick = closeModal;
    $("#saveTaskModal").onclick = () => saveTaskFromModal(task);
    $("#deleteTaskModal").onclick = () => { if(taskId) { deleteTask(taskId); closeModal(); } };
    $("#favoriteModal").onclick = () => { task.favorite = !task.favorite; $("#favoriteModal").textContent = task.favorite ? "★" : "☆"; };
    $("#modalProject").onchange = () => {
      const p = projectById($("#modalProject").value);
      $("#modalSection").innerHTML = `<option value="">No Section</option>${p?.sections?.map(s=>`<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("") || ""}`;
    };
    $$(".check", $("#taskModal")).forEach(btn => {
      if (btn.dataset.complete) btn.onclick = () => toggleComplete(btn.dataset.complete);
    });
  }

  function saveTaskFromModal(existing) {
    const title = $("#modalTitle").value.trim();
    if (!title) { $("#modalTitle").focus(); return; }

    const projectId = $("#modalProject").value || null;
    const sectionId = projectId ? ($("#modalSection").value || null) : null;
    const payload = {
      title,
      notes: $("#modalNotes").value.trim(),
      priority: $("#modalPriority").value || null,
      projectId,
      sectionId,
      links: $("#modalLink").value.trim() ? [$("#modalLink").value.trim()] : [],
    };

    if (existing.id) {
      Object.assign(existing, payload);
      const subtaskInput = $$(".subtask-line input[data-subtask-input]", $("#taskModal"));
      subtaskInput.forEach(input => {
        const sub = state.data.tasks.find(t=>t.id===input.dataset.subtaskInput);
        if(sub) sub.title = input.value.trim() || sub.title;
      });
      const newSub = $("#newSubtask")?.value.trim();
      if (newSub) state.data.tasks.push({id:uid("task"),title:newSub,notes:"",completed:false,priority:null,favorite:false,projectId,sectionId,parentTaskId:existing.id,order:999,createdAt:Date.now()});
    } else {
      state.data.tasks.push({...existing,...payload,id:uid("task"),createdAt:Date.now()});
    }
    persist(); closeModal(); render(); showToast(existing.id ? "Task updated" : "Task created");
  }

  function closeModal() {
    $("#modalBackdrop").classList.add("hidden");
    state.editingTaskId = null;
  }

  function toggleComplete(id) {
    const task = state.data.tasks.find(t=>t.id===id);
    if (!task) return;
    task.completed = !task.completed;
    task.completedAt = task.completed ? Date.now() : null;
    persist(); render(); showToast(task.completed ? "Task completed" : "Task reopened");
  }

  function toggleFavorite(id) {
    const task = state.data.tasks.find(t=>t.id===id);
    if (!task) return;
    task.favorite = !task.favorite;
    persist(); render();
  }

  function deleteTask(id) {
    const index = state.data.tasks.findIndex(t=>t.id===id);
    if(index<0) return;
    const task = state.data.tasks[index];
    state.data.tasks.splice(index,1);
    state.data.deleted.unshift({...task,deletedAt:Date.now(),type:"task"});
    state.lastAction = {type:"restoreTask", task:clone(task)};
    persist(); render(); showToast("Moved to Recently Deleted", true);
  }

  function restoreItem(id) {
    const index = state.data.deleted.findIndex(x=>x.id===id);
    if(index<0) return;
    const item = state.data.deleted[index];
    state.data.deleted.splice(index,1);
    if(item.type==="task") {
      delete item.deletedAt; delete item.type;
      state.data.tasks.push(item);
    }
    persist(); render(); showToast("Restored");
  }

  function addProject() {
    const name = prompt("Project name");
    if (!name?.trim()) return;
    const color = prompt("Color (hex)", "#0071e3") || "#0071e3";
    const project = {
      id:uid("project"),name:name.trim(),description:"",color,icon:name.trim()[0].toUpperCase(),
      favorite:false,parentId:null,order:state.data.projects.length,sections:[{id:uid("section"),name:"General",order:0}]
    };
    state.data.projects.push(project);
    persist(); render(); showToast("Project created");
  }

  function editProject(id) {
    const project = projectById(id);
    if(!project) return;
    const name = prompt("Project name", project.name);
    if(name?.trim()) project.name = name.trim();
    const description = prompt("Description", project.description || "");
    if(description !== null) project.description = description;
    persist(); render(); showToast("Project updated");
  }

  function showToast(message, undo=false) {
    $("#toastMessage").textContent = message;
    $("#toastUndo").classList.toggle("hidden", !undo);
    $("#toast").classList.remove("hidden");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(()=>$("#toast").classList.add("hidden"), 2600);
  }

  function openSearch() {
    $("#commandOverlay").classList.remove("hidden");
    $("#globalSearch").value = state.searchQuery;
    $("#globalSearch").focus();
    renderCommandResults();
  }

  function closeSearch() { $("#commandOverlay").classList.add("hidden"); }

  function renderCommandResults() {
    $("#searchResults").innerHTML = renderSearchResults($("#globalSearch").value);
    $$("#searchResults .search-result").forEach(el => {
      el.onclick = () => {
        const id = el.dataset.resultId;
        if(el.dataset.resultKind==="Task") { closeSearch(); openTaskModal(id); }
        else if(id) { closeSearch(); state.selectedProjectId=id; state.view="all"; state.searchQuery=""; render(); }
      };
    });
  }

  function bindGlobalInteractions() {
    $$(".nav-item").forEach(btn => btn.onclick = () => {
      state.selectedProjectId = null;
      state.view = btn.dataset.view;
      state.searchQuery = "";
      render();
      if(state.view==="search") setTimeout(()=>$("#pageSearch")?.focus(),0);
    });

    $$(".project-row, [data-project]").forEach(el => {
      el.onclick = e => {
        if (e.target.closest("[data-action]")) return;
        state.selectedProjectId = el.dataset.project;
        state.view = "all";
        render();
      };
    });

    $$("[data-action='new-task']").forEach(el => el.onclick = () => openTaskModal());
    $("#newTaskButton").onclick = () => openTaskModal();
    $("#addProjectButton").onclick = addProject;
    $("#searchButton").onclick = openSearch;
    $("#settingsButton").onclick = () => { state.selectedProjectId=null; state.view="settings"; render(); };

    $$("[data-complete]").forEach(el => el.onclick = e => { e.stopPropagation(); toggleComplete(el.dataset.complete); });
    $$("[data-favorite]").forEach(el => el.onclick = e => { e.stopPropagation(); toggleFavorite(el.dataset.favorite); });
    $$("[data-open-task]").forEach(el => el.onclick = () => openTaskModal(el.dataset.openTask));
    $$("[data-edit-project]").forEach(el => el.onclick = () => editProject(el.dataset.editProject));
    $$("[data-restore]").forEach(el => el.onclick = () => restoreItem(el.dataset.restore));

    $$(".task-row[draggable='true']").forEach(row => {
      row.addEventListener("dragstart", e => { e.dataTransfer.setData("text/plain", row.dataset.taskId); row.classList.add("dragging"); });
      row.addEventListener("dragend", () => row.classList.remove("dragging"));
      row.addEventListener("dragover", e => { e.preventDefault(); row.classList.add("drop-target"); });
      row.addEventListener("dragleave", () => row.classList.remove("drop-target"));
      row.addEventListener("drop", e => {
        e.preventDefault(); row.classList.remove("drop-target");
        reorderTask(e.dataTransfer.getData("text/plain"), row.dataset.taskId);
      });
    });

    $("#pageSearch")?.addEventListener("input", e => {
      state.searchQuery = e.target.value;
      $("#pageSearchResults").innerHTML = renderSearchResults(state.searchQuery);
      if(state.searchQuery.trim()) {
        state.data.recentSearches = [state.searchQuery.trim(), ...(state.data.recentSearches||[]).filter(x=>x!==state.searchQuery.trim())].slice(0,6);
        persist();
      }
    });
    $$("[data-recent-search]").forEach(el => {
      el.onclick = () => { state.searchQuery=el.dataset.recentSearch; render(); setTimeout(()=>$("#pageSearch")?.focus(),0); };
    });

    $("#appearanceSelect")?.addEventListener("change", e => {
      state.data.appearance=e.target.value; persist(); applyAppearance();
    });
    $("#resetData")?.addEventListener("click", () => {
      if(confirm("Reset the frontend prototype to its original demo data?")) {
        state.data=clone(DEFAULT_DATA); persist(); state.view="all"; state.selectedProjectId=null; render(); showToast("Demo data reset");
      }
    });
  }

  function reorderTask(sourceId, targetId) {
    if(sourceId===targetId) return;
    const source=state.data.tasks.find(t=>t.id===sourceId), target=state.data.tasks.find(t=>t.id===targetId);
    if(!source||!target) return;
    if(source.projectId!==target.projectId || source.sectionId!==target.sectionId) {
      source.projectId=target.projectId; source.sectionId=target.sectionId;
    }
    const siblings=state.data.tasks.filter(t=>t.projectId===target.projectId && t.sectionId===target.sectionId && t.parentTaskId===target.parentTaskId && t.id!==source.id).sort((a,b)=>a.order-b.order);
    const targetIndex=siblings.findIndex(t=>t.id===target.id);
    siblings.splice(Math.max(0,targetIndex),0,source);
    siblings.forEach((t,i)=>t.order=i);
    persist(); render(); showToast("Task moved");
  }

  function applyAppearance() {
    const value = state.data.appearance;
    document.documentElement.dataset.theme = value;
    if(value==="dark") document.documentElement.style.colorScheme="dark";
    else if(value==="light") document.documentElement.style.colorScheme="light";
    else document.documentElement.style.colorScheme="";
  }

  function bindKeyboard() {
    document.addEventListener("keydown", e => {
      const cmd = e.metaKey || e.ctrlKey;
      if(cmd && e.key.toLowerCase()==="n") { e.preventDefault(); openTaskModal(); }
      if(cmd && e.key.toLowerCase()==="k") { e.preventDefault(); openSearch(); }
      if(e.key==="Escape") { closeSearch(); closeModal(); }
    });
    $("#commandOverlay").addEventListener("click", e => { if(e.target.id==="commandOverlay") closeSearch(); });
    $("#globalSearch").addEventListener("input", e => { state.searchQuery=e.target.value; renderCommandResults(); });
    $("#toastUndo").onclick = () => {
      if(state.lastAction?.type==="restoreTask") {
        const task=state.lastAction.task;
        state.data.deleted=state.data.deleted.filter(x=>x.id!==task.id);
        state.data.tasks.push(task);
        state.lastAction=null; persist(); render(); showToast("Undo complete");
      }
    };
    $("#modalBackdrop").addEventListener("click", e => { if(e.target.id==="modalBackdrop") closeModal(); });
  }

  applyAppearance();
  render();
  bindKeyboard();
})();
