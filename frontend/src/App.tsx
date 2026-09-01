import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

import Landing from './pages/Landing';
import Tools from './pages/Tools';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import RequireAuth from './components/RequireAuth';

// Tool screens are split out so the landing page ships the smallest bundle.
const PdfToWord = lazy(() => import('./pages/PdfToWord'));
const WordToPdf = lazy(() => import('./pages/WordToPdf'));
const ImageToPdf = lazy(() => import('./pages/ImageToPdf'));
const PdfToText = lazy(() => import('./pages/PdfToText'));
const PdfToEpub = lazy(() => import('./pages/PdfToEpub'));
const MergePDF = lazy(() => import('./pages/MergePDF'));
const SplitPDF = lazy(() => import('./pages/SplitPDF'));
const CompressPdf = lazy(() => import('./pages/CompressPdf'));
const PdfOcr = lazy(() => import('./pages/PdfOcr'));
const WatermarkPDF = lazy(() => import('./pages/WatermarkPDF'));
const ProtectPDF = lazy(() => import('./pages/ProtectPDF'));
const UnlockPDF = lazy(() => import('./pages/UnlockPDF'));

const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Contact = lazy(() => import('./pages/Contact'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));

function RouteFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Loading">
      <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/tools" element={<Tools />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* Tools are open to everyone; an account only adds activity history. */}
        <Route path="/pdf-to-word" element={<PdfToWord />} />
        <Route path="/word-to-pdf" element={<WordToPdf />} />
        <Route path="/image-to-pdf" element={<ImageToPdf />} />
        <Route path="/pdf-to-text" element={<PdfToText />} />
        <Route path="/pdf-to-epub" element={<PdfToEpub />} />
        <Route path="/merge-pdf" element={<MergePDF />} />
        <Route path="/split-pdf" element={<SplitPDF />} />
        <Route path="/compress-pdf" element={<CompressPdf />} />
        <Route path="/pdf-ocr" element={<PdfOcr />} />
        <Route path="/watermark-pdf" element={<WatermarkPDF />} />
        <Route path="/protect-pdf" element={<ProtectPDF />} />
        <Route path="/unlock-pdf" element={<UnlockPDF />} />

        <Route
          path="/my-dashboard"
          element={
            <RequireAuth>
              <UserDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
