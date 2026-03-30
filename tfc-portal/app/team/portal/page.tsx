export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import TeamPortalClient from "./TeamPortalClient";

export default function TeamPortalPage() {
  return (
    <Suspense>
      <TeamPortalClient />
    </Suspense>
  );
}
