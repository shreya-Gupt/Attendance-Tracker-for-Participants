let participants = JSON.parse(localStorage.getItem('gfg_attendance_db')) || [];
let activeFilter = 'all';
let chartInstance = null;

const registerForm = document.getElementById('registerForm');
const tableBody = document.getElementById('tableBody');

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    saveAndRender();
});

// Theme Management
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

// Add New Participant
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('pName').value.trim();
    const id = document.getElementById('pId').value.trim();

    if (participants.some(p => p.id === id)) {
        alert('Participant ID already registered!');
        return;
    }

    participants.push({ id, name, status: 'Pending' });
    saveAndRender();
    registerForm.reset();
});

// Update Individual Status
function setStatus(id, newStatus) {
    participants = participants.map(p => p.id === id ? { ...p, status: newStatus } : p);
    saveAndRender();
}

// Bulk Mark All Present
function markAllPresent() {
    if(participants.length === 0) return;
    participants = participants.map(p => ({ ...p, status: 'Present' }));
    saveAndRender();
}

// Delete Record
function deleteParticipant(id) {
    participants = participants.filter(p => p.id !== id);
    saveAndRender();
}

// Set Active Table Filter
function setFilter(filter, element) {
    activeFilter = filter;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    filterRecords();
}

// Main Render Routine
function saveAndRender() {
    localStorage.setItem('gfg_attendance_db', JSON.stringify(participants));
    filterRecords();
    updateStatsAndChart();
}

// Table Renderer with Filters
function filterRecords() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = participants.filter(p => 
        p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)
    );

    if (activeFilter !== 'all') {
        filtered = filtered.filter(p => p.status === activeFilter);
    }

    tableBody.innerHTML = '';
    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted); padding: 1.5rem;">No matching participant records found.</td></tr>`;
        return;
    }

    filtered.forEach(p => {
        const tr = document.createElement('tr');
        let badgeClass = p.status === 'Present' ? 'badge-present' : (p.status === 'Absent' ? 'badge-absent' : 'badge-pending');

        tr.innerHTML = `
            <td><strong>${p.id}</strong></td>
            <td>${p.name}</td>
            <td><span class="badge ${badgeClass}">${p.status}</span></td>
            <td><button class="btn-qr" onclick="showQR('${p.name}', '${p.id}')"><i class="fa-solid fa-qrcode"></i> View Pass</button></td>
            <td>
                <div class="action-btns">
                    <button class="btn-action btn-mark-p" onclick="setStatus('${p.id}', 'Present')" title="Mark Present"><i class="fa-solid fa-check"></i></button>
                    <button class="btn-action btn-mark-a" onclick="setStatus('${p.id}', 'Absent')" title="Mark Absent"><i class="fa-solid fa-xmark"></i></button>
                    <button class="btn-action btn-del" onclick="deleteParticipant('${p.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// Analytics Chart Engine
function initChart() {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Present', 'Absent', 'Pending'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

function updateStatsAndChart() {
    const total = participants.length;
    const present = participants.filter(p => p.status === 'Present').length;
    const absent = participants.filter(p => p.status === 'Absent').length;
    const pending = total - (present + absent);

    document.getElementById('totalCount').textContent = total;
    document.getElementById('presentCount').textContent = present;
    document.getElementById('absentCount').textContent = absent;

    if (chartInstance) {
        chartInstance.data.datasets[0].data = [present, absent, pending];
        chartInstance.update();
    }
}

// QR Code Generator Modal Logic
function showQR(name, id) {
    document.getElementById('modalName').textContent = name;
    document.getElementById('modalId').textContent = 'ID: ' + id;
    
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';
    
    new QRCode(qrContainer, {
        text: `VERIFIED_EVENT_PASS:${id}:${name}`,
        width: 128,
        height: 128
    });

    document.getElementById('qrModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('qrModal').style.display = 'none';
}

// CSV Export Feature
function exportCSV() {
    if (participants.length === 0) {
        alert('No data available to export.');
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,Participant ID,Name,Status\n";
    participants.forEach(p => { csvContent += `${p.id},${p.name},${p.status}\n`; });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "GFG_Attendance_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}