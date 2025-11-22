import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Tools from './pages/Tools';
import UserDashboard from './pages/UserDashboard';
import Profile from './pages/Profile';
import WatermarkPDF from './pages/WatermarkPDF';
import ProtectPDF from './pages/ProtectPDF';
import SplitPDF from './pages/SplitPDF';
import MergePDF from './pages/MergePDF';
import PdfToWord from './pages/PdfToWord';
import WordToPdf from './pages/WordToPdf';
import ImageToPdf from './pages/ImageToPdf';
import PdfToText from './pages/PdfToText';
import PdfToEpub from './pages/PdfToEpub';
import PdfOcr from './pages/PdfOcr';
import CompressPdf from './pages/CompressPdf';
import AuthCallback from './pages/AuthCallback';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Contact from './pages/Contact';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/tools"
          element={
            <ProtectedRoute>
              <Tools />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pdf-to-word"
          element={
            <ProtectedRoute>
              <PdfToWord />
            </ProtectedRoute>
          }
        />
        <Route
          path="/word-to-pdf"
          element={
            <ProtectedRoute>
              <WordToPdf />
            </ProtectedRoute>
          }
        />
        <Route
          path="/image-to-pdf"
          element={
            <ProtectedRoute>
              <ImageToPdf />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pdf-to-text"
          element={
            <ProtectedRoute>
              <PdfToText />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pdf-to-epub"
          element={
            <ProtectedRoute>
              <PdfToEpub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pdf-ocr"
          element={
            <ProtectedRoute>
              <PdfOcr />
            </ProtectedRoute>
          }
        />
        <Route
          path="/compress-pdf"
          element={
            <ProtectedRoute>
              <CompressPdf />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/watermark-pdf"
          element={
            <ProtectedRoute>
              <WatermarkPDF />
            </ProtectedRoute>
          }
        />
        <Route
          path="/protect-pdf"
          element={
            <ProtectedRoute>
              <ProtectPDF />
            </ProtectedRoute>
          }
        />
        <Route
          path="/split-pdf"
          element={
            <ProtectedRoute>
              <SplitPDF />
            </ProtectedRoute>
          }
        />
        <Route
          path="/merge-pdf"
          element={
            <ProtectedRoute>
              <MergePDF />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

