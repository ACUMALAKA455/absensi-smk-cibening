
/* =========================================
   MODE PENGUJIAN
========================================= */

const TEST_MODE = true;

// ================================
// SOUND ABSENSI
// ================================

function playSound(type) {

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = "sine";

    if (type === "success") {
        // Bunyi berhasil: naik
        oscillator.frequency.setValueAtTime(700, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.12);

        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.3
        );

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);

    } else if (type === "error") {
        // Bunyi error: turun
        oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(250, audioContext.currentTime + 0.15);

        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.35
        );

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.35);

    } else if (type === "warning") {
        // Bunyi peringatan: dua beep
        oscillator.frequency.setValueAtTime(
            600,
            audioContext.currentTime
        );

        gainNode.gain.setValueAtTime(
            0.15,
            audioContext.currentTime
        );

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);

        setTimeout(() => {
            const secondContext =
                new (window.AudioContext || window.webkitAudioContext)();

            const secondOscillator =
                secondContext.createOscillator();

            const secondGain =
                secondContext.createGain();

            secondOscillator.connect(secondGain);
            secondGain.connect(secondContext.destination);

            secondOscillator.type = "sine";
            secondOscillator.frequency.value = 600;

            secondGain.gain.setValueAtTime(
                0.15,
                secondContext.currentTime
            );

            secondGain.gain.exponentialRampToValueAtTime(
                0.01,
                secondContext.currentTime + 0.15
            );

            secondOscillator.start();
            secondOscillator.stop(
                secondContext.currentTime + 0.15
            );
        }, 180);
    }
}

/* =========================================
   DATA SISWA
========================================= */

let students = [];
let isProcessingScan = false;

/* =========================================
   ELEMENT HTML
========================================= */

const clock =
    document.getElementById("clock");

const scanButton =
    document.getElementById("scanButton");

const statusText =
    document.getElementById("status");


/* =========================================
   QR SCANNER
========================================= */

let qrScanner = null;
let scannerActive = false;


/* =========================================
   ATURAN ABSENSI
========================================= */

const START_HOUR = 6;
const END_HOUR = 10;


/* =========================================
   JAM ANALOG
========================================= */

function updateClock() {

    const now = new Date();

    const seconds =
        now.getSeconds();

    const milliseconds =
        now.getMilliseconds();

    const minutes =
        now.getMinutes();

    const hours =
        now.getHours();


    const secondAngle =
        (seconds + milliseconds / 1000) * 6;

    const minuteAngle =
        (minutes + seconds / 60) * 6;

    const hourAngle =
        ((hours % 12) + minutes / 60) * 30;


    const secondHand =
        document.querySelector(".second-hand");

    const minuteHand =
        document.querySelector(".minute-hand");

    const hourHand =
        document.querySelector(".hour-hand");


    if (secondHand) {

        secondHand.style.transform =
            `translateX(-50%) rotate(${secondAngle}deg)`;

    }


    if (minuteHand) {

        minuteHand.style.transform =
            `translateX(-50%) rotate(${minuteAngle}deg)`;

    }


    if (hourHand) {

        hourHand.style.transform =
            `translateX(-50%) rotate(${hourAngle}deg)`;

    }

}


updateClock();

setInterval(
    updateClock,
    50
);


/* =========================================
   WAKTU ABSENSI
========================================= */

function checkAttendanceTime() {

    if (TEST_MODE) {

        return {

            allowed: true,

            message:
                "MODE PENGUJIAN AKTIF."

        };

    }


    const now =
        new Date();

    const day =
        now.getDay();


    if (
        day === 0 ||
        day === 6
    ) {

        return {

            allowed: false,

            message:
                "Absensi hanya tersedia Senin sampai Jumat."

        };

    }


    const hour =
        now.getHours();

    const minute =
        now.getMinutes();


    const currentMinutes =
        (hour * 60) + minute;

    const startMinutes =
        START_HOUR * 60;

    const endMinutes =
        END_HOUR * 60;


    if (
        currentMinutes < startMinutes ||
        currentMinutes >= endMinutes
    ) {

        return {

            allowed: false,

            message:
                "Absensi ditutup. Waktu absensi adalah 06:00 sampai 10:00."

        };

    }


    return {

        allowed: true,

        message:
            "Waktu absensi tersedia."

    };

}


/* =========================================
   TANGGAL HARI INI
========================================= */

function getTodayDate() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* =========================================
   KEY ABSENSI
========================================= */

function getAttendanceKey(nis) {
    return `attendance_${getTodayDate()}_${String(nis).trim()}`;
}


/* =========================================
   CEK SUDAH ABSEN
========================================= */

function hasAlreadyAttended(nis) {

    const key = getAttendanceKey(nis);

    const data = localStorage.getItem(key);

    console.log("CEK ABSENSI:", {
        nis: nis,
        key: key,
        data: data
    });

    return data !== null;
}


/* =========================================
   SIMPAN ABSENSI
========================================= */

function saveAttendance(student) {

    const now = new Date();

    const attendance = {

        nis: String(student.nis),
        nama: student.nama,
        kelas: student.kelas,

        status: "HADIR",

        tanggal: now.getDate(),
        bulan: now.getMonth() + 1,
        tahun: now.getFullYear(),

        jam: String(now.getHours()).padStart(2, "0"),
        menit: String(now.getMinutes()).padStart(2, "0"),
        detik: String(now.getSeconds()).padStart(2, "0"),

        waktu:
            `${String(now.getHours()).padStart(2, "0")}:` +
            `${String(now.getMinutes()).padStart(2, "0")}:` +
            `${String(now.getSeconds()).padStart(2, "0")}`
    };


    const key = getAttendanceKey(student.nis);


    console.log("MENYIMPAN ABSENSI:", {
        key: key,
        attendance: attendance
    });


    localStorage.setItem(
        key,
        JSON.stringify(attendance)
    );


    window.dispatchEvent(
        new Event("attendanceUpdated")
    );


    return attendance;
}


/* =========================================
   LOAD DATA SISWA
========================================= */

async function loadStudents() {

    try {

         const response =
         const BASE_PATH = window.location.pathname
             .replace(/\/[^\/]*$/, "/");
      
         const response = await fetch(
                `${BASE_PATH}data/students.json`
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        students =
            await response.json();


        console.log(
            "Data siswa berhasil dimuat:",
            students
        );


        updateStudentTotal();


        statusText.textContent =
            `Data siswa siap. ${students.length} siswa tersedia.`;


    }

    catch (error) {

        console.error(
            "Gagal membaca students.json:",
            error
        );


        statusText.textContent =
            "❌ Gagal memuat data siswa.";

    }

}


/* =========================================
   TOTAL SISWA
========================================= */

function updateStudentTotal() {

    const total =
        students.length;


    const totalStudents =
        document.getElementById(
            "totalStudents"
        );


    const overviewTotal =
        document.getElementById(
            "overviewTotal"
        );


    if (totalStudents) {

        totalStudents.textContent =
            total;

    }


    if (overviewTotal) {

        overviewTotal.textContent =
            total;

    }

}


/* =========================================
   CARI SISWA
========================================= */

function findStudentByNIS(nis) {

    return students.find(

        student =>

            String(student.nis) ===
            String(nis)

    );

}


function showScanResult(type, student, attendance) {

    const hasil = document.getElementById("hasilAbsensi");

    if (!hasil) return;


    /* =====================================
       ABSENSI BERHASIL
    ===================================== */
    if (type === "success") {

    if (!attendance) {
        console.error("Data attendance tidak tersedia.");
        return;
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


    const formattedDate =
        `${attendance.tanggal} ` +
        `${monthNames[attendance.bulan - 1]} ` +
        `${attendance.tahun}`;


    hasil.innerHTML = `

        <div class="scan-success-animation">

            <div class="scan-success-icon">
                ✓
            </div>

            <h4 class="scan-success-title">
                ABSENSI BERHASIL
            </h4>

            <p class="scan-success-subtitle">
                Kehadiran berhasil dicatat.
            </p>


            <div class="scan-student-info">

                <div class="scan-student-row">
                    <span class="scan-student-label">
                        NAMA
                    </span>

                    <span class="scan-student-value primary">
                        ${escapeHTML(student.nama)}
                    </span>
                </div>


                <div class="scan-student-row">
                    <span class="scan-student-label">
                        NIS
                    </span>

                    <span class="scan-student-value">
                        ${escapeHTML(student.nis)}
                    </span>
                </div>


                <div class="scan-student-row">
                    <span class="scan-student-label">
                        KELAS
                    </span>

                    <span class="scan-student-value">
                        ${escapeHTML(student.kelas)}
                    </span>
                </div>


                <div class="scan-student-row">
                    <span class="scan-student-label">
                        TANGGAL
                    </span>

                    <span class="scan-student-value">
                        ${formattedDate}
                    </span>
                </div>


                <div class="scan-student-row">
                    <span class="scan-student-label">
                        JAM
                    </span>

                    <span class="scan-student-value primary">
                        ${attendance.waktu}
                    </span>
                </div>

            </div>


            <div class="scan-attendance-status">

                <span>✓</span>

                <span>
                    HADIR • ${attendance.waktu}
                </span>

            </div>

        </div>

    `;

    return;
}



    /* =====================================
       SUDAH ABSEN
    ===================================== */

    if (type === "duplicate") {

        hasil.innerHTML = `

            <div class="scan-duplicate-animation">

                <div class="scan-duplicate-icon">
                    !
                </div>

                <h4 class="scan-success-title"
                    style="color:#c2410c;">
                    SUDAH ABSEN
                </h4>

                <p class="scan-success-subtitle">
                    Siswa ini sudah melakukan absensi hari ini.
                </p>


                <div class="scan-student-info">

                    <div class="scan-student-row">

                        <span class="scan-student-label">
                            NAMA
                        </span>

                        <span class="scan-student-value primary">
                            ${escapeHTML(student.nama)}
                        </span>

                    </div>


                    <div class="scan-student-row">

                        <span class="scan-student-label">
                            NIS
                        </span>

                        <span class="scan-student-value">
                            ${escapeHTML(student.nis)}
                        </span>

                    </div>


                    <div class="scan-student-row">

                        <span class="scan-student-label">
                            KELAS
                        </span>

                        <span class="scan-student-value">
                            ${escapeHTML(student.kelas)}
                        </span>

                    </div>

                </div>

            </div>

        `;

        return;
    }


    /* =====================================
       SISWA TIDAK DITEMUKAN
    ===================================== */

    if (type === "notfound") {

        hasil.innerHTML = `

            <div class="scan-error-animation">

                <div class="scan-error-icon">
                    ×
                </div>

                <h4 class="scan-success-title"
                    style="color:#dc2626;">
                    SISWA TIDAK DITEMUKAN
                </h4>

                <p class="scan-success-subtitle">
                    NIS
                    <strong>${escapeHTML(extra || "")}</strong>
                    tidak terdaftar.
                </p>

            </div>

        `;

        return;
    }


    /* =====================================
       ABSENSI DITUTUP
    ===================================== */

    if (type === "closed") {

        hasil.innerHTML = `

            <div class="scan-error-animation">

                <div class="scan-error-icon">
                    ×
                </div>

                <h4 class="scan-success-title"
                    style="color:#dc2626;">
                    ABSENSI DITUTUP
                </h4>

                <p class="scan-success-subtitle">
                    Waktu absensi belum dibuka
                    atau sudah berakhir.
                </p>

            </div>

        `;

        return;
    }

}


/* =========================================
   QR BERHASIL TERBACA
========================================= */

async function handleQrResult(decodedText) {

    // Abaikan QR jika sedang memproses scan sebelumnya
    if (isProcessingScan) {
        return;
    }

    // Kunci scanner SEBELUM melakukan proses apa pun
    isProcessingScan = true;


    try {

        const nis = String(decodedText).trim();

        console.log("QR TERBACA:", nis);


        // ==============================
        // CEK WAKTU ABSENSI
        // ==============================

        if (!checkAttendanceTime()) {

            showScanResult("closed");

            await stopScanner();

            return;
        }


        // ==============================
        // CARI SISWA
        // ==============================

        const student = findStudentByNIS(nis);


        if (!student) {
            playSound("warning");

            showScanResult("notfound", null, nis);

            await stopScanner();
            return;
        }


        // ==============================
        // CEK SUDAH ABSEN ATAU BELUM
        // ==============================

        if (hasAlreadyAttended(student.nis)) {
            playSound("error");

            showScanResult("duplicate", student);

            await stopScanner();
            return;
        }


        // ==============================
        // SIMPAN ABSENSI
        // ==============================

        const attendance =
            saveAttendance(student);

        playSound("success");

        // ==============================
        // TAMPILKAN HASIL
        // ==============================

        showScanResult(
            "success",
            student,
            attendance
        );


        // Matikan scanner setelah berhasil
        await stopScanner();


    } catch (error) {

        console.error(
            "Kesalahan saat memproses QR:",
            error
        );

    } finally {

        // Jangan langsung membuka lock.
        // Beri sedikit jeda agar kamera tidak
        // membaca QR yang sama lagi.

        setTimeout(() => {
            isProcessingScan = false;
        }, 1000);
    }
}


/* =========================================
   MULAI SCANNER
========================================= */

async function startScanner() {

    isProcessingScan = false;
    
    const timeCheck =
        checkAttendanceTime();


    if (!timeCheck.allowed) {

        showScanResult(
            "closed",
            null,
            {
                message:
                    timeCheck.message
            }
        );


        return;
    }


    try {

        qrScanner =
            new Html5Qrcode(
                "qr-reader"
            );


        await qrScanner.start(

            {
                facingMode:
                    "environment"
            },

            {
                fps: 10,

                qrbox: {
                    width: 250,
                    height: 250
                }

            },

            handleQrResult,

            function () {

                // Scanner sedang mencari QR

            }

        );


        scannerActive = true;


        scanButton.innerHTML = `

            <span>⛔</span>

            <span>
                STOP SCAN
            </span>

        `;


        const scannerStatus =
            document.querySelector(
                ".scanner-status"
            );


        if (scannerStatus) {

            scannerStatus.textContent =
                "SCANNING";

            scannerStatus.style.background =
                "#e3f8ed";

            scannerStatus.style.color =
                "#159257";

        }


        statusText.textContent =
            "📷 Kamera aktif. Arahkan kamera ke QR siswa.";


        console.log(
            "Scanner QR aktif."
        );

    }


    catch (error) {

        console.error(
            "Scanner gagal:",
            error
        );


        qrScanner = null;

        scannerActive = false;


        statusText.textContent =
            "❌ Kamera gagal dibuka. Periksa izin kamera.";

    }

}


/* =========================================
   STOP SCANNER
========================================= */

async function stopScanner() {

    if (!qrScanner) {
        return;
    }


    try {

        await qrScanner.stop();

        qrScanner.clear();

    }


    catch (error) {

        console.error(
            "Gagal menghentikan scanner:",
            error
        );

    }


    qrScanner = null;

    scannerActive = false;


    scanButton.innerHTML = `

        <span>📷</span>

        <span>
            SCAN QR
        </span>

    `;


    const scannerStatus =
        document.querySelector(
            ".scanner-status"
        );


    if (scannerStatus) {

        scannerStatus.textContent =
            "READY";

        scannerStatus.style.background =
            "#e7f5ff";

        scannerStatus.style.color =
            "#1775b7";

    }

}


/* =========================================
   TOMBOL SCAN
========================================= */

scanButton.addEventListener(

    "click",

    async function () {

        if (scannerActive) {

            await stopScanner();


            statusText.textContent =
                `Data siswa siap. ${students.length} siswa tersedia.`;

        }

        else {

            await startScanner();

        }

    }

);


/* =========================================
   MULAI PROGRAM
========================================= */

async function initialize() {

    await loadStudents();

}


initialize();


/* =========================================
   SAAT HALAMAN DITUTUP
========================================= */

window.addEventListener(

    "beforeunload",

    function () {

        if (qrScanner) {

            qrScanner
                .stop()
                .catch(
                    function () {}
                );

        }

    }

);
function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}
