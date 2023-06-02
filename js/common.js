// setting
const $ = (element, parent) => (parent || document).querySelector(element);
const $$ = (elements, parent) => [...(parent || document).querySelectorAll(elements)];
const createElement = (element, attrs = {}) => Object.assign(document.createElement(element), attrs);

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
    cardAI: -1,
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
  });
  kanbanBoardRender();
}

// workspace event handler
$createWorkspaceBtn.addEventListener("click", function () {
  const workspaceName = prompt("workspace 이름을 입력해주세요")?.trim();
  workspaceName && createWorkspace(workspaceName);
});
$createColumnBtn.addEventListener("click", function () {
  if (!state.workspaces.length) return alert("workspace 를 생성해주세요.");
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
  let isColumnDrag = false;
  let isCardDrag = false;

  if (!currentWorkspace) return;
  $columns.forEach(($column) => $column.remove());
  currentWorkspace.columns.forEach((column) => {
    const $column = createElement("div");
    $column.className = "column";
    $column.draggable = true;
    $column.dataset.id = column.id;
    $column.innerHTML = `
        <div class="column-name">${column.name}</div>
        <div class="card-container"></div>
        <button type="button" class="btn create-card">Add Card</button>
    `;
    $column.addEventListener("dragstart", function () {
      isColumnDrag = true;
      $column.classList.add("dragging");
    });
    $column.addEventListener("dragend", function () {
      isCardDrag = false;

      const currentWorkspace = getCurrentWorkspace();
      const columnId = $column.nextSibling?.dataset?.id ?? -1; // -1 일 경우에는 맨 마지막
      const columns = currentWorkspace.columns.filter(({ id }) => id !== column.id);
      const columnIndex = columns.findIndex(({ id }) => id === +columnId);

      if (columnId === -1) {
        currentWorkspace.columns = [...columns, column];
      } else {
        currentWorkspace.columns = [...columns.slice(0, columnIndex), column, ...columns.slice(columnIndex)];
      }
      $column.classList.remove("dragging");
      kanbanBoardRender();
    });

    const $createCardBtn = $(".btn.create-card", $column);
    const $cardContainer = $(".card-container", $column);

    $cardContainer.addEventListener("dragover", function (event) {
      const mouseX = event.clientX;
      const mouseY = event.clientY;
      if (isCardDrag) {
        const $cards = $$(".card", $cardContainer);
        const shouldCard = $cards.some(($card, cardIndex) => {
          const cardTop = $card.offsetTop;
          const cardMiddle = $card.offsetTop + $card.offsetHeight / 2;
          const cardBottom = $card.offsetTop + $card.offsetHeight;
          if (cardTop <= mouseY && mouseY <= cardBottom) {
            const $dragging = $(".dragging");
            if ($card === $dragging) return true;
            if (mouseY < cardMiddle) {
              $cardContainer.insertBefore($dragging, $card);
              return true;
            } else {
              let nextCard = $card.nextSibling;
              if ($card.nextSibling === $dragging) return true;
              $cardContainer.insertBefore($dragging, nextCard);
              return true;
            }
          }
        });
        if (!shouldCard) {
          const $dragging = $(".dragging");
          const cardContainerTop = $cardContainer.offsetTop;
          const cardContainerBottom = $cardContainer.offsetTop + $cardContainer.offsetHeight;
          if (cardContainerTop <= mouseY && mouseY <= cardContainerTop + 20) {
            $cardContainer.prepend($dragging);
          } else if (cardContainerBottom - 20 <= mouseY && mouseY <= cardContainerBottom) {
            $cardContainer.append($dragging);
          }
        }
      } else if (isColumnDrag) {
        const $columns = $$(".column", $kanbanBoard);
        $columns.forEach(($column) => {
          const columnLeft = $column.offsetLeft;
          const columnMiddle = $column.offsetLeft + $column.offsetWidth / 2;
          const columnRight = $column.offsetLeft + $column.offsetWidth;
          if (columnLeft <= mouseX && mouseX <= columnRight) {
            const $dragging = $(".dragging");
            if (mouseX < columnMiddle) {
              $kanbanBoard.insertBefore($dragging, $column);
            } else {
              let nextColumn = $column.nextSibling;
              if ($column.nextSibling === $dragging) return;
              $kanbanBoard.insertBefore($dragging, nextColumn);
            }
          }
        });
      }
    });

    column.cards.forEach((card) => {
      const $card = createElement("div", {
        className: "card draggle",
        draggable: true,
        textContent: card.name,
      });
      $card.dataset.id = card.id;
      $card.addEventListener("dragstart", function (e) {
        e.stopPropagation();
        isCardDrag = true;
        $card.classList.add("dragging");
      });
      $card.addEventListener("dragend", function (e) {
        e.stopPropagation();
        isCardDrag = false;
        const $column = $card.closest(".column");
        const columnId = +$column.dataset.id;
        const cardId = $card.nextSibling?.dataset?.id ?? -1; // -1 일 경우에는 맨 마지막
        const currentWorkspace = getCurrentWorkspace();
        const selectedColumn = currentWorkspace.columns.find(({ id }) => id === columnId);
        const cardIndex = selectedColumn.cards.findIndex(({ id }) => id === +cardId);

        column.cards = column.cards.filter(({ id }) => id !== card.id);
        if (cardId === -1) {
          selectedColumn.cards.push(card);
        } else {
          selectedColumn.cards = [
            ...selectedColumn.cards.slice(0, cardIndex),
            card,
            ...selectedColumn.cards.slice(cardIndex),
          ];
        }

        $card.classList.remove("dragging");
        kanbanBoardRender();
      });
      $cardContainer.append($card);
    });

    $createCardBtn.addEventListener("click", function () {
      const currentWorkspace = getCurrentWorkspace();
      const cardName = prompt("card 이름을 입력해주세요")?.trim();
      if (cardName) {
        currentWorkspace.cardAI++;
        column.cards.push({
          id: currentWorkspace.cardAI,
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
