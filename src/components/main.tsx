import { useNavigate } from "react-router-dom";
import Navbar from "./navbar";
import { useState, useEffect } from "react";

// Reużywalny komponent karty
const Card = ({ title, value }: { title: string; value: number }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center shadow">
    <h2 className="text-xl font-semibold text-gray-600">{title}</h2>
    <p className="text-3xl font-bold text-blue-600 mt-2">{value}</p>
  </div>
);

const getKontrahentIdFromToken = (): number | null => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    // jeśli token to base64 JSON tak jak w innych komponentach
    const payload = JSON.parse(atob(token));
    return payload && payload.kontrahent_id ? Number(payload.kontrahent_id) : null;
  } catch (e) {
    console.warn("Nie można odczytać tokena:", e);
    return null;
  }
};

const Main = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    umowy: 0,
    towary: 0,
    kontrahenci: 0,
    platnicy: 0,
    wydawcy: 0,
  });

  const [showContent, setShowContent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const kontrahentId = getKontrahentIdFromToken();
    if (!kontrahentId) {
      // jeśli aplikacja wymaga logowania — przekieruj
      // (jeśli nie chcesz przekierowywać, usuń tę linię)
      navigate("/login");
      return;
    }

    const base = "http://localhost/backend";

    const fetchJsonSafe = async (url: string) => {
      try {
        const res = await fetch(url, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        // zawsze próbujemy sparsować JSON (backend zwraca JSON)
        const data = await res.json();
        if (!res.ok || (data && data.error)) {
          console.warn("Błąd z endpointa:", url, data?.error ?? res.statusText);
          return []; // traktujemy jako brak danych
        }
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.error("Błąd fetchowania:", url, err);
        return [];
      }
    };

    const fetchStats = async () => {
      setLoading(true);
      setFetchError(null);

      try {
        const [
          umowy,
          towary,
          kontrahenci,
          platnicy,
          wydawcy,
        ] = await Promise.all([
          // umowy oraz towary wymagają parametru kontrahent_id w Twoim backendzie
          fetchJsonSafe(`${base}/get_agreement.php?kontrahent_id=${kontrahentId}`),
          fetchJsonSafe(`${base}/get_commodity.php?kontrahent_id=${kontrahentId}`),
          fetchJsonSafe(`${base}/get_contractors.php`),
          fetchJsonSafe(`${base}/get_payers.php`),
          fetchJsonSafe(`${base}/get_publishers.php`),
        ]);

        setStats({
          umowy: umowy.length,
          towary: towary.length,
          kontrahenci: kontrahenci.length,
          platnicy: platnicy.length,
          wydawcy: wydawcy.length,
        });
      } catch (err) {
        console.error("Nieoczekiwany błąd:", err);
        setFetchError("Błąd podczas ładowania statystyk.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // animacja showContent
    const t = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-100 to-blue-500 flex flex-col">
      <Navbar />
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-10 text-center max-w-4xl w-full">
          <h1
            className={`text-4xl font-bold text-blue-600 mb-4 transition-all duration-700 ${
              showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Witaj w aplikacji!
          </h1>
          <p
            className={`text-lg text-gray-700 mb-6 transition-all duration-700 delay-100 ${
              showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            To jest Twój panel główny. Wybierz jedną z opcji poniżej lub zapoznaj się z podsumowaniem.
          </p>

          {loading ? (
            <p className="text-gray-500 mb-4">Ładowanie statystyk...</p>
          ) : fetchError ? (
            <p className="text-red-500 mb-4">{fetchError}</p>
          ) : null}

          {/* Statystyki */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6 transition-all duration-700 delay-200 ${
              showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Card title="Liczba umów" value={stats.umowy} />
            <Card title="Liczba towarów" value={stats.towary} />
            <Card title="Liczba kontrahentów" value={stats.kontrahenci} />
          </div>

          {/* Przyciski */}
          <div
            className={`flex flex-col sm:flex-row justify-center gap-4 transition-all duration-700 delay-300 ${
              showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <button
              onClick={() => navigate("/agreement")}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Dodaj Porozumienie
            </button>
            <button
              onClick={() => navigate("/get_agreement")}
              className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
            >
              Zobacz Porozumienia
            </button>
        
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;
