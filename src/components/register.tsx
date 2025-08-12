import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

type FormData = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    kontrahent_id: string; 
};

interface Contractor {
    id: number;
    firma: string;
}

const Register = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
    const [message, setMessage] = React.useState("");
    const [contractors, setContractors] = useState<Contractor[]>([]);

    useEffect(() => {
        fetch("http://localhost/backend/get_contractors.php", { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setContractors(data);
                }
            })
            .catch(err => {
                console.error("Błąd podczas pobierania kontrahentów:", err);
            });
    }, []);

    const onSubmit = async (data: FormData) => {
        try {
            const response = await fetch("http://localhost/backend/register.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            const text = await response.text();
            let resData: { message?: string } = {};
            if (text) {
                resData = JSON.parse(text);
            }
            setMessage(resData.message || "Konto zostało utworzone pomyślnie.");
        } catch (error) {
            console.log("Error:", error);
            setMessage("Registration failed.");
        }
    };

    return (
        <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-blue-100 to-blue-500">
            <div className="relative flex items-center justify-center w-full h-full">
                <div className="border-blue-400 bg-opacity-30 rounded-xl border-4 border-blue-400 shadow-2xl p-0 flex items-center justify-center w-full max-w-lg mx-auto">
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="w-full p-8 bg-white rounded-xl flex flex-col justify-center"
                    >
                        <h2 className="text-3xl font-extrabold mb-8 text-center text-black">Rejestracja</h2>

                        {/* Imię */}
                        <div className="mb-5 text-center">
                            <label className="block text-gray-700 mb-2 font-medium" htmlFor="firstName">
                                Imię:
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                {...register("firstName", { required: "Imię jest wymagane" })}
                                className="mx-auto w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                            />
                            {errors.firstName && (
                                <span className="text-red-500 text-sm block mt-1">{errors.firstName.message}</span>
                            )}
                        </div>

                        {/* Nazwisko */}
                        <div className="mb-5 text-center">
                            <label className="block text-gray-700 mb-2 font-medium" htmlFor="lastName">
                                Nazwisko:
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                {...register("lastName", { required: "Nazwisko jest wymagane" })}
                                className="mx-auto w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                            />
                            {errors.lastName && (
                                <span className="text-red-500 text-sm block mt-1">{errors.lastName.message}</span>
                            )}
                        </div>

                        {/* Email */}
                        <div className="mb-5 text-center">
                            <label className="block text-gray-700 mb-2 font-medium" htmlFor="email">
                                Email:
                            </label>
                            <input
                                type="email"
                                id="email"
                                {...register("email", {
                                    required: "Email jest wymagany",
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: "Nieprawidłowy format email"
                                    }
                                })}
                                className="mx-auto w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                            />
                            {errors.email && (
                                <span className="text-red-500 text-sm block mt-1">{errors.email.message}</span>
                            )}
                        </div>

                        {/* Hasło */}
                        <div className="mb-5 text-center">
                            <label className="block text-gray-700 mb-2 font-medium" htmlFor="password">
                                Hasło:
                            </label>
                            <input
                                type="password"
                                id="password"
                                {...register("password", { 
                                    required: "Hasło jest wymagane", 
                                    minLength: { value: 6, message: "Hasło musi mieć co najmniej 6 znaków" } 
                                })}
                                className="mx-auto w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                            />
                            {errors.password && (
                                <span className="text-red-500 text-sm block mt-1">{errors.password.message}</span>
                            )}
                        </div>

                        {/* Kontrahent */}
                        <div className="mb-5 text-center">
                            <label className="block text-gray-700 mb-2 font-medium" htmlFor="kontrahent_id">
                                Firma (Kontrahent):
                            </label>
                            <select
                                id="kontrahent_id"
                                {...register("kontrahent_id", { required: "Wybór kontrahenta jest wymagany" })}
                                className="mx-auto w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                            >
                                <option value="">Wybierz kontrahenta...</option>
                                {contractors.map(c => (
                                    <option key={c.id} value={String(c.id)}>
                                        {c.firma}
                                    </option>
                                ))}
                            </select>
                            {errors.kontrahent_id && (
                                <span className="text-red-500 text-sm block mt-1">{errors.kontrahent_id.message}</span>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="mx-auto w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                        >
                            Zarejestruj się
                        </button>

                        {message && (
                            <p className="mt-6 text-center text-sm text-gray-700">{message}</p>
                        )}

                        <p className="mt-4 text-center text-sm text-gray-600">
                            Masz konto?{" "}
                            <Link to="/login" className="text-blue-500 hover:underline">
                                Zaloguj się
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
