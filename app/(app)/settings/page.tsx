import { SettingsForm } from "@/components/settings-form";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl">Mehr</h1>
        <p className="text-sm text-muted-foreground">
        Modelle, Schriftgröße und optional ein anderer OpenAI-Key. Die Bibliothek gilt auf allen
        Geräten.
      </p>
      <SettingsForm />
    </div>
  );
}
