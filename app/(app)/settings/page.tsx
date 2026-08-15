import { SettingsForm } from "@/components/settings-form";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Key, Modelle und Werkstatt-Optionen. Alles bleibt auf diesem Gerät.
      </p>
      <SettingsForm />
    </div>
  );
}
