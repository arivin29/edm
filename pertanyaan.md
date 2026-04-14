Terkait Aplikasi DMS & BPM (PT Askara Internal)
No	Pertanyaan	Jawaban
1	Apakah saat ini sudah ada aplikasi DMS (Document Management System) dan BPM (Business Process Management) yang digunakan?
a.	Jika sudah ada, seperti apa aplikasi yang saat ini berjalan?
b.	Apakah terdapat kendala / alasan ingin dikembangkan atau diganti?
    Saat ini, hanya tersedia aplikasi DMS.
a.	Sistem digunakan untuk mengupload permintaan dokumen dari masing-masing dept ke QMS dan menyimpan dokumen
b.	Belum mendukung pembuatan dokumen di sistem; pembuatan dokumen masih dilakukan terpisah di Excel. Pada sistem baru, diharapkan dapat menjadi one-stop platform untuk pembuatan hingga penyimpanan dokumen.

2	Bagaimana cara integrasi yang diharapkan?
a.	Apakah perlu terhubung dengan sistem lain (ERP, HRIS, CRM, dll)?
b.	Adakah standar integrasi (API, Webhook, file, database sharing) yang diinginkan?
    a.	Untuk terhubungan dengan sistem lain tidak perlu
b.	API jika sewa, File & Database jika software punya PT Askara Internal
3	Fitur aplikasi ini apakah akan dibangun baru sepenuhnya atau pengembangan dari aplikasi existing?
    Dibangun baru sepenuhnya
4	Jenis modul atau template dokumen apa saja yang perlu dikelola?
Contoh: PO (Purchase Order), WO (Work Order), SK (Surat Keputusan), kontrak, invoice, dll
    Template dokumen prosedur kerja, meliputi:
1.	SOP
2.	Instruksi Kerja
3.	Standar
4.	Formulir
5.	One Point Lessons (OPL)
5	Teknologi apa yang diinginkan untuk pengembangan?
Apakah ada spesifikasi teknis tertentu? (misalnya PHP Laravel, NodeJS, Java, database MySQL/PostgreSQL, server Linux/Windows, cloud/on-premise)
    PHP, PostgreSQL, native
 
6	Apakah approval bersifat dinamis?
a.	Apakah flow approval bisa diatur berbeda per jenis dokumen?
b.	Apakah user approval bisa disesuaikan per dokumen?	Ya bersifat dinamis
a.	Ya, setiap jenis dokumen memiliki hirarki approval yang berbeda
b.	Ya, masing-masing dept memiliki User yang berbeda namun dengan level yang sudah ditentukan
7	Apakah sistem approval ini perlu terintegrasi dengan aplikasi HR untuk data user & jabatan?
Atau user approval berdiri sendiri?
    User approval berdiri sendiri
8	Template dokumen bersifat dinamis atau statik?
Apakah layout dokumen bisa disesuaikan sendiri (dinamis) atau fixed (hardcoding)?
    Fixed, tersedia template dokumen dimana User perlu mengisi sesuai template yang ditentukan
9	Seperti apa output dokumen yang diinginkan?
a.	PDF dengan template?
b.	Format word yang bisa berdiri diedit?
c.	Atau hanya tampilan digital di sistem?	Terdapat 2 opsi output dokumen:
1.	Draft document  -> berupa word yang bisa diberi comment dan edit kembali sesuai hasil review
2.	Final document -> berupa pdf yang siap dilakukan pengesahan
10	Apakah dokumen akan dilengkapi digital signature?
Jika iya, menggunakan sertifikat digital (CA) atau tanda tangan gambar saja?
    Tanda tangan gambar saja (karena dokumen untuk kebutuhan internal)
11	Apakah diperlukan audit trail?
Misalnya riwayat siapa saja yang melihat, mengubah, meng-approve dokumen.
    Ya, diperlukan
12	Apakah hak akses user?
Apakah perlu multi level permission (create, edit, approve, view, download)?
    Ya, terdapat hak akses berbeda untuk tipe dokumen (master copy, controlled copy dan raw file)
 
13	Apakah aka nada notifikasi?
Email, WhatsApp, atau push notification ke dashboard?
    Ya, push notification ke dashboard dan email
14	Apakah sistem multi-company / multi-entity?
Untuk grup perusahaan, masing-masing bisa punya flow & dokumen sendiri.
    Multi company, secara alur hampir sama namun dengan template dokumen yang berbeda
15	Berapa user yang akan menggunakan sistem?
Untuk estimasi beban server dan licensing.
    User dibagi dalam masing-masing departemen, dengan estimasi User < 50

