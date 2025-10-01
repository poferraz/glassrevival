import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { SessionTemplate, SessionExercise } from "@shared/schema";
import { 
  loadSessionTemplates, 
  saveSessionTemplate, 
  deleteSessionTemplate,
  createSessionInstanceFromTemplate,
  getTodayString
} from "@/utils/sessionStorage";
import { estimateSessionDuration, generateUniqueId } from "@/utils/workoutHelpers";
import { parseTrainingCSV } from "@/utils/trainingCsvParser";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Calendar,
  GripVertical
} from "lucide-react";

export default function Sessions() {
  const [, navigate] = useLocation();
  const [sessionTemplates, setSessionTemplates] = useState<SessionTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showUseDialog, setShowUseDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SessionTemplate | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SessionTemplate | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    tags: [] as string[],
    newTag: ''
  });
  const [showExerciseEditDialog, setShowExerciseEditDialog] = useState(false);
  const [editingExercise, setEditingExercise] = useState<SessionExercise | null>(null);
  const [editingExerciseTemplateId, setEditingExerciseTemplateId] = useState<string | null>(null);
  const [exerciseEditForm, setExerciseEditForm] = useState({
    name: '',
    sets: 1,
    repsMin: 0,
    repsMax: 0,
    timeSecondsMin: 0,
    timeSecondsMax: 0,
    stepsCount: 0,
    unit: 'reps' as 'reps' | 'seconds' | 'steps',
    perSide: false,
    weight: 0,
    notes: '',
    formGuidance: '',
    muscleGroup: '',
    mainMuscle: '',
    restSeconds: 60
  });
  const trainingFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const templates = loadSessionTemplates();
    setSessionTemplates(templates);
    
    // Extract all unique muscle groups from exercises
    const muscleGroups = new Set<string>();
    templates.forEach(template => {
      template.exercises.forEach(exercise => {
        if (exercise.muscleGroup) {
          muscleGroups.add(exercise.muscleGroup);
        }
      });
    });
    setAllTags(Array.from(muscleGroups).sort());
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
      
      // Check if this looks like a legacy CSV format
      const lines = content.trim().split(/\r?\n/);
      if (lines.length > 0) {
        const header = lines[0].toLowerCase();
        // Legacy CSV detection - if it doesn't have the expected training CSV columns
        if (!header.includes('day') || !header.includes('exercise') || !header.includes('reps/time')) {
          // This looks like a legacy CSV format
          alert(`This appears to be a legacy CSV format. Please use the new training CSV format instead.\n\nExpected columns: Day, Exercise, Sets, Reps/Time, Weight, Notes, Form Guidance, Muscle Group, Main Muscle\n\nFor help with the format, create a sample template and refer to the documentation.`);
          
          // Reset file input
          if (trainingFileInputRef.current) {
            trainingFileInputRef.current.value = '';
          }
          return;
        }
      }
      
      const result = parseTrainingCSV(content);
      
      if (result.errors.length > 0) {
        console.error('CSV parsing errors:', result.errors);
        alert(`Import failed with errors:\n${result.errors.join('\n')}\n\nPlease check your CSV format and try again.`);
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

  const handleEditTemplate = (template: SessionTemplate) => {
    setEditingTemplate(template);
    setEditForm({
      name: template.name,
      description: template.description || '',
      tags: [...template.tags],
      newTag: ''
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editingTemplate) return;
    
    const updatedTemplate: SessionTemplate = {
      ...editingTemplate,
      name: editForm.name.trim(),
      description: editForm.description.trim() || undefined,
      tags: editForm.tags,
      updatedAt: new Date().toISOString()
    };
    
    saveSessionTemplate(updatedTemplate);
    loadData();
    setShowEditDialog(false);
    setEditingTemplate(null);
    console.log('Session template updated:', updatedTemplate.name);
  };

  const handleAddTag = () => {
    const newTag = editForm.newTag.trim();
    if (newTag && !editForm.tags.includes(newTag)) {
      setEditForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag],
        newTag: ''
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSaveExerciseEdit = () => {
    if (!editingExercise || !editingExerciseTemplateId) return;
    
    const template = sessionTemplates.find(t => t.id === editingExerciseTemplateId);
    if (!template) return;
    
    const updatedExercise: SessionExercise = {
      ...editingExercise,
      name: exerciseEditForm.name.trim(),
      sets: exerciseEditForm.sets,
      repsMin: exerciseEditForm.unit === 'reps' ? exerciseEditForm.repsMin : undefined,
      repsMax: exerciseEditForm.unit === 'reps' ? exerciseEditForm.repsMax : undefined,
      timeSecondsMin: exerciseEditForm.unit === 'seconds' ? exerciseEditForm.timeSecondsMin : undefined,
      timeSecondsMax: exerciseEditForm.unit === 'seconds' ? exerciseEditForm.timeSecondsMax : undefined,
      stepsCount: exerciseEditForm.unit === 'steps' ? exerciseEditForm.stepsCount : undefined,
      unit: exerciseEditForm.unit,
      perSide: exerciseEditForm.perSide,
      weight: exerciseEditForm.weight || undefined,
      notes: exerciseEditForm.notes.trim() || undefined,
      formGuidance: exerciseEditForm.formGuidance.trim() || undefined,
      muscleGroup: exerciseEditForm.muscleGroup.trim(),
      mainMuscle: exerciseEditForm.mainMuscle.trim(),
      restSeconds: exerciseEditForm.restSeconds
    };
    
    const updatedTemplate: SessionTemplate = {
      ...template,
      exercises: template.exercises.map(ex => 
        ex.id === editingExercise.id ? updatedExercise : ex
      ),
      updatedAt: new Date().toISOString()
    };
    
    saveSessionTemplate(updatedTemplate);
    loadData();
    setShowExerciseEditDialog(false);
    setEditingExercise(null);
    setEditingExerciseTemplateId(null);
    console.log('Exercise updated:', updatedExercise.name);
  };

  const filteredTemplates = sessionTemplates.filter(template => {
    if (!searchTerm) {
      // If no search term, only apply tag filters
      return selectedTags.length === 0 || 
             selectedTags.some(tag => template.exercises.some(ex => ex.muscleGroup === tag));
    }

    const searchLower = searchTerm.toLowerCase();
    
    // Search in template name
    const matchesName = template.name.toLowerCase().includes(searchLower);
    
    // Search in template description
    const matchesDescription = template.description && template.description.toLowerCase().includes(searchLower);
    
    // Search in exercise names
    const matchesExerciseNames = template.exercises.some(ex => 
      ex.name.toLowerCase().includes(searchLower)
    );
    
    // Search in muscle groups
    const matchesMuscleGroups = template.exercises.some(ex => 
      ex.muscleGroup.toLowerCase().includes(searchLower) ||
      ex.mainMuscle.toLowerCase().includes(searchLower)
    );
    
    // Search in exercise notes and form guidance
    const matchesExerciseDetails = template.exercises.some(ex => 
      (ex.notes && ex.notes.toLowerCase().includes(searchLower)) ||
      (ex.formGuidance && ex.formGuidance.toLowerCase().includes(searchLower))
    );
    
    // Search in tags
    const matchesTags = template.tags.some(tag => tag.toLowerCase().includes(searchLower));
    
    const matchesSearch = matchesName || matchesDescription || matchesExerciseNames || 
                         matchesMuscleGroups || matchesExerciseDetails || matchesTags;
    
    const matchesTagFilters = selectedTags.length === 0 || 
                             selectedTags.some(tag => template.exercises.some(ex => ex.muscleGroup === tag));
    
    return matchesSearch && matchesTagFilters;
  });

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const toggleCardExpansion = (templateId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  };

  const handleMoveExercise = (templateId: string, exerciseId: string) => {
    console.log('Move exercise:', exerciseId, 'in template:', templateId);
    // TODO: Implement drag and drop functionality
  };

  const handleEditExercise = (templateId: string, exerciseId: string) => {
    const template = sessionTemplates.find(t => t.id === templateId);
    const exercise = template?.exercises.find(e => e.id === exerciseId);
    
    if (template && exercise) {
      setEditingExercise(exercise);
      setEditingExerciseTemplateId(templateId);
      setExerciseEditForm({
        name: exercise.name,
        sets: exercise.sets,
        repsMin: exercise.repsMin || 0,
        repsMax: exercise.repsMax || 0,
        timeSecondsMin: exercise.timeSecondsMin || 0,
        timeSecondsMax: exercise.timeSecondsMax || 0,
        stepsCount: exercise.stepsCount || 0,
        unit: exercise.unit,
        perSide: exercise.perSide,
        weight: exercise.weight || 0,
        notes: exercise.notes || '',
        formGuidance: exercise.formGuidance || '',
        muscleGroup: exercise.muscleGroup,
        mainMuscle: exercise.mainMuscle,
        restSeconds: exercise.restSeconds || 60
      });
      setShowExerciseEditDialog(true);
    }
  };

  const handleDeleteExercise = (templateId: string, exerciseId: string) => {
    if (confirm('Are you sure you want to delete this exercise?')) {
      console.log('Delete exercise:', exerciseId, 'from template:', templateId);
      // TODO: Remove exercise from template
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white" data-testid="sessions-title">
            Session Templates
          </h1>
          <p className="text-white/80 mt-2">
            Create and manage your workout session templates
          </p>
        </div>
        <Button
          onClick={handleCreateTemplate}
          className="flex items-center gap-2 bg-primary text-white font-semibold py-2 px-4 rounded-lg shadow-md"
          data-testid="button-create-template"
        >
          <Plus className="w-4 h-4" />
          New
        </Button>
      </div>
      
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search session templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-white/10 dark:bg-black/20 text-white placeholder-white/60 border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary"
          data-testid="input-search-templates"
        />
        {allTags.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="justify-center whitespace-nowrap text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 border border-primary-border min-h-9 flex items-center gap-2 bg-primary text-white font-semibold py-2 px-4 rounded-lg shadow-md"
          >
            Filter
          </button>
        )}
      </div>
      
      {allTags.length > 0 && showFilters && (
        <div className="flex flex-wrap gap-2">
          {(showAllTags ? allTags : allTags.slice(0, 6)).map(tag => (
            <button
              key={tag}
              onClick={() => toggleTagFilter(tag)}
              className={`py-1 px-3 rounded-full text-sm transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-primary text-white'
                  : 'bg-white/10 dark:bg-black/20 text-white hover:bg-white/20'
              }`}
              data-testid={`tag-filter-${tag}`}
            >
              {tag}
            </button>
          ))}
          {allTags.length > 6 && (
            <button
              onClick={() => setShowAllTags(!showAllTags)}
              className="py-1 px-3 rounded-full text-sm transition-colors bg-white/10 dark:bg-black/20 text-white hover:bg-white/20"
            >
              {showAllTags ? 'Show Less' : `+${allTags.length - 6} More`}
            </button>
          )}
        </div>
      )}

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
                    Create your first session template to get started with your workout tracking.
                  </p>
                  <div className="flex justify-center">
                    <Button
                      variant="default"
                      onClick={handleCreateTemplate}
                      data-testid="button-create-first-template"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Template
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
          <div className="space-y-6">
            {filteredTemplates.map((template) => {
              const isExpanded = expandedCards.has(template.id);
              return (
                <div 
                  key={template.id} 
                  className="border transition-all duration-300 hover-elevate bg-black/20 backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white text-center flex-1">
                      {template.name}
                    </h2>
                    <button
                      onClick={() => toggleCardExpansion(template.id)}
                      className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? 'v' : '>'}
                    </button>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-white/60">
                    <div className="flex items-center gap-1.5">
                      <Target className="w-4 h-4" />
                      <span>{template.exercises.length} exercises</span>
                    </div>
                    {template.estimatedDurationMinutes && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{template.estimatedDurationMinutes}min</span>
                      </div>
                    )}
                  </div>
                  
                  {(() => {
                    // Get all unique muscle groups from exercises
                    const muscleGroups = [...new Set(template.exercises.map(ex => ex.muscleGroup).filter(Boolean))];
                    return muscleGroups.length > 0 && (
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {muscleGroups.map(muscleGroup => (
                          <span
                            key={muscleGroup}
                            className="bg-primary/10 text-primary font-medium py-1 px-3 rounded-full text-sm"
                          >
                            {muscleGroup}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                  
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="space-y-3">
                        {template.exercises.map((exercise, index) => (
                          <div key={exercise.id} className="bg-white/5 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-white">{exercise.name}</h4>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleMoveExercise(template.id, exercise.id)}
                                      className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                      title="Move exercise"
                                    >
                                      <GripVertical className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleEditExercise(template.id, exercise.id)}
                                      className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                      title="Edit exercise"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteExercise(template.id, exercise.id)}
                                      className="p-1 rounded hover:bg-white/10 text-red-400 hover:text-red-300 transition-colors"
                                      title="Delete exercise"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-white/60 mt-1">
                                  <span>{exercise.sets} sets</span>
                                  {exercise.unit === 'reps' && exercise.repsMin && exercise.repsMax && (
                                    <span>{exercise.repsMin}-{exercise.repsMax} reps</span>
                                  )}
                                  {exercise.unit === 'seconds' && exercise.timeSecondsMin && exercise.timeSecondsMax && (
                                    <span>{exercise.timeSecondsMin}-{exercise.timeSecondsMax}s</span>
                                  )}
                                  {exercise.unit === 'steps' && exercise.stepsCount && (
                                    <span>{exercise.stepsCount} steps</span>
                                  )}
                                  {exercise.weight && (
                                    <span>{exercise.weight}kg</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs bg-white/10 text-white/70 px-2 py-1 rounded">
                                    {exercise.muscleGroup}
                                  </span>
                                  <span className="text-xs bg-white/10 text-white/70 px-2 py-1 rounded">
                                    {exercise.mainMuscle}
                                  </span>
                                </div>
                                {exercise.notes && (
                                  <p className="text-xs text-white/60 mt-2">{exercise.notes}</p>
                                )}
                                {exercise.formGuidance && (
                                  <p className="text-xs text-white/60 mt-1 italic">{exercise.formGuidance}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 w-full">
                      <Button
                        onClick={() => handleUseTemplate(template)}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-primary/90 transition-colors"
                        data-testid={`button-use-${template.id}`}
                      >
                        <Play className="w-4 h-4" />
                        Use Template
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDuplicateTemplate(template)}
                        className="h-9 w-9 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-white/60 hover:text-white"
                        data-testid={`button-duplicate-${template.id}`}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditTemplate(template)}
                        className="h-9 w-9 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-white/60 hover:text-white"
                        data-testid={`button-edit-${template.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="h-9 w-9 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-red-500 hover:text-red-300"
                        data-testid={`button-delete-${template.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Stats */}
        {sessionTemplates.length > 0 && (
          <div className="border transition-all duration-300 hover-elevate bg-black/20 backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl px-4 py-3">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Template Library Stats</h3>
            </div>
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

        {/* Edit Template Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-gray-900/95 border-white/20 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Template: {editingTemplate?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {editingTemplate && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name" className="text-white/80">
                      Template Name
                    </Label>
                    <Input
                      id="template-name"
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                      className="bg-white/10 border-white/20 text-white placeholder-white/50"
                      data-testid="input-edit-template-name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="template-description" className="text-white/80">
                      Description (optional)
                    </Label>
                    <Textarea
                      id="template-description"
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter template description"
                      className="bg-white/10 border-white/20 text-white placeholder-white/50"
                      rows={3}
                      data-testid="textarea-edit-template-description"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white/80">Tags</Label>
                    
                    {/* Existing tags */}
                    {editForm.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {editForm.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600/20 border border-blue-500/30 text-blue-200 rounded-full"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:text-red-300 transition-colors"
                              data-testid={`button-remove-tag-${index}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Add new tag */}
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={editForm.newTag}
                        onChange={(e) => setEditForm(prev => ({ ...prev, newTag: e.target.value }))}
                        onKeyPress={handleKeyPress}
                        placeholder="Add a tag"
                        className="bg-white/10 border-white/20 text-white placeholder-white/50 flex-1"
                        data-testid="input-add-tag"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddTag}
                        disabled={!editForm.newTag.trim() || editForm.tags.includes(editForm.newTag.trim())}
                        className="px-3"
                        data-testid="button-add-tag"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        <span>{editingTemplate.exercises.length} exercises</span>
                      </div>
                      {editingTemplate.estimatedDurationMinutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{editingTemplate.estimatedDurationMinutes}min</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  className="flex-1 text-white border-white/20 hover:bg-white/10"
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={!editForm.name.trim()}
                  className="flex-1"
                  data-testid="button-save-edit"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Exercise Edit Dialog */}
        <Dialog open={showExerciseEditDialog} onOpenChange={setShowExerciseEditDialog}>
          <DialogContent className="bg-black/20 backdrop-blur-xl border-2 border-white/20 text-white max-w-lg rounded-3xl shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-white text-base">Edit Exercise</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              {editingExercise && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="exercise-name" className="text-white/80">
                        Exercise Name
                      </Label>
                      <Input
                        id="exercise-name"
                        type="text"
                        value={exerciseEditForm.name}
                        onChange={(e) => setExerciseEditForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter exercise name"
                        className="bg-white/10 border-white/20 text-white placeholder-white/50 rounded-lg"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="exercise-sets" className="text-white/80">
                        Sets
                      </Label>
                      <Input
                        id="exercise-sets"
                        type="number"
                        min="1"
                        value={exerciseEditForm.sets}
                        onChange={(e) => setExerciseEditForm(prev => ({ ...prev, sets: parseInt(e.target.value) || 1 }))}
                        className="bg-white/10 border-white/20 text-white rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white/80">Unit Type</Label>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => setExerciseEditForm(prev => ({ ...prev, unit: 'reps' }))}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          exerciseEditForm.unit === 'reps' 
                            ? 'bg-primary text-white' 
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        Reps
                      </button>
                      <button
                        onClick={() => setExerciseEditForm(prev => ({ ...prev, unit: 'seconds' }))}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          exerciseEditForm.unit === 'seconds' 
                            ? 'bg-primary text-white' 
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        Seconds
                      </button>
                      <button
                        onClick={() => setExerciseEditForm(prev => ({ ...prev, unit: 'steps' }))}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          exerciseEditForm.unit === 'steps' 
                            ? 'bg-primary text-white' 
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        Steps
                      </button>
                      <div className="flex items-center gap-2 ml-4">
                        <input
                          type="checkbox"
                          id="exercise-per-side"
                          checked={exerciseEditForm.perSide}
                          onChange={(e) => setExerciseEditForm(prev => ({ ...prev, perSide: e.target.checked }))}
                          className="rounded-lg"
                        />
                        <Label htmlFor="exercise-per-side" className="text-white/80">Per Side</Label>
                      </div>
                    </div>
                  </div>
                  
                  {exerciseEditForm.unit === 'reps' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="reps-min" className="text-white/80">Min Reps</Label>
                        <Input
                          id="reps-min"
                          type="number"
                          min="0"
                          value={exerciseEditForm.repsMin}
                          onChange={(e) => setExerciseEditForm(prev => ({ ...prev, repsMin: parseInt(e.target.value) || 0 }))}
                          className="bg-white/10 border-white/20 text-white !rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reps-max" className="text-white/80">Max Reps</Label>
                        <Input
                          id="reps-max"
                          type="number"
                          min="0"
                          value={exerciseEditForm.repsMax}
                          onChange={(e) => setExerciseEditForm(prev => ({ ...prev, repsMax: parseInt(e.target.value) || 0 }))}
                          className="bg-white/10 border-white/20 text-white !rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                  
                  {exerciseEditForm.unit === 'seconds' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="time-min" className="text-white/80">Min Seconds</Label>
                        <Input
                          id="time-min"
                          type="number"
                          min="0"
                          value={exerciseEditForm.timeSecondsMin}
                          onChange={(e) => setExerciseEditForm(prev => ({ ...prev, timeSecondsMin: parseInt(e.target.value) || 0 }))}
                          className="bg-white/10 border-white/20 text-white !rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time-max" className="text-white/80">Max Seconds</Label>
                        <Input
                          id="time-max"
                          type="number"
                          min="0"
                          value={exerciseEditForm.timeSecondsMax}
                          onChange={(e) => setExerciseEditForm(prev => ({ ...prev, timeSecondsMax: parseInt(e.target.value) || 0 }))}
                          className="bg-white/10 border-white/20 text-white !rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                  
                  {exerciseEditForm.unit === 'steps' && (
                    <div className="space-y-2">
                      <Label htmlFor="steps-count" className="text-white/80">Steps Count</Label>
                        <Input
                          id="steps-count"
                          type="number"
                          min="0"
                          value={exerciseEditForm.stepsCount}
                          onChange={(e) => setExerciseEditForm(prev => ({ ...prev, stepsCount: parseInt(e.target.value) || 0 }))}
                          className="bg-white/10 border-white/20 text-white !rounded-lg"
                        />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="exercise-weight" className="text-white/80">Weight (kg)</Label>
                      <Input
                        id="exercise-weight"
                        type="number"
                        min="0"
                        step="0.5"
                        value={exerciseEditForm.weight}
                        onChange={(e) => setExerciseEditForm(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                        className="bg-white/10 border-white/20 text-white !rounded-lg"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="exercise-rest" className="text-white/80">Rest (seconds)</Label>
                      <Input
                        id="exercise-rest"
                        type="number"
                        min="0"
                        value={exerciseEditForm.restSeconds}
                        onChange={(e) => setExerciseEditForm(prev => ({ ...prev, restSeconds: parseInt(e.target.value) || 60 }))}
                        className="bg-white/10 border-white/20 text-white !rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="exercise-muscle-group" className="text-white/80">Muscle Group</Label>
                      <Input
                        id="exercise-muscle-group"
                        type="text"
                        value={exerciseEditForm.muscleGroup}
                        onChange={(e) => setExerciseEditForm(prev => ({ ...prev, muscleGroup: e.target.value }))}
                        placeholder="e.g., Chest + Triceps"
                        className="bg-white/10 border-white/20 text-white placeholder-white/50 rounded-lg"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="exercise-main-muscle" className="text-white/80">Main Muscle</Label>
                      <Input
                        id="exercise-main-muscle"
                        type="text"
                        value={exerciseEditForm.mainMuscle}
                        onChange={(e) => setExerciseEditForm(prev => ({ ...prev, mainMuscle: e.target.value }))}
                        placeholder="e.g., Chest"
                        className="bg-white/10 border-white/20 text-white placeholder-white/50 rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="exercise-notes" className="text-white/80">Notes</Label>
                    <Textarea
                      id="exercise-notes"
                      value={exerciseEditForm.notes}
                      onChange={(e) => setExerciseEditForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Exercise notes..."
                      className="bg-white/10 border-white/20 text-white placeholder-white/50 rounded-lg"
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="exercise-form-guidance" className="text-white/80">Form Guidance</Label>
                    <Textarea
                      id="exercise-form-guidance"
                      value={exerciseEditForm.formGuidance}
                      onChange={(e) => setExerciseEditForm(prev => ({ ...prev, formGuidance: e.target.value }))}
                      placeholder="Form guidance and technique tips..."
                      className="bg-white/10 border-white/20 text-white placeholder-white/50 rounded-lg"
                      rows={3}
                    />
                  </div>
                  
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowExerciseEditDialog(false)}
                  className="flex-1 text-white border-white/20 hover:bg-white/10 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveExerciseEdit}
                  disabled={!exerciseEditForm.name.trim()}
                  className="flex-1 rounded-lg"
                >
                  Save Changes
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
  );
}