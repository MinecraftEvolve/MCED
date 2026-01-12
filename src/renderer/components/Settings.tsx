import { X } from "lucide-react";
import { useSettingsStore } from "../store/settingsStore";

interface SettingsProps {
  onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {/* Theme Settings */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Appearance</h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Theme
              </label>
              <select
                value={settings.theme}
                onChange={(e) =>
                  updateSettings({ theme: e.target.value as "light" | "dark" | "auto" })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Accent Color
              </label>
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => updateSettings({ accentColor: e.target.value })}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                Compact Mode
              </label>
              <input
                type="checkbox"
                checked={settings.compactMode}
                onChange={(e) =>
                  updateSettings({ compactMode: e.target.checked })
                }
                className="w-5 h-5 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* API Settings */}
          <div className="space-y-3 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-medium">API Keys</h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                CurseForge API Key (Optional)
              </label>
              <input
                type="password"
                value={settings.curseForgeApiKey}
                onChange={(e) =>
                  updateSettings({ curseForgeApiKey: e.target.value })
                }
                placeholder="Enter CurseForge API key"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400">
                Optional: Improves mod icon loading and search results
              </p>
            </div>
          </div>

          {/* Editor Settings */}
          <div className="space-y-3 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-medium">Editor</h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Font Size
              </label>
              <select
                value={settings.editorFontSize}
                onChange={(e) =>
                  updateSettings({ editorFontSize: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="12">12px</option>
                <option value="13">13px</option>
                <option value="14">14px</option>
                <option value="16">16px</option>
                <option value="18">18px</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                Show Line Numbers
              </label>
              <input
                type="checkbox"
                checked={settings.showLineNumbers}
                onChange={(e) =>
                  updateSettings({ showLineNumbers: e.target.checked })
                }
                className="w-5 h-5 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                Word Wrap
              </label>
              <input
                type="checkbox"
                checked={settings.wordWrap}
                onChange={(e) =>
                  updateSettings({ wordWrap: e.target.checked })
                }
                className="w-5 h-5 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
