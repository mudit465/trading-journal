import { getConcepts } from "@/lib/actions/concepts";
import { ConceptsManager } from "@/components/concepts/concepts-manager";

export default async function ConceptsPage() {
  const concepts = await getConcepts();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Concepts</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Create labels for the trading concepts and strategies you use
        </p>
      </div>
      <ConceptsManager initialConcepts={concepts} />
    </div>
  );
}
