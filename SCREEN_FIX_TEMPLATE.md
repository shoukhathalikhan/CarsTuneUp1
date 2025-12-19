# Screen Responsive Fix Template

## Step-by-Step Implementation for Each Screen

### 1. Add Imports
```javascript
import { wp, hp, rfs, getStatusBarHeight, getBottomSpace, spacing } from '../utils/responsive';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
```

### 2. Wrap Screen Content
```javascript
export default function MyScreen() {
  return (
    <SafeAreaWrapper edges={['top', 'bottom']} backgroundColor="#FFFFFF">
      {/* Screen content */}
    </SafeAreaWrapper>
  );
}
```

### 3. Update Header Styles
```javascript
header: {
  paddingTop: getStatusBarHeight() + spacing.md,
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.md,
  backgroundColor: '#1453b4',
},
headerTitle: {
  fontSize: rfs(20),
  fontWeight: '700',
  color: '#FFFFFF',
},
```

### 4. Update Card Styles
```javascript
card: {
  width: wp(90),
  marginHorizontal: wp(5),
  padding: spacing.md,
  borderRadius: wp(3),
  backgroundColor: '#FFFFFF',
},
cardImage: {
  width: '100%',
  aspectRatio: 16/9,
  borderRadius: wp(2),
},
```

### 5. Update Button Styles
```javascript
button: {
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  borderRadius: wp(3),
  backgroundColor: '#1453b4',
},
buttonText: {
  fontSize: rfs(16),
  fontWeight: '600',
  color: '#FFFFFF',
},
```

### 6. Update Bottom Navigation/Buttons
```javascript
bottomButton: {
  position: 'absolute',
  bottom: getBottomSpace() + spacing.md,
  left: spacing.md,
  right: spacing.md,
  paddingVertical: spacing.md,
  borderRadius: wp(3),
  backgroundColor: '#1453b4',
},
```

### 7. Update Text Styles
```javascript
title: {
  fontSize: rfs(24),
  fontWeight: '700',
  lineHeight: rfs(32),
},
subtitle: {
  fontSize: rfs(16),
  fontWeight: '500',
  lineHeight: rfs(22),
},
body: {
  fontSize: rfs(14),
  lineHeight: rfs(20),
},
caption: {
  fontSize: rfs(12),
  lineHeight: rfs(16),
},
```

### 8. Update Spacing
Replace all hardcoded values:
- `padding: 16` → `padding: spacing.md`
- `margin: 8` → `margin: spacing.sm`
- `gap: 12` → `gap: spacing.md`

### 9. Update Dimensions
Replace all fixed dimensions:
- `width: 100` → `width: wp(25)`
- `height: 50` → `height: hp(6)`
- `borderRadius: 8` → `borderRadius: wp(2)`

### 10. Test Checklist
- [ ] Content doesn't go under status bar
- [ ] Content doesn't go under navigation bar
- [ ] Back button visible and functional
- [ ] Bottom elements have safe area padding
- [ ] Cards scale properly on different screens
- [ ] Images maintain aspect ratio
- [ ] Text doesn't overflow
- [ ] Consistent spacing throughout
- [ ] Scrollable content works properly
- [ ] Buttons are properly sized and positioned

## Common Patterns

### ScrollView with SafeArea
```javascript
<SafeAreaWrapper edges={['top', 'bottom']}>
  <ScrollView
    contentContainerStyle={styles.scrollContent}
    showsVerticalScrollIndicator={false}
  >
    {/* Content */}
  </ScrollView>
</SafeAreaWrapper>
```

### FlatList with SafeArea
```javascript
<SafeAreaWrapper edges={['top']}>
  <FlatList
    data={items}
    renderItem={renderItem}
    contentContainerStyle={{
      paddingBottom: getBottomSpace() + spacing.md,
    }}
  />
</SafeAreaWrapper>
```

### Modal with SafeArea
```javascript
<Modal visible={visible} animationType="slide">
  <SafeAreaWrapper edges={['top', 'bottom']}>
    {/* Modal content */}
  </SafeAreaWrapper>
</Modal>
```

### KeyboardAvoidingView with SafeArea
```javascript
<SafeAreaWrapper edges={['top']}>
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={{ flex: 1 }}
  >
    {/* Content */}
  </KeyboardAvoidingView>
</SafeAreaWrapper>
```
