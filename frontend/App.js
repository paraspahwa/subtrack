import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, Platform } from "react-native";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from "@expo-google-fonts/inter";
import { Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black } from "@expo-google-fonts/poppins";

import LandingScreen  from "./src/screens/LandingScreen";
import AuthScreen     from "./src/screens/AuthScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import PricingScreen  from "./src/screens/PricingScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import { colors }     from "./src/theme";
import { insforge }   from "./src/api";
import { ThemeProvider } from "./src/ThemeContext";

const Stack = createNativeStackNavigator();

export default function App() {
	const [initialRoute, setInitialRoute] = useState(null);

	const [fontsLoaded] = useFonts({
		Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold,
		Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black,
	});

	// On web, fonts are served from the bundle and may 404 on static hosts.
	// Don't block rendering – show content immediately with system font fallbacks.
	const isReady = Platform.OS === "web" ? true : fontsLoaded;

	useEffect(() => {
		(async () => {
			try {
				const { data: sessionData } = await insforge.auth.getCurrentSession();
				setInitialRoute(sessionData?.session?.user ? "Dashboard" : "Landing");
			} catch {
				setInitialRoute("Landing");
			}
		})();
	}, []);

	if (!isReady || !initialRoute) {
		return (
			<View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
				<ActivityIndicator color={colors.primary} size="large" />
			</View>
		);
	}

	return (
		<ThemeProvider>
		<NavigationContainer>
			<StatusBar style="dark" />
			<Stack.Navigator
				initialRouteName={initialRoute}
				screenOptions={{ headerShown: false, animation: "slide_from_right", contentStyle: { backgroundColor: colors.bg } }}
			>
				<Stack.Screen name="Landing"   component={LandingScreen}   />
				<Stack.Screen name="Auth"      component={AuthScreen}      />
				<Stack.Screen name="Dashboard" component={DashboardScreen} />
				<Stack.Screen name="Pricing"   component={PricingScreen}   />
				<Stack.Screen name="Settings"  component={SettingsScreen}  />
			</Stack.Navigator>
		</NavigationContainer>
		</ThemeProvider>
	);
}
