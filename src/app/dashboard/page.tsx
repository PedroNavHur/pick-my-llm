import MetricSelector from "@/components/metricSelector";

export default function Page() {
  return (
    <div>
      <div className="card container bg-base-100 shadow-sm mx-auto my-10 p-4">
        <p className="text-2xl font-bold text-base-content">
          Help us understand your needs
        </p>
        <div className="flex">
          <div className="flex-1 py-4">
            <MetricSelector />
          </div>
          <div className="flex items-center justify-center flex-2">
            <div className="flex-1 w-30"></div>
            <div className="card bg-base-3s00 flex-5 p-4">
              <p className="card-text">Welcome to pick my llm.</p>
              <div className="flex items-center justify-center">
                <div className="flex-1 card bg-base-200">
                  <textarea
                    className="textarea textarea-ghost"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
