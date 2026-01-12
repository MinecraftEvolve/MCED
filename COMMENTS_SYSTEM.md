# 💬 Config Value Commenting System

This feature allows you to add **timestamped comments** to individual config values, explaining why you changed (or didn't change) them. Comments are persisted directly in the config files and loaded when you reopen the instance.

---

## 🎯 Features

### ✅ What You Can Do

1. **Add Comments** to any config value
   - Click the "+" button next to any setting
   - Type your comment (e.g., "Increased for better performance")
   - Comments are automatically timestamped with current time

2. **View Comments** on settings
   - See all comments with relative timestamps ("2h ago", "3d ago")
   - Expand/collapse comment sections
   - Hover to see full timestamp

3. **Delete Comments** 
   - Hover over a comment and click the X button
   - Instantly removed from memory and file

4. **Persistence**
   - Comments are saved directly in config files
   - Use special `#@MCED:` marker format
   - Automatically loaded next time you open the instance

---

## 📝 Use Cases

### Why Add Comments?

**Track Your Changes:**
```
Setting: maxEntityRenderDistance = 64
Comment: "Reduced from 128 to improve FPS on low-end systems - 2025-01-12"
```

**Document Decisions:**
```
Setting: enableShaders = false
Comment: "Disabled because it conflicts with Optifine - team decision"
```

**Remember Testing:**
```
Setting: spawnRadius = 10
Comment: "Tested with 5, 10, 15. 10 gives best balance for our server"
```

**Explain Non-Changes:**
```
Setting: allowCheats = false
Comment: "Don't enable! Will break progression achievements"
```

---

## 💾 File Format

### How Comments Are Stored

Comments are stored in config files using a special format:

```toml
[performance]

# Original mod author comment
# This setting controls render distance

#@MCED: 2025-01-12T06:09:59.291Z | Reduced from 128 for better FPS
#@MCED: 2025-01-10T14:30:00.000Z | Original value was too high
maxEntityRenderDistance = 64
```

**Format Breakdown:**
```
#@MCED: <ISO-8601-timestamp> | <comment-text>
```

- `#@MCED:` - Special marker that identifies MCED user comments
- Timestamp in ISO 8601 format (UTC)
- Pipe `|` separator
- Comment text (single line, newlines converted to spaces)

---

## 🔍 Comment Detection

### When Loading Config Files

The system automatically:

1. **Scans for `#@MCED:` lines** above each setting
2. **Parses timestamp and text** from each comment
3. **Associates comments** with the setting below them
4. **Displays in UI** with relative timestamps

### Example Parsing

**File Content:**
```toml
#@MCED: 2025-01-12T06:09:59.291Z | Increased for multiplayer compatibility
#@MCED: 2025-01-11T12:00:00.000Z | Was 32 originally
serverTickRate = 20
```

**Parsed Result:**
```typescript
{
  key: "serverTickRate",
  value: 20,
  userComments: [
    {
      id: "2025-01-12T06:09:59.291Z-abc123",
      timestamp: "2025-01-12T06:09:59.291Z",
      text: "Increased for multiplayer compatibility"
    },
    {
      id: "2025-01-11T12:00:00.000Z-def456",
      timestamp: "2025-01-11T12:00:00.000Z",
      text: "Was 32 originally"
    }
  ]
}
```

---

## 🎨 UI Components

### Comment Section

**Collapsed State:**
```
┌─────────────────────────────────────┐
│ 💬 Comments (2)              [+]    │
└─────────────────────────────────────┘
```

**Expanded State:**
```
┌─────────────────────────────────────┐
│ 💬 Comments (2)              [+]    │
├─────────────────────────────────────┤
│ Increased for multiplayer...   [x]  │
│ 🕐 2h ago                           │
├─────────────────────────────────────┤
│ Was 32 originally             [x]   │
│ 🕐 1d ago                           │
└─────────────────────────────────────┘
```

**Adding Comment:**
```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ Add your comment...             │ │
│ │ (e.g., why you changed this)    │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│           [Cancel] [Add Comment]    │
└─────────────────────────────────────┘
```

---

## ⚡ Keyboard Shortcuts

While in comment textarea:
- **Enter** (with Shift) - Add line break
- **Enter** (without Shift) - Could be bound to submit
- **Escape** - Cancel adding comment

---

## 🔧 Technical Details

### Data Structure

**UserComment Interface:**
```typescript
interface UserComment {
  id: string;           // Unique identifier (timestamp + random)
  text: string;         // Comment content
  timestamp: string;    // ISO 8601 UTC timestamp
  author?: string;      // Future: Username (not implemented yet)
}
```

**ConfigSetting Extended:**
```typescript
interface ConfigSetting {
  // ... existing fields
  userComments?: UserComment[];  // Array of user comments
}
```

### Timestamp Format

**ISO 8601 UTC:**
```
2025-01-12T06:09:59.291Z
```

**Why ISO 8601?**
- Universally parseable
- Timezone-independent (UTC)
- Sortable as strings
- Human-readable when formatted

### Relative Time Display

```typescript
< 1 minute:  "just now"
< 1 hour:    "5m ago", "45m ago"
< 24 hours:  "3h ago", "12h ago"
< 7 days:    "2d ago", "5d ago"
7+ days:     "Jan 12, 2025"
```

---

## 📋 Workflow Example

### Complete User Journey

1. **User opens instance** with existing config
2. **Sees setting:** `maxMemory = 4096`
3. **Clicks [+]** to add comment
4. **Types:** "Increased from 2048 for modpack stability"
5. **Clicks "Add Comment"**
6. **Comment appears** with "just now" timestamp
7. **Saves config** (Ctrl+S or auto-save)
8. **File is updated** with `#@MCED:` comment line
9. **Closes app**
10. **Reopens later**
11. **Comment is loaded** and shows "2h ago"

---

## 🚀 Future Enhancements

### Possible Features

**Author Support:**
```typescript
interface UserComment {
  author?: string;  // Track who made each comment
}
```

**Comment Threading:**
- Reply to comments
- Nested discussions

**Comment Filtering:**
- Show only my comments
- Filter by date range
- Search comments

**Export Comments:**
- Generate change log from comments
- Export to Markdown/JSON
- Share with team

**Rich Text:**
- Markdown support in comments
- Links, code blocks
- Formatting

---

## 🎯 Best Practices

### Writing Good Comments

**✅ DO:**
- Explain *why* you changed something
- Include context (testing results, team decisions)
- Note original values when changing
- Document compatibility issues
- Track experimental changes

**❌ DON'T:**
- Just repeat what the setting does
- Leave vague comments ("changed stuff")
- Forget to explain non-obvious decisions
- Use comments for todos (use issues instead)

### Example Comments

**Good:**
```
"Reduced from 256 to 128 after testing showed no visual difference but 20% FPS improvement"
"Disabled due to crash with Forge 47.2.0 - re-enable when mod updates"
"Team agreed on this value for PvP balance"
```

**Poor:**
```
"Changed this"
"Test"
"idk"
```

---

## 📊 Storage Impact

### File Size

Each comment adds approximately:
```
#@MCED: 2025-01-12T06:09:59.291Z | Comment text here\n
         ^45 chars                  ^variable length
```

**Average:** ~50-100 bytes per comment
**Impact:** Minimal (5 comments = ~500 bytes)

### Performance

- **Parsing:** < 1ms per config file
- **Rendering:** Lazy-loaded (only shown when expanded)
- **Saving:** Async, non-blocking

---

## 🔐 Compatibility

### Works With

✅ TOML config files
✅ All launchers (Modrinth, CurseForge, etc.)
✅ Manual config editing (comments preserved)
✅ Version control (Git, etc.)

### Limitations

⚠️ **JSON/JSON5 Files:**
- Comments not yet supported (JSON doesn't allow comments natively)
- Would need special handling

⚠️ **External Editors:**
- Other tools may remove `#@MCED:` lines if they reformat files
- Always keep backups!

---

## 💡 Tips & Tricks

### Timestamp Shortcuts

The system uses **current local time converted to UTC**:
```javascript
new Date().toISOString()
// "2025-01-12T06:09:59.291Z"
```

### Bulk Comment Management

**To remove all MCED comments from a file:**
```bash
# Linux/Mac
sed -i '/#@MCED:/d' config.toml

# Windows PowerShell
(Get-Content config.toml) | Where-Object { $_ -notmatch '#@MCED:' } | Set-Content config.toml
```

---

## 📞 Support

**If you encounter issues:**

1. Check console for parsing errors
2. Verify `#@MCED:` format is correct
3. Ensure timestamp is valid ISO 8601
4. Open GitHub issue with example config file

---

**Last Updated:** January 12, 2025  
**Feature Version:** 1.0.0  
**MCED Version:** 1.2.0
