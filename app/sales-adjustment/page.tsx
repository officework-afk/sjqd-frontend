import { Suspense } from "react";
import ProfessionalInvoicePage from "../components/ProfessionalInvoicePage";

export default function SalesAdjustmentPage() {
  return (
    <Suspense fallback={null}>
      <ProfessionalInvoicePage type="sales-adjustment" />
    </Suspense>
  );
}
