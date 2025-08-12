import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    return (
        <nav className="w-full bg-white shadow-md flex items-center justify-between px-8 py-4">
            <span onClick={() => navigate("/")} className="text-2xl font-bold text-blue-600 cursor-pointer">JBB</span>
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate("/get_agreement")}
                    className="px-5 py-2 bg-blue-100 text-white rounded-lg font-semibold hover:bg-blue-200 transition-colors"
                >
                    Zobacz Porozumienia
                </button>
                <button 
                    onClick={() => navigate("/agreement")}
                    className="px-5 py-2 bg-blue-100 text-white rounded-lg font-semibold hover:bg-blue-200 transition-colors"
                >
                    Dodaj Porozumienie
                </button>
                <button
                    onClick={handleLogout}
                    className="px-5 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                >
                    Wyloguj
                </button>
            </div>
        </nav>
    );
};

export default Navbar;