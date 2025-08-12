import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./components/register";
import Login from "./components/login";
import Main from "./components/main";
import Agreement from "./components/agreement";
import NotFound from "./components/notFound";
import { GetAgreement } from "./components/get_agreement";
import Commodity from "./components/commodity";


const isAuthenticated = () => {
    return !!localStorage.getItem("token");
};

const Router = () => (
    <BrowserRouter>
        <Routes>
            <Route
                path="/"
                element={
                    isAuthenticated() ? <Main /> : <Navigate to="/login" replace />
                }
            />
            <Route
                path="/login"
                element={
                    isAuthenticated() ? <Navigate to="/" replace /> : <Login />
                }
            />
            <Route
                path="/register"
                element={
                    isAuthenticated() ? <Navigate to="/" replace /> : <Register />
                }
            />
            <Route
                path="/agreement"
                element={
                    isAuthenticated() ?  <Agreement /> : <Navigate to="/" replace />
                }
            />
             <Route
                path="/commodity"
                element={
                    isAuthenticated() ?  <Commodity /> : <Navigate to="/" replace />
                }
            />
             <Route
                path="/get_agreement"
                element={
                    isAuthenticated() ?  <GetAgreement /> : <Navigate to="/" replace />
                }
            />
             <Route
                path="*"
                element={<NotFound />}
            />
            
        </Routes>
    </BrowserRouter>
);

export default Router;