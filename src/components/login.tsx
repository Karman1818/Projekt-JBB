import React from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

type LoginData = {
    email: string;
    password: string;
};

const Login = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<LoginData>();
    const [message, setMessage] = React.useState("");

    const onSubmit = async (data: LoginData) => {
        try {
            const response = await fetch("http://localhost/backend/login.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            const resData = await response.json();
            if (resData.token) {
                localStorage.setItem("token", resData.token);
                window.location.href = "/";
            } else {
                setMessage(resData.message || resData.error || "Logowanie zakończone!");
            }
        } catch (error) {
            console.error("Błąd logowania:", error);
            setMessage("Logowanie nie powiodło się.");
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
                        <h2 className="text-3xl font-extrabold mb-8 text-center text-black">Logowanie</h2>
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
                        <div className="mb-7 text-center">
                            <label className="block text-gray-700 mb-2 font-medium" htmlFor="password">
                                Hasło:
                            </label>
                            <input
                                type="password"
                                id="password"
                                {...register("password", { required: "Hasło jest wymagane" })}
                                className="mx-auto w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                            />
                            {errors.password && (
                                <span className="text-red-500 text-sm block mt-1">{errors.password.message}</span>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="mx-auto w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                        >
                            Zaloguj się
                        </button>
                        {message && (
                            <p className="mt-6 text-center text-sm text-gray-700">{message}</p>
                        )}
                        <p className="mt-4 text-center text-sm text-gray-600">
                            Nie masz konta?{" "}
                            <Link to="/register" className="text-blue-500 hover:underline">
                                Zarejestruj się
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;