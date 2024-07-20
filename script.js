let taskIdCounter = 0;
let tasks = [];
let connections = [];
let selectedTask = null;
let tempLine = null;
let selectionIndicator = null;
let currentScale = 1;
const minScale = 0.5;
const maxScale = 3;
const scaleStep = 0.1;
let isPanning = false;
let startX, startY;
let scrollLeft, scrollTop;

function addTask(shape) {

  const taskContainer = document.getElementById("task-content");
  const taskId = `task-${taskIdCounter++}`;
  const taskElement = document.createElement("div");
  taskElement.className = `task ${shape}`;
  taskElement.id = taskId;
  taskElement.style.left = "50px";
  taskElement.style.top = "50px";
  taskElement.innerHTML = `
      <input type="text" placeholder="Task name" class="task-title">
      <div class="task-entries"></div>
      <div class="task-controls">
          <input type="text" placeholder="New entry" class="new-entry-input">
          <button onclick="addEntry('${taskId}')">Add</button>
      </div>
      <button onclick="deleteTask('${taskId}')">Delete Task</button>
      <button onclick="selectTask('${taskId}')">Select</button>
      <div class="circle-dot"></div>

  `;
  taskContainer.appendChild(taskElement);
  tasks.push(taskElement);
  makeDraggable(taskElement);
  updateContainerSize();
}


function addEntry(taskId) {

  const task = document.getElementById(taskId);
  const newEntryInput = task.querySelector(".new-entry-input");

  const entryInput = task.querySelectorAll(".new-entry-input");
  entryInput.forEach(input => {
    const entryName = input.value.trim();

    
    if (entryName.length > 150) {
      alert("Entry cannot exceed 150 characters.");
      return;
    }

    if (entryName.length === 0) {
      alert("Entry cannot be empty.");
      return;
    }
  });


  const entryText = newEntryInput.value.trim();
  if (entryText) {
    const entriesContainer = task.querySelector(".task-entries");
    const entryElement = document.createElement("div");
    entryElement.className = "task-entry";
    entryElement.innerHTML = `
    <span class="entry-text">${entryText}</span>
    <button class="remove-button" onclick="removeEntry(this)">Remove</button>
  `;
    entriesContainer.appendChild(entryElement);
    newEntryInput.value = "";

    
    const textElement = entryElement.querySelector('.entry-text');
    textElement.addEventListener('click', toggleEntryStyle);

    
    adjustScrollAnimation(textElement);

    updateContainerSize();
    drawLines();
  }
}

function adjustScrollAnimation(element) {
  
  element.style.animation = 'none';
  element.classList.remove('scrolling');
  element.offsetHeight; 

  const parentWidth = element.parentElement.offsetWidth;
  const textWidth = element.scrollWidth; 

  if (textWidth > parentWidth) {
    element.classList.add('scrolling');
    
    const duration = (textWidth / 50) * 2; 
    element.style.animation = `scroll-text ${duration}s linear infinite`;
  }
}




function isTextTooLong(element) {
  return element.scrollWidth > element.offsetWidth;
}


function toggleEntryStyle(event) {
  const entryText = event.target;
  entryText.classList.toggle('line-through');
}

function updateExistingEntries() {
  const allEntries = document.querySelectorAll('.task-entry .entry-text');
  allEntries.forEach(adjustScrollAnimation);
}



function adjustScrollDuration(element) {
  const scrollWidth = element.scrollWidth;
  const clientWidth = element.clientWidth;
  const duration = (scrollWidth / clientWidth) * 5; 
  element.style.animationDuration = `${duration}s`;
}


function removeEntry(button) {
  const entry = button.parentElement;
  entry.remove();
  updateContainerSize();
}

function deleteTask(taskId) {
  const taskElement = document.getElementById(taskId);
  taskElement.parentNode.removeChild(taskElement);
  tasks = tasks.filter((task) => task.id !== taskId);
  connections = connections.filter(
    (conn) => conn.start !== taskId && conn.end !== taskId
  );
  drawLines();
}

function selectTask(taskId) {
  if (selectedTask === taskId) {
    selectedTask = null;
    removeSelectionIndicator();
    removeTempLine();
  } else if (selectedTask) {
    connections.push({ start: selectedTask, end: taskId });
    selectedTask = null;
    removeSelectionIndicator();
    removeTempLine();
    drawLines();
  } else {
    selectedTask = taskId;
    createSelectionIndicator(taskId);
    document.addEventListener("mousemove", drawTempLine);
  }
}

function createSelectionIndicator(taskId) {
  removeSelectionIndicator();
  const task = document.getElementById(taskId);
  selectionIndicator = document.createElement("div");
  selectionIndicator.className = "selection-indicator";
  selectionIndicator.style.width = `${task.offsetWidth + 10}px`;
  selectionIndicator.style.height = `${task.offsetHeight + 10}px`;
  selectionIndicator.style.left = `${task.offsetLeft - 5}px`;
  selectionIndicator.style.top = `${task.offsetTop - 5}px`;
  document.getElementById("task-content").appendChild(selectionIndicator);
}

function removeSelectionIndicator() {
  if (selectionIndicator) {
    selectionIndicator.remove();
    selectionIndicator = null;
  }
}

function drawTempLine(e) {
  if (!selectedTask) return;

  const taskContainer = document.getElementById("task-content");
  const containerRect = taskContainer.getBoundingClientRect();
  const start = document.getElementById(selectedTask);
  const startRect = start.getBoundingClientRect();

  
  const mouseX = (e.clientX - containerRect.left + taskContainer.scrollLeft) / currentScale;
  const mouseY = (e.clientY - containerRect.top + taskContainer.scrollTop) / currentScale;

  
  const startX = (startRect.left - containerRect.left + taskContainer.scrollLeft) / currentScale;
  const startY = (startRect.top - containerRect.top + taskContainer.scrollTop) / currentScale;
  const startWidth = startRect.width / currentScale;
  const startHeight = startRect.height / currentScale;

  removeTempLines();

  
  let lineStartX, lineStartY;
  if (mouseX < startX) {
    lineStartX = startX;
    lineStartY = Math.min(Math.max(mouseY, startY), startY + startHeight);
  } else if (mouseX > startX + startWidth) {
    lineStartX = startX + startWidth;
    lineStartY = Math.min(Math.max(mouseY, startY), startY + startHeight);
  } else if (mouseY < startY) {
    lineStartX = Math.min(Math.max(mouseX, startX), startX + startWidth);
    lineStartY = startY;
  } else {
    lineStartX = Math.min(Math.max(mouseX, startX), startX + startWidth);
    lineStartY = startY + startHeight;
  }

  createTempLine(lineStartX, lineStartY, mouseX, mouseY);
}

function createTempLine(startX, startY, endX, endY) {
  const taskContainer = document.getElementById("task-content");
  const line = document.createElement("div");
  line.className = "temp-line";
  const length = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
  const angle = Math.atan2(endY - startY, endX - startX);

  line.style.width = `${length}px`;
  line.style.transform = `rotate(${angle}rad)`;
  line.style.left = `${startX}px`;
  line.style.top = `${startY}px`;

  taskContainer.appendChild(line);
}


function updateTempLine(e) {
  if (selectedTask) {
    drawTempLine(e);
  }
}


function removeTempLines() {
  const tempLines = document.querySelectorAll(".temp-line");
  tempLines.forEach((line) => line.remove());
}

function selectTask(taskId) {
  if (selectedTask === taskId) {
    
    selectedTask = null;
    removeSelectionIndicator();
    removeTempLines();
  } else if (selectedTask) {
    
    connections.push({ start: selectedTask, end: taskId });
    selectedTask = null;
    removeSelectionIndicator();
    removeTempLines();
    drawLines();
  } else {
    
    selectedTask = taskId;
    createSelectionIndicator(taskId);
    document.addEventListener("mousemove", drawTempLine);
    document.addEventListener("click", handleClickOutside);
  }
}

function handleClickOutside(e) {
  const taskContainer = document.getElementById("task-content");
  if (!taskContainer.contains(e.target) || !e.target.closest(".task")) {
    selectedTask = null;
    removeSelectionIndicator();
    removeTempLines();
    document.removeEventListener("mousemove", drawTempLine);
    document.removeEventListener("click", handleClickOutside);
  }
}

function makeDraggable(element) {
  let isDragging = false;
  let startX, startY;
  let elementStartX, elementStartY;
  let lastMouseX, lastMouseY;

  element.addEventListener("mousedown", startDragging);
  element.addEventListener("touchstart", startDragging); 
  document.addEventListener("mousemove", drag);
  document.addEventListener("touchmove", drag); 
  document.addEventListener("mouseup", stopDragging);
  document.addEventListener("touchend", stopDragging); 

  function startDragging(e) {
    
    if (e.target.tagName === "BUTTON" || e.target.tagName === "INPUT") return;
    e.preventDefault(); 

    isDragging = true;
    const taskContainer = document.getElementById("task-container");
    const containerRect = taskContainer.getBoundingClientRect();

    
    const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;

    startX = clientX - containerRect.left + taskContainer.scrollLeft;
    startY = clientY - containerRect.top + taskContainer.scrollTop;

    elementStartX = parseFloat(element.style.left) || 0;
    elementStartY = parseFloat(element.style.top) || 0;

    lastMouseX = clientX;
    lastMouseY = clientY;

    element.style.cursor = "grabbing";
    element.style.zIndex = "200";
    requestAnimationFrame(updateDrag);
  }

  function updateDrag() {
    if (!isDragging) return;

    const taskContainer = document.getElementById("task-container");
    const containerRect = taskContainer.getBoundingClientRect();

    
    let currentX = lastMouseX - containerRect.left + taskContainer.scrollLeft;
    let currentY = lastMouseY - containerRect.top + taskContainer.scrollTop;

    let deltaX = (currentX - startX) / currentScale;
    let deltaY = (currentY - startY) / currentScale;

    let newX = elementStartX + deltaX;
    let newY = elementStartY + deltaY;

    element.style.left = `${newX}px`;
    element.style.top = `${newY}px`;

    
    const scrollSpeed = 15;
    const scrollThreshold = 50;

    if (lastMouseY < containerRect.top + scrollThreshold) {
      taskContainer.scrollTop -= scrollSpeed;
      newY -= scrollSpeed / currentScale;
    } else if (lastMouseY > containerRect.bottom - scrollThreshold) {
      taskContainer.scrollTop += scrollSpeed;
      newY += scrollSpeed / currentScale;
    }

    if (lastMouseX < containerRect.left + scrollThreshold) {
      taskContainer.scrollLeft -= scrollSpeed;
      newX -= scrollSpeed / currentScale;
    } else if (lastMouseX > containerRect.right - scrollThreshold) {
      taskContainer.scrollLeft += scrollSpeed;
      newX += scrollSpeed / currentScale;
    }

    element.style.left = `${newX}px`;
    element.style.top = `${newY}px`;

    updateContainerSize();
    drawLines();

    if (element.id === selectedTask) {
      createSelectionIndicator(selectedTask);
    }

    requestAnimationFrame(updateDrag);
  }

  function drag(e) {
    if (!isDragging) return;

    
    lastMouseX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    lastMouseY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
  }

  function stopDragging() {
    isDragging = false;
    element.style.cursor = "grab";
    element.style.zIndex = "";
  }
}
function constrainTaskWithinContainer(task) {
  const container = document.getElementById("task-content");
  const containerRect = container.getBoundingClientRect();
  const taskRect = task.getBoundingClientRect();

  let newLeft = Math.max(
    0,
    Math.min(task.offsetLeft, containerRect.width - taskRect.width)
  );
  let newTop = Math.max(
    0,
    Math.min(task.offsetTop, containerRect.height - taskRect.height)
  );

  task.style.left = `${newLeft}px`;
  task.style.top = `${newTop}px`;
}

function drawLines() {
  const taskContainer = document.getElementById("task-content");
  const containerRect = taskContainer.getBoundingClientRect();
  const lines = document.querySelectorAll(".line:not(.temp-line), .arrow, .line-label");
  lines.forEach(line => line.remove());

  connections.forEach((conn, index) => {
    const start = document.getElementById(conn.start);
    const end = document.getElementById(conn.end);
    if (!start || !end) return; 

    const startRect = start.getBoundingClientRect();
    const endRect = end.getBoundingClientRect();

    
    const startX = (startRect.left - containerRect.left + taskContainer.scrollLeft) / currentScale;
    const startY = (startRect.top - containerRect.top + taskContainer.scrollTop) / currentScale;
    const endX = (endRect.left - containerRect.left + taskContainer.scrollLeft) / currentScale;
    const endY = (endRect.top - containerRect.top + taskContainer.scrollTop) / currentScale;

    const startWidth = startRect.width / currentScale;
    const startHeight = startRect.height / currentScale;
    const endWidth = endRect.width / currentScale;
    const endHeight = endRect.height / currentScale;

    
    const circleRadius = 5; 
    const adjustedStartX = startX + startWidth / 2;
    const adjustedStartY = startY + startHeight - circleRadius - 33;
    const adjustedEndX = endX + endWidth / 2;
    
    const adjustedEndY = endY + endHeight - circleRadius - 33;

    
    const line = document.createElement("div");
    line.className = "line";
    const length = Math.sqrt((adjustedEndX - adjustedStartX) ** 2 + (adjustedEndY - adjustedStartY) ** 2);
    const angle = Math.atan2(adjustedEndY - adjustedStartY, adjustedEndX - adjustedStartX);

    line.style.width = `${length}px`;
    line.style.transform = `rotate(${angle}rad)`;
    line.style.left = `${adjustedStartX}px`;
    line.style.top = `${adjustedStartY}px`;
    taskContainer.appendChild(line);

    
    const arrow = document.createElement("div");
    arrow.className = "arrow";
    arrow.style.left = `${adjustedEndX}px`;
    arrow.style.top = `${adjustedEndY}px`;
    
    arrow.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
    taskContainer.appendChild(arrow);

    
    const label = document.createElement("div");
    label.className = "line-label";
    label.innerText = index + 1;
    label.style.left = `${(adjustedStartX + adjustedEndX) / 2}px`;
    label.style.top = `${(adjustedStartY + adjustedEndY) / 2}px`;
    taskContainer.appendChild(label);
  });
}

function updateContainerSize() {
  const taskContainer = document.getElementById("task-content");
  let maxX = 0;
  let maxY = 0;

  tasks.forEach((task) => {
    const rect = task.getBoundingClientRect();
    maxX = Math.max(
      maxX,
      rect.right -
      taskContainer.getBoundingClientRect().left +
      taskContainer.scrollLeft
    );
    maxY = Math.max(
      maxY,
      rect.bottom -
      taskContainer.getBoundingClientRect().top +
      taskContainer.scrollTop
    );
  });

  taskContainer.style.width = `${Math.max(maxX + 100, taskContainer.clientWidth) / currentScale
    }px`;
  taskContainer.style.height = `${Math.max(maxY + 100, taskContainer.clientHeight) / currentScale
    }px`;
}


window.addEventListener("resize", () => {
  drawLines();
  updateContainerSize();
});

function saveTasks() {
  const taskElements = document.querySelectorAll(".task");
  const tasksData = Array.from(taskElements).map((task) => ({
    id: task.id,
    content: task.querySelector(".task-title").value,
    left: task.style.left,
    top: task.style.top,
    shape: task.classList.contains("box") ? "box" : "",
    entries: Array.from(task.querySelectorAll(".task-entry")).map(
      (entry) => ({
        text: entry.querySelector("span").textContent,
        isLineThrough: entry.querySelector("span").classList.contains("line-through"),
        isScrolling: entry.querySelector("span").classList.contains("scrolling")
      })
    ),
  }));

  const saveData = {
    tasks: tasksData,
    connections: connections,
    taskIdCounter: taskIdCounter,
  };

  const dataStr = JSON.stringify(saveData, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

  const exportFileDefaultName = "task_data.json";

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();
}

function loadTasks() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json";

  fileInput.onchange = function (e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
      try {
        const parsedData = JSON.parse(event.target.result);
        const taskContainer = document.getElementById("task-content");

        
        taskContainer.innerHTML = "";
        tasks = [];
        connections = [];

        
        taskIdCounter = parsedData.taskIdCounter;

        
        parsedData.tasks.forEach((taskData) => {
          const taskElement = document.createElement("div");
          taskElement.className = `task ${taskData.shape}`;
          taskElement.id = taskData.id;
          taskElement.style.left = taskData.left;
          taskElement.style.top = taskData.top;
          taskElement.innerHTML = `
          <input type="text" placeholder="Task name" class="task-title" value="${taskData.content}">
          <div class="task-entries"></div>
          <div class="task-controls">
              <input type="text" placeholder="New entry" class="new-entry-input">
              <button onclick="addEntry('${taskData.id}')">Add</button>
          </div>
          <button onclick="deleteTask('${taskData.id}')">Delete Task</button>
          <button onclick="selectTask('${taskData.id}')">Select</button>
          <div class="circle-dot"></div>
      `;

          
          const entriesContainer = taskElement.querySelector(".task-entries");
          taskData.entries.forEach((entryData) => {
            const entryElement = document.createElement("div");
            entryElement.className = "task-entry";
            const spanElement = document.createElement("span");
            spanElement.className = "entry-text";
            spanElement.textContent = entryData.text;
            if (entryData.isLineThrough) {
              spanElement.classList.add("line-through");
            }
            entryElement.appendChild(spanElement);
            const removeButton = document.createElement("button");
            removeButton.className = "remove-button";
            removeButton.textContent = "Remove";
            removeButton.onclick = function () { removeEntry(this); };
            entryElement.appendChild(removeButton);
            entriesContainer.appendChild(entryElement);

            
            spanElement.addEventListener('click', toggleEntryStyle);
          });

          taskContainer.appendChild(taskElement);
          tasks.push(taskElement);
          makeDraggable(taskElement);
        });

        
        connections = parsedData.connections;
        updateContainerSize();
        drawLines();

        
        document.querySelectorAll('.task-entry .entry-text').forEach(adjustScrollAnimation);

        alert("Tasks loaded successfully!");
      } catch (error) {
        console.error("Error parsing JSON:", error);
        alert("Error loading tasks. Please check the file format.");
      }
    };

    reader.readAsText(file);
  };

  fileInput.click();
}

function handleZoom(event) {
  event.preventDefault();
  const taskContainer = document.getElementById("task-container");
  const taskContent = document.getElementById("task-content");
  const containerRect = taskContainer.getBoundingClientRect();

  
  const mouseX = event.clientX - containerRect.left;
  const mouseY = event.clientY - containerRect.top;

  
  const contentMouseX = (mouseX + taskContainer.scrollLeft) / currentScale;
  const contentMouseY = (mouseY + taskContainer.scrollTop) / currentScale;

  
  const zoomIn = event.deltaY < 0;
  const newScale = Math.min(Math.max(currentScale + (zoomIn ? scaleStep : -scaleStep), minScale), maxScale);

  
  taskContent.style.transform = `scale(${newScale})`;
  taskContent.style.transformOrigin = "0 0";

  
  taskContainer.scrollLeft = contentMouseX * newScale - mouseX;
  taskContainer.scrollTop = contentMouseY * newScale - mouseY;

  
  currentScale = newScale;

  
  updateTaskPositions();
  drawLines();
  if (selectedTask) {
    drawTempLine(event);
  }
}

function endPan() {
  isPanning = false;
  const taskContainer = document.getElementById("task-container");
  taskContainer.style.cursor = "default";
  drawLines(); 
}

window.addEventListener('resize', () => {
  drawLines();
  if (selectedTask) {
    drawTempLine({ clientX: 0, clientY: 0 }); 
  }
});

function updateTaskPositions() {
  tasks.forEach((task) => {
    const left = parseFloat(task.style.left);
    const top = parseFloat(task.style.top);
    task.style.left = `${left}px`;
    task.style.top = `${top}px`;
    task.style.transform = `scale(${1 / currentScale})`;
    task.style.transformOrigin = "0 0";
  });
}



function startPan(event) {
  const taskContainer = document.getElementById("task-container");
  if (
    event.target === taskContainer ||
    event.target === document.getElementById("task-content")
  ) {
    isPanning = true;
    startX = event.clientX - taskContainer.offsetLeft;
    startY = event.clientY - taskContainer.offsetTop;
    scrollLeft = taskContainer.scrollLeft;
    scrollTop = taskContainer.scrollTop;
    taskContainer.style.cursor = "grabbing";
  }
}

function doPan(event) {
  if (!isPanning) return;
  event.preventDefault();
  const taskContainer = document.getElementById("task-container");
  const x = event.clientX - taskContainer.offsetLeft;
  const y = event.clientY - taskContainer.offsetTop;
  const walkX = (x - startX) * 1.5; 
  const walkY = (y - startY) * 1.5;
  taskContainer.scrollLeft = scrollLeft - walkX;
  taskContainer.scrollTop = scrollTop - walkY;
}

function endPan() {
  isPanning = false;
  const taskContainer = document.getElementById("task-container");
  taskContainer.style.cursor = "default";
}

function updateTaskPositions() {
  tasks.forEach((task) => {
    const left = parseFloat(task.style.left);
    const top = parseFloat(task.style.top);
    task.style.left = `${left}px`;
    task.style.top = `${top}px`;
  });
}


document.addEventListener("DOMContentLoaded", () => {
  const taskContainer = document.getElementById("task-container");
  document.getElementById("task-container").addEventListener("mousemove", updateTempLine);
  taskContainer.addEventListener("wheel", handleZoom, { passive: false });
  taskContainer.addEventListener("mousedown", startPan);
  taskContainer.addEventListener("mousemove", doPan);
  updateExistingEntries();
  taskContainer.addEventListener("mouseup", endPan);
  taskContainer.addEventListener("mouseleave", endPan);
  const saveBtn = document.getElementById("saveBtn"),
    loadBtn = document.getElementById("loadBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", saveTasks);
  }
  if (loadBtn) {
    loadBtn.addEventListener("click", loadTasks);
  }
});





    
    function isMobileOrTablet() {
      return /Mobi|Android|iPad|Tablet/i.test(navigator.userAgent);
    }

    
    function isTouchDevice() {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    
    if (isMobileOrTablet() && isTouchDevice()) {
      
      const guideMobile = document.createElement('div');
      guideMobile.className = 'guide-mobile';

      
      const animatedImage = document.createElement('img');
      animatedImage.className = 'handIn'; 
      animatedImage.src = '/imgs/zoom-in.png'; 
      animatedImage.id = 'animatedImage'; 

      
      guideMobile.appendChild(animatedImage);

      
      document.body.appendChild(guideMobile);

      
      setTimeout(() => {
        animatedImage.src = '/imgs/zoom-out.png';
        setTimeout(() => {
          
          animatedImage.classList.remove('handIn');
          animatedImage.classList.add('handOut');
          setTimeout(() => {
            animatedImage.src = '/imgs/move.png';
            setTimeout(() => {
              console.log("end zoom out"); 
              animatedImage.classList.remove('handOut');
              animatedImage.classList.add('handMove');
              setTimeout(() => {
                guideMobile.classList.add("close");
                setTimeout(() => {
                  if (guideMobile) {
                    guideMobile.remove();
                  }
                }, 555);
              }, 8000);
            }, 1000); 
          }, 2500);
        }, 500); 
      }, 3500);

      
      guideMobile.addEventListener('touchstart', () => {
        guideMobile.classList.add("close");
        setTimeout(() => {
          if (guideMobile) {
            guideMobile.remove();
          }
        }, 555);
      });
    }


    function go() {
      const containerFront = document.querySelector('.container-inner');
      containerFront.classList.add('container-move');
      
  
      containerFront.addEventListener('transitionend', () => {
          document.body.style.overflow = '';
      });
      stopTyping()
  }
  
  document.addEventListener('DOMContentLoaded', () => {
      document.body.style.overflow = 'hidden';
  });



    const texts = [
      "Are you thinking about organizing your ideas? 🤔",
      "Ready to boost your productivity? 🚀",
      "Let's organize your tasks together! 📋✅",
      "Turn your ideas into action! 💡➡️🎯",
      "Manage your time, achieve your goals! ⏰🏆",
      "Simplify your workflow, maximize results! 🔄📈",
      "Stay focused, get more done! 🧘‍♂️💪",
      "Your personal task assistant is here! 🤖👋",
      "Plan, track, succeed! 📝🔍🌟",
      "Efficiency is just a click away! 🖱️⚡",
      "Turning chaos into clarity, one task at a time! 🌪️➡️🌈"
    ];
    
    let index = 0;
    let typingTimeouts = []; // Array to store timeout IDs
    
    function typeText() {
      const textElement = document.getElementById("typewriter-text");
      textElement.textContent = "";
      textElement.style.width = "0";
    
      let charIndex = 0;
    
      function type() {
        if (charIndex < texts[index].length) {
          textElement.textContent += texts[index].charAt(charIndex);
          charIndex++;
          textElement.style.width = `${(charIndex / texts[index].length) * 100}%`;
          typingTimeouts.push(setTimeout(type, 100));
        } else {
          typingTimeouts.push(setTimeout(deleteText, 2000));
        }
      }
    
      function deleteText() {
        if (textElement.textContent.length > 0) {
          textElement.textContent = textElement.textContent.slice(0, -1);
          textElement.style.width = `${(textElement.textContent.length / texts[index].length) * 100}%`;
          typingTimeouts.push(setTimeout(deleteText, 50));
        } else {
          index = (index + 1) % texts.length;
          typingTimeouts.push(setTimeout(typeText, 500));
        }
      }
    
      type();
    }
    
    function stopTyping() {
      typingTimeouts.forEach(clearTimeout);
      typingTimeouts = [];
      const textElement = document.getElementById("typewriter-text");
      textElement.textContent = "";
      textElement.style.width = "0";
    }
    
    // Start the typing effect
    typeText();
    

    function setFullHeight() {
      const taskContainer = document.querySelector('.task-container');
      taskContainer.style.height = `${window.innerHeight-75}px`;
    }

    // Call the function initially
    setFullHeight();

    // Re-calculate on resize
    window.addEventListener('resize', setFullHeight);