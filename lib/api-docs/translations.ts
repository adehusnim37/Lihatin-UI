export const guideTranslations = {
  breadcrumbQuickStart: { id: "1. Mulai", en: "1. Get started" },
  breadcrumbPayload: { id: "2. Kirim data", en: "2. Send data" },
  breadcrumbKeyManagement: { id: "3. Kelola key", en: "3. Manage keys" },
  breadcrumbLimitsErrors: { id: "4. Batas & kendala", en: "4. Limits & errors" },
  breadcrumbAriaLabel: { id: "Bagian panduan API", en: "API guide sections" },

  sectionQuickStartTitle: { id: "1. Mulai menggunakan API", en: "1. Getting started with the API" },
  step1: {
    id: "Buka tab API Keys. Akun harus aktif dan email sudah terverifikasi.",
    en: "Open the API Keys tab. Your account must be active and the email verified.",
  },
  step2: {
    id: "Akun non-premium mendapat 50 request per jam. Akses premium aktif meningkatkan limit menjadi 100 request per 10 menit. Semua key dalam satu akun berbagi batas ini.",
    en: "Non-premium accounts get 50 requests per hour. Active premium access raises the limit to 100 requests per 10 minutes. All keys on one account share this limit.",
  },
  step3: {
    id: "Buat key dan pilih izin akses sesuai kebutuhan. Simpan key lengkap saat pertama ditampilkan.",
    en: "Create a key and choose the permissions you need. Save the full key when it is first shown.",
  },
  step4: {
    id: "Kirim key melalui header `X-API-Key` pada setiap request.",
    en: "Send the key via the `X-API-Key` header on every request.",
  },
  permRead: {
    id: "Membaca daftar link, detail, dan statistik.",
    en: "Read link lists, details, and statistics.",
  },
  permWrite: {
    id: "Membuat link baru. Tambahkan izin ini jika key sebelumnya hanya memiliki read.",
    en: "Create new links. Add this permission if the key currently only has read.",
  },
  permUpdate: {
    id: "Mengubah pengaturan link yang sudah ada.",
    en: "Update settings of an existing link.",
  },
  permDelete: { id: "Menghapus link.", en: "Delete a link." },
  baseUrlLabel: { id: "Alamat dasar API (base URL)", en: "API base URL" },
  saveKeyWarning: {
    id: "Simpan key di environment server. Jangan memasukkannya ke kode frontend atau variabel NEXT_PUBLIC. Endpoint API key tidak membutuhkan cookie login atau token CSRF.",
    en: "Store the key in your server environment. Never put it in frontend code or a NEXT_PUBLIC variable. API key endpoints don't need a login cookie or CSRF token.",
  },
  scopeNote: {
    id: "Akun biasa hanya mengakses link miliknya. Key milik admin dapat mengakses data yang lebih luas sesuai operasi. Gunakan akun biasa jika integrasi hanya membutuhkan link sendiri.",
    en: "Regular accounts can only access their own links. Admin keys may access broader data depending on the operation. Use a regular account if the integration only needs its own links.",
  },

  sectionPayloadTitle: {
    id: "2. Mengirim data dan membaca respons",
    en: "2. Sending data and reading responses",
  },
  createSingleTitle: { id: "Membuat satu link", en: "Creating a single link" },
  createSingleDesc: {
    id: "Gunakan POST /api/short. Body adalah data JSON yang dikirim ke API. Untuk satu link, letakkan data di dalam objek `link`. Kirim header autentikasi dan tipe konten seperti contoh berikut.",
    en: "Use POST /api/short. The body is JSON data sent to the API. For a single link, put the data inside a `link` object. Send the authentication header and content type as shown below.",
  },
  payloadSentLabel: {
    id: "Payload JSON yang dikirim oleh contoh tersebut adalah:",
    en: "The JSON payload sent by that example is:",
  },
  fieldOriginalUrl: {
    id: "Wajib. URL tujuan yang ingin dipendekkan.",
    en: "Required. The destination URL to shorten.",
  },
  fieldTitle: {
    id: "Opsional. Judul link, maksimal 255 karakter.",
    en: "Optional. Link title, up to 255 characters.",
  },
  fieldDescription: {
    id: "Opsional. Keterangan link, maksimal 1.000 karakter.",
    en: "Optional. Link description, up to 1,000 characters.",
  },
  fieldCustomCode: {
    id: "Opsional. Kode pilihan, 3–100 karakter; gunakan huruf, angka, tanda hubung, atau underscore tanpa spasi.",
    en: "Optional. Custom code, 3–100 characters; use letters, numbers, hyphens, or underscores with no spaces.",
  },
  fieldPasscode: {
    id: "Opsional. Kode akses berupa string 6 digit. Semua digit tidak boleh sama.",
    en: "Optional. A 6-digit access code as a string. Digits cannot all be identical.",
  },
  fieldExpiresAt: {
    id: "Opsional. Waktu kedaluwarsa dalam format RFC3339, misalnya 2030-12-31T23:59:59+07:00.",
    en: "Optional. Expiration time in RFC3339 format, e.g. 2030-12-31T23:59:59+07:00.",
  },
  createBulkTitle: { id: "Membuat beberapa link sekaligus", en: "Creating multiple links at once" },
  createBulkDesc1: {
    id: "Gunakan endpoint POST yang sama. Isi ",
    en: "Use the same POST endpoint. Set ",
  },
  createBulkDesc2: {
    id: " dengan true dan masukkan daftar link ke dalam ",
    en: " to true and put the list of links inside ",
  },
  createBulkDesc3: {
    id: ". Setiap item minimal harus memiliki",
    en: ". Each item must at least have",
  },
  bulkPayloadLabel: {
    id: "Payload JSON bulk-nya dapat ditulis seperti ini:",
    en: "The bulk JSON payload can be written like this:",
  },
  bulkLimitWarning: {
    id: "Saat membuat satu link, limit, enable_stats, dan tags belum diterapkan. Setelah link dibuat, gunakan PUT untuk mengatur click_limit, enable_stats, dan field utm_*.",
    en: "When creating a single link, limit, enable_stats, and tags are not applied yet. After the link is created, use PUT to set click_limit, enable_stats, and the utm_* fields.",
  },
  updateLinkTitle: { id: "Mengubah link", en: "Updating a link" },
  updateLinkDesc: {
    id: "Gunakan PUT /api/short/{code}. Kirim field langsung di body, tanpa objek link. Field yang tidak dikirim tetap menggunakan nilai sebelumnya. URL tujuan (original_url) tidak dapat diubah lewat endpoint ini.",
    en: "Use PUT /api/short/{code}. Send fields directly in the body, without a link object. Fields you don't send keep their previous value. The destination URL (original_url) cannot be changed via this endpoint.",
  },
  fieldTitleDesc: {
    id: "Minimal 3 karakter bila dikirim. Maksimal 255 untuk judul dan 1.000 untuk deskripsi.",
    en: "At least 3 characters if sent. Max 255 for title and 1,000 for description.",
  },
  fieldShortCode: {
    id: "Kode pengganti untuk link. Ikuti aturan custom_code di atas.",
    en: "Replacement code for the link. Follows the custom_code rules above.",
  },
  fieldIsActive: {
    id: "true mengaktifkan link; false menonaktifkannya.",
    en: "true activates the link; false deactivates it.",
  },
  fieldClickLimit: {
    id: "Batas jumlah klik. Isi 0 untuk menghapus batas.",
    en: "Click count limit. Set 0 to remove the limit.",
  },
  fieldExpiresAtUpdate: {
    id: "Isi null untuk menghapus masa berlaku. Tanggal baru harus di masa depan. Jangan kirim field ini jika tidak ingin mengubahnya.",
    en: "Set to null to remove the expiration. New dates must be in the future. Don't send this field if you don't want to change it.",
  },
  fieldPasscodeStats: {
    id: "Mengatur kode akses 6 digit dan pencatatan statistik (true atau false).",
    en: "Sets the 6-digit access code and stats tracking (true or false).",
  },
  fieldCustomDomain: { id: "Domain khusus dalam format URL.", en: "Custom domain in URL format." },
  fieldUtm: {
    id: "Parameter kampanye: utm_source, utm_medium, utm_campaign, utm_term, utm_content. Kirim langsung di body.",
    en: "Campaign parameters: utm_source, utm_medium, utm_campaign, utm_term, utm_content. Send directly in the body.",
  },
  readResponseTitle: { id: "Membaca balasan API", en: "Reading API responses" },
  readResponseDesc: {
    id: "Responses adalah balasan API. Periksa status HTTP dan nilai success sebelum menggunakan data. Contoh berikut memakai nilai ilustrasi.",
    en: "Responses are what the API sends back. Check the HTTP status and the success value before using the data. The example below uses illustrative values.",
  },
  respMessageExample: {
    id: "Short link created successfully",
    en: "Short link created successfully",
  },
  fieldSuccess: {
    id: "true berarti berhasil; false berarti request gagal.",
    en: "true means it succeeded; false means the request failed.",
  },
  fieldData: {
    id: "Hasil operasi, misalnya short_code. Bentuknya berbeda untuk setiap endpoint.",
    en: "The operation's result, e.g. short_code. Its shape differs per endpoint.",
  },
  fieldMessage: { id: "Pesan singkat dari API.", en: "A short message from the API." },
  fieldError: {
    id: "Keterangan kesalahan per field, jika ada. Field opsional dapat tidak muncul dalam respons.",
    en: "Per-field error details, if any. Optional fields may be absent from the response.",
  },
  jsServerExampleSummary: {
    id: "Contoh JavaScript untuk server",
    en: "Server-side JavaScript example",
  },
  jsServerExampleError: { id: "Request API gagal", en: "API request failed" },

  sectionKeyManagementTitle: { id: "3. Mengelola API key", en: "3. Managing API keys" },
  keyMgmtDesc: {
    id: "Gunakan tab API Keys untuk membuat, menonaktifkan, dan mengganti key. Endpoint pengelolaan memakai sesi login dengan email terverifikasi. Header X-API-Key saja tidak cukup untuk mengelola key.",
    en: "Use the API Keys tab to create, deactivate, and rotate keys. Management endpoints use a logged-in session with a verified email. The X-API-Key header alone isn't enough to manage keys.",
  },
  keyLimit: {
    id: "Saat membuat key, jumlah key aktif dibatasi menjadi 3.",
    en: "When creating a key, the number of active keys is limited to 3.",
  },
  keyDefaultPerm: {
    id: "Form memilih read secara default. Tambahkan write untuk membuat link. Jika permissions kosong pada request API, backend memberikan keempat izin.",
    en: "The form selects read by default. Add write to create links. If permissions is empty in the API request, the backend grants all four permissions.",
  },
  keyRefresh: {
    id: "Refresh mengganti secret dan langsung membatalkan key lama. Kuota penggunaan dan tanggal kedaluwarsa tetap.",
    en: "Refresh replaces the secret and immediately revokes the old key. Usage quota and expiration date stay the same.",
  },
  keyUsageCount: {
    id: "Usage count adalah jumlah penggunaan key, bukan jumlah klik link. Request yang gagal pada endpoint setelah kuota key direservasi tetap ikut dihitung.",
    en: "Usage count is the number of times the key was used, not link click count. Requests that fail after the key's quota is reserved still count.",
  },
  keyUsageLimit: {
    id: "Batas total penggunaan per key boleh diubah atau dihapus. Ini pembatas tambahan milik key, bukan rate limit akun berdasarkan tier.",
    en: "The total usage limit per key can be changed or removed. This is an extra limit on the key, not the account's tier-based rate limit.",
  },
  keyEndpointRefSummary: {
    id: "Referensi endpoint pengelolaan key",
    en: "Key management endpoint reference",
  },
  keyEndpointRefDesc: {
    id: "Semua path berikut relatif terhadap base URL. Ganti :id dengan ID record dari respons, bukan bagian keyID pada secret. Request yang mengubah data melalui sesi browser mengikuti mekanisme CSRF aplikasi.",
    en: "All paths below are relative to the base URL. Replace :id with the record ID from the response, not the keyID part of the secret. Requests that mutate data via a browser session follow the app's CSRF mechanism.",
  },
  epListKeys: {
    id: "Daftar key. Secret tidak ditampilkan kembali.",
    en: "List keys. Secrets are not shown again.",
  },
  epCreateKey: {
    id: "Buat key: name wajib. permissions, expires_at, allowed_ips, blocked_ips, limit_usage opsional. Key lengkap tersedia pada data.key.",
    en: "Create a key: name is required. permissions, expires_at, allowed_ips, blocked_ips, limit_usage are optional. The full key is available at data.key.",
  },
  epGetKey: { id: "Detail sebuah key.", en: "Details of a key." },
  epUpdateKey: {
    id: "Ubah konfigurasi key aktif. limit_usage mengatur batas total per key; kirim clear_limit_usage: true untuk menghapus batasnya. Keduanya tidak boleh dikirim bersamaan.",
    en: "Update an active key's configuration. limit_usage sets the total per-key limit; send clear_limit_usage: true to remove it. Both cannot be sent together.",
  },
  epDeleteKey: { id: "Cabut key.", en: "Revoke a key." },
  epActivateKey: { id: "Aktifkan key.", en: "Activate a key." },
  epDeactivateKey: { id: "Nonaktifkan key sementara.", en: "Temporarily deactivate a key." },
  epRefreshKey: {
    id: "Ganti secret. Key lengkap yang baru ada pada data.secret.full_api_key. last_used_at dan last_ip_used dihapus.",
    en: "Rotate the secret. The new full key is at data.secret.full_api_key. last_used_at and last_ip_used are cleared.",
  },
  epUsageKey: {
    id: "Riwayat aktivitas. Gunakan query page=1&limit=10 untuk memilih halaman.",
    en: "Activity history. Use the query page=1&limit=10 to pick a page.",
  },
  epStatsKey: {
    id: "Jumlah key, total penggunaan, key paling sering dipakai, dan key terakhir dipakai.",
    en: "Key count, total usage, most-used key, and last-used key.",
  },
  keyLimitationsSummary: {
    id: "Keterbatasan pengelolaan key saat ini",
    en: "Current key management limitations",
  },
  keyLimitationIps: {
    id: "Perubahan allowed_ips dan blocked_ips belum disimpan melalui update. Atur pembatasan IP ketika membuat key.",
    en: "Changes to allowed_ips and blocked_ips are not saved via update yet. Set IP restrictions when creating the key.",
  },

  sectionLimitsTitle: {
    id: "4. Batas penggunaan dan penanganan error",
    en: "4. Usage limits and error handling",
  },
  limitRateLabel: { id: "Rate limit", en: "Rate limit" },
  limitRateDesc: {
    id: "Akun non-premium mendapat 50 request per jam. Akun premium mendapat 100 request per 10 menit. Batas dihitung bersama untuk seluruh API key dan endpoint short link dalam satu akun, meskipun IP berbeda.",
    en: "Non-premium accounts get 50 requests per hour. Premium accounts get 100 requests per 10 minutes. The limit is shared across all API keys and short-link endpoints on one account, even from different IPs.",
  },
  authThrottleLabel: { id: "Perlindungan autentikasi", en: "Authentication protection" },
  authThrottleDesc: {
    id: "Sebelum autentikasi, maksimal 120 request per menit per IP. Setelah 10 kegagalan tercatat untuk pasangan IP dan key ID dalam 15 menit, percobaan berikutnya ditolak sementara. Respons 429 menyertakan Retry-After dalam detik. Kegagalan autentikasi tidak mengurangi kuota akun atau limit_usage.",
    en: "Before authentication, each IP is limited to 120 requests per minute. After 10 recorded failures for the same IP and key ID within 15 minutes, further attempts are temporarily blocked. A 429 response includes Retry-After in seconds. Authentication failures do not spend account quota or limit_usage.",
  },
  limitUsageLabel: { id: "limit_usage", en: "limit_usage" },
  limitUsageDesc: {
    id: "Batas total tambahan untuk satu key, bukan rate limit akun. Tidak diisi atau null saat membuat key berarti tanpa batas. Nilai 0 menolak penggunaan. Batas ini dapat diubah atau dihapus melalui edit key.",
    en: "An extra total limit for a single key, not the account rate limit. Leaving it unset or null when creating a key means unlimited. A value of 0 rejects usage. This limit can be changed or removed via key edit.",
  },
  quotaCountLabel: { id: "Penghitungan kuota", en: "Quota counting" },
  quotaCountDesc: {
    id: "Kuota total per key bertambah secara atomik setelah izin dan rate limit akun lolos. Request yang ditolak karena izin, rate limit akun, atau kuota key tidak menambah usage_count.",
    en: "The per-key total quota increases atomically after permission and account rate limit checks pass. Requests rejected due to permissions, account rate limit, or key quota do not increase usage_count.",
  },
  ipRestrictionLabel: { id: "Pembatasan IP", en: "IP restriction" },
  ipRestrictionDesc: {
    id: "IP harus cocok persis dengan yang dilihat backend. Allowed IP kosong tidak membatasi akses; blocked_ips tetap menolak IP yang terdaftar. Format rentang CIDR tidak didukung.",
    en: "The IP must exactly match what the backend sees. An empty allowed IP list doesn't restrict access; blocked_ips still rejects listed IPs. CIDR range format isn't supported.",
  },
  keyStatusLabel: { id: "Status key", en: "Key status" },
  keyStatusDesc: {
    id: "Key dan akun pemilik harus aktif. Key tidak boleh dicabut atau melewati tanggal kedaluwarsa.",
    en: "The key and its owner account must be active. The key must not be revoked or past its expiration date.",
  },
  errorsHeading: { id: "Jika request gagal", en: "If a request fails" },
  err400: {
    id: "Periksa format key, JSON, field, dan parameter halaman. Endpoint views masih memiliki kendala validasi sorting; lihat catatan pada endpoint tersebut.",
    en: "Check the key format, JSON, fields, and page parameters. The views endpoint still has a sorting validation issue; see the note on that endpoint.",
  },
  err401403: {
    id: "Periksa header X-API-Key, izin akses, status akun, dan pembatasan IP.",
    en: "Check the X-API-Key header, access permissions, account status, and IP restrictions.",
  },
  err404: {
    id: "Periksa kode link atau key. Key yang tidak aktif atau kedaluwarsa juga dapat dianggap tidak ditemukan.",
    en: "Check the link code or key. An inactive or expired key may also be treated as not found.",
  },
  err409: {
    id: "Kode short link sudah digunakan. Pilih kode lain.",
    en: "The short link code is already in use. Choose a different code.",
  },
  err429: {
    id: "Batas request, perlindungan autentikasi, atau kuota key tercapai. Jika ada header Retry-After, tunggu selama jumlah detik tersebut sebelum mencoba lagi.",
    en: "A request limit, authentication guard, or key quota was reached. If Retry-After is present, wait that many seconds before retrying.",
  },
  err500: {
    id: "Terjadi masalah pada server. Catat waktu kejadian dan pesan error tanpa menyertakan secret.",
    en: "A server-side problem occurred. Log the time and error message without including secrets.",
  },
  retryWarning: {
    id: "Jangan otomatis mengulang request pembuatan link tanpa memeriksa hasil sebelumnya. API belum mendukung idempotency key untuk mencegah duplikasi, sehingga retry dapat membuat link tambahan.",
    en: "Don't automatically retry link creation requests without checking the previous result. The API doesn't support an idempotency key yet to prevent duplicates, so retries can create extra links.",
  },

  copySuccess: { id: "Tersalin", en: "Copied" },
  copyLabel: { id: "Salin kode", en: "Copy code" },
  copyError: {
    id: "Tidak bisa menyalin. Pilih dan salin kode secara manual.",
    en: "Couldn't copy. Select and copy the code manually.",
  },
  copyStatus: { id: "Kode tersalin", en: "Code copied" },

  tabReference: { id: "Referensi endpoint", en: "Endpoint reference" },
  tabGuide: { id: "Panduan penggunaan", en: "Usage guide" },
  docTypeAriaLabel: { id: "Jenis dokumentasi", en: "Documentation type" },
  downloadFormat: { id: "OpenAPI", en: "OpenAPI" },
  loadingReference: { id: "Memuat referensi API…", en: "Loading API reference…" },
  refStep1Title: { id: "1. Pilih endpoint", en: "1. Choose an endpoint" },
  refStep1Desc: {
    id: "Buka operasi yang ingin digunakan, seperti membuat atau membaca link.",
    en: "Open the operation you want to use, such as creating or reading a link.",
  },
  refStep2Title: { id: "2. Masukkan API key", en: "2. Enter your API key" },
  refStep2Desc: {
    id: "Isi key lengkap pada kolom Value di bagian Authentication.",
    en: "Fill in your full key in the Value field under Authentication.",
  },
  refStep3Title: { id: "3. Coba request", en: "3. Try a request" },
  refStep3Desc: {
    id: "Klik Test Request dan periksa isinya sebelum mengirim. Operasi tulis mengubah data sungguhan.",
    en: "Click Test Request and review its contents before sending. Write operations change real data.",
  },
  refStructureNote: {
    id: "Struktur data ditampilkan pada Body (data yang dikirim) dan Responses (balasan API) di setiap endpoint. Key yang diisi tidak disimpan permanen.",
    en: "Data structure is shown under Body (data sent) and Responses (API reply) on each endpoint. The key you enter isn't stored permanently.",
  },
  localeToggleLabel: { id: "Bahasa", en: "Language" },
} as const;

export type GuideTranslationKey = keyof typeof guideTranslations;
