import React, { useState, useEffect, useCallback } from 'react';
import { getTemplates, TemplateData } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Palette, Minimize2, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLoading } from '@/hooks/use-loading';
import { LoadingSpinner } from '@/components/ui/loading';
import { GenericError } from '@/components/error/ErrorStates';
import { toast } from 'sonner';

interface TemplateSelectorProps {
  onTemplateSelect: (template: TemplateData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const categoryIcons = {
  modern: Briefcase,
  classic: FileText,
  creative: Palette,
  minimal: Minimize2,
};

const categoryColors = {
  modern: 'bg-blue-100 text-blue-800',
  classic: 'bg-gray-100 text-gray-800',
  creative: 'bg-purple-100 text-purple-800',
  minimal: 'bg-green-100 text-green-800',
};

export function TemplateSelector({ onTemplateSelect, onCancel, isLoading = false }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const { state: loadingState, execute: executeLoad } = useLoading();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = useCallback(async () => {
    await executeLoad(async () => {
      const templatesData = await getTemplates();
      setTemplates(templatesData);
      toast.success('Templates loaded successfully');
    }, {
      onError: (error) => {
        toast.error('Failed to load templates');
      }
    });
  }, [executeLoad]);

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];
  
  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const handleTemplateSelect = (template: TemplateData) => {
    setSelectedTemplate(template.id);
    onTemplateSelect(template);
  };

  if (loadingState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading templates..." />
      </div>
    );
  }

  if (loadingState.error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{loadingState.error}</p>
          <Button onClick={fetchTemplates} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Resume Template
        </h2>
        <p className="text-gray-600">
          Select a template to generate your improved resume
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <Button
              key={category}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "capitalize",
                isSelected && "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {category === 'all' ? 'All Templates' : category}
            </Button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const IconComponent = categoryIcons[template.category as keyof typeof categoryIcons] || FileText;
          const isSelected = selectedTemplate === template.id;
          
          return (
            <Card 
              key={template.id} 
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-lg",
                isSelected && "ring-2 ring-blue-500 shadow-lg"
              )}
              onClick={() => handleTemplateSelect(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-5 w-5 text-gray-600" />
                    <CardTitle className="text-lg">{template.displayName}</CardTitle>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "capitalize",
                      categoryColors[template.category as keyof typeof categoryColors]
                    )}
                  >
                    {template.category}
                  </Badge>
                </div>
                {template.description && (
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent>
                {/* Template Preview Placeholder */}
                <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  {template.previewImageUrl ? (
                    <img 
                      src={template.previewImageUrl} 
                      alt={`${template.displayName} preview`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center text-gray-500">
                      <IconComponent className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">Preview</p>
                    </div>
                  )}
                </div>
                
                <Button 
                  className={cn(
                    "w-full",
                    isSelected && "bg-blue-600 hover:bg-blue-700"
                  )}
                  variant={isSelected ? "default" : "outline"}
                  disabled={isLoading}
                >
                  {isLoading && selectedTemplate === template.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : isSelected ? (
                    'Selected'
                  ) : (
                    'Select Template'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No templates found for the selected category.</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 pt-6">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}