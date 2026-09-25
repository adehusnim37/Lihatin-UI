"use client";

import { Fragment, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const baseURL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1").replace(/\/$/, "");
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setError(false);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(true);
    }
  }
  return (
    <div className="rounded-lg border bg-muted/40 overflow-hidden">
      <div className="flex justify-end border-b p-1">
        <Button variant="ghost" size="sm" onClick={copy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Tersalin" : "Salin kode"}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed" tabIndex={0}>
        <code>{code}</code>
      </pre>
      <span role="status" className={error ? "block p-2 text-sm text-destructive" : "sr-only"}>
        {error
          ? "Tidak bisa menyalin. Pilih dan salin kode secara manual."
          : copied
            ? "Kode tersalin"
            : ""}
      </span>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4 rounded-xl border bg-card p-4 sm:p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function FieldList({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y rounded-lg border">
      {rows.map(([name, description]) => (
        <div
          key={name}
          className="grid min-w-0 gap-1 p-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:gap-4"
        >
          <dt className="break-words font-mono text-xs font-semibold leading-6">{name}</dt>
          <dd className="min-w-0 break-words text-muted-foreground">{description}</dd>
        </div>
      ))}
    </dl>
  );
}

export function APIReference() {
  return (
    <div className="min-w-0 space-y-6 text-sm leading-7 [&_p]:max-w-prose [&_p_code]:break-words">
      <Breadcrumb aria-label="Bagian panduan API">
        <BreadcrumbList>
          {[
            ["quick-start", "1. Mulai"],
            ["payload", "2. Kirim data"],
            ["key-management", "3. Kelola key"],
            ["limits-errors", "4. Batas & kendala"],
          ].map(([id, label], index) => (
            <Fragment key={id}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                <BreadcrumbLink href={`#${id}`}>{label}</BreadcrumbLink>
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <Section id="quick-start" title="1. Mulai menggunakan API">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Buka tab API Keys. Akun harus aktif dan email sudah terverifikasi.</li>
          <li>
            Akun non-premium mendapat 50 request per jam. Akses premium aktif meningkatkan limit
            menjadi 100 request per 10 menit. Semua key dalam satu akun berbagi batas ini.
          </li>
          <li>
            Buat key dan pilih izin akses sesuai kebutuhan. Simpan key lengkap saat pertama
            ditampilkan.
          </li>
          <li>
            Kirim key melalui header <code>X-API-Key</code> pada setiap request.
          </li>
        </ol>
        <FieldList
          rows={[
            ["read", "Membaca daftar link, detail, dan statistik."],
            [
              "write",
              "Membuat link baru. Tambahkan izin ini jika key sebelumnya hanya memiliki read.",
            ],
            ["update", "Mengubah pengaturan link yang sudah ada."],
            ["delete", "Menghapus link."],
          ]}
        />
        <div className="rounded-lg bg-muted p-3">
          <span className="text-muted-foreground">Alamat dasar API (base URL)</span>
          <code className="mt-1 block break-all">{baseURL}</code>
        </div>
        <p>
          Simpan key di environment server. Jangan memasukkannya ke kode frontend atau variabel
          NEXT_PUBLIC. Endpoint API key tidak membutuhkan cookie login atau token CSRF.
        </p>
        <CodeBlock
          code={`# Isi LIHATIN_API_KEY melalui environment server terlebih dahulu\nexport LIHATIN_API_URL='${baseURL}'\n\ncurl "$LIHATIN_API_URL/api/short?page=1&limit=10" \\\n  --header "X-API-Key: $LIHATIN_API_KEY"`}
        />
        <p>
          Akun biasa hanya mengakses link miliknya. Key milik admin dapat mengakses data yang lebih
          luas sesuai operasi. Gunakan akun biasa jika integrasi hanya membutuhkan link sendiri.
        </p>
      </Section>
      <Section id="payload" title="2. Mengirim data dan membaca respons">
        <h3 className="font-semibold">Membuat satu link</h3>
        <p>
          Gunakan POST /api/short. Body adalah data JSON yang dikirim ke API. Untuk satu link,
          letakkan data di dalam objek <code>link</code>. Kirim header autentikasi dan tipe konten
          seperti contoh berikut.
        </p>
        <CodeBlock
          code={`curl -X POST "${baseURL}/api/short" \\
  -H "X-API-Key: $LIHATIN_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "is_bulky": false,
    "link": {
      "original_url": "https://example.com/artikel",
      "title": "Artikel contoh",
      "description": "Link untuk artikel contoh",
      "custom_code": "artikel-contoh",
      "expires_at": "2030-12-31T23:59:59+07:00",
      "passcode": "482915"
    }
  }'`}
        />
        <p>Payload JSON yang dikirim oleh contoh tersebut adalah:</p>
        <CodeBlock
          code={JSON.stringify(
            {
              is_bulky: false,
              link: {
                original_url: "https://example.com/artikel",
                title: "Artikel contoh",
              },
            },
            null,
            2,
          )}
        />
        <FieldList
          rows={[
            ["original_url", "Wajib. URL tujuan yang ingin dipendekkan."],
            ["title", "Opsional. Judul link, maksimal 255 karakter."],
            ["description", "Opsional. Keterangan link, maksimal 1.000 karakter."],
            [
              "custom_code",
              "Opsional. Kode pilihan, 3–100 karakter; gunakan huruf, angka, tanda hubung, atau underscore tanpa spasi.",
            ],
            [
              "passcode",
              "Opsional. Kode akses berupa string 6 digit. Semua digit tidak boleh sama.",
            ],
            [
              "expires_at",
              "Opsional. Waktu kedaluwarsa dalam format RFC3339, misalnya 2030-12-31T23:59:59+07:00.",
            ],
          ]}
        />
        <h3 className="font-semibold">Membuat beberapa link sekaligus</h3>
        <p>
          Gunakan endpoint POST yang sama. Isi <code>is_bulky</code> dengan true dan masukkan daftar
          link ke dalam <code>links</code>. Setiap item minimal harus memiliki{" "}
          <code>original_url</code>.
        </p>
        <CodeBlock
          code={`curl -X POST "${baseURL}/api/short" \\
  -H "X-API-Key: $LIHATIN_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "is_bulky": true,
    "links": [
      {
        "original_url": "https://example.com/pertama",
        "title": "Artikel pertama"
      },
      {
        "original_url": "https://example.com/kedua",
        "custom_code": "artikel-kedua"
      }
    ]
  }'`}
        />
        <p>Payload JSON bulk-nya dapat ditulis seperti ini:</p>
        <CodeBlock
          code={JSON.stringify(
            {
              is_bulky: true,
              links: [
                { original_url: "https://example.com/pertama" },
                { original_url: "https://example.com/kedua" },
              ],
            },
            null,
            2,
          )}
        />
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
          Saat membuat satu link, limit, enable_stats, dan tags belum diterapkan. Setelah link
          dibuat, gunakan PUT untuk mengatur click_limit, enable_stats, dan field utm_*.
        </p>
        <h3 className="font-semibold">Mengubah link</h3>
        <p>
          Gunakan PUT /api/short/&#123;code&#125;. Kirim field langsung di body, tanpa objek link.
          Field yang tidak dikirim tetap menggunakan nilai sebelumnya. URL tujuan (original_url)
          tidak dapat diubah lewat endpoint ini.
        </p>
        <CodeBlock
          code={JSON.stringify(
            {
              title: "Artikel terbaru",
              is_active: true,
              click_limit: 0,
              expires_at: null,
            },
            null,
            2,
          )}
        />
        <FieldList
          rows={[
            [
              "title / description",
              "Minimal 3 karakter bila dikirim. Maksimal 255 untuk judul dan 1.000 untuk deskripsi.",
            ],
            ["short_code", "Kode pengganti untuk link. Ikuti aturan custom_code di atas."],
            ["is_active", "true mengaktifkan link; false menonaktifkannya."],
            ["click_limit", "Batas jumlah klik. Isi 0 untuk menghapus batas."],
            [
              "expires_at",
              "Isi null untuk menghapus masa berlaku. Tanggal baru harus di masa depan. Jangan kirim field ini jika tidak ingin mengubahnya.",
            ],
            [
              "passcode / enable_stats",
              "Mengatur kode akses 6 digit dan pencatatan statistik (true atau false).",
            ],
            ["custom_domain", "Domain khusus dalam format URL."],
            [
              "utm_*",
              "Parameter kampanye: utm_source, utm_medium, utm_campaign, utm_term, utm_content. Kirim langsung di body.",
            ],
          ]}
        />
        <h3 className="font-semibold">Membaca balasan API</h3>
        <p>
          Responses adalah balasan API. Periksa status HTTP dan nilai success sebelum menggunakan
          data. Contoh berikut memakai nilai ilustrasi.
        </p>
        <CodeBlock
          code={JSON.stringify(
            {
              success: true,
              data: {
                id: "contoh-id",
                short_code: "artikel-contoh",
                original_url: "https://example.com/artikel",
                is_active: true,
                expires_at: null,
                created_at: "2026-09-24T10:00:00Z",
              },
              message: "Short link created successfully",
            },
            null,
            2,
          )}
        />
        <FieldList
          rows={[
            ["success", "true berarti berhasil; false berarti request gagal."],
            [
              "data",
              "Hasil operasi, misalnya short_code. Bentuknya berbeda untuk setiap endpoint.",
            ],
            ["message", "Pesan singkat dari API."],
            [
              "error",
              "Keterangan kesalahan per field, jika ada. Field opsional dapat tidak muncul dalam respons.",
            ],
          ]}
        />
        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer font-semibold">Contoh JavaScript untuk server</summary>
          <div className="mt-4">
            <CodeBlock
              code={`const response = await fetch(process.env.LIHATIN_API_URL + "/api/short", {\n  method: "POST",\n  headers: {\n    "X-API-Key": process.env.LIHATIN_API_KEY,\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({ link: { original_url: "https://example.com" } }),\n});\nconst result = await response.json();\nif (!response.ok || !result.success) {\n  throw new Error(result.message || "Request API gagal");\n}\nconsole.log(result.data.short_code);`}
            />
          </div>
        </details>
      </Section>
      <Section id="key-management" title="3. Mengelola API key">
        <p>
          Gunakan tab API Keys untuk membuat, menonaktifkan, dan mengganti key. Endpoint pengelolaan
          memakai sesi login dengan email terverifikasi. Header X-API-Key saja tidak cukup untuk
          mengelola key.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Saat membuat key, jumlah key aktif dibatasi menjadi 3.</li>
          <li>
            Form memilih read secara default. Tambahkan write untuk membuat link. Jika permissions
            kosong pada request API, backend memberikan keempat izin.
          </li>
          <li>
            Refresh mengganti secret dan langsung membatalkan key lama. Kuota penggunaan dan tanggal
            kedaluwarsa tetap.
          </li>
          <li>
            Usage count adalah jumlah penggunaan key, bukan jumlah klik link. Request yang gagal
            pada endpoint setelah kuota key direservasi tetap ikut dihitung.
          </li>
          <li>
            Batas total penggunaan per key boleh diubah atau dihapus. Ini pembatas tambahan milik
            key, bukan rate limit akun berdasarkan tier.
          </li>
        </ul>
        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer font-semibold">
            Referensi endpoint pengelolaan key
          </summary>
          <div className="mt-4 space-y-4">
            <p>
              Semua path berikut relatif terhadap base URL. Ganti :id dengan ID record dari respons,
              bukan bagian keyID pada secret. Request yang mengubah data melalui sesi browser
              mengikuti mekanisme CSRF aplikasi.
            </p>
            <FieldList
              rows={[
                ["GET /api-keys/", "Daftar key. Secret tidak ditampilkan kembali."],
                [
                  "POST /api-keys/",
                  "Buat key: name wajib. permissions, expires_at, allowed_ips, blocked_ips, limit_usage opsional. Key lengkap tersedia pada data.key.",
                ],
                ["GET /api-keys/:id", "Detail sebuah key."],
                [
                  "PUT /api-keys/:id",
                  "Ubah konfigurasi key aktif. limit_usage mengatur batas total per key; kirim clear_limit_usage: true untuk menghapus batasnya. Keduanya tidak boleh dikirim bersamaan.",
                ],
                ["DELETE /api-keys/:id", "Cabut key."],
                ["POST /api-keys/:id/activate", "Aktifkan key."],
                ["POST /api-keys/:id/deactivate", "Nonaktifkan key sementara."],
                [
                  "POST /api-keys/:id/refresh",
                  "Ganti secret. Key lengkap yang baru ada pada data.secret.full_api_key. last_used_at dan last_ip_used dihapus.",
                ],
                [
                  "GET /api-keys/:id/usage",
                  "Riwayat aktivitas. Gunakan query page=1&limit=10 untuk memilih halaman.",
                ],
                [
                  "GET /api-keys/stats",
                  "Jumlah key, total penggunaan, key paling sering dipakai, dan key terakhir dipakai.",
                ],
              ]}
            />
          </div>
        </details>
        <details className="rounded-lg border border-amber-500/40 p-4">
          <summary className="cursor-pointer font-semibold">
            Keterbatasan pengelolaan key saat ini
          </summary>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Perubahan allowed_ips dan blocked_ips belum disimpan melalui update. Atur pembatasan
              IP ketika membuat key.
            </li>
          </ul>
        </details>
      </Section>
      <Section id="limits-errors" title="4. Batas penggunaan dan penanganan error">
        <FieldList
          rows={[
            [
              "Rate limit",
              "Akun non-premium mendapat 50 request per jam. Akun premium mendapat 100 request per 10 menit. Batas dihitung bersama untuk seluruh API key dan endpoint short link dalam satu akun, meskipun IP berbeda.",
            ],
            [
              "limit_usage",
              "Batas total tambahan untuk satu key, bukan rate limit akun. Tidak diisi atau null saat membuat key berarti tanpa batas. Nilai 0 menolak penggunaan. Batas ini dapat diubah atau dihapus melalui edit key.",
            ],
            [
              "Penghitungan kuota",
              "Kuota total per key bertambah secara atomik setelah izin dan rate limit akun lolos. Request yang ditolak karena izin, rate limit akun, atau kuota key tidak menambah usage_count.",
            ],
            [
              "Pembatasan IP",
              "IP harus cocok persis dengan yang dilihat backend. Allowed IP kosong tidak membatasi akses; blocked_ips tetap menolak IP yang terdaftar. Format rentang CIDR tidak didukung.",
            ],
            [
              "Status key",
              "Key dan akun pemilik harus aktif. Key tidak boleh dicabut atau melewati tanggal kedaluwarsa.",
            ],
          ]}
        />
        <h3 className="font-semibold">Jika request gagal</h3>
        <FieldList
          rows={[
            [
              "400",
              "Periksa format key, JSON, field, dan parameter halaman. Endpoint views masih memiliki kendala validasi sorting; lihat catatan pada endpoint tersebut.",
            ],
            ["401 / 403", "Periksa header X-API-Key, izin akses, status akun, dan pembatasan IP."],
            [
              "404",
              "Periksa kode link atau key. Key yang tidak aktif atau kedaluwarsa juga dapat dianggap tidak ditemukan.",
            ],
            ["409", "Kode short link sudah digunakan. Pilih kode lain."],
            [
              "429",
              "Batas request atau kuota key tercapai. Untuk rate limit sementara, tunggu sebelum mencoba lagi.",
            ],
            [
              "500",
              "Terjadi masalah pada server. Catat waktu kejadian dan pesan error tanpa menyertakan secret.",
            ],
          ]}
        />
        <p>
          Jangan otomatis mengulang request pembuatan link tanpa memeriksa hasil sebelumnya. API
          belum mendukung idempotency key untuk mencegah duplikasi, sehingga retry dapat membuat
          link tambahan.
        </p>
      </Section>
    </div>
  );
}
