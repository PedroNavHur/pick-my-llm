import ChatPanel from "@/components/chatPanel";
import MetricSelector from "@/components/metricSelector";
import ModelTable from "@/components/modelTable";

export default function Page() {
  return (
    <div>
      <div className="card container bg-base-100 shadow-sm mx-auto my-10 p-4">
        <p className="text-xl font-bold text-neutral px-2">
          Welcome to Pick My LLM
        </p>
        <div className="flex gap-4">
          <div className="flex-1">
            <MetricSelector />
            <ModelTable />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <ChatPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
