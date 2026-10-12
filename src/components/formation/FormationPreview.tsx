import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Video, FileText, Lock, CheckCircle, Play, ShoppingCart, Image, X } from 'lucide-react';
import { Formation, FormationContent } from '@/hooks/useFormations';
import { RestrictedVideoPlayer } from './RestrictedVideoPlayer';

interface FormationPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formation: Formation | null;
  content: FormationContent[];
}

export function FormationPreview({ open, onOpenChange, formation, content }: FormationPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'catalog' | 'enrolled'>('catalog');
  const [selectedContentIndex, setSelectedContentIndex] = useState(0);

  if (!formation) return null;

  const videoCount = content.filter(c => c.content_type === 'video').length;
  const pdfCount = content.filter(c => c.content_type === 'pdf').length;
  const currentContent = content[selectedContentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Preview: {formation.title}</span>
            <Badge variant="outline">Teacher Preview Mode</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={previewMode === 'catalog' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('catalog')}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            As Student Browsing
          </Button>
          <Button
            variant={previewMode === 'enrolled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('enrolled')}
          >
            <Play className="h-4 w-4 mr-2" />
            As Enrolled Student
          </Button>
        </div>

        {previewMode === 'catalog' ? (
          // Catalog View - how students see the course before enrolling
          <Card className="overflow-hidden">
            {formation.thumbnail_url ? (
              <img 
                src={formation.thumbnail_url} 
                alt={formation.title}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-muted flex items-center justify-center">
                <Image className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <CardHeader>
              <CardTitle>{formation.title}</CardTitle>
              <CardDescription>{formation.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Video className="h-4 w-4" />
                  <span>{videoCount} videos</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>{pdfCount} PDFs</span>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Course Content</h4>
                <div className="space-y-2">
                  {content.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{index + 1}. {item.title}</span>
                      {item.duration_seconds && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {Math.floor(item.duration_seconds / 60)}:
                          {(item.duration_seconds % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  ))}
                  {content.length === 0 && (
                    <p className="text-sm text-muted-foreground">No content available</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center border-t pt-4">
              <div className="text-2xl font-bold text-primary">
                {formation.price} {formation.currency}
              </div>
              <Button disabled>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Enroll (Preview)
              </Button>
            </CardFooter>
          </Card>
        ) : (
          // Enrolled View - how students see the course after enrolling
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Player Area */}
            <div className="lg:col-span-2">
              {currentContent?.content_type === 'video' ? (
                <RestrictedVideoPlayer
                  src={currentContent.file_url}
                  title={currentContent.title}
                  duration={currentContent.duration_seconds || undefined}
                  isLocked={false}
                  initialProgress={0}
                  onProgress={() => {}}
                  onComplete={() => {}}
                />
              ) : currentContent?.content_type === 'pdf' ? (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4 p-6 text-center">
                    <FileText className="h-16 w-16 text-primary" />
                    <p className="font-medium">{currentContent.title}</p>
                    <Button disabled>Open PDF (Preview)</Button>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Select content from the list</p>
                </div>
              )}
            </div>

            {/* Content List */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Course Content</h4>
                <Badge variant="secondary">0% Complete</Badge>
              </div>
              <Progress value={0} className="h-2 mb-4" />
              {content.map((item, index) => {
                const isFirst = index === 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedContentIndex(index)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedContentIndex === index 
                        ? 'bg-primary text-primary-foreground' 
                        : isFirst 
                          ? 'bg-muted hover:bg-muted/80' 
                          : 'bg-muted/50 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.content_type === 'video' ? (
                        isFirst ? <Video className="h-5 w-5 shrink-0" /> : <Lock className="h-5 w-5 shrink-0" />
                      ) : (
                        isFirst ? <FileText className="h-5 w-5 shrink-0" /> : <Lock className="h-5 w-5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{index + 1}. {item.title}</p>
                        {item.duration_seconds && (
                          <p className="text-xs opacity-70">
                            {Math.floor(item.duration_seconds / 60)}:
                            {(item.duration_seconds % 60).toString().padStart(2, '0')}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
