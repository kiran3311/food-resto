import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import { AdminLayout } from "./layouts/AdminLayout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { StallPage } from "./pages/StallPage";
import { MenuPage } from "./pages/MenuPage";
import { CombosPage } from "./pages/CombosPage";
import { OrdersPage } from "./pages/OrdersPage";
import { RecentOrdersPage } from "./pages/RecentOrdersPage";
import { ReceiptPage } from "./pages/ReceiptPage";

export const App = (): JSX.Element => {
  return (
    <>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/recent-orders" element={<RecentOrdersPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/combos" element={<CombosPage />} />
            <Route path="/settings/shop-profile" element={<StallPage />} />
            <Route path="/stall" element={<Navigate to="/settings/shop-profile" replace />} />
          </Route>
          <Route path="/orders/:id/receipt" element={<ReceiptPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "10px"
          }
        }}
      />
    </>
  );
};
