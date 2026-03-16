// ═══════════════════════════════════════════════════════════════
// DATABASE — Persistent via localStorage
// ═══════════════════════════════════════════════════════════════

// Default seed data (used first time only or when reset)
const DB_DEFAULT = {
    students: [],
    parents: [],
    staff: [
        { role: 'teacher', email: 'teacher@we.edu', name: 'أ. حسن', pass: '123', classes: ['1/A', '1/B'] },
        { role: 'control', email: 'shaimaa@we.edu', name: 'مس شيماء', pass: '123' },
        { role: 'affairs', email: 'affairs@we.edu', name: 'شئون الطلاب', pass: '123' },
        { role: 'gate', email: 'gate@we.edu', name: 'البوابة', pass: '123' },
        { role: 'admin', email: 'mai@we.edu', name: 'د. مي', pass: '123' }
    ],
    attendance: [],
    grades: [],
    behavior: [],
    notifications: [],
    exemptions: []
};

// Load from localStorage or use defaults
function loadDB() {
    try {
        const saved = localStorage.getItem('weSchoolsDB_v2');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge: always keep staff/students/parents from saved (includes admin changes)
            // but ensure required keys exist
            return {
                students:      parsed.students      || DB_DEFAULT.students,
                parents:       parsed.parents       || DB_DEFAULT.parents,
                staff:         parsed.staff         || DB_DEFAULT.staff,
                attendance:    parsed.attendance    || DB_DEFAULT.attendance,
                grades:        parsed.grades        || DB_DEFAULT.grades,
                behavior:      parsed.behavior      || DB_DEFAULT.behavior,
                notifications: parsed.notifications || DB_DEFAULT.notifications,
                exemptions:    parsed.exemptions    || DB_DEFAULT.exemptions
            };
        }
    } catch(e) {
        console.warn('فشل تحميل قاعدة البيانات من localStorage، سيتم استخدام البيانات الافتراضية.', e);
    }
    return JSON.parse(JSON.stringify(DB_DEFAULT)); // Deep clone of defaults
}

// Save current DB state to localStorage
function saveDB() {
    try {
        // Use _rawDB which holds actual plain arrays (not getter/setter object)
        localStorage.setItem('weSchoolsDB_v2', JSON.stringify({
            students:      Array.from(_rawDB.students),
            parents:       Array.from(_rawDB.parents),
            staff:         Array.from(_rawDB.staff),
            attendance:    Array.from(_rawDB.attendance),
            grades:        Array.from(_rawDB.grades),
            behavior:      Array.from(_rawDB.behavior),
            notifications: Array.from(_rawDB.notifications),
            exemptions:    Array.from(_rawDB.exemptions)
        }));
    } catch(e) {
        console.error('فشل حفظ قاعدة البيانات في localStorage:', e);
    }
}


// Make DB reactive: wrap push/splice/pop so they auto-save
function makeReactive(arr) {
    const proxy = new Proxy(arr, {
        get(target, prop) {
            if (prop === 'push') {
                return function(...args) {
                    const result = Array.prototype.push.apply(target, args);
                    saveDB();
                    return result;
                };
            }
            if (prop === 'splice') {
                return function(...args) {
                    const result = Array.prototype.splice.apply(target, args);
                    saveDB();
                    return result;
                };
            }
            if (prop === 'pop') {
                return function(...args) {
                    const result = Array.prototype.pop.apply(target, args);
                    saveDB();
                    return result;
                };
            }
            return target[prop];
        },
        set(target, prop, value) {
            target[prop] = value;
            if (!isNaN(parseInt(prop))) saveDB(); // only save on index assignments
            return true;
        }
    });
    return proxy;
}

// Initialize DB
const _rawDB = loadDB();
const DB = {
    get students()      { return _rawDB.students;      },
    set students(v)     { _rawDB.students = v; saveDB(); },
    get parents()       { return _rawDB.parents;       },
    set parents(v)      { _rawDB.parents = v; saveDB(); },
    get staff()         { return _rawDB.staff;         },
    set staff(v)        { _rawDB.staff = v; saveDB(); },
    get attendance()    { return _rawDB.attendance;    },
    set attendance(v)   { _rawDB.attendance = v; saveDB(); },
    get grades()        { return _rawDB.grades;        },
    set grades(v)       { _rawDB.grades = v; saveDB(); },
    get behavior()      { return _rawDB.behavior;      },
    set behavior(v)     { _rawDB.behavior = v; saveDB(); },
    get notifications() { return _rawDB.notifications; },
    set notifications(v){ _rawDB.notifications = v; saveDB(); },
    get exemptions()    { return _rawDB.exemptions;    },
    set exemptions(v)   { _rawDB.exemptions = v; saveDB(); }
};

// Wrap all arrays with reactive proxies
_rawDB.students      = makeReactive(_rawDB.students);
_rawDB.parents       = makeReactive(_rawDB.parents);
_rawDB.staff         = makeReactive(_rawDB.staff);
_rawDB.attendance    = makeReactive(_rawDB.attendance);
_rawDB.grades        = makeReactive(_rawDB.grades);
_rawDB.behavior      = makeReactive(_rawDB.behavior);
_rawDB.notifications = makeReactive(_rawDB.notifications);
_rawDB.exemptions    = makeReactive(_rawDB.exemptions);

// Dev helper — exposed globally for console use & reset button
window.resetDB = function() {
    if(confirm('⚠️ سيتم حذف جميع البيانات المحفوظة والعودة للبيانات الافتراضية. هل أنت متأكد؟')) {
        localStorage.removeItem('weSchoolsDB_v2');
        location.reload();
    }
};

// Database Backup & Restore
window.exportDB = function() {
    const data = JSON.stringify(_rawDB, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `we_schools_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

window.importDB = function(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if(confirm('⚠️ سيتم استبدال قاعدة البيانات الحالية بالملف المختار. هل أنت متأكد؟')) {
                localStorage.setItem('weSchoolsDB_v2', JSON.stringify(data));
                location.reload();
            }
        } catch(err) {
            alert('خطأ في قراءة ملف النسخة الاحتياطية.');
        }
    };
    reader.readAsText(file);
};

// ═══════════════════════════════════════
let currentUser = null;

// Initialize Lucide Icons
lucide.createIcons();


// DOM Elements
const views = {
    auth: document.getElementById('auth-view'),
    dashboard: document.getElementById('dashboard-view')
};
const tabs = document.querySelectorAll('.tab');
const inputGroups = document.querySelectorAll('.input-group');
const displayRole = document.getElementById('display-role');
const displayName = document.getElementById('display-name');
const sidebarNav = document.getElementById('sidebar-nav');
const contentArea = document.getElementById('content-area');
const pageTitle = document.getElementById('page-title');

// Google Login Configuration
function decodeJwtResponse(token) {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

window.onload = function () {
    google.accounts.id.initialize({
        client_id: "236793430569-vrh2m36o61bept5bc6l1mp8bkai1epp9.apps.googleusercontent.com", 
        callback: handleGoogleLogin
    });
    
    // Render button for Parent Tab
    google.accounts.id.renderButton(
        document.getElementById("google-btn-parent"),
        { theme: "outline", size: "large", type: "standard", text: "continue_with" }
    );
};

function handleGoogleLogin(response) {
    const responsePayload = decodeJwtResponse(response.credential);
    const email = responsePayload.email;
    const name = responsePayload.name;
    const activeTab = document.querySelector('.tab.active').dataset.role;

    if (activeTab === 'parent') {
        const code = document.getElementById('parent-student-code').value;
        const natId = document.getElementById('parent-national-id').value;
        
        if(!code || !natId) {
            alert('برجاء إدخال كود الطالب والرقم القومي أولاً قبل تسجيل الدخول بحساب جوجل للربط.');
            return;
        }

        const student = DB.students.find(s => s.code === code && s.nationalId === natId);
        if (student) {
            // Update parent email if it's their first time
            let parentRecord = DB.parents.find(p => p.studentId === student.id);
            if(parentRecord) {
                parentRecord.email = email;
            } else {
                 DB.parents.push({ 
                    email: email, 
                    studentId: student.id,
                    name: name,
                    pass: '123' // default pass if they ever need local login
                });
            }
            currentUser = { role: 'parent', data: student, parentEmail: email, parentName: name };
            views.auth.classList.replace('active', 'hidden');
            views.dashboard.classList.replace('hidden', 'active');
            initDashboard();
        } else {
            alert('بيانات الطالب (الكود أو الرقم القومي) غير صحيحة.');
        }
    }
}

// Auth Tabs Logic
tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        // Reset tabs
        tabs.forEach(t => t.classList.remove('active'));
        inputGroups.forEach(g => {
            g.classList.remove('active');
            g.classList.add('hidden');
        });
        
        // Activate selected
        tab.classList.add('active');
        const role = tab.dataset.role;
        const targetGroup = document.getElementById(`${role}-inputs`);
        targetGroup.classList.remove('hidden');
        targetGroup.classList.add('active');
        
        // Toggle Main Login Button (Parents use Google Button instead)
        if (role === 'parent') {
            document.getElementById('main-login-btn').classList.add('hidden');
        } else {
            document.getElementById('main-login-btn').classList.remove('hidden');
        }
    });
});

    // Removed MS and manual fallback staff event listeners since login is now purely local using unified form

// Auth Submit Logic (For Parents & Staff)
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const activeTab = document.querySelector('.tab.active').dataset.role;
    
    let loggedIn = false;

    if (activeTab === 'student') {
        const email = document.getElementById('student-email').value;
        const pass = document.getElementById('student-pass').value;
        const student = DB.students.find(s => s.email === email && s.pass === pass);
        if (student) {
            currentUser = { role: 'student', data: student };
            loggedIn = true;
        }
    } else if (activeTab === 'staff') {
        const email = document.getElementById('staff-email').value;
        const pass = document.getElementById('staff-pass').value;
        const staff = DB.staff.find(s => s.email === email && s.pass === pass);
        if (staff) {
            currentUser = { role: staff.role, data: staff };
            loggedIn = true;
        }
    }

    if (loggedIn) {
        views.auth.classList.replace('active', 'hidden');
        views.dashboard.classList.replace('hidden', 'active');
        initDashboard();
    } else {
        alert('بيانات الدخول غير صحيحة');
    }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    currentUser = null;
    window.location.href = 'login.html';
});

// Render Dashboard
function initDashboard() {
    displayName.textContent = currentUser.data.name || 'ولي أمر: ' + currentUser.data.name;
    const roleTitles = {
        'student': 'طالب',
        'parent': 'ولي أمر',
        'admin': 'إدارة النظام',
        'control': 'كنترول (مس شيماء)',
        'affairs': 'شئون الطلاب',
        'gate': 'البوابة',
        'teacher': 'مدرس'
    };
    displayRole.textContent = roleTitles[currentUser.role];

    renderSidebar();
    
    // Default load first item
    if(currentUser.role === 'admin') loadAdminDash();
    else if(currentUser.role === 'student' || currentUser.role === 'parent') loadStudentDash();
    else if(currentUser.role === 'gate') loadGateDash();
    else if(currentUser.role === 'control') loadControlDash();
    else if(currentUser.role === 'affairs') { window._affairsClass = null; loadAffairsDash(); }
    else if(currentUser.role === 'teacher') { window._teacherClass = null; window._teacherTab = 'tch-tab-home'; loadTeacherDash(); }
    
    // Update Notification Badge
    if (currentUser.role === 'student') {
        const nots = DB.notifications.filter(n => n.recipientId === currentUser.data.id && !n.read).length;
        document.querySelector('.notification-btn .badge').textContent = nots;
        document.querySelector('.notification-btn .badge').style.display = nots > 0 ? 'block' : 'none';
    } else {
        document.querySelector('.notification-btn .badge').style.display = 'none';
    }
}

const navConfig = {
    admin: [ { label: 'لوحة التحكم', id: 'admin-dash', icon: 'layout-dashboard' } ],
    student: [
        { label: 'الرئيسية', id: 'student-home', icon: 'home', tabId: 'std-tab-home' },
        { label: 'الجدول الدراسي', id: 'student-schedule', icon: 'calendar', tabId: 'std-tab-schedule' },
        { label: 'الدرجات', id: 'student-grades', icon: 'trending-up', tabId: 'std-tab-grades' },
        { label: 'الامتحانات', id: 'student-exams', icon: 'file-text', tabId: 'std-tab-exams' },
        { label: 'الحضور', id: 'student-attendance', icon: 'check-square', tabId: 'std-tab-attendance' },
        { label: 'البريد الإلكتروني', id: 'student-email', icon: 'mail', tabId: 'std-tab-email' },
        { label: 'الإشعارات', id: 'student-notifs', icon: 'bell', tabId: 'std-tab-notifs' },
        { label: 'الملف الشخصي', id: 'student-profile', icon: 'user', tabId: 'std-tab-profile' }
    ],
    parent: [ { label: 'متابعة الطالب', id: 'student-dash', icon: 'users' } ],
    gate: [ { label: 'تسجيل الدخول', id: 'gate-dash', icon: 'door-open' } ],
    control: [ { label: 'مراجعة الدرجات', id: 'control-dash', icon: 'check-square' } ],
    affairs: [ { label: 'شئون الطلاب', id: 'affairs-dash', icon: 'file-text' } ],
    teacher: [
        { label: 'الرئيسية', id: 'teacher-home', icon: 'home', tabId: 'tch-tab-home' },
        { label: 'فصولي', id: 'teacher-classes', icon: 'users', tabId: 'tch-tab-classes' },
        { label: 'أعمال الدرجات', id: 'teacher-grades', icon: 'trending-up', tabId: 'tch-tab-grades' },
        { label: 'الحضور والغياب', id: 'teacher-attendance', icon: 'calendar-check', tabId: 'tch-tab-attendance' },
        { label: 'نقاط السلوك', id: 'teacher-behavior', icon: 'star', tabId: 'tch-tab-behavior' }
    ]
};

function renderSidebar() {
    sidebarNav.innerHTML = '';
    const links = navConfig[currentUser.role];
    links.forEach((link, idx) => {
        const el = document.createElement('a');
        el.className = `nav-item ${idx===0 ? 'active' : ''}`;
        el.style.cursor = 'pointer';
        el.innerHTML = `<i data-lucide="${link.icon}"></i> ${link.label}`;
        if(link.tabId) {
            // student tabs
            if(currentUser.role === 'student' || currentUser.role === 'parent') {
                el.onclick = () => {
                    document.querySelectorAll('#sidebar-nav .nav-item').forEach(n => n.classList.remove('active'));
                    el.classList.add('active');
                    if(window.switchStudentTab) window.switchStudentTab(link.tabId);
                };
            }
            // teacher tabs
            else if(currentUser.role === 'teacher') {
                el.onclick = () => {
                    document.querySelectorAll('#sidebar-nav .nav-item').forEach(n => n.classList.remove('active'));
                    el.classList.add('active');
                    window._teacherTab = link.tabId;
                    loadTeacherDash();
                };
            }
        }
        sidebarNav.appendChild(el);
    });
    lucide.createIcons();
}

// Global scope variables for student filtering
window.adminStudentFilter = {
    grade: '',
    code: '',
    nationalId: '',
    class: ''
};

window.adminStudentSort = {
    column: null,
    asc: true
};

window.adminStudentSearch = '';

window.applyStudentFilter = function() {
    window.adminStudentFilter.grade = document.getElementById('filter-grade')?.value || '';
    window.adminStudentFilter.code = document.getElementById('filter-code')?.value || '';
    window.adminStudentFilter.nationalId = document.getElementById('filter-natid')?.value || '';
    window.adminStudentFilter.class = document.getElementById('filter-class')?.value || '';
    // Reset secondary search on primary filter
    window.adminStudentSearch = '';
    renderAdminUsersList();
};

window.searchStudentTable = function(inputEl) {
    window.adminStudentSearch = inputEl.value.toLowerCase();
    renderAdminUsersList();
};

window.sortStudentTable = function(column) {
    if (window.adminStudentSort.column === column) {
        window.adminStudentSort.asc = !window.adminStudentSort.asc;
    } else {
        window.adminStudentSort.column = column;
        window.adminStudentSort.asc = true;
    }
    renderAdminUsersList();
}

window.quickStudentFilter = function(grade) {
    if(document.getElementById('filter-grade')) {
        document.getElementById('filter-grade').value = grade;
    }
    window.adminStudentFilter.grade = grade;
    window.adminStudentFilter.code = '';
    window.adminStudentFilter.nationalId = '';
    window.adminStudentFilter.class = '';
    if(document.getElementById('filter-code')) document.getElementById('filter-code').value = '';
    if(document.getElementById('filter-natid')) document.getElementById('filter-natid').value = '';
    if(document.getElementById('filter-class')) document.getElementById('filter-class').value = '';
    window.adminStudentSearch = '';
    renderAdminUsersList();
};

window.switchMinistryTab = function(tabId) {
    // Hide all tabs
    document.querySelectorAll('.ministry-tab-content').forEach(tab => tab.classList.remove('active'));
    // Show target tab
    document.getElementById(tabId).classList.add('active');
    
    // Update active state on nav items (if applicable)
    document.querySelectorAll('.m-nav-item').forEach(item => item.classList.remove('active'));
    
    // Auto-load data for specific tabs
    if (tabId === 'tab-search-student') {
        window.adminStudentFilter = { grade: '', code: '', nationalId: '', class: '' };
        window.adminStudentSearch = '';
        if(document.getElementById('filter-grade')) document.getElementById('filter-grade').value = '';
        if(document.getElementById('filter-code')) document.getElementById('filter-code').value = '';
        if(document.getElementById('filter-natid')) document.getElementById('filter-natid').value = '';
        if(document.getElementById('filter-class')) document.getElementById('filter-class').value = '';
        renderAdminUsersList();
    } else if (tabId === 'tab-student-review') {
        if(window.renderStudentReviewReport) renderStudentReviewReport();
    } else if (tabId === 'tab-attendance') {
        if(window.renderAttendanceList) renderAttendanceList();
    }
}

window.switchFacultyTab = function(tabName) {
    document.querySelectorAll('.f-tab-content').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.f-tab').forEach(t => { 
        t.style.background = 'transparent'; 
        t.style.color = '#333'; 
        t.style.borderBottom = 'none'; 
    });
    
    document.getElementById('f-tab-' + tabName).style.display = 'grid';
    const activeBtn = document.querySelector(`.f-tab[data-tab="\${tabName}"]`);
    if(activeBtn) {
        activeBtn.style.background = 'white';
        activeBtn.style.color = '#007ba7';
        activeBtn.style.borderBottom = '2px solid #007ba7';
    }
};

window.renderFacultyDetails = function(idx) {
    if (idx === "") {
        document.getElementById('faculty-details-container').style.display = 'none';
        return;
    }
    const staff = DB.staff[idx];
    document.getElementById('faculty-details-container').style.display = 'block';
    
    // Fill basic details
    document.getElementById('fd-name').textContent = staff.name;
    document.getElementById('fd-email').textContent = staff.email;
    
    // Fill teaching data based on assignments if teacher
    if (staff.role === 'teacher' && staff.assignments && staff.assignments.length > 0) {
        document.getElementById('fd-subjects').innerHTML = staff.assignments.map(a => `<span style="background:var(--primary);color:white;padding:2px 8px;border-radius:12px;font-size:0.8rem;margin-left:5px;display:inline-block;margin-bottom:4px;">${a.subject}</span>`).join('');
        const allClasses = new Set();
        staff.assignments.forEach(a => a.classes.forEach(c => allClasses.add(c)));
        document.getElementById('fd-classes').innerHTML = Array.from(allClasses).map(c => `<span style="background:#6c757d;color:white;padding:2px 8px;border-radius:12px;font-size:0.8rem;margin-left:5px;display:inline-block;margin-bottom:4px;">${c}</span>`).join('');
    } else {
        document.getElementById('fd-subjects').textContent = 'لا توجد مواد مسندة';
        document.getElementById('fd-classes').textContent = 'لا توجد فصول مسندة';
    }
    
    window.switchFacultyTab('personal');
};

// Render Specific Views
function loadAdminDash() {
    pageTitle.textContent = "لوحة التحكم (الإدارة العليا)";
    contentArea.innerHTML = `
        <!-- Ministry Header Top Bar -->
        <div class="ministry-header">
            <div class="ministry-top-bar">
                <div class="ministry-logo-section">
                    <img src="assets/ministry-logo.svg" alt="وزارة التربية والتعليم" class="ministry-logo-img" onerror="this.src=''; this.alt='وزارة التربية والتعليم';">
                    <div class="ministry-title-section">
                        <span class="ministry-title">بوابة مركز المعلومات</span>
                        <span class="ministry-subtitle">بيانات التلميذ</span>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                    <div class="ministry-user-info">
                        <!-- Email removed per request -->
                    </div>
                    <div class="ministry-info-badges">
                        <span class="m-badge orange">المدرسة : مدارس We للتكنولوجيا التطبيقية</span>
                        <span class="m-badge blue">المرحلة: صناعي 3 سنوات</span>
                        <span class="m-badge blue">التبعية: رسمي</span>
                        <span class="m-badge blue">الرقم المسلسل: 2026</span>
                    </div>
                </div>
            </div>

            <!-- Ministry Navigation Menu -->
            <div class="ministry-nav">
                <div class="m-nav-item active" onclick="switchMinistryTab('tab-home')">
                    <i data-lucide="home" style="width: 16px;"></i> الرئيسية
                </div>
                
                <div class="m-nav-item">
                    <i data-lucide="user" style="width: 16px;"></i> ملف بيانات الطالب <i data-lucide="chevron-down" style="width: 14px;"></i>
                    <div class="m-dropdown">
                        <div class="m-dropdown-item" onclick="switchMinistryTab('tab-add-student')">اضافة بيانات طالب جديد</div>
                        <div class="m-dropdown-item" onclick="switchMinistryTab('tab-search-student')">بحث / تعديل بيانات طالب</div>
                        <div class="m-dropdown-item" onclick="switchMinistryTab('tab-student-review')">تقرير مراجعة بيانات الطلاب</div>
                    </div>
                </div>

                <div class="m-nav-item" onclick="switchMinistryTab('tab-attendance')">
                    <i data-lucide="calendar-off" style="width: 16px;"></i> الغياب والإعفاءات
                </div>

                <div class="m-nav-item">
                    <i data-lucide="users" style="width: 16px;"></i> المدرسين و الإداريين <i data-lucide="chevron-down" style="width: 14px;"></i>
                    <div class="m-dropdown">
                        <div class="m-dropdown-item" onclick="switchMinistryTab('tab-assign-teachers')">توزيع المدرسين على الصفوف</div>
                        <div class="m-dropdown-item" onclick="switchMinistryTab('tab-faculty-data')">بيانات هيئة التدريس</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- TAB CONTENT AREAS -->

        <!-- TAB 1: Home (Default) -->
        <div id="tab-home" class="ministry-tab-content active">
            <div class="grid">
                <div class="card">
                    <div class="card-title"><i data-lucide="users"></i> عدد الطلاب</div>
                    <div class="card-value" id="stat-students">${DB.students.length}</div>
                </div>
                <div class="card">
                    <div class="card-title"><i data-lucide="graduation-cap"></i> طاقم العمل والمدرسين</div>
                    <div class="card-value" id="stat-staff">${DB.staff.length}</div>
                </div>
            </div>
            <div id="staff-tables-container" style="margin-top: 24px;"></div>
        </div>

        <!-- TAB 2: Add Student (and Staff) -->
        <div id="tab-add-student" class="ministry-tab-content">
            <div class="grid" style="grid-template-columns: 1fr;">
                <div class="card action-card">
                    <h3><i data-lucide="user-plus"></i> إضافة طالب / مستخدم جديد للنظام</h3>
                    <form id="admin-add-user-form" style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px;">
                        <input type="text" id="new-user-name" placeholder="الاسم بالكامل" required style="flex: 1; min-width: 200px;">
                        <input type="email" id="new-user-email" placeholder="البريد الإلكتروني المؤسسي" required style="flex: 1; min-width: 250px;">
                        <input type="password" id="new-user-pass" placeholder="كلمة المرور الابتدائية" required style="flex: 1; min-width: 150px;">
                        
                        <select id="new-user-role" required style="flex: 1; min-width: 150px; padding: 14px 16px; border: 2px solid var(--border); border-radius: var(--radius); font-family: inherit; font-size: 1rem; color: var(--text); background: var(--surface);" onchange="document.getElementById('student-extra-fields').style.display = this.value === 'student' ? 'flex' : 'none';">
                            <option value="" disabled selected>اختيار الصلاحية...</option>
                            <option value="student">طالب</option>
                            <option value="teacher">مدرس</option>
                            <option value="control">حساب كنترول (درجات)</option>
                            <option value="affairs">شئون طلاب</option>
                            <option value="gate">موظف أمن / بوابة</option>
                            <option value="admin">مدير نظام (Administrator)</option>
                        </select>

                        <div id="student-extra-fields" style="display: none; width: 100%; gap: 10px; margin-top: 5px;">
                            <input type="text" id="new-student-code" placeholder="كود الطالب الحقيقي (مثال 12345678)" style="flex: 1;">
                            <input type="text" id="new-student-natid" placeholder="الرقم القومي للطالب (14 رقم)" style="flex: 1;">
                            <select id="new-student-grade" style="flex: 1; padding: 10px; border: 2px solid var(--border); border-radius: var(--radius);">
                                <option value="الصف الأول">الصف الأول</option>
                                <option value="الصف الثاني">الصف الثاني</option>
                                <option value="الصف الثالث">الصف الثالث</option>
                            </select>
                        </div>

                        <button type="submit" style="min-width: 150px; padding: 14px; background: var(--primary); color: white; border: none; border-radius: var(--radius); cursor: pointer; font-weight: bold; font-family: inherit; margin-top: 10px;">
                            إضافة وتحويل الصلاحية
                        </button>
                    </form>
                </div>
            </div>
        </div>

        <!-- TAB 3: Search Students (Ministry Table) -->
        <div id="tab-search-student" class="ministry-tab-content">
            <div style="background: #eef1f4; padding: 0; border: 1px solid #e0e0e0; font-family: 'Cairo', sans-serif; direction: rtl;">
                <div style="background: #33404c; color: white; padding: 10px 20px; font-size: 1.1rem; text-align: right; display:flex; justify-content:space-between; align-items:center;">
                    <span>بحث وسجل التلاميذ</span>
                    <div style="display:flex; gap:10px;">
                        <button onclick="quickStudentFilter('الصف الأول')" style="background:var(--primary); color:white; border:none; padding:4px 12px; border-radius:4px; cursor:pointer; font-size:0.9rem;">الصف الأول</button>
                        <button onclick="quickStudentFilter('الصف الثاني')" style="background:var(--primary); color:white; border:none; padding:4px 12px; border-radius:4px; cursor:pointer; font-size:0.9rem;">الصف الثاني</button>
                        <button onclick="quickStudentFilter('الصف الثالث')" style="background:var(--primary); color:white; border:none; padding:4px 12px; border-radius:4px; cursor:pointer; font-size:0.9rem;">الصف الثالث</button>
                        <button onclick="quickStudentFilter('')" style="background:#6c757d; color:white; border:none; padding:4px 12px; border-radius:4px; cursor:pointer; font-size:0.9rem;">عرض الكل</button>
                    </div>
                </div>
                <div style="padding: 20px; background: white; margin: 15px;">
                    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 150px; text-align: right;">
                            <label style="display: block; margin-bottom: 5px; color: #555; font-size: 0.9rem;">الصف<span style="color:red;">*</span></label>
                            <select id="filter-grade" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit;">
                                <option value="">اختر الصف</option>
                                <option value="الصف الأول">الصف الأول</option>
                                <option value="الصف الثاني">الصف الثاني</option>
                                <option value="الصف الثالث">الصف الثالث</option>
                            </select>
                        </div>

                        <div style="flex: 1; min-width: 150px; text-align: right;">
                            <label style="display: block; margin-bottom: 5px; color: #555; font-size: 0.9rem;">كود التلميذ</label>
                            <input type="text" id="filter-code" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit;">
                        </div>

                        <div style="flex: 1; min-width: 150px; text-align: right;">
                            <label style="display: block; margin-bottom: 5px; color: #555; font-size: 0.9rem;">الرقم القومى</label>
                            <input type="text" id="filter-natid" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit;">
                        </div>

                        <div style="flex: 1; min-width: 150px; text-align: right;">
                            <label style="display: block; margin-bottom: 5px; color: #555; font-size: 0.9rem;">الفصل</label>
                            <select id="filter-class" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit;">
                                <option value="">اختر</option>
                                <option value="1/A">1/A</option>
                                <option value="1/B">1/B</option>
                            </select>
                        </div>
                    </div>

                    <div style="text-align: left; margin-top: 10px;">
                        <a href="#" style="color: #2b7095; text-decoration: none; font-size: 0.85rem; border-bottom: 1px solid #2b7095;">المزيد من ادوات البحث</a>
                    </div>

                    <div style="text-align: left; margin-top: 20px;">
                        <button onclick="applyStudentFilter()" style="background: #394aba; color: white; padding: 8px 40px; border: none; border-radius: 20px; cursor: pointer; font-family: 'Cairo', sans-serif; font-size: 1rem;">بحث</button>
                    </div>
                </div>
                
                <div id="student-search-results" style="padding: 0 15px 15px 15px; background: white; margin: 0 15px 15px 15px;">
                    <!-- Table injected via JS -->
                </div>
            </div>
        </div>

        <!-- TAB 4: Placeholder for unimplemented pages -->
        <div id="tab-placeholder" class="ministry-tab-content">
            <div style="padding: 60px 20px; text-align: center; background: white; border-radius: 8px; border: 1px solid #eee;">
                <i data-lucide="wrench" style="width: 64px; height: 64px; color: #007ba7; margin-bottom: 20px;"></i>
                <h2 style="color: #333;">عفواً، هذه الصفحة قيد التطوير</h2>
                <p style="color: #666; font-size: 1.1rem; margin-top: 10px;">هذا القسم يتم العمل على برمجته حالياً ليتوافق مع أحدث معايير الوزارة. يمكنك تصفح قسم "ملف بيانات الطالب" في الوقت الحالي.</p>
                <button onclick="switchMinistryTab('tab-home')" style="margin-top: 25px; background: #007ba7; color: white; border: none; padding: 10px 24px; border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 1rem;">العودة للرئيسية</button>
            </div>
        </div>

        <!-- NEW TAB: Student Data Review Report -->
        <div id="tab-student-review" class="ministry-tab-content">
            <div style="background: #eef1f4; padding: 0; border: 1px solid #e0e0e0; font-family: 'Cairo', sans-serif; direction: rtl;">
                <div style="background: #33404c; color: white; padding: 10px 20px; font-size: 1.1rem; text-align: right; display:flex; justify-content:space-between; align-items:center;">
                    <span>تقرير مراجعة بيانات الطلاب</span>
                    <button onclick="alert('جاري تصدير التقرير...')" style="background:var(--primary); color:white; border:none; padding:4px 12px; border-radius:4px; font-family:inherit; cursor:pointer; font-size:0.9rem;"><i data-lucide="download" style="width: 14px; margin-left: 5px;"></i>تصدير Excel</button>
                </div>
                <div style="padding: 20px; background: white; margin: 15px;">
                    <p style="color: #555; font-size: 0.95rem; margin-bottom: 20px;">
                        تقرير رقابي يهدف إلى تدقيق وفحص البيانات الشخصية للطلاب، وحصر الأوراق غير المكتملة، وتوضيح الموقف الأكاديمي والمالي.
                    </p>
                    
                    <div style="display: flex; gap: 15px; margin-bottom: 20px; align-items:flex-end;">
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 5px; color: #555; font-size: 0.9rem;">بحث (الاسم، الرقم القومي)...</label>
                            <input id="review-search" type="text" placeholder="ابحث هنا..." style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit;" onkeyup="filterStudentReviewTable()">
                        </div>
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 5px; color: #555; font-size: 0.9rem;">تصفية حسب نوع النقص</label>
                            <select id="review-issue-filter" onchange="filterStudentReviewTable()" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit;">
                                <option value="all">عرض الكل</option>
                                <option value="missing_docs">نواقص في الأوراق (ملف غير مكتمل)</option>
                                <option value="financial_debt">متأخرات مالية</option>
                                <option value="academic_issue">حالة أكاديمية غير عادية (إعادة، مفصول)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div id="student-review-results" style="padding: 0 15px 15px 15px; background: white; margin: 0 15px 15px 15px; overflow-x: auto;">
                    <!-- Table injected via JS (renderStudentReviewReport) -->
                </div>
            </div>
        </div>

        <!-- NEW TAB: Attendance and Exemptions -->
        <div id="tab-attendance" class="ministry-tab-content">
            <div style="background: #eef1f4; padding: 0; border: 1px solid #e0e0e0; font-family: 'Cairo', sans-serif; direction: rtl;">
                <div style="background: #33404c; color: white; padding: 10px 20px; font-size: 1.1rem; text-align: right; display:flex; justify-content:space-between; align-items:center;">
                    <span>الغياب والإعفاءات (طلاب وموظفين)</span>
                    <button onclick="alert('تم طباعة التقرير')" style="background:var(--primary); color:white; border:none; padding:4px 12px; border-radius:4px; font-family:inherit; cursor:pointer; font-size:0.9rem;"><i data-lucide="printer" style="width: 14px; margin-left: 5px;"></i>طباعة التقرير</button>
                </div>
                <div style="padding: 20px; background: white; margin: 15px;">
                    <p style="color: #555; font-size: 0.95rem; margin-bottom: 20px;">
                        سجل تتبع الحضور والانصراف، ويوضح أيام الغياب المسجلة. يمكن للنظام قبول الأعذار الطبية أو الرسمية وإعفاء الشخص من أيام الغياب ليتم استبعادها من نسبة الغياب الكلية.
                    </p>
                    
                    <div style="display: flex; gap: 15px; margin-bottom: 20px; align-items:flex-end;">
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 5px; color: #555; font-size: 0.9rem;">بحث بالشخص (طالب أو موظف)</label>
                            <input id="attendance-search" type="text" placeholder="الاسم، الرقم القومي، أو الكود..." style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit;" onkeyup="filterAttendanceTable()">
                        </div>
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 5px; color: #555; font-size: 0.9rem;">تصفية حسب الفئة</label>
                            <select id="attendance-role-filter" onchange="filterAttendanceTable()" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit;">
                                <option value="all">الكل (طلاب وموظفين)</option>
                                <option value="student">الطلاب فقط</option>
                                <option value="staff">أعضاء هيئة التدريس والموظفين</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div id="attendance-results" style="padding: 0 15px 15px 15px; background: white; margin: 0 15px 15px 15px;">
                    <!-- Table injected via JS (renderAttendanceList) -->
                </div>
            </div>
        </div>

        <!-- TAB 5: Assign Teachers -->
        <div id="tab-assign-teachers" class="ministry-tab-content">
            <div style="background: #eef1f4; padding: 0; border: 1px solid #e0e0e0; font-family: 'Cairo', sans-serif; direction: rtl;">
                <div style="background: #33404c; color: white; padding: 10px 20px; font-size: 1.1rem; text-align: right;">
                    توزيع المدرسين على الفصول
                </div>
                <div style="padding: 20px; background: white; margin: 15px;">
                    <form id="assign-teacher-form" style="display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-end;">
                        <div style="flex: 1; min-width: 200px; text-align: right;">
                            <label style="display: block; margin-bottom: 5px; color: #555; font-size: 0.9rem;">اسم المدرس<span style="color:red;">*</span></label>
                            <select id="assign-teacher-email" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit;">
                                <!-- Populated by JS -->
                            </select>
                        </div>

                        <div style="flex: 1; min-width: 150px; text-align: right;">
                            <label style="display: block; margin-bottom: 5px; color: #555; font-size: 0.9rem;">المادة<span style="color:red;">*</span></label>
                            <input type="text" id="assign-subject" placeholder="مثال: فيزياء" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit;">
                        </div>

                        <div style="flex: 2; min-width: 250px; text-align: right;">
                            <label style="display: block; margin-bottom: 5px; color: #555; font-size: 0.9rem;">الفصول (اختر فصل أو أكثر)<span style="color:red;">*</span></label>
                            <div style="display: flex; gap: 10px; flex-wrap: wrap; border: 1px solid #ccc; padding: 8px; border-radius: 4px; background: #fff;">
                                <label><input type="checkbox" name="assign-class" value="1/A"> 1/A</label>
                                <label><input type="checkbox" name="assign-class" value="1/B"> 1/B</label>
                                <label><input type="checkbox" name="assign-class" value="1/C"> 1/C</label>
                                <label><input type="checkbox" name="assign-class" value="2/A"> 2/A</label>
                                <label><input type="checkbox" name="assign-class" value="2/B"> 2/B</label>
                                <label><input type="checkbox" name="assign-class" value="3/A"> 3/A</label>
                            </div>
                        </div>

                        <div style="text-align: left;">
                            <button type="submit" style="background: #394aba; color: white; padding: 8px 30px; border: none; border-radius: 4px; cursor: pointer; font-family: 'Cairo', sans-serif; font-size: 1rem;">حفظ التوزيع</button>
                        </div>
                    </form>
                </div>
                
                <div id="teacher-assignments-results" style="padding: 0 15px 15px 15px; background: white; margin: 0 15px 15px 15px;">
                    <!-- Table injected via JS -->
                </div>
            </div>
        </div>

        <!-- TAB 6: Faculty Data -->
        <div id="tab-faculty-data" class="ministry-tab-content">
            <div style="background: #eef1f4; padding: 0; border: 1px solid #e0e0e0; font-family: 'Cairo', sans-serif; direction: rtl;">
                <div style="background: #33404c; color: white; padding: 10px 20px; font-size: 1.1rem; text-align: right;">
                    بيانات هيئة التدريس (السجل الشامل)
                </div>
                <div style="padding: 20px; background: white; margin: 15px;">
                    <p style="color: #555; font-size: 0.95rem; margin-bottom: 20px;">
                        اختر أحد أعضاء هيئة التدريس لعرض أو تعديل سجله الشامل الذي يشمل البيانات الشخصية، الأكاديمية، الوظيفية، والنشاط العلمي.
                    </p>
                    
                    <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                        <select id="faculty-select" onchange="renderFacultyDetails(this.value)" style="flex: 1; max-width: 400px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit;">
                            <option value="" disabled selected>-- اختر عضو هيئة التدريس --</option>
                            ${DB.staff.map((s, idx) => `<option value="${idx}">${s.name} - ${s.role === 'teacher' ? 'مدرس' : (s.role === 'admin' ? 'إدارة عليا' : (s.role === 'control' ? 'كنترول' : 'إداري'))}</option>`).join('')}
                        </select>
                    </div>

                    <div id="faculty-details-container" style="display: none; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background: white;">
                        <!-- Custom sub-tabs for Faculty Data -->
                        <div style="display: flex; background: #f8f9fa; border-bottom: 1px solid #e0e0e0; overflow-x: auto;">
                            <button type="button" onclick="switchFacultyTab('personal')" class="f-tab active" data-tab="personal" style="flex: 1; padding: 12px; border: none; background: white; color: #007ba7; border-bottom: 2px solid #007ba7; cursor: pointer; font-family: inherit; font-size: 0.95rem; font-weight: bold; border-left: 1px solid #e0e0e0;">البيانات الشخصية</button>
                            <button type="button" onclick="switchFacultyTab('academic')" class="f-tab" data-tab="academic" style="flex: 1; padding: 12px; border: none; background: transparent; cursor: pointer; font-family: inherit; font-size: 0.95rem; font-weight: bold; border-left: 1px solid #e0e0e0; color: #333;">البيانات الأكاديمية</button>
                            <button type="button" onclick="switchFacultyTab('employment')" class="f-tab" data-tab="employment" style="flex: 1; padding: 12px; border: none; background: transparent; cursor: pointer; font-family: inherit; font-size: 0.95rem; font-weight: bold; border-left: 1px solid #e0e0e0; color: #333;">البيانات الوظيفية</button>
                            <button type="button" onclick="switchFacultyTab('research')" class="f-tab" data-tab="research" style="flex: 1; padding: 12px; border: none; background: transparent; cursor: pointer; font-family: inherit; font-size: 0.95rem; font-weight: bold; border-left: 1px solid #e0e0e0; color: #333;">النشاط العلمي</button>
                            <button type="button" onclick="switchFacultyTab('teaching')" class="f-tab" data-tab="teaching" style="flex: 1; padding: 12px; border: none; background: transparent; cursor: pointer; font-family: inherit; font-size: 0.95rem; font-weight: bold; color: #333;">البيانات التدريسية</button>
                        </div>
                        
                        <div style="padding: 20px;">
                            <!-- Personal Tab -->
                            <div id="f-tab-personal" class="f-tab-content active" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div><label style="color:#777; font-size:0.85rem;">الاسم الرباعي</label><div id="fd-name" style="font-weight:bold; padding: 6px 0;">-</div></div>
                                <div><label style="color:#777; font-size:0.85rem;">الرقم القومي / الجواز</label><input type="text" placeholder="أدخل الرقم القومي" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; margin-top:4px; font-family:inherit;"></div>
                                <div><label style="color:#777; font-size:0.85rem;">تاريخ الميلاد</label><input type="date" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; margin-top:4px; font-family:inherit;"></div>
                                <div><label style="color:#777; font-size:0.85rem;">محل الميلاد</label><input type="text" placeholder="مثال: القاهرة" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; margin-top:4px; font-family:inherit;"></div>
                                <div><label style="color:#777; font-size:0.85rem;">البريد الأكاديمي</label><div id="fd-email" style="font-weight:bold; direction:ltr; text-align:right; padding: 6px 0;">-</div></div>
                                <div><label style="color:#777; font-size:0.85rem;">رقم الهاتف</label><input type="text" placeholder="مثال: 01012345678" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; margin-top:4px; font-family:inherit;"></div>
                                <div style="grid-column: 1 / -1;"><label style="color:#777; font-size:0.85rem;">العنوان</label><input type="text" placeholder="العنوان بالتفصيل" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; margin-top:4px; font-family:inherit;"></div>
                            </div>
                            
                            <!-- Academic Tab -->
                            <div id="f-tab-academic" class="f-tab-content" style="display: none; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div><label style="color:#777; font-size:0.85rem;">أعلى مؤهل</label>
                                    <select style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; margin-top:4px; font-family:inherit;">
                                        <option>بكالوريوس / ليسانس</option><option>دبلومة</option><option>ماجستير</option><option>دكتوراه</option>
                                    </select>
                                </div>
                                <div><label style="color:#777; font-size:0.85rem;">سنة التخرج / الحصول على الدرجة</label><input type="text" placeholder="سنة التخرج" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; margin-top:4px; font-family:inherit;"></div>
                                <div><label style="color:#777; font-size:0.85rem;">الجامعة المانحة</label><input type="text" placeholder="اسم الجامعة" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; margin-top:4px; font-family:inherit;"></div>
                                <div><label style="color:#777; font-size:0.85rem;">التخصص العام</label><input type="text" placeholder="مثال: هندسة" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; margin-top:4px; font-family:inherit;"></div>
                                <div style="grid-column: 1 / -1;"><label style="color:#777; font-size:0.85rem;">التخصص الدقيق</label><input type="text" placeholder="تخصص دقيق" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; margin-top:4px; font-family:inherit;"></div>
                            </div>

                            <!-- Employment Tab -->
                            <div id="f-tab-employment" class="f-tab-content" style="display: none; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div><label style="color:#777; font-size:0.85rem;">الدرجة العلمية الحالية</label>
                                    <select style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; margin-top:4px; font-family:inherit;">
                                        <option>معيد</option><option>مدرس مساعد</option><option>مدرس</option><option>أستاذ مساعد</option><option>أستاذ</option><option>معلم خبير</option>
                                    </select>
                                </div>
                                <div><label style="color:#777; font-size:0.85rem;">تاريخ التعيين</label><input type="date" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; margin-top:4px; font-family:inherit;"></div>
                                <div><label style="color:#777; font-size:0.85rem;">الكلية / المدرسة المنتمي إليها</label><input type="text" value="مدارس WE للتكنولوجيا التطبيقية" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; margin-top:4px; font-family:inherit;"></div>
                                <div><label style="color:#777; font-size:0.85rem;">القسم الوظيفي</label><input type="text" placeholder="اسم القسم" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; margin-top:4px; font-family:inherit;"></div>
                                <div style="grid-column: 1 / -1;"><label style="color:#777; font-size:0.85rem;">المناصب الإدارية الحالية</label><input type="text" placeholder="مثال: رئيس قسم، مشرف..." style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; margin-top:4px; font-family:inherit;"></div>
                            </div>

                            <!-- Research Tab -->
                            <div id="f-tab-research" class="f-tab-content" style="display: none; grid-template-columns: 1fr; gap: 15px;">
                                <div><label style="color:#777; font-size:0.85rem;">الأبحاث العلمية المنشورة</label><textarea rows="3" placeholder="قائمة الأبحاث وتاريخ النشر المتوفرة..." style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; margin-top:4px; font-family:inherit; resize:vertical;"></textarea></div>
                                <div><label style="color:#777; font-size:0.85rem;">المؤتمرات المشارك بها</label><textarea rows="2" placeholder="أسماء المؤتمرات للسنوات السابقة..." style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; margin-top:4px; font-family:inherit; resize:vertical;"></textarea></div>
                                <div><label style="color:#777; font-size:0.85rem;">الرسائل العلمية التي أشرف عليها</label><textarea rows="2" placeholder="رسائل ماجستير ودكتوراه..." style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; margin-top:4px; font-family:inherit; resize:vertical;"></textarea></div>
                            </div>

                            <!-- Teaching Tab -->
                            <div id="f-tab-teaching" class="f-tab-content" style="display: none; grid-template-columns: 1fr; gap: 15px;">
                                <div><label style="color:#777; font-size:0.85rem;">المقررات والمواد الحالية</label><div id="fd-subjects" style="padding:10px; background:#f9f9f9; border:1px solid #eee; border-radius:4px; margin-top:4px;">-</div></div>
                                <div><label style="color:#777; font-size:0.85rem;">الفصول والجدول الدراسي</label><div id="fd-classes" style="padding:10px; background:#f9f9f9; border:1px solid #eee; border-radius:4px; margin-top:4px; direction:ltr; text-align:right;">-</div></div>
                            </div>

                            <div style="margin-top: 20px; text-align: left; border-top: 1px solid #eee; padding-top: 15px;">
                                <button type="button" onclick="alert('تم تحديث السجل الشامل لعضو هيئة التدريس بنجاح!')" style="background: #394aba; color: white; border: none; padding: 8px 25px; border-radius: 4px; font-family: inherit; cursor: pointer; font-size: 0.95rem;">حفظ السجل</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
    renderAdminUsersList();
    renderTeacherAssignments();
    renderAttendanceList();
    renderStudentReviewReport();

    // Handle form submission to assign teachers
    document.getElementById('assign-teacher-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('assign-teacher-email').value;
        const subject = document.getElementById('assign-subject').value;
        
        // Get selected classes
        const classCheckboxes = document.querySelectorAll('input[name="assign-class"]:checked');
        const selectedClasses = Array.from(classCheckboxes).map(cb => cb.value);
        
        if (selectedClasses.length === 0) {
            alert('برجاء اختيار فصل واحد على الأقل.');
            return;
        }

        const teacher = DB.staff.find(s => s.email === email);
        if (teacher) {
            teacher.assignments = teacher.assignments || [];
            teacher.assignments.push({ subject: subject, classes: selectedClasses });
            alert('تم حفظ التوزيع بنجاح!');
            document.getElementById('assign-teacher-form').reset();
            renderTeacherAssignments();
        }
    });

    // Handle form submission to add users
    document.getElementById('admin-add-user-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const role = document.getElementById('new-user-role').value;
        const name = document.getElementById('new-user-name').value;
        const email = document.getElementById('new-user-email').value;
        const pass = document.getElementById('new-user-pass').value;

        if(role === 'student') {
            const studentCode = document.getElementById('new-student-code').value || ('NEW-' + Date.now().toString().slice(-4));
            const studentNatId = document.getElementById('new-student-natid').value || '00000000000000';
            const studentGrade = document.getElementById('new-student-grade').value || 'الصف الأول';
            
            if (document.getElementById('new-student-natid').value && studentNatId.length !== 14) {
                alert('يجب أن يتكون الرقم القومي من 14 رقم بالضبط!');
                return;
            }

            const studentId = 'std_' + Date.now();
            DB.students.push({
                id: studentId,
                name: name,
                email: email,
                pass: pass,
                code: studentCode,
                nationalId: studentNatId,
                class: '1/A',
                grade: studentGrade
            });
            // Automatically create a dummy parent account too to ease testing logic
            DB.parents.push({
                email: 'parent_' + email,
                pass: pass,
                studentId: studentId,
                name: 'ولي أمر للطالب ' + name
            });
            document.getElementById('stat-students').textContent = DB.students.length;
        } else {
            DB.staff.push({
                role: role,
                name: name,
                email: email,
                pass: pass
            });
            document.getElementById('stat-staff').textContent = DB.staff.length;
        }

        alert('تم إضافة الحساب بنجاح! يمكنهم الآن استخدام الإيميل وكلمة المرور للدخول.');
        document.getElementById('admin-add-user-form').reset();
        renderAdminUsersList();
        renderTeacherAssignments(); // In case a new teacher was added
    });
}

window.deleteTeacherAssignment = function(email, index) {
    const teacher = DB.staff.find(s => s.email === email);
    if(teacher && teacher.assignments) {
        teacher.assignments.splice(index, 1);
        renderTeacherAssignments();
    }
}

function renderTeacherAssignments() {
    const select = document.getElementById('assign-teacher-email');
    if(select) {
        select.innerHTML = '<option value="" disabled selected>-- اختر مدرس --</option>';
        DB.staff.filter(s => s.role === 'teacher').forEach(teacher => {
            select.innerHTML += `<option value="${teacher.email}">${teacher.name}</option>`;
        });
    }

    const resultsContainer = document.getElementById('teacher-assignments-results');
    if(resultsContainer) {
        let rowsHtml = '';
        DB.staff.filter(s => s.role === 'teacher').forEach(teacher => {
            if(teacher.assignments && teacher.assignments.length > 0) {
                teacher.assignments.forEach((assignment, index) => {
                    rowsHtml += `
                        <tr style="border-bottom: 1px solid #e0e0e0;">
                            <td style="padding: 10px; border-left: 1px solid #e0e0e0; font-size: 0.95rem;">${teacher.name}</td>
                            <td style="padding: 10px; border-left: 1px solid #e0e0e0; font-size: 0.95rem;">${assignment.subject}</td>
                            <td style="padding: 10px; border-left: 1px solid #e0e0e0; font-size: 0.95rem; direction: ltr; text-align: right;">${assignment.classes.join(' , ')}</td>
                            <td style="padding: 10px; font-size: 0.95rem; color:red; cursor:pointer;" onclick="deleteTeacherAssignment('${teacher.email}', ${index})"><i data-lucide="trash-2" style="width: 16px;"></i></td>
                        </tr>
                    `;
                });
            }
        });

        if(rowsHtml === '') {
            resultsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #777;">لا توجد توزيعات مسجلة حالياً.</div>';
        } else {
            resultsContainer.innerHTML = `
                <table style="width: 100%; border-collapse: collapse; text-align: right; color: #333; margin-top: 15px;">
                    <thead>
                        <tr style="background: #33404c; color: white;">
                            <th style="padding: 10px; border-left: 1px solid #4a5c6e; font-weight: normal; font-size: 0.95rem;">اسم المدرس</th>
                            <th style="padding: 10px; border-left: 1px solid #4a5c6e; font-weight: normal; font-size: 0.95rem;">المادة</th>
                            <th style="padding: 10px; border-left: 1px solid #4a5c6e; font-weight: normal; font-size: 0.95rem;">الفصول</th>
                            <th style="padding: 10px; font-weight: normal; font-size: 0.95rem;">إجراء</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            `;
        }
        lucide.createIcons();
    }
}

window.filterAttendanceTable = function() {
    renderAttendanceList();
};

window.acceptExcuse = function(userId, date, isStaff) {
    if(confirm('هل أنت متأكد من قبول العذر وإعفاء هذا الشخص من الغياب في هذا اليوم؟')) {
        DB.exemptions.push({
            id: Date.now(),
            studentId: isStaff ? null : userId,
            staffEmail: isStaff ? userId : null,
            date: date,
            reason: 'تم قبول العذر بواسطة الإدارة',
            status: 'accepted'
        });
        renderAttendanceList();
    }
};

window.filterStudentReviewTable = function() {
    renderStudentReviewReport();
};

window.renderStudentReviewReport = function() {
    const container = document.getElementById('student-review-results');
    if(!container) return;

    const searchTerm = document.getElementById('review-search')?.value.toLowerCase() || '';
    const issueFilter = document.getElementById('review-issue-filter')?.value || 'all';

    // Enhance students with mock review data if not present just for the demo
    const enhancedStudents = DB.students.map((student, index) => {
        let missingDocs = [];
        let financial = 'مسدد بالكامل';
        let academic = 'مستجد';
        
        // Mock data logic based on index to show variety
        if(index === 0) {
            missingDocs.push('أصل شهادة الميلاد', 'استمارة التجنيد');
            academic = 'طالب مستجد';
        } else if (index === 1) {
            financial = 'عليه متأخرات (قسط 2)';
            academic = 'باقي للإعادة';
        } else if (index === 2) {
            missingDocs.push('4 صور شخصية');
            academic = 'منقول بمواد';
        } else if (index === 3) {
            academic = 'مفصول';
            financial = 'لم يسدد رسوم العام';
        }

        return {
            ...student,
            missingDocs: student.missingDocs || missingDocs,
            financialStatus: student.financialStatus || financial,
            academicStatus: student.academicStatus || academic
        };
    });

    let records = enhancedStudents;

    // Apply text search
    if (searchTerm) {
        records = records.filter(s => 
            s.name.toLowerCase().includes(searchTerm) || 
            (s.nationalId && s.nationalId.includes(searchTerm)) ||
            (s.code && s.code.includes(searchTerm))
        );
    }

    // Apply issue filters
    if (issueFilter === 'missing_docs') {
        records = records.filter(s => s.missingDocs && s.missingDocs.length > 0);
    } else if (issueFilter === 'financial_debt') {
        records = records.filter(s => s.financialStatus && s.financialStatus !== 'مسدد بالكامل');
    } else if (issueFilter === 'academic_issue') {
        records = records.filter(s => s.academicStatus && s.academicStatus !== 'مستجد' && s.academicStatus !== 'طالب مستجد');
    }

    if(records.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #777;">لا توجد سجلات مطابقة. كل البيانات سليمة.</div>';
        return;
    }

    let rowsHtml = records.map(r => {
        const hasMissingDocs = r.missingDocs && r.missingDocs.length > 0;
        const hasFinancialDebt = r.financialStatus && r.financialStatus !== 'مسدد بالكامل';
        const hasAcademicIssue = r.academicStatus && r.academicStatus !== 'مستجد' && r.academicStatus !== 'طالب مستجد';
        
        return `
            <tr style="border-bottom: 1px solid #e0e0e0; background: white;">
                <td style="padding: 12px; border-left: 1px solid #e0e0e0; font-size: 0.95rem;">
                    <strong>\${r.name}</strong><br>
                    <span style="color:#777; font-size:0.8rem;">قومي: \${r.nationalId} | كود: \${r.code || '-'}</span>
                </td>
                <td style="padding: 12px; border-left: 1px solid #e0e0e0; font-size: 0.9rem;">
                    \${r.phone || '-'}<br>
                    <span style="color:#777; font-size:0.8rem;">\${r.email || '-'}</span>
                </td>
                <td style="padding: 12px; border-left: 1px solid #e0e0e0; font-size: 0.9rem;">
                    \${hasMissingDocs 
                        ? \`<span style="color:var(--danger); font-weight:bold;">\${r.missingDocs.join('، ')}</span>\` 
                        : '<span style="color:var(--success);">مكتملة</span>'}
                </td>
                <td style="padding: 12px; border-left: 1px solid #e0e0e0; font-size: 0.9rem;">
                    \${hasAcademicIssue 
                        ? \`<span style="color:var(--warning); font-weight:bold; background:#fff3cd; padding:2px 6px; border-radius:4px;">\${r.academicStatus}</span>\` 
                        : \`<span style="color:#555;">\${r.academicStatus}</span>\`}
                </td>
                <td style="padding: 12px; font-size: 0.9rem;">
                    \${hasFinancialDebt 
                        ? \`<span style="color:var(--danger); font-weight:bold;">\${r.financialStatus}</span>\` 
                        : \`<span style="color:var(--success);">\${r.financialStatus}</span>\`}
                </td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; text-align: right; color: #333; margin-top: 15px; white-space: nowrap;">
            <thead>
                <tr style="background: #33404c; color: white;">
                    <th style="padding: 10px; border-left: 1px solid #4a5c6e; font-weight: normal; font-size: 0.95rem;">بيانات الطالب (الاسم/الرقم القومي)</th>
                    <th style="padding: 10px; border-left: 1px solid #4a5c6e; font-weight: normal; font-size: 0.95rem;">بيانات الاتصال</th>
                    <th style="padding: 10px; border-left: 1px solid #4a5c6e; font-weight: normal; font-size: 0.95rem;">الملفات والنواقص</th>
                    <th style="padding: 10px; border-left: 1px solid #4a5c6e; font-weight: normal; font-size: 0.95rem;">الموقف الأكاديمي</th>
                    <th style="padding: 10px; font-weight: normal; font-size: 0.95rem;">الموقف المالي</th>
                </tr>
            </thead>
            <tbody>\${rowsHtml}</tbody>
        </table>
    `;
    lucide.createIcons();
};

window.renderAttendanceList = function() {
    const container = document.getElementById('attendance-results');
    if(!container) return;

    const searchTerm = document.getElementById('attendance-search')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('attendance-role-filter')?.value || 'all';

    // Aggregate absences (both students and staff if implemented, currently only students have attendance DB setup, we can mock staff absence for demo)
    
    let records = [];
    
    // Process student attendance
    if(roleFilter === 'all' || roleFilter === 'student') {
        DB.students.forEach(student => {
            const studentAbsences = DB.attendance.filter(a => a.studentId === student.id && a.status === 'absent');
            studentAbsences.forEach(abs => {
                const isExempted = DB.exemptions.some(e => e.studentId === student.id && e.date === abs.date && e.status === 'accepted');
                records.push({
                    type: 'student',
                    id: student.id,
                    name: student.name,
                    codeOrEmail: student.code || student.nationalId,
                    date: abs.date,
                    isExempted: isExempted,
                    roleLabel: 'طالب'
                });
            });
        });
    }

    // Process staff attendance (Mocking a few for demonstration since DB.attendance usually only has student ID)
    if(roleFilter === 'all' || roleFilter === 'staff') {
        // Just as an example, normally we'd fetch from a real DB.staffAttendance
        // We'll hardcode one absence for 'أ. حسن' to show the feature works for staff too.
        const teacher = DB.staff.find(s => s.role === 'teacher');
        if(teacher) {
           const isExempted = DB.exemptions.some(e => e.staffEmail === teacher.email && e.date === '2023-11-05' && e.status === 'accepted');
           records.push({
               type: 'staff',
               id: teacher.email,
               name: teacher.name,
               codeOrEmail: teacher.email,
               date: '2023-11-05',
               isExempted: isExempted,
               roleLabel: 'عضو هيئة تدريس'
           });
        }
    }

    // Apply text search filter
    if(searchTerm) {
        records = records.filter(r => 
            r.name.toLowerCase().includes(searchTerm) || 
            (r.codeOrEmail && r.codeOrEmail.toLowerCase().includes(searchTerm))
        );
    }

    // Sort by date descending
    records.sort((a,b) => new Date(b.date) - new Date(a.date));

    if(records.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #777;">لا توجد سجلات غياب مطابقة.</div>';
        return;
    }

    let rowsHtml = records.map(r => `
        <tr style="border-bottom: 1px solid #e0e0e0; background: \${r.isExempted ? '#f0fdf4' : 'white'};">
            <td style="padding: 12px; border-left: 1px solid #e0e0e0; font-size: 0.95rem;">
                <strong>\${r.name}</strong><br>
                <span style="color:#777; font-size:0.8rem;">\${r.codeOrEmail}</span>
            </td>
            <td style="padding: 12px; border-left: 1px solid #e0e0e0; font-size: 0.9rem;">\${r.roleLabel}</td>
            <td style="padding: 12px; border-left: 1px solid #e0e0e0; font-size: 0.95rem; direction:ltr; text-align:right;">\${r.date}</td>
            <td style="padding: 12px; border-left: 1px solid #e0e0e0; font-size: 0.95rem;">
                \${r.isExempted 
                    ? '<span style="color:var(--success); font-weight:bold;"><i data-lucide="check-circle" style="width:14px; margin-left:4px;"></i>معفى (عذر مقبول)</span>' 
                    : '<span style="color:var(--danger); font-weight:bold;"><i data-lucide="x-circle" style="width:14px; margin-left:4px;"></i>غياب بدون عذر</span>'
                }
            </td>
            <td style="padding: 12px; font-size: 0.95rem; text-align:center;">
                \${r.isExempted 
                    ? '<span style="color:#999; font-size:0.85rem;">تم الإعفاء</span>' 
                    : \`<button onclick="acceptExcuse('\${r.id}', '\${r.date}', \${r.type === 'staff'})" style="background:#f59e0b; color:white; border:none; padding:6px 12px; border-radius:4px; font-family:inherit; cursor:pointer; font-size:0.85rem;"><i data-lucide="shield-check" style="width:14px; margin-left:4px;"></i>قبول عذر وإعفاء</button>\`
                }
            </td>
        </tr>
    `).join('');

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; text-align: right; color: #333; margin-top: 15px;">
            <thead>
                <tr style="background: #33404c; color: white;">
                    <th style="padding: 10px; border-left: 1px solid #4a5c6e; font-weight: normal; font-size: 0.95rem;">الاسم / الكود</th>
                    <th style="padding: 10px; border-left: 1px solid #4a5c6e; font-weight: normal; font-size: 0.95rem;">الفئة</th>
                    <th style="padding: 10px; border-left: 1px solid #4a5c6e; font-weight: normal; font-size: 0.95rem;">تاريخ الغياب</th>
                    <th style="padding: 10px; border-left: 1px solid #4a5c6e; font-weight: normal; font-size: 0.95rem;">الحالة</th>
                    <th style="padding: 10px; font-weight: normal; font-size: 0.95rem; text-align:center;">إجراءات</th>
                </tr>
            </thead>
            <tbody>\${rowsHtml}</tbody>
        </table>
    `;
    lucide.createIcons();
};

function renderAdminUsersList() {
    const staffContainer = document.getElementById('staff-tables-container');
    const studentContainer = document.getElementById('student-search-results');
    
    if(!staffContainer || !studentContainer) return;

    // We will render staff separately, just one table for staff
    let currentGlobalIdx = 0;
    const staffWithIdx = DB.staff.map(s => ({ ...s, isStaff: true, globalIdx: currentGlobalIdx++ }));
    const studentsWithIdx = DB.students.map(s => ({ ...s, role: 'student', isStaff: false, globalIdx: currentGlobalIdx++ }));

    const roleTitles = {
        'student': 'طالب', 'teacher': 'مدرس', 'control': 'كنترول', 'affairs': 'شئون طلاب', 'gate': 'أمن يوابة', 'admin': 'إدارة عليا'
    };
    const roleColors = {
        'student': '#95a5a6', 'teacher': '#3498db', 'admin': '#e74c3c', 'control': '#9b59b6', 'affairs': '#2ecc71', 'gate': '#f1c40f'
    };

    // Render Staff Table
    let staffHTML = `
        <div class="table-container">
            <div style="padding: 15px 20px; background: #fff; border-bottom: 3px solid var(--primary);">
                <h3 style="margin:0; color: var(--primary);"><i data-lucide="shield"></i> طاقم العمل والإدارة (${staffWithIdx.length})</h3>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f9f9f9; text-align: right;">
                        <th style="padding: 10px;">الاسم</th>
                        <th style="padding: 10px;">البريد الإلكتروني</th>
                        <th style="padding: 10px;">الدور</th>
                        <th style="padding: 10px;">إجراء</th>
                    </tr>
                </thead>
                <tbody>
    `;
    staffWithIdx.forEach((user) => {
        staffHTML += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;"><strong>${user.name}</strong></td>
                <td style="padding: 10px; direction: ltr; text-align: right;">${user.email}</td>
                <td style="padding: 10px;">
                    <span style="background: ${roleColors[user.role]}20; color: ${roleColors[user.role]}; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 0.85rem;">
                        ${roleTitles[user.role] || user.role}
                    </span>
                </td>
                <td style="padding: 10px;">
                    <div style="display: flex; gap: 8px;">
                        <button onclick="addUserRole(${user.globalIdx}, true)" style="background: var(--accent); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">صلاحية</button>
                        <button onclick="deleteUser(${user.globalIdx}, true)" style="background: var(--danger-bg); color: var(--danger); border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">حذف</button>
                    </div>
                </td>
            </tr>
        `;
    });
    staffHTML += `</tbody></table></div>`;
    staffContainer.innerHTML = staffHTML;

    // Filter Students
    let filteredStudents = studentsWithIdx;
    if (window.adminStudentFilter) {
        if (window.adminStudentFilter.grade) filteredStudents = filteredStudents.filter(s => s.grade === window.adminStudentFilter.grade || (!s.grade && window.adminStudentFilter.grade === 'الصف الأول'));
        if (window.adminStudentFilter.code) filteredStudents = filteredStudents.filter(s => s.code && s.code.includes(window.adminStudentFilter.code));
        if (window.adminStudentFilter.nationalId) filteredStudents = filteredStudents.filter(s => s.nationalId && s.nationalId.includes(window.adminStudentFilter.nationalId));
        if (window.adminStudentFilter.class) filteredStudents = filteredStudents.filter(s => s.class === window.adminStudentFilter.class);
    }

    // Secondary table Search
    if (window.adminStudentSearch) {
        filteredStudents = filteredStudents.filter(s => 
            (s.name && s.name.toLowerCase().includes(window.adminStudentSearch)) ||
            (s.code && s.code.toLowerCase().includes(window.adminStudentSearch)) ||
            (s.nationalId && s.nationalId.toLowerCase().includes(window.adminStudentSearch))
        );
    }

    // Sort Students
    if (window.adminStudentSort.column) {
        filteredStudents.sort((a, b) => {
            let valA = a[window.adminStudentSort.column] || '';
            let valB = b[window.adminStudentSort.column] || '';
            
            // Handle numeric comparison if possible, else string
            if(!isNaN(valA) && !isNaN(valB) && valA !== '' && valB !== '') {
                valA = Number(valA);
                valB = Number(valB);
                return window.adminStudentSort.asc ? valA - valB : valB - valA;
            }
            
            return window.adminStudentSort.asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        });
    }

    // Render Student Results (Ministry Style)
    let studentsHTML = '';
    filteredStudents.forEach((student, i) => {
        studentsHTML += `
            <tr style="border-bottom: 1px solid #ccc; background: ${i % 2 === 0 ? 'white' : '#f4f6f9'}; font-size: 0.9rem;">
                <td style="padding: 10px; border-left: 1px solid #ccc; border-right: 1px solid #ccc;">${student.code || '-'}</td>
                <td style="padding: 10px; border-left: 1px solid #ccc;">${student.name}</td>
                <td style="padding: 10px; border-left: 1px solid #ccc; direction: ltr;">${student.nationalId || '-'}</td>
                <td style="padding: 10px; border-left: 1px solid #ccc;">${student.grade || 'الصف الأول'}</td>
                <td style="padding: 10px; border-left: 1px solid #ccc;">نظامى</td>
                <td style="padding: 10px; border-left: 1px solid #ccc;">ناجح ومنقول</td>
                <td style="padding: 10px; border-left: 1px solid #ccc;">لا يوجد</td>
                <td style="padding: 10px; border-left: 1px solid #ccc;">2024</td>
                <td style="padding: 10px; border-left: 1px solid #ccc;">
                    <div style="display: flex; gap: 5px; justify-content: center;">
                        <button onclick="editStudentModal(${student.globalIdx})" style="background: #4CAF50; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; gap: 4px;">
                            <i data-lucide="edit" style="width: 12px; height: 12px;"></i> تعديل
                        </button>
                        <button onclick="deleteUser(${student.globalIdx}, false)" style="background: #e74c3c; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                            <i data-lucide="trash" style="width: 12px; height: 12px;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    studentContainer.innerHTML = `
        <div style="display: flex; justify-content: center; margin-bottom: 20px; margin-top: 15px;">
            <div style="background: #007ba7; color: white; padding: 5px 25px; border-radius: 4px; font-size: 0.95rem;">عدد النتائج ${filteredStudents.length}</div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 0.9rem; color: #555;">
            <div style="display: flex; align-items: center; gap: 5px;">
                <span>أظهر</span>
                <select style="padding: 2px 5px; border: 1px solid #ccc;"><option>10</option></select>
                <span>مدخلات</span>
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
                <span>ابحث</span>
                <input type="text" placeholder="بحث داخل الجدول" oninput="window.searchStudentTable(this)" value="${window.adminStudentSearch}" style="padding: 4px 8px; border: 1px solid #ccc; border-radius: 3px;">
            </div>
        </div>

        <div style="overflow-x: auto; border: 1px solid #ccc;">
            <table style="width: 100%; border-collapse: collapse; text-align: right; color: #333;">
                <thead>
                    <tr style="background: #608c9f; color: white; border-bottom: 2px solid #507b8e;">
                        <th onclick="sortStudentTable('code')" style="padding: 10px; border-left: 1px solid #507b8e; font-weight: normal; font-size: 0.95rem; cursor: pointer;">كود التلميذ<i data-lucide="arrow-${window.adminStudentSort.column === 'code' ? (window.adminStudentSort.asc ? 'up' : 'down') : 'up-down'}" style="width: 12px; float: left; opacity: ${window.adminStudentSort.column === 'code' ? '1' : '0.5'};"></i></th>
                        <th onclick="sortStudentTable('name')" style="padding: 10px; border-left: 1px solid #507b8e; font-weight: normal; font-size: 0.95rem; cursor: pointer;">اسم التلميذ<i data-lucide="arrow-${window.adminStudentSort.column === 'name' ? (window.adminStudentSort.asc ? 'up' : 'down') : 'up-down'}" style="width: 12px; float: left; opacity: ${window.adminStudentSort.column === 'name' ? '1' : '0.5'};"></i></th>
                        <th onclick="sortStudentTable('nationalId')" style="padding: 10px; border-left: 1px solid #507b8e; font-weight: normal; font-size: 0.95rem; cursor: pointer;">الرقم القومى<i data-lucide="arrow-${window.adminStudentSort.column === 'nationalId' ? (window.adminStudentSort.asc ? 'up' : 'down') : 'up-down'}" style="width: 12px; float: left; opacity: ${window.adminStudentSort.column === 'nationalId' ? '1' : '0.5'};"></i></th>
                        <th onclick="sortStudentTable('grade')" style="padding: 10px; border-left: 1px solid #507b8e; font-weight: normal; font-size: 0.95rem; cursor: pointer;">الصف<i data-lucide="arrow-${window.adminStudentSort.column === 'grade' ? (window.adminStudentSort.asc ? 'up' : 'down') : 'up-down'}" style="width: 12px; float: left; opacity: ${window.adminStudentSort.column === 'grade' ? '1' : '0.5'};"></i></th>
                        <th style="padding: 10px; border-left: 1px solid #507b8e; font-weight: normal; font-size: 0.95rem; cursor: default;">نوعية التعليم<i data-lucide="arrow-up-down" style="width: 12px; float: left; opacity: 0.2;"></i></th>
                        <th style="padding: 10px; border-left: 1px solid #507b8e; font-weight: normal; font-size: 0.95rem; cursor: default;">حالة القيد<i data-lucide="arrow-up-down" style="width: 12px; float: left; opacity: 0.2;"></i></th>
                        <th style="padding: 10px; border-left: 1px solid #507b8e; font-weight: normal; font-size: 0.95rem; cursor: default;">الموقف من الدمج<i data-lucide="arrow-up-down" style="width: 12px; float: left; opacity: 0.2;"></i></th>
                        <th style="padding: 10px; border-left: 1px solid #507b8e; font-weight: normal; font-size: 0.95rem; cursor: default;">العام الاكاديمى<i data-lucide="arrow-up-down" style="width: 12px; float: left; opacity: 0.2;"></i></th>
                        <th style="padding: 10px; font-weight: normal; font-size: 0.95rem;">إجراء <i data-lucide="settings" style="width: 12px; float: left; opacity: 0.5;"></i></th>
                    </tr>
                </thead>
                <tbody>
                    ${studentsHTML}
                    ${filteredStudents.length === 0 ? '<tr><td colspan="9" style="text-align:center; padding: 20px;">لا توجد نتائج مطابقة للبحث</td></tr>' : ''}
                </tbody>
            </table>
        </div>
    `;

    lucide.createIcons();
}

// Modal for editing student details
window.editStudentModal = function(idx) {
    const allUsers = [
        ...DB.staff.map(s => ({ ...s, isStaff: true })),
        ...DB.students.map(s => ({ ...s, role: 'student', isStaff: false }))
    ];
    const user = allUsers[idx];
    
    const modal = document.createElement('div');
    modal.id = 'edit-modal';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; display:flex; justify-content:center; align-items:center; direction:rtl; font-family: "Cairo", sans-serif;';
    
    modal.innerHTML = `
        <div style="background:white; padding:20px 30px; border-radius:8px; width:450px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
            <h3 style="margin-top:0; color:#007ba7; border-bottom:1px solid #eee; padding-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                <span>تعديل بيانات التلميذ</span>
                <button onclick="addUserRole(${idx}, false); document.body.removeChild(document.getElementById('edit-modal'));" style="background:var(--accent); color:white; border:none; padding:6px 10px; border-radius:4px; font-size:0.8rem; cursor:pointer;">+ إضافة صلاحية إضافية</button>
            </h3>
            
            <div style="margin-bottom:15px; margin-top:20px;">
                <label style="display:block; margin-bottom:5px; font-size:0.9rem; color:#555;">اسم التلميذ</label>
                <input type="text" id="edit-name" value="${user.name}" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; font-family:inherit;">
            </div>
            
            <div style="margin-bottom:15px; display:flex; gap:10px;">
                <div style="flex:1;">
                    <label style="display:block; margin-bottom:5px; font-size:0.9rem; color:#555;">كود التلميذ</label>
                    <input type="text" id="edit-code" value="${user.code || ''}" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; font-family:inherit;">
                </div>
                <div style="flex:1;">
                    <label style="display:block; margin-bottom:5px; font-size:0.9rem; color:#555;">الرقم القومي</label>
                    <input type="text" id="edit-natid" value="${user.nationalId || ''}" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; font-family:inherit;">
                </div>
            </div>
            
            <div style="margin-bottom:20px;">
                <label style="display:block; margin-bottom:5px; font-size:0.9rem; color:#555;">الصف الدراسي</label>
                <select id="edit-grade" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; font-family:inherit;">
                    <option value="الصف الأول" ${user.grade === 'الصف الأول' || !user.grade ? 'selected' : ''}>الصف الأول</option>
                    <option value="الصف الثاني" ${user.grade === 'الصف الثاني' ? 'selected' : ''}>الصف الثاني</option>
                    <option value="الصف الثالث" ${user.grade === 'الصف الثالث' ? 'selected' : ''}>الصف الثالث</option>
                </select>
            </div>
            
            <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #eee; padding-top:15px;">
                <button id="cancel-edit" style="background:#f1f1f1; color:#333; border:1px solid #ccc; padding:8px 20px; border-radius:4px; cursor:pointer; font-family:inherit;">إلغاء</button>
                <button id="save-edit" style="background:#4CAF50; color:white; border:none; padding:8px 25px; border-radius:4px; cursor:pointer; font-family:inherit;">حفظ التعديلات</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('cancel-edit').onclick = () => document.body.removeChild(modal);
    document.getElementById('save-edit').onclick = () => {
        const dbUser = DB.students.find(s => s.email === user.email);
        if(dbUser) {
            dbUser.name = document.getElementById('edit-name').value;
            dbUser.code = document.getElementById('edit-code').value;
            dbUser.nationalId = document.getElementById('edit-natid').value;
            dbUser.grade = document.getElementById('edit-grade').value;
            
            // Re-apply filter and re-render the list seamlessly
            window.applyStudentFilter(); 
        }
        document.body.removeChild(modal);
    };
};


// Attach generic add role function
window.addUserRole = function(idx, isStaff) {
    const allUsers = [
        ...DB.staff.map(s => ({ ...s, isStaff: true })),
        ...DB.students.map(s => ({ ...s, role: 'student', isStaff: false }))
    ];
    
    const userToMod = allUsers[idx];
    
    if(userToMod.email === currentUser.data.email) {
        alert('لا يمكنك إضافة صلاحية لنفسك بهذه الطريقة!');
        return;
    }

    const newRolePrompt = prompt(`إضافة صلاحية إضافية لـ (${userToMod.name}).\nأدخل إحدى القيم بالإنجليزية:\n- student (طالب)\n- teacher (مدرس)\n- control (كنترول)\n- affairs (شئون)\n- gate (بوابة)\n- admin (إدارة عليا)`);

    if(!newRolePrompt || newRolePrompt.trim() === '') return;
    
    const newRole = newRolePrompt.trim().toLowerCase();
    const validRoles = ['student', 'teacher', 'control', 'affairs', 'gate', 'admin'];
    if(!validRoles.includes(newRole)) {
        alert('صلاحية غير صحيحة. الرجاء إدخال إحدى القيم الإنجليزية المحددة.');
        return;
    }
    if(newRole === userToMod.role) {
        alert('المستخدم يمتلك هذه الصلاحية بالفعل كصلاحية أساسية.');
        return;
    }

    // Do NOT remove from current list, just add to the new list so they hold both roles.

    // Add to new list
    if (newRole === 'student') {
        DB.students.push({
            id: userToMod.id || ('std_' + Date.now()),
            name: userToMod.name,
            email: userToMod.email,
            pass: userToMod.pass,
            code: userToMod.code || ('NEW-' + Date.now().toString().slice(-4)),
            nationalId: userToMod.nationalId || '00000000000000',
            class: userToMod.class || '1/A'
        });
    } else {
        DB.staff.push({
            role: newRole,
            name: userToMod.name,
            email: userToMod.email,
            pass: userToMod.pass
        });
    }

    document.getElementById('stat-staff').textContent = DB.staff.length;
    document.getElementById('stat-students').textContent = DB.students.length;
    renderAdminUsersList();
    alert('تم إضافة الصلاحية بنجاح.');
}

// Attach generic delete function to window so the onclick can find it
window.deleteUser = function(idx, isStaff) {
    // Combine staff and students for admin view to match the index
     const allUsers = [
        ...DB.staff.map(s => ({ ...s, isStaff: true })),
        ...DB.students.map(s => ({ ...s, role: 'student', isStaff: false }))
    ];
    
    const userToDel = allUsers[idx];
    
    if(userToDel.email === currentUser.data.email) {
        alert('لا يمكنك إزالة صلاحية حسابك الخاص!');
        return;
    }

    if(confirm('هل أنت متأكد من إزالة المستخدم: ' + userToDel.name + ' وسحب صلاحياته؟')) {
        if(isStaff) {
            DB.staff = DB.staff.filter(s => s.email !== userToDel.email);
            document.getElementById('stat-staff').textContent = DB.staff.length;
        } else {
            DB.students = DB.students.filter(s => s.email !== userToDel.email);
            document.getElementById('stat-students').textContent = DB.students.length;
        }
        renderAdminUsersList();
    }
}

// ─── Student Tab Switcher ─────────────────────────────────────────────────────
window.switchStudentTab = function(tabId) {
    document.querySelectorAll('.std-tab-panel').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');

    // Sync sidebar active state
    document.querySelectorAll('#sidebar-nav .nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tabid === tabId) item.classList.add('active');
    });

    lucide.createIcons();
};

function loadStudentDash() {
    const isParent = currentUser.role === 'parent';
    pageTitle.textContent = isParent ? "متابعة الطالب" : "ملف الطالب";

    const student = currentUser.data;
    const absences    = DB.attendance.filter(a => a.studentId === student.id && a.status === 'absent');
    const lates       = DB.attendance.filter(a => a.studentId === student.id && a.status === 'late');
    const grades      = DB.grades.filter(g => g.studentId === student.id);
    const behaviors   = DB.behavior.filter(b => b.studentId === student.id);
    const notifs      = DB.notifications.filter(n => n.recipientId === student.id);
    const exemptions  = DB.exemptions.filter(e => e.studentId === student.id && e.status === 'accepted');
    const totalPoints = behaviors.reduce((s, b) => s + b.points, 0);

    // Mock schedule data
    const schedule = [
        { day: 'السبت',    periods: ['رياضيات', 'حاسب', 'لغة عربية', 'فيزياء', 'تربية بدنية', 'إنجليزي'] },
        { day: 'الأحد',    periods: ['حاسب', 'فيزياء', 'رياضيات', 'تربية دينية', 'لغة عربية', 'كيمياء'] },
        { day: 'الاثنين',  periods: ['إنجليزي', 'رياضيات', 'فيزياء', 'حاسب', 'تاريخ', 'لغة عربية'] },
        { day: 'الثلاثاء', periods: ['كيمياء', 'تربية بدنية', 'رياضيات', 'إنجليزي', 'حاسب', 'فيزياء'] },
        { day: 'الأربعاء', periods: ['لغة عربية', 'كيمياء', 'تاريخ', 'رياضيات', 'إنجليزي', 'تربية دينية'] },
    ];

    // Mock exam data
    const exams = [
        { subject: 'رياضيات',   date: '2026-03-20', type: 'اختبار شهري',  room: 'قاعة أ',  duration: '90 دقيقة' },
        { subject: 'فيزياء',    date: '2026-03-24', type: 'اختبار شهري',  room: 'قاعة ب',  duration: '60 دقيقة' },
        { subject: 'حاسب آلي',  date: '2026-03-28', type: 'اختبار عملي', room: 'معمل حاسب', duration: '60 دقيقة' },
        { subject: 'لغة عربية', date: '2026-04-05', type: 'اختبار شهري',  room: 'قاعة أ',  duration: '90 دقيقة' },
    ];

    // Mock inbox messages
    const inbox = [
        { from: 'إدارة المدرسة', subject: 'تذكير: موعد سداد الرسوم', date: '2026-03-10', read: false, body: 'نذكركم بأن آخر موعد لسداد قسط الترم الثاني هو 20 مارس 2026.' },
        { from: 'مس شيماء (الكنترول)', subject: 'نتيجة الاختبار الشهري - رياضيات', date: '2026-03-08', read: true, body: 'تم رصد درجة اختبار الشهري في مادة الرياضيات. يرجى الاطلاع على تقرير الدرجات.' },
        { from: 'أ. حسن (مدرس حاسب)', subject: 'واجب برمجة - مقدّم للمراجعة', date: '2026-03-06', read: true, body: 'تم استلام واجبك وإرساله للمراجعة. سيتم إشعارك بالدرجة خلال 48 ساعة.' },
    ];

    // Attendance stats
    const totalDays   = 60; // mock school days so far
    const absentCount = absences.length;
    const lateCount   = lates.length;
    const exempted    = exemptions.length;
    const netAbsences = Math.max(0, absentCount - exempted);
    const attendPct   = Math.round(((totalDays - netAbsences) / totalDays) * 100);
    const pctColor    = attendPct >= 90 ? 'var(--success)' : attendPct >= 75 ? 'var(--warning)' : 'var(--danger)';

    // Build all tab HTML
    contentArea.innerHTML = `
        <!-- ══ TAB: HOME ══ -->
        <div id="std-tab-home" class="std-tab-panel active">
            <!-- Student card -->
            <div class="card" style="margin-bottom: 20px;">
                <div style="display:flex; align-items:center; gap:18px;">
                    <div class="avatar" style="width:64px; height:64px; font-size:1.6rem; flex-shrink:0;">
                        <i data-lucide="user"></i>
                    </div>
                    <div style="flex:1;">
                        <h3 style="margin:0 0 4px 0;">${student.name}</h3>
                        <div style="display:flex; gap:20px; flex-wrap:wrap; color:var(--text-light); font-size:0.88rem;">
                            <span><i data-lucide="hash" style="width:13px;"></i> الكود: ${student.code || '-'}</span>
                            <span><i data-lucide="book-open" style="width:13px;"></i> الفصل: ${student.class || '-'}</span>
                            <span><i data-lucide="graduation-cap" style="width:13px;"></i> الصف: ${student.grade || 'الصف الأول'}</span>
                        </div>
                    </div>
                    <div style="text-align:center; background:${pctColor}15; border:2px solid ${pctColor}; border-radius:50%; width:70px; height:70px; display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0;">
                        <div style="font-size:1.1rem; font-weight:bold; color:${pctColor};">${attendPct}%</div>
                        <div style="font-size:0.65rem; color:var(--text-light);">الحضور</div>
                    </div>
                </div>
            </div>

            <!-- Stats row -->
            <div class="grid" style="margin-bottom:20px;">
                <div class="card" style="text-align:center;">
                    <div class="card-title text-danger"><i data-lucide="user-x"></i> غيابات</div>
                    <div class="card-value">${netAbsences}</div>
                    <div style="font-size:0.8rem; color:var(--text-light);">${exempted > 0 ? exempted + ' معفى منها' : 'لا إعفاءات'}</div>
                </div>
                <div class="card" style="text-align:center;">
                    <div class="card-title text-warning"><i data-lucide="clock"></i> تأخيرات</div>
                    <div class="card-value">${lateCount}</div>
                    <div style="font-size:0.8rem; color:var(--text-light);">مرة تأخير</div>
                </div>
                <div class="card" style="text-align:center;">
                    <div class="card-title" style="color:var(--accent);"><i data-lucide="star"></i> نقاط السلوك</div>
                    <div class="card-value" style="color:${totalPoints >= 0 ? 'var(--success)' : 'var(--danger)'};">${totalPoints > 0 ? '+' : ''}${totalPoints}</div>
                    <div style="font-size:0.8rem; color:var(--text-light);">${behaviors.length} سجل</div>
                </div>
                <div class="card" style="text-align:center;">
                    <div class="card-title" style="color:var(--primary);"><i data-lucide="trending-up"></i> متوسط الدرجات</div>
                    <div class="card-value">${grades.length > 0 ? Math.round(grades.reduce((s,g) => s + (g.grade/g.max*100), 0) / grades.length) + '%' : 'N/A'}</div>
                    <div style="font-size:0.8rem; color:var(--text-light);">${grades.length} مادة</div>
                </div>
            </div>

            <!-- Recent notifications -->
            <div class="card">
                <div class="card-title"><i data-lucide="bell"></i> آخر الإشعارات</div>
                <ul style="list-style:none; padding:0; margin:10px 0 0 0;">
                    ${notifs.slice(-4).reverse().map(n => `
                        <li style="padding:10px 0; border-bottom:1px solid var(--bg); font-size:0.9rem; color:${n.read ? 'var(--text-light)' : 'var(--text)'}; font-weight:${n.read ? 'normal' : '600'}; display:flex; gap:10px; align-items:flex-start;">
                            <i data-lucide="${n.read ? 'bell' : 'bell-dot'}" style="width:15px; color:${n.read ? 'var(--text-light)' : 'var(--primary)'}; flex-shrink:0; margin-top:2px;"></i>
                            <div>
                                <div>${n.message}</div>
                                <div style="font-size:0.78rem; color:var(--text-light); margin-top:2px;">${n.date}</div>
                            </div>
                        </li>
                    `).join('') || '<li style="color:var(--text-light); font-size:0.9rem; padding:10px 0;">لا توجد إشعارات</li>'}
                </ul>
            </div>
        </div>

        <!-- ══ TAB: SCHEDULE ══ -->
        <div id="std-tab-schedule" class="std-tab-panel">
            <div class="card" style="margin-bottom:16px;">
                <div class="card-title"><i data-lucide="calendar"></i> الجدول الدراسي الأسبوعي — الفصل: ${student.class || '1/A'}</div>
            </div>
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; text-align:center; font-family:'Cairo',sans-serif;">
                    <thead>
                        <tr style="background:var(--primary); color:white;">
                            <th style="padding:10px 14px; border:1px solid rgba(255,255,255,0.2); min-width:90px;">اليوم</th>
                            ${['1', '2', '3', '4', '5', '6'].map(p => `<th style="padding:10px 14px; border:1px solid rgba(255,255,255,0.2);">حصة ${p}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${schedule.map((row, i) => `
                            <tr style="background:${i%2===0 ? 'white' : 'var(--surface)'};">
                                <td style="padding:10px 14px; border:1px solid var(--border); font-weight:bold; color:var(--primary);">${row.day}</td>
                                ${row.periods.map(p => `<td style="padding:10px 14px; border:1px solid var(--border); font-size:0.9rem;">${p}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div style="margin-top:14px; background:var(--surface); border-radius:var(--radius); padding:12px 16px; border:1px solid var(--border); font-size:0.85rem; color:var(--text-light);">
                <i data-lucide="info" style="width:14px;"></i> أوقات الحصص: الأولى 7:30 | الثانية 8:15 | الثالثة 9:00 | الرابعة 9:45 | الخامسة 10:30 | السادسة 11:15
            </div>
        </div>

        <!-- ══ TAB: GRADES ══ -->
        <div id="std-tab-grades" class="std-tab-panel">
            <div class="card" style="margin-bottom:16px;">
                <div class="card-title"><i data-lucide="trending-up"></i> سجل الدرجات والتقييمات</div>
            </div>
            ${grades.length > 0 ? `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>المادة</th>
                            <th>الدرجة</th>
                            <th>أقصى درجة</th>
                            <th>النسبة</th>
                            <th>التقدير</th>
                            <th>أضافها</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${grades.map(g => {
                            const pct = Math.round((g.grade / g.max) * 100);
                            const grade = pct >= 90 ? 'ممتاز' : pct >= 80 ? 'جيد جداً' : pct >= 70 ? 'جيد' : pct >= 60 ? 'مقبول' : 'ضعيف';
                            const gColor = pct >= 90 ? 'var(--success)' : pct >= 70 ? 'var(--warning)' : 'var(--danger)';
                            return `
                                <tr>
                                    <td><strong>${g.subject}</strong></td>
                                    <td><strong style="color:var(--primary); font-size:1.1rem;">${g.grade}</strong></td>
                                    <td>${g.max}</td>
                                    <td>
                                        <div style="display:flex; align-items:center; gap:8px;">
                                            <div style="flex:1; background:#eee; border-radius:4px; height:8px; overflow:hidden;">
                                                <div style="width:${pct}%; height:100%; background:${gColor}; border-radius:4px;"></div>
                                            </div>
                                            <span style="font-weight:bold; color:${gColor}; min-width:36px;">${pct}%</span>
                                        </div>
                                    </td>
                                    <td><span style="background:${gColor}20; color:${gColor}; padding:3px 10px; border-radius:12px; font-weight:bold; font-size:0.85rem;">${grade}</span></td>
                                    <td style="font-size:0.85rem; color:var(--text-light); direction:ltr;">${g.addedBy}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background:var(--surface); font-weight:bold;">
                            <td colspan="3" style="padding:12px; text-align:right;">المتوسط العام</td>
                            <td colspan="3" style="padding:12px;">
                                <span style="font-size:1.1rem; color:var(--primary);">
                                    ${Math.round(grades.reduce((s,g) => s + (g.grade/g.max*100), 0) / grades.length)}%
                                </span>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>` : `
            <div style="padding:60px 20px; text-align:center; background:white; border-radius:var(--radius); border:1px solid var(--border);">
                <i data-lucide="file-x" style="width:48px; height:48px; color:var(--text-light); margin-bottom:12px;"></i>
                <p style="color:var(--text-light);">لا توجد درجات مسجلة حتى الآن.</p>
            </div>`}

            <!-- Behavior Points breakdown -->
            ${behaviors.length > 0 ? `
            <div class="table-container" style="margin-top:20px;">
                <div style="padding:14px 18px; background:var(--surface); border-bottom:1px solid var(--border);">
                    <h4 style="margin:0; color:var(--primary);"><i data-lucide="activity"></i> سجل نقاط السلوك والتفاعل</h4>
                </div>
                <table>
                    <thead><tr><th>النوع</th><th>السبب</th><th>النقاط</th><th>المعلم</th></tr></thead>
                    <tbody>
                        ${behaviors.map(b => `
                            <tr>
                                <td><span style="background:${b.points>0?'var(--success-bg)':'var(--danger-bg)'}; color:${b.points>0?'var(--success)':'var(--danger)'}; padding:3px 10px; border-radius:12px; font-size:0.85rem;">${b.actionType}</span></td>
                                <td>${b.reason}</td>
                                <td style="font-weight:bold; color:${b.points>0?'var(--success)':'var(--danger)'};">${b.points>0?'+':''}${b.points}</td>
                                <td style="font-size:0.85rem; color:var(--text-light);">${b.addedBy}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>` : ''}
        </div>

        <!-- ══ TAB: EXAMS ══ -->
        <div id="std-tab-exams" class="std-tab-panel">
            <div class="card" style="margin-bottom:16px;">
                <div class="card-title"><i data-lucide="file-text"></i> جدول الامتحانات القادمة</div>
            </div>
            <div style="display:grid; gap:14px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); margin-bottom:24px;">
                ${exams.map(ex => {
                    const d = new Date(ex.date);
                    const daysLeft = Math.ceil((d - new Date()) / (1000*60*60*24));
                    const urgency = daysLeft <= 5 ? 'var(--danger)' : daysLeft <= 14 ? 'var(--warning)' : 'var(--success)';
                    return `
                    <div style="background:white; border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                        <div style="background:${urgency}; height:4px;"></div>
                        <div style="padding:16px 18px;">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                                <strong style="font-size:1.05rem;">${ex.subject}</strong>
                                <span style="background:${urgency}15; color:${urgency}; padding:2px 10px; border-radius:12px; font-size:0.8rem; font-weight:bold;">${daysLeft > 0 ? 'بعد ' + daysLeft + ' يوم' : 'اليوم!'}</span>
                            </div>
                            <div style="display:flex; flex-direction:column; gap:6px; font-size:0.88rem; color:var(--text-light);">
                                <span><i data-lucide="calendar" style="width:13px;"></i> ${ex.date}</span>
                                <span><i data-lucide="tag" style="width:13px;"></i> ${ex.type}</span>
                                <span><i data-lucide="map-pin" style="width:13px;"></i> ${ex.room}</span>
                                <span><i data-lucide="clock" style="width:13px;"></i> ${ex.duration}</span>
                            </div>
                        </div>
                    </div>`;
                }).join('')}
            </div>

            <!-- Past exam results from grades DB -->
            ${grades.length > 0 ? `
            <div class="table-container">
                <div style="padding:14px 18px; background:var(--surface); border-bottom:1px solid var(--border);">
                    <h4 style="margin:0; color:var(--primary);"><i data-lucide="check-circle"></i> نتائج الاختبارات السابقة</h4>
                </div>
                <table>
                    <thead><tr><th>المادة</th><th>الدرجة</th><th>من</th><th>النسبة المئوية</th></tr></thead>
                    <tbody>
                        ${grades.map(g => {
                            const pct = Math.round((g.grade/g.max)*100);
                            const c = pct>=80?'var(--success)':pct>=60?'var(--warning)':'var(--danger)';
                            return `<tr>
                                <td><strong>${g.subject}</strong></td>
                                <td><strong style="color:var(--primary);">${g.grade}</strong></td>
                                <td>${g.max}</td>
                                <td><span style="color:${c}; font-weight:bold;">${pct}%</span></td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>` : ''}
        </div>

        <!-- ══ TAB: ATTENDANCE ══ -->
        <div id="std-tab-attendance" class="std-tab-panel">
            <!-- Stats bar -->
            <div class="grid" style="margin-bottom:20px;">
                <div class="card" style="text-align:center;">
                    <div class="card-title"><i data-lucide="calendar-check"></i> أيام الدراسة</div>
                    <div class="card-value">${totalDays}</div>
                </div>
                <div class="card" style="text-align:center;">
                    <div class="card-title text-danger"><i data-lucide="calendar-x"></i> غيابات</div>
                    <div class="card-value">${absentCount}</div>
                </div>
                <div class="card" style="text-align:center;">
                    <div class="card-title text-warning"><i data-lucide="clock"></i> تأخيرات</div>
                    <div class="card-value">${lateCount}</div>
                </div>
                <div class="card" style="text-align:center;">
                    <div class="card-title" style="color:${pctColor};"><i data-lucide="percent"></i> نسبة الحضور</div>
                    <div class="card-value" style="color:${pctColor};">${attendPct}%</div>
                </div>
            </div>

            <!-- Attendance table -->
            <div class="table-container">
                <div style="padding:14px 18px; background:var(--surface); border-bottom:1px solid var(--border);">
                    <h4 style="margin:0; color:var(--primary);"><i data-lucide="list"></i> سجل الحضور التفصيلي</h4>
                </div>
                ${DB.attendance.filter(a => a.studentId === student.id).length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>الحالة</th>
                            <th>التفاصيل</th>
                            <th>الإعفاء</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${DB.attendance.filter(a => a.studentId === student.id).map(a => {
                            const isExempted = exemptions.some(e => e.studentId === student.id && e.date === a.date);
                            const statusLabel = a.status === 'absent' ? 'غياب' : a.status === 'late' ? 'تأخير' : 'حضور';
                            const statusColor = a.status === 'absent' ? 'var(--danger)' : a.status === 'late' ? 'var(--warning)' : 'var(--success)';
                            return `
                                <tr style="background:${isExempted ? '#f0fdf4' : 'white'};">
                                    <td style="direction:ltr; text-align:right; font-weight:500;">${a.date}</td>
                                    <td><span style="background:${statusColor}15; color:${statusColor}; padding:3px 12px; border-radius:12px; font-weight:bold; font-size:0.85rem;">${statusLabel}</span></td>
                                    <td style="color:var(--text-light); font-size:0.9rem;">${a.time ? 'وقت الدخول: ' + a.time : '-'}</td>
                                    <td>${isExempted ? '<span style="color:var(--success); font-weight:bold; font-size:0.85rem;"><i data-lucide="shield-check" style="width:13px;"></i> معفى</span>' : '<span style="color:var(--text-light); font-size:0.85rem;">—</span>'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>` : `<div style="padding:40px; text-align:center; color:var(--text-light);">لا توجد سجلات غياب — سجلك نظيف! 🎉</div>`}
            </div>
        </div>

        <!-- ══ TAB: EMAIL ══ -->
        <div id="std-tab-email" class="std-tab-panel">
            <div class="card" style="margin-bottom:16px;">
                <div class="card-title"><i data-lucide="mail"></i> صندوق الوارد — البريد المؤسسي</div>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px;">
                ${inbox.map((msg, i) => `
                    <div style="background:white; border:1px solid ${msg.read ? 'var(--border)' : 'var(--primary)'}; border-right:4px solid ${msg.read ? 'var(--border)' : 'var(--primary)'}; border-radius:var(--radius); padding:16px 18px; cursor:pointer; transition:box-shadow 0.2s;"
                         onmouseenter="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'" 
                         onmouseleave="this.style.boxShadow='none'">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                            <div style="display:flex; align-items:center; gap:8px;">
                                ${!msg.read ? '<span style="width:8px; height:8px; background:var(--primary); border-radius:50%; display:inline-block; flex-shrink:0;"></span>' : ''}
                                <strong style="font-size:0.95rem; color:${msg.read ? 'var(--text)' : 'var(--primary)'};">${msg.subject}</strong>
                            </div>
                            <span style="font-size:0.8rem; color:var(--text-light); flex-shrink:0;">${msg.date}</span>
                        </div>
                        <div style="font-size:0.85rem; color:var(--text-light); margin-bottom:8px;">
                            <i data-lucide="user" style="width:12px;"></i> من: ${msg.from}
                        </div>
                        <div style="font-size:0.88rem; color:var(--text); overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">
                            ${msg.body}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top:16px; text-align:center;">
                <button onclick="alert('خاصية الرسائل الكاملة قيد التطوير')" style="background:var(--primary); color:white; border:none; padding:10px 24px; border-radius:var(--radius); cursor:pointer; font-family:inherit; font-size:0.95rem;">
                    <i data-lucide="inbox" style="width:15px; margin-left:6px;"></i> عرض جميع الرسائل
                </button>
            </div>
        </div>

        <!-- ══ TAB: NOTIFICATIONS ══ -->
        <div id="std-tab-notifs" class="std-tab-panel">
            <div class="card" style="margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
                <div class="card-title" style="margin:0;"><i data-lucide="bell"></i> الإشعارات (${notifs.length})</div>
                <button onclick="DB.notifications.filter(n=>n.recipientId==='${student.id}').forEach(n=>n.read=true); window.switchStudentTab('std-tab-notifs');" 
                        style="background:transparent; color:var(--primary); border:1px solid var(--primary); padding:6px 14px; border-radius:20px; cursor:pointer; font-family:inherit; font-size:0.85rem;">
                    تحديد الكل كمقروء
                </button>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
                ${notifs.length > 0 ? [...notifs].reverse().map(n => `
                    <div onclick="n.read=true; this.style.fontWeight='normal'; this.style.background='var(--surface)'; this.querySelector('.notif-dot').style.display='none';"
                         style="background:${n.read ? 'var(--surface)' : 'white'}; border:1px solid ${n.read ? 'var(--border)' : 'var(--primary)'}; border-radius:var(--radius); padding:14px 16px; cursor:pointer; display:flex; gap:12px; align-items:flex-start; font-weight:${n.read ? 'normal' : '600'}; transition:all 0.2s;">
                        <span class="notif-dot" style="display:${n.read ? 'none' : 'inline-block'}; width:8px; height:8px; background:var(--primary); border-radius:50%; flex-shrink:0; margin-top:6px;"></span>
                        <div style="flex:1;">
                            <div style="font-size:0.9rem;">${n.message}</div>
                            <div style="font-size:0.78rem; color:var(--text-light); margin-top:4px;"><i data-lucide="clock" style="width:11px;"></i> ${n.date}</div>
                        </div>
                    </div>
                `).join('') : `<div style="padding:60px; text-align:center; color:var(--text-light);">لا توجد إشعارات</div>`}
            </div>
        </div>

        <!-- ══ TAB: PROFILE ══ -->
        <div id="std-tab-profile" class="std-tab-panel">

            <!-- Profile Hero Card -->
            <div style="background: linear-gradient(135deg, var(--primary) 0%, #5b2d8e 100%); border-radius: var(--radius); padding: 32px 28px; margin-bottom: 20px; color: white; position: relative; overflow: hidden;">
                <div style="position:absolute; top:-30px; left:-30px; width:180px; height:180px; background:rgba(255,255,255,0.06); border-radius:50%;"></div>
                <div style="position:absolute; bottom:-50px; right:-20px; width:220px; height:220px; background:rgba(255,255,255,0.04); border-radius:50%;"></div>
                <div style="display:flex; align-items:center; gap:22px; position:relative; z-index:1;">
                    <div style="width:90px; height:90px; border-radius:50%; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; flex-shrink:0; border: 3px solid rgba(255,255,255,0.4); backdrop-filter:blur(4px);">
                        <i data-lucide="user" style="width:42px; height:42px; color:white;"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="font-size:0.85rem; opacity:0.8; margin-bottom:4px;">الملف الشخصي</div>
                        <h2 style="margin:0 0 8px 0; font-size:1.7rem; font-weight:800; letter-spacing:0.5px;">${student.name}</h2>
                        <div style="display:flex; gap:10px; flex-wrap:wrap;">
                            <span style="background:rgba(255,255,255,0.2); backdrop-filter:blur(4px); padding:4px 14px; border-radius:20px; font-size:0.82rem; border:1px solid rgba(255,255,255,0.25);">
                                <i data-lucide="graduation-cap" style="width:13px; margin-left:4px;"></i> طالب مسجل
                            </span>
                            <span style="background:rgba(255,255,255,0.2); backdrop-filter:blur(4px); padding:4px 14px; border-radius:20px; font-size:0.82rem; border:1px solid rgba(255,255,255,0.25);">
                                <i data-lucide="book-open" style="width:13px; margin-left:4px;"></i> ${student.grade || 'الصف الأول'}
                            </span>
                            <span style="background:rgba(255,255,255,0.2); backdrop-filter:blur(4px); padding:4px 14px; border-radius:20px; font-size:0.82rem; border:1px solid rgba(255,255,255,0.25);">
                                <i data-lucide="users" style="width:13px; margin-left:4px;"></i> فصل ${student.class || '—'}
                            </span>
                        </div>
                    </div>
                    <!-- Attendance Ring -->
                    <div style="text-align:center; flex-shrink:0;">
                        <div style="position:relative; width:80px; height:80px;">
                            <svg viewBox="0 0 80 80" style="width:80px; height:80px; transform:rotate(-90deg);">
                                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="7"/>
                                <circle cx="40" cy="40" r="32" fill="none" stroke="white" stroke-width="7"
                                    stroke-dasharray="${Math.round(2 * Math.PI * 32 * attendPct / 100)} ${Math.round(2 * Math.PI * 32)}"
                                    stroke-linecap="round"/>
                            </svg>
                            <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center;">
                                <div style="font-size:1.1rem; font-weight:800; color:white;">${attendPct}%</div>
                            </div>
                        </div>
                        <div style="font-size:0.72rem; opacity:0.85; margin-top:4px;">نسبة الحضور</div>
                    </div>
                </div>
            </div>

            <!-- Info Sections Grid -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">

                <!-- Academic Info -->
                <div style="background:white; border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                    <div style="background:var(--primary)10; border-bottom:1px solid var(--border); padding:12px 18px; display:flex; align-items:center; gap:8px;">
                        <i data-lucide="school" style="width:16px; color:var(--primary);"></i>
                        <span style="font-weight:700; color:var(--primary); font-size:0.92rem;">البيانات الأكاديمية</span>
                    </div>
                    <div style="padding:16px 18px; display:flex; flex-direction:column; gap:14px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px dashed var(--border);">
                            <span style="font-size:0.82rem; color:var(--text-light); display:flex; align-items:center; gap:6px;"><i data-lucide="hash" style="width:13px;"></i> كود الطالب</span>
                            <span style="font-weight:700; direction:ltr; font-size:0.95rem; color:var(--text);">${student.code || '—'}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px dashed var(--border);">
                            <span style="font-size:0.82rem; color:var(--text-light); display:flex; align-items:center; gap:6px;"><i data-lucide="graduation-cap" style="width:13px;"></i> الصف الدراسي</span>
                            <span style="font-weight:700; font-size:0.95rem; color:var(--text);">${student.grade || 'الصف الأول'}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px dashed var(--border);">
                            <span style="font-size:0.82rem; color:var(--text-light); display:flex; align-items:center; gap:6px;"><i data-lucide="users" style="width:13px;"></i> الفصل</span>
                            <span style="font-weight:700; font-size:0.95rem; color:var(--text);">${student.class || '—'}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:0.82rem; color:var(--text-light); display:flex; align-items:center; gap:6px;"><i data-lucide="building-2" style="width:13px;"></i> المدرسة</span>
                            <span style="font-weight:600; font-size:0.82rem; color:var(--text); text-align:left; max-width:160px;">مدارس WE للتكنولوجيا</span>
                        </div>
                    </div>
                </div>

                <!-- Personal Info -->
                <div style="background:white; border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                    <div style="background:#0ea5e920; border-bottom:1px solid var(--border); padding:12px 18px; display:flex; align-items:center; gap:8px;">
                        <i data-lucide="id-card" style="width:16px; color:#0ea5e9;"></i>
                        <span style="font-weight:700; color:#0ea5e9; font-size:0.92rem;">البيانات الشخصية</span>
                    </div>
                    <div style="padding:16px 18px; display:flex; flex-direction:column; gap:14px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px dashed var(--border);">
                            <span style="font-size:0.82rem; color:var(--text-light); display:flex; align-items:center; gap:6px;"><i data-lucide="user" style="width:13px;"></i> الاسم الكامل</span>
                            <span style="font-weight:700; font-size:0.95rem; color:var(--text);">${student.name}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px dashed var(--border);">
                            <span style="font-size:0.82rem; color:var(--text-light); display:flex; align-items:center; gap:6px;"><i data-lucide="credit-card" style="width:13px;"></i> الرقم القومي</span>
                            <span style="font-weight:700; direction:ltr; font-size:0.88rem; color:var(--text); letter-spacing:0.5px;">${student.nationalId || '—'}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:0.82rem; color:var(--text-light); display:flex; align-items:center; gap:6px;"><i data-lucide="mail" style="width:13px;"></i> البريد الإلكتروني</span>
                            <span style="font-weight:600; direction:ltr; font-size:0.82rem; color:#0ea5e9;">${student.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Row -->
            <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:20px;">
                <div style="background:white; border:1px solid var(--border); border-radius:var(--radius); padding:16px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                    <div style="font-size:1.8rem; font-weight:800; color:var(--danger);">${netAbsences}</div>
                    <div style="font-size:0.8rem; color:var(--text-light); margin-top:2px; display:flex; align-items:center; justify-content:center; gap:4px;"><i data-lucide="calendar-x" style="width:12px;"></i> غيابات</div>
                </div>
                <div style="background:white; border:1px solid var(--border); border-radius:var(--radius); padding:16px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                    <div style="font-size:1.8rem; font-weight:800; color:${totalPoints >= 0 ? 'var(--success)' : 'var(--danger)'};">${totalPoints > 0 ? '+' : ''}${totalPoints}</div>
                    <div style="font-size:0.8rem; color:var(--text-light); margin-top:2px; display:flex; align-items:center; justify-content:center; gap:4px;"><i data-lucide="star" style="width:12px;"></i> نقاط السلوك</div>
                </div>
                <div style="background:white; border:1px solid var(--border); border-radius:var(--radius); padding:16px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                    <div style="font-size:1.8rem; font-weight:800; color:var(--primary);">${grades.length > 0 ? Math.round(grades.reduce((s,g) => s + (g.grade/g.max*100), 0) / grades.length) + '%' : '—'}</div>
                    <div style="font-size:0.8rem; color:var(--text-light); margin-top:2px; display:flex; align-items:center; justify-content:center; gap:4px;"><i data-lucide="trending-up" style="width:12px;"></i> متوسط الدرجات</div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div style="background:white; border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                <div style="background:var(--surface); border-bottom:1px solid var(--border); padding:12px 18px; display:flex; align-items:center; gap:8px;">
                    <i data-lucide="zap" style="width:16px; color:var(--accent);"></i>
                    <span style="font-weight:700; color:var(--text); font-size:0.92rem;">إجراءات سريعة</span>
                </div>
                <div style="padding:16px 18px; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <button onclick="alert('لتعديل البيانات الشخصية يُرجى التواصل مع شئون الطلاب.')" 
                            style="display:flex; align-items:center; gap:10px; background:var(--bg); border:1px solid var(--border); border-radius:var(--radius); padding:12px 16px; cursor:pointer; font-family:inherit; transition:all 0.2s; text-align:right; color:var(--text);"
                            onmouseenter="this.style.background='var(--primary)10'; this.style.borderColor='var(--primary)'"
                            onmouseleave="this.style.background='var(--bg)'; this.style.borderColor='var(--border)'">
                        <i data-lucide="edit-3" style="width:18px; color:var(--primary); flex-shrink:0;"></i>
                        <div style="text-align:right;">
                            <div style="font-weight:600; font-size:0.88rem;">تعديل البيانات</div>
                            <div style="font-size:0.75rem; color:var(--text-light);">تواصل مع شئون الطلاب</div>
                        </div>
                    </button>
                    <button onclick="alert('تم إرسال طلب تغيير كلمة المرور إلى بريدك الإلكتروني.')"
                            style="display:flex; align-items:center; gap:10px; background:var(--bg); border:1px solid var(--border); border-radius:var(--radius); padding:12px 16px; cursor:pointer; font-family:inherit; transition:all 0.2s; text-align:right; color:var(--text);"
                            onmouseenter="this.style.background='#0ea5e910'; this.style.borderColor='#0ea5e9'"
                            onmouseleave="this.style.background='var(--bg)'; this.style.borderColor='var(--border)'">
                        <i data-lucide="key-round" style="width:18px; color:#0ea5e9; flex-shrink:0;"></i>
                        <div style="text-align:right;">
                            <div style="font-weight:600; font-size:0.88rem;">تغيير كلمة المرور</div>
                            <div style="font-size:0.75rem; color:var(--text-light);">إرسال رابط التغيير</div>
                        </div>
                    </button>
                    <button onclick="window.switchStudentTab('std-tab-notifs')"
                            style="display:flex; align-items:center; gap:10px; background:var(--bg); border:1px solid var(--border); border-radius:var(--radius); padding:12px 16px; cursor:pointer; font-family:inherit; transition:all 0.2s; text-align:right; color:var(--text);"
                            onmouseenter="this.style.background='var(--accent)10'; this.style.borderColor='var(--accent)'"
                            onmouseleave="this.style.background='var(--bg)'; this.style.borderColor='var(--border)'">
                        <i data-lucide="bell" style="width:18px; color:var(--accent); flex-shrink:0;"></i>
                        <div style="text-align:right;">
                            <div style="font-weight:600; font-size:0.88rem;">إشعاراتي</div>
                            <div style="font-size:0.75rem; color:var(--text-light);">${notifs.filter(n=>!n.read).length} غير مقروء</div>
                        </div>
                    </button>
                    <button onclick="window.switchStudentTab('std-tab-attendance')"
                            style="display:flex; align-items:center; gap:10px; background:var(--bg); border:1px solid var(--border); border-radius:var(--radius); padding:12px 16px; cursor:pointer; font-family:inherit; transition:all 0.2s; text-align:right; color:var(--text);"
                            onmouseenter="this.style.background='var(--success)10'; this.style.borderColor='var(--success)'"
                            onmouseleave="this.style.background='var(--bg)'; this.style.borderColor='var(--border)'">
                        <i data-lucide="calendar-check" style="width:18px; color:var(--success); flex-shrink:0;"></i>
                        <div style="text-align:right;">
                            <div style="font-weight:600; font-size:0.88rem;">سجل الحضور</div>
                            <div style="font-size:0.75rem; color:var(--text-light);">${attendPct}% حضور هذا الترم</div>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Info Notice -->
            <div style="background:var(--primary)08; border:1px solid var(--primary)30; border-radius:var(--radius); padding:14px 18px; font-size:0.85rem; color:var(--text-light); display:flex; align-items:center; gap:10px; margin-top:16px;">
                <i data-lucide="info" style="width:16px; color:var(--primary); flex-shrink:0;"></i>
                <span>لتعديل البيانات الشخصية، يرجى التواصل مع <strong style="color:var(--primary);">شئون الطلاب</strong> مباشرةً أو زيارة مكتب الإدارة.</span>
            </div>
        </div>
    `;

    lucide.createIcons();

    // Fix sidebar: add data-tabid attribute after render so switchStudentTab can sync it
    document.querySelectorAll('#sidebar-nav .nav-item').forEach((item, idx) => {
        const link = navConfig.student[idx];
        if (link && link.tabId) item.dataset.tabid = link.tabId;
    });
}

function loadGateDash() {
    pageTitle.textContent = "بوابة المدرسة (تسجيل الحضور)";

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime  = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    contentArea.innerHTML = `
        <!-- Scanner Card -->
        <div style="max-width:560px; margin:0 auto 28px;">
            <div style="background:white; border-radius:var(--radius); box-shadow:var(--shadow-md); overflow:hidden; border:1px solid var(--border);">
                <!-- Header -->
                <div style="background:linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%); padding:22px 28px; color:white;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <i data-lucide="scan-line" style="width:28px; height:28px;"></i>
                        <div>
                            <div style="font-size:1.15rem; font-weight:800;">بوابة المدرسة</div>
                            <div style="font-size:0.8rem; opacity:0.85;">${todayStr} — الوقت الحالي: ${nowTime}</div>
                        </div>
                    </div>
                </div>

                <!-- Input Area -->
                <div style="padding:26px 28px;">
                    <!-- Student lookup result -->
                    <div id="gate-student-card" style="display:none; background:var(--bg); border:2px solid var(--border); border-radius:var(--radius); padding:14px 18px; margin-bottom:18px; transition:all 0.3s;">
                        <div style="display:flex; align-items:center; gap:14px;">
                            <div class="avatar" style="width:52px; height:52px; font-size:1.3rem; flex-shrink:0;">
                                <i data-lucide="user"></i>
                            </div>
                            <div style="flex:1;">
                                <div id="gate-std-name" style="font-size:1.1rem; font-weight:700;"></div>
                                <div style="display:flex; gap:14px; margin-top:4px; font-size:0.82rem; color:var(--text-light);">
                                    <span><i data-lucide="hash" style="width:12px;"></i> <span id="gate-std-code"></span></span>
                                    <span><i data-lucide="users" style="width:12px;"></i> فصل <span id="gate-std-class"></span></span>
                                </div>
                            </div>
                            <div id="gate-std-status" style="font-size:0.82rem; font-weight:700; padding:4px 12px; border-radius:20px;"></div>
                        </div>
                    </div>

                    <div id="gate-error-msg" style="display:none; background:var(--danger-bg); color:var(--danger); border-radius:8px; padding:10px 14px; margin-bottom:14px; font-size:0.9rem; font-weight:600;">
                        <i data-lucide="alert-circle" style="width:15px; margin-left:5px;"></i>
                        <span id="gate-error-text"></span>
                    </div>

                    <label style="display:block; font-size:0.85rem; font-weight:700; color:var(--text-light); margin-bottom:8px;">
                        <i data-lucide="hash" style="width:13px;"></i> كود الطالب
                    </label>
                    <div style="display:flex; gap:10px; margin-bottom:18px;">
                        <input type="text" id="gate-code-input" 
                               placeholder="أدخل كود الطالب..." 
                               autofocus
                               style="flex:1; padding:14px 16px; border:2px solid var(--border); border-radius:var(--radius); font-family:inherit; font-size:1.05rem; transition:border-color 0.2s; direction:ltr; text-align:right;"
                               oninput="lookupGateStudent(this.value)"
                               onfocus="this.style.borderColor='var(--primary)'"
                               onblur="this.style.borderColor='var(--border)'">
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <button id="gate-btn-present"
                                onclick="submitGateEntry('present')"
                                style="padding:14px; background:var(--success); color:white; border:none; border-radius:var(--radius); cursor:pointer; font-family:inherit; font-size:1rem; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.2s; opacity:0.4; pointer-events:none;">
                            <i data-lucide="check-circle" style="width:20px;"></i> حضور
                        </button>
                        <button id="gate-btn-late"
                                onclick="submitGateEntry('late')"
                                style="padding:14px; background:#f59e0b; color:white; border:none; border-radius:var(--radius); cursor:pointer; font-family:inherit; font-size:1rem; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.2s; opacity:0.4; pointer-events:none;">
                            <i data-lucide="clock" style="width:20px;"></i> تأخير
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Today's Log -->
        <div style="background:white; border-radius:var(--radius); border:1px solid var(--border); box-shadow:var(--shadow-sm); overflow:hidden;">
            <div style="padding:14px 20px; background:var(--surface); border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                <div style="font-weight:700; color:var(--text); display:flex; align-items:center; gap:8px;">
                    <i data-lucide="list-checks" style="width:18px; color:var(--primary);"></i>
                    سجل اليوم — ${todayStr}
                </div>
                <span id="gate-today-count" style="background:var(--primary)15; color:var(--primary); font-weight:700; font-size:0.82rem; padding:4px 12px; border-radius:20px;">0 سجل</span>
            </div>
            <div id="gate-log-body">
                <!-- injected by renderGateLog -->
            </div>
        </div>
    `;

    lucide.createIcons();
    renderGateLog();
}

// ─── Lookup student by code as user types ────────────────────────────────────
window.lookupGateStudent = function(code) {
    const card       = document.getElementById('gate-student-card');
    const errorBox   = document.getElementById('gate-error-msg');
    const btnPresent = document.getElementById('gate-btn-present');
    const btnLate    = document.getElementById('gate-btn-late');

    // Reset
    card.style.display     = 'none';
    errorBox.style.display = 'none';

    const disableButtons = () => {
        btnPresent.style.opacity = '0.4';
        btnPresent.style.pointerEvents = 'none';
        btnLate.style.opacity    = '0.4';
        btnLate.style.pointerEvents = 'none';
    };
    const enableButtons = () => {
        btnPresent.style.opacity = '1';
        btnPresent.style.pointerEvents = 'auto';
        btnLate.style.opacity    = '1';
        btnLate.style.pointerEvents = 'auto';
    };

    if (!code || code.trim().length < 3) { disableButtons(); return; }

    const student = DB.students.find(s => s.code === code.trim());
    if (!student) { disableButtons(); return; }

    // Check if already recorded today
    const todayStr  = new Date().toISOString().split('T')[0];
    const existing  = DB.attendance.find(a => a.studentId === student.id && a.date === todayStr);

    const statusLabels   = { present: 'حضور', late: 'تأخير', absent: 'غياب' };
    const statusColors   = { present: 'var(--success)', late: '#f59e0b', absent: 'var(--danger)' };
    const statusBgs      = { present: 'var(--success-bg)', late: '#fef3c7', absent: 'var(--danger-bg)' };

    document.getElementById('gate-std-name').textContent  = student.name;
    document.getElementById('gate-std-code').textContent  = student.code;
    document.getElementById('gate-std-class').textContent = student.class || '—';

    const statusEl = document.getElementById('gate-std-status');
    if (existing) {
        statusEl.textContent        = 'مسجّل بالفعل: ' + (statusLabels[existing.status] || existing.status);
        statusEl.style.background   = statusBgs[existing.status]   || '#eee';
        statusEl.style.color        = statusColors[existing.status] || '#333';
        card.style.borderColor      = statusColors[existing.status] || 'var(--border)';
        disableButtons();
    } else {
        statusEl.textContent        = 'لم يُسجَّل بعد';
        statusEl.style.background   = '#f3f4f6';
        statusEl.style.color        = 'var(--text-light)';
        card.style.borderColor      = 'var(--primary)';
        enableButtons();
    }

    card.style.display = 'flex';
    lucide.createIcons();
};

// ─── Submit attendance / late entry ──────────────────────────────────────────
window.submitGateEntry = function(type) {
    const code    = document.getElementById('gate-code-input').value.trim();
    const student = DB.students.find(s => s.code === code);
    if (!student) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime  = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    // Record in attendance
    const entry = { date: todayStr, studentId: student.id, status: type };
    if (type === 'late') entry.time = nowTime;
    DB.attendance.push(entry);

    const statusLabel = type === 'present' ? 'حضور' : 'تأخير';

    // ── Notification → Student ──
    DB.notifications.push({
        id: Date.now(),
        recipientId: student.id,
        message: type === 'late'
            ? `⚠️ تم تسجيل مخالفة تأخير في ${todayStr} — وقت الدخول: ${nowTime}. تم إرسال إشعار لوليّ أمرك وللإدارة.`
            : `✅ تم تسجيل حضورك بنجاح في ${todayStr} — وقت الدخول: ${nowTime}.`,
        date: todayStr,
        read: false
    });

    // ── Notification → Parent of student ──
    if (type === 'late') {
        DB.notifications.push({
            id: Date.now() + 1,
            recipientId: 'parent_' + student.id,
            message: `⚠️ إشعار لولي الأمر: طفلك/طفلتك (${student.name}) سجّل تأخيراً في ${todayStr} — وقت الدخول: ${nowTime}.`,
            date: todayStr,
            read: false
        });
    }

    // ── Notification → Admin ──
    DB.notifications.push({
        id: Date.now() + 2,
        recipientId: 'admin',
        message: `[البوابة] ${statusLabel} — ${student.name} (كود: ${student.code}، فصل: ${student.class || '—'}) — ${todayStr}${type === 'late' ? ' — وقت: ' + nowTime : ''}.`,
        date: todayStr,
        read: false
    });

    // ── Visual feedback ──
    const msg = type === 'late'
        ? `⚠️ تم تسجيل مخالفة تأخير للطالب: ${student.name}\nوقت الدخول: ${nowTime}\nتم إرسال الإشعار للطالب وولي الأمر والإدارة.`
        : `✅ تم تسجيل حضور الطالب: ${student.name}\nوقت الدخول: ${nowTime}`;

    // Flash the card
    const card = document.getElementById('gate-student-card');
    if (card) {
        card.style.background    = type === 'late' ? '#fef3c7' : 'var(--success-bg)';
        card.style.borderColor   = type === 'late' ? '#f59e0b' : 'var(--success)';
        setTimeout(() => {
            card.style.background  = 'var(--bg)';
            card.style.borderColor = 'var(--border)';
        }, 1200);
    }

    // Reset input & disable buttons
    document.getElementById('gate-code-input').value = '';
    window.lookupGateStudent('');

    // Re-render log
    renderGateLog();

    // Update notification badge
    const nots = DB.notifications.filter(n => n.recipientId === (currentUser?.data?.id || '') && !n.read).length;
    const badge = document.querySelector('.notification-btn .badge');
    if(badge) {
        badge.textContent = nots;
        badge.style.display = nots > 0 ? 'block' : 'none';
    }

    alert(msg);
    document.getElementById('gate-code-input').focus();
};

// ─── Render today's log table ─────────────────────────────────────────────────
function renderGateLog() {
    const container = document.getElementById('gate-log-body');
    const countEl   = document.getElementById('gate-today-count');
    if(!container) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayEntries = DB.attendance
        .filter(a => a.date === todayStr)
        .slice().reverse();

    if(countEl) countEl.textContent = todayEntries.length + ' سجل';

    if(todayEntries.length === 0) {
        container.innerHTML = `<div style="padding:40px; text-align:center; color:var(--text-light);">
            <i data-lucide="inbox" style="width:36px; height:36px; margin-bottom:10px; display:block; margin-left:auto; margin-right:auto;"></i>
            لا توجد سجلات لليوم بعد
        </div>`;
        lucide.createIcons();
        return;
    }

    const statusLabel = { present: 'حضور', late: 'تأخير', absent: 'غياب' };
    const statusColor = { present: 'var(--success)', late: '#f59e0b', absent: 'var(--danger)' };
    const statusBg    = { present: 'var(--success-bg)', late: '#fef3c7', absent: 'var(--danger-bg)' };

    let rows = todayEntries.map((a, i) => {
        const student = DB.students.find(s => s.id === a.studentId);
        if(!student) return '';
        return `
        <tr style="border-bottom:1px solid var(--border);">
            <td style="padding:12px 20px; font-size:0.82rem; color:var(--text-light); text-align:center; width:36px;">${todayEntries.length - i}</td>
            <td style="padding:12px 16px;">
                <div style="font-weight:700;">${student.name}</div>
                <div style="font-size:0.78rem; color:var(--text-light); direction:ltr; text-align:right;">${student.code}</div>
            </td>
            <td style="padding:12px 16px; font-size:0.88rem;">${student.class || '—'}</td>
            <td style="padding:12px 16px; text-align:center;">
                <span style="background:${statusBg[a.status]}; color:${statusColor[a.status]}; padding:4px 14px; border-radius:20px; font-weight:700; font-size:0.82rem;">${statusLabel[a.status] || a.status}</span>
            </td>
            <td style="padding:12px 16px; font-size:0.85rem; color:var(--text-light); direction:ltr; text-align:right;">${a.time || '—'}</td>
        </tr>`;
    }).join('');

    container.innerHTML = `
    <table style="width:100%; border-collapse:collapse;">
        <thead>
            <tr style="background:var(--bg); text-align:right;">
                <th style="padding:10px 20px; font-size:0.8rem; color:var(--text-light); font-weight:600; width:36px;">#</th>
                <th style="padding:10px 16px; font-size:0.8rem; color:var(--text-light); font-weight:600;">الطالب</th>
                <th style="padding:10px 16px; font-size:0.8rem; color:var(--text-light); font-weight:600;">الفصل</th>
                <th style="padding:10px 16px; font-size:0.8rem; color:var(--text-light); font-weight:600; text-align:center;">الحالة</th>
                <th style="padding:10px 16px; font-size:0.8rem; color:var(--text-light); font-weight:600;">التوقيت</th>
            </tr>
        </thead>
        <tbody>${rows}</tbody>
    </table>`;
    lucide.createIcons();
}

function loadControlDash() {
    pageTitle.textContent = "لوحة الكنترول (المراجعة والاعتماد)";
    
    // Get all grades and behaviors to show in the control panel
    const recentGrades = [...DB.grades].reverse();
    const recentBehaviors = [...DB.behavior].reverse();
    
    contentArea.innerHTML = `
        <div class="card" style="margin-bottom: 24px;">
            <p style="color: var(--text-light);"><i data-lucide="info"></i> تعرض هذه اللوحة جميع الدرجات ونقاط التفاعل المضافة من قبل المعلمين في جميع الفصول למراجعتها واعتمادها.</p>
        </div>

        <div class="grid" style="grid-template-columns: 1fr;">
            <!-- تقييمات التفاعل والواجب -->
             <div class="table-container">
                 <div style="padding: 15px; background: var(--surface); border-bottom: 1px solid var(--border);">
                    <h3 style="margin: 0; color: var(--primary);"><i data-lucide="activity"></i> سجل التفاعل والسلوك</h3>
                 </div>
                <table>
                    <thead>
                        <tr>
                            <th>الطالب</th>
                            <th>الفصل</th>
                            <th>نوع التقييم</th>
                            <th>التفاصيل</th>
                            <th>المعلم المسئول</th>
                            <th>إجراء</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentBehaviors.map((b, idx) => {
                            const student = DB.students.find(s => s.id === b.studentId) || {};
                            return `
                                <tr>
                                    <td><strong>${student.name || 'غير معروف'}</strong></td>
                                    <td>${student.class || '-'}</td>
                                    <td><span style="color: ${b.points > 0 ? 'var(--success)' : 'var(--danger)'}; font-weight: bold;">${b.actionType} (${b.points > 0 ? '+' : ''}${b.points})</span></td>
                                    <td>${b.reason}</td>
                                    <td style="direction:ltr;">${b.addedBy}</td>
                                    <td>
                                        <button onclick="alert('تم اعتماد التقييم بنجاح')" style="background: var(--success); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 0.85rem; font-weight: 600;">اعتماد</button>
                                        <button onclick="alert('تم رفض وحذف التقييم')" style="background: var(--danger-bg); color: var(--danger); border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 0.85rem; font-weight: 600; margin-right: 5px;">رفض</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                        ${recentBehaviors.length === 0 ? '<tr><td colspan="6" style="text-align:center;">لا يوجد سجلات حالية</td></tr>' : ''}
                    </tbody>
                </table>
            </div>

            <!-- سجل الدرجات والاختبارات -->
            <div class="table-container" style="margin-top: 24px;">
                <div style="padding: 15px; background: var(--surface); border-bottom: 1px solid var(--border);">
                    <h3 style="margin: 0; color: var(--primary);"><i data-lucide="file-check"></i> سجل درجات الاختبارات المضافة مؤخراً</h3>
                 </div>
                <table>
                    <thead>
                        <tr>
                            <th>الطالب</th>
                            <th>الفصل</th>
                            <th>المادة / التقييم</th>
                            <th>الدرجة</th>
                            <th>المعلم المسئول</th>
                            <th>اعتماد الكنترول</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentGrades.map(g => {
                             const student = DB.students.find(s => s.id === g.studentId) || {};
                             return `
                                <tr>
                                    <td><strong>${student.name || 'غير معروف'}</strong></td>
                                    <td>${student.class || '-'}</td>
                                    <td>${g.subject}</td>
                                    <td><strong style="color: var(--primary);">${g.grade} / ${g.max}</strong></td>
                                    <td style="direction:ltr;">${g.addedBy}</td>
                                    <td>
                                        <button onclick="alert('تم اعتماد الدرجة بنجاح')" style="background: var(--success); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 0.85rem; font-weight: 600;">تسجيل الدرجة</button>
                                    </td>
                                </tr>
                             `;
                        }).join('')}
                         ${recentGrades.length === 0 ? '<tr><td colspan="6" style="text-align:center;">لا يوجد درجات حالية</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function loadAffairsDash() {
    pageTitle.textContent = "شئون الطلاب";

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime  = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    // Aggregate stats for today
    const todayAttendance = DB.attendance.filter(a => a.date === todayStr);
    const presentToday    = todayAttendance.filter(a => a.status === 'present').length;
    const lateToday       = todayAttendance.filter(a => a.status === 'late').length;
    const absentToday     = todayAttendance.filter(a => a.status === 'absent').length;
    const permToday       = todayAttendance.filter(a => a.status === 'permission').length;
    const totalStudents   = DB.students.length;
    const recordedToday   = todayAttendance.length;
    const notRecorded     = totalStudents - recordedToday;

    // Get unique classes
    const classes = [...new Set(DB.students.map(s => s.class || 'غير محدد'))].sort();
    const selectedClass = window._affairsClass || classes[0] || '';

    const filteredStudents = DB.students.filter(s => (s.class || 'غير محدد') === selectedClass);

    contentArea.innerHTML = `
        <!-- Stats Header -->
        <div style="display:grid; grid-template-columns:repeat(5,1fr); gap:14px; margin-bottom:22px;">
            <div style="background:white; border:1px solid var(--border); border-radius:var(--radius); padding:16px 14px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                <div style="font-size:1.7rem; font-weight:800; color:var(--primary);">${totalStudents}</div>
                <div style="font-size:0.78rem; color:var(--text-light); margin-top:3px; display:flex; align-items:center; justify-content:center; gap:4px;"><i data-lucide="users" style="width:12px;"></i> إجمالي</div>
            </div>
            <div style="background:white; border:1px solid var(--border); border-radius:var(--radius); padding:16px 14px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                <div style="font-size:1.7rem; font-weight:800; color:var(--success);">${presentToday}</div>
                <div style="font-size:0.78rem; color:var(--text-light); margin-top:3px; display:flex; align-items:center; justify-content:center; gap:4px;"><i data-lucide="check-circle" style="width:12px;"></i> حضور</div>
            </div>
            <div style="background:white; border:1px solid var(--border); border-radius:var(--radius); padding:16px 14px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                <div style="font-size:1.7rem; font-weight:800; color:#f59e0b;">${lateToday}</div>
                <div style="font-size:0.78rem; color:var(--text-light); margin-top:3px; display:flex; align-items:center; justify-content:center; gap:4px;"><i data-lucide="clock" style="width:12px;"></i> تأخير</div>
            </div>
            <div style="background:white; border:1px solid var(--border); border-radius:var(--radius); padding:16px 14px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                <div style="font-size:1.7rem; font-weight:800; color:var(--danger);">${absentToday}</div>
                <div style="font-size:0.78rem; color:var(--text-light); margin-top:3px; display:flex; align-items:center; justify-content:center; gap:4px;"><i data-lucide="user-x" style="width:12px;"></i> غياب</div>
            </div>
            <div style="background:white; border:1px solid var(--border); border-radius:var(--radius); padding:16px 14px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                <div style="font-size:1.7rem; font-weight:800; color:#8b5cf6;">${permToday}</div>
                <div style="font-size:0.78rem; color:var(--text-light); margin-top:3px; display:flex; align-items:center; justify-content:center; gap:4px;"><i data-lucide="file-check" style="width:12px;"></i> إذن</div>
            </div>
        </div>

        <!-- Quick Add Absence -->
        <div style="background:white; border:1px solid var(--border); border-radius:var(--radius); margin-bottom:22px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
            <div style="background:linear-gradient(135deg,var(--primary) 0%,#7c3aed 100%); padding:14px 20px; color:white; display:flex; align-items:center; gap:10px;">
                <i data-lucide="clipboard-list" style="width:20px;"></i>
                <span style="font-weight:700; font-size:0.95rem;">تسجيل سريع — ${todayStr}</span>
                <span style="margin-right:auto; font-size:0.8rem; opacity:0.85;">${notRecorded} طالب لم يُسجَّل بعد</span>
            </div>
            <div style="padding:18px 20px; display:grid; grid-template-columns:1fr 1fr 1fr auto; gap:12px; align-items:end;">
                <div>
                    <label style="display:block; font-size:0.8rem; font-weight:700; color:var(--text-light); margin-bottom:6px;">كود الطالب</label>
                    <input type="text" id="affairs-code" placeholder="مثال: 12345678"
                           style="width:100%; padding:11px 14px; border:2px solid var(--border); border-radius:var(--radius); font-family:inherit; direction:ltr; text-align:right; transition:border-color 0.2s; font-size:0.95rem;"
                           onfocus="this.style.borderColor='var(--primary)'"
                           onblur="this.style.borderColor='var(--border)'"
                           oninput="affairsLookup(this.value)">
                    <div id="affairs-lookup-result" style="font-size:0.8rem; margin-top:5px; color:var(--text-light); min-height:18px;"></div>
                </div>
                <div>
                    <label style="display:block; font-size:0.8rem; font-weight:700; color:var(--text-light); margin-bottom:6px;">نوع السجل</label>
                    <select id="affairs-type" style="width:100%; padding:11px 14px; border:2px solid var(--border); border-radius:var(--radius); font-family:inherit; font-size:0.95rem; background:white;"
                            onfocus="this.style.borderColor='var(--primary)'"
                            onblur="this.style.borderColor='var(--border)'">
                        <option value="present">✅ حضور</option>
                        <option value="absent">❌ غياب</option>
                        <option value="late">⏰ تأخير</option>
                        <option value="permission">📋 إذن أثناء اليوم</option>
                    </select>
                </div>
                <div>
                    <label style="display:block; font-size:0.8rem; font-weight:700; color:var(--text-light); margin-bottom:6px;">ملاحظة (اختياري)</label>
                    <input type="text" id="affairs-note" placeholder="سبب الغياب / الإذن..."
                           style="width:100%; padding:11px 14px; border:2px solid var(--border); border-radius:var(--radius); font-family:inherit; font-size:0.95rem;"
                           onfocus="this.style.borderColor='var(--primary)'"
                           onblur="this.style.borderColor='var(--border)'">
                </div>
                <button onclick="submitAffairsEntry()"
                        style="padding:11px 22px; background:var(--primary); color:white; border:none; border-radius:var(--radius); cursor:pointer; font-family:inherit; font-weight:700; font-size:0.95rem; white-space:nowrap; display:flex; align-items:center; gap:8px;">
                    <i data-lucide="save" style="width:16px;"></i> تسجيل
                </button>
            </div>
        </div>

        <!-- Class Tabs + Student Table -->
        <div style="background:white; border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
            <!-- Class selector tabs -->
            <div style="display:flex; border-bottom:1px solid var(--border); overflow-x:auto; background:var(--bg);">
                ${classes.map(cls => `
                    <button onclick="window._affairsClass='${cls}'; loadAffairsDash();"
                            style="padding:12px 20px; border:none; background:${cls===selectedClass?'white':'transparent'}; color:${cls===selectedClass?'var(--primary)':'var(--text-light)'}; font-family:inherit; font-weight:700; font-size:0.9rem; cursor:pointer; border-bottom:${cls===selectedClass?'2px solid var(--primary)':'2px solid transparent'}; white-space:nowrap; transition:all 0.2s;">
                        فصل ${cls}
                        <span style="background:${cls===selectedClass?'var(--primary)':'var(--border)'}; color:${cls===selectedClass?'white':'var(--text-light)'}; padding:2px 8px; border-radius:20px; font-size:0.75rem; margin-right:5px;">
                            ${DB.students.filter(s=>(s.class||'غير محدد')===cls).length}
                        </span>
                    </button>
                `).join('')}
            </div>

            <!-- Header bar for selected class -->
            <div style="padding:12px 20px; background:var(--primary)08; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                <div style="font-weight:700; font-size:0.9rem; color:var(--primary);">
                    <i data-lucide="users" style="width:15px;"></i> فصل ${selectedClass} — ${filteredStudents.length} طالب
                </div>
                <div style="font-size:0.8rem; color:var(--text-light);">اضغط على الزرار لتسجيل الحالة مباشرة</div>
            </div>

            <!-- Students table -->
            <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; min-width:700px;">
                <thead>
                    <tr style="background:var(--bg); text-align:right;">
                        <th style="padding:12px 20px; font-size:0.8rem; color:var(--text-light); font-weight:600;">#</th>
                        <th style="padding:12px 16px; font-size:0.8rem; color:var(--text-light); font-weight:600;">الطالب</th>
                        <th style="padding:12px 16px; font-size:0.8rem; color:var(--text-light); font-weight:600;">الكود</th>
                        <th style="padding:12px 16px; font-size:0.8rem; color:var(--text-light); font-weight:600; text-align:center;">حالة اليوم</th>
                        <th style="padding:12px 16px; font-size:0.8rem; color:var(--text-light); font-weight:600; text-align:center;">إجمالي الغياب</th>
                        <th style="padding:12px 16px; font-size:0.8rem; color:var(--text-light); font-weight:600; text-align:center;">إجراء سريع</th>
                    </tr>
                </thead>
                <tbody id="affairs-table-body">
                    ${filteredStudents.map((s, i) => {
                        const todayRec    = DB.attendance.find(a => a.studentId === s.id && a.date === todayStr);
                        const totalAbsent = DB.attendance.filter(a => a.studentId === s.id && a.status === 'absent').length;
                        const totalLate   = DB.attendance.filter(a => a.studentId === s.id && a.status === 'late').length;

                        const statusMap = {
                            present:    { label: 'حضور',   bg: 'var(--success-bg)', color: 'var(--success)' },
                            absent:     { label: 'غياب',   bg: 'var(--danger-bg)', color: 'var(--danger)' },
                            late:       { label: 'تأخير',  bg: '#fef3c7', color: '#f59e0b' },
                            permission: { label: 'إذن',    bg: '#ede9fe', color: '#8b5cf6' }
                        };
                        const rec  = todayRec ? statusMap[todayRec.status] : null;

                        return `
                        <tr style="border-bottom:1px solid var(--border); background:${todayRec ? (todayRec.status==='absent'?'#fff8f8':todayRec.status==='late'?'#fffbf0':'white') : 'white'};">
                            <td style="padding:12px 20px; font-size:0.8rem; color:var(--text-light);">${i+1}</td>
                            <td style="padding:12px 16px;">
                                <div style="font-weight:700;">${s.name}</div>
                                <div style="font-size:0.75rem; color:var(--text-light);">${s.email || ''}</div>
                            </td>
                            <td style="padding:12px 16px; font-size:0.85rem; direction:ltr; text-align:right; color:var(--text-light);">${s.code || '—'}</td>
                            <td style="padding:12px 16px; text-align:center;">
                                ${rec
                                    ? `<span style="background:${rec.bg}; color:${rec.color}; padding:4px 14px; border-radius:20px; font-weight:700; font-size:0.82rem;">${rec.label}</span>`
                                    : `<span style="background:#f3f4f6; color:var(--text-light); padding:4px 14px; border-radius:20px; font-size:0.82rem;">لم يُسجَّل</span>`
                                }
                            </td>
                            <td style="padding:12px 16px; text-align:center; font-size:0.85rem;">
                                <span style="color:var(--danger); font-weight:700;">${totalAbsent}</span>
                                <span style="color:var(--text-light); font-size:0.75rem;"> غياب</span>
                                &nbsp;
                                <span style="color:#f59e0b; font-weight:700;">${totalLate}</span>
                                <span style="color:var(--text-light); font-size:0.75rem;"> تأخير</span>
                            </td>
                            <td style="padding:10px 16px; text-align:center;">
                                <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap;">
                                    <button onclick="quickAffairsEntry('${s.id}','${s.name}','present')"
                                            style="padding:5px 10px; background:var(--success-bg); color:var(--success); border:1px solid var(--success); border-radius:8px; cursor:pointer; font-size:0.75rem; font-weight:700; font-family:inherit;">✅ حضور</button>
                                    <button onclick="quickAffairsEntry('${s.id}','${s.name}','absent')"
                                            style="padding:5px 10px; background:var(--danger-bg); color:var(--danger); border:1px solid var(--danger); border-radius:8px; cursor:pointer; font-size:0.75rem; font-weight:700; font-family:inherit;">❌ غياب</button>
                                    <button onclick="quickAffairsEntry('${s.id}','${s.name}','late')"
                                            style="padding:5px 10px; background:#fef3c7; color:#f59e0b; border:1px solid #f59e0b; border-radius:8px; cursor:pointer; font-size:0.75rem; font-weight:700; font-family:inherit;">⏰ تأخير</button>
                                    <button onclick="quickAffairsEntry('${s.id}','${s.name}','permission')"
                                            style="padding:5px 10px; background:#ede9fe; color:#8b5cf6; border:1px solid #8b5cf6; border-radius:8px; cursor:pointer; font-size:0.75rem; font-weight:700; font-family:inherit;">📋 إذن</button>
                                </div>
                            </td>
                        </tr>`;
                    }).join('')}
                    ${filteredStudents.length === 0 ? `<tr><td colspan="6" style="padding:40px; text-align:center; color:var(--text-light);">لا يوجد طلاب في هذا الفصل</td></tr>` : ''}
                </tbody>
            </table>
            </div>
        </div>
    `;

    lucide.createIcons();
}

// ─── Lookup student by code in affairs ───────────────────────────────────────
window.affairsLookup = function(code) {
    const el = document.getElementById('affairs-lookup-result');
    if (!el) return;
    if (!code || code.trim().length < 3) { el.textContent = ''; return; }
    const student = DB.students.find(s => s.code === code.trim());
    if (student) {
        el.innerHTML = `<span style="color:var(--success); font-weight:700;"><i data-lucide="check" style="width:12px;"></i> ${student.name} — فصل ${student.class || '—'}</span>`;
    } else {
        el.innerHTML = `<span style="color:var(--danger);">كود غير موجود</span>`;
    }
    lucide.createIcons();
};

// ─── Submit from the top form ─────────────────────────────────────────────────
window.submitAffairsEntry = function() {
    const code    = document.getElementById('affairs-code')?.value.trim();
    const type    = document.getElementById('affairs-type')?.value;
    const note    = document.getElementById('affairs-note')?.value.trim() || '';
    const student = DB.students.find(s => s.code === code);

    if (!student) { alert('كود الطالب غير صحيح أو غير موجود.'); return; }

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime  = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    // Remove existing record for today if exists
    const existIdx = DB.attendance.findIndex(a => a.studentId === student.id && a.date === todayStr);
    if (existIdx !== -1) DB.attendance.splice(existIdx, 1);

    const entry = { date: todayStr, studentId: student.id, status: type };
    if (type === 'late' || type === 'permission') entry.time = nowTime;
    if (note) entry.note = note;
    DB.attendance.push(entry);

    const typeLabels = { present: 'حضور', absent: 'غياب', late: 'تأخير', permission: 'إذن أثناء اليوم' };

    // Notify student
    DB.notifications.push({
        id: Date.now(),
        recipientId: student.id,
        message: `📋 تم تسجيل [${typeLabels[type]}] بواسطة شئون الطلاب في ${todayStr}${note ? ' — ملاحظة: ' + note : ''}.`,
        date: todayStr,
        read: false
    });

    // Notify parent (if absent or early permission)
    if (type === 'absent' || type === 'permission') {
        DB.notifications.push({
            id: Date.now() + 1,
            recipientId: 'parent_' + student.id,
            message: `📋 إشعار لولي الأمر: طفلك/طفلتك (${student.name}) — [${typeLabels[type]}] في ${todayStr}${note ? ' — السبب: ' + note : ''}.`,
            date: todayStr,
            read: false
        });
    }

    loadAffairsDash();
    alert(`✅ تم تسجيل [${typeLabels[type]}] للطالب: ${student.name}`);
};

// ─── Quick entry directly from table row ─────────────────────────────────────
window.quickAffairsEntry = function(studentId, studentName, type) {
    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime  = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    // Remove existing
    const existIdx = DB.attendance.findIndex(a => a.studentId === studentId && a.date === todayStr);
    if (existIdx !== -1) DB.attendance.splice(existIdx, 1);

    const entry = { date: todayStr, studentId: studentId, status: type };
    if (type === 'late' || type === 'permission') entry.time = nowTime;
    DB.attendance.push(entry);

    const typeLabels = { present: 'حضور', absent: 'غياب', late: 'تأخير', permission: 'إذن' };

    // Notify student
    DB.notifications.push({
        id: Date.now(),
        recipientId: studentId,
        message: `📋 تم تسجيل [${typeLabels[type]}] بواسطة شئون الطلاب في ${todayStr}.`,
        date: todayStr, read: false
    });

    // Reload table in place without full page reload
    loadAffairsDash();
};

function loadTeacherDash() {
    const activeTab = window._teacherTab || 'tch-tab-home';
    const teacherClasses = currentUser.data.classes || [];
    const selectedClass  = window._teacherClass || teacherClasses[0] || '';
    const todayStr       = new Date().toISOString().split('T')[0];

    // Aggregate for this teacher's classes
    const myStudents = DB.students.filter(s => teacherClasses.includes(s.class || ''));
    const totalAbsent = DB.attendance.filter(a => myStudents.some(s=>s.id===a.studentId) && a.status==='absent').length;
    const todayPresent = DB.attendance.filter(a => a.date===todayStr && myStudents.some(s=>s.id===a.studentId) && a.status==='present').length;
    const myGrades = DB.grades.filter(g => g.addedBy === currentUser.data.email);
    const myBehavior = DB.behavior.filter(b => b.addedBy === currentUser.data.name);

    const classStudents = DB.students.filter(s => s.class === selectedClass);

    // ── Tab titles ──
    const tabTitles = {
        'tch-tab-home': 'الرئيسية', 'tch-tab-classes': 'فصولي',
        'tch-tab-grades': 'أعمال الدرجات', 'tch-tab-attendance': 'الحضور والغياب', 'tch-tab-behavior': 'نقاط السلوك'
    };
    pageTitle.textContent = `المدرس — ${tabTitles[activeTab] || 'الرئيسية'}`;

    contentArea.innerHTML = `

    <!-- ══ TAB: HOME ══ -->
    <div id="tch-tab-home" class="tch-tab-panel" style="display:${activeTab==='tch-tab-home'?'block':'none'};">
        <!-- Hero -->
        <div style="background:linear-gradient(135deg,var(--primary) 0%,#7c3aed 100%); border-radius:var(--radius); padding:26px 28px; color:white; margin-bottom:20px; position:relative; overflow:hidden;">
            <div style="position:absolute;top:-20px;left:-20px;width:160px;height:160px;background:rgba(255,255,255,0.05);border-radius:50%;"></div>
            <div style="display:flex; align-items:center; gap:18px; position:relative; z-index:1;">
                <div style="width:70px;height:70px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,0.4);">
                    <i data-lucide="user" style="width:34px;height:34px;color:white;"></i>
                </div>
                <div>
                    <div style="font-size:0.82rem;opacity:0.8;">مرحباً،</div>
                    <div style="font-size:1.5rem;font-weight:800;">${currentUser.data.name}</div>
                    <div style="font-size:0.85rem;opacity:0.85;margin-top:4px;">
                        ${teacherClasses.map(c=>`<span style="background:rgba(255,255,255,0.2);padding:2px 10px;border-radius:12px;margin-left:6px;">فصل ${c}</span>`).join('')}
                    </div>
                </div>
            </div>
        </div>

        <!-- Stats -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;">
            <div style="background:white;border:1px solid var(--border);border-radius:var(--radius);padding:18px;text-align:center;">
                <div style="font-size:1.8rem;font-weight:800;color:var(--primary);">${myStudents.length}</div>
                <div style="font-size:0.8rem;color:var(--text-light);margin-top:3px;"><i data-lucide="users" style="width:12px;"></i> طلابي</div>
            </div>
            <div style="background:white;border:1px solid var(--border);border-radius:var(--radius);padding:18px;text-align:center;">
                <div style="font-size:1.8rem;font-weight:800;color:var(--success);">${todayPresent}</div>
                <div style="font-size:0.8rem;color:var(--text-light);margin-top:3px;"><i data-lucide="check-circle" style="width:12px;"></i> حضروا اليوم</div>
            </div>
            <div style="background:white;border:1px solid var(--border);border-radius:var(--radius);padding:18px;text-align:center;">
                <div style="font-size:1.8rem;font-weight:800;color:var(--danger);">${totalAbsent}</div>
                <div style="font-size:0.8rem;color:var(--text-light);margin-top:3px;"><i data-lucide="user-x" style="width:12px;"></i> غيابات</div>
            </div>
            <div style="background:white;border:1px solid var(--border);border-radius:var(--radius);padding:18px;text-align:center;">
                <div style="font-size:1.8rem;font-weight:800;color:#f59e0b;">${myGrades.length}</div>
                <div style="font-size:0.8rem;color:var(--text-light);margin-top:3px;"><i data-lucide="trending-up" style="width:12px;"></i> درجات أضفتها</div>
            </div>
        </div>

        <!-- Quick action row -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div style="background:white;border:1px solid var(--border);border-radius:var(--radius);padding:20px;cursor:pointer;transition:all 0.2s;"
                 onclick="window._teacherTab='tch-tab-classes'; loadTeacherDash();"
                 onmouseenter="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'; this.style.borderColor='var(--primary)';"
                 onmouseleave="this.style.boxShadow='none'; this.style.borderColor='var(--border)';">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:44px;height:44px;background:var(--primary)15;border-radius:10px;display:flex;align-items:center;justify-content:center;">
                        <i data-lucide="users" style="width:22px;color:var(--primary);"></i>
                    </div>
                    <div>
                        <div style="font-weight:700;">فصولي</div>
                        <div style="font-size:0.8rem;color:var(--text-light);">تسجيل سلوك ودرجات الطلاب</div>
                    </div>
                </div>
            </div>
            <div style="background:white;border:1px solid var(--border);border-radius:var(--radius);padding:20px;cursor:pointer;transition:all 0.2s;"
                 onclick="window._teacherTab='tch-tab-attendance'; loadTeacherDash();"
                 onmouseenter="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'; this.style.borderColor='var(--success)';"
                 onmouseleave="this.style.boxShadow='none'; this.style.borderColor='var(--border)';">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:44px;height:44px;background:var(--success-bg);border-radius:10px;display:flex;align-items:center;justify-content:center;">
                        <i data-lucide="calendar-check" style="width:22px;color:var(--success);"></i>
                    </div>
                    <div>
                        <div style="font-weight:700;">سجل الحضور</div>
                        <div style="font-size:0.8rem;color:var(--text-light);">متابعة حضور الطلاب اليومي</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- ══ TAB: CLASSES ══ -->
    <div id="tch-tab-classes" class="tch-tab-panel" style="display:${activeTab==='tch-tab-classes'?'block':'none'};">
        <!-- Class tabs -->
        <div style="display:flex;border-bottom:1px solid var(--border);overflow-x:auto;background:white;border-radius:var(--radius) var(--radius) 0 0;margin-bottom:0;">
            ${teacherClasses.map(cls => `
            <button onclick="window._teacherClass='${cls}';window._teacherTab='tch-tab-classes';loadTeacherDash();"
                    style="padding:12px 20px;border:none;background:${cls===selectedClass?'var(--primary)':'transparent'};color:${cls===selectedClass?'white':'var(--text-light)'};font-family:inherit;font-weight:700;font-size:0.9rem;cursor:pointer;border-radius:${cls===selectedClass?'var(--radius) var(--radius) 0 0':'0'};white-space:nowrap;">
                فصل ${cls} (${DB.students.filter(s=>s.class===cls).length})
            </button>`).join('')}
            ${teacherClasses.length===0? '<div style="padding:12px 20px;color:var(--text-light);">لم تُسنَد إليك فصول بعداً</div>' : ''}
        </div>

        <div style="background:white;border:1px solid var(--border);border-radius:0 0 var(--radius) var(--radius);overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
            <thead>
                <tr style="background:var(--bg);text-align:right;">
                    <th style="padding:12px 16px;font-size:0.8rem;color:var(--text-light);">#</th>
                    <th style="padding:12px 16px;font-size:0.8rem;color:var(--text-light);">الطالب</th>
                    <th style="padding:12px 16px;font-size:0.8rem;color:var(--text-light);text-align:center;">الحضور اليوم</th>
                    <th style="padding:12px 16px;font-size:0.8rem;color:var(--text-light);text-align:center;">نقاط السلوك</th>
                    <th style="padding:12px 16px;font-size:0.8rem;color:var(--text-light);">إضافة درجة / سلوك</th>
                </tr>
            </thead>
            <tbody>
            ${classStudents.map((s, i) => {
                const todayRec = DB.attendance.find(a => a.studentId===s.id && a.date===todayStr);
                const pts = DB.behavior.filter(b=>b.studentId===s.id).reduce((sum,b)=>sum+b.points,0);
                const statusBg = {present:'var(--success-bg)',absent:'var(--danger-bg)',late:'#fef3c7',permission:'#ede9fe'};
                const statusColor = {present:'var(--success)',absent:'var(--danger)',late:'#f59e0b',permission:'#8b5cf6'};
                const statusLabel = {present:'حضور',absent:'غياب',late:'تأخير',permission:'إذن'};
                return `
                <tr style="border-bottom:1px solid var(--border);">
                    <td style="padding:12px 16px;font-size:0.8rem;color:var(--text-light);">${i+1}</td>
                    <td style="padding:12px 16px;">
                        <div style="font-weight:700;">${s.name}</div>
                        <div style="font-size:0.75rem;color:var(--text-light);direction:ltr;text-align:right;">${s.code}</div>
                    </td>
                    <td style="padding:12px 16px;text-align:center;">
                        ${todayRec
                            ? `<span style="background:${statusBg[todayRec.status]};color:${statusColor[todayRec.status]};padding:3px 12px;border-radius:20px;font-size:0.8rem;font-weight:700;">${statusLabel[todayRec.status]||todayRec.status}</span>`
                            : '<span style="background:#f3f4f6;color:var(--text-light);padding:3px 12px;border-radius:20px;font-size:0.8rem;">لم يُسجَّل</span>'}
                    </td>
                    <td style="padding:12px 16px;text-align:center;font-weight:700;font-size:1rem;color:${pts>=0?'var(--success)':'var(--danger)'};">${ pts>0?'+':''}${pts}</td>
                    <td style="padding:10px 16px;">
                        <form onsubmit="submitTeacherAction(event,'${s.id}','${s.name}')" style="display:flex;gap:7px;align-items:center;flex-wrap:wrap;">
                            <select name="actionType" style="padding:7px 10px;border-radius:8px;border:1px solid var(--border);font-family:inherit;font-size:0.82rem;">
                                <option value="interaction">تفاعل ✨</option>
                                <option value="homework">واجب 📚</option>
                                <option value="exam">درجة 📝</option>
                            </select>
                            <select name="valueType" style="padding:7px 10px;border-radius:8px;border:1px solid var(--border);font-family:inherit;font-size:0.82rem;">
                                <option value="positive">+ إيجابي</option>
                                <option value="negative">- سلبي</option>
                            </select>
                            <input type="number" name="points" placeholder="النقاط" style="width:75px;padding:7px 10px;border-radius:8px;border:1px solid var(--border);font-family:inherit;font-size:0.82rem;">
                            <input type="text" name="reason" placeholder="ملاحظة..." style="flex:1;min-width:120px;padding:7px 10px;border-radius:8px;border:1px solid var(--border);font-family:inherit;font-size:0.82rem;">
                            <button type="submit" style="padding:7px 14px;background:var(--primary);color:white;border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-size:0.82rem;font-weight:700;white-space:nowrap;">
                                <i data-lucide="send" style="width:13px;"></i> إرسال
                            </button>
                        </form>
                    </td>
                </tr>`;
            }).join('')}
            ${classStudents.length===0?`<tr><td colspan="5" style="padding:40px;text-align:center;color:var(--text-light);">لا يوجد طلاب في هذا الفصل</td></tr>`:''}
            </tbody>
        </table>
        </div>
    </div>

    <!-- ══ TAB: GRADES ══ -->
    <div id="tch-tab-grades" class="tch-tab-panel" style="display:${activeTab==='tch-tab-grades'?'block':'none'};">
        <div style="background:white;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;">
            <div style="padding:14px 20px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;">
                <i data-lucide="trending-up" style="width:18px;color:var(--primary);"></i>
                <span style="font-weight:700;">درجات أضفتها (${myGrades.length} درجة)</span>
            </div>
            ${myGrades.length>0 ? `
            <table style="width:100%;border-collapse:collapse;">
                <thead><tr style="background:var(--bg);text-align:right;">
                    <th style="padding:11px 16px;font-size:0.8rem;color:var(--text-light);">الطالب</th>
                    <th style="padding:11px 16px;font-size:0.8rem;color:var(--text-light);">المادة / التقييم</th>
                    <th style="padding:11px 16px;font-size:0.8rem;color:var(--text-light);text-align:center;">الدرجة</th>
                    <th style="padding:11px 16px;font-size:0.8rem;color:var(--text-light);text-align:center;">النسبة</th>
                </tr></thead>
                <tbody>
                ${myGrades.map(g => {
                    const st = DB.students.find(s=>s.id===g.studentId)||{};
                    const pct = Math.round(g.grade/g.max*100);
                    const pctColor = pct>=80?'var(--success)':pct>=60?'var(--warning)':'var(--danger)';
                    return `<tr style="border-bottom:1px solid var(--border);">
                        <td style="padding:11px 16px;font-weight:700;">${st.name||'—'}</td>
                        <td style="padding:11px 16px;">${g.subject}</td>
                        <td style="padding:11px 16px;text-align:center;font-weight:700;color:var(--primary);">${g.grade}/${g.max}</td>
                        <td style="padding:11px 16px;text-align:center;"><span style="color:${pctColor};font-weight:700;">${pct}%</span></td>
                    </tr>`;
                }).join('')}
                </tbody>
            </table>` : '<div style="padding:40px;text-align:center;color:var(--text-light);">لم تُضَف درجات بعد</div>'}
        </div>
    </div>

    <!-- ══ TAB: ATTENDANCE ══ -->
    <div id="tch-tab-attendance" class="tch-tab-panel" style="display:${activeTab==='tch-tab-attendance'?'block':'none'};">
        <div style="background:white;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;">
            <div style="padding:14px 20px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:8px;font-weight:700;">
                    <i data-lucide="calendar-check" style="width:18px;color:var(--success);"></i>
                    سجل الحضور لطلابي — اليوم: ${todayStr}
                </div>
            </div>
            <table style="width:100%;border-collapse:collapse;">
                <thead><tr style="background:var(--bg);text-align:right;">
                    <th style="padding:11px 16px;font-size:0.8rem;color:var(--text-light);">الطالب</th>
                    <th style="padding:11px 16px;font-size:0.8rem;color:var(--text-light);">الفصل</th>
                    <th style="padding:11px 16px;font-size:0.8rem;color:var(--text-light);text-align:center;">الحالة اليوم</th>
                    <th style="padding:11px 16px;font-size:0.8rem;color:var(--text-light);text-align:center;">إجمالي الغياب</th>
                </tr></thead>
                <tbody>
                ${myStudents.map(s => {
                    const todayRec = DB.attendance.find(a=>a.studentId===s.id&&a.date===todayStr);
                    const absTotal = DB.attendance.filter(a=>a.studentId===s.id&&a.status==='absent').length;
                    const lateTotal = DB.attendance.filter(a=>a.studentId===s.id&&a.status==='late').length;
                    const sBg = {present:'var(--success-bg)',absent:'var(--danger-bg)',late:'#fef3c7',permission:'#ede9fe'};
                    const sC  = {present:'var(--success)',absent:'var(--danger)',late:'#f59e0b',permission:'#8b5cf6'};
                    const sL  = {present:'حضور',absent:'غياب',late:'تأخير',permission:'إذن'};
                    return `<tr style="border-bottom:1px solid var(--border);">
                        <td style="padding:11px 16px;font-weight:700;">${s.name}</td>
                        <td style="padding:11px 16px;font-size:0.85rem;color:var(--text-light);">فصل ${s.class||'—'}</td>
                        <td style="padding:11px 16px;text-align:center;">
                            ${todayRec
                                ? `<span style="background:${sBg[todayRec.status]};color:${sC[todayRec.status]};padding:3px 12px;border-radius:20px;font-size:0.82rem;font-weight:700;">${sL[todayRec.status]||todayRec.status}</span>`
                                : '<span style="background:#f3f4f6;color:var(--text-light);padding:3px 12px;border-radius:20px;font-size:0.82rem;">لم يُسجَّل</span>'}
                        </td>
                        <td style="padding:11px 16px;text-align:center;font-size:0.88rem;">
                            <span style="color:var(--danger);font-weight:700;">${absTotal}</span> غياب &nbsp;
                            <span style="color:#f59e0b;font-weight:700;">${lateTotal}</span> تأخير
                        </td>
                    </tr>`;
                }).join('')}
                ${myStudents.length===0?`<tr><td colspan="4" style="padding:40px;text-align:center;color:var(--text-light);">لا يوجد طلاب في فصولك</td></tr>`:''}
                </tbody>
            </table>
        </div>
    </div>

    <!-- ══ TAB: BEHAVIOR ══ -->
    <div id="tch-tab-behavior" class="tch-tab-panel" style="display:${activeTab==='tch-tab-behavior'?'block':'none'};">
        <div style="background:white;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;">
            <div style="padding:14px 20px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;">
                <i data-lucide="star" style="width:18px;color:#f59e0b;"></i>
                <span style="font-weight:700;">سجل نقاط السلوك التي أضفتها</span>
            </div>
            ${myBehavior.length>0 ? `
            <table style="width:100%;border-collapse:collapse;">
                <thead><tr style="background:var(--bg);text-align:right;">
                    <th style="padding:11px 16px;font-size:0.8rem;color:var(--text-light);">الطالب</th>
                    <th style="padding:11px 16px;font-size:0.8rem;color:var(--text-light);">نوع التقييم</th>
                    <th style="padding:11px 16px;font-size:0.8rem;color:var(--text-light);">السبب</th>
                    <th style="padding:11px 16px;font-size:0.8rem;color:var(--text-light);text-align:center;">النقاط</th>
                </tr></thead>
                <tbody>
                ${[...myBehavior].reverse().map(b => {
                    const st = DB.students.find(s=>s.id===b.studentId)||{};
                    return `<tr style="border-bottom:1px solid var(--border);">
                        <td style="padding:11px 16px;font-weight:700;">${st.name||'—'}</td>
                        <td style="padding:11px 16px;font-size:0.88rem;">${b.actionType}</td>
                        <td style="padding:11px 16px;font-size:0.85rem;color:var(--text-light);">${b.reason}</td>
                        <td style="padding:11px 16px;text-align:center;font-weight:700;font-size:1rem;color:${b.points>=0?'var(--success)':'var(--danger)'};">${ b.points>0?'+':''}${b.points}</td>
                    </tr>`;
                }).join('')}
                </tbody>
            </table>` : '<div style="padding:40px;text-align:center;color:var(--text-light);">لم تُسجَّل نقاط سلوك بعد</div>'}
        </div>
    </div>
    `;
    lucide.createIcons();
}

window.submitTeacherAction = function(event, studentId, studentName) {
    event.preventDefault();
    const form = event.target;
    const actionType = form.actionType.value;
    const valueType  = form.valueType ? form.valueType.value : 'positive';
    const points     = parseFloat(form.points?.value) || 0;
    const reason     = form.reason.value;
    const dateStr    = new Date().toISOString().split('T')[0];

    let notificationMsg = '';

    if (actionType === 'attendance') {
        DB.attendance.push({ date: dateStr, studentId: studentId, status: 'absent' });
        notificationMsg = `⚠️ غياب في الحصة بواسطة ${currentUser.data.name} — السبب: ${reason}`;
    } else if (actionType === 'exam') {
        DB.grades.push({ subject: reason || 'تقييم معلم', studentId: studentId, grade: points, max: 100, addedBy: currentUser.data.email });
        notificationMsg = `📝 تم إضافة درجة اختبار: ${points}/100 — ${reason} (بواسطة ${currentUser.data.name})`;
    } else {
        const isBonus   = valueType === 'positive';
        const finalPts  = isBonus ? Math.abs(points) : -Math.abs(points);
        const typeLabel = actionType === 'interaction' ? 'تفاعل ومشاركة' : 'واجب مدرسي';
        DB.behavior.push({ studentId, type: isBonus?'bonus':'deduction', points: finalPts, actionType: typeLabel, reason, addedBy: currentUser.data.name });
        notificationMsg = `${isBonus?'✅':'⚠️'} ${typeLabel}: ${finalPts>0?'+':''}${finalPts} نقطة — ${reason} (بواسطة ${currentUser.data.name})`;
    }

    DB.notifications.push({ id: Date.now(), recipientId: studentId, message: notificationMsg, date: dateStr, read: false });

    // Also notify parent
    DB.notifications.push({ id: Date.now()+1, recipientId: 'parent_'+studentId, message: notificationMsg, date: dateStr, read: false });

    form.reset();
    loadTeacherDash(); // Refresh to show updated data
    // Show brief toast
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--primary);color:white;padding:12px 24px;border-radius:var(--radius);font-family:Cairo,sans-serif;font-weight:700;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.2);';
    toast.textContent = `✅ تم تسجيل الإجراء للطالب ${studentName} وإرسال الإشعار`;
    document.body.appendChild(toast);
    setTimeout(()=>toast.remove(), 3000);
};
