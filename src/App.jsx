import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import ExamRegistrationPage from "./pages/ExamRegistrationPage";
import { ThemeProvider } from "./theme/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/registro" element={<ExamRegistrationPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/registro" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
//function SignOutButton() 


