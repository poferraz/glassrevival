import GlassCard from '../GlassCard';

export default function GlassCardExample() {
  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-blue-600 to-purple-700 min-h-screen">
      <GlassCard variant="primary">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Primary Glass Card</h3>
          <p className="text-white/90">This is a primary glass morphism card with backdrop blur and translucent styling.</p>
        </div>
      </GlassCard>
      
      <GlassCard variant="secondary">
        <div className="p-4">
          <h3 className="text-md font-medium text-white">Secondary Card</h3>
          <p className="text-white/80 text-sm">More subtle glass effect for secondary content.</p>
        </div>
      </GlassCard>
      
      <GlassCard variant="tertiary" onClick={() => console.log('Tertiary card clicked')}>
        <div className="p-3">
          <h3 className="text-sm font-medium text-white">Clickable Tertiary</h3>
          <p className="text-white/70 text-xs">Light glass effect with click interaction.</p>
        </div>
      </GlassCard>
    </div>
  );
}