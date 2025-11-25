# PasswordIndicator Component

A beautiful and robust password strength indicator with real-time validation feedback.

## Features

✅ **Real-time strength calculation** - Updates as user types
✅ **Visual strength meter** - Color-coded progress bar (Red → Orange → Yellow → Blue → Green)
✅ **Requirement checklist** - Shows which password requirements are met
✅ **Customizable** - Configurable minimum length and styling
✅ **Accessible** - Clear visual feedback with icons and colors

## Props

```typescript
interface PasswordIndicatorProps {
  password: string;              // The password to analyze
  showRequirements?: boolean;    // Show/hide requirements list (default: true)
  minLength?: number;            // Minimum password length (default: 8)
  className?: string;            // Additional CSS classes
}
```

## Password Strength Levels

| Score | Label     | Color  | Requirements                                    |
|-------|-----------|--------|-------------------------------------------------|
| 0     | Too weak  | Red    | Less than minimum length                        |
| 1     | Weak      | Orange | Minimum length only                             |
| 2     | Fair      | Yellow | Length + uppercase/lowercase                    |
| 3     | Good      | Blue   | Length + mixed case + numbers                   |
| 4     | Strong    | Green  | Length + mixed case + numbers + special chars   |

## Password Requirements

1. ✅ At least 8 characters (customizable)
2. ✅ Contains uppercase letter (A-Z)
3. ✅ Contains lowercase letter (a-z)
4. ✅ Contains number (0-9)
5. ✅ Contains special character (!@#$%^&*)

## Usage Examples

### Basic Usage

```tsx
import PasswordIndicator from "@/components/forms/input/PasswordIndicator";

function MyForm() {
  const [password, setPassword] = useState("");

  return (
    <div>
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
      />
      <PasswordIndicator password={password} />
    </div>
  );
}
```

### Without Requirements List

```tsx
<PasswordIndicator 
  password={password} 
  showRequirements={false} 
/>
```

### Custom Minimum Length

```tsx
<PasswordIndicator 
  password={password} 
  minLength={12} 
/>
```

### With Custom Styling

```tsx
<PasswordIndicator 
  password={password} 
  className="mt-4 p-3 bg-gray-50 rounded-lg" 
/>
```

## Exported Utilities

### `calculatePasswordStrength(password: string, minLength: number)`

Returns the password strength score and metadata:

```typescript
{
  score: 0 | 1 | 2 | 3 | 4,
  label: string,
  color: string,
  percentage: number
}
```

### `getPasswordRequirements(password: string, minLength: number)`

Returns array of password requirements with their status:

```typescript
[
  { label: "At least 8 characters", met: true },
  { label: "Contains uppercase letter", met: false },
  // ...
]
```

## Integration with Forms

See `changePassword.tsx` for a complete example of integrating the password indicator with:
- Form validation
- Real-time feedback
- Submit button state management
- Password confirmation matching
