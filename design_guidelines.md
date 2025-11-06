# QChat - Design Guidelines

## Design Approach

**Hybrid Approach**: Material Design 3 principles combined with Signal/Telegram's security-focused aesthetics. This chat application prioritizes trust, clarity, and efficiency while maintaining a modern, approachable feel.

**Core Design Principles**:
1. **Trust through transparency** - Visible encryption indicators and security states
2. **Clarity over decoration** - Clean, distraction-free messaging interface
3. **Efficiency first** - Quick access to core functions, minimal navigation depth
4. **Security without fear** - Reassuring rather than alarming security UI

---

## Typography System

**Font Families** (via Google Fonts CDN):
- **Primary**: Inter (400, 500, 600, 700) - UI elements, messages, labels
- **Monospace**: JetBrains Mono (400, 500) - Encryption keys, technical indicators

**Type Scale**:
- **Heading 1**: text-3xl font-semibold (30px) - Page titles
- **Heading 2**: text-xl font-semibold (20px) - Section headers
- **Heading 3**: text-lg font-medium (18px) - Chat room names
- **Body**: text-base (16px) - Messages, primary content
- **Small**: text-sm (14px) - Timestamps, metadata
- **Tiny**: text-xs (12px) - Encryption status, technical details

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16**
- Tight spacing: p-2, gap-2 (component internal spacing)
- Standard spacing: p-4, gap-4, m-4 (between related elements)
- Section spacing: p-8, py-12 (major layout divisions)
- Large spacing: p-16 (desktop container padding)

**Grid System**:
- **Main Layout**: Three-column grid (Sidebar | Chat List | Active Chat)
  - Sidebar: w-16 (collapsed icon-only navigation)
  - Chat List: w-80 (user/room list with search)
  - Active Chat: flex-1 (message thread and input)
- **Mobile**: Single-column stack with slide-out navigation

**Container Strategy**:
- Full-width application shell (100vw, 100vh)
- No centered max-width containers - app fills viewport
- Message bubbles: max-w-lg for optimal readability

---

## Component Library

### Navigation & Structure

**Sidebar (Primary Navigation)**:
- Icon-only vertical bar with tooltips
- Items: Chats, Contacts, Settings, Security Center
- Active state: Subtle left border indicator
- Position: Fixed left, full height
- Badge indicators for unread messages

**Chat List Panel**:
- Search input at top with icon
- Scrollable list of conversations
- Each item: Avatar (w-12 h-12) | Name + Last message preview | Timestamp + Unread badge
- Hover state: Subtle background change
- Active chat: Distinct background treatment
- Group by: Recent, Pinned, Archived

**Message Thread (Active Chat)**:
- Header: Chat name, encryption status badge, options menu
- Scrollable message area with reverse chronology
- Message input footer: Text area, encryption indicator, send button, attachment option
- Typing indicators below last message

### Message Components

**Message Bubble**:
- **Sent messages**: Aligned right, rounded-2xl, distinct treatment
- **Received messages**: Aligned left, rounded-2xl, different treatment  
- Padding: px-4 py-3
- Max width: max-w-lg
- Tail indicator: small rounded corner treatment
- Timestamp: text-xs below bubble
- Encryption status icon: 12x12px next to timestamp

**System Messages**:
- Centered, text-sm
- Examples: "Encryption key refreshed", "User joined room"
- Icon + text combination

### Forms & Inputs

**Message Input**:
- Auto-expanding textarea (min h-12, max h-32)
- Placeholder: "Message (End-to-end encrypted)"
- Border: subtle outline, focus state with accent
- Rounded: rounded-xl

**Search Input**:
- Full width in chat list panel
- Icon prefix (magnifying glass)
- Placeholder: "Search conversations"
- Rounded: rounded-lg

**Settings Forms**:
- Label above input pattern
- Consistent spacing: space-y-4 between fields
- Input height: h-12
- Helper text: text-sm below inputs

### Security Elements

**Encryption Badge**:
- Prominent in chat header
- Icon: Shield with checkmark (16x16px)
- Text: "Quantum-Safe E2E"
- Small pill shape: px-3 py-1 rounded-full

**Key Fingerprint Display**:
- Monospace font (JetBrains Mono)
- Letter-spacing: tracking-wider
- Segmented display: groups of 4 characters
- Copy button adjacent

**Security Center Panel**:
- Card-based layout for security features
- Cards: rounded-xl, p-6, space-y-4
- Icon + Heading + Description pattern
- Visual hierarchy through icon size and spacing

### Overlays & Modals

**Modal Dialogs**:
- Backdrop: Semi-transparent overlay
- Modal: max-w-lg, rounded-2xl, p-6
- Header: text-xl font-semibold, mb-4
- Actions: Aligned right, space-x-3

**Context Menus**:
- Dropdown style, rounded-lg
- List items: px-4 py-2, hover states
- Icons: 16x16px leading each item
- Dividers: border-b between groups

**Toast Notifications**:
- Bottom-right positioning
- Compact: p-4, rounded-lg
- Icon + Message + Dismiss pattern
- Auto-dismiss with progress indicator

### Interactive Elements

**Buttons**:
- **Primary**: h-10, px-6, rounded-lg, font-medium
- **Secondary**: Same sizing, different treatment
- **Icon buttons**: w-10 h-10, rounded-lg, centered icon
- **Send button**: Circular (w-10 h-10 rounded-full)

**Avatars**:
- Standard: w-12 h-12 rounded-full
- Small: w-8 h-8 rounded-full
- Large (profile): w-24 h-24 rounded-full
- Fallback: Initials with generated background

**Badges**:
- Notification count: min-w-5 h-5, rounded-full, text-xs
- Status indicators: w-3 h-3, rounded-full (online/offline)

---

## Visual Rhythm & States

**Interaction States** (apply consistently):
- Hover: Subtle background shift
- Active: Slight scale or background intensification  
- Focus: Outline ring for keyboard navigation
- Disabled: Reduced opacity (opacity-50)

**Loading States**:
- Skeleton screens for message history
- Spinner (w-5 h-5) for operations
- Progress indicators for file uploads

**Empty States**:
- Centered icon + text combination
- Icon: 48x48px, muted
- Helpful message: text-base
- Optional CTA: "Start a new chat"

---

## Icons

**Library**: Heroicons (via CDN - outline for UI, solid for emphasis)

**Common Icons**:
- Navigation: ChatBubbleLeftRightIcon, UserGroupIcon, Cog6ToothIcon, ShieldCheckIcon
- Actions: PaperAirplaneIcon (send), PaperClipIcon (attach), MagnifyingGlassIcon (search)
- Status: CheckIcon, CheckCheckIcon (read receipt), LockClosedIcon
- Security: ShieldCheckIcon, KeyIcon, FingerPrintIcon

**Sizing**: 20x20px standard, 16x16px small, 24x24px emphasis

---

## Responsive Behavior

**Desktop (≥1024px)**:
- Three-column layout visible
- Sidebar: 64px fixed
- Chat list: 320px fixed  
- Active chat: Remaining space

**Tablet (768px - 1023px)**:
- Two-column: Chat list + Active chat
- Sidebar: Overlay when accessed

**Mobile (<768px)**:
- Single view at a time
- Bottom navigation bar
- Slide-in drawers for chat list
- Full-screen active chat

---

## Accessibility

- Keyboard navigation: Tab order follows visual hierarchy
- ARIA labels on icon-only buttons
- Focus indicators: 2px outline on all interactive elements
- Screen reader announcements for new messages
- High contrast mode support
- Minimum touch target: 44x44px on mobile

---

## Special Considerations

**Security Visualization**:
- Always-visible encryption indicator in chat header
- Subtle lock icon next to message timestamps
- Color-coded security states (avoid red/green only - use icons + text)

**Performance**:
- Virtual scrolling for long message histories
- Lazy load images and attachments
- Debounced search input (300ms)

**Trust Building**:
- Prominent "Quantum-Safe" messaging throughout
- Clear encryption status changes
- Educational tooltips on first use

---

This design creates a trustworthy, efficient chat experience that emphasizes security without creating anxiety. The clean, modern interface draws from proven patterns while highlighting the unique post-quantum encryption features.