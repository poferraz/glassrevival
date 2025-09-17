import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { SessionTemplate } from "@shared/schema";
import { 
  loadSessionTemplates, 
  saveSessionTemplate, 
  deleteSessionTemplate,
  convertCSVDataToTemplates,
  createSessionInstanceFromTemplate,
  getTodayString
} from "@/utils/sessionStorage";
import { loadWorkoutData } from "@/utils/storage";
import { estimateSessionDuration, generateUniqueId } from "@/utils/workoutHelpers";
import { parseTrainingCSV } from "@/utils/trainingCsvParser";
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  LibraryBig, 
  Play, 
  Edit, 
  Trash2, 
  Clock, 
  Target,
  Upload,
  Copy,
  Calendar
} from "lucide-react";

export default function Sessions() {
  const [, navigate] = useLocation();
  const [sessionTemplates, setSessionTemplates] = useState<SessionTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showUseDialog, setShowUseDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SessionTemplate | null>(null);
  const trainingFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const templates = loadSessionTemplates();
    setSessionTemplates(templates);
    
    // Extract all unique tags
    const tags = new Set<string>();
    templates.forEach(template => {
      template.tags.forEach(tag => tags.add(tag));
    });
    setAllTags(Array.from(tags));
  };

  const handleCreateTemplate = () => {
    // Create a new empty template
    const newTemplate: SessionTemplate = {
      id: generateUniqueId(),
      name: "New Session",
      description: "",
      exercises: [],
      estimatedDurationMinutes: 0,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    saveSessionTemplate(newTemplate);
    loadData();
    console.log('New session template created:', newTemplate.name);
  };

  const handleDuplicateTemplate = (template: SessionTemplate) => {
    const duplicatedTemplate: SessionTemplate = {
      ...template,
      id: generateUniqueId(),
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    saveSessionTemplate(duplicatedTemplate);
    loadData();
    console.log('Session template duplicated:', duplicatedTemplate.name);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this session template?')) {
      deleteSessionTemplate(templateId);
      loadData();
      console.log('Session template deleted:', templateId);
    }
  };

  const handleImportFromCSV = () => {
    // Check if there's existing CSV data to convert
    const csvData = loadWorkoutData();
    if (csvData && csvData.data.length > 0) {
      const convertedTemplates = convertCSVDataToTemplates(csvData.data);
      
      // Save each template
      convertedTemplates.forEach(template => {
        saveSessionTemplate(template);
      });
      
      loadData();
      console.log(`Imported ${convertedTemplates.length} session templates from CSV data`);
    } else {
      console.log('No CSV data found to import');
    }
  };

  const handleImportTrainingCSV = () => {
    if (trainingFileInputRef.current) {
      trainingFileInputRef.current.click();
    }
  };

  const handleTrainingFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const result = parseTrainingCSV(content);
      
      if (result.errors.length > 0) {
        console.error('CSV parsing errors:', result.errors);
        alert(`Import failed with errors:\n${result.errors.join('\n')}`);
        return;
      }

      // Save each session template
      result.sessions.forEach(template => {
        saveSessionTemplate(template);
      });

      loadData();
      console.log(`Successfully imported ${result.sessions.length} training sessions from CSV`);
      alert(`Successfully imported ${result.sessions.length} training sessions!`);
      
    } catch (error) {
      console.error('Failed to import training CSV:', error);
      alert(`Failed to import training CSV: ${error}`);
    }

    // Reset file input
    if (trainingFileInputRef.current) {
      trainingFileInputRef.current.value = '';
    }
  };

  const handleUseTemplate = (template: SessionTemplate) => {
    setSelectedTemplate(template);
    setShowUseDialog(true);
  };

  const handleUseNow = () => {
    if (!selectedTemplate) return;
    
    try {
      // Create a session instance for today
      const instance = createSessionInstanceFromTemplate(selectedTemplate, getTodayString());
      
      // Navigate to workout mode with the new instance
      navigate(`/workout/${instance.id}`);
      console.log(`Started workout from template: ${selectedTemplate.name}`);
    } catch (error) {
      console.error('Failed to start workout:', error);
    }
  };

  const handleScheduleForLater = () => {
    // Navigate to calendar with template context (we'll implement this later)
    navigate('/');
    setShowUseDialog(false);
    console.log('Navigate to calendar to schedule session');
  };

  const filteredTemplates = sessionTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => template.tags.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <GlassCard variant="secondary">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-white" data-testid="sessions-title">
                  Session Templates
                </h1>
                <p className="text-sm text-white/60">
                  Create and manage your workout session templates
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleImportTrainingCSV}
                  className="text-white border-white/20 hover:bg-white/10"
                  data-testid="button-import-training-csv"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Import Training CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleImportFromCSV}
                  className="text-white border-white/20 hover:bg-white/10"
                  data-testid="button-import-csv"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Import Legacy CSV
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleCreateTemplate}
                  data-testid="button-create-template"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New Template
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search session templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                data-testid="input-search-templates"
              />
              
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-white/60">Filter by tags:</span>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTagFilter(tag)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                      }`}
                      data-testid={`tag-filter-${tag}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Session Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <GlassCard variant="tertiary">
            <div className="p-8 text-center">
              <LibraryBig className="w-16 h-16 text-white/30 mx-auto mb-4" />
              {sessionTemplates.length === 0 ? (
                <>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No Session Templates Yet
                  </h3>
                  <p className="text-white/60 mb-6 max-w-md mx-auto">
                    Create your first session template to get started, or import existing workout data from CSV.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button
                      variant="default"
                      onClick={handleCreateTemplate}
                      data-testid="button-create-first-template"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Template
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleImportFromCSV}
                      className="text-white border-white/20 hover:bg-white/10"
                      data-testid="button-import-first-csv"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import from CSV
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No Templates Match Your Search
                  </h3>
                  <p className="text-white/60 mb-4">
                    Try adjusting your search terms or filters
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedTags([]);
                    }}
                    className="text-white border-white/20 hover:bg-white/10"
                    data-testid="button-clear-filters"
                  >
                    Clear Filters
                  </Button>
                </>
              )}
            </div>
          </GlassCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <GlassCard key={template.id} variant="tertiary">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate" data-testid={`template-title-${template.id}`}>
                        {template.name}
                      </h3>
                      {template.description && (
                        <p className="text-sm text-white/60 mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDuplicateTemplate(template)}
                        className="w-8 h-8 text-white/60 hover:text-white"
                        data-testid={`button-duplicate-${template.id}`}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 text-white/60 hover:text-white"
                        data-testid={`button-edit-${template.id}`}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="w-8 h-8 text-red-400 hover:text-red-300"
                        data-testid={`button-delete-${template.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        <span>{template.exercises.length} exercises</span>
                      </div>
                      {template.estimatedDurationMinutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{template.estimatedDurationMinutes}min</span>
                        </div>
                      )}
                    </div>

                    {template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs bg-white/10 text-white/70 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={() => handleUseTemplate(template)}
                      data-testid={`button-use-${template.id}`}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Use Template
                    </Button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="text-xs text-white/40">
                      Created {new Date(template.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {sessionTemplates.length > 0 && (
          <GlassCard variant="tertiary">
            <div className="p-4">
              <h3 className="text-sm font-medium text-white/80 mb-3">Template Library Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-white">
                    {sessionTemplates.length}
                  </div>
                  <div className="text-xs text-white/60">Total Templates</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">
                    {allTags.length}
                  </div>
                  <div className="text-xs text-white/60">Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">
                    {sessionTemplates.reduce((sum, t) => sum + t.exercises.length, 0)}
                  </div>
                  <div className="text-xs text-white/60">Total Exercises</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">
                    {Math.round(sessionTemplates.reduce((sum, t) => sum + (t.estimatedDurationMinutes || 0), 0) / sessionTemplates.length) || 0}
                  </div>
                  <div className="text-xs text-white/60">Avg Duration (min)</div>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Use Template Dialog */}
        <Dialog open={showUseDialog} onOpenChange={setShowUseDialog}>
          <DialogContent className="bg-gray-900/95 border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Use Template: {selectedTemplate?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {selectedTemplate && (
                <div className="space-y-3">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-4 text-sm text-white/60 mb-2">
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        <span>{selectedTemplate.exercises.length} exercises</span>
                      </div>
                      {selectedTemplate.estimatedDurationMinutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{selectedTemplate.estimatedDurationMinutes}min</span>
                        </div>
                      )}
                    </div>
                    {selectedTemplate.description && (
                      <p className="text-sm text-white/80">{selectedTemplate.description}</p>
                    )}
                  </div>
                  
                  <p className="text-sm text-white/60">
                    Choose how you'd like to use this template:
                  </p>
                  
                  <div className="grid gap-3">
                    <Button
                      className="justify-start h-auto p-4"
                      onClick={handleUseNow}
                      data-testid="button-use-now"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Play className="w-5 h-5 flex-shrink-0" />
                        <div className="text-left">
                          <div className="font-medium">Start Workout Now</div>
                          <div className="text-xs text-white/60">Begin immediately with this template</div>
                        </div>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="justify-start h-auto p-4 text-white border-white/20 hover:bg-white/10"
                      onClick={handleScheduleForLater}
                      data-testid="button-schedule-later"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Calendar className="w-5 h-5 flex-shrink-0" />
                        <div className="text-left">
                          <div className="font-medium">Schedule for Later</div>
                          <div className="text-xs text-white/60">Add to your calendar for a specific date/time</div>
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  className="text-white border-white/20 hover:bg-white/10"
                  onClick={() => setShowUseDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Hidden file input for training CSV import */}
        <input
          ref={trainingFileInputRef}
          type="file"
          accept=".csv"
          onChange={handleTrainingFileSelect}
          style={{ display: 'none' }}
          data-testid="input-training-csv-file"
        />
      </div>
    </Layout>
  );
}