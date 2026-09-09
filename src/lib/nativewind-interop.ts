/**
 * NativeWind only maps `className` -> `style` automatically for React Native's
 * own components. Third-party components have to be registered, otherwise the
 * className is passed through and silently ignored (the styles just never
 * apply). Register them here and import this module once from the root layout.
 */
import { cssInterop } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';

cssInterop(LinearGradient, { className: 'style' });

export {};
