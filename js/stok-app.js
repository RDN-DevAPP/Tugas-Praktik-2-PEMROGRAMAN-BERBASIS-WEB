/**
 * SITTA (Sistem Informasi Tata Kelola Bahan Ajar) - Universitas Terbuka
 * stok-app.js: Mengatur seluruh alur logika inventaris bahan ajar berbasis kartu dengan Vue 3
 * 
 * Kriteria Penilaian yang Dipenuhi:
 * 1. Data Binding & List Rendering (v-bind, v-model, v-for, v-if)
 * 2. Dependent Filter (UT-Daerah -> Kategori)
 * 3. Sorting & Advanced Filtering (Computed)
 * 4. CRUD Simulative (Add & Edit dengan validasi modal)
 * 5. Minimal 2 Watchers untuk memantau perubahan data secara interaktif
 */

const { createApp } = Vue;

createApp({
  data() {
    return {
      // Membaca data dummy secara global dari dataBahanAjar.js
      stok: DUMMY_DATA.stok,
      upbjjList: DUMMY_DATA.upbjjList,
      kategoriList: DUMMY_DATA.kategoriList,
      
      // Filter State
      filters: {
        upbjj: '',
        kategori: '',
        reorderOnly: false
      },
      sortBy: 'judul',
      
      // Form State (Untuk Tambah/Edit Buku)
      form: {
        kode: '',
        judul: '',
        kategori: '',
        upbjj: '',
        lokasiRak: '',
        harga: 0,
        qty: 0,
        safety: 10,
        catatanHTML: ''
      },
      
      // UI States (Mengontrol Menu Hamburger dan Pop-Up Modal)
      isEditing: false,
      isMenuOpen: false,
      showModal: false,
      
      // Reactive Alert State yang diaktifkan oleh Watcher
      isReorderAlertVisible: false,
      
      // Reactive Success Alert Pop-up
      successAlert: {
        visible: false,
        kode: ''
      },
      
      // Form Warning Box (Watcher memantau batas safety stock secara real-time)
      formWarning: '',
      
      // Form Validation Errors
      errors: {}
    };
  },
  computed: {
    // Computed Property untuk memproses penyaringan & pengurutan kartu secara efisien
    filteredStok() {
      let result = this.stok;

      // 1. Filter berdasar UT-Daerah (UPBJJ)
      if (this.filters.upbjj) {
        result = result.filter(item => item.upbjj === this.filters.upbjj);
      }

      // 2. Filter berdasar Kategori (Hanya aktif jika UT-Daerah sudah terpilih)
      if (this.filters.upbjj && this.filters.kategori) {
        result = result.filter(item => item.kategori === this.filters.kategori);
      }

      // 3. Filter Re-order: menyaring barang dengan qty < safety stock ATAU qty == 0
      if (this.filters.reorderOnly) {
        result = result.filter(item => item.qty < item.safety || item.qty === 0);
      }

      // 4. Pengurutan Data (Sorting)
      result = [...result].sort((a, b) => {
        if (this.sortBy === 'judul') {
          return a.judul.localeCompare(b.judul);
        } else if (this.sortBy === 'qty') {
          return a.qty - b.qty;
        } else if (this.sortBy === 'harga') {
          return a.harga - b.harga;
        }
        return 0;
      });

      return result;
    }
  },
  methods: {
    // Toggles hamburger menu drawer di smartphone
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    },
    
    // Reset semua parameter filter ke default awal
    resetFilters() {
      this.filters.upbjj = '';
      this.filters.kategori = '';
      this.filters.reorderOnly = false;
      this.sortBy = 'judul';
    },
    
    // Membuka modal form dalam mode "Tambah"
    openAddModal() {
      this.isEditing = false;
      this.resetForm();
      this.showModal = true;
    },
    
    // Mengisi form dengan data kartu terpilih untuk mode "Edit"
    editItem(item) {
      this.isEditing = true;
      this.form = { ...item };
      this.errors = {};
      this.showModal = true;
    },
    
    // Menutup pop-up modal
    closeModal() {
      this.showModal = false;
      this.resetForm();
    },
    
    // Validasi input form secara interaktif sebelum penyimpanan dilakukan
    validateForm() {
      this.errors = {};
      if (!this.form.kode.trim()) this.errors.kode = "Kode Mata Kuliah wajib diisi.";
      if (!this.form.judul.trim()) this.errors.judul = "Judul Mata Kuliah wajib diisi.";
      if (!this.form.kategori) this.errors.kategori = "Silakan pilih Kategori Buku.";
      if (!this.form.upbjj) this.errors.upbjj = "Silakan pilih Daerah UPBJJ.";
      if (!this.form.lokasiRak.trim()) this.errors.lokasiRak = "Lokasi Rak wajib ditentukan.";
      if (this.form.harga <= 0) this.errors.harga = "Harga satuan harus bernilai positif.";
      if (this.form.qty < 0) this.errors.qty = "Jumlah Qty tidak boleh bernilai negatif.";
      if (this.form.safety <= 0) this.errors.safety = "Batas safety minimal bernilai 1.";
      
      return Object.keys(this.errors).length === 0;
    },
    
    // Menyimpan data ajar (Simulasi Update array lokal)
    saveItem() {
      if (!this.validateForm()) {
        return; // Menghentikan proses simpan jika validasi gagal
      }
      
      const savedKode = this.form.kode;
      
      if (this.isEditing) {
        // Mode Edit: Cari dan perbarui index item
        const index = this.stok.findIndex(i => i.kode === this.form.kode);
        if (index !== -1) {
          this.stok[index] = { ...this.form };
        }
      } else {
        // Mode Tambah: Pastikan kode mata kuliah unik
        if (this.stok.some(i => i.kode.toUpperCase() === this.form.kode.toUpperCase())) {
          this.errors.kode = "Kode Mata Kuliah ini sudah terdaftar!";
          return;
        }
        this.stok.push({ ...this.form });
      }
      
      this.closeModal();
      
      // Memicu Floating Success Pop-up Alert Modal (Tanpa Native pop-up)
      this.successAlert = {
        visible: true,
        kode: savedKode
      };
      
      // Tutup otomatis pop-up setelah 5 detik agar bersih
      setTimeout(() => {
        this.successAlert.visible = false;
      }, 5000);
    },
    
    // Reset isi variabel form ke default
    resetForm() {
      this.form = {
        kode: '',
        judul: '',
        kategori: '',
        upbjj: '',
        lokasiRak: '',
        harga: 0,
        qty: 0,
        safety: 10,
        catatanHTML: ''
      };
      this.errors = {};
      this.formWarning = '';
    },
    
    // Format mata uang rupiah
    formatPrice(val) {
      return new Intl.NumberFormat('id-ID').format(val);
    }
  },
  watch: {
    // WATCHER 1: Mereset otomatis filter Kategori jika filter UT-Daerah di-reset/dikosongkan
    'filters.upbjj'(newVal) {
      if (!newVal) {
        this.filters.kategori = '';
      }
    },
    
    // WATCHER 2: Memantau status aktif checkbox "Stok Re-order" untuk menampilkan banner pemberitahuan
    'filters.reorderOnly'(newVal) {
      if (newVal === true) {
        this.isReorderAlertVisible = true;
      } else {
        this.isReorderAlertVisible = false;
      }
    },
    
    // WATCHER TAMBAHAN: Memantau rasio Qty / Safety Stock di dalam form input untuk warning instan
    'form.qty'(newQty) {
      if (newQty < this.form.safety && newQty > 0) {
        this.formWarning = `⚠️ Perhatian: Qty berada di bawah batas safety stock (${this.form.safety} Pcs)!`;
      } else if (newQty === 0) {
        this.formWarning = `🚨 Bahaya: Jumlah stok kosong (habis)!`;
      } else {
        this.formWarning = '';
      }
    },
    'form.safety'(newSafety) {
      if (this.form.qty < newSafety && this.form.qty > 0) {
        this.formWarning = `⚠️ Perhatian: Qty berada di bawah batas safety stock (${newSafety} Pcs)!`;
      } else if (this.form.qty === 0) {
        this.formWarning = `🚨 Bahaya: Jumlah stok kosong (habis)!`;
      } else {
        this.formWarning = '';
      }
    }
  }
}).mount('#app');
