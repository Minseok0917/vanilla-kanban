// setting
const $ = (element, parent) => (parent || document).querySelector(element);
const $$ = (elements, parent) => [...(parent || document).querySelectorAll(elements)];
const createElement = (element) => document.createElement(element);

const getStorage = (key) => JSON.parse(localStorage.getItem(key));
const setStorage = (key, value) => localStorage.setItem(key, JSON.stringify(value));

// state
const state = getStorage("kanban") || {
  autoIncrement: -1,
  workspaces: [],
  selectedWorkspaceId: -1,
};

// elements
const $createWorkspaceBtn = $(".btn.create-workspace");
const $workspaceContainer = $(".workspace-container");

const $createColumnBtn = $(".btn.create-column");
const $kanbanBoard = $(".kanban-board");

// helpers
const setStorageKanban = () => setStorage("kanban", state);
const getCurrentWorkspace = () => state.workspaces[state.selectedWorkspaceId];
function createWorkspace(workspaceName) {
  state.autoIncrement++;
  state.workspaces.push({
    id: state.autoIncrement,
    name: workspaceName,
    columns: [],
    columnAI: -1,
  });
  state.selectedWorkspaceId = state.autoIncrement;
  workspaceRender();
  kanbanBoardRender();
}
function createColumn(columnName) {
  const currentWorkspace = getCurrentWorkspace();
  currentWorkspace.columnAI++;
  currentWorkspace.columns.push({
    id: currentWorkspace.columnAI,
    name: columnName,
    cards: [],
    cardAI: -1,
  });
  kanbanBoardRender();
}

// workspace event handler
$createWorkspaceBtn.addEventListener("click", function () {
  const workspaceName = prompt("workspace 이름을 입력해주세요")?.trim();
  workspaceName && createWorkspace(workspaceName);
});
$createColumnBtn.addEventListener("click", function () {
  const columnName = prompt("column 이름을 입력해주세요")?.trim();
  columnName && createColumn(columnName);
});

// render
function workspaceRender() {
  const { workspaces, selectedWorkspaceId } = state;
  $workspaceContainer.innerHTML = "";
  workspaces.forEach((workspace) => {
    const $li = createElement("li");
    $li.className = `workspace ${workspace.id === state.selectedWorkspaceId && "active"}`;
    $li.textContent = workspace.name;
    $li.addEventListener("click", function () {
      state.selectedWorkspaceId = workspace.id;
      workspaceRender();
    });
    $workspaceContainer.append($li);
  });
  kanbanBoardRender();
}

function kanbanBoardRender() {
  const currentWorkspace = getCurrentWorkspace();
  const $columns = $$(".column", $kanbanBoard);

  if (!currentWorkspace) return;
  $columns.forEach(($column) => $column.remove());
  currentWorkspace.columns.forEach((column) => {
    const $column = createElement("div");
    $column.className = "column";
    $column.dataset.id = column.id;
    $column.innerHTML = `
        <div class="column-name">${column.name}</div>
        <div class="card-container"></div>
        <button type="button" class="btn create-card">Add Card</button>
    `;

    const $createCardBtn = $(".btn.create-card", $column);
    const $cardContainer = $(".card-container", $column);

    column.cards.forEach((card) => {
      const $card = createElement("div");
      $card.className = "card";
      $card.textContent = card.name;
      $cardContainer.append($card);
    });

    $createCardBtn.addEventListener("click", function () {
      const cardName = prompt("card 이름을 입력해주세요")?.trim();
      if (cardName) {
        column.cardAI++;
        column.cards.push({
          id: column.cardAI,
          name: cardName,
        });
        kanbanBoardRender();
      }
    });

    $kanbanBoard.append($column);
  });
  $kanbanBoard.append($createColumnBtn);
  setStorageKanban();
}

workspaceRender();
