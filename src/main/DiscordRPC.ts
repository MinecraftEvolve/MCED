import DiscordRPC from 'discord-rpc';

const CLIENT_ID = '1460565402500333568';

interface RPCState {
  instanceName?: string;
  modName?: string;
  modCount?: number;
  configFileName?: string; // NEW: Config file being edited
  startTimestamp?: number;
}

class DiscordRPCService {
  private client: DiscordRPC.Client | null = null;
  private connected: boolean = false;
  private currentState: RPCState = {};
  private enabled: boolean = true;
  private retryTimeout: NodeJS.Timeout | null = null;
  private pendingUpdate: boolean = false;

  async initialize() {
    if (!this.enabled) return;

    try {
      DiscordRPC.register(CLIENT_ID);

      this.client = new DiscordRPC.Client({ transport: 'ipc' });

      this.client.on('ready', () => {
        this.connected = true;
        // If there was a pending update, apply it now
        if (this.pendingUpdate) {
          this.pendingUpdate = false;
          if (this.currentState.instanceName) {
            this.updatePresence();
          } else {
            this.setDefaultPresence();
          }
        } else {
          this.setDefaultPresence();
        }
      });

      this.client.on('disconnected', () => {
        this.connected = false;
        if (this.enabled) {
          this.retryTimeout = setTimeout(() => this.initialize(), 15000);
        }
      });

      // Handle connection errors silently
      const transport = (this.client as any).transport;
      if (transport) {
        transport.on('error', (error: Error) => {
          if (error.message.includes('connection closed')) {
            // Discord connection closed, will retry automatically
            this.connected = false;
          } else {
            console.error('[Discord RPC] Transport error:', error);
          }
        });
      }

      await this.client.login({ clientId: CLIENT_ID });
    } catch (error) {
      this.connected = false;
      
      if (this.enabled) {
        this.retryTimeout = setTimeout(() => this.initialize(), 15000);
      }
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.disconnect();
    } else if (!this.connected) {
      this.initialize();
    }
  }

  setInstanceName(name: string) {
    this.currentState.instanceName = name;
    this.currentState.startTimestamp = Date.now();
    
    if (this.connected) {
      this.updatePresence();
    } else {
      this.pendingUpdate = true;
    }
  }

  setModInfo(modName: string, modCount: number, configFileName?: string) {
    this.currentState.modName = modName;
    this.currentState.modCount = modCount;
    this.currentState.configFileName = configFileName;
    
    if (this.connected) {
      this.updatePresence();
    } else {
      this.pendingUpdate = true;
    }
  }

  clearModInfo() {
    this.currentState.modName = undefined;
    this.currentState.configFileName = undefined;
    
    if (this.connected) {
      this.updatePresence();
    } else {
      this.pendingUpdate = true;
    }
  }

  clearInstance() {
    this.currentState = {};
    this.setDefaultPresence();
  }

  private async setDefaultPresence() {
    if (!this.connected || !this.client || !this.enabled) return;

    try {
      const presence: DiscordRPC.Presence = {
        details: 'Minecraft Config Editor',
        state: 'Browsing instances',
        startTimestamp: Date.now(),
      };

      try {
        presence.largeImageKey = 'mced_logo';
        presence.largeImageText = 'MCED';
      } catch (e) {
        // Image not uploaded, ignore
      }

      await this.client.setActivity(presence);
    } catch (error: any) {
      // Silently handle connection closed errors
      if (!error?.message?.includes('connection closed')) {
        console.error('[Discord RPC] Failed to set default presence:', error);
      }
    }
  }

  private async updatePresence() {
    if (!this.connected || !this.client || !this.enabled) return;

    const { instanceName, modName, modCount, configFileName, startTimestamp } = this.currentState;

    if (!instanceName) {
      this.setDefaultPresence();
      return;
    }

    try {
      let state: string;
      
      if (modName) {
        // Editing a specific mod
        if (modName === 'Loading mods...') {
          state = 'Loading mods...';
        } else {
          state = `Editing ${modName}`;
        }
      } else if (modCount !== undefined && modCount > 0) {
        // Browsing mods
        state = `Browsing ${modCount} mods`;
      } else {
        // No mods or count
        state = 'Browsing mods';
      }

      const presence: DiscordRPC.Presence = {
        details: instanceName,
        state,
        startTimestamp,
      };

      try {
        presence.largeImageKey = 'mced_logo';
        presence.largeImageText = 'Minecraft Config Editor';
      } catch (e) {
        // Image not uploaded, ignore
      }

      // Show config file being edited as small text
      if (configFileName) {
        try {
          presence.smallImageKey = 'config_file';
          presence.smallImageText = `Editing: ${configFileName}`;
        } catch (e) {
          // Small image not uploaded, show as party size instead
          presence.partySize = 1;
          presence.partyMax = 1;
        }
      }

      await this.client.setActivity(presence);
    } catch (error: any) {
      // Silently handle connection closed errors
      if (!error?.message?.includes('connection closed')) {
        console.error('[Discord RPC] Failed to update presence:', error);
      }
    }
  }

  private async clearPresence() {
    if (!this.connected || !this.client) return;

    try {
      await this.client.clearActivity();
    } catch (error: any) {
      // Silently handle connection closed errors
      if (!error?.message?.includes('connection closed')) {
        console.error('[Discord RPC] Failed to clear presence:', error);
      }
    }
  }

  disconnect() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    
    if (this.client) {
      this.clearPresence();
      this.client.destroy();
      this.client = null;
      this.connected = false;
    }
  }
}

export const discordRPC = new DiscordRPCService();
