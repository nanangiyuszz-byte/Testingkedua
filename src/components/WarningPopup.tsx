import { useState, useEffect } from "react";
import { X } from "lucide-react";

export function WarningPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Coba hapus baris localStorage dulu untuk testing
    // Agar kita tahu apakah komponennya benar-benar muncul atau tidak
    setIsVisible(true); 
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-sm rounded-2xl p-6 shadow-xl relative animate-in fade-in zoom-in duration-300">
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>
        <h3 className="font-bold text-lg mb-2">⚠️ Perhatian</h3>
        <p className="text-sm text-muted-foreground">
          Fitur hapus postingan saat ini belum tersedia. Mohon pastikan data yang kamu posting sudah benar sebelum menekan tombol kirim!
        </p>
      </div>
    </div>
  );
}
