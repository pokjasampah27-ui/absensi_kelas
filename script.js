/*******************************************************
 * CONFIGURATION
 *******************************************************/

const CONFIG = {

  /*
   * ====================================================
   * MASUKKAN URL WEB APP GOOGLE APPS SCRIPT DI SINI
   * ====================================================
   *
   * Contoh:
   *
   * API_URL:
   * "https://script.google.com/macros/s/XXXXXXXX/exec"
   *
   */

  API_URL:
    "PASTE_URL_WEB_APP_GOOGLE_APPS_SCRIPT_DI_SINI"

};


/* =====================================================
   API GET
===================================================== */

async function apiGet(action, params = {}) {

  if (
    !CONFIG.API_URL ||
    CONFIG.API_URL.includes('PASTE_URL')
  ) {

    throw new Error(
      'API_URL belum dikonfigurasi pada script.js.'
    );

  }

  const query = new URLSearchParams();

  query.set('action', action);

  Object.keys(params).forEach(function(key) {

    if (
      params[key] !== undefined &&
      params[key] !== null
    ) {

      query.set(key, params[key]);

    }

  });


  const url =
    CONFIG.API_URL +
    '?' +
    query.toString();


  const response =
    await fetch(url, {
      method: 'GET',
      cache: 'no-store'
    });


  if (!response.ok) {
    throw new Error(
      'Server API tidak dapat diakses.'
    );
  }


  const result =
    await response.json();


  if (!result.success) {
    throw new Error(
      result.message ||
      'API gagal diproses.'
    );
  }


  return result.data;
}


/* =====================================================
   API POST
===================================================== */

async function apiPost(action, data = {}) {

  if (
    !CONFIG.API_URL ||
    CONFIG.API_URL.includes('PASTE_URL')
  ) {

    throw new Error(
      'API_URL belum dikonfigurasi pada script.js.'
    );

  }


  const payload = Object.assign(
    {},
    data,
    {
      action: action
    }
  );


  const response =
    await fetch(CONFIG.API_URL, {

      method: 'POST',

      headers: {
        'Content-Type':
          'text/plain;charset=utf-8'
      },

      body: JSON.stringify(payload)

    });


  if (!response.ok) {
    throw new Error(
      'Server API tidak dapat diakses.'
    );
  }


  const result =
    await response.json();


  if (!result.success) {
    throw new Error(
      result.message ||
      'API gagal diproses.'
    );
  }


  return result.data;
}


/* =====================================================
   UI
===================================================== */

function showLoading(message = 'Memproses...') {

  const overlay =
    document.getElementById('loadingOverlay');

  const text =
    document.getElementById('loadingText');


  if (text) {
    text.textContent = message;
  }

  if (overlay) {
    overlay.classList.remove('hidden');
  }
}


function hideLoading() {

  const overlay =
    document.getElementById('loadingOverlay');

  if (overlay) {
    overlay.classList.add('hidden');
  }
}


function showMessage(message, duration = 4500) {

  const box =
    document.getElementById('messageBox');

  if (!box) {
    alert(message);
    return;
  }

  box.textContent = message;

  box.classList.remove('hidden');


  clearTimeout(
    window.__messageTimer
  );


  window.__messageTimer =
    setTimeout(function() {

      box.classList.add('hidden');

    }, duration);
}


/* =====================================================
   STATUS BADGE
===================================================== */

function statusBadge(status) {

  const value =
    String(status || '').toUpperCase();

  const classMap = {

    'HADIR': 'badge-hadir',

    'TERLAMBAT':
      'badge-terlambat',

    'SAKIT':
      'badge-sakit',

    'IZIN':
      'badge-izin',

    'ALPA':
      'badge-alpa',

    'BELUM ABSEN':
      'badge-belum'

  };


  const cls =
    classMap[value] ||
    'badge-belum';


  return `
    <span class="badge ${cls}">
      ${escapeHtml(value)}
    </span>
  `;
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(value) {

  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}


/* =====================================================
   DATE DISPLAY
===================================================== */

function formatDisplayDate(value) {

  if (!value) {
    return '-';
  }

  return String(value);
}
