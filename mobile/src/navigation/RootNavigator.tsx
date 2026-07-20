import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { FeedScreen } from '../screens/feed/FeedScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { WalletScreen } from '../screens/wallet/WalletScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { ConversationsScreen } from '../screens/messenger/ConversationsScreen';
import { colors } from '../theme/tokens';

const AuthStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login">
        {({ navigation }) => <LoginScreen onNavigateRegister={() => navigation.navigate('Register')} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="Register">
        {({ navigation }) => (
          // doc 08 flow 1: verification alone doesn't issue tokens — the
          // user logs in with their new credentials afterward, same as any
          // freshly-verified account. No fake/empty-string auth state.
          <RegisterScreen onVerified={() => navigation.navigate('Login')} />
        )}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

/**
 * doc 09 IA: 5-tab bottom navigation with Compose as a center FAB action,
 * not a literal tab destination — simplified here to the tabs with real
 * screens built this stage (Feed/Wallet/Profile/Settings); Search/Messages
 * tabs are placeholders pending those screens (see MOBILE.md status).
 */
function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.wheat,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tabs.Screen name="Feed" component={FeedScreen} options={{ title: 'Стрічка' }} />
      <Tabs.Screen name="Messages" component={ConversationsScreen} options={{ title: 'Повідомлення' }} />
      <Tabs.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Сповіщення' }} />
      <Tabs.Screen name="Wallet" component={WalletScreen} options={{ title: 'Гаманець' }} />
      <Tabs.Screen name="Profile" component={ProfileScreen} options={{ title: 'Профіль' }} />
      <Tabs.Screen name="Settings" component={SettingsScreen} options={{ title: 'Налаштування' }} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const [onboardingDone, setOnboardingDone] = useState(false);

  if (status === 'checking') return <SplashScreen />;
  if (status === 'unauthenticated' && !onboardingDone) {
    return <OnboardingScreen onDone={() => setOnboardingDone(true)} />;
  }

  return (
    <NavigationContainer>
      {status === 'authenticated' ? <MainTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
