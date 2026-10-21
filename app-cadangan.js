/* =====================================================================
   CADANGKAN DATA - Menyelamatkan pekerjaan guru dari kehilangan data.

   Semua data ADIK tersimpan di localStorage browser ini: daftar asesmen,
   bank soal, nama murid, dan riwayat jawaban yang sudah ditarik. Data itu
   dapat hilang karena:
     - tombol "hapus riwayat/cache" di browser,
     - mode penjelajahan privat (incognito),
     - ganti komputer atau ganti browser,
     - kuota penyimpanan browser penuh.
   Halaman ini menyediakan:
     1. Unduh cadangan (satu berkas .json berisi seluruh data).
     2. Pulihkan dari berkas cadangan.
     3. Salin/tempel cadangan lewat teks (untuk memindahkan ke HP).
     4. Hapus data bila memang ingin mulai dari kosong.
   ===================================================================== */

var LS_PROFIL_KEY = "adik_profil_v1";
var LS_PROFIL_FORM_KEY = "adik_profil_form_v1";
var CADANGAN_FORMAT = "adik-cadangan";
var CADANGAN_VERSI = 1;
var CADANGAN_LS_KEYS = [
  LS.assessments, LS.bank, LS.school, LS.sync, LS_PROFIL_KEY, LS_PROFIL_FORM_KEY
];
var CADANGAN_OPSIONAL_KEYS = [LS.draft];
/* Catatan: LS.api (berisi API key rahasia) sengaja TIDAK ikut dicadangkan. */

function cadanganIsi() {
  var ls = {};
  CADANGAN_LS_KEYS.forEach(function (k) {
    var v = null;
    try { v = localStorage.getItem(k); } catch (e) { v = null; }
    if (v != null) ls[k] = v;
  });
  var data = {
    format: CADANGAN_FORMAT,
    versi: CADANGAN_VERSI,
    build: typeof APP_BUILD === "string" ? APP_BUILD : "",
    aplikasi: "ADIK",
    dibuatPada: new Date().toISOString(),
    jumlah: {
      asesmen: assessments.length,
      soalBank: bank.length,
      murid: (typeof profil !== "undefined" && profil) ? profil.length : 0,
      hasil: state.rekap.pulled.length
    },
    local: ls
  };
  return data;
}

function cadanganText() { return JSON.stringify(cadanganIsi()); }

function cadanganNamaFile() {
  var d = new Date();
  var t = ("0" + d.getDate()).slice(-2) + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + d.getFullYear();
  var j = ("0" + d.getHours()).slice(-2) + ("0" + d.getMinutes()).slice(-2);
  return "Cadangan ADIK " + t + " " + j + ".json";
}

function cadanganRingkas(data) {
  return (data.jumlah && typeof data.jumlah.asesmen === "number")
    ? data.jumlah
    : { asesmen: 0, soalBank: 0, murid: 0, hasil: 0 };
}

function renderCadangan() {
  var data = cadanganIsi();
  var j = data.jumlah;
  var h = "";
  h += '<div class="note note-warn mb-16">' + ICON.alert +
    "<div><strong>Data Anda hanya ada di browser ini</strong>ADIK tidak memakai server. Bila data browser dibersihkan (hapus riwayat, mode penjelajahan privat, ganti komputer, atau kuota penuh), asesmen, bank soal, dan profil murid dapat hilang. Unduh cadangan secara berkala.</div></div>";

  h += '<div class="grid grid-4 mb-16">';
  h += statCard("si-blue", ICON.files, assessments.length, "Asesmen Tersimpan");
  h += statCard("si-violet", ICON.book, bank.length, "Soal di Bank Soal");
  h += statCard("si-green", ICON.users, j.murid, "Profil Murid");
  h += statCard("si-amber", ICON.chart, state.rekap.pulled.length, "Hasil Siswa (sementara)");
  h += "</div>";

  h += '<div class="grid grid-2">';

  /* ---- Unduh ---- */
  h += '<div class="card card-pad">';
  h += '<div class="card-head"><div><h3>Unduh Cadangan</h3><p>Simpan seluruh data ke satu berkas</p></div></div>';
  h += '<p class="mode-sub">Berkas cadangan berisi asesmen, bank soal, profil murid, pengaturan sekolah, dan endpoint Rekap Nilai. Simpan di Google Drive, flashdisk, atau kirim ke diri sendiri lewat WhatsApp.</p>';
  h += '<div class="note note-info mt-16">' + ICON.info +
    "<div><strong>Kunci API tidak ikut dicadangkan</strong>Demi keamanan, API key Gemini tidak dimasukkan ke berkas cadangan. Setelah memulihkan data, isi ulang API key di menu <b>Pengaturan API</b> bila diperlukan.</div></div>";
  h += '<div class="q-actions mt-16">' +
    '<button class="btn btn-primary" data-action="cadanganUnduh">' + ICON.download + " Unduh Berkas Cadangan</button>" +
    '<button class="btn btn-light" data-action="cadanganSalin">' + ICON.copy + " Salin sebagai Teks</button>" +
    "</div>";
  h += '<div class="hint mt-16">Ukuran isi saat ini sekitar <b>' +
    Math.max(1, Math.round(cadanganText().length / 1024)).toLocaleString("id-ID") + " KB</b>. Dibuat pada " +
    fmtDateTime(data.dibuatPada) + ".</div>";
  h += "</div>";

  /* ---- Pulihkan ---- */
  h += '<div class="card card-pad">';
  h += '<div class="card-head"><div><h3>Pulihkan dari Cadangan</h3><p>Kembalikan data dari berkas .json</p></div></div>';
  h += '<div class="note note-error mb-16">' + ICON.alert +
    "<div><strong>Pemulihan menimpa data sekarang</strong>Asesmen dan bank soal yang sedang ada akan digantikan oleh isi berkas cadangan. Unduh cadangan data sekarang dulu bila belum yakin.</div></div>";
  h += '<div class="field"><label>Berkas cadangan (.json)</label><input type="file" id="cadanganFile" accept=".json,application/json"></div>';
  h += '<div class="field mt-16"><label>Atau tempel teks cadangan</label><textarea id="cadanganPaste" style="min-height:110px;font-size:11px" placeholder="Tempel isi berkas cadangan di sini..."></textarea></div>';
  h += '<div class="q-actions mt-16">' +
    '<button class="btn btn-primary" data-action="cadanganPulihkan">' + ICON.upload + " Pulihkan Data</button>" +
    '<button class="btn btn-light" data-action="cadanganPeriksa">' + ICON.eye + " Periksa Isi Cadangan</button>" +
    "</div>";
  h += "</div>";
  h += "</div>";

  /* ---- Bersihkan ---- */
  h += '<div class="card card-pad mt-24">';
  h += '<div class="card-head"><div><h3>Bersihkan Data</h3><p>Hapus data di browser ini</p></div></div>';
  h += '<p class="mode-sub">Gunakan bila ingin memulai dari kosong, atau setelah memindahkan data ke komputer lain. Pastikan cadangan sudah diunduh.</p>';
  h += '<div class="q-actions" style="margin-top:6px">' +
    '<button class="btn btn-light" data-action="cadanganHapusHasil">' + ICON.trash + " Hapus Hasil Siswa (Rekap)</button>" +
    '<button class="btn btn-danger" data-action="cadanganHapusSemua">' + ICON.trash + " Hapus Seluruh Data</button>" +
    "</div>";
  h += "</div>";

  return h;
}

function cadanganUnduh() {
  var data = cadanganIsi();
  downloadBlob(new Blob([JSON.stringify(data, null, 1)], { type: "application/json" }), cadanganNamaFile());
  toast("success", "Cadangan diunduh", "Simpan berkas ini di tempat yang aman.");
}

function cadanganSalin() {
  var txt = cadanganText();
  try {
    var el = document.createElement("textarea");
    el.value = txt;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  } catch (e) { }
  if (navigator.clipboard) navigator.clipboard.writeText(txt);
  toast("success", "Cadangan disalin", "Tempel di catatan/email bila ingin memindahkan ke perangkat lain.");
}

function cadanganAmbilTeks() {
  var el = document.getElementById("cadanganPaste");
  var txt = el ? String(el.value || "").trim() : "";
  if (!txt) { toast("warn", "Teks masih kosong", "Tempel isi cadangan atau pilih berkas dulu."); return null; }
  var data = null;
  try { data = JSON.parse(txt); } catch (e) { data = null; }
  if (!data) { toast("error", "Teks tidak dapat dibaca", "Pastikan seluruh isi berkas cadangan tersalin."); return null; }
  if (data.format !== CADANGAN_FORMAT) { toast("error", "Bukan berkas cadangan ADIK", "Berkas ini tidak dikenali."); return null; }
  return data;
}

function cadanganTerapkan(data) {
  var ls = data && data.local ? data.local : {};
  var keys = Object.keys(ls);
  if (!keys.length) { toast("warn", "Cadangan kosong", "Tidak ada data yang bisa dipulihkan."); return; }
  var r = cadanganRingkas(data);
  CADANGAN_LS_KEYS.concat(CADANGAN_OPSIONAL_KEYS).forEach(function (k) {
    try {
      if (ls[k] != null) localStorage.setItem(k, ls[k]);
      else localStorage.removeItem(k);
    } catch (e) { }
  });
  closeModal();
  toast("success", "Data dipulihkan",
    r.asesmen + " asesmen, " + r.soalBank + " soal bank, " + r.murid + " profil murid dimuat. Halaman akan dimuat ulang.");
  setTimeout(function () { location.reload(); }, 1200);
}

function cadanganPulihkan() {
  var el = document.getElementById("cadanganFile");
  if (el && el.files && el.files[0]) {
    var reader = new FileReader();
    reader.onload = function () {
      var data = null;
      try { data = JSON.parse(String(reader.result || "")); } catch (e) { data = null; }
      if (!data || data.format !== CADANGAN_FORMAT) { toast("error", "Bukan berkas cadangan ADIK", "Pilih berkas .json hasil unduhan menu Cadangkan Data."); return; }
      cadanganKonfirmasi(data);
    };
    reader.onerror = function () { toast("error", "Gagal membaca berkas", "Coba pilih berkas ulang."); };
    reader.readAsText(el.files[0]);
    return;
  }
  var data2 = cadanganAmbilTeks();
  if (data2) cadanganKonfirmasi(data2);
}

/* Tombol "Pulihkan Data Ini" di jendela periksa isi: pakai data yang sudah dibaca. */
function cadanganPulihkanSiap() {
  var data = state.cadanganSiap;
  if (!data) { cadanganPulihkan(); return; }
  cadanganKonfirmasi(data);
}

function cadanganKonfirmasi(data) {
  var r = cadanganRingkas(data);
  confirmModal("Pulihkan Data Cadangan",
    "Isi cadangan: " + r.asesmen + " asesmen, " + r.soalBank + " soal bank, " + r.murid + " profil murid, dibuat " + fmtDateTime(data.dibuatPada) + ". " +
    "Data yang ada sekarang akan digantikan. Lanjutkan?",
    "Pulihkan", function () { cadanganTerapkan(data); });
}

function cadanganPeriksa() {
  var el = document.getElementById("cadanganFile");
  var bahan = null;
  if (el && el.files && el.files[0]) {
    var reader = new FileReader();
    reader.onload = function () {
      var d = null;
      try { d = JSON.parse(String(reader.result || "")); } catch (e) { d = null; }
      if (!d || d.format !== CADANGAN_FORMAT) { toast("error", "Bukan berkas cadangan ADIK", "Berkas tidak dikenali."); return; }
      cadanganIsiModal(d);
    };
    reader.readAsText(el.files[0]);
    return;
  }
  bahan = cadanganAmbilTeks();
  if (bahan) cadanganIsiModal(bahan);
}

function cadanganIsiModal(data) {
  state.cadanganSiap = data;
  var r = cadanganRingkas(data);
  var ls = data.local || {};
  var isi = [];
  if (ls[LS.assessments]) isi.push("Asesmen");
  if (ls[LS.bank]) isi.push("Bank soal");
  if (ls[LS_PROFIL_KEY]) isi.push("Profil murid");
  if (ls[LS.school]) isi.push("Profil sekolah (kop)");
  if (ls[LS.sync]) isi.push("Endpoint Rekap Nilai");
  if (ls[LS_PROFIL_FORM_KEY]) isi.push("Pengaturan angket Google Form");
  var body = '<div class="note note-info mb-16">' + ICON.info +
    "<div><strong>Cadangan dibuat " + esc(fmtDateTime(data.dibuatPada)) + "</strong>Versi aplikasi: " + esc(data.build || "-") + "</div></div>";
  body += '<div class="table-wrap"><table class="tbl"><tbody>' +
    "<tr><th>Asesmen</th><td>" + r.asesmen + "</td></tr>" +
    "<tr><th>Soal di bank</th><td>" + r.soalBank + "</td></tr>" +
    "<tr><th>Profil murid</th><td>" + r.murid + "</td></tr>" +
    "<tr><th>Data lain</th><td>" + (isi.length ? esc(isi.join(", ")) : "-") + "</td></tr>" +
    "</tbody></table></div>";
  openModal(
    '<div class="modal-head"><h3>Isi Cadangan</h3><button class="close-x" data-action="closeModal">' + ICON.close + "</button></div>" +
    '<div class="modal-body">' + body + "</div>" +
    '<div class="modal-foot"><button class="btn btn-light" data-action="closeModal">Tutup</button>' +
    '<button class="btn btn-primary" data-action="cadanganPulihkanSiap">' + ICON.upload + " Pulihkan Data Ini</button></div>",
    { wide: true }
  );
}

function cadanganHapusHasil() {
  confirmModal("Hapus Hasil Siswa",
    "Semua jawaban siswa yang sudah ditarik di menu Rekap Nilai akan dihapus dari sesi ini. Asesmen, bank soal, dan profil murid tetap aman. Lanjutkan?",
    "Hapus", function () {
      state.rekap.pulled = [];
      state.rekap.scores = {};
      state.rekap.aid = "";
      render();
      toast("success", "Hasil siswa dibersihkan", "Menu Rekap Nilai kembali kosong.");
    });
}

function cadanganHapusSemua() {
  confirmModal("Hapus Seluruh Data",
    "Asesmen, bank soal, profil murid, dan pengaturan akan dihapus dari browser ini. Tindakan ini tidak dapat dibatalkan. Pastikan cadangan sudah diunduh.",
    "Hapus Semua", function () {
      CADANGAN_LS_KEYS.concat(CADANGAN_OPSIONAL_KEYS).forEach(function (k) {
        try { localStorage.removeItem(k); } catch (e) { }
      });
      toast("success", "Seluruh data dihapus", "Halaman akan dimuat ulang dari kondisi kosong.");
      setTimeout(function () { location.reload(); }, 1200);
    });
}
