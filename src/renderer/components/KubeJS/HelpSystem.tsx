import React, { useState } from "react";
import { HelpCircle, X, Book, Lightbulb, Keyboard, ChevronRight } from "lucide-react";

interface HelpTopic {
  id: string;
  title: string;
  content: string;
  category: "getting-started" | "recipes" | "advanced" | "shortcuts";
}

const helpTopics: HelpTopic[] = [
  {
    id: "intro",
    title: "Getting Started",
    category: "getting-started",
    content: `Welcome to the KubeJS Visual Editor!

This tool helps you create and edit KubeJS recipes visually without writing code.

To get started:
1. Select a recipe type from the dropdown
2. Click "Create Recipe" to open the visual editor
3. Add ingredients and outputs by clicking the empty slots
4. Configure recipe properties like processing time
5. Save your recipe to generate the JavaScript code`,
  },
  {
    id: "item-selection",
    title: "Selecting Items",
    category: "getting-started",
    content: `To add items to recipes:

1. Click on any empty item slot
2. Search for items by name or mod
3. Click an item to select it
4. Adjust quantity if needed
5. Click outside to close the selector

You can also use tags like #forge:ingots/iron instead of specific items.`,
  },
  {
    id: "recipe-types",
    title: "Recipe Types",
    category: "recipes",
    content: `Supported recipe types:

Vanilla:
- Shaped Crafting (3x3 grid)
- Shapeless Crafting
- Smelting, Blasting, Smoking

Create:
- Mechanical Crafting
- Crushing, Milling, Mixing
- Pressing, Deploying, Filling
- Cutting, Compacting
- Sequenced Assembly (advanced)

Other Mods:
- Farmers Delight Cutting Board
- Mekanism Crushing & Enriching
- Thermal Pulverizer & Smelter`,
  },
  {
    id: "tags",
    title: "Using Tags",
    category: "advanced",
    content: `Tags allow recipes to accept multiple items:

Example: #forge:ingots/iron accepts any iron ingot from any mod.

To use tags:
1. Type "#" in the item search
2. Browse available tags
3. Select a tag to use it in your recipe

Common tags:
- #forge:ingots/[metal]
- #forge:dusts/[material]
- #minecraft:logs
- #forge:crops`,
  },
  {
    id: "fluids",
    title: "Working with Fluids",
    category: "advanced",
    content: `Some recipes (like Create Filling) use fluids:

1. Click on a fluid slot
2. Search for fluids by name
3. Set the amount in millibuckets (mB)
4. 1000 mB = 1 bucket

Common fluid amounts:
- 1 bucket = 1000 mB
- 1 bottle = 250 mB
- 1 ingot (melted) = 90 mB`,
  },
  {
    id: "recipe-management",
    title: "Managing Recipes",
    category: "recipes",
    content: `Recipe management features:

View Recipes:
- See all your custom recipes
- Filter by type or search by name
- View recipe details

Edit Recipes:
- Click View to open a recipe
- Make changes in the visual editor
- Save to update the recipe

Delete Recipes:
- Click Delete on any recipe
- Confirm to permanently remove it

Duplicate Recipes:
- Copy an existing recipe
- Modify it to create variations`,
  },
  {
    id: "shortcuts",
    title: "Keyboard Shortcuts",
    category: "shortcuts",
    content: `Available keyboard shortcuts:

General:
- Ctrl+S: Save current recipe
- Ctrl+Z: Undo last change
- Ctrl+Y: Redo change
- Escape: Close dialogs

Navigation:
- Tab: Move between fields
- Enter: Confirm selection

Item Search:
- Type to search immediately
- Arrow keys: Navigate results
- Enter: Select item`,
  },
  {
    id: "validation",
    title: "Recipe Validation",
    category: "advanced",
    content: `The editor validates your recipes:

Common errors:
- Missing ingredients
- Missing outputs
- Invalid item IDs
- Conflicting recipe IDs

The editor will show warnings when:
- Recipe output matches existing recipes
- Using deprecated item IDs
- Missing required properties

Fix errors before saving to ensure your recipes work in-game.`,
  },
  {
    id: "probejs",
    title: "ProbeJS Integration",
    category: "advanced",
    content: `If ProbeJS is detected, you get:

- Type checking for recipes
- Autocomplete suggestions
- Method documentation
- Better error messages

ProbeJS enhances the editing experience by providing type information from your modpack.

Generate ProbeJS docs in-game with /probejs dump`,
  },
];

const HelpSystem: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: "getting-started", name: "Getting Started", icon: Book },
    { id: "recipes", name: "Recipes", icon: Lightbulb },
    { id: "advanced", name: "Advanced", icon: HelpCircle },
    { id: "shortcuts", name: "Shortcuts", icon: Keyboard },
  ];

  const filteredTopics = selectedCategory
    ? helpTopics.filter((t) => t.category === selectedCategory)
    : helpTopics;

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-500 hover:bg-primary text-white p-3 rounded-full shadow-lg transition-colors z-50"
        title="Help & Documentation"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Help Dialog */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-6 h-6" />
                Help & Documentation
              </h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSelectedTopic(null);
                  setSelectedCategory(null);
                }}
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
              <div className="w-64 border-r border overflow-y-auto">
                <div className="p-2">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    const isSelected = selectedCategory === category.id;
                    return (
                      <div key={category.id}>
                        <button
                          onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                          className={`w-full flex items-center gap-2 p-2 rounded hover:bg-card transition-colors ${
                            isSelected ? "bg-card text-blue-400" : "text-muted-foreground"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="flex-1 text-left">{category.name}</span>
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${
                              isSelected ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                        {isSelected && (
                          <div className="ml-4 mt-1 space-y-1">
                            {helpTopics
                              .filter((t) => t.category === category.id)
                              .map((topic) => (
                                <button
                                  key={topic.id}
                                  onClick={() => setSelectedTopic(topic)}
                                  className={`w-full text-left p-2 rounded text-sm hover:bg-card transition-colors ${
                                    selectedTopic?.id === topic.id
                                      ? "bg-card text-blue-400"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {topic.title}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {selectedTopic ? (
                  <div className="prose prose-invert max-w-none">
                    <h3 className="text-2xl font-bold text-white mb-4">{selectedTopic.title}</h3>
                    <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                      {selectedTopic.content}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground mt-20">
                    <HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Select a topic to view help</p>
                    <p className="text-sm mt-2">
                      Choose a category from the sidebar to get started
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpSystem;
