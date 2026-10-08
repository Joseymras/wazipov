import { Navigate, useParams } from "react-router-dom";

/** Short public link printed in QR codes: /e/CODE opens the guest camera. */
export default function EventLinkPage() {
  const { code } = useParams();
  return <Navigate to={`/camera/${encodeURIComponent((code || "").toUpperCase())}`} replace />;
}
