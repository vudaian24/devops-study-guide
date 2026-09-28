/* ============================================================
   tts.js — đọc câu hỏi và gợi ý thành tiếng.

   Dùng Web Speech API có sẵn trong trình duyệt: không backend,
   không API key, không thư viện ngoài, chạy được cả khi offline
   (miễn là máy có sẵn giọng đọc).

   Giọng tiếng Việt lấy ở đâu:
     - Android : Google Text-to-speech, thường có sẵn
     - iPhone  : giọng Linh, dựng sẵn trong iOS
     - Linux   : speech-dispatcher + espeak-ng (giọng máy, hơi robot)
   Không có giọng nào thì module tự báo để giao diện hiện lời nhắc.
   ============================================================ */

const TTS = (() => {

  const hoTro = typeof window !== "undefined"
    && "speechSynthesis" in window
    && "SpeechSynthesisUtterance" in window;

  const KEY = "warroom.tts";
  let giongs = [], tenGiong = null, tocDo = 1;
  let huy = false, dangDoc = false;
  let bao = () => {};

  try {
    const l = JSON.parse(localStorage.getItem(KEY) || "{}");
    tenGiong = l.giong || null;
    tocDo = Number(l.tocDo) || 1;
  } catch (e) {}

  const luu = () => {
    try { localStorage.setItem(KEY, JSON.stringify({ giong: tenGiong, tocDo })); } catch (e) {}
  };

  /* ---------- Giọng ---------- */
  function napGiong() {
    giongs = hoTro ? (speechSynthesis.getVoices() || []) : [];
    return giongs;
  }

  const giongViet = () => giongs.filter(v => /^vi\b|^vi[-_]/i.test(v.lang));

  function giongDangDung() {
    if (!giongs.length) return null;
    if (tenGiong) {
      const g = giongs.find(v => v.name === tenGiong);
      if (g) return g;
    }
    const vi = giongViet();
    return vi.find(v => /vi[-_]VN/i.test(v.lang)) || vi[0] || null;
  }

  if (hoTro) {
    napGiong();
    // Chrome nạp giọng bất đồng bộ, lần gọi đầu thường trả về mảng rỗng
    speechSynthesis.onvoiceschanged = () => { napGiong(); bao("giong"); };
  }

  /* ---------- Chuẩn hoá chữ trước khi đọc ----------
     Ký hiệu trong bài viết ra để đọc bằng mắt, đọc thành tiếng thì
     phải đổi sang lời, nếu không máy sẽ đọc vấp hoặc bỏ qua.        */
  function chuanHoa(s) {
    return String(s)
      .replace(/`/g, "")
      .replace(/\s*→\s*/g, " rồi ")
      .replace(/\s*↔\s*/g, " và ")
      .replace(/\s*·\s*/g, ", ")
      .replace(/\s*—\s*/g, ", ")
      .replace(/\s*–\s*/g, ", ")
      .replace(/\s+>\s+/g, " lớn hơn ")
      .replace(/\s+<\s+/g, " nhỏ hơn ")
      .replace(/\s+&&\s+/g, " và ")
      .replace(/\s+\+\s+/g, " và ")
      .replace(/\s+=\s+/g, " là ")
      .replace(/(\d)\s*%/g, "$1 phần trăm")
      .replace(/\s*~\s*/g, " khoảng ")
      .replace(/\.{3,}/g, ".")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  /* Cắt thành mẩu ngắn: Chrome hay tắt tiếng giữa chừng với câu quá dài,
     mà mẩu ngắn còn giúp dừng lại nhanh khi bấm Dừng.
     Tránh regex lookbehind vì iOS Safari cũ sẽ lỗi cú pháp cả file.   */
  function catMau(s, dai = 170) {
    const t = chuanHoa(s);
    if (!t) return [];
    // Ngắt ở . ! ? ; — cố ý bỏ dấu hai chấm vì nó cắt vụn đoạn mã như cache:key:
    const cau = t.replace(/([.!?;])\s+/g, "$1\n").split(/\n+/).filter(Boolean);
    const ra = [];
    cau.forEach(c => {
      if (c.length <= dai) { ra.push(c); return; }
      let gom = "";
      c.replace(/(,)\s+/g, "$1\n").split(/\n+/).forEach(m => {
        if (gom && (gom + " " + m).length > dai) { ra.push(gom); gom = m; }
        else gom = gom ? gom + " " + m : m;
      });
      if (gom) ra.push(gom);
    });
    return ra;
  }

  /* ---------- Đọc ---------- */
  function dung() {
    huy = true;
    if (hoTro) { try { speechSynthesis.cancel(); } catch (e) {} }
    if (dangDoc) { dangDoc = false; bao("nghi"); }
  }

  function doc(text, nhan = "") {
    return new Promise(resolve => {
      if (!hoTro) return resolve(false);
      dung();
      const mau = catMau(text);
      if (!mau.length) return resolve(true);

      huy = false;
      dangDoc = true;
      bao("doc", nhan);

      const g = giongDangDung();
      let i = 0, xong = false;

      const ketThuc = ok => {
        if (xong) return;
        xong = true;
        dangDoc = false;
        bao("nghi");
        resolve(ok);
      };

      const tiep = () => {
        if (huy) return ketThuc(false);
        if (i >= mau.length) return ketThuc(true);
        const u = new SpeechSynthesisUtterance(mau[i++]);
        if (g) { u.voice = g; u.lang = g.lang; } else { u.lang = "vi-VN"; }
        u.rate = tocDo;
        u.onend = tiep;
        u.onerror = tiep;   // gặp lỗi thì bỏ mẩu đó, đọc tiếp mẩu sau
        try { speechSynthesis.speak(u); } catch (e) { tiep(); }
      };
      tiep();
    });
  }

  /* Chờ im lặng, bấm Dừng là thoát ngay — dùng cho chế độ rảnh tay.
     đếm(còn lại tính bằng giây) được gọi mỗi giây để hiện đồng hồ.  */
  function cho(giay, dem) {
    return new Promise(resolve => {
      huy = false;
      const het = Date.now() + giay * 1000;
      const id = setInterval(() => {
        const conLai = Math.ceil((het - Date.now()) / 1000);
        if (huy) { clearInterval(id); return resolve(false); }
        if (conLai <= 0) { clearInterval(id); return resolve(true); }
        if (dem) dem(conLai);
      }, 250);
      if (dem) dem(giay);
    });
  }

  return {
    hoTro,
    napGiong,
    danhSachGiong: () => giongs.slice(),
    coGiongViet: () => giongViet().length > 0,
    giongDangDung,
    datGiong(ten) { tenGiong = ten || null; luu(); },
    tocDo: () => tocDo,
    datTocDo(n) { tocDo = Number(n) || 1; luu(); },
    doc, dung, cho,
    dangDoc: () => dangDoc,
    khiDoiTrangThai(fn) { bao = fn || (() => {}); }
  };
})();
