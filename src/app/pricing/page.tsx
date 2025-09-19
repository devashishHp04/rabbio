
import { getCurrentUser } from '@/services/auth';
import PricingClient from './client';

export default async function PricingPage() {
  const user = await getCurrentUser();

  return (
      <main className="p-4 md:p-6">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              Pick the plan that's right for you
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Flexible plans for sites, CROs, analysts, and pharma—choose the
              insights that move your pipeline forward.
            </p>
          </div>
          <PricingClient user={user} />
        </div>
      </main>
  );
}
