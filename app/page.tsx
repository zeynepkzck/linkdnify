import Studio from "./Studio";

export default function Home() {
  return (
    <div className="wrap">
      <header className="top">
        <h1 className="brand">
          Linkdn<span>ify</span>
        </h1>
        <p className="tag">
          Sertifika, yeni iş, terfi, mezuniyet ya da ödül: başarını birkaç cümleyle anlat, LinkedIn&apos;e hazır ve sana
          ait gibi duran bir paylaşım metni al.
        </p>
      </header>

      <ol className="howto">
        <li>
          <span>
            <b>Başarını seç</b>Yeni iş, terfi, sertifika, mezuniyet… Belgen varsa yükle, bilgiler otomatik okunur.
          </span>
        </li>
        <li>
          <span>
            <b>Hikâyeni ekle</b>Neden aldın, ne öğrendin? Metni şablondan ayıran kısım bu.
          </span>
        </li>
        <li>
          <span>
            <b>Paylaş</b>LinkedIn metin hazır açılır; sertifikaları profiline de tek tıkla ekle.
          </span>
        </li>
      </ol>

      <Studio />

      <footer className="foot">
        <p>
          Yüklediğin belge yalnızca bilgileri okumak için kullanılır, saklanmaz. Metinler yapay zekâ ile üretilir;
          paylaşmadan önce oku ve düzenle.
        </p>
        <p>Linkdnify, LinkedIn ile bağlantılı değildir.</p>
      </footer>
    </div>
  );
}
