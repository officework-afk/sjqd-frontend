import { Suspense } from "react";
import ProfessionalInvoicePage from "../components/ProfessionalInvoicePage";

export default function PurchasePage() {
  return (
    <Suspense fallback={null}>
      <ProfessionalInvoicePage type="purchase" />
    </Suspense>
  );
}
