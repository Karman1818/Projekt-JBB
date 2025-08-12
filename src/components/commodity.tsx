import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "./navbar";
import "../css/agreement.css";

type ProductForm = {
  produkt: string;
  rabat: number | null;
  cena_realizacji: string;
  ilosc_estymowana: number;
  umowy_id: number;
  ilosc: number;
};

type Product = {
  produkt: string;
  cena_zl: string;
};

const Commodity = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const umowy_id = location.state?.umowy_id || 0;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductForm>({
    defaultValues: {
      produkt: "",
      rabat: null,
      cena_realizacji: "0",
      ilosc_estymowana: 0,
      umowy_id: umowy_id,
      ilosc: 0,
    },
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (umowy_id) {
      setValue("umowy_id", Number(umowy_id)); 
    }
  }, [umowy_id, setValue]);

  // Pobieranie listy produktów
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          "http://localhost/backend/get_products.php",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        } else {
          setError("Błąd podczas pobierania listy produktów");
        }
      } catch (err: any) {
        setError("Błąd podczas pobierania produktów: " + err.message);
      }
    };

    fetchProducts();
  }, []);

  const selectedProdukt = watch("produkt");
  const rabat = watch("rabat");

  // Obliczanie ceny realizacji
  useEffect(() => {
    if (selectedProdukt && products.length > 0) {
      const selectedProduct = products.find(p => p.produkt === selectedProdukt);
      if (selectedProduct) {
        const basePrice = parseFloat(selectedProduct.cena_zl);
        if (!isNaN(basePrice)) {
          const discount = rabat ? parseFloat(String(rabat)) : 0;
          const cenaRealizacji = basePrice * (1 - discount / 100);
          setValue("cena_realizacji", cenaRealizacji.toFixed(2));
        } else {
          setValue("cena_realizacji", "0");
        }
      } else {
        setValue("cena_realizacji", "0");
      }
    } else {
      setValue("cena_realizacji", "0");
    }
  }, [selectedProdukt, rabat, products, setValue]);

  const onSubmit = async (data: ProductForm) => {
    setError(null);
    setSuccess(null);

    const payload = {
      produkt: data.produkt,
      rabat: data.rabat,
      cena_realizacji: parseFloat(data.cena_realizacji),
      ilosc_estymowana: data.ilosc,
      umowy_id: data.umowy_id,
      ilosc: data.ilosc,
    };

    try {
      const response = await fetch("http://localhost/backend/add_commodity.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(result.message || "Towar zapisany pomyślnie");
        navigate("/");
      } else {
        setError(result.error || "Błąd podczas zapisywania towaru");
      }
    } catch (err: any) {
      setError("Błąd podczas wysyłania danych: " + err.message);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen w-screen bg-gradient-to-br from-blue-100 to-blue-500 py-12 px-4">
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4 max-w-5xl mx-auto">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 p-4 rounded mb-4 max-w-5xl mx-auto">
            {success}
          </div>
        )}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="bg-blue-600 p-6 mb-8">
            <h2 className="text-3xl font-bold text-white text-center">
              Formularz towaru
            </h2>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
              <div className="space-y-6">
                <div className="form-group">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Nazwa towaru
                  </label>
                  <select
                    {...register("produkt", { required: "Pole wymagane" })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-black hover:shadow focus:shadow focus:scale-[1.01]"
                  >
                    <option value="">Wybierz produkt</option>
                    {products.map((product) => (
                      <option key={product.produkt} value={product.produkt}>
                        {product.produkt}
                      </option>
                    ))}
                  </select>
                  {errors.produkt && (
                    <p className="text-red-500 text-sm">
                      {errors.produkt.message}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Rabat (opcjonalnie)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      max="100"
                      {...register("rabat", {
                        min: { value: 0, message: "Rabat nie może być ujemny" },
                        max: {
                          value: 100,
                          message: "Maksymalny rabat to 100%",
                        },
                      })}
                      className="w-full border px-4 py-3 rounded focus:ring-2 focus:ring-blue-400 text-black pr-20 hover:shadow focus:shadow focus:scale-[1.01]"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      %
                    </span>
                  </div>
                  {errors.rabat && (
                    <p className="text-red-500 text-sm">
                      {errors.rabat.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="form-group">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Cena realizacji
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      readOnly
                      {...register("cena_realizacji")}
                      className="w-full border px-4 py-3 rounded bg-gray-100 text-black pr-20"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      PLN
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Ilość
                  </label>
                  <input
                    type="number"
                    {...register("ilosc", {
                      required: "Pole wymagane",
                      min: { value: 1, message: "Ilość musi być większa od 0" },
                    })}
                    className="w-full border px-4 py-3 rounded focus:ring-2 focus:ring-blue-400 text-black hover:shadow focus:shadow focus:scale-[1.01]"
                  />
                  {errors.ilosc && (
                    <p className="text-red-500 text-sm">
                      {errors.ilosc.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-12 border-t pt-6">
              <button
                type="submit"
                className="button-animated"
              >
                Zapisz Towar
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default Commodity;
