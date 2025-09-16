import ImportReport from '../ImportReport';

export default function ImportReportExample() {
  const mockStats = {
    totalRows: 45,
    validRows: 42,
    invalidRows: 3,
    unitCounts: {
      reps: 28,
      seconds: 12,
      steps: 2
    },
    malformedTokens: [
      "15-20reps",
      "30sec hold",
      "walk 100 steps forward",
      "10x each side",
      "failure set"
    ],
    parsingTime: 156
  };

  return (
    <div className="bg-gradient-to-br from-blue-600 to-purple-700 min-h-screen p-4">
      <div className="max-w-lg mx-auto pt-10">
        <ImportReport 
          stats={mockStats}
          filename="TREINO SETEMBRO.csv"
          onClose={() => console.log('Report closed')}
        />
      </div>
    </div>
  );
}