import { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import Select, { type SingleValue, type StylesConfig } from "react-select";
import { useNavigate } from "react-router-dom";
import Navbar from "./navbar";
import "../css/agreement.css";

type AgreementForm = {
    date: string;
    type: string;
    fee: boolean;
    feeType: string | null;
    netAmount: number | null;
    payer: string;
    supplier_id?: string;
    publisher: string;
    notes: string | null;
    marketingType: string;
    promoTermFrom: string;
    promoTermTo: string;
    distributorFrom: string;
    distributorTo: string;
    storeFrom: string;
    storeTo: string;
    sendAgreement: boolean;
    kontrahent_id: string;
};

interface Payer {
    id: number;
    firma: string;
    wyroznik: string;
}

interface Supplier {
    id: number;
    firma: string;
}

type OptionType = { value: string; label: string };

const Agreement = () => {
    const { register, handleSubmit, watch, control, formState: { errors }, setValue } = useForm<AgreementForm>({
        defaultValues: {
            date: new Date().toISOString().slice(0, 10),
            fee: false,
            netAmount: null,
            sendAgreement: false,
            feeType: "Kwota (PLN)",
            notes: null,
            kontrahent_id: ""
        }
    });

    const navigate = useNavigate();
    const [payers, setPayers] = useState<Payer[]>([]);
    const [publishers, setPublishers] = useState<{ id: number, firma: string }[]>([]);
    const [kontrahenci, setKontrahenci] = useState<{ id: number, firma: string }[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [showSuppliers, setShowSuppliers] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [userContractorId, setUserContractorId] = useState<number | null>(null);

    const feeType = watch("feeType");
    const showFeeFields = watch("fee");
    const selectedType = watch("type");
    const showStoreFields = selectedType === "Detaliczne";
    const currency = feeType === "Kwota (EUR)" ? "EUR" : feeType === "Kwota (USD)" ? "USD" : "PLN";

    const promoFrom = watch("promoTermFrom");
    const distFrom = watch("distributorFrom");
    const storeFrom = watch("storeFrom");
    const selectedPayer = watch("payer");

    const minDateObj = new Date();
    minDateObj.setDate(minDateObj.getDate() + 4);
    const minDate = minDateObj.toISOString().split("T")[0];

    const getMinDateForTo = (fromValue?: string) => {
        const baseDate = fromValue ? new Date(fromValue) : minDateObj;
        baseDate.setDate(baseDate.getDate() + 7);
        return baseDate.toISOString().split("T")[0];
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token));
                if (payload.kontrahent_id) {
                    setUserContractorId(payload.kontrahent_id);
                    setValue("kontrahent_id", String(payload.kontrahent_id));
                    console.log("User contractor ID set to:", payload.kontrahent_id);
                } else {
                    console.error("No kontrahent_id in token payload");
                }
            } catch (e) {
                console.error("Invalid token:", e);
            }
        } else {
            console.error("No token in localStorage");
        }
    }, [setValue]);

    // initial data loads
    useEffect(() => {
        fetch("http://localhost/backend/get_payers.php", { method: "GET", credentials: "include" })
            .then(res => res.json())
            .then(data => {
                if (data.error) setError(data.error);
                else {
                    const normalized = data.map((p: any) => ({ ...p, id: Number(p.id) }));
                    setPayers(normalized);
                }
            })
            .catch(err => setError("Błąd podczas pobierania wystawców faktur: " + err.message));

        fetch("http://localhost/backend/get_publishers.php", { method: "GET", credentials: "include" })
            .then(res => res.json())
            .then(data => {
                if (data.error) setError(data.error);
                else {
                    const normalized = data.map((p: any) => ({ ...p, id: Number(p.id) }));
                    setPublishers(normalized);
                }
            })
            .catch(err => setError("Błąd podczas pobierania wydawców gazetek: " + err.message));

        fetch("http://localhost/backend/get_contractors.php", { method: "GET", credentials: "include" })
            .then(res => res.json())
            .then(data => {
                if (data.error) setError(data.error);
                else {
                    const normalized = data.map((k: any) => ({ ...k, id: Number(k.id) }));
                    setKontrahenci(normalized);
                }
            })
            .catch(err => setError("Błąd podczas pobierania kontrahentów: " + err.message));
    }, []);

    const fetchTimeout = useRef<number | null>(null);
    const abortCtrl = useRef<AbortController | null>(null);

    useEffect(() => {
        if (!selectedPayer) {
            if (fetchTimeout.current) {
                window.clearTimeout(fetchTimeout.current);
                fetchTimeout.current = null;
            }
            if (abortCtrl.current) {
                abortCtrl.current.abort();
                abortCtrl.current = null;
            }
            setSuppliers([]);
            setShowSuppliers(false);
            return;
        }

        const selectedPayerId = Number(selectedPayer);
        if (Number.isNaN(selectedPayerId)) {
            if (fetchTimeout.current) {
                window.clearTimeout(fetchTimeout.current);
                fetchTimeout.current = null;
            }
            if (abortCtrl.current) {
                abortCtrl.current.abort();
                abortCtrl.current = null;
            }
            setSuppliers([]);
            setShowSuppliers(false);
            return;
        }

        if (fetchTimeout.current) {
            window.clearTimeout(fetchTimeout.current);
            fetchTimeout.current = null;
        }
        if (abortCtrl.current) {
            abortCtrl.current.abort();
            abortCtrl.current = null;
        }

        fetchTimeout.current = window.setTimeout(() => {
            const payerData = payers.find(p => p.id === selectedPayerId);
            if (payerData && payerData.wyroznik === 'HURTOWNIA') {
                setShowSuppliers(true);
                abortCtrl.current = new AbortController();
                fetch(`http://localhost/backend/get_suppliers.php?payer_id=${encodeURIComponent(selectedPayerId)}`, {
                    method: "GET",
                    credentials: "include",
                    signal: abortCtrl.current.signal
                })
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data)) {
                            const normalized = data.map((s: any) => ({ ...s, id: Number(s.id) }));
                            setSuppliers(normalized);
                        } else if (data.error) {
                            setError(data.error);
                            setSuppliers([]);
                        } else {
                            setSuppliers([]);
                        }
                    })
                    .catch(err => {
                        if ((err as any).name === "AbortError") return;
                        setError("Błąd podczas pobierania dostawców: " + err.message);
                    })
                    .finally(() => {
                        // clear abort controller after request finishes
                        if (abortCtrl.current) {
                            abortCtrl.current = null;
                        }
                    });
            } else {
                setShowSuppliers(false);
                setSuppliers([]);
            }
        }, 300);

        return () => {
            if (fetchTimeout.current) {
                window.clearTimeout(fetchTimeout.current);
                fetchTimeout.current = null;
            }
            if (abortCtrl.current) {
                abortCtrl.current.abort();
                abortCtrl.current = null;
            }
        };
    }, [selectedPayer, payers]);

    const onSubmit = async (data: AgreementForm) => {
        setError(null);
        setSuccess(null);

        // <-- FIX: poprawiona nazwa pola (zatowarowanie_dystrybucji_do)
        const payload = {
            data_zawarcia_umowy: data.date,
            rodzaj: data.type,
            oplata: data.fee,
            rodzaj_oplaty: data.fee ? data.feeType : null,
            kwota_netto: data.fee ? data.netAmount : null,
            wystawca_faktury: Number(data.payer),
            dostawca_id: showSuppliers && data.supplier_id ? Number(data.supplier_id) : null,
            wydawca_gazetki: Number(data.publisher),
            uwagi: data.notes,
            rodzaj_uslugi_marketingowej: data.marketingType,
            termin_obowiazywania_promocji_od: data.promoTermFrom,
            termin_obowiazywania_promocji_do: data.promoTermTo,
            zatowarowanie_dystrybucji_od: data.distributorFrom,
            zatowarowanie_dystrybucji_do: data.distributorTo, // <- poprawione
            zatowarowanie_sklepu_od: showStoreFields ? data.storeFrom : null,
            zatowarowanie_sklepu_do: showStoreFields ? data.storeTo : null,
            wysylka_porozumienia: data.sendAgreement,
            kontrahent_id: userContractorId,
        };

        try {
            const response = await fetch("http://localhost/backend/add_agreement.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok) {
                setSuccess(result.message);
                navigate("/commodity", { state: { umowy_id: result.umowy_id } });
            } else {
                setError(result.error || "Błąd podczas zapisywania porozumienia");
            }
        } catch (err: any) {
            setError("Błąd podczas wysyłania danych: " + err.message);
        }
    };

    const payerOptions: OptionType[] = payers.map(p => ({ value: String(p.id), label: p.firma }));
    const publisherOptions: OptionType[] = publishers.map(p => ({ value: String(p.id), label: p.firma }));

    const customSelectStyles: StylesConfig<OptionType, false> = {
        control: (provided, state) => ({
            ...provided,
            minHeight: 48,
            borderRadius: 12,
            borderColor: state.isFocused ? "#2563EB" : (state.selectProps.menuIsOpen ? "#2563EB" : provided.borderColor),
            boxShadow: state.isFocused ? "0 0 0 4px rgba(37,99,235,0.06)" : provided.boxShadow,
            paddingLeft: 6,
            paddingRight: 6,
            fontSize: 14,
            background: "white"
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 6px 18px rgba(15, 23, 42, 0.12)"
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected ? "#DBEAFE" : (state.isFocused ? "#EFF6FF" : "white"),
            color: "#0f172a",
            padding: 12,
            fontSize: 14
        }),
        singleValue: (provided) => ({
            ...provided,
            color: "#0f172a"
        }),
        placeholder: (provided) => ({
            ...provided,
            color: "#6B7280"
        }),
        menuPortal: base => ({ ...base, zIndex: 9999 })
    };

    const menuPortalTarget = (typeof document !== "undefined") ? document.body : null;

    return (
        <>
            <Navbar />
            <div className="min-h-screen w-screen bg-gradient-to-br from-blue-100 to-blue-500 py-12 px-4">
                {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4 max-w-5xl mx-auto">{error}</div>}
                {success && <div className="bg-green-100 text-green-700 p-4 rounded mb-4 max-w-5xl mx-auto">{success}</div>}

                <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="bg-blue-600 p-6 mb-8">
                        <h2 className="text-3xl font-bold text-white text-center">Formularz Porozumienia</h2>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
                            {/* Lewa kolumna */}
                            <div className="space-y-6">
                                {/* Data zawarcia */}
                                <div className="form-group">
                                    <label className="block text-gray-700 text-sm font-semibold mb-2">Zawarte w dniu</label>
                                    <input type="date" {...register("date", { required: "Pole wymagane" })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"  disabled/>
                                    {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
                                </div>

                                {/* Rodzaj */}
                                <div className="form-group relative z-10">
                                    <label className="block text-gray-700 text-sm font-semibold mb-2">Rodzaj</label>
                                    <select {...register("type", { required: "Pole wymagane" })}
                                        className="w-full border px-4 py-3 rounded focus:ring-2 focus:ring-blue-400 text-black">
                                        <option value="">Wybierz...</option>
                                        <option value="Hurtowe">Hurtowe</option>
                                        <option value="Detaliczne">Detaliczne</option>
                                    </select>
                                    {errors.type && <p className="text-red-500 text-sm">{errors.type.message}</p>}
                                </div>

                                {/* Opłata */}
                                <div className="mb-5 flex items-center">
                                    <input type="checkbox" {...register("fee")} id="fee" className="mr-2 accent-blue-500" />
                                    <label htmlFor="fee" className="font-medium text-black">Opłata</label>
                                </div>

                                {/* Pola opłaty */}
                                <div className={`space-y-4 transition-all duration-300 ease-in-out ${showFeeFields ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                                    <div className="form-group relative z-10">
                                        <label className="block text-gray-700 text-sm font-semibold mb-2">Rodzaj opłaty</label>
                                        <select {...register("feeType", { required: showFeeFields ? "Pole wymagane" : false })}
                                            className="w-full border px-4 py-3 rounded focus:ring-2 focus:ring-blue-400 text-black" disabled={!showFeeFields}>
                                            <option value="Kwota (PLN)">Kwota (PLN)</option>
                                            <option value="Kwota (USD)">Kwota (USD)</option>
                                            <option value="Kwota (EUR)">Kwota (EUR)</option>
                                        </select>
                                        {errors.feeType && <p className="text-red-500 text-sm">{errors.feeType.message}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label className="block text-gray-700 text-sm font-semibold mb-2">Kwota netto</label>
                                        <div className="relative">
                                            <input type="number" step="0.01" {...register("netAmount", {
                                                required: showFeeFields ? "Pole wymagane" : false,
                                                ...(showFeeFields ? { min: { value: 0, message: "Kwota nie może być ujemna" } } : {}),
                                            })} className="w-full border px-4 py-3 rounded focus:ring-2 focus:ring-blue-400 text-black pr-20" disabled={!showFeeFields} />
                                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">{currency}</span>
                                        </div>
                                        {errors.netAmount && <p className="text-red-500 text-sm">{errors.netAmount.message}</p>}
                                    </div>
                                </div>

                                {/* Płatnik */}
                                <div className="form-group relative z-50">
                                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                                        Płatnik (wystawca faktury)
                                    </label>
                                    <Controller
                                        name="payer"
                                        control={control}
                                        rules={{ required: "Pole wymagane" }}
                                        render={({ field }) => (
                                            <Select<OptionType, false>
                                                options={payerOptions}
                                                value={payerOptions.find(o => o.value === field.value) ?? null}
                                                onChange={(selected: SingleValue<OptionType>) => field.onChange(selected?.value ?? "")}
                                                placeholder="Wybierz płatnika..."
                                                isSearchable
                                                styles={customSelectStyles}
                                                menuPortalTarget={menuPortalTarget}
                                                menuPosition="fixed"
                                                className="w-full text-black"
                                                classNamePrefix="rs"
                                            />
                                        )}
                                    />
                                    {errors.payer && (
                                        <p className="text-red-500 text-sm">{errors.payer.message}</p>
                                    )}
                                </div>

                                {/* Dostawca */}
                                <div className={`space-y-4 transition-all duration-300 ease-in-out ${showSuppliers ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                                    <div className="form-group relative z-10">
                                        <label className="block text-gray-700 text-sm font-semibold mb-2">Dostawca</label>
                                        <select {...register("supplier_id", { required: showSuppliers ? "Pole wymagane" : false })}
                                            className="w-full border px-4 py-3 rounded focus:ring-2 focus:ring-blue-400 text-black"
                                            disabled={!showSuppliers}>
                                            <option value="">Wybierz...</option>
                                            {suppliers.map(s => <option key={s.id} value={String(s.id)}>{s.firma}</option>)}
                                        </select>
                                        {errors.supplier_id && <p className="text-red-500 text-sm">{errors.supplier_id.message}</p>}
                                    </div>
                                </div>

                                {/* Wydawca */}
                                <div className="form-group relative z-50">
                                    <label className="block text-gray-700 text-sm font-semibold mb-2">Wydawca Gazetki</label>
                                    <Controller
                                        name="publisher"
                                        control={control}
                                        rules={{ required: "Pole wymagane" }}
                                        render={({ field }) => (
                                            <Select<OptionType, false>
                                                options={publisherOptions}
                                                value={publisherOptions.find(o => o.value === field.value) ?? null}
                                                onChange={(selected: SingleValue<OptionType>) => field.onChange(selected?.value ?? "")}
                                                placeholder="Wybierz wydawcę..."
                                                isSearchable
                                                styles={customSelectStyles}
                                                menuPortalTarget={menuPortalTarget}
                                                menuPosition="fixed"
                                                className="w-full text-black"
                                                classNamePrefix="rs"
                                            />
                                        )}
                                    />
                                    {errors.publisher && <p className="text-red-500 text-sm">{errors.publisher.message}</p>}
                                </div>
                            </div>

                            {/* Prawa kolumna */}
                            <div className="space-y-6">
                                {/* Uwagi */}
                                <div className="form-group">
                                    <label className="block text-gray-700 text-sm font-semibold mb-2">Dodatkowe uwagi</label>
                                    <textarea {...register("notes")} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black" rows={4} />
                                </div>

                                {/* pozostałe pola */}
                                <div className="form-group relative z-10">
                                    <label className="block text-gray-700 text-sm font-semibold mb-2">Rodzaj usługi marketingowej</label>
                                    <select {...register("marketingType", { required: "Pole wymagane" })}
                                        className="w-full border px-4 py-3 rounded focus:ring-2 focus:ring-blue-400 text-black">
                                        <option value="">Wybierz...</option>
                                        <option value="Reklama">Reklama</option>
                                        <option value="Promocja">Promocja</option>
                                        <option value="Kampania">Kampania</option>
                                        <option value="Inne">Inne</option>
                                    </select>
                                    {errors.marketingType && <p className="text-red-500 text-sm">{errors.marketingType.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group col-span-2">
                                        <label className="block text-gray-700 text-sm font-semibold mb-2">Termin obowiązywania promocji</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <input type="date" min={minDate} {...register("promoTermFrom", { required: "Pole wymagane" })}
                                                    className="w-full border px-4 py-3 rounded text-black" />
                                                {errors.promoTermFrom && <p className="text-red-500 text-sm">{errors.promoTermFrom.message}</p>}
                                            </div>
                                            <div>
                                                <input type="date" min={getMinDateForTo(promoFrom)} {...register("promoTermTo", { required: "Pole wymagane" })}
                                                    className="w-full border px-4 py-3 rounded text-black" />
                                                {errors.promoTermTo && <p className="text-red-500 text-sm">{errors.promoTermTo.message}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group col-span-2">
                                        <label className="block text-gray-700 text-sm font-semibold mb-2">Zatowarowanie dystrybutora</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <input type="date" min={minDate} {...register("distributorFrom", { required: "Pole wymagane" })}
                                                    className="w-full border px-4 py-3 rounded text-black" />
                                                {errors.distributorFrom && <p className="text-red-500 text-sm">{errors.distributorFrom.message}</p>}
                                            </div>
                                            <div>
                                                <input type="date" min={getMinDateForTo(distFrom)} {...register("distributorTo", { required: "Pole wymagane" })}
                                                    className="w-full border px-4 py-3 rounded text-black" />
                                                {errors.distributorTo && <p className="text-red-500 text-sm">{errors.distributorTo.message}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`form-group col-span-2 transition-all duration-300 ease-in-out ${showStoreFields ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                                        <label className="block text-gray-700 text-sm font-semibold mb-2">Zatowarowanie sklepu</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <input type="date" min={minDate} {...register("storeFrom", { required: showStoreFields ? "Pole wymagane" : false })}
                                                    className="w-full border px-4 py-3 rounded text-black" disabled={!showStoreFields} />
                                                {errors.storeFrom && <p className="text-red-500 text-sm">{errors.storeFrom.message}</p>}
                                            </div>
                                            <div>
                                                <input type="date" min={getMinDateForTo(storeFrom)} {...register("storeTo", { required: showStoreFields ? "Pole wymagane" : false })}
                                                    className="w-full border px-4 py-3 rounded text-black" disabled={!showStoreFields} />
                                                {errors.storeTo && <p className="text-red-500 text-sm">{errors.storeTo.message}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-5 flex items-center">
                                    <input type="checkbox" {...register("sendAgreement")} id="sendAgreement" className="mr-2 accent-blue-500" />
                                    <label htmlFor="sendAgreement" className="font-medium text-black">Wysyłka porozumienia</label>
                                </div>

                                <div className="form-group relative z-10">
                                    <label className="block text-gray-700 text-sm font-semibold mb-2">Kontrahent</label>
                                    <select
                                        {...register("kontrahent_id", { required: "Pole wymagane" })}
                                        className="w-full border px-4 py-3 rounded focus:ring-2 focus:ring-blue-400 text-black"
                                        value={userContractorId ? String(userContractorId) : undefined}
                                        disabled={!!userContractorId}
                                        onChange={() => { }}
                                    >
                                        <option value="">Wybierz...</option>
                                        {kontrahenci.map(k => (
                                            <option key={k.id} value={String(k.id)}>{k.firma}</option>
                                        ))}
                                    </select>
                                    {errors.kontrahent_id && <p className="text-red-500 text-sm">{errors.kontrahent_id.message}</p>}
                                </div>

                            </div>
                        </div>

                        <div className="mt-12 border-t pt-6">
                            <button type="submit" className="button-animated">Zapisz Porozumienie</button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
};

export default Agreement;
