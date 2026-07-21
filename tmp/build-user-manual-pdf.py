from pathlib import Path
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
)
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from PIL import Image as PILImage


ROOT = Path(r"D:\website kasir")
OUT = ROOT / "output" / "manual"
IMG = OUT / "screenshots"
PDF = OUT / "Technical_User_Manual_Admin_Solutions_Inovatif_POS.pdf"

MONTHS_ID = {
    1: "Januari",
    2: "Februari",
    3: "Maret",
    4: "April",
    5: "Mei",
    6: "Juni",
    7: "Juli",
    8: "Agustus",
    9: "September",
    10: "Oktober",
    11: "November",
    12: "Desember",
}


FONT = "Calibri"
FONT_BOLD = "Calibri-Bold"


def tanggal_indonesia(dt):
    return f"{dt.day} {MONTHS_ID[dt.month]} {dt.year}"


def register_fonts():
    candidates = [
        (FONT, Path(r"C:\Windows\Fonts\calibri.ttf")),
        (FONT_BOLD, Path(r"C:\Windows\Fonts\calibrib.ttf")),
    ]
    for name, file in candidates:
        if file.exists():
            pdfmetrics.registerFont(TTFont(name, str(file)))


def styles():
    s = getSampleStyleSheet()
    base_font = FONT if FONT in pdfmetrics.getRegisteredFontNames() else "Helvetica"
    bold_font = FONT_BOLD if FONT_BOLD in pdfmetrics.getRegisteredFontNames() else "Helvetica-Bold"
    return {
        "title": ParagraphStyle(
            "ManualTitle",
            parent=s["Title"],
            fontName=bold_font,
            fontSize=24,
            leading=29,
            textColor=colors.HexColor("#0F766E"),
            alignment=TA_CENTER,
            spaceAfter=14,
        ),
        "subtitle": ParagraphStyle(
            "ManualSubtitle",
            parent=s["Normal"],
            fontName=bold_font,
            fontSize=13,
            leading=17,
            textColor=colors.HexColor("#0F172A"),
            alignment=TA_CENTER,
            spaceAfter=10,
        ),
        "meta": ParagraphStyle(
            "ManualMeta",
            parent=s["Normal"],
            fontName=base_font,
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor("#475569"),
            alignment=TA_CENTER,
            spaceAfter=16,
        ),
        "h1": ParagraphStyle(
            "ManualH1",
            parent=s["Heading1"],
            fontName=bold_font,
            fontSize=16,
            leading=19,
            textColor=colors.HexColor("#0F766E"),
            spaceBefore=13,
            spaceAfter=7,
            keepWithNext=True,
        ),
        "h2": ParagraphStyle(
            "ManualH2",
            parent=s["Heading2"],
            fontName=bold_font,
            fontSize=12.5,
            leading=15,
            textColor=colors.HexColor("#0F766E"),
            spaceBefore=9,
            spaceAfter=5,
            keepWithNext=True,
        ),
        "h3": ParagraphStyle(
            "ManualH3",
            parent=s["Heading3"],
            fontName=bold_font,
            fontSize=10.8,
            leading=13,
            textColor=colors.HexColor("#1F2937"),
            spaceBefore=7,
            spaceAfter=3,
            keepWithNext=True,
        ),
        "body": ParagraphStyle(
            "ManualBody",
            parent=s["BodyText"],
            fontName=base_font,
            fontSize=9.8,
            leading=13,
            textColor=colors.HexColor("#1F2937"),
            spaceAfter=6,
        ),
        "small": ParagraphStyle(
            "ManualSmall",
            parent=s["BodyText"],
            fontName=base_font,
            fontSize=8.6,
            leading=11,
            textColor=colors.HexColor("#475569"),
            spaceAfter=4,
        ),
        "caption": ParagraphStyle(
            "ManualCaption",
            parent=s["BodyText"],
            fontName=bold_font,
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor("#475569"),
            alignment=TA_CENTER,
            spaceBefore=3,
            spaceAfter=8,
            keepWithNext=False,
        ),
        "li": ParagraphStyle(
            "ManualList",
            parent=s["BodyText"],
            fontName=base_font,
            fontSize=9.5,
            leading=12.5,
            textColor=colors.HexColor("#1F2937"),
            leftIndent=18,
            firstLineIndent=-10,
            spaceAfter=3,
        ),
    }


def P(text, style):
    return Paragraph(text.replace("&", "&amp;"), style)


def heading(text, level, st):
    return P(text, st[f"h{level}"])


def bullets(items, st):
    return [P(f"- {item}", st["li"]) for item in items]


def steps(items, st):
    return [P(f"{i}. {item}", st["li"]) for i, item in enumerate(items, 1)]


def note(title, text, st, tone="info"):
    palette = {
        "info": ("#E0F2FE", "#075985"),
        "warning": ("#FEF3C7", "#92400E"),
        "success": ("#DCFCE7", "#166534"),
    }
    fill, ink = palette.get(tone, palette["info"])
    data = [[P(f"<b>{title}</b> {text}", ParagraphStyle("NoteText", parent=st["small"], textColor=colors.HexColor(ink), leading=12))]]
    t = Table(data, colWidths=[6.6 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(fill)),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return [t, Spacer(1, 8)]


def table(data, widths, st):
    body = [[P(str(cell), st["small"]) for cell in row] for row in data]
    t = Table(body, colWidths=[w * inch for w in widths], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8EEF5")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
        ("FONTNAME", (0, 0), (-1, 0), FONT_BOLD if FONT_BOLD in pdfmetrics.getRegisteredFontNames() else "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def figure(no, filename, caption, st, width=6.45):
    src = IMG / filename
    with PILImage.open(src) as pil:
        px_w, px_h = pil.size
    draw_w = width * inch
    draw_h = draw_w * (px_h / px_w)
    max_h = 4.65 * inch
    if draw_h > max_h:
        scale = max_h / draw_h
        draw_w *= scale
        draw_h = max_h
    img = Image(str(src), width=draw_w, height=draw_h)
    img.hAlign = "CENTER"
    return KeepTogether([
        img,
        P(f"Gambar {no}. {caption}", st["caption"]),
    ])


def module(st, title, purpose, access, step_items, note_items, fig_no, fig_file, fig_caption):
    story = [
        heading(title, 1, st),
        P(f"<b>Tujuan modul.</b> {purpose}", st["body"]),
        P(f"<b>Akses pengguna.</b> {access}", st["body"]),
        figure(fig_no, fig_file, fig_caption, st),
        heading("Langkah Penggunaan", 2, st),
        *steps(step_items, st),
    ]
    if note_items:
        story.append(heading("Catatan Operasional", 2, st))
        story.extend(bullets(note_items, st))
    return story


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(FONT if FONT in pdfmetrics.getRegisteredFontNames() else "Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.drawString(0.75 * inch, 0.45 * inch, "Admin Solutions Inovatif - Technical User Manual")
    canvas.drawRightString(7.75 * inch, 0.45 * inch, f"Halaman {doc.page}")
    canvas.restoreState()


def build_story(st):
    story = []
    logo = ROOT / "public" / "logo.jpg"
    story.append(P("Technical User Manual", st["title"]))
    story.append(P("Aplikasi Admin Solutions Inovatif - Sistem Manajemen Bisnis & POS", st["subtitle"]))
    story.append(P(
        "Panduan pengguna teknis untuk operasional toko, kasir, inventaris, laporan, akuntansi, dan administrasi platform.<br/>"
        f"Versi dokumen: 1.0 | Tanggal: {tanggal_indonesia(datetime.now())}",
        st["meta"],
    ))
    if logo.exists():
        logo_img = Image(str(logo), width=1.1 * inch, height=1.1 * inch)
        story.append(logo_img)
        story.append(Spacer(1, 18))
    story.extend(note(
        "Ruang lingkup.",
        "Dokumen ini disusun berdasarkan tampilan dan perilaku aplikasi yang berjalan di lingkungan lokal pada saat pemeriksaan. Setiap modul dijelaskan sesuai menu, form, tombol, dan alur yang tersedia di aplikasi.",
        st,
        "info",
    ))
    story.append(PageBreak())

    story.append(heading("Daftar Isi", 1, st))
    toc = [
        "1. Pendahuluan", "2. Peran Pengguna dan Hak Akses", "3. Masuk ke Aplikasi",
        "4. Navigasi Umum", "5. Dashboard", "6. Kasir (POS)", "7. Produk",
        "8. Kategori", "9. Inventaris", "10. Transaksi", "11. Pelanggan",
        "12. Pemasok", "13. Laporan", "14. Akuntansi", "15. Karyawan",
        "16. Pengaturan", "17. Platform Admin", "18. Praktik Penggunaan yang Disarankan",
    ]
    story.extend([P(item, st["body"]) for item in toc])
    story.append(PageBreak())

    story.append(heading("Pendahuluan", 1, st))
    story.append(P("Admin Solutions Inovatif adalah aplikasi POS dan manajemen bisnis untuk membantu UMKM mengelola penjualan, produk, stok, pelanggan, pemasok, laporan, biaya operasional, dan pengaturan toko dalam satu sistem. Aplikasi menggunakan konsep tenant, sehingga data toko dipisahkan berdasarkan akun bisnis yang sedang digunakan.", st["body"]))
    story.append(P("Manual ini ditujukan untuk pengguna operasional, pemilik toko, dan administrator platform. Fokus panduan adalah cara menggunakan fitur dari antarmuka aplikasi, bukan konfigurasi teknis server atau pengembangan kode.", st["body"]))
    story.append(heading("Ringkasan Modul", 2, st))
    story.append(table([
        ["Modul", "Fungsi Utama", "Pengguna Umum"],
        ["Dashboard", "Memantau KPI penjualan, transaksi terbaru, dan peringatan stok.", "Owner, Cashier"],
        ["Kasir (POS)", "Memilih produk, mengelola keranjang, menerima pembayaran, dan mencetak struk.", "Owner, Cashier"],
        ["Produk & Kategori", "Mengelola katalog, harga, stok awal, gambar produk, dan pengelompokan kategori.", "Owner"],
        ["Inventaris", "Mencatat stok masuk, stok keluar, dan penyesuaian stok.", "Owner"],
        ["Transaksi", "Melihat riwayat transaksi, detail struk, dan melakukan refund bila berwenang.", "Owner, Cashier"],
        ["Laporan & Akuntansi", "Menganalisis penjualan, laba rugi, neraca, dan biaya operasional.", "Owner"],
        ["Karyawan & Pengaturan", "Mengelola pengguna toko, profil toko, pajak, logo, dan metode pembayaran.", "Owner"],
        ["Platform Admin", "Memantau tenant, paket layanan, status toko, dan statistik platform.", "Super Admin"],
    ], [1.35, 3.9, 1.35], st))

    story.append(heading("Peran Pengguna dan Hak Akses", 1, st))
    story.append(P("Aplikasi membedakan fitur berdasarkan peran pengguna. Menu yang tampil di sidebar akan menyesuaikan hak akses akun yang sedang login.", st["body"]))
    story.append(table([
        ["Peran", "Fokus Tugas", "Akses Utama", "Pembatasan"],
        ["Super Admin", "Mengelola platform", "Platform Admin, statistik tenant, paket layanan, status tenant", "Tidak digunakan untuk operasional kasir harian toko tertentu."],
        ["Owner", "Mengelola toko", "Semua modul operasional toko, laporan, akuntansi, karyawan, dan pengaturan", "Hanya melihat data tenant/toko miliknya."],
        ["Cashier", "Memproses penjualan", "Dashboard, POS, produk, kategori, inventaris, transaksi, pelanggan", "Tidak mengakses laporan, akuntansi, karyawan, pemasok, dan pengaturan."],
    ], [1.0, 1.45, 2.4, 1.75], st))

    story.append(heading("Masuk ke Aplikasi", 1, st))
    story.append(P("Pengguna memulai aktivitas dari halaman login. Masukkan alamat email dan kata sandi yang diberikan oleh administrator, lalu tekan tombol Masuk. Pengguna baru dapat memilih Daftar sekarang untuk membuat akun owner dan tenant baru apabila fitur registrasi diaktifkan.", st["body"]))
    story.append(figure(1, "01-login.png", "Halaman login aplikasi", st))
    story.append(heading("Langkah Login", 2, st))
    story.extend(steps([
        "Buka alamat aplikasi dari browser.",
        "Isi Alamat Email sesuai akun pengguna.",
        "Isi Kata Sandi. Gunakan ikon mata untuk menampilkan atau menyembunyikan kata sandi bila diperlukan.",
        "Klik Masuk. Jika kredensial valid, aplikasi mengarahkan pengguna ke Dashboard.",
        "Jika muncul pesan kesalahan, periksa kembali email, kata sandi, atau status akun pengguna.",
    ], st))
    story.extend(note("Peringatan.", "Jangan membagikan akun atau kata sandi antar pengguna. Setiap transaksi menyimpan informasi kasir sehingga akun harus digunakan oleh pemiliknya sendiri.", st, "warning"))

    story.append(heading("Navigasi Umum", 1, st))
    story.append(P("Setelah login, aplikasi menampilkan sidebar di sisi kiri, informasi pengguna, indikator tenant terisolasi untuk akun toko, top bar, dan ikon notifikasi. Klik menu sidebar untuk berpindah modul. Tombol Keluar berada di bagian bawah sidebar.", st["body"]))
    story.append(figure(2, "02-dashboard.png", "Dashboard utama dan navigasi aplikasi", st))
    story.extend(bullets([
        "Sidebar menampilkan modul sesuai hak akses pengguna.",
        "Top bar menampilkan nama halaman aktif dan tombol notifikasi.",
        "Panel notifikasi digunakan untuk informasi stok menipis, transaksi, pembayaran, dan refund.",
        "Pada layar kecil, sidebar dibuka melalui tombol menu di kiri atas.",
    ], st))

    story.extend(module(st, "Dashboard", "Dashboard memberi gambaran cepat atas performa toko, meliputi penjualan hari ini, penjualan bulan ini, jumlah produk, stok menipis, transaksi terbaru, total pelanggan, total karyawan, dan rata-rata transaksi.", "Owner dan Cashier dapat melihat dashboard. Data yang tampil mengikuti tenant/toko dari akun pengguna.", [
        "Buka menu Dashboard dari sidebar.",
        "Periksa kartu KPI untuk melihat kondisi penjualan dan stok secara cepat.",
        "Gunakan daftar Transaksi Terbaru untuk memantau aktivitas kasir terakhir.",
        "Perhatikan bagian Peringatan Stok Menipis. Produk pada bagian ini perlu diprioritaskan untuk restock atau penyesuaian stok.",
    ], [
        "Dashboard tidak digunakan untuk input data. Perubahan data dilakukan melalui modul POS, Produk, Inventaris, atau modul terkait.",
        "Nilai KPI akan berubah setelah transaksi, refund, atau mutasi stok berhasil tersimpan.",
    ], 3, "02-dashboard.png", "Ringkasan KPI, transaksi terbaru, dan peringatan stok"))

    story.extend(module(st, "Kasir (POS)", "Modul Kasir (POS) digunakan untuk memproses penjualan. Pengguna dapat mencari produk, memasukkan produk ke keranjang, memilih metode pembayaran, menggunakan split payment, menghitung kembalian, dan mencetak struk.", "Owner dan Cashier dapat mengakses POS. Metode pembayaran yang muncul mengikuti konfigurasi di Pengaturan.", [
        "Buka menu Kasir (POS).",
        "Cari produk melalui kolom pencarian berdasarkan nama produk, SKU, atau barcode.",
        "Klik kartu produk untuk memasukkannya ke Keranjang Belanja.",
        "Gunakan tombol plus atau minus untuk mengubah jumlah item. Gunakan ikon hapus untuk mengeluarkan item dari keranjang.",
        "Periksa subtotal, pajak, dan total.",
        "Pilih metode pembayaran, misalnya Tunai, QRIS, Bank Transfer, E-Wallet, atau Split Payment bila tersedia.",
        "Isi nominal pembayaran. Untuk pembayaran tunai, sistem menampilkan kembalian.",
        "Klik Bayar & Cetak Struk setelah nominal pembayaran cukup.",
    ], [
        "Produk dengan stok 0 tidak dapat ditambahkan ke keranjang.",
        "Tombol bayar tidak aktif jika keranjang kosong, metode pembayaran tidak tersedia, atau nominal pembayaran kurang dari total.",
        "Setelah checkout berhasil, stok produk berkurang dan struk dapat dicetak ulang dari dialog sukses.",
    ], 4, "03-pos.png", "Modul POS dengan produk, keranjang, pembayaran, dan tombol cetak struk"))

    story.append(heading("Produk", 1, st))
    story.append(P("Modul Produk berfungsi sebagai master katalog barang yang dijual. Halaman ini menampilkan pencarian, filter kategori, tabel produk, harga beli, harga jual, stok, status, dan tombol aksi untuk pengguna yang memiliki hak kelola.", st["body"]))
    story.append(figure(5, "04-products.png", "Daftar produk, pencarian, filter, dan aksi produk", st))
    story.extend(steps([
        "Buka menu Produk.",
        "Gunakan kolom Cari produk untuk menemukan produk berdasarkan nama atau SKU.",
        "Gunakan filter Semua kategori untuk membatasi tampilan berdasarkan kategori.",
        "Klik Tambah Produk untuk membuat produk baru.",
        "Gunakan ikon pensil untuk mengubah produk dan ikon hapus untuk menghapus produk bila diperlukan.",
    ], st))
    story.append(heading("Menambah atau Mengubah Produk", 2, st))
    story.append(P("Form produk memuat nama, SKU, barcode, kategori, harga beli, harga jual, stok awal, stok minimum, gambar produk, deskripsi, dan status untuk mode edit.", st["body"]))
    story.append(figure(6, "05-product-form.png", "Form tambah atau ubah produk", st))
    story.extend(steps([
        "Isi Nama Produk dan SKU sebagai data wajib.",
        "Isi Barcode bila produk memiliki kode barcode.",
        "Pilih Kategori bila produk perlu dikelompokkan.",
        "Masukkan Harga Beli dan Harga Jual.",
        "Isi Stok Awal dan Stok Minimum agar dashboard dapat memberi peringatan stok menipis.",
        "Unggah gambar produk bila tersedia.",
        "Klik Tambah Produk atau Simpan Perubahan.",
    ], st))

    modules = [
        ("Kategori", "Kategori membantu mengelompokkan produk agar pencarian, filter, dan pelaporan katalog lebih rapi.", "Owner dapat menambah, mengubah, dan menghapus kategori. Cashier dapat melihat kategori sesuai menu yang tampil.", [
            "Buka menu Kategori.", "Klik Tambah Kategori.", "Isi Nama Kategori, Keterangan, dan pilih warna kategori.", "Klik Tambah Kategori atau Simpan Kategori.", "Gunakan tombol Ubah untuk memperbarui kategori dan ikon hapus untuk menghapus kategori.",
        ], ["Jumlah produk pada kartu kategori menunjukkan berapa produk yang terhubung dengan kategori tersebut.", "Sebelum menghapus kategori, pastikan dampaknya terhadap produk yang sedang memakai kategori tersebut sudah dipahami."], 7, "06-categories.png", "Daftar kategori produk"),
        ("Inventaris", "Inventaris digunakan untuk mencatat riwayat perubahan stok. Sistem membedakan mutasi menjadi Stok Masuk, Stok Keluar, dan Penyesuaian. Halaman juga menampilkan indikator produk yang berada di bawah stok minimum.", "Owner dapat mencatat mutasi stok. Cashier dapat melihat data jika menu tersedia.", [
            "Buka menu Inventaris.", "Periksa pesan stok menipis di bagian atas halaman.", "Baca tabel riwayat mutasi untuk mengetahui jenis perubahan, produk, jumlah, stok saat ini, keterangan, dan tanggal.", "Klik Mutasi Stok untuk menambah catatan stok baru.", "Pilih jenis mutasi, produk, jumlah, dan isi catatan sebelum menyimpan.",
        ], ["Catatan mutasi membantu audit stok.", "Produk stok menipis perlu segera ditindaklanjuti."], 8, "07-inventory.png", "Riwayat mutasi stok dan indikator stok menipis"),
        ("Transaksi", "Modul Transaksi menampilkan daftar struk penjualan, filter tanggal, status pembayaran, metode pembayaran, total transaksi, detail item, dan fungsi refund untuk pengguna berwenang.", "Owner dan Cashier dapat melihat riwayat transaksi. Refund tersedia untuk pengguna yang memiliki hak kelola.", [
            "Buka menu Transaksi.", "Gunakan filter Dari dan Hingga untuk membatasi periode transaksi.", "Klik ikon mata pada baris transaksi untuk membuka detail struk.", "Periksa item, subtotal, pajak, diskon, total, metode pembayaran, kasir, pelanggan, dan status.", "Jika perlu dan memiliki hak akses, klik Refund Transaksi pada transaksi berstatus LUNAS.",
        ], ["Refund mengubah status transaksi dan memengaruhi ringkasan laporan.", "Gunakan refund hanya untuk pembatalan transaksi yang benar-benar sah secara operasional."], 10, "09-transactions.png", "Daftar transaksi dan filter periode"),
        ("Pelanggan", "Modul Pelanggan menyimpan data pelanggan berupa nama, nomor telepon, email, alamat, dan jumlah transaksi yang pernah dilakukan.", "Owner dapat menambah, mengubah, dan menghapus pelanggan. Cashier dapat melihat data pelanggan jika menu tersedia.", [
            "Buka menu Pelanggan.", "Gunakan kolom Cari pelanggan untuk menemukan data pelanggan.", "Klik Tambah Pelanggan untuk membuat data baru.", "Isi Nama Pelanggan sebagai data wajib, lalu lengkapi nomor telepon, email, dan alamat jika tersedia.", "Gunakan ikon pensil untuk mengubah data dan ikon hapus untuk menghapus data.",
        ], ["Data pelanggan membantu riwayat transaksi lebih mudah ditelusuri.", "Pastikan data kontak diisi dengan format yang konsisten agar mudah dicari."], 11, "10-customers.png", "Daftar pelanggan dan pencarian pelanggan"),
        ("Pemasok", "Modul Pemasok menyimpan data pihak pemasok barang, termasuk contact person, nomor telepon, email, alamat, dan jumlah purchase order terkait.", "Owner dapat mengelola data pemasok. Menu ini tidak ditampilkan untuk Cashier.", [
            "Buka menu Pemasok.", "Klik Tambah Pemasok.", "Isi Nama Pemasok sebagai data wajib.", "Lengkapi Contact Person, nomor telepon, email, dan alamat.", "Klik Tambah Pemasok atau Simpan Perubahan.", "Gunakan ikon pensil untuk mengubah data dan ikon hapus untuk menghapus pemasok.",
        ], ["Data pemasok mendukung pengelolaan pengadaan dan histori purchase order.", "Gunakan nama pemasok yang konsisten agar mudah dibedakan pada laporan atau proses pembelian."], 12, "11-suppliers.png", "Daftar pemasok"),
        ("Laporan", "Modul Laporan menampilkan analisis penjualan berdasarkan periode, termasuk total pendapatan, laba bersih, jumlah transaksi, rata-rata transaksi, pajak terkumpul, grafik penjualan harian, produk terlaris, dan rincian metode pembayaran.", "Owner dapat mengakses laporan. Cashier tidak melihat menu ini.", [
            "Buka menu Laporan.", "Pilih tanggal awal dan tanggal akhir periode laporan.", "Periksa kartu ringkasan pendapatan, laba, transaksi, pajak, dan diskon.", "Gunakan grafik Penjualan Harian untuk melihat pola penjualan per hari.", "Lihat Produk Terlaris untuk mengetahui produk dengan performa terbaik.", "Lihat Metode Pembayaran untuk memantau distribusi pembayaran.",
        ], ["Periode default mengikuti bulan berjalan.", "Laporan bergantung pada transaksi yang berhasil dan data refund yang tercatat."], 13, "12-reports.png", "Laporan penjualan dan analisis performa"),
    ]
    for m in modules:
        story.extend(module(st, *m))
        if m[0] == "Inventaris":
            story.append(heading("Mencatat Mutasi Stok", 2, st))
            story.append(P("Form mutasi stok digunakan saat pengguna perlu menambah stok, mengurangi stok, atau melakukan penyesuaian karena selisih fisik dengan catatan sistem.", st["body"]))
            story.append(figure(9, "08-inventory-form.png", "Form mutasi stok", st))
            story.extend(steps([
                "Pilih Jenis Mutasi: Stok Masuk, Stok Keluar, atau Penyesuaian Stok.",
                "Pilih Produk yang akan diubah stoknya.",
                "Masukkan Jumlah.",
                "Isi Catatan atau Alasan agar riwayat stok mudah diaudit.",
                "Klik Simpan Mutasi.",
            ], st))

    story.append(heading("Akuntansi", 1, st))
    story.append(P("Modul Akuntansi terdiri dari tiga tab: Laba Rugi, Neraca Keuangan, dan Biaya Operasional. Modul ini membantu owner melihat kesehatan keuangan toko dari sisi pendapatan, HPP, beban, laba, aset, liabilitas, ekuitas, dan pengeluaran.", st["body"]))
    story.append(figure(14, "13-accounting-profit-loss.png", "Tab Laba Rugi pada modul Akuntansi", st))
    story.append(heading("Tab Laba Rugi", 2, st))
    story.extend(steps(["Pilih tab Laba Rugi.", "Tentukan tanggal awal dan akhir periode.", "Periksa Pendapatan Usaha, HPP, Laba Kotor, Beban Operasional, dan Laba Bersih.", "Gunakan grafik pendapatan vs beban untuk memahami proporsi biaya terhadap penjualan.", "Periksa rincian beban operasional untuk mengetahui kategori biaya terbesar."], st))
    story.append(heading("Tab Neraca Keuangan", 2, st))
    story.extend(steps(["Pilih tab Neraca Keuangan.", "Tentukan tanggal neraca pada field Per tanggal.", "Periksa status Seimbang atau Belum Seimbang.", "Bandingkan total aset dengan total liabilitas dan ekuitas."], st))
    story.append(heading("Tab Biaya Operasional", 2, st))
    story.append(P("Tab Biaya Operasional digunakan untuk mencatat pengeluaran seperti sewa tempat, utilitas, gaji, pemasaran, perlengkapan, dan biaya lainnya.", st["body"]))
    story.append(figure(15, "14-accounting-expenses.png", "Tab Biaya Operasional dan tombol catat pengeluaran", st))
    story.extend(steps(["Pilih tab Biaya Operasional.", "Gunakan filter tanggal untuk menentukan periode biaya.", "Klik Catat Pengeluaran.", "Pilih kategori, isi keterangan, nominal, dan tanggal.", "Klik Simpan Pengeluaran.", "Gunakan ikon hapus untuk menghapus pengeluaran yang salah input."], st))

    story.extend(module(st, "Karyawan", "Modul Karyawan digunakan untuk mengelola akun pengguna toko, termasuk nama, email, peran, status, tanggal bergabung, dan kata sandi.", "Owner dapat mengelola karyawan. Super Admin memiliki cakupan platform, sedangkan Cashier tidak mengakses modul ini.", [
        "Buka menu Karyawan.", "Klik Tambah Karyawan.", "Isi Nama Karyawan, Alamat Email, dan Kata Sandi.", "Pilih Peran: Kasir atau Pemilik (Owner).", "Pilih Status: Aktif atau Nonaktif.", "Klik Tambah Karyawan atau Simpan Perubahan.", "Pada mode edit, kosongkan field kata sandi jika tidak ingin mengubah kata sandi pengguna.",
    ], ["Nonaktifkan akun karyawan yang sudah tidak bertugas agar tidak dapat digunakan untuk login.", "Gunakan peran Cashier untuk staf kasir harian dan Owner hanya untuk pengguna yang boleh melihat laporan serta pengaturan."], 16, "15-employees.png", "Daftar karyawan, peran, status, dan aksi"))

    story.append(heading("Pengaturan", 1, st))
    story.append(P("Modul Pengaturan berisi Profil Toko, Metode Pembayaran, dan Informasi Akun. Pengaturan ini memengaruhi identitas toko, pajak pada transaksi POS, logo struk, serta metode pembayaran yang dapat dipilih kasir.", st["body"]))
    story.append(figure(17, "16-settings-crop.png", "Profil toko, metode pembayaran, dan informasi akun", st))
    story.extend(steps(["Buka menu Pengaturan.", "Pada Profil Toko, lengkapi nama toko, email, nomor telepon, jam operasional, alamat, mata uang, tarif pajak, dan template struk.", "Klik Unggah logo untuk mengganti logo toko.", "Klik Simpan Perubahan untuk menyimpan profil toko.", "Pada Metode Pembayaran, aktifkan atau nonaktifkan metode pembayaran menggunakan switch.", "Periksa Informasi Akun untuk melihat paket layanan, status, ID tenant, dan tanggal pendaftaran."], st))
    story.extend(note("Tips.", "Pastikan tarif pajak diperiksa sebelum POS digunakan. Perubahan tarif pajak akan memengaruhi perhitungan total transaksi berikutnya.", st, "success"))

    story.extend(module(st, "Platform Admin", "Platform Admin digunakan oleh Super Admin untuk memantau tenant/toko, statistik platform, paket layanan, status tenant, jumlah pengguna, jumlah produk, total transaksi, dan GMV.", "Hanya Super Admin yang dapat mengakses halaman ini.", [
        "Login menggunakan akun Super Admin.", "Buka menu Platform Admin.", "Periksa statistik Total Toko, Total Pengguna, Total Transaksi, dan GMV Platform.", "Lihat kartu paket layanan untuk memahami batas produk, karyawan, dan fitur.", "Pada tabel Daftar Toko UMKM, ubah paket tenant melalui dropdown Paket bila diperlukan.", "Klik Tangguhkan untuk menonaktifkan tenant aktif, atau Aktifkan untuk mengaktifkan kembali tenant yang ditangguhkan.",
    ], ["Perubahan paket dan status tenant berdampak pada akses operasional toko.", "Gunakan tindakan tangguhkan hanya berdasarkan prosedur bisnis yang disepakati perusahaan."], 18, "17-platform-admin.png", "Halaman Platform Admin untuk pengelolaan tenant"))

    story.append(heading("Praktik Penggunaan yang Disarankan", 1, st))
    story.append(heading("Rutinitas Harian Kasir", 2, st))
    story.extend(bullets(["Login menggunakan akun pribadi.", "Periksa Dashboard untuk melihat kondisi awal transaksi dan stok.", "Gunakan POS untuk setiap penjualan dan pastikan pembayaran cukup sebelum checkout.", "Cetak atau cetak ulang struk bila pelanggan membutuhkan bukti transaksi.", "Logout setelah shift selesai."], st))
    story.append(heading("Rutinitas Harian Owner", 2, st))
    story.extend(bullets(["Pantau stok menipis dari Dashboard dan Inventaris.", "Perbarui produk, harga, dan stok sebelum toko beroperasi.", "Cek Transaksi dan Laporan untuk memastikan penjualan tercatat wajar.", "Catat biaya operasional secara rutin agar laporan laba rugi lebih akurat.", "Kelola status karyawan sesuai perubahan staf."], st))
    story.append(heading("Kontrol Data dan Keamanan", 2, st))
    story.extend(bullets(["Gunakan akun terpisah untuk setiap pengguna.", "Batasi peran Owner hanya kepada pengguna yang memang berwenang.", "Periksa ulang sebelum menghapus produk, kategori, pelanggan, pemasok, karyawan, atau biaya operasional.", "Lakukan refund hanya bila transaksi valid untuk dibatalkan.", "Jaga konsistensi data master agar laporan dan pencarian tetap akurat."], st))
    story.append(Spacer(1, 24))
    story.append(P("<b>Akhir Dokumen</b>", ParagraphStyle("End", parent=st["body"], alignment=TA_CENTER, textColor=colors.HexColor("#0F766E"))))
    return story


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    register_fonts()
    st = styles()
    doc = SimpleDocTemplate(
        str(PDF),
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.72 * inch,
        bottomMargin=0.72 * inch,
        title="Technical User Manual Admin Solutions Inovatif POS",
        author="Admin Solutions Inovatif",
    )
    doc.build(build_story(st), onFirstPage=header_footer, onLaterPages=header_footer)
    print(PDF)


if __name__ == "__main__":
    main()
