import { Suspense } from "react";
import ProfessionalInvoicePage from "../components/ProfessionalInvoicePage";

export default function PurchaseAdjustmentPage() {
  return (
    <Suspense fallback={null}>
      <ProfessionalInvoicePage type="purchase-adjustment" />
    </Suspense>
  );
}
