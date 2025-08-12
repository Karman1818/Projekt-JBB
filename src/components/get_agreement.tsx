import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./navbar";

interface Agreement {
  id: number;
  data_zawarcia_umowy: string;
  rodzaj: string;
  oplata: boolean | null;
  rodzaj_oplaty?: string | null;
  kwota_netto?: number | null;
  wystawca_faktury: string;
  dostawca?: string | null;
  wydawca_gazetki: string;
  uwagi?: string | null;
  rodzaj_uslugi_marketingowej: string;
  termin_obowiazywania_promocji_od: string;
  termin_obowiazywania_promocji_do: string;
  zatowarowanie_dystrybucji_od: string;
  zatowarowanie_dystrybucji_do: string;
  zatowarowanie_sklepu_od: string | null;
  zatowarowanie_sklepu_do: string | null;
  kontrahent_id: number;
  kontrahent?: string;
}

interface Product {
  id: number;
  produkt: string;
  rabat: number | null;
  cena_realizacji: number;
  ilosc_estymowana: number;
  created_at?: string | null;
  updated_at?: string | null;
}

interface UmowyTowary {
  id: number;
  umowy_id: number;
  towar_id: number;
  ilosc: number;
}

type JoinedRow = {
  agreement: Agreement;
  product: Product | null;
  mapping: UmowyTowary | null;
};

export const GetAgreement = () => {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [mappings, setMappings] = useState<UmowyTowary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [userContractorId, setUserContractorId] = useState<number | null>(null);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token));
        if (payload && (payload.kontrahent_id || payload.kontrahent_id === 0 || payload.kontrahent_id === "0")) {
          setUserContractorId(Number(payload.kontrahent_id));
        } else {
          setError("Brak identyfikatora kontrahenta w tokenie.");
        }
      } catch (e) {
        setError("Nieprawidłowy token. Zaloguj się ponownie.");
        navigate("/login");
      }
    } else {
      setError("Brak tokena. Zaloguj się ponownie.");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (userContractorId === null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const fetchAgreements = fetch(
      `http://localhost/backend/get_agreement.php?kontrahent_id=${userContractorId}`,
      { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } }
    ).then((r) => {
      if (!r.ok) throw new Error("Błąd przy pobieraniu umów");
      return r.json();
    });

    const fetchProducts = fetch(
      `http://localhost/backend/get_commodity.php?kontrahent_id=${userContractorId}`,
      { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } }
    ).then((r) => {
      if (!r.ok) throw new Error("Błąd przy pobieraniu towarów");
      return r.json();
    });

    const fetchMappings = fetch(
      `http://localhost/backend/get_umowy_towary.php?kontrahent_id=${userContractorId}`,
      { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } }
    )
      .then((r) => {
        if (!r.ok) throw new Error("Błąd przy pobieraniu mapowań umowy-towar");
        return r.json();
      })
      .catch((err) => {
        console.warn("get_umowy_towary error:", err);
        return [];
      });

    Promise.all([fetchAgreements, fetchProducts, fetchMappings])
      .then(([agData, pData, mData]) => {
        if (agData?.error) throw new Error(agData.error);
        if (pData?.error) throw new Error(pData.error);
        setAgreements(agData || []);
        setProducts(pData || []);
        setMappings(mData || []);
      })
      .catch((err: any) => {
        setError(err.message || "Błąd przy pobieraniu danych");
      })
      .finally(() => {
        setLoading(false);
      });

    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, [userContractorId]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit" };
    return new Date(dateString).toLocaleDateString("pl-PL", options);
  };

  const isDeleting = (id: number) => deletingIds.includes(id);

  const deleteAgreement = async (id: number) => {
    if (!userContractorId) {
      setError("Brak identyfikatora kontrahenta. Nie można usunąć rekordu.");
      return;
    }
    const confirmed = window.confirm("Na pewno usunąć tę umowę?");
    if (!confirmed) return;

    setDeletingIds((prev) => [...prev, id]);
    try {
      const res = await fetch("http://localhost/backend/delete_agreement.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, kontrahent_id: userContractorId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || res.statusText || "Błąd przy usuwaniu");
      setAgreements((prev) => prev.filter((a) => a.id !== id));
      setMappings((prev) => prev.filter((m) => m.umowy_id !== id));
    } catch (err: any) {
      setError(err.message || "Błąd przy usuwaniu rekordu.");
    } finally {
      setDeletingIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const joinedRows: JoinedRow[] = React.useMemo(() => {
    if (!agreements) return [];
    return agreements.flatMap((a): JoinedRow[] => {
      const related = mappings.filter((m) => m.umowy_id === a.id);
      if (!related || related.length === 0) {
        return [{ agreement: a, product: null, mapping: null }];
      }
      return related.map((m) => {
        const prod = products.find((p) => p.id === m.towar_id) || null;
        return { agreement: a, product: prod, mapping: m };
      });
    });
  }, [agreements, products, mappings]);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-100 to-blue-500 flex flex-col">
      <Navbar />
      <div className="flex-1 p-6 sm:p-10 overflow-auto">
        <h1
          className={`text-4xl font-bold text-white text-center mb-8 transition-all duration-700 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Umowy Porozumień i Przypisane Towary
        </h1>

        {loading && <p className="text-center text-gray-200">Ładowanie danych...</p>}
        {error && <p className="text-center text-red-200">{error}</p>}

        {!loading && !error && joinedRows.length === 0 && (
          <p className="text-center text-gray-200">Brak danych dla tego kontrahenta.</p>
        )}

        {!loading && !error && joinedRows.length > 0 && (
          <div
            className={`overflow-auto rounded-xl shadow-xl bg-white transition-all duration-700 delay-150 ${
              showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <table className="min-w-full text-sm text-gray-800">
              <thead className="bg-blue-100 text-xs uppercase text-blue-700 font-semibold sticky top-0">
                <tr>
                  {/* --- Istotne pola umowy --- */}
                  <th className="px-4 py-3 text-left">ID umowy</th>
                  <th className="px-4 py-3 text-left">Data zaw.</th>
                  <th className="px-4 py-3 text-left">Rodzaj</th>
                  <th className="px-4 py-3 text-left">Opłata</th>
                  <th className="px-4 py-3 text-left">Rodzaj opłaty</th>
                  <th className="px-4 py-3 text-left">Kwota netto</th>
                  <th className="px-4 py-3 text-left">Wystawca faktury</th>
                  <th className="px-4 py-3 text-left">Wydawca gazetki</th>

                  {/* --- Istotne pola towaru --- */}
                  <th className="px-4 py-3 text-left">ID towaru</th>
                  <th className="px-4 py-3 text-left">Produkt</th>
                  <th className="px-4 py-3 text-center">Rabat (%)</th>
                  <th className="px-4 py-3 text-center">Cena real. (zł)</th>
                  <th className="px-4 py-3 text-center">Ilość est.</th>
                  <th className="px-4 py-3 text-left">Rodzaj usługi marketingowej</th>

                  {/* --- Terminy --- */}
                  <th className="px-4 py-3 text-left">Termin promocji</th>
                  <th className="px-4 py-3 text-left">Zatow. dystrybucji</th>
                  <th className="px-4 py-3 text-left">Zatow. sklepu</th>

                  <th className="px-4 py-3 text-left">Akcje</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {joinedRows.map((r, idx) => {
                  const a = r.agreement;
                  const p = r.product;
                  return (
                    <tr key={`row-${a.id}-${idx}`} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-2">{a.id}</td>
                      <td className="px-4 py-2">{formatDate(a.data_zawarcia_umowy)}</td>
                      <td className="px-4 py-2">{a.rodzaj}</td>
                      <td className="px-4 py-2">{a.oplata ? "Tak" : "Nie"}</td>
                      <td className="px-4 py-2">{a.rodzaj_oplaty ?? "-"}</td>
                      <td className="px-4 py-2">{a.kwota_netto ?? "-"}</td>
                      <td className="px-4 py-2">{a.wystawca_faktury ?? "-"}</td>
                      <td className="px-4 py-2">{a.wydawca_gazetki ?? "-"}</td>

                      <td className="px-4 py-2">{p ? p.id : "-"}</td>
                      <td className="px-4 py-2">{p ? p.produkt : "-"}</td>
                      <td className="px-4 py-2 text-center">{p && p.rabat !== null ? `${p.rabat.toFixed(2)}%` : "-"}</td>
                      <td className="px-4 py-2 text-center">{p ? p.cena_realizacji.toFixed(2) : "-"}</td>
                      <td className="px-4 py-2 text-center">{p ? p.ilosc_estymowana : "-"}</td>
                      <td className="px-4 py-2">{a.rodzaj_uslugi_marketingowej ?? "-"}</td>

                      <td className="px-4 py-2">
                        {formatDate(a.termin_obowiazywania_promocji_od)} – {formatDate(a.termin_obowiazywania_promocji_do)}
                      </td>
                      <td className="px-4 py-2">
                        {formatDate(a.zatowarowanie_dystrybucji_od)} – {formatDate(a.zatowarowanie_dystrybucji_do)}
                      </td>
                      <td className="px-4 py-2">
                        {formatDate(a.zatowarowanie_sklepu_od)} – {formatDate(a.zatowarowanie_sklepu_do)}
                      </td>

                      <td className="px-4 py-2">
                        <button
                          onClick={() => deleteAgreement(a.id)}
                          disabled={isDeleting(a.id)}
                          className={`text-sm px-3 py-1 rounded-md border ${
                            isDeleting(a.id)
                              ? "bg-red-200 border-red-300 text-red-600 cursor-wait"
                              : "bg-red-600 text-white hover:bg-red-700 border-red-700"
                          }`}
                        >
                          {isDeleting(a.id) ? "Usuwanie..." : "Usuń"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GetAgreement;
