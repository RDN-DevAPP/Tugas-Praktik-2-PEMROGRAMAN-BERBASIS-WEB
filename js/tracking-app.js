/**
 * SITTA (Sistem Informasi Tata Kelola Bahan Ajar) - Universitas Terbuka
 * tracking-app.js: Mengatur registrasi pengiriman dan simulasi pelacakan (tracking) Delivery Order secara dinamis dengan Vue 3.
 * 
 * Memenuhi Kriteria Penilaian:
 * 1. Data Binding & Form Input (v-model)
 * 2. Conditional Rendering (v-if untuk rincian paket)
 * 3. Computed Properties:
 *    - autoDoNumber: Menggenerasikan nomor DO otomatis (format: DO[Tahun]-[Sequence]) menggunakan fungsi Date JavaScript.
 *    - selectedPackageDetails: Mencari isi & data detail dari paket terpilih.
 *    - calculatedTotal: Menghitung total harga paket otomatis yang kemudian diformat ke Rupiah.
 * 4. Watchers Wajib (Minimal 2 Watchers):
 *    - Watcher 1 ('newDO.paket'): Memantau pilihan paket untuk menyelaraskan harga dasar.
 *    - Watcher 2 ('newDO.nim'): Memantau input NIM mahasiswa secara ketat, membatasi max 9 digit, menyaring non-angka, serta memberikan peringatan peringatan instan (real-time).
 * 5. Metode Simulasi Timeline:
 *    - getTimelineStyle(): Menghitung progress bar logistik vertikal berdasarkan kata kunci status pengiriman secara dinamis.
 */

const { createApp } = Vue;

createApp({
  data() {
    return {
      // Membaca data pengiriman logistik & paket global dari dataBahanAjar.js
      trackingData: DUMMY_DATA.tracking,
      paketList: DUMMY_DATA.paket,
      pengirimanList: DUMMY_DATA.pengirimanList,
      
      // State Input Form Baru
      newDO: {
        noDO: '',
        nim: '',
        nama: '',
        ekspedisi: '',
        paket: '',
        tanggalKirim: '',
        total: 0
      },
      
      // Kontrol Hamburger Menu
      isMenuOpen: false,
      
      // Menyimpan data item DO yang sedang dilacak pada timeline
      selectedDO: null,
      
      // Reactive Success Alert Object
      successAlert: {
        visible: false,
        message: '',
        noDO: ''
      },
      
      // Reactive Error Object untuk validasi form interaktif
      errors: {
        nim: '',
        nama: '',
        ekspedisi: '',
        paket: ''
      }
    };
  },
  
  // Mounted Lifecycle Hook: Inisialisasi data tanggal default kirim (local time)
  mounted() {
    this.setTodayDate();
  },
  
  computed: {
    // COMPUTED PROPERTY 1: Auto-generate nomor DO dengan format DO[Tahun]-[Sequence] secara dinamis
    autoDoNumber() {
      const year = new Date().getFullYear(); // Mengambil tahun saat ini memakai objek Date
      const seqStr = String(this.trackingData.length + 1).padStart(3, '0'); // Membuat nomor urut 3 digit
      return `DO${year}-${seqStr}`;
    },
    
    // COMPUTED PROPERTY 2: Mendapatkan rincian paket terpilih secara real-time
    selectedPackageDetails() {
      return this.paketList.find(p => p.kode === this.newDO.paket) || null;
    },
    
    // COMPUTED PROPERTY 3: Menghitung total biaya pengiriman berdasarkan jenis paket dan ekspedisi secara dinamis
    calculatedTotal() {
      if (!this.newDO.paket) return 0;
      const pkg = this.paketList.find(p => p.kode === this.newDO.paket);
      let basePrice = pkg ? pkg.harga : 0;
      
      // Menambahkan biaya tambahan secara otomatis jika memilih Ekspedisi Ekspres (EXP)
      if (this.newDO.ekspedisi === 'EXP') {
        basePrice += 25000; 
      }
      return basePrice;
    }
  },
  
  methods: {
    // Set Tanggal Kirim ke hari ini berdasar local time zona pengguna
    setTodayDate() {
      const today = new Date().toISOString().split('T')[0];
      this.newDO.tanggalKirim = today;
    },
    
    // Konversi nilai angka menjadi format mata uang Rupiah yang rapi
    formatPrice(val) {
      return new Intl.NumberFormat('id-ID').format(val);
    },
    
    // Mendapatkan nama lengkap paket berdasarkan kode uniknya
    getPackageName(kode) {
      const p = this.paketList.find(x => x.kode === kode);
      return p ? p.nama : kode;
    },
    
    // Menampilkan detail status kurir dan menggulir ke area timeline pelacakan
    viewDO(doItem) {
      this.selectedDO = doItem;
      // Scroll secara smooth ke area visual timeline di bagian bawah
      this.$nextTick(() => {
        const element = document.getElementById('timeline-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      });
    },
    
    // Logika Pemrosesan Validasi Form & Pendaftaran DO Baru
    createDO() {
      // Mengosongkan data error sebelumnya
      this.errors = { nim: '', nama: '', ekspedisi: '', paket: '' };
      let isValid = true;
      
      // Validasi 1: NIM harus diisi tepat 9 digit angka
      if (!this.newDO.nim) {
        this.errors.nim = "NIM mahasiswa wajib diisi!";
        isValid = false;
      } else if (this.newDO.nim.length !== 9) {
        this.errors.nim = "NIM harus bernilai tepat 9 digit angka!";
        isValid = false;
      }
      
      // Validasi 2: Nama Penerima wajib diisi
      if (!this.newDO.nama.trim()) {
        this.errors.nama = "Nama penerima wajib diisi!";
        isValid = false;
      }
      
      // Validasi 3: Kurir ekspedisi wajib dipilih
      if (!this.newDO.ekspedisi) {
        this.errors.ekspedisi = "Silakan pilih ekspedisi kurir!";
        isValid = false;
      }
      
      // Validasi 4: Paket bahan ajar wajib ditentukan
      if (!this.newDO.paket) {
        this.errors.paket = "Silakan tentukan paket bahan ajar!";
        isValid = false;
      }
      
      // Jika salah satu validasi gagal, batalkan proses pendaftaran
      if (!isValid) return;
      
      // Mendaftarkan data baru dengan menyertakan Nomor DO terkomputasi dan harga akhir terhitung
      const finalDO = {
        noDO: this.autoDoNumber,
        tanggalKirim: this.newDO.tanggalKirim,
        nim: this.newDO.nim,
        nama: this.newDO.nama,
        ekspedisi: this.newDO.ekspedisi === 'EXP' ? 'Ekspres (1-2 hari)' : 'Reguler (3-5 hari)',
        paket: this.newDO.paket,
        total: this.calculatedTotal,
        status: 'Dalam Perjalanan' // Status awal pengiriman logistik
      };
      
      // Memasukkan transaksi baru ke awal daftar array
      this.trackingData.unshift(finalDO);
      
      // Memicu Alert Umpan Balik Visual Kustom Sukses (Tanpa Native Pop-up)
      this.successAlert = {
        visible: true,
        message: 'Delivery Order Berhasil Didaftarkan!',
        noDO: finalDO.noDO
      };
      
      // Auto-hide alert setelah 5 detik agar bersih
      setTimeout(() => {
        this.successAlert.visible = false;
      }, 5000);
      
      // Reset isian form ke default awal
      this.resetForm();
    },
    
    // Toggle menu navigasi seluler di smartphone
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    },
    
    // Reset seluruh variabel form pendaftaran
    resetForm() {
      this.newDO = {
        noDO: '',
        nim: '',
        nama: '',
        ekspedisi: '',
        paket: '',
        tanggalKirim: '',
        total: 0
      };
      this.errors = { nim: '', nama: '', ekspedisi: '', paket: '' };
      this.setTodayDate();
    },
    
    // Menerjemahkan status teks logistik ke highlight warna border vertikal timeline secara murni
    getTimelineStyle(status, step) {
      let currentStep = 1;
      let statLower = (status || '').toLowerCase();
      
      // Deteksi kata kunci status logistik secara cerdas
      if (statLower.includes('perjalanan') || statLower.includes('proses') || statLower.includes('kirim')) {
        currentStep = 2;
      }
      if (statLower.includes('selesai') || statLower.includes('terkirim') || statLower.includes('sampai')) {
        currentStep = 3;
      }
      
      if (step < currentStep) {
        // Tahap yang telah berhasil diselesaikan sebelumnya (Border Hijau)
        return { borderLeft: '4px solid var(--success)', opacity: 1, backgroundColor: '#f0fdf4' };
      } else if (step === currentStep) {
        // Tahap yang saat ini sedang aktif (Border Oranye menyala)
        return { borderLeft: '4px solid var(--warning)', opacity: 1, backgroundColor: '#fffbeb' };
      } else {
        // Tahap di masa mendatang yang belum diproses (Garis abu-abu pudar)
        return { borderLeft: '4px solid #cbd5e1', opacity: 0.5 };
      }
    }
  },
  
  watch: {
    // WATCHER 1: Memantau perubahan Paket Bahan Ajar terpilih
    'newDO.paket'(newVal) {
      if (newVal) {
        const pkg = this.paketList.find(p => p.kode === newVal);
        if (pkg) {
          // Menyelaraskan nominal harga dasar paket secara reaktif
          this.newDO.total = pkg.harga;
        }
      } else {
        this.newDO.total = 0;
      }
    },
    
    // WATCHER 2: Memantau NIM Mahasiswa secara interaktif (Sanitasi karakter dan validasi instan)
    'newDO.nim'(newVal) {
      if (newVal) {
        // Membersihkan karakter selain digit angka (Regex)
        const sanitized = newVal.replace(/\D/g, '');
        
        if (sanitized !== newVal) {
          this.errors.nim = "⚠️ Peringatan: NIM hanya boleh diisi dengan angka saja!";
        } else if (sanitized.length > 9) {
          this.errors.nim = "⚠️ Peringatan: Batas maksimal NIM mahasiswa adalah 9 digit!";
        } else if (sanitized.length < 9) {
          this.errors.nim = "NIM harus diisi tepat 9 digit angka.";
        } else {
          this.errors.nim = ""; // NIM valid & bersih
        }
        
        // Simpan hanya nilai angka yang bersih dan batasi maksimum 9 digit
        this.newDO.nim = sanitized.substring(0, 9);
      } else {
        this.errors.nim = "NIM wajib ditentukan.";
      }
    }
  }
}).mount('#app');
