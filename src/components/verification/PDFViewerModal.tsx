import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  documentName: string;
}

export function PDFViewerModal({
  isOpen,
  onClose,
  documentUrl,
  documentName
}: PDFViewerModalProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = documentName;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-background w-full max-w-5xl h-[90vh] flex flex-col rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold truncate flex-1">{documentName}</h2>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Download */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-8 w-8 p-0"
              title="Télécharger"
            >
              <Download className="w-4 h-4" />
            </Button>

            {/* Close */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-muted/30 flex items-start justify-center p-4">
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true`}
            className="w-full h-full min-h-[600px] border-0"
            title={documentName}
          />
        </div>
      </div>
    </div>
  );
}

