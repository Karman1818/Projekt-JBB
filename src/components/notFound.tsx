import { useNavigate } from "react-router-dom";
import Navbar from "./navbar";
import { useState, useEffect } from "react";
import "../css/agreement.css";

const NotFound = () => {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowContent(true);
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <Navbar />
      <div className="h-screen w-screen bg-gradient-to-br from-blue-100 to-blue-500 flex flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-10 text-center max-w-4xl w-full">
            <h1
              className={`text-4xl font-bold text-blue-600 mb-4 transition-all duration-700 ${
                showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              404 - Strona nie znaleziona
            </h1>
            <p
              className={`text-lg text-gray-700 mb-8 transition-all duration-700 delay-100 ${
                showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Przepraszamy, ale strona, której szukasz, nie istnieje lub została przeniesiona.
            </p>
            <div
              className={`flex justify-center gap-4 transition-all duration-700 delay-200 ${
                showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <button
                onClick={() => navigate("/")}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Wróć do strony głównej
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
