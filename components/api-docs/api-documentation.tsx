"use client";

import dynamic from "next/dynamic";
import { Download } from "lucide-react";
import { APIReference } from "./api-reference";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ScalarReference = dynamic(() => import("./scalar-reference"), {
  ssr: false,
  loading: () => (
    <div role="status" className="rounded-xl border p-8 text-muted-foreground">
      Memuat referensi API…
    </div>
  ),
});

export function APIDocumentation() {
  return (
    <Tabs defaultValue="reference" className="w-full min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList aria-label="Jenis dokumentasi" className="grid h-auto w-full grid-cols-2 sm:w-auto">
          <TabsTrigger value="reference">Referensi endpoint</TabsTrigger>
          <TabsTrigger value="guide">Panduan penggunaan</TabsTrigger>
        </TabsList>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          {(["json", "yaml"] as const).map((format) => (
            <Button key={format} asChild variant="outline" size="sm">
              <a href={`/main/api-integrations/docs/spec?format=${format}`}>
                <Download className="size-4" /> OpenAPI {format.toUpperCase()}
              </a>
            </Button>
          ))}
        </div>
      </div>
      <TabsContent value="reference" className="w-full min-w-0 space-y-5">
        <ol className="grid gap-3 rounded-xl border bg-muted/30 p-4 text-sm leading-6 md:grid-cols-3">
          <li><strong className="block">1. Pilih endpoint</strong><span className="text-muted-foreground">Buka operasi yang ingin digunakan, seperti membuat atau membaca link.</span></li>
          <li><strong className="block">2. Masukkan API key</strong><span className="text-muted-foreground">Isi key lengkap pada kolom Value di bagian Authentication.</span></li>
          <li><strong className="block">3. Coba request</strong><span className="text-muted-foreground">Klik Test Request dan periksa isinya sebelum mengirim. Operasi tulis mengubah data sungguhan.</span></li>
        </ol>
        <p className="text-sm leading-6 text-muted-foreground">
          Struktur data ditampilkan pada Body (data yang dikirim) dan Responses
          (balasan API) di setiap endpoint. Key yang diisi tidak disimpan permanen.
        </p>
        <ScalarReference />
      </TabsContent>
      <TabsContent value="guide" className="min-w-0">
        <APIReference />
      </TabsContent>
    </Tabs>
  );
}
