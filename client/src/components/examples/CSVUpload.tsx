import CSVUpload from '../CSVUpload';

export default function CSVUploadExample() {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-purple-700 min-h-screen p-4">
      <div className="max-w-md mx-auto pt-20">
        <CSVUpload
          onFileSelect={(file) => console.log('File selected:', file.name)}
          onParse={(data) => console.log('Parsed data:', data)}
          isProcessing={false}
        />
      </div>
    </div>
  );
}