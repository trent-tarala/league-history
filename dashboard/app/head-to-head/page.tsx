import { Card } from "@/components/Card";
import { HeadToHeadMatrix } from "@/components/HeadToHeadMatrix";

export default function HeadToHeadPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Head-to-Head Matrix</h1>
        <p className="text-ink-dim text-sm mt-1">
          Every owner vs every other owner across all seasons. Click any cell to
          see every game.
        </p>
      </header>
      <Card>
        <HeadToHeadMatrix />
      </Card>
    </div>
  );
}
