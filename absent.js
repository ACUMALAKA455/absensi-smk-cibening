const classFilter = document.getElementById("classFilter");
const studentSearch = document.getElementById("studentSearch");
const clearSearch = document.getElementById("clearSearch");

const studentTableBody = document.getElementById("studentTableBody");
const filteredCount = document.getElementById("filteredCount");
const resultInfo = document.getElementById("resultInfo");
const studentNotFound = document.getElementById("studentNotFound");

const overviewTotal =
    document.getElementById("overviewTotal");

const presentCount =
    document.getElementById("presentCount");

const absentCount =
    document.getElementById("absentCount");

let allStudents = [];


/* ==============================
   FORMAT TANGGAL
================================ */

function formatAttendanceDate(attendance) {

    if (!attendance) {
        return "-";
    }

    const monthNames = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember"
    ];

    return `${attendance.tanggal} ${monthNames[attendance.bulan - 1]} ${attendance.tahun}`;
}


/* ==============================
   ESCAPE HTML
================================ */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ==============================
   AMBIL DATA ABSENSI
================================ */

function getAttendance(nis) {

    const key = `attendance_${new Date().toISOString().slice(0, 10)}_${nis}`;

    const data = localStorage.getItem(key);

    if (!data) {
        return null;
    }

    try {
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
}


/* ==============================
   LOAD SISWA
================================ */

async function loadStudentDatabase() {

    try {

        const response = await fetch("data/students.json");

        if (!response.ok) {
            throw new Error("Gagal mengambil students.json");
        }

        allStudents = await response.json();

        updateStudentDatabase();

    } catch (error) {

        console.error(error);

        studentTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="student-loading">
                    Gagal memuat database siswa.
                </td>
            </tr>
        `;
    }
}


/* ==============================
   UPDATE DATABASE
================================ */

function updateStudentDatabase() {

    updateAttendanceOverview();

     updateAbsentStudentsList();
     
    function updateAbsentStudentsList() {

    const absentListBody =
        document.getElementById("absentListBody");

    const absentListCount =
        document.getElementById("absentListCount");

    const allPresentMessage =
        document.getElementById("allPresentMessage");


    if (!absentListBody) {
        return;
    }


    const absentStudents =
        allStudents.filter(student => {

            return !getAttendance(student.nis);

        });


    /* ==============================
       JUMLAH BELUM ABSEN
    ============================== */

    if (absentListCount) {

        absentListCount.textContent =
            absentStudents.length;

    }


    /* ==============================
       SEMUA SUDAH HADIR
    ============================== */

    if (absentStudents.length === 0) {

        absentListBody.innerHTML = "";

        if (allPresentMessage) {
            allPresentMessage.style.display = "flex";
        }

        return;
    }


    if (allPresentMessage) {
        allPresentMessage.style.display = "none";
    }


    /* ==============================
       RENDER LIST
    ============================== */

    absentListBody.innerHTML =
        absentStudents.map((student, index) => {

            return `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHTML(student.nis)}
                    </td>

                    <td>
                        ${escapeHTML(student.nama)}
                    </td>

                    <td>
                        ${escapeHTML(student.kelas)}
                    </td>

                </tr>

            `;

        }).join("");
}

    const selectedClass = classFilter.value;

    const searchText =
        studentSearch.value
            .trim()
            .toLowerCase();


    let filteredStudents = allStudents.filter(student => {

        const classMatch =
            selectedClass === "ALL" ||
            student.kelas === selectedClass;


        const searchMatch =
            student.nama.toLowerCase().includes(searchText) ||
            String(student.nis).toLowerCase().includes(searchText);


        return classMatch && searchMatch;

    });


    renderStudentTable(filteredStudents);


    filteredCount.textContent =
        filteredStudents.length;


    if (searchText) {

        resultInfo.textContent =
            `Hasil pencarian "${studentSearch.value}"`;

    } else if (selectedClass !== "ALL") {

        resultInfo.textContent =
            `Menampilkan kelas ${selectedClass}`;

    } else {

        resultInfo.textContent =
            "Menampilkan semua siswa";
    }


    if (filteredStudents.length === 0) {

        studentNotFound.style.display = "block";

    } else {

        studentNotFound.style.display = "none";
    }
}


/* ==============================
   RENDER TABEL
================================ */

function renderStudentTable(students) {

    if (!students.length) {

        studentTableBody.innerHTML = "";

        return;
    }


    studentTableBody.innerHTML = students.map((student, index) => {

        const attendance =
            getAttendance(student.nis);


        let statusHTML;
        let dateHTML;
        let timeHTML;


        if (attendance) {

            statusHTML = `
                <span class="attendance-badge present">
                    HADIR
                </span>
            `;

            dateHTML =
                escapeHTML(
                    formatAttendanceDate(attendance)
                );

            timeHTML =
                escapeHTML(
                    attendance.waktu || "-"
                );

        } else {

            statusHTML = `
                <span class="attendance-badge absent">
                    BELUM ABSEN
                </span>
            `;

            dateHTML = "-";

            timeHTML = "-";
        }


        return `

            <tr>

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${escapeHTML(student.nis)}
                </td>

                <td class="student-name-cell">
                    ${escapeHTML(student.nama)}
                </td>

                <td>
                    ${escapeHTML(student.kelas)}
                </td>

                <td>
                    ${statusHTML}
                </td>

                <td>
                    ${dateHTML}
                </td>

                <td>
                    ${timeHTML}
                </td>

            </tr>

        `;

    }).join("");
}


/* ==============================
   EVENT SEARCH
================================ */

studentSearch.addEventListener(
    "input",
    updateStudentDatabase
);


/* ==============================
   EVENT FILTER KELAS
================================ */

classFilter.addEventListener(
    "change",
    updateStudentDatabase
);


/* ==============================
   CLEAR SEARCH
================================ */

clearSearch.addEventListener(
    "click",
    () => {

        studentSearch.value = "";

        updateStudentDatabase();

        studentSearch.focus();
    }
);


/* ==============================
   ABSENSI BERUBAH
================================ */

window.addEventListener(
    "attendanceUpdated",
    updateStudentDatabase
);


/* ==============================
   STORAGE BERUBAH
================================ */

window.addEventListener(
    "storage",
    updateStudentDatabase
);


/* ==============================
   MULAI
================================ */

loadStudentDatabase();

/* ==============================
   __-----
================================ */

function updateAttendanceOverview() {

    const total =
        allStudents.length;

    let present = 0;


    allStudents.forEach(student => {

        const attendance =
            getAttendance(student.nis);

        if (attendance) {
            present++;
        }

    });


    const absent =
        total - present;


    if (overviewTotal) {
        overviewTotal.textContent = total;
    }


    if (presentCount) {
        presentCount.textContent = present;
    }


    if (absentCount) {
        absentCount.textContent = absent;
    }
}