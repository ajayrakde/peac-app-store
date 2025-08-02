import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadDocument } from '@/lib/documentApi';
import { useToast } from '@/hooks/use-toast';

type Doc = { type: string; filename: string; uploadedAt: string };

interface Props {
  userType?: 'candidate' | 'employer';
  docs: Doc[];
  uid?: string;
  hideFilename?: boolean;
}

export const DocumentList: React.FC<Props> = ({
  userType,
  docs,
  uid,
  hideFilename,
}) => {
  const { toast } = useToast();

  const handleDownload = async (doc: Doc) => {
    try {
      let blob: Blob;
      let name: string = doc.filename;

      if (userType) {
        const result = await downloadDocument(userType, doc.type, doc.filename, uid);
        blob = result.blob;
        name = result.name;
      } else {
        throw new Error('Invalid download configuration');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({
        title: 'Download failed',
        description: err.message || 'Unable to download document',
        variant: 'destructive',
      });
    }
  };

  if (!docs || docs.length === 0) {
    return <p className="text-sm text-muted-foreground">No documents uploaded.</p>;
  }

  return (
    <div className="space-y-2">
      {docs.map((doc) => (
        <div
          key={`${doc.type}-${doc.filename}`}
          className="flex items-center justify-between border border-border rounded p-2"
        >
          <div className="text-sm">
            <span className="font-medium capitalize mr-2">{doc.type}</span>
            {!hideFilename && (
              <span className="text-muted-foreground text-xs">{doc.filename}</span>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={() => handleDownload(doc)}>
            <Download className="h-4 w-4 mr-1" /> Download
          </Button>
        </div>
      ))}
    </div>
  );
};
