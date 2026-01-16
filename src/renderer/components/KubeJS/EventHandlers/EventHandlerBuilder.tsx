import React, { useState } from 'react';
import { UnifiedSelector } from '../RecipeEditor/UnifiedSelector';

interface EventHandlerBuilderProps {
  instancePath: string;
  onSave?: (eventHandler: EventHandler) => void;
  existingHandler?: EventHandler;
}

export interface EventHandler {
  eventType: string;
  conditions: Condition[];
  actions: Action[];
}

interface Condition {
  type: string;
  value: string;
  operator?: string;
}

interface Action {
  type: string;
  value: string;
}

const EVENT_TYPES = [
  { id: 'block.break', name: 'Block Break', description: 'When a block is broken' },
  { id: 'item.crafted', name: 'Item Crafted', description: 'When an item is crafted' },
  { id: 'entity.death', name: 'Entity Death', description: 'When an entity dies' },
  { id: 'player.logged_in', name: 'Player Login', description: 'When a player joins the server' },
  { id: 'player.logged_out', name: 'Player Logout', description: 'When a player leaves the server' },
  { id: 'player.tick', name: 'Player Tick', description: 'Every tick per player' },
  { id: 'item.pickup', name: 'Item Pickup', description: 'When a player picks up an item' },
  { id: 'item.toss', name: 'Item Toss', description: 'When a player drops an item' },
];

const CONDITION_TYPES = [
  { id: 'block', name: 'Block Type', valueLabel: 'Block ID' },
  { id: 'item', name: 'Item Type', valueLabel: 'Item ID' },
  { id: 'entity', name: 'Entity Type', valueLabel: 'Entity ID' },
  { id: 'player', name: 'Player Name', valueLabel: 'Player Name' },
  { id: 'dimension', name: 'Dimension', valueLabel: 'Dimension ID' },
];

const ACTION_TYPES = [
  { id: 'give_item', name: 'Give Item', valueLabel: 'Item ID' },
  { id: 'remove_item', name: 'Remove Item', valueLabel: 'Item ID' },
  { id: 'send_message', name: 'Send Message', valueLabel: 'Message' },
  { id: 'spawn_entity', name: 'Spawn Entity', valueLabel: 'Entity ID' },
  { id: 'set_block', name: 'Set Block', valueLabel: 'Block ID' },
  { id: 'cancel_event', name: 'Cancel Event', valueLabel: '' },
];

export const EventHandlerBuilder: React.FC<EventHandlerBuilderProps> = ({
  instancePath,
  onSave,
  existingHandler,
}) => {
  const [eventType, setEventType] = useState(existingHandler?.eventType || '');
  const [conditions, setConditions] = useState<Condition[]>(existingHandler?.conditions || []);
  const [actions, setActions] = useState<Action[]>(existingHandler?.actions || []);

  const handleAddCondition = () => {
    setConditions([...conditions, { type: 'block', value: '' }]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleUpdateCondition = (index: number, field: keyof Condition, value: string) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  const handleAddAction = () => {
    setActions([...actions, { type: 'give_item', value: '' }]);
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleUpdateAction = (index: number, field: keyof Action, value: string) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], [field]: value };
    setActions(updated);
  };

  const handleSave = async () => {
    const eventHandler = {
      eventType,
      conditions,
      actions,
    };
    
    try {
      const result = await window.api.kubeJSSaveEventHandler(instancePath, eventHandler);
      if (result.success) {
        alert('Event handler saved successfully!');
        if (onSave) {
          onSave(eventHandler);
        }
      } else {
        alert(`Failed to save event handler: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving event handler:', error);
      alert('Failed to save event handler');
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <h2 className="text-xl font-semibold text-foreground mb-4">Build Event Handler</h2>

        {/* Event Type Selection */}
        <div className="mb-6">
          <label className="block text-sm text-muted-foreground mb-2">Event Type</label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full bg-background text-foreground px-3 py-2 rounded border border-border focus:border-primary focus:outline-none"
          >
            <option value="">Select an event...</option>
            {EVENT_TYPES.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name} - {event.description}
              </option>
            ))}
          </select>
        </div>

        {/* Conditions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm text-muted-foreground">Conditions (optional)</label>
            <button
              onClick={handleAddCondition}
              className="px-3 py-1 bg-primary hover:bg-primary/80 text-primary-foreground text-sm rounded"
            >
              + Add Condition
            </button>
          </div>
          {conditions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No conditions. Event will trigger for all cases.</p>
          ) : (
            <div className="space-y-2">
              {conditions.map((condition, index) => (
                <div key={index} className="bg-background p-3 rounded border border-border flex gap-2">
                  <select
                    value={condition.type}
                    onChange={(e) => handleUpdateCondition(index, 'type', e.target.value)}
                    className="flex-1 bg-card text-foreground px-3 py-2 rounded border border-border focus:border-primary focus:outline-none"
                  >
                    {CONDITION_TYPES.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name}
                      </option>
                    ))}
                  </select>
                  {(condition.type === 'block' || condition.type === 'item') ? (
                    <UnifiedSelector
                      value={condition.value}
                      onChange={(value) => {
                        const stringValue = typeof value === 'string' ? value : value?.id || '';
                        handleUpdateCondition(index, 'value', stringValue);
                      }}
                      type={condition.type === 'block' ? 'block' : 'item'}
                      placeholder={CONDITION_TYPES.find((ct) => ct.id === condition.type)?.valueLabel || 'Value'}
                    />
                  ) : (
                    <input
                      type="text"
                      value={condition.value}
                      onChange={(e) => handleUpdateCondition(index, 'value', e.target.value)}
                      placeholder={CONDITION_TYPES.find((ct) => ct.id === condition.type)?.valueLabel || 'Value'}
                      className="flex-1 bg-card text-foreground px-3 py-2 rounded border border-border focus:border-primary focus:outline-none"
                    />
                  )}
                  <button
                    onClick={() => handleRemoveCondition(index)}
                    className="px-3 py-2 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm text-muted-foreground">Actions</label>
            <button
              onClick={handleAddAction}
              className="px-3 py-1 bg-primary hover:bg-primary/80 text-primary-foreground text-sm rounded"
            >
              + Add Action
            </button>
          </div>
          {actions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No actions. Add at least one action.</p>
          ) : (
            <div className="space-y-2">
              {actions.map((action, index) => (
                <div key={index} className="bg-background p-3 rounded border border-border flex gap-2">
                  <select
                    value={action.type}
                    onChange={(e) => handleUpdateAction(index, 'type', e.target.value)}
                    className="flex-1 bg-card text-foreground px-3 py-2 rounded border border-border focus:border-primary focus:outline-none"
                  >
                    {ACTION_TYPES.map((at) => (
                      <option key={at.id} value={at.id}>
                        {at.name}
                      </option>
                    ))}
                  </select>
                  {action.type !== 'cancel_event' && (
                    (action.type === 'give_item' || action.type === 'remove_item') ? (
                      <UnifiedSelector
                        value={action.value}
                        onChange={(value) => {
                          const stringValue = typeof value === 'string' ? value : value?.id || '';
                          handleUpdateAction(index, 'value', stringValue);
                        }}
                        type="item"
                        placeholder={ACTION_TYPES.find((at) => at.id === action.type)?.valueLabel || 'Value'}
                      />
                    ) : action.type === 'set_block' ? (
                      <UnifiedSelector
                        value={action.value}
                        onChange={(value) => {
                          const stringValue = typeof value === 'string' ? value : value?.id || '';
                          handleUpdateAction(index, 'value', stringValue);
                        }}
                        type="block"
                        placeholder={ACTION_TYPES.find((at) => at.id === action.type)?.valueLabel || 'Value'}
                      />
                    ) : (
                      <input
                        type="text"
                        value={action.value}
                        onChange={(e) => handleUpdateAction(index, 'value', e.target.value)}
                        placeholder={ACTION_TYPES.find((at) => at.id === action.type)?.valueLabel || 'Value'}
                        className="flex-1 bg-card text-foreground px-3 py-2 rounded border border-border focus:border-primary focus:outline-none"
                      />
                    )
                  )}
                  <button
                    onClick={() => handleRemoveAction(index)}
                    className="px-3 py-2 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        {eventType && actions.length > 0 && (
          <div className="mb-6 bg-muted/50 p-4 rounded border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">Preview:</h3>
            <pre className="text-xs text-primary overflow-x-auto">
              {`ServerEvents.${eventType}(event => {
${conditions.length > 0 ? conditions.map(c => `  // Check ${c.type}: ${c.value}`).join('\n') + '\n' : ''}  
${actions.map(a => `  // ${a.type}: ${a.value || 'no value needed'}`).join('\n')}
})`}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={handleSave}
            disabled={!eventType || actions.length === 0}
            className="px-4 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Event Handler Code
          </button>
        </div>
      </div>
  );
};
