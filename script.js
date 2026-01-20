// DOM Elements
const subjectForm = document.getElementById('subject-form');
const taskForm = document.getElementById('task-form');
const editTaskForm = document.getElementById('edit-task-form');
const subjectsContainer = document.getElementById('subjects-container');
const tasksContainer = document.getElementById('tasks-container');
const taskSubjectSelect = document.getElementById('task-subject');
const editTaskSubjectSelect = document.getElementById('edit-task-subject');
const filterButtons = document.querySelectorAll('.filter-btn');
const themeSwitch = document.getElementById('theme-switch');
const quickAddBtn = document.getElementById('quick-add-btn');
const currentDateEl = document.getElementById('current-date');
const todayProgressBar = document.getElementById('today-progress-bar');
const todayProgressValue = document.getElementById('today-progress-value');
const upcomingDeadlinesEl = document.getElementById('upcoming-deadlines');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const editTaskModal = document.getElementById('edit-task-modal');
const modalClose = document.querySelector('.modal-close');
const modalCancel = document.querySelector('.modal-cancel');
const clearCompletedBtn = document.getElementById('clear-completed');
const clearCategoriesBtn = document.getElementById('clear-categories');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const resetBtn = document.getElementById('reset-btn');
const productivityPercentage = document.getElementById('productivity-percentage');

// Stats Elements
const upcomingCountEl = document.getElementById('upcoming-count');
const completedCountEl = document.getElementById('completed-count');
const totalCountEl = document.getElementById('total-count');

// Confetti Canvas
const confettiCanvas = document.getElementById('confetti-canvas');

// Sample initial data
let subjects = [];
let tasks = [];
let currentFilter = 'all';
let currentSearch = '';
let isSearching = false;

// Initialize the app
function initApp() {
    // Load data from localStorage
    loadFromLocalStorage();
    
    // Set current date
    updateCurrentDate();
    
    // Populate subjects in the dropdowns
    updateSubjectDropdowns();
    
    // Render subjects list
    renderSubjects();
    
    // Render tasks based on current filter
    renderTasks();
    
    // Update all stats
    updateAllStats();
    
    // Set today's date as minimum for due date input
    const todayDate = getTodayDate();
    document.getElementById('task-due-date').min = todayDate;
    document.getElementById('edit-task-due-date').min = todayDate;
    document.getElementById('task-due-date').value = todayDate;
    
    // Setup event listeners
    setupEventListeners();
    
    // Check for overdue tasks
    checkOverdueTasks();
}

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format date to readable string
function formatDate(dateString) {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
}

// Update current date display
function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    currentDateEl.textContent = today.toLocaleDateString('en-US', options);
}

// Check if a date is today
function isToday(dateString) {
    const today = new Date().toDateString();
    const compareDate = new Date(dateString).toDateString();
    return today === compareDate;
}

// Check if a date is overdue
function isOverdue(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    return dueDate < today && !isToday(dateString);
}

// Check for overdue tasks and show notification
function checkOverdueTasks() {
    const overdueTasks = tasks.filter(task => isOverdue(task.dueDate) && !task.completed);
    if (overdueTasks.length > 0) {
        showNotification(`You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}!`, 'warning');
    }
}

// Update subject dropdowns
function updateSubjectDropdowns() {
    // Clear existing options except the first placeholder
    taskSubjectSelect.innerHTML = '<option value="" disabled selected>Select category</option>';
    editTaskSubjectSelect.innerHTML = '<option value="" disabled selected>Select category</option>';
    
    // Add subjects to dropdowns
    subjects.forEach(subject => {
        const option1 = document.createElement('option');
        option1.value = subject.id;
        option1.textContent = subject.name;
        taskSubjectSelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = subject.id;
        option2.textContent = subject.name;
        editTaskSubjectSelect.appendChild(option2);
    });
}

// Render subjects list
function renderSubjects() {
    subjectsContainer.innerHTML = '';
    
    if (subjects.length === 0) {
        subjectsContainer.innerHTML = `
            <div class="empty-categories">
                <i class="fas fa-tag"></i>
                <p>No categories yet</p>
            </div>
        `;
        return;
    }
    
    subjects.forEach(subject => {
        // Count tasks for this subject
        const taskCount = tasks.filter(task => task.subjectId === subject.id).length;
        
        const subjectEl = document.createElement('div');
        subjectEl.className = 'category-item';
        subjectEl.innerHTML = `
            <span class="category-name">${subject.name}</span>
            <span class="category-count">${taskCount} task${taskCount !== 1 ? 's' : ''}</span>
        `;
        
        // Add click event to filter by category
        subjectEl.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            filterByCategory(subject.id);
        });
        
        subjectsContainer.appendChild(subjectEl);
    });
}

// Filter tasks by category
function filterByCategory(subjectId) {
    const filteredTasks = tasks.filter(task => task.subjectId === subjectId);
    renderFilteredTasks(filteredTasks, `Category: ${subjects.find(s => s.id === subjectId)?.name}`);
}

// Render tasks based on current filter and search
function renderTasks() {
    tasksContainer.innerHTML = '';
    
    // Filter tasks based on current filter and search
    let filteredTasks = [...tasks];
    let filterTitle = 'All Tasks';
    
    if (isSearching && currentSearch) {
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(currentSearch.toLowerCase()) ||
            task.description.toLowerCase().includes(currentSearch.toLowerCase())
        );
        filterTitle = `Search: "${currentSearch}"`;
    } else {
        if (currentFilter === 'pending') {
            filteredTasks = tasks.filter(task => !task.completed);
            filterTitle = 'Pending Tasks';
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
            filterTitle = 'Completed Tasks';
        } else if (currentFilter === 'today') {
            filteredTasks = tasks.filter(task => isToday(task.dueDate) && !task.completed);
            filterTitle = "Today's Tasks";
        } else if (currentFilter === 'overdue') {
            filteredTasks = tasks.filter(task => isOverdue(task.dueDate) && !task.completed);
            filterTitle = 'Overdue Tasks';
        }
    }
    
    renderFilteredTasks(filteredTasks, filterTitle);
}

// Render filtered tasks
function renderFilteredTasks(filteredTasks, title) {
    tasksContainer.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        let message = '';
        let icon = 'fas fa-clipboard-list';
        
        if (isSearching && currentSearch) {
            message = `No tasks found for "${currentSearch}"`;
            icon = 'fas fa-search';
        } else if (currentFilter === 'all') {
            message = 'No tasks added yet. Add your first task using the form on the left!';
        } else if (currentFilter === 'pending') {
            message = 'No pending tasks. Great job!';
            icon = 'fas fa-check-circle';
        } else if (currentFilter === 'completed') {
            message = 'No completed tasks yet. Complete some tasks to see them here!';
            icon = 'fas fa-check';
        } else if (currentFilter === 'today') {
            message = 'No tasks due today. Check upcoming deadlines for future tasks.';
            icon = 'fas fa-calendar-day';
        } else if (currentFilter === 'overdue') {
            message = 'No overdue tasks. Excellent!';
            icon = 'fas fa-calendar-check';
        } else {
            message = `No tasks in "${title}"`;
        }
        
        tasksContainer.innerHTML = `
            <div class="empty-state animate__animated animate__pulse">
                <div class="empty-state-icon">
                    <i class="${icon}"></i>
                </div>
                <h3>${title}</h3>
                <p>${message}</p>
                ${currentFilter !== 'all' || isSearching ? `
                    <button class="btn btn-outline" id="show-all-btn">
                        <i class="fas fa-layer-group"></i> Show All Tasks
                    </button>
                ` : ''}
            </div>
        `;
        
        // Add event listener to "Show All Tasks" button
        const showAllBtn = document.getElementById('show-all-btn');
        if (showAllBtn) {
            showAllBtn.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelector('[data-filter="all"]').classList.add('active');
                currentFilter = 'all';
                currentSearch = '';
                searchInput.value = '';
                isSearching = false;
                clearSearchBtn.style.display = 'none';
                renderTasks();
            });
        }
        
        return;
    }
    
    // Sort tasks: overdue first, then by due date, then by priority
    filteredTasks.sort((a, b) => {
        // Overdue tasks first
        const aOverdue = isOverdue(a.dueDate) && !a.completed;
        const bOverdue = isOverdue(b.dueDate) && !b.completed;
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        
        // Then by due date (earlier first)
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        
        // Then by priority (high to low)
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Create tasks grid
    const tasksGrid = document.createElement('div');
    tasksGrid.className = 'tasks-grid';
    
    // Render each task
    filteredTasks.forEach(task => {
        const subject = subjects.find(s => s.id === task.subjectId);
        const taskEl = createTaskElement(task, subject);
        tasksGrid.appendChild(taskEl);
    });
    
    tasksContainer.appendChild(tasksGrid);
}

// Create task element
function createTaskElement(task, subject) {
    const taskEl = document.createElement('div');
    taskEl.className = `task-card ${task.completed ? 'completed' : ''} ${task.priority}-priority`;
    taskEl.dataset.id = task.id;
    
    // Determine due date styling
    let dueDateClass = '';
    let dueDateText = formatDate(task.dueDate);
    
    if (task.completed) {
        dueDateClass = '';
    } else if (isOverdue(task.dueDate)) {
        dueDateClass = 'overdue';
        dueDateText = `Overdue: ${dueDateText}`;
    } else if (isToday(task.dueDate)) {
        dueDateClass = 'today';
        dueDateText = `Today: ${dueDateText}`;
    } else {
        dueDateClass = 'upcoming';
    }
    
    taskEl.innerHTML = `
        <div class="task-header">
            <h3 class="task-title">${task.title}</h3>
            <div class="task-actions">
                <button class="action-btn edit-btn" data-id="${task.id}" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn complete-btn" data-id="${task.id}" title="${task.completed ? 'Mark as pending' : 'Mark as complete'}">
                    <i class="fas ${task.completed ? 'fa-undo' : 'fa-check-circle'}"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${task.id}" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        
        <div class="task-details">
            <div class="task-detail">
                <i class="fas fa-folder"></i>
                <span class="task-subject">${subject ? subject.name : 'Uncategorized'}</span>
            </div>
            <div class="task-detail">
                <i class="fas fa-calendar-alt"></i>
                <span class="due-date ${dueDateClass}">${dueDateText}</span>
            </div>
        </div>
        
        ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
        
        <div class="task-footer">
            <span class="priority-badge priority-${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority</span>
            <span class="status">${task.completed ? '<i class="fas fa-check"></i> Completed' : '<i class="fas fa-clock"></i> Pending'}</span>
        </div>
    `;
    
    return taskEl;
}

// Open edit task modal
function openEditTaskModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Populate form with task data
    document.getElementById('edit-task-id').value = task.id;
    document.getElementById('edit-task-title').value = task.title;
    document.getElementById('edit-task-description').value = task.description || '';
    document.getElementById('edit-task-due-date').value = task.dueDate;
    document.getElementById('edit-task-priority').value = task.priority;
    document.getElementById('edit-task-completed').checked = task.completed;
    
    // Set subject
    const subjectSelect = document.getElementById('edit-task-subject');
    subjectSelect.value = task.subjectId;
    
    // Show modal
    editTaskModal.classList.add('show');
}

// Close edit task modal
function closeEditTaskModal() {
    editTaskModal.classList.remove('show');
}

// Update all statistics
function updateAllStats() {
    updateTaskStats();
    updateProductivity();
    updateTodayProgress();
    updateUpcomingDeadlines();
}

// Update task statistics
function updateTaskStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    
    // Count upcoming deadlines (pending tasks with due date in future or today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingTasks = tasks.filter(task => {
        if (task.completed) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= today;
    }).length;
    
    upcomingCountEl.textContent = upcomingTasks;
    completedCountEl.textContent = completedTasks;
    totalCountEl.textContent = totalTasks;
}

// Update productivity percentage
function updateProductivity() {
    if (tasks.length === 0) {
        productivityPercentage.textContent = '0%';
        return;
    }
    
    const completedTasks = tasks.filter(task => task.completed).length;
    const productivity = Math.round((completedTasks / tasks.length) * 100);
    
    productivityPercentage.textContent = `${productivity}%`;
}

// Update today's progress
function updateTodayProgress() {
    const todayTasks = tasks.filter(task => isToday(task.dueDate));
    const completedTodayTasks = todayTasks.filter(task => task.completed).length;
    const totalTodayTasks = todayTasks.length;
    
    const progress = totalTodayTasks > 0 ? Math.round((completedTodayTasks / totalTodayTasks) * 100) : 0;
    todayProgressBar.style.width = `${progress}%`;
    todayProgressValue.textContent = `${completedTodayTasks}/${totalTodayTasks}`;
}

// Update upcoming deadlines list
function updateUpcomingDeadlines() {
    upcomingDeadlinesEl.innerHTML = '';
    
    // Get upcoming deadlines (next 7 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingTasks = tasks
        .filter(task => {
            if (task.completed) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= today && dueDate <= nextWeek;
        })
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 3); // Show only 3 upcoming deadlines
    
    if (upcomingTasks.length === 0) {
        upcomingDeadlinesEl.innerHTML = '<p class="no-deadlines">No upcoming deadlines</p>';
        return;
    }
    
    upcomingTasks.forEach(task => {
        const subject = subjects.find(s => s.id === task.subjectId);
        const deadlineItem = document.createElement('div');
        deadlineItem.className = 'deadline-item';
        
        const dueDate = new Date(task.dueDate);
        const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        let dateText = daysDiff === 0 ? 'Today' : daysDiff === 1 ? 'Tomorrow' : `In ${daysDiff} days`;
        
        deadlineItem.innerHTML = `
            <span class="deadline-task">${task.title}</span>
            <span class="deadline-date">${dateText}</span>
        `;
        
        upcomingDeadlinesEl.appendChild(deadlineItem);
    });
}

// Toggle task completion status
function toggleTaskCompletion(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        const wasCompleted = tasks[taskIndex].completed;
        tasks[taskIndex].completed = !wasCompleted;
        
        // Celebrate completion
        if (!wasCompleted) {
            celebrateCompletion();
        }
        
        saveToLocalStorage();
        renderTasks();
        renderSubjects();
        updateAllStats();
        
        showNotification(
            wasCompleted ? 'Task marked as pending' : 'Task completed! Great job!',
            wasCompleted ? 'info' : 'success'
        );
    }
}

// Edit a task
function editTask(taskId, updatedTask) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], ...updatedTask };
        
        saveToLocalStorage();
        renderTasks();
        renderSubjects();
        updateAllStats();
        
        showNotification('Task updated successfully', 'success');
    }
}

// Delete a task
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveToLocalStorage();
        renderTasks();
        renderSubjects();
        updateAllStats();
        showNotification('Task deleted successfully', 'info');
    }
}

// Clear all completed tasks
function clearCompletedTasks() {
    const completedCount = tasks.filter(task => task.completed).length;
    if (completedCount === 0) {
        showNotification('No completed tasks to clear', 'info');
        return;
    }
    
    if (confirm(`Are you sure you want to clear all ${completedCount} completed tasks?`)) {
        tasks = tasks.filter(task => !task.completed);
        saveToLocalStorage();
        renderTasks();
        renderSubjects();
        updateAllStats();
        showNotification(`Cleared ${completedCount} completed tasks`, 'success');
    }
}

// Clear all categories
function clearAllCategories() {
    if (subjects.length === 0) {
        showNotification('No categories to clear', 'info');
        return;
    }
    
    if (confirm('Are you sure you want to clear all categories? This will also remove all tasks.')) {
        subjects = [];
        tasks = [];
        saveToLocalStorage();
        updateSubjectDropdowns();
        renderSubjects();
        renderTasks();
        updateAllStats();
        showNotification('All categories and tasks cleared', 'success');
    }
}

// Export tasks to JSON
function exportTasks() {
    const data = {
        subjects,
        tasks,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `tasktracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Tasks exported successfully', 'success');
}

// Import tasks from JSON
function importTasks() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                
                if (confirm('This will replace your current tasks. Are you sure?')) {
                    subjects = data.subjects || [];
                    tasks = data.tasks || [];
                    
                    saveToLocalStorage();
                    updateSubjectDropdowns();
                    renderSubjects();
                    renderTasks();
                    updateAllStats();
                    
                    showNotification('Tasks imported successfully', 'success');
                }
            } catch (error) {
                showNotification('Error importing file. Please check the file format.', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Reset app data
function resetApp() {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
        subjects = [];
        tasks = [];
        
        saveToLocalStorage();
        updateSubjectDropdowns();
        renderSubjects();
        renderTasks();
        updateAllStats();
        
        showNotification('App reset to initial state', 'info');
    }
}

// Celebrate task completion with confetti
function celebrateCompletion() {
    if (!confettiCanvas) return;
    
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 150;
    
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * confettiCanvas.width,
            y: Math.random() * confettiCanvas.height - confettiCanvas.height,
            size: Math.random() * 10 + 5,
            speedX: Math.random() * 3 - 1.5,
            speedY: Math.random() * 3 + 2,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            shape: Math.random() > 0.5 ? 'circle' : 'rect'
        });
    }
    
    function animateParticles() {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        
        let particlesAlive = 0;
        
        particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            
            // Add gravity
            p.speedY += 0.1;
            
            // Draw particle
            ctx.fillStyle = p.color;
            
            if (p.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(p.x, p.y, p.size, p.size);
            }
            
            // Rotate rectangles
            if (p.shape === 'rect') {
                ctx.save();
                ctx.translate(p.x + p.size / 2, p.y + p.size / 2);
                ctx.rotate(Date.now() * 0.001);
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            }
            
            if (p.y < confettiCanvas.height) {
                particlesAlive++;
            }
        });
        
        if (particlesAlive > 0) {
            requestAnimationFrame(animateParticles);
        } else {
            ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }
    }
    
    animateParticles();
}

// Show notification
function showNotification(message, type = 'info') {
    const notificationContainer = document.getElementById('notification-container');
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Handle subject form submission
subjectForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const subjectNameInput = document.getElementById('subject-name');
    const subjectName = subjectNameInput.value.trim();
    
    if (subjectName) {
        // Check if subject already exists
        if (subjects.some(s => s.name.toLowerCase() === subjectName.toLowerCase())) {
            showNotification('Category with this name already exists', 'warning');
            return;
        }
        
        // Create new subject with unique ID
        const newSubject = {
            id: subjects.length > 0 ? Math.max(...subjects.map(s => s.id)) + 1 : 1,
            name: subjectName
        };
        
        subjects.push(newSubject);
        subjectNameInput.value = '';
        
        saveToLocalStorage();
        updateSubjectDropdowns();
        renderSubjects();
        showNotification(`Category "${subjectName}" added successfully`, 'success');
    }
});

// Handle task form submission
taskForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('task-title').value.trim();
    const subjectId = parseInt(document.getElementById('task-subject').value);
    const description = document.getElementById('task-description').value.trim();
    const dueDate = document.getElementById('task-due-date').value;
    const priority = document.getElementById('task-priority').value;
    
    if (title && subjectId && dueDate) {
        // Create new task with unique ID
        const newTask = {
            id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
            title,
            subjectId,
            description,
            dueDate,
            priority,
            completed: false
        };
        
        tasks.push(newTask);
        
        // Reset form
        taskForm.reset();
        document.getElementById('task-due-date').min = getTodayDate();
        document.getElementById('task-due-date').value = getTodayDate();
        
        saveToLocalStorage();
        renderTasks();
        renderSubjects();
        updateAllStats();
        showNotification('Task added successfully', 'success');
    } else {
        showNotification('Please fill all required fields', 'warning');
    }
});

// Handle edit task form submission
editTaskForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const taskId = parseInt(document.getElementById('edit-task-id').value);
    const title = document.getElementById('edit-task-title').value.trim();
    const subjectId = parseInt(document.getElementById('edit-task-subject').value);
    const description = document.getElementById('edit-task-description').value.trim();
    const dueDate = document.getElementById('edit-task-due-date').value;
    const priority = document.getElementById('edit-task-priority').value;
    const completed = document.getElementById('edit-task-completed').checked;
    
    if (title && subjectId && dueDate) {
        const updatedTask = {
            title,
            subjectId,
            description,
            dueDate,
            priority,
            completed
        };
        
        editTask(taskId, updatedTask);
        closeEditTaskModal();
    } else {
        showNotification('Please fill all required fields', 'warning');
    }
});

// Setup event listeners
function setupEventListeners() {
    // Handle filter button clicks
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update current filter and re-render tasks
            currentFilter = this.getAttribute('data-filter');
            isSearching = false;
            currentSearch = '';
            searchInput.value = '';
            clearSearchBtn.style.display = 'none';
            renderTasks();
        });
    });
    
    // Theme toggle
    themeSwitch.addEventListener('change', function() {
        document.body.classList.toggle('dark-theme', this.checked);
        saveToLocalStorage();
    });
    
    // Quick add task button
    quickAddBtn?.addEventListener('click', function() {
        // Focus on task title input
        document.getElementById('task-title').focus();
        showNotification('Start typing your task details below', 'info');
    });
    
    // Search functionality
    searchInput.addEventListener('input', function() {
        currentSearch = this.value.trim();
        isSearching = currentSearch.length > 0;
        clearSearchBtn.style.display = isSearching ? 'block' : 'none';
        
        if (isSearching) {
            filterButtons.forEach(btn => btn.classList.remove('active'));
        }
        
        renderTasks();
    });
    
    // Clear search button
    clearSearchBtn.addEventListener('click', function() {
        searchInput.value = '';
        currentSearch = '';
        isSearching = false;
        this.style.display = 'none';
        
        filterButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-filter="all"]').classList.add('active');
        currentFilter = 'all';
        
        renderTasks();
    });
    
    // Modal close buttons
    modalClose.addEventListener('click', closeEditTaskModal);
    modalCancel.addEventListener('click', closeEditTaskModal);
    
    // Close modal when clicking outside
    editTaskModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeEditTaskModal();
        }
    });
    
    // Clear completed tasks button
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    
    // Clear categories button
    clearCategoriesBtn.addEventListener('click', clearAllCategories);
    
    // Export button
    exportBtn.addEventListener('click', exportTasks);
    
    // Import button
    importBtn.addEventListener('click', importTasks);
    
    // Reset button
    resetBtn.addEventListener('click', resetApp);
    
    // Add event delegation for task actions
    tasksContainer.addEventListener('click', function(e) {
        const editBtn = e.target.closest('.edit-btn');
        const completeBtn = e.target.closest('.complete-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        
        if (editBtn) {
            const taskId = parseInt(editBtn.getAttribute('data-id'));
            openEditTaskModal(taskId);
        }
        
        if (completeBtn) {
            const taskId = parseInt(completeBtn.getAttribute('data-id'));
            toggleTaskCompletion(taskId);
        }
        
        if (deleteBtn) {
            const taskId = parseInt(deleteBtn.getAttribute('data-id'));
            deleteTask(taskId);
        }
    });
}

// Save data to localStorage
function saveToLocalStorage() {
    localStorage.setItem('taskTrackerSubjects', JSON.stringify(subjects));
    localStorage.setItem('taskTrackerTasks', JSON.stringify(tasks));
    localStorage.setItem('taskTrackerTheme', themeSwitch.checked ? 'dark' : 'light');
}

// Load data from localStorage
function loadFromLocalStorage() {
    const savedSubjects = localStorage.getItem('taskTrackerSubjects');
    const savedTasks = localStorage.getItem('taskTrackerTasks');
    const savedTheme = localStorage.getItem('taskTrackerTheme');
    
    if (savedSubjects) {
        subjects = JSON.parse(savedSubjects);
    }
    
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    
    // Load default sample data if no data exists
    if (subjects.length === 0 && tasks.length === 0) {
        subjects = [
            { id: 1, name: 'Work' },
            { id: 2, name: 'Personal' },
            { id: 3, name: 'Study' },
            { id: 4, name: 'Health' }
        ];
        
        tasks = [
            {
                id: 1,
                title: 'Finish Project Report',
                subjectId: 1,
                description: 'Complete the quarterly project report and submit to manager',
                dueDate: getTodayDate(),
                priority: 'high',
                completed: false
            },
            {
                id: 2,
                title: 'Gym Session',
                subjectId: 4,
                description: 'Morning workout at the gym',
                dueDate: getTodayDate(),
                priority: 'medium',
                completed: false
            },
            {
                id: 3,
                title: 'Read Book Chapter',
                subjectId: 3,
                description: 'Read chapter 5 of JavaScript Design Patterns',
                dueDate: getTodayDate(),
                priority: 'high',
                completed: true
            },
            {
                id: 4,
                title: 'Team Meeting',
                subjectId: 1,
                description: 'Weekly team sync meeting',
                dueDate: getTodayDate(),
                priority: 'medium',
                completed: false
            },
            {
                id: 5,
                title: 'Grocery Shopping',
                subjectId: 2,
                description: 'Buy groceries for the week',
                dueDate: getFutureDate(3),
                priority: 'low',
                completed: false
            }
        ];
    }
    
    if (savedTheme) {
        themeSwitch.checked = savedTheme === 'dark';
        document.body.classList.toggle('dark-theme', themeSwitch.checked);
    }
}

// Helper function to get future date
function getFutureDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Escape to clear search or close modal
    if (e.key === 'Escape') {
        if (searchInput.value) {
            searchInput.value = '';
            currentSearch = '';
            isSearching = false;
            clearSearchBtn.style.display = 'none';
            renderTasks();
        } else if (editTaskModal.classList.contains('show')) {
            closeEditTaskModal();
        }
    }
    
    // Ctrl/Cmd + N to focus on new task title
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('task-title').focus();
    }
});