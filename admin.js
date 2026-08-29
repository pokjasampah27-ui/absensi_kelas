/*******************************************************
 * ADMIN / GURU
 *******************************************************/

let currentSession = null;
let refreshTimer = null;


/* =====================================================
   INIT
===================================================== */

document.addEventListener(
  'DOMContentLoaded',
  initAdmin
);


async function initAdmin() {

  try {

    showLoading('Memuat data...');

    await Promise.all([
      loadTeachers(),
      loadClasses()
    ]);

  } catch (error) {

    showMessage(
      error.message ||
      'Gagal memuat data.'
    );

  } finally {

    hideLoading();

  }


  document
    .getElementById('startSessionBtn')
    .addEventListener(
      'click',
      startSession
    );


  document
    .getElementById('refreshBtn')
    .addEventListener(
      'click',
      refreshDashboard
    );


  document
    .getElementById('closeSessionBtn')
    .addEventListener(
      'click',
      closeSession
    );


  document
    .getElementById('manualSaveBtn')
    .addEventListener(
      'click',
      saveManualAttendance
    );

}


/* =====================================================
   LOAD TEACHERS
===================================================== */

async function loadTeachers() {

  const select =
    document.getElementById(
      'teacherSelect'
    );


  const teachers =
    await apiGet('getTeachers');


  select.innerHTML =
    '<option value="">Pilih nama guru</option>';


  teachers.forEach(function(teacher) {

    const option =
      document.createElement('option');

    option.value = teacher.id;

    option.textContent = teacher.name;

    select.appendChild(option);

  });

}


/* =====================================================
   LOAD CLASSES
===================================================== */

async function loadClasses() {

  const select =
    document.getElementById(
      'classSelect'
    );


  const classes =
    await apiGet('getClasses');


  select.innerHTML =
    '<option value="">Pilih kelas</option>';


  classes.forEach(function(item) {

    const option =
      document.createElement('option');

    option.value = item.id;

    option.textContent = item.name;

    select.appendChild(option);

  });

}


/* =====================================================
   CREATE SESSION
===================================================== */

async function startSession() {

  const teacherId =
    document.getElementById(
      'teacherSelect'
    ).value;


  const classId =
    document.getElementById(
      'classSelect'
    ).value;


  if (!teacherId) {

    showMessage(
      'Silakan pilih nama guru.'
    );

    return;
  }


  if (!classId) {

    showMessage(
      'Silakan pilih kelas.'
    );

    return;
  }


  const confirmed =
    confirm(
      'Mulai absensi untuk kelas ini?'
    );


  if (!confirmed) {
    return;
  }


  try {

    showLoading(
      'Membuat sesi absensi...'
    );


    const session =
      await apiPost(
        'createSession',
        {
          teacherId: teacherId,
          classId: classId
        }
      );


    currentSession = session;


    renderSession();

    showDashboard();


    await refreshDashboard();


    startAutoRefresh();


  } catch (error) {

    showMessage(
      error.message ||
      'Gagal membuat sesi.'
    );

  } finally {

    hideLoading();

  }

}


/* =====================================================
   RENDER SESSION
===================================================== */

function renderSession() {

  if (!currentSession) {
    return;
  }


  document.getElementById(
    'dashboardClass'
  ).textContent =
    currentSession.className;


  document.getElementById(
    'dashboardTeacher'
  ).textContent =
    'Guru: ' +
    currentSession.teacherName;


  document.getElementById(
    'dashboardStart'
  ).textContent =
    'Mulai: ' +
    currentSession.startTime;


  const qrContainer =
    document.getElementById(
      'qrcode'
    );


  qrContainer.innerHTML = '';


  /*
   * URL siswa:
   * siswa.html?session=SESSION_ID
   */

  const studentUrl =
    buildStudentUrl(
      currentSession.sessionId
    );


  new QRCode(qrContainer, {

    text: studentUrl,

    width: 250,

    height: 250,

    correctLevel:
      QRCode.CorrectLevel.H

  });


  document.getElementById(
    'studentUrl'
  ).textContent =
    studentUrl;

}


/* =====================================================
   BUILD STUDENT URL
===================================================== */

function buildStudentUrl(sessionId) {

  const url =
    new URL(
      'siswa.html',
      window.location.href
    );


  url.searchParams.set(
    'session',
    sessionId
  );


  return url.href;
}


/* =====================================================
   SHOW DASHBOARD
===================================================== */

function showDashboard() {

  document
    .getElementById(
      'setupSection'
    )
    .classList.add('hidden');


  document
    .getElementById(
      'dashboardSection'
    )
    .classList.remove('hidden');

}


/* =====================================================
   REFRESH
===================================================== */

async function refreshDashboard() {

  if (!currentSession) {
    return;
  }


  try {

    const data =
      await apiGet(
        'getSessionAttendance',
        {
          sessionId:
            currentSession.sessionId
        }
      );


    renderCounts(
      data.counts
    );


    renderAttendanceTable(
      data.students
    );


    renderManualList(
      data.students
    );


  } catch (error) {

    showMessage(
      error.message ||
      'Gagal memperbarui data.'
    );

  }

}


/* =====================================================
   COUNTS
===================================================== */

function renderCounts(counts) {

  document.getElementById(
    'totalCount'
  ).textContent =
    counts.total;


  document.getElementById(
    'hadirCount'
  ).textContent =
    counts.hadir;


  document.getElementById(
    'lateCount'
  ).textContent =
    counts.terlambat;


  document.getElementById(
    'sickCount'
  ).textContent =
    counts.sakit;


  document.getElementById(
    'permitCount'
  ).textContent =
    counts.izin;


  document.getElementById(
    'alpaCount'
  ).textContent =
    counts.alpa;


  document.getElementById(
    'belumCount'
  ).textContent =
    counts.belum;

}


/* =====================================================
   ATTENDANCE TABLE
===================================================== */

function renderAttendanceTable(students) {

  const tbody =
    document.getElementById(
      'attendanceTableBody'
    );


  if (!students.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          Tidak ada data siswa.
        </td>
      </tr>
    `;

    return;
  }


  tbody.innerHTML =
    students.map(function(student, index) {

      const recordedBy =
        student.recordedBy === 'STUDENT'
          ? 'Siswa'
          : student.recordedBy === 'TEACHER'
            ? 'Guru'
            : '-';


      return `
        <tr>

          <td>
            ${index + 1}
          </td>

          <td>
            <strong>
              ${escapeHtml(student.name)}
            </strong>
          </td>

          <td>
            ${escapeHtml(student.nis)}
          </td>

          <td>
            ${statusBadge(student.status)}
          </td>

          <td>
            ${escapeHtml(
              student.checkInTime || '-'
            )}
          </td>

          <td>
            ${escapeHtml(recordedBy)}
          </td>

        </tr>
      `;

    }).join('');

}


/* =====================================================
   MANUAL LIST
===================================================== */

function renderManualList(students) {

  const container =
    document.getElementById(
      'manualStudents'
    );


  const notPresent =
    students.filter(function(student) {

      return (
        student.status ===
        'BELUM ABSEN'
      );

    });


  if (!notPresent.length) {

    container.innerHTML = `
      <div class="empty-state">
        Semua siswa sudah memiliki status.
      </div>
    `;

    return;
  }


  container.innerHTML =
    notPresent.map(function(student) {

      return `
        <label class="manual-item">

          <input
            type="checkbox"
            value="${escapeHtml(student.studentId)}"
            data-name="${escapeHtml(student.name)}"
          >

          <span>
            ${escapeHtml(student.name)}
          </span>

        </label>
      `;

    }).join('');

}


/* =====================================================
   MANUAL SAVE
===================================================== */

async function saveManualAttendance() {

  if (!currentSession) {
    return;
  }


  const checkboxes =
    document.querySelectorAll(
      '#manualStudents input[type="checkbox"]:checked'
    );


  const studentIds =
    Array.from(checkboxes)
      .map(function(input) {
        return input.value;
      });


  if (!studentIds.length) {

    showMessage(
      'Pilih minimal satu siswa.'
    );

    return;
  }


  const status =
    document.getElementById(
      'manualStatus'
    ).value;


  try {

    showLoading(
      'Menyimpan status...'
    );


    let result =
      await apiPost(
        'submitManualAttendance',
        {
          sessionId:
            currentSession.sessionId,

          studentIds:
            studentIds,

          status:
            status,

          confirmed:
            false
        }
      );


    /*
     * Server meminta konfirmasi karena
     * ada siswa yang sudah HADIR/TERLAMBAT.
     */
    if (result.requiresConfirmation) {

      const names =
        result.records
          .map(function(item) {
            return item.studentName;
          })
          .join(', ');


      const confirmed =
        confirm(
          'Siswa berikut sudah tercatat HADIR/TERLAMBAT:\n\n' +
          names +
          '\n\n' +
          'Apakah Anda yakin ingin mengubah status menjadi ' +
          status +
          '?'
        );


      if (!confirmed) {

        hideLoading();

        return;
      }


      result =
        await apiPost(
          'submitManualAttendance',
          {
            sessionId:
              currentSession.sessionId,

            studentIds:
              studentIds,

            status:
              status,

            confirmed:
              true
          }
        );

    }


    showMessage(
      'Status ' +
      status +
      ' berhasil disimpan.'
    );


    await refreshDashboard();


  } catch (error) {

    showMessage(
      error.message ||
      'Gagal menyimpan status.'
    );

  } finally {

    hideLoading();

  }

}


/* =====================================================
   CLOSE SESSION
===================================================== */

async function closeSession() {

  if (!currentSession) {
    return;
  }


  const confirmed =
    confirm(
      'Tutup sesi absensi sekarang?\n\n' +
      'Setelah ditutup, siswa tidak dapat melakukan absensi baru.'
    );


  if (!confirmed) {
    return;
  }


  try {

    showLoading(
      'Menutup sesi...'
    );


    await apiPost(
      'closeSession',
      {
        sessionId:
          currentSession.sessionId
      }
    );


    stopAutoRefresh();


    await refreshDashboard();


    showMessage(
      'Sesi berhasil ditutup.'
    );


    const button =
      document.getElementById(
        'closeSessionBtn'
      );


    button.disabled = true;

    button.textContent =
      'Sesi Ditutup';


  } catch (error) {

    showMessage(
      error.message ||
      'Gagal menutup sesi.'
    );

  } finally {

    hideLoading();

  }

}


/* =====================================================
   AUTO REFRESH
===================================================== */

function startAutoRefresh() {

  stopAutoRefresh();


  /*
   * Refresh setiap 5 detik.
   */
  refreshTimer =
    setInterval(
      refreshDashboard,
      5000
    );

}


function stopAutoRefresh() {

  if (refreshTimer) {

    clearInterval(
      refreshTimer
    );

    refreshTimer = null;

  }

}
