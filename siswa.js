/*******************************************************
 * ABSENSI SISWA
 *******************************************************/

let sessionId = '';
let currentSession = null;


/* =====================================================
   INIT
===================================================== */

document.addEventListener(
  'DOMContentLoaded',
  initStudent
);


async function initStudent() {

  sessionId =
    getSessionIdFromUrl();


  if (!sessionId) {

    showInvalidSession(
      'QR Code tidak membawa informasi sesi absensi.'
    );

    return;
  }


  try {

    showLoading(
      'Memeriksa sesi absensi...'
    );


    currentSession =
      await apiGet(
        'getSession',
        {
          sessionId:
            sessionId
        }
      );


    renderSession();


    if (
      String(currentSession.status)
        .toUpperCase() !== 'ACTIVE'
    ) {

      showInvalidSession(
        'Sesi absensi sudah ditutup atau tidak valid.'
      );

      return;
    }


    await loadStudents();


  } catch (error) {

    showInvalidSession(
      error.message ||
      'Sesi tidak dapat ditemukan.'
    );

  } finally {

    hideLoading();

  }


  document
    .getElementById(
      'studentAttendBtn'
    )
    .addEventListener(
      'click',
      submitAttendance
    );

}


/* =====================================================
   SESSION ID
===================================================== */

function getSessionIdFromUrl() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  return (
    params.get('session') ||
    ''
  ).trim();

}


/* =====================================================
   RENDER SESSION
===================================================== */

function renderSession() {

  document.getElementById(
    'sessionClass'
  ).textContent =
    currentSession.className;


  document.getElementById(
    'sessionTeacher'
  ).textContent =
    'Guru: ' +
    currentSession.teacherName;


  document.getElementById(
    'classDisplay'
  ).value =
    currentSession.className;


  const status =
    document.getElementById(
      'sessionStatus'
    );


  if (
    String(currentSession.status)
      .toUpperCase() === 'ACTIVE'
  ) {

    status.textContent =
      'Sesi aktif. Silakan pilih nama Anda.';

  } else {

    status.textContent =
      'Sesi sudah ditutup.';

  }

}


/* =====================================================
   LOAD STUDENTS
===================================================== */

async function loadStudents() {

  const students =
    await apiGet(
      'getStudentsByClass',
      {
        classId:
          currentSession.classId
      }
    );


  const select =
    document.getElementById(
      'studentSelect'
    );


  select.innerHTML =
    '<option value="">Pilih nama Anda</option>';


  students.forEach(function(student) {

    const option =
      document.createElement(
        'option'
      );


    option.value =
      student.id;


    option.textContent =
      student.name;


    select.appendChild(
      option
    );

  });


  document
    .getElementById(
      'attendanceSection'
    )
    .classList.remove(
      'hidden'
    );

}


/* =====================================================
   SUBMIT ATTENDANCE
===================================================== */

async function submitAttendance() {

  const studentId =
    document.getElementById(
      'studentSelect'
    ).value;


  if (!studentId) {

    showMessage(
      'Silakan pilih nama Anda.'
    );

    return;
  }


  const confirmed =
    confirm(
      'Pastikan nama yang dipilih adalah nama Anda sendiri.\n\n' +
      'Lanjutkan absensi?'
    );


  if (!confirmed) {
    return;
  }


  try {

    showLoading(
      'Mencatat absensi...'
    );


    const result =
      await apiPost(
        'submitStudentAttendance',
        {
          sessionId:
            sessionId,

          studentId:
            studentId
        }
      );


    showResult(
      result
    );


  } catch (error) {

    showMessage(
      error.message ||
      'Absensi gagal.'
    );

  } finally {

    hideLoading();

  }

}


/* =====================================================
   RESULT
===================================================== */

function showResult(result) {

  document
    .getElementById(
      'attendanceSection'
    )
    .classList.add(
      'hidden'
    );


  document
    .getElementById(
      'resultSection'
    )
    .classList.remove(
      'hidden'
    );


  document.getElementById(
    'resultTitle'
  ).textContent =
    'Absensi Berhasil';


  document.getElementById(
    'resultMessage'
  ).textContent =
    result.studentName +
    ' — ' +
    result.checkInTime;


  document.getElementById(
    'resultStatus'
  ).textContent =
    result.status;


  const statusElement =
    document.getElementById(
      'resultStatus'
    );


  if (result.status === 'TERLAMBAT') {

    statusElement.style.background =
      '#fef3c7';

    statusElement.style.color =
      '#92400e';

  } else {

    statusElement.style.background =
      '#dcfce7';

    statusElement.style.color =
      '#166534';

  }

}


/* =====================================================
   INVALID
===================================================== */

function showInvalidSession(message) {

  document
    .getElementById(
      'attendanceSection'
    )
    .classList.add(
      'hidden'
    );


  document
    .getElementById(
      'invalidSection'
    )
    .classList.remove(
      'hidden'
    );


  document.getElementById(
    'invalidMessage'
  ).textContent =
    message;

}
