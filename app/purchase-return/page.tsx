import { Suspense } from "react";
import ProfessionalInvoicePage from "../components/ProfessionalInvoicePage";

export default function PurchaseReturnPage() {
  return (
    <Suspense fallback={null}>
      <ProfessionalInvoicePage type="purchase-return" />
    </Suspense>
  );
}
