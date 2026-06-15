import { Suspense } from "react";
import ProfessionalInvoicePage from "../components/ProfessionalInvoicePage";

export default function SalesReturnPage() {
  return (
    <Suspense fallback={null}>
      <ProfessionalInvoicePage type="sales-return" />
    </Suspense>
  );
}
