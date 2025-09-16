import Layout from '../Layout';
import GlassCard from '../GlassCard';

export default function LayoutExample() {
  return (
    <Layout>
      <div className="space-y-6">
        <GlassCard variant="primary">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-3">Welcome to FitTracker</h2>
            <p className="text-white/80 mb-4">
              This is the main content area within the glass morphism layout. 
              The header is sticky with theme toggle and menu options.
            </p>
            <div className="space-y-2 text-white/70 text-sm">
              <p>• Mobile-first responsive design</p>
              <p>• Safe area insets for iPhone 16 Pro</p>
              <p>• Glass morphism with backdrop blur</p>
              <p>• Dark/light mode support</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="secondary">
          <div className="p-4">
            <h3 className="text-lg font-medium text-white mb-2">Secondary Content</h3>
            <p className="text-white/75 text-sm">
              Additional content cards use different glass opacities for visual hierarchy.
            </p>
          </div>
        </GlassCard>

        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard variant="tertiary">
            <div className="p-4 text-center">
              <h4 className="text-white font-medium">Feature 1</h4>
              <p className="text-white/60 text-sm mt-1">Sample content</p>
            </div>
          </GlassCard>
          <GlassCard variant="tertiary">
            <div className="p-4 text-center">
              <h4 className="text-white font-medium">Feature 2</h4>
              <p className="text-white/60 text-sm mt-1">Sample content</p>
            </div>
          </GlassCard>
        </div>
      </div>
    </Layout>
  );
}